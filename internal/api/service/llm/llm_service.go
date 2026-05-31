package llm

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/kevinxvu/vibe-tools/internal/model"
	llmpkg "github.com/kevinxvu/vibe-tools/pkg/llm"
	"github.com/kevinxvu/vibe-tools/pkg/logging"
	"github.com/kevinxvu/vibe-tools/pkg/server/apperr"
)

// New creates new llm application service with the given Provider.
// The active provider is selected at startup via llm.Factory.
func New(p llmpkg.Provider) *LLMService {
	return &LLMService{llm: p}
}

// LLMService represents llm application service
type LLMService struct {
	llm llmpkg.Provider
}

// Service represents llm application interface
type Service interface {
	ChatToArticle(context.Context, *model.AuthUser, ChatToArticleData) (*ChatToArticleResp, error)
	AiTranscriber(context.Context, *model.AuthUser, AiTranscriberData) (*AiTranscriberResp, error)
	AiTranslator(context.Context, *model.AuthUser, AiTranslatorData) (*AiTranslatorResp, error)
	EmailGenerator(context.Context, *model.AuthUser, EmailGeneratorData) (*EmailGeneratorResp, error)
	MarkdownFormat(context.Context, *model.AuthUser, MarkdownFormatData) (*MarkdownFormatResp, error)
	Ocr(context.Context, *model.AuthUser, OcrData) (*OcrResp, error)
	SmartChatReply(context.Context, *model.AuthUser, SmartChatReplyData) (*SmartChatReplyResp, error)
	TextSummarizer(context.Context, *model.AuthUser, TextSummarizerData) (*TextSummarizerResp, error)
}

// ChatToArticle converts a raw chat log into a structured technical article
func (s *LLMService) ChatToArticle(ctx context.Context, authUsr *model.AuthUser, data ChatToArticleData) (*ChatToArticleResp, error) {
	langLabel := langLabels[data.TargetLang]

	temperature := 0.3
	systemPrompt := fmt.Sprintf(`You are an expert technical editor and content strategist. 
Your task is to take a raw, unstructured chat log between a User and an AI Assistant and convert it into a high-quality, standalone Technical Article or Blog Post.

Rules:
1. Synthesize Knowledge: Extract the core problem and the final, correct solution. 
2. Filter Noise: Ignore pleasantries ("Hello", "Thanks"), intermediate wrong attempts, and hallucinations that were later corrected in the chat.
3. Structure:
   - Title (H1): Catchy and relevant.
   - Introduction: Briefly state the problem/context.
   - Body: Use H2/H3 headers, bullet points, and steps.
   - Code: Format code blocks properly.
   - Conclusion: A brief wrap-up.
4. Format: Output ONLY raw Markdown.
5. Tone: Professional, instructional, and concise.
6. DIAGRAMS & FLOWS: Whenever the article needs to illustrate a flow, architecture, sequence, or process, represent it visually using ONE of the following two formats:
   a. ASCII Console Diagram (for simple box/arrow architecture diagrams):
      Use box-drawing characters and arrows inside a fenced code block (no language tag or 'console' tag). Example:
      `+"```"+`
      ┌─────────────┐        ┌─────────────┐
      │   CPU 1     │        │   CPU 2     │
      │  ┌────────┐ │        │ ┌────────┐  │
      │  │ Cache  │◄├────────┤►│ Cache  │  │
      │  └────────┘ │        │ └────────┘  │
      └──────┬──────┘        └──────┬──────┘
             │                     │
             ▼                     ▼
      ┌─────────────┐        ┌─────────────┐
      │  Thread 1   │        │  Thread 2   │
      └─────────────┘        └─────────────┘
      `+"```"+`
   b. Mermaid.js Diagram (for flowcharts, sequences, state machines, class diagrams):
      Use a fenced code block with the 'mermaid' language tag. Example:
      `+"```"+`mermaid
      flowchart TD
          A[Client] --> B[API Gateway]
          B --> C[Service A]
          B --> D[Service B]
      `+"```"+`
   Choose the format that best fits the complexity: ASCII for simple architecture overviews, Mermaid for multi-step flows or sequences.
7. LANGUAGE REQUIREMENT: 
   - Detect the language of the input chat automatically.
   - Regardless of the input language, the FINAL OUTPUT MUST BE WRITTEN IN **%s**.
   - Translate concepts naturally, do not just word-for-word translate. Keep code keywords (like function names) in English where appropriate for technical accuracy.`, langLabel)

	resp, err := s.llm.ChatCompletion(ctx, llmpkg.ChatRequest{
		SystemPrompt: &systemPrompt,
		Temperature:  &temperature,
		Messages: []llmpkg.Message{
			{Role: "user", Content: fmt.Sprintf("Here is the chat log to convert:\n\n%s", data.ChatLog)},
		},
	})
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("ChatToArticle failed: %v", err)
		return nil, wrapErr(err, ErrChatFailed)
	}

	return &ChatToArticleResp{Content: resp.Content}, nil
}

