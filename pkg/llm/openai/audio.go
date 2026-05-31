package openai

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	llm "github.com/kevinxvu/vibe-tools/pkg/llm"
	"github.com/kevinxvu/vibe-tools/pkg/logging"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/packages/param"
	"go.uber.org/zap"
)

// TranscribeAudio transcribes audio using the configured audio model.
// Whisper models use the dedicated /audio/transcriptions endpoint.
func (s *Service) TranscribeAudio(ctx context.Context, req llm.AudioRequest) (*llm.AudioResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "openai"))

	// Validate request
	if req.File == nil {
		return nil, ErrNoFile
	}
	if req.FileName == "" {
		return nil, ErrNoFile.SetInternal(nil)
	}

	model := s.getAudioModel(nil)

	logger.Info("transcribing audio",
		zap.String("model", model),
		zap.String("file_name", req.FileName),
		zap.Any("language", req.Language),
	)

	// Whisper model: use the dedicated /audio/transcriptions endpoint
	if strings.HasPrefix(strings.ToLower(model), "whisper") {
		params := openai.AudioTranscriptionNewParams{
			File:  req.File,
			Model: openai.AudioModel(model),
		}
		if req.Language != nil && *req.Language != "" {
			params.Language = param.NewOpt(*req.Language)
		}
		if req.Prompt != nil && *req.Prompt != "" {
			params.Prompt = param.NewOpt(*req.Prompt)
		}
		if req.Format != nil && *req.Format != "" {
			params.ResponseFormat = openai.AudioResponseFormat(*req.Format)
		}

		transcription, err := s.client.Audio.Transcriptions.New(ctx, params)
		if err != nil {
			logger.Error("audio transcription failed", zap.Error(err))
			return nil, ErrAPIError.SetInternal(err)
		}
		logger.Info("audio transcription succeeded", zap.Int("text_length", len(transcription.Text)))
		return &llm.AudioResponse{Text: transcription.Text}, nil
	}

	// Non-Whisper model: pass audio inline via chat completion
	audioBytes, err := io.ReadAll(req.File)
	if err != nil {
		logger.Error("failed to read audio file", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	promptText := "Transcribe the audio content. Return only the transcribed text, nothing else."
	if req.Language != nil && *req.Language != "" {
		promptText = fmt.Sprintf("Transcribe the audio content in %s. Return only the transcribed text, nothing else.", *req.Language)
	}

	chatParams := openai.ChatCompletionNewParams{
		Model: openai.ChatModel(model),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage([]openai.ChatCompletionContentPartUnionParam{
				openai.InputAudioContentPart(openai.ChatCompletionContentPartInputAudioInputAudioParam{
					Data:   base64.StdEncoding.EncodeToString(audioBytes),
					Format: audioFormatFromFilename(req.FileName),
				}),
				openai.TextContentPart(promptText),
			}),
		},
	}

	response, err := s.client.Chat.Completions.New(ctx, chatParams)
	if err != nil {
		logger.Error("audio transcription via chat completion failed", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}
	if len(response.Choices) == 0 {
		logger.Error("no choices in chat completion response")
		return nil, ErrAPIError.SetInternal(nil)
	}

	text := response.Choices[0].Message.Content
	logger.Info("audio transcription succeeded",
		zap.String("id", response.ID),
		zap.Int("text_length", len(text)),
		zap.Int("prompt_tokens", int(response.Usage.PromptTokens)),
		zap.Int("completion_tokens", int(response.Usage.CompletionTokens)),
		zap.Int("total_tokens", int(response.Usage.TotalTokens)),
	)
	return &llm.AudioResponse{Text: text}, nil
}

// TranscribeAudioWithPrompt sends an audio file together with custom system/user
// prompts to the chat completions endpoint. This works with any model that
// accepts inline audio (e.g. gemini-2.5-flash, gpt-4o-audio-preview).
func (s *Service) TranscribeAudioWithPrompt(ctx context.Context, req llm.AudioWithPromptRequest) (*llm.ChatResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "openai"))

	if req.File == nil {
		return nil, ErrNoFile
	}
	if req.FileName == "" {
		return nil, ErrNoFile.SetInternal(nil)
	}

	model := s.getAudioModel(nil)

	logger.Info("transcribing audio with prompt",
		zap.String("model", model),
		zap.String("file_name", req.FileName),
	)

	audioBytes, err := io.ReadAll(req.File)
	if err != nil {
		logger.Error("failed to read audio file", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	var messages []openai.ChatCompletionMessageParamUnion

	if req.SystemPrompt != nil && *req.SystemPrompt != "" {
		messages = append(messages, openai.SystemMessage(*req.SystemPrompt))
	}

	messages = append(messages, openai.UserMessage([]openai.ChatCompletionContentPartUnionParam{
		openai.InputAudioContentPart(openai.ChatCompletionContentPartInputAudioInputAudioParam{
			Data:   base64.StdEncoding.EncodeToString(audioBytes),
			Format: audioFormatFromFilename(req.FileName),
		}),
		openai.TextContentPart(req.UserPrompt),
	}))

	params := openai.ChatCompletionNewParams{
		Model:    openai.ChatModel(model),
		Messages: messages,
	}

	response, err := s.client.Chat.Completions.New(ctx, params)
	if err != nil {
		logger.Error("TranscribeAudioWithPrompt failed", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}
	if len(response.Choices) == 0 {
		logger.Error("no choices in response")
		return nil, ErrAPIError.SetInternal(nil)
	}

	content := response.Choices[0].Message.Content
	logger.Info("TranscribeAudioWithPrompt succeeded",
		zap.String("id", response.ID),
		zap.Int("text_length", len(content)),
		zap.Int("prompt_tokens", int(response.Usage.PromptTokens)),
		zap.Int("completion_tokens", int(response.Usage.CompletionTokens)),
		zap.Int("total_tokens", int(response.Usage.TotalTokens)),
	)

	return &llm.ChatResponse{
		ID:           response.ID,
		Content:      content,
		Model:        string(response.Model),
		FinishReason: string(response.Choices[0].FinishReason),
		CreatedAt:    response.Created,
		Usage: llm.TokenUsage{
			PromptTokens:     int(response.Usage.PromptTokens),
			CompletionTokens: int(response.Usage.CompletionTokens),
			TotalTokens:      int(response.Usage.TotalTokens),
		},
	}, nil
}

// audioFormatFromFilename infers the audio format accepted by InputAudioContentPart
// from the file extension. Only "wav" and "mp3" are supported; everything else
// falls back to "mp3".
func audioFormatFromFilename(filename string) string {
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".wav":
		return "wav"
	default:
		return "mp3"
	}
}

// TranslateAudio translates audio to English using the Whisper model
func (s *Service) TranslateAudio(ctx context.Context, req llm.AudioRequest) (*llm.AudioResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "openai"))

	// Validate request
	if req.File == nil {
		return nil, ErrNoFile
	}

	if req.FileName == "" {
		return nil, ErrNoFile.SetInternal(nil)
	}

	// Build parameters
	params := openai.AudioTranslationNewParams{
		File:  req.File,
		Model: openai.AudioModel(s.getAudioModel(nil)),
	}

	// Apply optional parameters
	if req.Prompt != nil && *req.Prompt != "" {
		params.Prompt = param.NewOpt(*req.Prompt)
	}

	if req.Format != nil && *req.Format != "" {
		params.ResponseFormat = openai.AudioTranslationNewParamsResponseFormat(*req.Format)
	}

	// Log request
	logger.Info("translating audio",
		zap.String("file_name", req.FileName),
	)

	// Call OpenAI API
	translation, err := s.client.Audio.Translations.New(ctx, params)
	if err != nil {
		logger.Error("audio translation failed", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	// Build response
	audioResp := &llm.AudioResponse{
		Text:     translation.Text,
		Language: "en", // Translations are always to English
	}

	// Log response
	logger.Info("audio translation succeeded",
		zap.Int("text_length", len(audioResp.Text)),
	)

	return audioResp, nil
}
