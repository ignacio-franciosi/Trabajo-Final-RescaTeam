package services_test

import (
	"errors"
	"io"
	"mime/multipart"
	"testing"

	"posts/clients"
	"posts/dto"
	"posts/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockGeminiClient struct {
	mock.Mock
}

func (m *mockGeminiClient) AnalyzeImage(file multipart.File, filename string) (dto.PostDto, error) {
	args := m.Called(file, filename)
	return args.Get(0).(dto.PostDto), args.Error(1)
}

// Helper para crear un archivo multipart.File simulado
func createMockFile(content []byte) multipart.File {
	return &mockFile{
		content: content,
		pos:     0,
	}
}

type mockFile struct {
	content []byte
	pos     int64
}

func (m *mockFile) Read(p []byte) (n int, err error) {
	if m.pos >= int64(len(m.content)) {
		return 0, io.EOF
	}
	n = copy(p, m.content[m.pos:])
	m.pos += int64(n)
	return n, nil
}

func (m *mockFile) ReadAt(p []byte, off int64) (n int, err error) {
	if off >= int64(len(m.content)) {
		return 0, io.EOF
	}
	n = copy(p, m.content[off:])
	return n, nil
}

func (m *mockFile) Seek(offset int64, whence int) (int64, error) {
	switch whence {
	case 0: // io.SeekStart
		m.pos = offset
	case 1: // io.SeekCurrent
		m.pos += offset
	case 2: // io.SeekEnd
		m.pos = int64(len(m.content)) + offset
	}
	return m.pos, nil
}

func (m *mockFile) Close() error {
	return nil
}

// --- TESTS ---

// TESTS AnalyzeImage - Casos de éxito
func TestAnalyzeImage_Success(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	file := createMockFile([]byte("fake image content"))
	filename := "test.jpg"

	age := 3
	expectedDto := dto.PostDto{
		Name:    stringPtr("Max"),
		Species: stringPtr("Perro"),
		Breed:   stringPtr("Labrador"),
		Color:   stringPtr("Dorado"),
		Size:    stringPtr("Grande"),
		Sex:     stringPtr("Macho"),
		Age:     &age,
		Zone:    stringPtr("Córdoba"),
	}

	mockGemini.On("AnalyzeImage", file, filename).Return(expectedDto, nil)

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.Nil(t, err)
	assert.Equal(t, expectedDto.Name, result.Name)
	assert.Equal(t, expectedDto.Species, result.Species)
	assert.Equal(t, expectedDto.Breed, result.Breed)
	mockGemini.AssertExpectations(t)
}

func TestAnalyzeImage_Success_PartialData(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	file := createMockFile([]byte("fake image content"))
	filename := "pet.png"

	expectedDto := dto.PostDto{
		Name:    stringPtr("Luna"),
		Species: stringPtr("Gato"),
		// Otros campos pueden ser nil si no se detectan
	}

	mockGemini.On("AnalyzeImage", file, filename).Return(expectedDto, nil)

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.Nil(t, err)
	assert.Equal(t, expectedDto.Name, result.Name)
	assert.Equal(t, expectedDto.Species, result.Species)
	mockGemini.AssertExpectations(t)
}

// TESTS AnalyzeImage - Casos de error
func TestAnalyzeImage_Error_GeminiClientError(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	file := createMockFile([]byte("fake image content"))
	filename := "test.jpg"

	mockGemini.On("AnalyzeImage", file, filename).Return(dto.PostDto{}, errors.New("gemini API error"))

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.NotNil(t, err)
	assert.Equal(t, "", result.PostId)
	assert.EqualError(t, err, "gemini API error")
	mockGemini.AssertExpectations(t)
}

func TestAnalyzeImage_Error_InvalidImage(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	file := createMockFile([]byte("not an image"))
	filename := "test.txt"

	mockGemini.On("AnalyzeImage", file, filename).Return(dto.PostDto{}, errors.New("invalid image format"))

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.NotNil(t, err)
	assert.Equal(t, "", result.PostId)
	mockGemini.AssertExpectations(t)
}

