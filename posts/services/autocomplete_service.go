package services

import (
	"mime/multipart"
	"posts/clients"
	"posts/dto"
)

type autocompleteService struct{}

type autocompleteServiceInterface interface {
	AnalyzeImage(file multipart.File, filename string) (dto.PostDto, error)
}

var AutocompleteService autocompleteServiceInterface

func init() {
	AutocompleteService = &autocompleteService{}
}

func (s *autocompleteService) AnalyzeImage(file multipart.File, filename string) (dto.PostDto, error) {
	// Delegate to Gemini client
	return clients.GeminiClient.AnalyzeImage(file, filename)
}
