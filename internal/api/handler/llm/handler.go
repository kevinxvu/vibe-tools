package llm

import (
	"io"
	"net/http"
	"strings"

	"github.com/kevinxvu/vibe-tools/internal/api/service/llm"
	"github.com/kevinxvu/vibe-tools/internal/model"
	"github.com/kevinxvu/vibe-tools/pkg/server/apperr"
	"github.com/labstack/echo/v4"
)

// HTTP represents llm http service
type HTTP struct {
	svc  llm.Service
	auth model.Auth
}

// NewHTTP creates new llm http service
func NewHTTP(svc llm.Service, auth model.Auth, eg *echo.Group) {
	h := HTTP{svc, auth}

	eg.POST("/chat-to-article", h.chatToArticle)
	eg.POST("/ai-transcriber", h.aiTranscriber)
	eg.POST("/ai-translator", h.aiTranslator)
	eg.POST("/email-generator", h.emailGenerator)
	eg.POST("/markdown-format", h.markdownFormat)
	eg.POST("/ocr", h.ocr)
	eg.POST("/smart-chat-reply", h.smartChatReply)
	eg.POST("/text-summarizer", h.textSummarizer)
}

// @Security		BearerToken
// @Summary		Convert chat log to technical article
// @Description	Takes a raw chat log between a User and AI Assistant and converts it into a structured technical article
// @Accept			json
// @Produce		json
// @Tags			llm
// @ID				llmChatToArticle
// @Param			request						body		llm.ChatToArticleData	true	"ChatToArticleData"
// @Success		200							{object}	llm.ChatToArticleResp
// @Failure		400							{object}	SwaggErrDetailsResp
// @Failure		401							{object}	SwaggErrDetailsResp
// @Failure		500							{object}	SwaggErrDetailsResp
// @Router			/api/v1/llm/chat-to-article	[post]
func (h *HTTP) chatToArticle(c echo.Context) error {
	r := llm.ChatToArticleData{}
	if err := c.Bind(&r); err != nil {
		return err
	}
	resp, err := h.svc.ChatToArticle(c.Request().Context(), h.auth.User(c), r)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, resp)
}

// @Security		BearerToken
// @Summary		Transcribe and translate audio/video file
// @Description	Transcribes an audio/video file using Whisper and translates the result to the target language
// @Accept			multipart/form-data
// @Produce		json
// @Tags			llm
// @ID				llmAiTranscriber
// @Param			file						formData	file	true	"Audio/video file to transcribe"
// @Param			input_lang					formData	string	true	"Input language (auto, vi, en, th, zh, ja, ko, fr, de, es)"
// @Param			output_lang					formData	string	true	"Output language (vi, en, th, zh, ja, ko, fr, de, es)"
// @Param			format						formData	string	true	"Output format (text, json, srt)"
// @Success		200							{object}	llm.AiTranscriberResp
// @Failure		400							{object}	SwaggErrDetailsResp
// @Failure		401							{object}	SwaggErrDetailsResp
// @Failure		500							{object}	SwaggErrDetailsResp
// @Router			/api/v1/llm/ai-transcriber	[post]
func (h *HTTP) aiTranscriber(c echo.Context) error {
	file, err := c.FormFile("file")
	if err != nil {
		return apperr.NewHTTPGenericError("file is required")
	}

	src, err := file.Open()
	if err != nil {
		return apperr.NewHTTPInternalError("Failed to open uploaded file").SetInternal(err)
	}
	defer src.Close()

	r := llm.AiTranscriberData{
		File:       src,
		FileName:   file.Filename,
		InputLang:  c.FormValue("input_lang"),
		OutputLang: c.FormValue("output_lang"),
		Format:     c.FormValue("format"),
	}
	if err := c.Validate(r); err != nil {
		return err
	}

	resp, err := h.svc.AiTranscriber(c.Request().Context(), h.auth.User(c), r)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, resp)
}

// @Security		BearerToken
// @Summary		Generate professional email
// @Description	Generates a professional email based on topic, tone, and target language
// @Accept			json
// @Produce		json
// @Tags			llm
// @ID				llmEmailGenerator
// @Param			request						body		llm.EmailGeneratorData	true	"EmailGeneratorData"
// @Success		200							{object}	llm.EmailGeneratorResp
// @Failure		400							{object}	SwaggErrDetailsResp
// @Failure		401							{object}	SwaggErrDetailsResp
// @Failure		500							{object}	SwaggErrDetailsResp
// @Router			/api/v1/llm/email-generator	[post]
func (h *HTTP) emailGenerator(c echo.Context) error {
	r := llm.EmailGeneratorData{}
	if err := c.Bind(&r); err != nil {
		return err
	}
	resp, err := h.svc.EmailGenerator(c.Request().Context(), h.auth.User(c), r)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, resp)
}

// @Security		BearerToken
// @Summary		Format raw Markdown text
// @Description	Reformats raw Markdown text following CommonMark / GitHub Flavored Markdown best practices
// @Accept			json
// @Produce		json
// @Tags			llm
// @ID				llmMarkdownFormat
// @Param			request						body		llm.MarkdownFormatData	true	"MarkdownFormatData"
// @Success		200							{object}	llm.MarkdownFormatResp
// @Failure		400							{object}	SwaggErrDetailsResp
// @Failure		401							{object}	SwaggErrDetailsResp
// @Failure		500							{object}	SwaggErrDetailsResp
// @Router			/api/v1/llm/markdown-format	[post]
func (h *HTTP) markdownFormat(c echo.Context) error {
	r := llm.MarkdownFormatData{}
	if err := c.Bind(&r); err != nil {
		return err
	}
	resp, err := h.svc.MarkdownFormat(c.Request().Context(), h.auth.User(c), r)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, resp)
}

