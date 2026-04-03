package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"program-kasir-go/internal/config"
	"program-kasir-go/internal/models"
)

type Handler struct {
	DB     *gorm.DB
	Config config.Config
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, detail string) {
	writeJSON(w, status, map[string]any{"detail": detail})
}

func decodeJSON(r *http.Request, dest any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(dest)
}

func parseUintParam(r *http.Request, key string) (uint, error) {
	raw := chi.URLParam(r, key)
	value, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(value), nil
}

func parseOptionalISOTime(raw string) (*time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, raw)
	if err == nil {
		return &t, nil
	}
	t, err = time.Parse("2006-01-02", raw)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func parseDateOrDateTime(raw string) (*time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}
	layouts := []string{time.RFC3339, "2006-01-02", "2006-01-02T15:04:05"}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, raw); err == nil {
			return &t, nil
		}
	}
	return nil, errors.New("invalid date")
}

func isDateOnly(raw string) bool {
	return len(strings.TrimSpace(raw)) == len("2006-01-02")
}

func preloadTransaction(db *gorm.DB) *gorm.DB {
	return db.Preload("Items").Preload("User").Preload("Customer").Preload("Discount")
}

func preloadProduct(db *gorm.DB) *gorm.DB {
	return db.Preload("Barcodes")
}

func preloadCustomer(db *gorm.DB) *gorm.DB {
	return db.Preload("Debts")
}

func updateMemberLevel(customer *models.Customer) {
	switch {
	case customer.TotalSpent >= 10000000:
		customer.MemberLevel = "Gold"
	case customer.TotalSpent >= 5000000:
		customer.MemberLevel = "Silver"
	default:
		customer.MemberLevel = "Bronze"
	}
}

func boolQuery(r *http.Request, key string) *bool {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return nil
	}
	value := strings.EqualFold(raw, "true") || raw == "1"
	return &value
}