// AiTranscriber transcribes an audio/video file and translates the result to the target language
func (s *LLMService) AiTranscriber(ctx context.Context, authUsr *model.AuthUser, data AiTranscriberData) (*AiTranscriberResp, error) {
	inputLangLabel := langLabels[data.InputLang]
	outputLangLabel := langLabels[data.OutputLang]

	formatSuffix := fmt.Sprintf(`

OUTPUT FORMAT REQUIRED: Plain Text.
- Just the raw text content in %s, separated by paragraphs where appropriate.`, outputLangLabel)
	switch data.Format {
	case "srt":
		formatSuffix = `

OUTPUT FORMAT REQUIRED: SRT (SubRip Subtitle).
- Strictly follow standard SRT formatting:
  1
  00:00:01,000 --> 00:00:04,000
  Translated text line here.

  2
  ...
- CRITICAL CONSTRAINT: Split the transcript into short, synchronized segments.
- **MAXIMUM DURATION per segment: 10 SECONDS**.
- Do not output long blocks of text spanning minutes. Break them down.
- Do not wrap in markdown code blocks. Return raw SRT string.`
	case "json":
		formatSuffix = `

OUTPUT FORMAT REQUIRED: JSON.
- Return a JSON Array of objects.
- Schema: [{"start": "HH:MM:SS", "end": "HH:MM:SS", "text": "Translated text"}]
- CRITICAL CONSTRAINT: Split the transcript into short segments.
- **MAXIMUM DURATION per segment: 10 SECONDS**.
- Do not wrap in markdown code blocks. Return raw JSON.`
	}

	// Non-Whisper models (e.g. Gemini) accept audio inline via chat completion.
	// Combine transcription + translation/formatting into a single call.
	if !strings.HasPrefix(strings.ToLower(s.llm.ModelNames().AudioModel), "whisper") {
		systemPrompt := fmt.Sprintf(`You are a professional transcriber and translator.

STRICT LANGUAGE CONFIGURATION:
- Input Language: %s
- Output Language: **%s**.

TASKS:
1. Transcribe the audio content.
2. Translate the transcript fully into **%s**. The final result MUST be in %s.`,
			inputLangLabel, outputLangLabel, outputLangLabel, outputLangLabel)
		systemPrompt += formatSuffix

		resp, err := s.llm.TranscribeAudioWithPrompt(ctx, llmpkg.AudioWithPromptRequest{
			File:         data.File,
			FileName:     data.FileName,
			SystemPrompt: &systemPrompt,
			UserPrompt:   "Transcribe and translate the audio according to the system instructions.",
		})
		if err != nil {
			logging.FromContext(ctx).Sugar().Errorf("AiTranscriber (chat) failed: %v", err)
			return nil, wrapErr(err, ErrTranscribeFailed)
		}
		return &AiTranscriberResp{Content: resp.Content}, nil
	}

	// Whisper model: two-step — transcribe then translate/format via chat completion.
	audioReq := llmpkg.AudioRequest{
		File:     data.File,
		FileName: data.FileName,
	}
	if data.InputLang != "auto" {
		audioReq.Language = &data.InputLang
	}

	audioResp, err := s.llm.TranscribeAudio(ctx, audioReq)
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("AiTranscriber transcription failed: %v", err)
		return nil, wrapErr(err, ErrTranscribeFailed)
	}

	prompt := fmt.Sprintf(`You are a professional transcriber and translator.

STRICT LANGUAGE CONFIGURATION:
- Input Language: %s
- Output Language: **%s**.

TASKS:
1. Translate the transcript fully into **%s**. The final result MUST be in %s.
2. Transcript to translate:

%s`,
		inputLangLabel,
		outputLangLabel,
		outputLangLabel,
		outputLangLabel,
		audioResp.Text,
	)
	prompt += formatSuffix

	chatResp, err := s.llm.ChatCompletion(ctx, llmpkg.ChatRequest{
		Messages: []llmpkg.Message{
			{Role: "user", Content: prompt},
		},
	})
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("AiTranscriber translation failed: %v", err)
		return nil, wrapErr(err, ErrTranscribeFailed)
	}

	return &AiTranscriberResp{Content: chatResp.Content}, nil
}

