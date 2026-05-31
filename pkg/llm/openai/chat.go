package openai

import (
	"context"
	"sync/atomic"

	llm "github.com/kevinxvu/vibe-tools/pkg/llm"
	"github.com/kevinxvu/vibe-tools/pkg/logging"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/packages/param"
	"go.uber.org/zap"
)

// ChatCompletion performs a chat completion request
func (s *Service) ChatCompletion(ctx context.Context, req llm.ChatRequest) (*llm.ChatResponse, error) {
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

	// Build parameters
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
	logger.Info("creating chat completion",
		zap.String("model", model),
		zap.Int("message_count", len(req.Messages)),
	)

	// Call OpenAI API
	response, err := s.client.Chat.Completions.New(ctx, params)
	if err != nil {
		logger.Error("chat completion failed", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	// Extract response
	if len(response.Choices) == 0 {
		logger.Error("no choices in response")
		return nil, ErrAPIError.SetInternal(nil)
	}

	choice := response.Choices[0]
	content := choice.Message.Content

	// Build response
	chatResp := &llm.ChatResponse{
		ID:           response.ID,
		Content:      content,
		Model:        string(response.Model),
		FinishReason: string(choice.FinishReason),
		CreatedAt:    response.Created,
		Usage: llm.TokenUsage{
			PromptTokens:     int(response.Usage.PromptTokens),
			CompletionTokens: int(response.Usage.CompletionTokens),
			TotalTokens:      int(response.Usage.TotalTokens),
		},
	}

	// Log response
	logger.Info("chat completion succeeded",
		zap.String("id", chatResp.ID),
		zap.Int("prompt_tokens", chatResp.Usage.PromptTokens),
		zap.Int("completion_tokens", chatResp.Usage.CompletionTokens),
		zap.Int("total_tokens", chatResp.Usage.TotalTokens),
	)

	// Track cumulative token usage
	if chatResp.Usage.TotalTokens > 0 {
		atomic.AddInt64(&s.totalTokensUsed, int64(chatResp.Usage.TotalTokens))
	}

	return chatResp, nil
}
