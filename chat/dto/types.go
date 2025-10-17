package dto

import (
	"encoding/json"
	"fmt"
)

type StringOrNumber string

func (s *StringOrNumber) UnmarshalJSON(b []byte) error {
	// intentar como string
	var str string
	if err := json.Unmarshal(b, &str); err == nil {
		*s = StringOrNumber(str)
		return nil
	}
	// intentar como número
	var num json.Number
	if err := json.Unmarshal(b, &num); err == nil {
		*s = StringOrNumber(num.String())
		return nil
	}
	return fmt.Errorf("must be string or number")
}

func (s StringOrNumber) String() string { return string(s) }
