package clients

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"posts/dto"
	"strings"
	"unicode"

	log "github.com/sirupsen/logrus"
)

// GeminiClient is a minimal client to call the Gemini image understanding endpoint.
// It expects GEMINI_API_KEY to be present in the environment.
type geminiClient struct{}

type geminiClientInterface interface {
	AnalyzeImage(file multipart.File, filename string) (dto.PostDto, error)
}

var GeminiClient geminiClientInterface

func init() {
	GeminiClient = &geminiClient{}
}

// AnalyzeImage sends the image as multipart/form-data to Gemini and returns a best-effort dto.PostDto
func (c *geminiClient) AnalyzeImage(file multipart.File, filename string) (dto.PostDto, error) {
	// Read file bytes and delegate to base64 method with inferred mime type
	var out dto.PostDto
	dataBuf := &bytes.Buffer{}
	if _, err := io.Copy(dataBuf, file); err != nil {
		return out, fmt.Errorf("reading image: %w", err)
	}
	mime := inferMimeTypeFromExt(filename)
	return c.analyzeImageBase64(dataBuf.Bytes(), mime, filepath.Base(filename))
}

func (c *geminiClient) analyzeImageBase64(data []byte, mimeType string, _ string) (dto.PostDto, error) {
	var out dto.PostDto

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return out, fmt.Errorf("missing GEMINI_API_KEY env variable")
	}

	// Build JSON request for generateContent with inline_data
	b64 := base64.StdEncoding.EncodeToString(data)
	prompt := "Analiza la siguiente imagen y cualquier texto visible (p.ej., un posteo de redes sociales sobre una mascota en adopción, pérdida o encontrada). Devuelve EXCLUSIVAMENTE un JSON con las claves exactas y SOLO los campos que puedas determinar.\n\nEstructura:\n{\n  \"name\": string | null,\n  \"species\": string | null,\n  \"age\": number | null,\n  \"breed\": string | null,\n  \"color\": string | null,\n  \"size\": string | null,\n  \"sex\": string | null,\n  \"neutered\": boolean | null,\n  \"completeVaccines\": boolean | null,\n  \"zone\": string | null,\n  \"healthStatus\": string | null,\n  \"collar\": boolean | null,\n  \"collarColor\": string | null\n}\n\nReglas estrictas:\n- Detectá la raza (breed) a partir de la imagen y/o texto. Si no se identifica una raza específica, usar exactamente \"mestizo\" como valor.\n- color y collarColor: SOLO el color principal en UNA palabra (sin paréntesis ni comentarios).\n- size: EXACTAMENTE uno de: pequeño | mediano | grande (no uses barras ni combinaciones).\n- zone: sin palabras \"barrio\"/\"zona\" delante; sólo el nombre del lugar (p.ej., Centro, Palermo).\n- species en minúsculas: perro | gato.\n- No devuelvas ningún texto fuera del JSON. Si un dato no puede determinarse, omite esa clave."
	reqPayload := map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"role": "user",
				"parts": []interface{}{
					map[string]interface{}{"text": prompt},
					map[string]interface{}{
						"inline_data": map[string]interface{}{
							"mime_type": mimeType,
							"data":      b64,
						},
					},
				},
			},
		},
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return out, fmt.Errorf("marshal request: %w", err)
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
	req, err := http.NewRequest("POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return out, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return out, fmt.Errorf("request to gemini failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return out, fmt.Errorf("gemini api returned status %d: %s", resp.StatusCode, string(respBody))
	}

	// Parse response to extract the text part (should be the JSON we requested)
	var raw map[string]interface{}
	if err := json.Unmarshal(respBody, &raw); err != nil {
		log.Debug("gemini raw response (unmarshal error): ", string(respBody))
		return out, fmt.Errorf("decoding gemini response: %w", err)
	}

	jsonText := extractFirstTextFromCandidates(raw)
	if jsonText == "" {
		log.Debug("gemini response without text part: ", string(respBody))
		return out, fmt.Errorf("gemini response did not include text candidate")
	}

	// Clean code fences and extract pure JSON
	cleaned := cleanupJSONText(jsonText)

	// Unmarshal detected JSON
	var detected map[string]interface{}
	if err := json.Unmarshal([]byte(cleaned), &detected); err != nil {
		// Try a looser fallback by locating first/last braces
		start := strings.Index(jsonText, "{")
		end := strings.LastIndex(jsonText, "}")
		if start >= 0 && end > start {
			candidate := jsonText[start : end+1]
			if err2 := json.Unmarshal([]byte(candidate), &detected); err2 != nil {
				log.Debug("gemini text not valid JSON: ", jsonText)
				return out, fmt.Errorf("could not parse JSON from gemini text: %v", err)
			}
		} else {
			log.Debug("gemini text without braces: ", jsonText)
			return out, fmt.Errorf("gemini did not return JSON")
		}
	}

	// Map detected fields to PostDto
	out = mapDetectedToPostDto(detected)
	// Normalize ambiguous or verbose fields
	normalizePostDtoFields(&out)
	return out, nil
}