// AiTranslator translates input text from a source language to a target language
func (s *LLMService) AiTranslator(ctx context.Context, authUsr *model.AuthUser, data AiTranslatorData) (*AiTranslatorResp, error) {
	sourceLangLabel := langLabels[data.SourceLang]
	if sourceLangLabel == "" {
		sourceLangLabel = "Auto Detect"
	}
	targetLangLabel := langLabels[data.TargetLang]
	if targetLangLabel == "" {
		targetLangLabel = "English"
	}
	ctxLabel := data.Context
	if ctxLabel == "" {
		ctxLabel = "General context"
	}

	temperature := 0.3
	systemPrompt := fmt.Sprintf(`You are a professional, high-precision translator.

TASK:
Translate the user's input text strictly from **%s** to **%s**.

CONTEXT:
The user has provided the following context to ensure accuracy: "%s".
Use this context to determine the appropriate tone (formal/casual), terminology, and nuance.

RULES:
1. **Strict Output**: Return ONLY the translated text. Do not add conversational filler like "Here is the translation".
2. **Preserve formatting**: Keep line breaks and structure if present.
3. **Accuracy**: Prioritize meaning and natural flow in the target language over literal word-for-word translation.
4. If the input is idiomatic or slang, translate the *meaning* to the target language's equivalent, unless instructed otherwise by context.`,
		sourceLangLabel, targetLangLabel, ctxLabel)

	resp, err := s.llm.ChatCompletion(ctx, llmpkg.ChatRequest{
		SystemPrompt: &systemPrompt,
		Temperature:  &temperature,
		Messages: []llmpkg.Message{
			{Role: "user", Content: data.InputText},
		},
	})
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("AiTranslator failed: %v", err)
		return nil, wrapErr(err, ErrTranslateFailed)
	}

	return &AiTranslatorResp{Content: resp.Content}, nil
}

// EmailGenerator generates a professional email based on topic, tone, and target language
func (s *LLMService) EmailGenerator(ctx context.Context, authUsr *model.AuthUser, data EmailGeneratorData) (*EmailGeneratorResp, error) {
	selectedLang := langLabels[data.Language]
	selectedTone := emailTones[data.Tone]

	systemPrompt := `You are an expert professional email copywriter. 
Your task is to write high-quality emails based on user descriptions.

Inputs provided:
- Topic/Description: What the email is about (The user may input this in ANY language).
- Tone: The desired style of writing.
- Target Language: The language the final email MUST be written in.

Requirements:
1. Analyze the 'Topic/Description' to understand the user's intent, regardless of the language they used to describe it.
2. Generate the final email content STRICTLY in the requested 'Target Language'.
3. Adopt the requested 'Tone'.
4. Return the result in valid JSON format with keys: 'subject' and 'body'.
5. The 'body' should contain the email content. If placeholders like [Name] are needed, include them.
6. Do not include markdown formatting (like ` + "```" + `json) in the response, just the raw JSON object.`

	prompt := fmt.Sprintf("Topic/Description: %s\nTone: %s\nTarget Language: %s", data.Topic, selectedTone, selectedLang)

	resp, err := s.llm.ChatCompletion(ctx, llmpkg.ChatRequest{
		SystemPrompt: &systemPrompt,
		Messages: []llmpkg.Message{
			{Role: "user", Content: prompt},
		},
	})
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("EmailGenerator failed: %v", err)
		return nil, wrapErr(err, ErrEmailGenFailed)
	}

	var parsed struct {
		Subject string `json:"subject"`
		Body    string `json:"body"`
	}
	if err := json.Unmarshal([]byte(resp.Content), &parsed); err != nil {
		// Fallback if JSON parsing fails
		return &EmailGeneratorResp{Subject: "Generated Email", Body: resp.Content}, nil
	}

	if parsed.Subject == "" {
		parsed.Subject = "No Subject"
	}
	return &EmailGeneratorResp{Subject: parsed.Subject, Body: parsed.Body}, nil
}

