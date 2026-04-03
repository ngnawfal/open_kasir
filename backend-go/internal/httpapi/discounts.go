package httpapi

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"program-kasir-go/internal/models"
)

type discountCreateRequest struct {
	Code         string  `json:"code"`
	Name         string  `json:"name"`
	DiscountType string  `json:"discount_type"`
	Value        int     `json:"value"`
	MinPurchase  int     `json:"min_purchase"`
	MaxDiscount  *int    `json:"max_discount"`
	ValidUntil   *string `json:"valid_until"`
	UsageLimit   *int    `json:"usage_limit"`
}

type discountUpdateRequest struct {
	Code         *string `json:"code"`
	Name         *string `json:"name"`
	DiscountType *string `json:"discount_type"`
	Value        *int    `json:"value"`
	MinPurchase  *int    `json:"min_purchase"`
	MaxDiscount  *int    `json:"max_discount"`
	IsActive     *bool   `json:"is_active"`
	ValidUntil   *string `json:"valid_until"`
	UsageLimit   *int    `json:"usage_limit"`
}

func (h *Handler) registerDiscountRoutes(r chi.Router) {
	r.Get("/", h.getDiscounts)
	r.Get("/validate/{code}", h.validateDiscount)
	r.Get("/{discount_id}", h.getDiscount)
	r.With(h.adminRequired).Post("/", h.createDiscount)
	r.With(h.adminRequired).Put("/{discount_id}", h.updateDiscount)
	r.With(h.adminRequired).Delete("/{discount_id}", h.deleteDiscount)
}

func (h *Handler) getDiscounts(w http.ResponseWriter, r *http.Request) {
	query := h.DB.Model(&models.Discount{})
	if activeOnly := boolQuery(r, "active_only"); activeOnly != nil && *activeOnly {
		query = query.Where("is_active = ?", true)
	}
	var discounts []models.Discount
	if err := query.Order("created_at desc").Find(&discounts).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil diskon")
		return
	}
	response := make([]map[string]any, 0, len(discounts))
	for _, discount := range discounts {
		response = append(response, discount.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) getDiscount(w http.ResponseWriter, r *http.Request) {
	discountID, err := parseUintParam(r, "discount_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Diskon tidak valid")
		return
	}
	var discount models.Discount
	if err := h.DB.First(&discount, discountID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Diskon tidak ditemukan")
		return
	}
	writeJSON(w, http.StatusOK, discount.ToMap())
}

func (h *Handler) validateDiscount(w http.ResponseWriter, r *http.Request) {
	code := strings.ToUpper(strings.TrimSpace(chi.URLParam(r, "code")))
	subtotal, _ := strconv.Atoi(r.URL.Query().Get("subtotal"))
	var discount models.Discount
	if err := h.DB.Where("code = ? AND is_active = ?", code, true).First(&discount).Error; err != nil {
		writeError(w, http.StatusNotFound, "Kode promo tidak valid")
		return
	}
	now := time.Now().UTC()
	if discount.ValidUntil != nil && discount.ValidUntil.Before(now) {
		writeError(w, http.StatusBadRequest, "Kode promo sudah kadaluarsa")
		return
	}
	if discount.UsageLimit != nil && discount.UsageCount >= *discount.UsageLimit {
		writeError(w, http.StatusBadRequest, "Kode promo sudah habis")
		return
	}
	if subtotal < discount.MinPurchase {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Minimum pembelian Rp %d untuk promo ini", discount.MinPurchase))
		return
	}
	discountAmount := 0
	if subtotal > 0 {
		discountAmount = discount.CalculateDiscount(subtotal)
	}
	writeJSON(w, http.StatusOK, map[string]any{"discount": discount.ToMap(), "discount_amount": discountAmount, "final_total": subtotal - discountAmount})
}

