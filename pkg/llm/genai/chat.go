package genai

import (
	"context"
	"strings"
	"sync/atomic"

	llm "github.com/kevinxvu/vibe-tools/pkg/llm"
	"github.com/kevinxvu/vibe-tools/pkg/logging"
	"go.uber.org/zap"
	googlegenai "google.golang.org/genai"
)

// ChatCompletion performs a chat completion request using Google GenAI.
func (s *Service) ChatCompletion(ctx context.Context, req llm.ChatRequest) (*llm.ChatResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "genai"))

	if len(req.Messages) == 0 && req.SystemPrompt == nil {
		return nil, ErrNoMessages
	}

	if s.cfg.LimitTokenUsage > 0 && atomic.LoadInt64(&s.totalTokensUsed) >= s.cfg.LimitTokenUsage {
		return nil, ErrTokenBudgetExceeded
	}

	if s.cfg.MaxInputTokens > 0 {
		if estimated := estimateTokens(req.Messages, req.SystemPrompt); estimated > s.cfg.MaxInputTokens {
			return nil, ErrInputTooLong
		}
	}

	model := s.getTextModel(req.Model)
	contents, config := s.buildRequest(req)

	logger.Info("creating chat completion",
		zap.String("model", model),
		zap.Int("message_count", len(req.Messages)),
	)

	var resp *googlegenai.GenerateContentResponse
	err := s.withRetry(func() error {
		var e error
		resp, e = s.client.Models.GenerateContent(ctx, model, contents, config)
		return e
	})
	if err != nil {
		logger.Error("chat completion failed", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	text := resp.Text()

	chatResp := &llm.ChatResponse{
		Content: text,
		Model:   model,
	}

	if resp.UsageMetadata != nil {
		chatResp.Usage = llm.TokenUsage{
			PromptTokens:     int(resp.UsageMetadata.PromptTokenCount),
			CompletionTokens: int(resp.UsageMetadata.CandidatesTokenCount),
			TotalTokens:      int(resp.UsageMetadata.TotalTokenCount),
		}
	}

	if len(resp.Candidates) > 0 {
		chatResp.FinishReason = string(resp.Candidates[0].FinishReason)
	}

	logger.Info("chat completion succeeded",
		zap.Int("prompt_tokens", chatResp.Usage.PromptTokens),
		zap.Int("completion_tokens", chatResp.Usage.CompletionTokens),
		zap.Int("total_tokens", chatResp.Usage.TotalTokens),
	)

	if chatResp.Usage.TotalTokens > 0 {
		atomic.AddInt64(&s.totalTokensUsed, int64(chatResp.Usage.TotalTokens))
	}

	return chatResp, nil
}

// ChatCompletionStream performs a streaming chat completion request using Google GenAI.
func (s *Service) ChatCompletionStream(ctx context.Context, req llm.ChatRequest, handler llm.StreamHandler) (*llm.ChatResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "genai"))

	if len(req.Messages) == 0 && req.SystemPrompt == nil {
		return nil, ErrNoMessages
	}

	if s.cfg.LimitTokenUsage > 0 && atomic.LoadInt64(&s.totalTokensUsed) >= s.cfg.LimitTokenUsage {
		return nil, ErrTokenBudgetExceeded
	}

	if s.cfg.MaxInputTokens > 0 {
		if estimated := estimateTokens(req.Messages, req.SystemPrompt); estimated > s.cfg.MaxInputTokens {
			return nil, ErrInputTooLong
		}
	}

	model := s.getTextModel(req.Model)
	contents, config := s.buildRequest(req)

	logger.Info("creating streaming chat completion",
		zap.String("model", model),
		zap.Int("message_count", len(req.Messages)),
	)

	var contentBuilder strings.Builder
	var finishReason string
	var usage llm.TokenUsage

	for resp, err := range s.client.Models.GenerateContentStream(ctx, model, contents, config) {
		if err != nil {
			logger.Error("stream error", zap.Error(err))
			return nil, ErrStreamingFailed.SetInternal(err)
		}

		chunk := resp.Text()
		if chunk != "" {
			contentBuilder.WriteString(chunk)
			if handler != nil {
				if handlerErr := handler(chunk, false); handlerErr != nil {
					logger.Error("stream handler error", zap.Error(handlerErr))
					return nil, ErrStreamingFailed.SetInternal(handlerErr)
				}
			}
		}

		if len(resp.Candidates) > 0 && resp.Candidates[0].FinishReason != "" {
			finishReason = string(resp.Candidates[0].FinishReason)
		}

		if resp.UsageMetadata != nil && resp.UsageMetadata.TotalTokenCount > 0 {
			usage = llm.TokenUsage{
				PromptTokens:     int(resp.UsageMetadata.PromptTokenCount),
				CompletionTokens: int(resp.UsageMetadata.CandidatesTokenCount),
				TotalTokens:      int(resp.UsageMetadata.TotalTokenCount),
			}
		}
	}

	// Signal completion to handler
	if handler != nil {
		_ = handler("", true)
	}

	chatResp := &llm.ChatResponse{
		Content:      contentBuilder.String(),
		Model:        model,
		FinishReason: finishReason,
		Usage:        usage,
	}

	logger.Info("streaming chat completion succeeded",
		zap.Int("total_tokens", chatResp.Usage.TotalTokens),
	)

	if chatResp.Usage.TotalTokens > 0 {
		atomic.AddInt64(&s.totalTokensUsed, int64(chatResp.Usage.TotalTokens))
	}

	return chatResp, nil
}

