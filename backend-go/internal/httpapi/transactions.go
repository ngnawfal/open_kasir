package httpapi

import (
	"fmt"
	"net/http"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"program-kasir-go/internal/models"
)

type cartItemInput struct {
	ProductID uint `json:"product_id"`
	Quantity  int  `json:"quantity"`
}

type transactionCreateRequest struct {
	Items         []cartItemInput `json:"items"`
	CustomerID    *uint           `json:"customer_id"`
	DiscountCode  *string         `json:"discount_code"`
	PaymentMethod string          `json:"payment_method"`
	Paid          int             `json:"paid"`
	PointsUsed    int             `json:"points_used"`
	Notes         *string         `json:"notes"`
}

func (h *Handler) registerTransactionRoutes(r chi.Router) {
	r.Get("/", h.getTransactions)
	r.Get("/{transaction_id}", h.getTransaction)
	r.With(h.optionalAuth).Post("/", h.createTransaction)
	r.With(h.authRequired).Delete("/{transaction_id}", h.voidTransaction)
}

func (h *Handler) getTransactions(w http.ResponseWriter, r *http.Request) {
	limit := 50
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	query := preloadTransaction(h.DB).Order("created_at desc")
	if raw := r.URL.Query().Get("date_from"); raw != "" {
		if from, err := parseDateOrDateTime(raw); err == nil && from != nil {
			query = query.Where("created_at >= ?", *from)
		}
	}
	if raw := r.URL.Query().Get("date_to"); raw != "" {
		if to, err := parseDateOrDateTime(raw); err == nil && to != nil {
			if isDateOnly(raw) {
				end := time.Date(to.Year(), to.Month(), to.Day(), 23, 59, 59, 0, time.UTC)
				query = query.Where("created_at <= ?", end)
			} else {
				query = query.Where("created_at <= ?", *to)
			}
		}
	}
	if method := strings.TrimSpace(r.URL.Query().Get("payment_method")); method != "" {
		query = query.Where("payment_method = ?", method)
	}
	var transactions []models.Transaction
	if err := query.Limit(limit).Find(&transactions).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil transaksi")
		return
	}
	response := make([]map[string]any, 0, len(transactions))
	for _, transaction := range transactions {
		response = append(response, transaction.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) getTransaction(w http.ResponseWriter, r *http.Request) {
	transactionID, err := parseUintParam(r, "transaction_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Transaksi tidak valid")
		return
	}
	var transaction models.Transaction
	if err := preloadTransaction(h.DB).First(&transaction, transactionID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Transaksi tidak ditemukan")
		return
	}
	writeJSON(w, http.StatusOK, transaction.ToMap())
}