// MarkdownFormat reformats raw Markdown text following CommonMark / GitHub Flavored Markdown best practices
func (s *LLMService) MarkdownFormat(ctx context.Context, authUsr *model.AuthUser, data MarkdownFormatData) (*MarkdownFormatResp, error) {
	temperature := 0.1
	systemPrompt := `You are a Markdown Formatting Expert.

TASK:
Take the provided raw Markdown text and reformat it to follow CommonMark / GitHub Flavored Markdown best practices.

RULES:
1. Fix indentation (use 2 or 4 spaces consistently).
2. Standardize headers (# Header, not #Header).
3. Fix list spacing and nesting.
4. Align Markdown tables if present.
5. Ensure code blocks are properly closed.
6. **CRITICAL: DO NOT CHANGE THE CONTENT.** Do not summarize, do not rewrite text, do not fix grammar. ONLY fix the Markdown syntax and whitespace.
7. Return ONLY the formatted Markdown string. Do not wrap in code blocks.`

	resp, err := s.llm.ChatCompletion(ctx, llmpkg.ChatRequest{
		SystemPrompt: &systemPrompt,
		Temperature:  &temperature,
		Messages: []llmpkg.Message{
			{Role: "user", Content: data.Markdown},
		},
	})
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("MarkdownFormat failed: %v", err)
		return nil, wrapErr(err, ErrMarkdownFmtFailed)
	}

	return &MarkdownFormatResp{Content: resp.Content}, nil
}

// Ocr extracts text from an image using a vision-capable LLM
func (s *LLMService) Ocr(ctx context.Context, authUsr *model.AuthUser, data OcrData) (*OcrResp, error) {
	promptText := "Extract all text from this image."
	switch data.Format {
	case "markdown":
		promptText += " Format the output as Markdown (tables, headers, etc)."
	case "html":
		promptText += " Format the output as semantic HTML."
	case "json":
		promptText += " Format the output as a structured JSON object representing the fields found."
	default:
		promptText += " Return plain text."
	}

	dataURL := fmt.Sprintf("data:%s;base64,%s", data.MimeType, base64.StdEncoding.EncodeToString(data.Image))

	resp, err := s.llm.ChatCompletion(ctx, llmpkg.ChatRequest{
		Messages: []llmpkg.Message{
			{Role: "user", Content: promptText, ImageURLs: []string{dataURL}},
		},
	})
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("Ocr failed: %v", err)
		return nil, wrapErr(err, ErrOcrFailed)
	}

	content := resp.Content
	if content == "" {
		content = "No text detected."
	}
	return &OcrResp{Content: content}, nil
}

// SmartChatReply analyzes a conversation and returns 5 reply suggestions
func (s *LLMService) SmartChatReply(ctx context.Context, authUsr *model.AuthUser, data SmartChatReplyData) (*SmartChatReplyResp, error) {
	langLabel := langLabels[data.TargetLang]
	styleLabel := smartChatStyles[data.Style]

	systemPrompt := fmt.Sprintf(`You are an expert communication assistant and social dynamics coach.

TASK:
1. Analyze the context of the provided conversation (either text log or screenshot).
2. Identify the relationship dynamics, current topic, and emotional tone.
3. Generate **5 distinct reply suggestions** for the user (the person who needs to respond next).

INPUT ANALYSIS:
- The input conversation can be in ANY language (Vietnamese, English, Slang, Teencode, etc.).
- You must understand the nuances of the input language.
- Identify the "Sender" (the person we are replying to).

STYLE GUIDE:
- Target Language for Reply: **%s**.
- Chosen Style: **%s**.

Specific Instructions for Styles:
- If style is 'Humorous': Be genuinely funny, lighthearted, use jokes or memes if appropriate for the context.
- If style is 'Mimic/Mirror': Analyze the "Sender's" message length, emoji usage, punctuation habits, capitalization, and vocabulary. Respond as if you are mirroring their vibe.
- If style is 'Flirty/Romantic': Be charming and playful but calibrated to the context.

FORMAT:
- Return ONLY a valid JSON Array of strings. Example: ["Suggestion 1", "Suggestion 2", ...].
- Do not include markdown code blocks. Just the raw array.`, langLabel, styleLabel)

	var msg llmpkg.Message
	if len(data.Image) > 0 {
		dataURL := fmt.Sprintf("data:%s;base64,%s", data.MimeType, base64.StdEncoding.EncodeToString(data.Image))
		msg = llmpkg.Message{
			Role:      "user",
			Content:   "Analyze this chat screenshot and suggest replies.",
			ImageURLs: []string{dataURL},
		}
	} else {
		msg = llmpkg.Message{
			Role:    "user",
			Content: fmt.Sprintf("Here is the conversation log:\n%s", data.TextInput),
		}
	}

	resp, err := s.llm.ChatCompletion(ctx, llmpkg.ChatRequest{
		SystemPrompt: &systemPrompt,
		Messages:     []llmpkg.Message{msg},
	})
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("SmartChatReply failed: %v", err)
		return nil, wrapErr(err, ErrSmartChatFailed)
	}

	var suggestions []string
	if err := json.Unmarshal([]byte(resp.Content), &suggestions); err != nil {
		return nil, ErrSmartChatFailed.SetInternal(err)
	}

	return &SmartChatReplyResp{Suggestions: suggestions}, nil
}

