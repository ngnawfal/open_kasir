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

type customerCreateRequest struct {
	Name    string  `json:"name"`
	Phone   *string `json:"phone"`
	Email   *string `json:"email"`
	Address *string `json:"address"`
}

type customerUpdateRequest struct {
	Name        *string `json:"name"`
	Phone       *string `json:"phone"`
	Email       *string `json:"email"`
	Address     *string `json:"address"`
	Points      *int    `json:"points"`
	MemberLevel *string `json:"member_level"`
}

type debtPaymentRequest struct {
	Amount int     `json:"amount"`
	Notes  *string `json:"notes"`
}

func (h *Handler) registerCustomerRoutes(r chi.Router) {
	r.With(h.authRequired).Get("/", h.getCustomers)
	r.With(h.authRequired).Post("/", h.createCustomer)
	r.With(h.authRequired).Get("/debts/all", h.getAllDebts)
	r.With(h.authRequired).Get("/{customer_id}", h.getCustomer)
	r.With(h.authRequired).Put("/{customer_id}", h.updateCustomer)
	r.With(h.adminRequired).Delete("/{customer_id}", h.deleteCustomer)
	r.With(h.authRequired).Get("/{customer_id}/debts", h.getCustomerDebts)
	r.With(h.authRequired).Post("/{customer_id}/debts/{debt_id}/pay", h.payDebt)
	r.With(h.authRequired).Post("/{customer_id}/points/add", h.addPoints)
	r.With(h.authRequired).Post("/{customer_id}/points/redeem", h.redeemPoints)
}

func (h *Handler) getCustomers(w http.ResponseWriter, r *http.Request) {
	query := preloadCustomer(h.DB).Where("is_active = ?", true)
	if search := strings.TrimSpace(r.URL.Query().Get("search")); search != "" {
		like := "%" + search + "%"
		query = query.Where("name LIKE ? OR phone LIKE ?", like, like)
	}
	var customers []models.Customer
	if err := query.Order("name").Find(&customers).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil pelanggan")
		return
	}
	response := make([]map[string]any, 0, len(customers))
	hasDebt := boolQuery(r, "has_debt")
	for _, customer := range customers {
		mapped := customer.ToMap()
		if hasDebt != nil {
			debt := mapped["total_debt"].(int)
			if *hasDebt && debt == 0 {
				continue
			}
			if !*hasDebt && debt > 0 {
				continue
			}
		}
		response = append(response, mapped)
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) getCustomer(w http.ResponseWriter, r *http.Request) {
	customer, ok := h.loadCustomerByID(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, customer.ToMap())
}

func (h *Handler) createCustomer(w http.ResponseWriter, r *http.Request) {
	var req customerCreateRequest
	if err := decodeJSON(r, &req); err != nil || strings.TrimSpace(req.Name) == "" {
		writeError(w, http.StatusBadRequest, "Nama pelanggan harus diisi")
		return
	}
	if req.Phone != nil && *req.Phone != "" {
		var existing models.Customer
		if err := h.DB.Where("phone = ?", *req.Phone).First(&existing).Error; err == nil {
			writeError(w, http.StatusBadRequest, "Nomor telepon sudah terdaftar")
			return
		}
	}
	customer := models.Customer{Name: req.Name, Phone: req.Phone, Email: req.Email, Address: req.Address, IsActive: true, MemberLevel: "Bronze"}
	if err := h.DB.Create(&customer).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat pelanggan")
		return
	}
	_ = preloadCustomer(h.DB).First(&customer, customer.ID).Error
	writeJSON(w, http.StatusOK, customer.ToMap())
}

func (h *Handler) updateCustomer(w http.ResponseWriter, r *http.Request) {
	customer, ok := h.loadCustomerByID(w, r)
	if !ok {
		return
	}
	var req customerUpdateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	if req.Name != nil {
		customer.Name = *req.Name
	}
	if req.Phone != nil {
		if *req.Phone != "" {
			var existing models.Customer
			if err := h.DB.Where("phone = ? AND id <> ?", *req.Phone, customer.ID).First(&existing).Error; err == nil {
				writeError(w, http.StatusBadRequest, "Nomor telepon sudah terdaftar")
				return
			}
		}
		customer.Phone = req.Phone
	}
	if req.Email != nil {
		customer.Email = req.Email
	}
	if req.Address != nil {
		customer.Address = req.Address
	}
	if req.Points != nil {
		customer.Points = *req.Points
	}
	if req.MemberLevel != nil {
		customer.MemberLevel = *req.MemberLevel
	}
	if err := h.DB.Save(customer).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal update pelanggan")
		return
	}
	_ = preloadCustomer(h.DB).First(customer, customer.ID).Error
	writeJSON(w, http.StatusOK, customer.ToMap())
}