func (h *Handler) createTransaction(w http.ResponseWriter, r *http.Request) {
	var req transactionCreateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	if len(req.Items) == 0 {
		writeError(w, http.StatusBadRequest, "Keranjang kosong")
		return
	}
	if req.PaymentMethod == "" {
		req.PaymentMethod = "cash"
	}
	validMethods := []string{"cash", "qris", "debit", "credit"}
	if !slices.Contains(validMethods, req.PaymentMethod) {
		writeError(w, http.StatusBadRequest, "Metode pembayaran harus salah satu dari: cash, qris, debit, credit")
		return
	}
	if req.Paid < 0 || req.PointsUsed < 0 {
		writeError(w, http.StatusBadRequest, "Pembayaran atau poin tidak valid")
		return
	}

	type itemRuntime struct {
		Product  models.Product
		Quantity int
		Price    int
		Cost     int
	}
	itemsRuntime := make([]itemRuntime, 0, len(req.Items))
	subtotal := 0
	costTotal := 0

	for _, item := range req.Items {
		if item.Quantity <= 0 {
			writeError(w, http.StatusBadRequest, "Quantity harus lebih dari 0")
			return
		}
		var product models.Product
		if err := h.DB.Where("id = ? AND is_active = ?", item.ProductID, true).First(&product).Error; err != nil {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("Produk dengan ID %d tidak ditemukan", item.ProductID))
			return
		}
		if product.Stock < item.Quantity {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("Stok %s tidak cukup. Tersedia: %d", product.Name, product.Stock))
			return
		}
		subtotal += product.Price * item.Quantity
		costTotal += product.CostPrice * item.Quantity
		itemsRuntime = append(itemsRuntime, itemRuntime{Product: product, Quantity: item.Quantity, Price: product.Price, Cost: product.CostPrice})
	}

	var discount *models.Discount
	discountAmount := 0
	if req.DiscountCode != nil && strings.TrimSpace(*req.DiscountCode) != "" {
		var loaded models.Discount
		if err := h.DB.Where("code = ? AND is_active = ?", strings.ToUpper(strings.TrimSpace(*req.DiscountCode)), true).First(&loaded).Error; err != nil {
			writeError(w, http.StatusBadRequest, "Kode promo tidak valid")
			return
		}
		now := time.Now().UTC()
		if loaded.ValidUntil != nil && loaded.ValidUntil.Before(now) {
			writeError(w, http.StatusBadRequest, "Kode promo sudah kadaluarsa")
			return
		}
		if loaded.UsageLimit != nil && loaded.UsageCount >= *loaded.UsageLimit {
			writeError(w, http.StatusBadRequest, "Kode promo sudah habis")
			return
		}
		if subtotal < loaded.MinPurchase {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("Minimum pembelian Rp %d untuk promo ini", loaded.MinPurchase))
			return
		}
		calc := loaded.CalculateDiscount(subtotal)
		discountAmount = calc
		discount = &loaded
	}

	var customer *models.Customer
	pointsDiscount := 0
	if req.CustomerID != nil {
		var loaded models.Customer
		if err := preloadCustomer(h.DB).Where("id = ? AND is_active = ?", *req.CustomerID, true).First(&loaded).Error; err != nil {
			writeError(w, http.StatusBadRequest, "Pelanggan tidak ditemukan")
			return
		}
		if req.PointsUsed > loaded.Points {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("Poin tidak cukup. Tersedia: %d poin", loaded.Points))
			return
		}
		pointsDiscount = req.PointsUsed * 100
		customer = &loaded
	}

	total := subtotal - discountAmount - pointsDiscount
	total = max(total, 0)
	if req.Paid < total {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Pembayaran kurang Rp %d", total-req.Paid))
		return
	}
	change := req.Paid - total

	var transaction models.Transaction
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		transaction = models.Transaction{
			Subtotal:       subtotal,
			DiscountAmount: discountAmount + pointsDiscount,
			Total:          total,
			CostTotal:      costTotal,
			Paid:           req.Paid,
			Change:         change,
			PaymentMethod:  req.PaymentMethod,
			Notes:          req.Notes,
		}
		if user := currentUser(r); user != nil {
			transaction.UserID = &user.ID
		}
		if customer != nil {
			transaction.CustomerID = &customer.ID
		}
		if discount != nil {
			transaction.DiscountID = &discount.ID
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}
		for _, item := range itemsRuntime {
			entry := models.TransactionItem{TransactionID: transaction.ID, ProductID: item.Product.ID, ProductName: item.Product.Name, Quantity: item.Quantity, PriceAtSale: item.Price}
			if err := tx.Create(&entry).Error; err != nil {
				return err
			}
			if err := tx.Model(&models.Product{}).Where("id = ?", item.Product.ID).Update("stock", gorm.Expr("stock - ?", item.Quantity)).Error; err != nil {
				return err
			}
		}
		if discount != nil {
			if err := tx.Model(discount).Update("usage_count", gorm.Expr("usage_count + 1")).Error; err != nil {
				return err
			}
		}
		if customer != nil {
			if req.PointsUsed > 0 {
				customer.Points -= req.PointsUsed
			}
			newPoints := total / 10000
			customer.Points += newPoints
			customer.TotalSpent += total
			updateMemberLevel(customer)
			if err := tx.Save(customer).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal memproses transaksi")
		return
	}
	if err := preloadTransaction(h.DB).First(&transaction, transaction.ID).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal memuat transaksi")
		return
	}
	response := transaction.ToMap()
	if customer != nil {
		response["points_used"] = req.PointsUsed
		response["points_earned"] = total / 10000
		response["customer_points"] = customer.Points
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) voidTransaction(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)
	if user == nil || user.Role != "admin" {
		writeError(w, http.StatusForbidden, "Hanya admin yang bisa membatalkan transaksi")
		return
	}
	transactionID, err := parseUintParam(r, "transaction_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Transaksi tidak valid")
		return
	}
	var transaction models.Transaction
	if err := preloadTransaction(h.DB).First(&transaction, transactionID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Transaksi tidak ditemukan")
		return
	}
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range transaction.Items {
			if err := tx.Model(&models.Product{}).Where("id = ?", item.ProductID).Update("stock", gorm.Expr("stock + ?", item.Quantity)).Error; err != nil {
				return err
			}
		}
		if transaction.DiscountID != nil {
			if err := tx.Model(&models.Discount{}).Where("id = ? AND usage_count > 0", *transaction.DiscountID).Update("usage_count", gorm.Expr("usage_count - 1")).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("transaction_id = ?", transaction.ID).Delete(&models.TransactionItem{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&transaction).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membatalkan transaksi")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Transaksi berhasil dibatalkan"})
}
