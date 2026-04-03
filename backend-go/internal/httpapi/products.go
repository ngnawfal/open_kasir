package httpapi

import (
	"bytes"
	"fmt"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/code128"
	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"program-kasir-go/internal/models"
)

type productCreateRequest struct {
	Barcode   *string `json:"barcode"`
	Name      string  `json:"name"`
	Price     int     `json:"price"`
	CostPrice int     `json:"cost_price"`
	Stock     int     `json:"stock"`
	MinStock  int     `json:"min_stock"`
	Category  string  `json:"category"`
	Emoji     string  `json:"emoji"`
}

type productUpdateRequest struct {
	Barcode   *string `json:"barcode"`
	Name      *string `json:"name"`
	Price     *int    `json:"price"`
	CostPrice *int    `json:"cost_price"`
	Stock     *int    `json:"stock"`
	MinStock  *int    `json:"min_stock"`
	Category  *string `json:"category"`
	Emoji     *string `json:"emoji"`
	IsActive  *bool   `json:"is_active"`
}

type stockAdjustRequest struct {
	Quantity int     `json:"quantity"`
	Reason   *string `json:"reason"`
}

type barcodeAliasRequest struct {
	Barcode     string  `json:"barcode"`
	Description *string `json:"description"`
}

func (h *Handler) registerProductRoutes(r chi.Router) {
	r.Get("/", h.getProducts)
	r.Get("/categories", h.getCategories)
	r.Get("/low-stock", h.getLowStockProducts)
	r.Get("/barcode/{code}", h.getProductByBarcode)
	r.Get("/{product_id}", h.getProduct)
	r.Get("/{product_id}/barcode-image", h.getProductBarcodeImage)
	r.Get("/{product_id}/barcode-svg", h.getProductBarcodeSVG)
	r.Get("/{product_id}/barcodes", h.getProductBarcodes)
	r.With(h.adminRequired).Post("/", h.createProduct)
	r.With(h.adminRequired).Put("/{product_id}", h.updateProduct)
	r.With(h.adminRequired).Put("/{product_id}/stock", h.adjustStock)
	r.With(h.adminRequired).Delete("/{product_id}", h.deleteProduct)
	r.With(h.adminRequired).Post("/{product_id}/upload-image", h.uploadProductImage)
	r.With(h.adminRequired).Delete("/{product_id}/image", h.deleteProductImage)
	r.With(h.adminRequired).Post("/{product_id}/barcodes", h.addBarcodeAlias)
	r.With(h.adminRequired).Delete("/{product_id}/barcodes/{barcode_id}", h.deleteBarcodeAlias)
}

func (h *Handler) getProducts(w http.ResponseWriter, r *http.Request) {
	query := preloadProduct(h.DB).Where("is_active = ?", true)
	if search := strings.TrimSpace(r.URL.Query().Get("search")); search != "" {
		like := "%" + search + "%"
		query = query.Where("name LIKE ? OR barcode LIKE ?", like, like)
	}
	if category := strings.TrimSpace(r.URL.Query().Get("category")); category != "" {
		query = query.Where("category = ?", category)
	}
	if lowStock := boolQuery(r, "low_stock"); lowStock != nil && *lowStock {
		query = query.Where("stock <= ?", 5)
	}
	var products []models.Product
	if err := query.Order("name").Find(&products).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil produk")
		return
	}
	response := make([]map[string]any, 0, len(products))
	for _, product := range products {
		response = append(response, product.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) getCategories(w http.ResponseWriter, r *http.Request) {
	type categoryRow struct{ Category string }
	var rows []categoryRow
	if err := h.DB.Model(&models.Product{}).Distinct("category").Where("category <> ''").Find(&rows).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil kategori")
		return
	}
	response := make([]string, 0, len(rows))
	for _, row := range rows {
		response = append(response, row.Category)
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) getLowStockProducts(w http.ResponseWriter, r *http.Request) {
	var products []models.Product
	if err := preloadProduct(h.DB).Where("is_active = ? AND stock <= min_stock", true).Find(&products).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil stok rendah")
		return
	}
	response := make([]map[string]any, 0, len(products))
	for _, product := range products {
		response = append(response, product.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) getProduct(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, product.ToMap())
}

func (h *Handler) getProductByBarcode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	var product models.Product
	err := preloadProduct(h.DB).Where("barcode = ? AND is_active = ?", code, true).First(&product).Error
	if err == gorm.ErrRecordNotFound {
		var alias models.ProductBarcode
		if err := h.DB.Where("barcode = ?", code).First(&alias).Error; err != nil {
			writeError(w, http.StatusNotFound, "Produk tidak ditemukan")
			return
		}
		if err := preloadProduct(h.DB).Where("id = ? AND is_active = ?", alias.ProductID, true).First(&product).Error; err != nil {
			writeError(w, http.StatusNotFound, "Produk tidak ditemukan")
			return
		}
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil produk")
		return
	}
	writeJSON(w, http.StatusOK, product.ToMap())
}