// buildRequest converts a llm.ChatRequest into GenAI contents and config.
func (s *Service) buildRequest(req llm.ChatRequest) ([]*googlegenai.Content, *googlegenai.GenerateContentConfig) {
	config := &googlegenai.GenerateContentConfig{}

	// System instruction
	if req.SystemPrompt != nil && *req.SystemPrompt != "" {
		config.SystemInstruction = googlegenai.NewContentFromText(*req.SystemPrompt, googlegenai.RoleUser)
	}

	// Generation parameters
	if s.cfg.MaxOutputTokens > 0 {
		outputCap := int32(s.cfg.MaxOutputTokens)
		if req.MaxTokens != nil && int32(*req.MaxTokens) < outputCap {
			outputCap = int32(*req.MaxTokens)
		}
		config.MaxOutputTokens = outputCap
	} else if req.MaxTokens != nil {
		config.MaxOutputTokens = int32(*req.MaxTokens)
	}

	if req.Temperature != nil {
		temp := float32(*req.Temperature)
		config.Temperature = &temp
	}

	if req.TopP != nil {
		topP := float32(*req.TopP)
		config.TopP = &topP
	}

	if len(req.Stop) > 0 {
		config.StopSequences = req.Stop
	}

	// Build contents from messages
	var contents []*googlegenai.Content
	for _, msg := range req.Messages {
		role := toGenAIRole(msg.Role)

		if len(msg.ImageURLs) > 0 {
			// Multimodal: text + images
			parts := make([]*googlegenai.Part, 0, 1+len(msg.ImageURLs))
			if msg.Content != "" {
				parts = append(parts, googlegenai.NewPartFromText(msg.Content))
			}
			for _, imageURL := range msg.ImageURLs {
				parts = append(parts, newImagePart(imageURL))
			}
			contents = append(contents, googlegenai.NewContentFromParts(parts, role))
		} else {
			contents = append(contents, googlegenai.NewContentFromText(msg.Content, role))
		}
	}

	return contents, config
}

// toGenAIRole maps common message roles to GenAI roles.
// GenAI uses "user" and "model" (not "assistant").
func toGenAIRole(role string) googlegenai.Role {
	switch role {
	case "assistant", "model":
		return googlegenai.RoleModel
	default:
		return googlegenai.RoleUser
	}
}