// infer mime type from filename extension
func inferMimeTypeFromExt(filename string) string {
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}

// extractFirstTextFromCandidates navigates Gemini's response and returns the first text part
func extractFirstTextFromCandidates(raw map[string]interface{}) string {
	cands, ok := raw["candidates"].([]interface{})
	if !ok || len(cands) == 0 {
		return ""
	}
	first, _ := cands[0].(map[string]interface{})
	if first == nil {
		return ""
	}
	content, _ := first["content"].(map[string]interface{})
	if content == nil {
		return ""
	}
	parts, _ := content["parts"].([]interface{})
	for _, p := range parts {
		if pm, ok := p.(map[string]interface{}); ok {
			if t, ok := pm["text"].(string); ok && t != "" {
				return t
			}
		}
	}
	return ""
}

// cleanupJSONText strips code fences and trims whitespace
func cleanupJSONText(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```") {
		// remove leading and trailing code fences
		s = strings.TrimPrefix(s, "```json")
		s = strings.TrimPrefix(s, "```JSON")
		s = strings.TrimPrefix(s, "```")
		if idx := strings.LastIndex(s, "```"); idx >= 0 {
			s = s[:idx]
		}
		s = strings.TrimSpace(s)
	}
	return s
}

// mapDetectedToPostDto maps a generic map (detected JSON) into PostDto with type conversions
func mapDetectedToPostDto(m map[string]interface{}) dto.PostDto {
	var out dto.PostDto
	out.PostStatus = false
	// helpers
	getStr := func(k string) *string {
		if v, ok := m[k]; ok {
			if s, ok := v.(string); ok && s != "" {
				return &s
			}
		}
		return nil
	}
	getBool := func(k string) *bool {
		if v, ok := m[k]; ok {
			switch t := v.(type) {
			case bool:
				return &t
			case string:
				if t == "true" {
					b := true
					return &b
				}
				if t == "false" {
					b := false
					return &b
				}
			}
		}
		return nil
	}
	getInt := func(k string) *int {
		if v, ok := m[k]; ok {
			switch t := v.(type) {
			case float64:
				i := int(t)
				return &i
			case int:
				return &t
			case string:
				// naive parse to float via json
				var parsed float64
				if err := json.Unmarshal([]byte("\""+t+"\""), &parsed); err == nil {
					i := int(parsed)
					return &i
				}
			}
		}
		return nil
	}

	out.Name = getStr("name")
	out.Species = getStr("species")
	out.Age = getInt("age")
	out.Breed = getStr("breed")
	out.Color = getStr("color")
	out.Size = getStr("size")
	out.Sex = getStr("sex")
	out.Neutered = getBool("neutered")
	out.CompleteVaccines = getBool("completeVaccines")
	out.Zone = getStr("zone")
	out.HealthStatus = getStr("healthStatus")
	out.Collar = getBool("collar")
	out.CollarColor = getStr("collarColor")
	return out
}