func (h *Handler) createProduct(w http.ResponseWriter, r *http.Request) {
	var req productCreateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	if req.Name == "" || req.Price < 0 || req.CostPrice < 0 || req.Stock < 0 || req.MinStock < 0 {
		writeError(w, http.StatusBadRequest, "Data produk tidak valid")
		return
	}
	if req.Category == "" {
		req.Category = "Makanan"
	}
	if req.Emoji == "" {
		req.Emoji = "🍽️"
	}
	if req.Barcode != nil && *req.Barcode != "" {
		var existing models.Product
		if err := h.DB.Where("barcode = ?", *req.Barcode).First(&existing).Error; err == nil {
			writeError(w, http.StatusBadRequest, "Barcode sudah digunakan")
			return
		}
	}
	product := models.Product{Barcode: req.Barcode, Name: req.Name, Price: req.Price, CostPrice: req.CostPrice, Stock: req.Stock, MinStock: req.MinStock, Category: req.Category, Emoji: req.Emoji, IsActive: true}
	if err := h.DB.Create(&product).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat produk")
		return
	}
	_ = preloadProduct(h.DB).First(&product, product.ID).Error
	writeJSON(w, http.StatusOK, product.ToMap())
}

func (h *Handler) updateProduct(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	var req productUpdateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	if req.Barcode != nil && *req.Barcode != "" {
		var existing models.Product
		if err := h.DB.Where("barcode = ? AND id <> ?", *req.Barcode, product.ID).First(&existing).Error; err == nil {
			writeError(w, http.StatusBadRequest, "Barcode sudah digunakan")
			return
		}
		product.Barcode = req.Barcode
	}
	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Price != nil {
		if *req.Price < 0 {
			writeError(w, http.StatusBadRequest, "Harga tidak valid")
			return
		}
		product.Price = *req.Price
	}
	if req.CostPrice != nil {
		if *req.CostPrice < 0 {
			writeError(w, http.StatusBadRequest, "Harga modal tidak valid")
			return
		}
		product.CostPrice = *req.CostPrice
	}
	if req.Stock != nil {
		if *req.Stock < 0 {
			writeError(w, http.StatusBadRequest, "Stok tidak valid")
			return
		}
		product.Stock = *req.Stock
	}
	if req.MinStock != nil {
		if *req.MinStock < 0 {
			writeError(w, http.StatusBadRequest, "Min stok tidak valid")
			return
		}
		product.MinStock = *req.MinStock
	}
	if req.Category != nil {
		product.Category = *req.Category
	}
	if req.Emoji != nil {
		product.Emoji = *req.Emoji
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}
	if err := h.DB.Save(product).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal update produk")
		return
	}
	_ = preloadProduct(h.DB).First(product, product.ID).Error
	writeJSON(w, http.StatusOK, product.ToMap())
}

func (h *Handler) adjustStock(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	var req stockAdjustRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	newStock := product.Stock + req.Quantity
	if newStock < 0 {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Stok tidak cukup. Stok saat ini: %d", product.Stock))
		return
	}
	product.Stock = newStock
	if err := h.DB.Save(product).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal update stok")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"product": product.ToMap(), "adjustment": req.Quantity, "reason": req.Reason})
}

func (h *Handler) deleteProduct(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	product.IsActive = false
	if err := h.DB.Save(product).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menghapus produk")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Produk berhasil dihapus"})
}

func (h *Handler) getProductBarcodeImage(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	codeValue := product.Name
	if product.Barcode != nil && *product.Barcode != "" {
		codeValue = *product.Barcode
	} else {
		codeValue = fmt.Sprintf("P%012d", product.ID)
	}
	code, err := code128.Encode(codeValue)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat barcode")
		return
	}
	scaled, err := barcode.Scale(code, 320, 100)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat barcode")
		return
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, scaled); err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat barcode")
		return
	}
	w.Header().Set("Content-Type", "image/png")
	_, _ = w.Write(buf.Bytes())
}

func (h *Handler) getProductBarcodeSVG(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	codeValue := fmt.Sprintf("P%012d", product.ID)
	if product.Barcode != nil && *product.Barcode != "" {
		codeValue = *product.Barcode
	}
	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120"><rect width="100%%" height="100%%" fill="white"/><text x="20" y="50" font-family="monospace" font-size="22">%s</text><text x="20" y="90" font-family="sans-serif" font-size="14">Barcode preview</text></svg>`, codeValue)
	w.Header().Set("Content-Type", "image/svg+xml")
	_, _ = w.Write([]byte(svg))
}