func (h *Handler) deleteCustomer(w http.ResponseWriter, r *http.Request) {
	customer, ok := h.loadCustomerByID(w, r)
	if !ok {
		return
	}
	customer.IsActive = false
	if err := h.DB.Save(customer).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menghapus pelanggan")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Pelanggan berhasil dihapus"})
}

func (h *Handler) getCustomerDebts(w http.ResponseWriter, r *http.Request) {
	customerID, err := parseUintParam(r, "customer_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Pelanggan tidak valid")
		return
	}
	var debts []models.CustomerDebt
	if err := h.DB.Preload("Customer").Where("customer_id = ?", customerID).Order("created_at desc").Find(&debts).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil hutang")
		return
	}
	response := make([]map[string]any, 0, len(debts))
	for _, debt := range debts {
		response = append(response, debt.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) payDebt(w http.ResponseWriter, r *http.Request) {
	customerID, err := parseUintParam(r, "customer_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Pelanggan tidak valid")
		return
	}
	debtID, err := parseUintParam(r, "debt_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Hutang tidak valid")
		return
	}
	var req debtPaymentRequest
	if err := decodeJSON(r, &req); err != nil || req.Amount <= 0 {
		writeError(w, http.StatusBadRequest, "Jumlah pembayaran tidak valid")
		return
	}
	var debt models.CustomerDebt
	if err := h.DB.Preload("Customer").Where("id = ? AND customer_id = ?", debtID, customerID).First(&debt).Error; err != nil {
		writeError(w, http.StatusNotFound, "Hutang tidak ditemukan")
		return
	}
	if debt.IsPaid {
		writeError(w, http.StatusBadRequest, "Hutang sudah lunas")
		return
	}
	remaining := debt.Amount - debt.Paid
	if req.Amount > remaining {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Pembayaran melebihi sisa hutang (Rp %d)", remaining))
		return
	}
	debt.Paid += req.Amount
	if debt.Paid >= debt.Amount {
		debt.IsPaid = true
		now := time.Now().UTC()
		debt.PaidAt = &now
	}
	if req.Notes != nil && *req.Notes != "" {
		note := strings.TrimSpace(firstString(debt.Notes, "") + "\n[Bayar Rp " + strconv.Itoa(req.Amount) + "] " + *req.Notes)
		debt.Notes = &note
	}
	if err := h.DB.Save(&debt).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membayar hutang")
		return
	}
	writeJSON(w, http.StatusOK, debt.ToMap())
}

func (h *Handler) getAllDebts(w http.ResponseWriter, r *http.Request) {
	query := h.DB.Preload("Customer")
	if unpaidOnly := boolQuery(r, "unpaid_only"); unpaidOnly == nil || *unpaidOnly {
		query = query.Where("is_paid = ?", false)
	}
	var debts []models.CustomerDebt
	if err := query.Order("created_at desc").Find(&debts).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil semua hutang")
		return
	}
	response := make([]map[string]any, 0, len(debts))
	for _, debt := range debts {
		response = append(response, debt.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) addPoints(w http.ResponseWriter, r *http.Request) {
	customer, ok := h.loadCustomerByID(w, r)
	if !ok {
		return
	}
	points, err := strconv.Atoi(r.URL.Query().Get("points"))
	if err != nil {
		if err := decodeJSON(r, &struct {
			Points *int `json:"points"`
		}{Points: &points}); err != nil {
			writeError(w, http.StatusBadRequest, "Poin tidak valid")
			return
		}
	}
	if points < 0 {
		writeError(w, http.StatusBadRequest, "Poin tidak valid")
		return
	}
	customer.Points += points
	updateMemberLevel(customer)
	if err := h.DB.Save(customer).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menambah poin")
		return
	}
	writeJSON(w, http.StatusOK, customer.ToMap())
}

func (h *Handler) redeemPoints(w http.ResponseWriter, r *http.Request) {
	customer, ok := h.loadCustomerByID(w, r)
	if !ok {
		return
	}
	var body struct {
		Points int `json:"points"`
	}
	if err := decodeJSON(r, &body); err != nil || body.Points <= 0 {
		writeError(w, http.StatusBadRequest, "Poin tidak valid")
		return
	}
	if body.Points > customer.Points {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Poin tidak cukup (tersedia: %d)", customer.Points))
		return
	}
	customer.Points -= body.Points
	if err := h.DB.Save(customer).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal tukar poin")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": fmt.Sprintf("Berhasil tukar %d poin", body.Points), "discount_value": body.Points * 100, "remaining_points": customer.Points})
}

func (h *Handler) loadCustomerByID(w http.ResponseWriter, r *http.Request) (*models.Customer, bool) {
	customerID, err := parseUintParam(r, "customer_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Pelanggan tidak valid")
		return nil, false
	}
	var customer models.Customer
	if err := preloadCustomer(h.DB).First(&customer, customerID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Pelanggan tidak ditemukan")
		return nil, false
	}
	return &customer, true
}