// normalizePostDtoFields post-processes fields to enforce single-word colors and a single size category
func normalizePostDtoFields(p *dto.PostDto) {
	// default breed if missing
	if p.Breed == nil || (p.Breed != nil && strings.TrimSpace(*p.Breed) == "") {
		def := "mestizo"
		p.Breed = &def
	}
	// normalize color
	if p.Color != nil {
		if v := normalizeColor(*p.Color); v != "" {
			*p.Color = v
		}
	}
	// normalize collar color
	if p.CollarColor != nil {
		if v := normalizeColor(*p.CollarColor); v != "" {
			*p.CollarColor = v
		}
	}
	// normalize size
	if p.Size != nil {
		if v := normalizeSize(*p.Size); v != "" {
			*p.Size = v
		}
	}
	// Title-case string fields (capitalize first letter; lower the rest per word)
	capPtr := func(sp **string) {
		if sp != nil && *sp != nil {
			v := capitalizeWords(**sp)
			**sp = v
		}
	}
	capPtr(&p.Name)
	capPtr(&p.Species)
	capPtr(&p.Breed)
	capPtr(&p.Color)
	capPtr(&p.Size)
	capPtr(&p.Sex)
	capPtr(&p.Description)
	capPtr(&p.Zone)
	capPtr(&p.HealthStatus)
	capPtr(&p.CollarColor)
}

// normalizeColor extracts a single base color name in Spanish
func normalizeColor(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	// remove parenthetical comments
	if i := strings.Index(s, "("); i >= 0 {
		s = strings.TrimSpace(s[:i])
	}
	// cut at common delimiters
	for _, d := range []string{",", ";", "/", "|", "-", "."} {
		if idx := strings.Index(s, d); idx >= 0 {
			s = strings.TrimSpace(s[:idx])
		}
	}
	// take first word
	if idx := strings.IndexFunc(s, func(r rune) bool { return r == ' ' || r == '\t' }); idx >= 0 {
		s = s[:idx]
	}
	// map synonyms/roots to canonical forms
	if s == "" {
		return ""
	}
	switch {
	case strings.Contains(s, "negr"):
		return "negro"
	case strings.Contains(s, "blanc"):
		return "blanco"
	case s == "marron" || strings.Contains(s, "marr") || strings.Contains(s, "cafe") || strings.Contains(s, "casta"):
		return "marrón"
	case strings.Contains(s, "gris"):
		return "gris"
	case strings.Contains(s, "beig"):
		return "beige"
	case strings.Contains(s, "crem"):
		return "crema"
	case strings.Contains(s, "dora") || s == "oro" || strings.Contains(s, "dorado"):
		return "dorado"
	case strings.Contains(s, "canel"):
		return "canela"
	case strings.Contains(s, "tigr"):
		return "atigrado"
	case strings.Contains(s, "bicolor"):
		return "bicolor"
	case strings.Contains(s, "tricolor"):
		return "tricolor"
	default:
		return s
	}
}

// normalizeSize maps to one of: pequeño | mediano | grande
func normalizeSize(s string) string {
	t := strings.ToLower(strings.TrimSpace(s))
	// if includes slash or pipe, prefer first segment
	for _, d := range []string{"/", "|", ",", ";"} {
		if idx := strings.Index(t, d); idx >= 0 {
			t = strings.TrimSpace(t[:idx])
			break
		}
	}
	// heuristic mapping by substring
	switch {
	case strings.Contains(t, "peque"):
		return "pequeño"
	case strings.Contains(t, "medi") || strings.Contains(t, "med"):
		return "mediano"
	case strings.Contains(t, "gran"):
		return "grande"
	default:
		// if it's exactly one of the canonical values (maybe already)
		if t == "pequeño" || t == "mediano" || t == "grande" {
			return t
		}
		// unknown size; return original trimmed to avoid making wrong assumptions
		return t
	}
}

// capitalizeWords returns a string where each word starts with uppercase and the rest lowercase
func capitalizeWords(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return s
	}
	words := strings.Fields(s)
	for i, w := range words {
		runes := []rune(w)
		if len(runes) == 0 {
			continue
		}
		runes[0] = unicode.ToUpper(runes[0])
		for j := 1; j < len(runes); j++ {
			runes[j] = unicode.ToLower(runes[j])
		}
		words[i] = string(runes)
	}
	return strings.Join(words, " ")
}