func (h *Handler) uploadProductImage(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "File tidak ditemukan")
		return
	}
	defer file.Close()
	contentType, data, err := readUpload(file, header)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	allowed := map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true, "image/gif": true}
	if !allowed[contentType] {
		writeError(w, http.StatusBadRequest, "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF")
		return
	}
	filename := fmt.Sprintf("%d_%d%s", product.ID, timeNowUnix(), filepath.Ext(header.Filename))
	if filepath.Ext(filename) == "" {
		filename += ".jpg"
	}
	fullPath := filepath.Join(h.Config.UploadDir, "products", filename)
	if product.ImageURL != nil && *product.ImageURL != "" {
		old := filepath.Join(h.Config.UploadDir, "products", filepath.Base(*product.ImageURL))
		_ = os.Remove(old)
	}
	if err := os.WriteFile(fullPath, data, 0o644); err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menyimpan gambar")
		return
	}
	imageURL := "/uploads/products/" + filename
	product.ImageURL = &imageURL
	if err := h.DB.Save(product).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal update gambar produk")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Gambar berhasil diupload", "image_url": imageURL, "product": product.ToMap()})
}

func (h *Handler) deleteProductImage(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	if product.ImageURL != nil && *product.ImageURL != "" {
		_ = os.Remove(filepath.Join(h.Config.UploadDir, "products", filepath.Base(*product.ImageURL)))
		product.ImageURL = nil
		_ = h.DB.Save(product).Error
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Gambar berhasil dihapus"})
}

func (h *Handler) getProductBarcodes(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	response := make([]map[string]any, 0, len(product.Barcodes)+1)
	if product.Barcode != nil && *product.Barcode != "" {
		response = append(response, map[string]any{"id": nil, "barcode": *product.Barcode, "is_primary": true, "description": "Barcode utama"})
	}
	for _, alias := range product.Barcodes {
		response = append(response, map[string]any{"id": alias.ID, "barcode": alias.Barcode, "is_primary": false, "description": firstString(alias.Description, "Barcode alternatif")})
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) addBarcodeAlias(w http.ResponseWriter, r *http.Request) {
	product, ok := h.loadProductByID(w, r)
	if !ok {
		return
	}
	var req barcodeAliasRequest
	if err := decodeJSON(r, &req); err != nil || strings.TrimSpace(req.Barcode) == "" {
		writeError(w, http.StatusBadRequest, "Barcode tidak valid")
		return
	}
	var existingMain models.Product
	if err := h.DB.Where("barcode = ?", req.Barcode).First(&existingMain).Error; err == nil {
		writeError(w, http.StatusBadRequest, "Barcode sudah digunakan oleh produk: "+existingMain.Name)
		return
	}
	var existingAlias models.ProductBarcode
	if err := h.DB.Where("barcode = ?", req.Barcode).First(&existingAlias).Error; err == nil {
		var existingProduct models.Product
		_ = h.DB.First(&existingProduct, existingAlias.ProductID).Error
		name := existingProduct.Name
		if name == "" {
			name = "Unknown"
		}
		writeError(w, http.StatusBadRequest, "Barcode sudah digunakan oleh produk: "+name)
		return
	}
	alias := models.ProductBarcode{Barcode: req.Barcode, ProductID: product.ID, Description: req.Description}
	if err := h.DB.Create(&alias).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menambahkan barcode")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Barcode alternatif berhasil ditambahkan", "barcode": alias.ToMap()})
}

func (h *Handler) deleteBarcodeAlias(w http.ResponseWriter, r *http.Request) {
	productID, err := parseUintParam(r, "product_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Produk tidak valid")
		return
	}
	barcodeID, err := parseUintParam(r, "barcode_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Barcode tidak valid")
		return
	}
	var alias models.ProductBarcode
	if err := h.DB.Where("id = ? AND product_id = ?", barcodeID, productID).First(&alias).Error; err != nil {
		writeError(w, http.StatusNotFound, "Barcode tidak ditemukan")
		return
	}
	if err := h.DB.Delete(&alias).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menghapus barcode")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Barcode alternatif berhasil dihapus"})
}

func (h *Handler) loadProductByID(w http.ResponseWriter, r *http.Request) (*models.Product, bool) {
	productID, err := parseUintParam(r, "product_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Produk tidak valid")
		return nil, false
	}
	var product models.Product
	if err := preloadProduct(h.DB).First(&product, productID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Produk tidak ditemukan")
		return nil, false
	}
	return &product, true
}

func readUpload(file multipart.File, header *multipart.FileHeader) (string, []byte, error) {
	data, err := io.ReadAll(io.LimitReader(file, 5*1024*1024+1))
	if err != nil {
		return "", nil, err
	}
	if len(data) > 5*1024*1024 {
		return "", nil, fmt.Errorf("Ukuran file maksimal 5MB")
	}
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}
	return contentType, data, nil
}

func firstString(value *string, fallback string) string {
	if value == nil || *value == "" {
		return fallback
	}
	return *value
}

func timeNowUnix() int64 { return time.Now().UnixNano() / int64(time.Millisecond) }