// TextSummarizer summarizes and translates text based on the selected mode
func (s *LLMService) TextSummarizer(ctx context.Context, authUsr *model.AuthUser, data TextSummarizerData) (*TextSummarizerResp, error) {
	langLabel := langLabels[data.TargetLang]
	modeDesc := summarizerModes[data.Mode]

	temperature := 0.3
	systemPrompt := fmt.Sprintf(`You are an expert professional text summarizer and translator.

TASK:
1. Analyze the input text (auto-detect language).
2. Summarize it based strictly on the selected MODE.
3. Translate the summary into the TARGET LANGUAGE: %s.

MODE DEFINITIONS:
- 'shortest': Condense the text into the absolute shortest possible paragraph that still conveys the core message. Extreme brevity.
- 'key_points': Extract ONLY the main key points as a structured bulleted list. Do not write paragraphs.
- 'concise': Write a clear, brief summary. Ensure NO main ideas are missed, but use efficient wording.
- 'detailed': Provide a comprehensive summary. Do not miss any ideas (major or minor). Just remove redundancy and fluff. Structure it well.
- 'professional': Create a highly structured, professional document designed for ease of reading and understanding.
   1. Start with a clear, relevant TITLE (H1).
   2. Write a brief INTRODUCTION context.
   3. Organize the body into logical sections using Headers (H2).
   4. Use bullet points where appropriate to make it easy to scan.
   5. End with a short CONCLUSION.
   6. Tone: Professional, clear, and logical.

CURRENT MODE: %s (%s)

DIAGRAMS & FLOWS:
If the input text describes a process, architecture, or flow, represent it visually using ONE of the following formats:
a. ASCII Console Diagram (for simple box/arrow architecture diagrams):
   Use box-drawing characters and arrows inside a plain fenced code block. Example:
   `+"```"+`
   ┌─────────────┐     ┌─────────────┐
   │   Step A    │────►│   Step B    │
   └─────────────┘     └─────────────┘
   `+"```"+`
b. Mermaid.js Diagram (for flowcharts, sequences, state machines, class diagrams):
   Use a fenced code block with the 'mermaid' language tag. Example:
   `+"```"+`mermaid
   flowchart TD
       A[Start] --> B[Process] --> C[End]
   `+"```"+`
Choose ASCII for simple architecture overviews, Mermaid for multi-step flows or sequences.

OUTPUT FORMAT:
- Return strictly Markdown.
- Do not include conversational filler like "Here is the summary".
- Ensure the output language is **%s**.`, langLabel, data.Mode, modeDesc, langLabel)

	resp, err := s.llm.ChatCompletion(ctx, llmpkg.ChatRequest{
		SystemPrompt: &systemPrompt,
		Temperature:  &temperature,
		Messages: []llmpkg.Message{
			{Role: "user", Content: data.Text},
		},
	})
	if err != nil {
		logging.FromContext(ctx).Sugar().Errorf("TextSummarizer failed: %v", err)
		return nil, wrapErr(err, ErrSummaryFailed)
	}

	return &TextSummarizerResp{Content: resp.Content}, nil
}

// wrapErr returns err directly if it is already an *apperr.HTTPError (e.g. from the openai package),
// preserving its HTTP status code and message. Otherwise wraps it with the provided fallback error.
func wrapErr(err error, fallback *apperr.HTTPError) error {
	var he *apperr.HTTPError
	if errors.As(err, &he) {
		return he
	}
	return fallback.SetInternal(err)
}