func (h *Handler) createDiscount(w http.ResponseWriter, r *http.Request) {
	var req discountCreateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	if req.Code == "" || req.Name == "" || req.Value < 0 || req.MinPurchase < 0 {
		writeError(w, http.StatusBadRequest, "Data diskon tidak valid")
		return
	}
	if req.DiscountType == "" {
		req.DiscountType = "percentage"
	}
	if req.DiscountType != "percentage" && req.DiscountType != "fixed" {
		writeError(w, http.StatusBadRequest, "Tipe diskon harus 'percentage' atau 'fixed'")
		return
	}
	code := strings.ToUpper(strings.TrimSpace(req.Code))
	var existing models.Discount
	if err := h.DB.Where("code = ?", code).First(&existing).Error; err == nil {
		writeError(w, http.StatusBadRequest, "Kode promo sudah ada")
		return
	}
	validUntil, err := parseOptionalISOTime(valueOrEmpty(req.ValidUntil))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Format tanggal tidak valid")
		return
	}
	discount := models.Discount{Code: code, Name: req.Name, DiscountType: req.DiscountType, Value: req.Value, MinPurchase: req.MinPurchase, MaxDiscount: req.MaxDiscount, ValidUntil: validUntil, UsageLimit: req.UsageLimit, IsActive: true, ValidFrom: time.Now().UTC()}
	if err := h.DB.Create(&discount).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat diskon")
		return
	}
	writeJSON(w, http.StatusOK, discount.ToMap())
}

func (h *Handler) updateDiscount(w http.ResponseWriter, r *http.Request) {
	discountID, err := parseUintParam(r, "discount_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Diskon tidak valid")
		return
	}
	var req discountUpdateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	var discount models.Discount
	if err := h.DB.First(&discount, discountID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Diskon tidak ditemukan")
		return
	}
	if req.Code != nil {
		code := strings.ToUpper(strings.TrimSpace(*req.Code))
		var existing models.Discount
		if err := h.DB.Where("code = ? AND id <> ?", code, discount.ID).First(&existing).Error; err == nil {
			writeError(w, http.StatusBadRequest, "Kode promo sudah ada")
			return
		}
		discount.Code = code
	}
	if req.Name != nil {
		discount.Name = *req.Name
	}
	if req.DiscountType != nil {
		if *req.DiscountType != "percentage" && *req.DiscountType != "fixed" {
			writeError(w, http.StatusBadRequest, "Tipe diskon tidak valid")
			return
		}
		discount.DiscountType = *req.DiscountType
	}
	if req.Value != nil {
		if *req.Value < 0 {
			writeError(w, http.StatusBadRequest, "Nilai diskon tidak valid")
			return
		}
		discount.Value = *req.Value
	}
	if req.MinPurchase != nil {
		if *req.MinPurchase < 0 {
			writeError(w, http.StatusBadRequest, "Minimum pembelian tidak valid")
			return
		}
		discount.MinPurchase = *req.MinPurchase
	}
	if req.MaxDiscount != nil {
		discount.MaxDiscount = req.MaxDiscount
	}
	if req.IsActive != nil {
		discount.IsActive = *req.IsActive
	}
	if req.ValidUntil != nil {
		validUntil, err := parseOptionalISOTime(*req.ValidUntil)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Format tanggal tidak valid")
			return
		}
		discount.ValidUntil = validUntil
	}
	if req.UsageLimit != nil {
		discount.UsageLimit = req.UsageLimit
	}
	if err := h.DB.Save(&discount).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal update diskon")
		return
	}
	writeJSON(w, http.StatusOK, discount.ToMap())
}

func (h *Handler) deleteDiscount(w http.ResponseWriter, r *http.Request) {
	discountID, err := parseUintParam(r, "discount_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Diskon tidak valid")
		return
	}
	var discount models.Discount
	if err := h.DB.First(&discount, discountID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Diskon tidak ditemukan")
		return
	}
	if err := h.DB.Delete(&discount).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menghapus diskon")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Diskon berhasil dihapus"})
}

func valueOrEmpty(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}