// @Security		BearerToken
// @Summary		Extract text from image (OCR)
// @Description	Extracts text from an image using a vision-capable LLM
// @Accept			multipart/form-data
// @Produce		json
// @Tags			llm
// @ID				llmOcr
// @Param			image			formData	file	true	"Image file (jpeg, png, gif, webp)"
// @Param			format			formData	string	true	"Output format (text, markdown, html, json)"
// @Success		200				{object}	llm.OcrResp
// @Failure		400				{object}	SwaggErrDetailsResp
// @Failure		401				{object}	SwaggErrDetailsResp
// @Failure		500				{object}	SwaggErrDetailsResp
// @Router			/api/v1/llm/ocr	[post]
func (h *HTTP) ocr(c echo.Context) error {
	file, err := c.FormFile("image")
	if err != nil {
		return apperr.NewHTTPGenericError("image is required")
	}

	src, err := file.Open()
	if err != nil {
		return apperr.NewHTTPInternalError("Failed to open uploaded image").SetInternal(err)
	}
	defer src.Close()

	imageBytes, err := io.ReadAll(src)
	if err != nil {
		return apperr.NewHTTPInternalError("Failed to read uploaded image").SetInternal(err)
	}

	mimeType := file.Header.Get("Content-Type")

	r := llm.OcrData{
		Image:    imageBytes,
		MimeType: mimeType,
		Format:   c.FormValue("format"),
	}
	if err := c.Validate(r); err != nil {
		return err
	}

	resp, err := h.svc.Ocr(c.Request().Context(), h.auth.User(c), r)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, resp)
}

// @Security		BearerToken
// @Summary		Generate smart chat reply suggestions
// @Description	Analyzes a conversation (text or screenshot) and returns 5 reply suggestions
// @Accept			json
// @Accept			multipart/form-data
// @Produce		json
// @Tags			llm
// @ID				llmSmartChatReply
// @Param			request							body		llm.SmartChatReplyData	false	"SmartChatReplyData (JSON for text input)"
// @Param			image							formData	file					false	"Chat screenshot (multipart)"
// @Param			target_lang						formData	string					false	"Target language (vi, en, th, zh, ja, ko)"
// @Param			style							formData	string					false	"Reply style (professional, friendly, flirty, humorous, witty, mimic, empathetic, direct)"
// @Success		200								{object}	llm.SmartChatReplyResp
// @Failure		400								{object}	SwaggErrDetailsResp
// @Failure		401								{object}	SwaggErrDetailsResp
// @Failure		500								{object}	SwaggErrDetailsResp
// @Router			/api/v1/llm/smart-chat-reply	[post]
func (h *HTTP) smartChatReply(c echo.Context) error {
	r := llm.SmartChatReplyData{}

	contentType := c.Request().Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		file, err := c.FormFile("image")
		if err == nil {
			src, err := file.Open()
			if err != nil {
				return apperr.NewHTTPInternalError("Failed to open uploaded image").SetInternal(err)
			}
			defer src.Close()

			imageBytes, err := io.ReadAll(src)
			if err != nil {
				return apperr.NewHTTPInternalError("Failed to read uploaded image").SetInternal(err)
			}
			r.Image = imageBytes
			r.MimeType = file.Header.Get("Content-Type")
		}
		r.TextInput = c.FormValue("text_input")
		r.TargetLang = c.FormValue("target_lang")
		r.Style = c.FormValue("style")
	} else {
		if err := c.Bind(&r); err != nil {
			return err
		}
	}

	if err := c.Validate(r); err != nil {
		return err
	}

	resp, err := h.svc.SmartChatReply(c.Request().Context(), h.auth.User(c), r)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, resp)
}

// @Security		BearerToken
// @Summary		Translate text
// @Description	Translates input text from a source language to a target language using a professional AI translator
// @Accept			json
// @Produce		json
// @Tags			llm
// @ID				llmAiTranslator
// @Param			request						body		llm.AiTranslatorData	true	"AiTranslatorData"
// @Success		200							{object}	llm.AiTranslatorResp
// @Failure		400							{object}	SwaggErrDetailsResp
// @Failure		401							{object}	SwaggErrDetailsResp
// @Failure		500							{object}	SwaggErrDetailsResp
// @Router			/api/v1/llm/ai-translator	[post]
func (h *HTTP) aiTranslator(c echo.Context) error {
	r := llm.AiTranslatorData{}
	if err := c.Bind(&r); err != nil {
		return err
	}
	resp, err := h.svc.AiTranslator(c.Request().Context(), h.auth.User(c), r)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, resp)
}

// @Security		BearerToken
// @Summary		Summarize and translate text
// @Description	Summarizes and translates text based on the selected mode and target language
// @Accept			json
// @Produce		json
// @Tags			llm
// @ID				llmTextSummarizer
// @Param			request						body		llm.TextSummarizerData	true	"TextSummarizerData"
// @Success		200							{object}	llm.TextSummarizerResp
// @Failure		400							{object}	SwaggErrDetailsResp
// @Failure		401							{object}	SwaggErrDetailsResp
// @Failure		500							{object}	SwaggErrDetailsResp
// @Router			/api/v1/llm/text-summarizer	[post]
func (h *HTTP) textSummarizer(c echo.Context) error {
	r := llm.TextSummarizerData{}
	if err := c.Bind(&r); err != nil {
		return err
	}
	resp, err := h.svc.TextSummarizer(c.Request().Context(), h.auth.User(c), r)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, resp)
}