// TESTS AnalyzeImage - Table-driven tests para diferentes formatos
func TestAnalyzeImage_DifferentFormats(t *testing.T) {
	tests := []struct {
		name     string
		filename string
		content  []byte
		expected dto.PostDto
		mockErr  error
	}{
		{
			name:     "jpeg_image",
			filename: "pet.jpg",
			content:  []byte("jpeg content"),
			expected: dto.PostDto{Name: stringPtr("Rex"), Species: stringPtr("Perro")},
		},
		{
			name:     "png_image",
			filename: "pet.png",
			content:  []byte("png content"),
			expected: dto.PostDto{Name: stringPtr("Mia"), Species: stringPtr("Gato")},
		},
		{
			name:     "webp_image",
			filename: "pet.webp",
			content:  []byte("webp content"),
			expected: dto.PostDto{Name: stringPtr("Bella"), Species: stringPtr("Perro")},
		},
		{
			name:     "unsupported_format",
			filename: "pet.gif",
			content:  []byte("gif content"),
			mockErr:  errors.New("unsupported format"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockGemini := new(mockGeminiClient)
			clients.GeminiClient = mockGemini

			file := createMockFile(tt.content)
			mockGemini.On("AnalyzeImage", file, tt.filename).Return(tt.expected, tt.mockErr)

			result, err := services.AutocompleteService.AnalyzeImage(file, tt.filename)

			if tt.mockErr != nil {
				assert.NotNil(t, err)
				assert.EqualError(t, err, tt.mockErr.Error())
			} else {
				assert.Nil(t, err)
				if tt.expected.Name != nil {
					assert.Equal(t, tt.expected.Name, result.Name)
				}
				if tt.expected.Species != nil {
					assert.Equal(t, tt.expected.Species, result.Species)
				}
			}
			mockGemini.AssertExpectations(t)
		})
	}
}

// TESTS AnalyzeImage - Edge cases
func TestAnalyzeImage_EmptyFile(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	file := createMockFile([]byte{})
	filename := "empty.jpg"

	mockGemini.On("AnalyzeImage", file, filename).Return(dto.PostDto{}, errors.New("empty file"))

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.NotNil(t, err)
	assert.Equal(t, "", result.PostId)
	mockGemini.AssertExpectations(t)
}

func TestAnalyzeImage_LargeFile(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	// Simular archivo grande (10MB)
	largeContent := make([]byte, 10*1024*1024)
	file := createMockFile(largeContent)
	filename := "large.jpg"

	expectedDto := dto.PostDto{
		Name:    stringPtr("Large Pet"),
		Species: stringPtr("Perro"),
	}

	mockGemini.On("AnalyzeImage", file, filename).Return(expectedDto, nil)

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.Nil(t, err)
	assert.Equal(t, expectedDto.Name, result.Name)
	mockGemini.AssertExpectations(t)
}

func TestAnalyzeImage_EmptyFilename(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	file := createMockFile([]byte("content"))
	filename := ""

	mockGemini.On("AnalyzeImage", file, filename).Return(dto.PostDto{}, errors.New("invalid filename"))

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.NotNil(t, err)
	assert.Equal(t, "", result.PostId)
	mockGemini.AssertExpectations(t)
}

// TESTS AnalyzeImage - Diferentes tipos de animales detectados
func TestAnalyzeImage_DifferentSpecies(t *testing.T) {
	tests := []struct {
		name     string
		filename string
		expected dto.PostDto
	}{
		{
			name:     "dog_detection",
			filename: "dog.jpg",
			expected: dto.PostDto{
				Name:    stringPtr("Buddy"),
				Species: stringPtr("Perro"),
				Breed:   stringPtr("Golden Retriever"),
			},
		},
		{
			name:     "cat_detection",
			filename: "cat.jpg",
			expected: dto.PostDto{
				Name:    stringPtr("Whiskers"),
				Species: stringPtr("Gato"),
				Breed:   stringPtr("Persa"),
			},
		},
		{
			name:     "bird_detection",
			filename: "bird.jpg",
			expected: dto.PostDto{
				Name:    stringPtr("Tweety"),
				Species: stringPtr("Ave"),
				Breed:   stringPtr("Canario"),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockGemini := new(mockGeminiClient)
			clients.GeminiClient = mockGemini

			file := createMockFile([]byte("image content"))
			mockGemini.On("AnalyzeImage", file, tt.filename).Return(tt.expected, nil)

			result, err := services.AutocompleteService.AnalyzeImage(file, tt.filename)

			assert.Nil(t, err)
			assert.Equal(t, tt.expected.Species, result.Species)
			assert.Equal(t, tt.expected.Name, result.Name)
			if tt.expected.Breed != nil {
				assert.Equal(t, tt.expected.Breed, result.Breed)
			}
			mockGemini.AssertExpectations(t)
		})
	}
}

// TESTS AnalyzeImage - Errores de red/timeout
func TestAnalyzeImage_Error_NetworkTimeout(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	file := createMockFile([]byte("image content"))
	filename := "test.jpg"

	mockGemini.On("AnalyzeImage", file, filename).Return(dto.PostDto{}, errors.New("timeout: request took too long"))

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "timeout")
	assert.Equal(t, "", result.PostId)
	mockGemini.AssertExpectations(t)
}

func TestAnalyzeImage_Error_ServiceUnavailable(t *testing.T) {
	mockGemini := new(mockGeminiClient)
	clients.GeminiClient = mockGemini

	file := createMockFile([]byte("image content"))
	filename := "test.jpg"

	mockGemini.On("AnalyzeImage", file, filename).Return(dto.PostDto{}, errors.New("service unavailable"))

	result, err := services.AutocompleteService.AnalyzeImage(file, filename)

	assert.NotNil(t, err)
	assert.Equal(t, "", result.PostId)
	mockGemini.AssertExpectations(t)
}
