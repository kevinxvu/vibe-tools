package genai

import (
	"context"
	"fmt"
	"io"
	"mime"
	"path/filepath"
	"strings"

	llm "github.com/kevinxvu/vibe-tools/pkg/llm"
	"github.com/kevinxvu/vibe-tools/pkg/logging"
	"go.uber.org/zap"
	googlegenai "google.golang.org/genai"
)

// TranscribeAudio transcribes an audio file using the multimodal Gemini model.
// Audio is sent as inline data; the model transcribes it and returns the text.
func (s *Service) TranscribeAudio(ctx context.Context, req llm.AudioRequest) (*llm.AudioResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "genai"))

	if req.File == nil || req.FileName == "" {
		return nil, ErrNoFile
	}

	audioBytes, err := io.ReadAll(req.File)
	if err != nil {
		logger.Error("failed to read audio file", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	mimeType := detectMIMEType(req.FileName)
	model := s.getTextModel(nil)

	prompt := "Transcribe the following audio content. Return only the transcribed text, nothing else."
	if req.Language != nil && *req.Language != "" {
		prompt = fmt.Sprintf("Transcribe the following audio content in %s. Return only the transcribed text, nothing else.", *req.Language)
	}
	if req.Prompt != nil && *req.Prompt != "" {
		prompt = *req.Prompt
	}

	logger.Info("transcribing audio",
		zap.String("model", model),
		zap.String("file_name", req.FileName),
		zap.String("mime_type", mimeType),
	)

	contents := []*googlegenai.Content{
		googlegenai.NewContentFromParts([]*googlegenai.Part{
			googlegenai.NewPartFromBytes(audioBytes, mimeType),
			googlegenai.NewPartFromText(prompt),
		}, googlegenai.RoleUser),
	}

	resp, err := s.client.Models.GenerateContent(ctx, model, contents, nil)
	if err != nil {
		logger.Error("audio transcription failed", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	text := strings.TrimSpace(resp.Text())
	logger.Info("audio transcription succeeded", zap.Int("text_length", len(text)))

	return &llm.AudioResponse{Text: text}, nil
}

// TranscribeAudioWithPrompt transcribes audio using a custom system and user prompt,
// returning a full ChatResponse including usage metadata.
func (s *Service) TranscribeAudioWithPrompt(ctx context.Context, req llm.AudioWithPromptRequest) (*llm.ChatResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "genai"))

	if req.File == nil || req.FileName == "" {
		return nil, ErrNoFile
	}

	audioBytes, err := io.ReadAll(req.File)
	if err != nil {
		logger.Error("failed to read audio file", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	mimeType := detectMIMEType(req.FileName)
	model := s.getTextModel(nil)

	config := &googlegenai.GenerateContentConfig{}
	if req.SystemPrompt != nil && *req.SystemPrompt != "" {
		config.SystemInstruction = googlegenai.NewContentFromText(*req.SystemPrompt, googlegenai.RoleUser)
	}

	contents := []*googlegenai.Content{
		googlegenai.NewContentFromParts([]*googlegenai.Part{
			googlegenai.NewPartFromBytes(audioBytes, mimeType),
			googlegenai.NewPartFromText(req.UserPrompt),
		}, googlegenai.RoleUser),
	}

	logger.Info("transcribing audio with prompt",
		zap.String("model", model),
		zap.String("file_name", req.FileName),
	)

	resp, err := s.client.Models.GenerateContent(ctx, model, contents, config)
	if err != nil {
		logger.Error("audio transcription with prompt failed", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	chatResp := &llm.ChatResponse{
		Content: strings.TrimSpace(resp.Text()),
		Model:   model,
	}

	if resp.UsageMetadata != nil {
		chatResp.Usage = llm.TokenUsage{
			PromptTokens:     int(resp.UsageMetadata.PromptTokenCount),
			CompletionTokens: int(resp.UsageMetadata.CandidatesTokenCount),
			TotalTokens:      int(resp.UsageMetadata.TotalTokenCount),
		}
	}

	return chatResp, nil
}

// TranslateAudio translates audio content to English using the multimodal Gemini model.
func (s *Service) TranslateAudio(ctx context.Context, req llm.AudioRequest) (*llm.AudioResponse, error) {
	logger := logging.FromContext(ctx).With(zap.String("type", "genai"))

	if req.File == nil || req.FileName == "" {
		return nil, ErrNoFile
	}

	audioBytes, err := io.ReadAll(req.File)
	if err != nil {
		logger.Error("failed to read audio file", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	mimeType := detectMIMEType(req.FileName)
	model := s.getTextModel(nil)

	prompt := "Translate the following audio content to English. Return only the translated text, nothing else."

	logger.Info("translating audio",
		zap.String("model", model),
		zap.String("file_name", req.FileName),
	)

	contents := []*googlegenai.Content{
		googlegenai.NewContentFromParts([]*googlegenai.Part{
			googlegenai.NewPartFromBytes(audioBytes, mimeType),
			googlegenai.NewPartFromText(prompt),
		}, googlegenai.RoleUser),
	}

	resp, err := s.client.Models.GenerateContent(ctx, model, contents, nil)
	if err != nil {
		logger.Error("audio translation failed", zap.Error(err))
		return nil, ErrAPIError.SetInternal(err)
	}

	text := strings.TrimSpace(resp.Text())
	logger.Info("audio translation succeeded", zap.Int("text_length", len(text)))

	return &llm.AudioResponse{Text: text}, nil
}

// detectMIMEType infers the audio MIME type from the file extension.
func detectMIMEType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	if t := mime.TypeByExtension(ext); t != "" {
		return t
	}
	// Fallback map for common audio formats
	switch ext {
	case ".mp3":
		return "audio/mpeg"
	case ".mp4":
		return "audio/mp4"
	case ".wav":
		return "audio/wav"
	case ".ogg":
		return "audio/ogg"
	case ".flac":
		return "audio/flac"
	case ".m4a":
		return "audio/mp4"
	case ".webm":
		return "audio/webm"
	default:
		return "audio/mpeg"
	}
}
