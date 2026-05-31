package openai

import (
	"context"
	"strings"
	"sync/atomic"

	llm "github.com/kevinxvu/vibe-tools/pkg/llm"
	"github.com/kevinxvu/vibe-tools/pkg/logging"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/packages/param"
	"go.uber.org/zap"
)

// ChatCompletionStream performs a streaming chat completion request
// The handler is called for each chunk, and a complete ChatResponse is returned at the end
func (s *Service) ChatCompletionStream(ctx context.Context, req llm.ChatRequest, handler llm.StreamHandler) (*llm.ChatResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "openai"))

	// Validate request
	if len(req.Messages) == 0 && req.SystemPrompt == nil {
		return nil, ErrNoMessages
	}

	// Check global token budget
	if s.cfg.LimitTokenUsage > 0 && atomic.LoadInt64(&s.totalTokensUsed) >= s.cfg.LimitTokenUsage {
		return nil, ErrTokenBudgetExceeded
	}

	// Check input token limit (system prompt excluded — only user messages counted)
	if s.cfg.MaxInputTokens > 0 {
		if estimated := estimateTokens(req.Messages, nil); estimated > s.cfg.MaxInputTokens {
			return nil, ErrInputTooLong
		}
	}

	// Build messages
	messages, err := s.buildMessages(req.Messages, req.SystemPrompt)
	if err != nil {
		return nil, err
	}

	// Determine model to use
	model := s.getTextModel(req.Model)

	// Build parameters with streaming enabled
	params := openai.ChatCompletionNewParams{
		Model:    openai.ChatModel(model),
		Messages: messages,
	}

	// Apply optional parameters
	if s.cfg.MaxOutputTokens > 0 {
		outputCap := int64(s.cfg.MaxOutputTokens)
		if req.MaxTokens != nil && *req.MaxTokens < outputCap {
			outputCap = *req.MaxTokens
		}
		params.MaxTokens = param.NewOpt(outputCap)
	} else if req.MaxTokens != nil {
		params.MaxTokens = param.NewOpt(*req.MaxTokens)
	}

	if req.Temperature != nil {
		params.Temperature = param.NewOpt(*req.Temperature)
	}

	if req.TopP != nil {
		params.TopP = param.NewOpt(*req.TopP)
	}

	// Log request
	logger.Info("creating streaming chat completion",
		zap.String("model", model),
		zap.Int("message_count", len(req.Messages)),
	)

	// Create streaming request
	stream := s.client.Chat.Completions.NewStreaming(ctx, params)

	// Accumulate response content
	var contentBuilder strings.Builder
	var responseID string
	var responseModel string
	var finishReason string
	var createdAt int64
	chunkCount := 0

	// Process stream
	for stream.Next() {
		chunk := stream.Current()

		// Store metadata from first chunk
		if chunkCount == 0 {
			responseID = chunk.ID
			responseModel = string(chunk.Model)
			createdAt = chunk.Created
		}

		// Process choices
		if len(chunk.Choices) > 0 {
			choice := chunk.Choices[0]

			// Accumulate content
			if choice.Delta.Content != "" {
				contentBuilder.WriteString(choice.Delta.Content)

				// Call handler with chunk
				if handler != nil {
					if err := handler(choice.Delta.Content, false); err != nil {
						logger.Error("stream handler error", zap.Error(err))
						return nil, ErrStreamingFailed.SetInternal(err)
					}
				}
			}

			// Capture finish reason
			if choice.FinishReason != "" {
				finishReason = string(choice.FinishReason)
			}
		}

		chunkCount++
	}

	// Check for stream errors
	if err := stream.Err(); err != nil {
		logger.Error("streaming failed", zap.Error(err))
		return nil, ErrStreamingFailed.SetInternal(err)
	}

	// Call handler one final time with done=true
	if handler != nil {
		if err := handler("", true); err != nil {
			logger.Error("stream handler final call error", zap.Error(err))
			return nil, ErrStreamingFailed.SetInternal(err)
		}
	}

	// Get accumulated response for usage information
	// Note: Usage information may not be available in streaming mode

	// Build response with usage information
	chatResp := &llm.ChatResponse{
		ID:           responseID,
		Content:      contentBuilder.String(),
		Model:        responseModel,
		FinishReason: finishReason,
		CreatedAt:    createdAt,
		Usage: llm.TokenUsage{
			PromptTokens:     0, // Not typically available in streaming
			CompletionTokens: 0,
			TotalTokens:      0,
		},
	}

	// Log response
	logger.Info("streaming chat completion succeeded",
		zap.String("id", chatResp.ID),
		zap.Int("chunks", chunkCount),
		zap.Int("content_length", len(chatResp.Content)),
		zap.Int("prompt_tokens", chatResp.Usage.PromptTokens),
		zap.Int("completion_tokens", chatResp.Usage.CompletionTokens),
		zap.Int("total_tokens", chatResp.Usage.TotalTokens),
	)

	// Track cumulative token usage via estimation (streaming API does not return usage stats)
	estimatedTokens := estimateTokens(req.Messages, req.SystemPrompt) + estimateContentTokens(chatResp.Content)
	if estimatedTokens > 0 {
		atomic.AddInt64(&s.totalTokensUsed, int64(estimatedTokens))
	}

	return chatResp, nil
}
