package genai

import (
	"encoding/base64"
	"strings"

	llm "github.com/kevinxvu/vibe-tools/pkg/llm"
	googlegenai "google.golang.org/genai"
)

// newImagePart builds a GenAI Part from an image URL.
// data: URIs (base64-encoded) are decoded to inline bytes — required for Vertex AI
// which rejects data: URIs as fileUri values.
// http(s):// and gs:// URIs are passed through as fileUri.
func newImagePart(imageURL string) *googlegenai.Part {
	if strings.HasPrefix(imageURL, "data:") {
		// Format: data:<mimeType>;base64,<data>
		rest := strings.TrimPrefix(imageURL, "data:")
		semi := strings.Index(rest, ";")
		if semi < 0 {
			// Malformed — fall back to URI (will likely fail, but preserves old behaviour)
			return googlegenai.NewPartFromURI(imageURL, "image/jpeg")
		}
		mimeType := rest[:semi]
		encoded := strings.TrimPrefix(rest[semi+1:], "base64,")
		data, err := base64.StdEncoding.DecodeString(encoded)
		if err != nil {
			return googlegenai.NewPartFromURI(imageURL, mimeType)
		}
		return googlegenai.NewPartFromBytes(data, mimeType)
	}
	// Cloud Storage (gs://) or HTTP(S) URI — use fileUri directly
	return googlegenai.NewPartFromURI(imageURL, "image/jpeg")
}

// estimateTokens estimates the total token count from messages and an optional system prompt.
// Uses a rune-count heuristic (runes/3) which works reasonably for mixed Vietnamese/English text.
func estimateTokens(messages []llm.Message, systemPrompt *string) int {
	total := 0
	if systemPrompt != nil {
		total += len([]rune(*systemPrompt))
	}
	for _, m := range messages {
		total += len([]rune(m.Content))
	}
	return total / 3
}
