package httpapi

import (
	"bytes"
	"encoding/csv"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/xuri/excelize/v2"

	"program-kasir-go/internal/models"
)

func (h *Handler) registerReportRoutes(r chi.Router) {
	r.With(h.adminRequired).Get("/daily", h.dailyReport)
	r.With(h.adminRequired).Get("/monthly", h.monthlyReport)
	r.With(h.adminRequired).Get("/best-sellers", h.bestSellers)
	r.With(h.adminRequired).Get("/summary", h.summary)
}

func (h *Handler) registerExportRoutes(r chi.Router) {
	r.With(h.adminRequired).Get("/products/csv", h.exportProductsCSV)
	r.With(h.adminRequired).Get("/transactions/csv", h.exportTransactionsCSV)
	r.With(h.adminRequired).Get("/inventory/csv", h.exportInventoryCSV)
	r.With(h.adminRequired).Get("/profit", h.profitReport)
	r.With(h.authRequired).Get("/low-stock", h.exportLowStock)
	r.With(h.adminRequired).Get("/activity-log", h.activityLog)
	r.With(h.adminRequired).Get("/excel/transactions", h.exportTransactionsExcel)
	r.With(h.adminRequired).Get("/excel/products", h.exportProductsExcel)
}

func (h *Handler) dailyReport(w http.ResponseWriter, r *http.Request) {
	reportDate := time.Now().UTC()
	if raw := r.URL.Query().Get("date"); raw != "" {
		if parsed, err := parseDateOrDateTime(raw); err == nil && parsed != nil {
			reportDate = *parsed
		}
	}
	start := time.Date(reportDate.Year(), reportDate.Month(), reportDate.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24*time.Hour - time.Nanosecond)
	var transactions []models.Transaction
	if err := preloadTransaction(h.DB).Where("created_at >= ? AND created_at <= ?", start, end).Find(&transactions).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil laporan harian")
		return
	}
	totalSales, totalDiscount, totalItems := 0, 0, 0
	paymentMethods := map[string]map[string]int{}
	hourly := map[int]map[string]int{}
	for _, tx := range transactions {
		totalSales += tx.Total
		totalDiscount += tx.DiscountAmount
		for _, item := range tx.Items {
			totalItems += item.Quantity
		}
		if _, ok := paymentMethods[tx.PaymentMethod]; !ok {
			paymentMethods[tx.PaymentMethod] = map[string]int{"count": 0, "total": 0}
		}
		paymentMethods[tx.PaymentMethod]["count"]++
		paymentMethods[tx.PaymentMethod]["total"] += tx.Total
		hour := tx.CreatedAt.Hour()
		if _, ok := hourly[hour]; !ok {
			hourly[hour] = map[string]int{"count": 0, "total": 0}
		}
		hourly[hour]["count"]++
		hourly[hour]["total"] += tx.Total
	}
	responseTransactions := make([]map[string]any, 0, len(transactions))
	for _, tx := range transactions {
		responseTransactions = append(responseTransactions, tx.ToMap())
	}
	average := 0
	if len(transactions) > 0 {
		average = totalSales / len(transactions)
	}
	writeJSON(w, http.StatusOK, map[string]any{"date": start.Format("2006-01-02"), "summary": map[string]any{"total_sales": totalSales, "total_transactions": len(transactions), "total_items_sold": totalItems, "total_discount": totalDiscount, "average_transaction": average}, "payment_methods": paymentMethods, "hourly_sales": hourly, "transactions": responseTransactions})
}

func (h *Handler) monthlyReport(w http.ResponseWriter, r *http.Request) {
	now := time.Now().UTC()
	year, _ := strconv.Atoi(r.URL.Query().Get("year"))
	month, _ := strconv.Atoi(r.URL.Query().Get("month"))
	if year == 0 {
		year = now.Year()
	}
	if month == 0 {
		month = int(now.Month())
	}
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)
	var transactions []models.Transaction
	if err := preloadTransaction(h.DB).Where("created_at >= ? AND created_at < ?", start, end).Find(&transactions).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil laporan bulanan")
		return
	}
	totalSales, totalDiscount := 0, 0
	daily := map[int]map[string]int{}
	paymentMethods := map[string]map[string]int{}
	for _, tx := range transactions {
		totalSales += tx.Total
		totalDiscount += tx.DiscountAmount
		day := tx.CreatedAt.Day()
		if _, ok := daily[day]; !ok {
			daily[day] = map[string]int{"count": 0, "total": 0}
		}
		daily[day]["count"]++
		daily[day]["total"] += tx.Total
		if _, ok := paymentMethods[tx.PaymentMethod]; !ok {
			paymentMethods[tx.PaymentMethod] = map[string]int{"count": 0, "total": 0}
		}
		paymentMethods[tx.PaymentMethod]["count"]++
		paymentMethods[tx.PaymentMethod]["total"] += tx.Total
	}
	averageDaily := 0
	if totalSales > 0 {
		averageDaily = totalSales / 30
	}
	averageTransaction := 0
	if len(transactions) > 0 {
		averageTransaction = totalSales / len(transactions)
	}
	writeJSON(w, http.StatusOK, map[string]any{"year": year, "month": month, "summary": map[string]any{"total_sales": totalSales, "total_transactions": len(transactions), "total_discount": totalDiscount, "average_daily": averageDaily, "average_transaction": averageTransaction}, "payment_methods": paymentMethods, "daily_sales": daily})
}

func (h *Handler) bestSellers(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 10
	}
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	if days <= 0 {
		days = 30
	}
	startDate := time.Now().UTC().AddDate(0, 0, -days)
	var items []models.TransactionItem
	if err := h.DB.Joins("JOIN transactions ON transactions.id = transaction_items.transaction_id").Where("transactions.created_at >= ?", startDate).Find(&items).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil best seller")
		return
	}
	type aggregate struct {
		ProductID   uint
		ProductName string
		Quantity    int
		Revenue     int
	}
	agg := map[uint]*aggregate{}
	for _, item := range items {
		entry, ok := agg[item.ProductID]
		if !ok {
			entry = &aggregate{ProductID: item.ProductID, ProductName: item.ProductName}
			agg[item.ProductID] = entry
		}
		entry.Quantity += item.Quantity
		entry.Revenue += item.Quantity * item.PriceAtSale
	}
	list := make([]aggregate, 0, len(agg))
	for _, item := range agg {
		list = append(list, *item)
	}
	sort.Slice(list, func(i, j int) bool { return list[i].Quantity > list[j].Quantity })
	if len(list) > limit {
		list = list[:limit]
	}
	response := make([]map[string]any, 0, len(list))
	for _, item := range list {
		var product models.Product
		_ = h.DB.First(&product, item.ProductID).Error
		emoji := "🍽️"
		stock := 0
		if product.ID != 0 {
			emoji = product.Emoji
			stock = product.Stock
		}
		response = append(response, map[string]any{"product_id": item.ProductID, "product_name": item.ProductName, "emoji": emoji, "total_quantity": item.Quantity, "total_revenue": item.Revenue, "current_stock": stock})
	}
	writeJSON(w, http.StatusOK, map[string]any{"period_days": days, "start_date": startDate.Format(time.RFC3339), "end_date": time.Now().UTC().Format(time.RFC3339), "best_sellers": response})
}

func (h *Handler) summary(w http.ResponseWriter, r *http.Request) {
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	var todayTx, monthTx []models.Transaction
	_ = h.DB.Where("created_at >= ?", todayStart).Find(&todayTx).Error
	_ = h.DB.Where("created_at >= ?", monthStart).Find(&monthTx).Error
	todaySales, monthSales := 0, 0
	for _, tx := range todayTx {
		todaySales += tx.Total
	}
	for _, tx := range monthTx {
		monthSales += tx.Total
	}
	var totalProducts, lowStock, activeDiscounts int64
	h.DB.Model(&models.Product{}).Where("is_active = ?", true).Count(&totalProducts)
	h.DB.Model(&models.Product{}).Where("is_active = ? AND stock <= ?", true, 5).Count(&lowStock)
	h.DB.Model(&models.Discount{}).Where("is_active = ?", true).Count(&activeDiscounts)
	writeJSON(w, http.StatusOK, map[string]any{"today": map[string]any{"sales": todaySales, "transactions": len(todayTx)}, "this_month": map[string]any{"sales": monthSales, "transactions": len(monthTx)}, "products": map[string]any{"total": totalProducts, "low_stock": lowStock}, "discounts": map[string]any{"active": activeDiscounts}})
}

func (h *Handler) exportProductsCSV(w http.ResponseWriter, r *http.Request) {
	var products []models.Product
	if err := h.DB.Where("is_active = ?", true).Find(&products).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal export produk")
		return
	}
	rows := [][]string{{"ID", "Barcode", "Nama", "Harga Jual", "Harga Modal", "Stok", "Min Stok", "Kategori", "Status Stok"}}
	for _, p := range products {
		status := "OK"
		if p.Stock <= p.MinStock {
			status = "RENDAH"
		}
		rows = append(rows, []string{strconv.Itoa(int(p.ID)), valueString(p.Barcode), p.Name, strconv.Itoa(p.Price), strconv.Itoa(p.CostPrice), strconv.Itoa(p.Stock), strconv.Itoa(p.MinStock), p.Category, status})
	}
	h.writeCSV(w, "produk_"+time.Now().Format("20060102")+".csv", rows)
}

func (h *Handler) exportTransactionsCSV(w http.ResponseWriter, r *http.Request) {
	query := preloadTransaction(h.DB)
	if raw := r.URL.Query().Get("start_date"); raw != "" {
		if t, err := parseDateOrDateTime(raw); err == nil && t != nil {
			query = query.Where("created_at >= ?", *t)
		}
	}
	if raw := r.URL.Query().Get("end_date"); raw != "" {
		if t, err := parseDateOrDateTime(raw); err == nil && t != nil {
			query = query.Where("created_at <= ?", *t)
		}
	}
	var transactions []models.Transaction
	if err := query.Order("created_at desc").Find(&transactions).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal export transaksi")
		return
	}
	rows := [][]string{{"ID", "Tanggal", "Kasir", "Pelanggan", "Subtotal", "Diskon", "Total", "Modal", "Laba", "Metode Bayar", "Hutang"}}
	for _, t := range transactions {
		userName, customerName := "-", "-"
		if t.User != nil {
			userName = t.User.FullName
		}
		if t.Customer != nil {
			customerName = t.Customer.Name
		}
		debt := "Tidak"
		if t.IsDebt {
			debt = "Ya"
		}
		rows = append(rows, []string{strconv.Itoa(int(t.ID)), t.CreatedAt.Format("2006-01-02 15:04"), userName, customerName, strconv.Itoa(t.Subtotal), strconv.Itoa(t.DiscountAmount), strconv.Itoa(t.Total), strconv.Itoa(t.CostTotal), strconv.Itoa(t.Total - t.CostTotal), t.PaymentMethod, debt})
	}
	h.writeCSV(w, "transaksi_"+time.Now().Format("20060102")+".csv", rows)
}

func (h *Handler) exportInventoryCSV(w http.ResponseWriter, r *http.Request) {
	var products []models.Product
	if err := h.DB.Where("is_active = ?", true).Order("stock asc").Find(&products).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal export inventaris")
		return
	}
	rows := [][]string{{"Nama", "Barcode", "Stok", "Min Stok", "Status", "Harga Jual", "Nilai Stok"}}
	for _, p := range products {
		status := "OK"
		if p.Stock <= p.MinStock {
			status = "⚠️ RENDAH"
		}
		rows = append(rows, []string{p.Name, valueString(p.Barcode), strconv.Itoa(p.Stock), strconv.Itoa(p.MinStock), status, strconv.Itoa(p.Price), strconv.Itoa(p.Stock * p.Price)})
	}
	h.writeCSV(w, "inventaris_"+time.Now().Format("20060102")+".csv", rows)
}

func (h *Handler) profitReport(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "daily"
	}
	now := time.Now().UTC()
	start := now.Add(-24 * time.Hour)
	switch period {
	case "daily":
		start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	case "weekly":
		start = now.AddDate(0, 0, -7)
	case "monthly":
		start = now.AddDate(0, 0, -30)
	}
	var transactions []models.Transaction
	if err := h.DB.Where("created_at >= ?", start).Find(&transactions).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil laporan laba rugi")
		return
	}
	revenue, cost, discount := 0, 0, 0
	byMethod := map[string]map[string]int{}
	for _, tx := range transactions {
		revenue += tx.Total
		cost += tx.CostTotal
		discount += tx.DiscountAmount
		if _, ok := byMethod[tx.PaymentMethod]; !ok {
			byMethod[tx.PaymentMethod] = map[string]int{"count": 0, "total": 0, "profit": 0}
		}
		byMethod[tx.PaymentMethod]["count"]++
		byMethod[tx.PaymentMethod]["total"] += tx.Total
		byMethod[tx.PaymentMethod]["profit"] += tx.Total - tx.CostTotal
	}
	profit := revenue - cost
	margin := 0.0
	if revenue > 0 {
		margin = float64(profit) / float64(revenue) * 100
	}
	writeJSON(w, http.StatusOK, map[string]any{"period": period, "start_date": start.Format(time.RFC3339), "end_date": now.Format(time.RFC3339), "transaction_count": len(transactions), "total_revenue": revenue, "total_cost": cost, "total_profit": profit, "profit_margin": margin, "total_discount": discount, "by_payment_method": byMethod})
}

func (h *Handler) exportLowStock(w http.ResponseWriter, r *http.Request) {
	var products []models.Product
	if err := preloadProduct(h.DB).Where("is_active = ? AND stock <= min_stock", true).Order("stock asc").Find(&products).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil stok rendah")
		return
	}
	response := make([]map[string]any, 0, len(products))
	for _, product := range products {
		response = append(response, product.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) activityLog(w http.ResponseWriter, r *http.Request) {
	query := h.DB.Preload("User")
	if raw := r.URL.Query().Get("user_id"); raw != "" {
		if userID, err := strconv.Atoi(raw); err == nil {
			query = query.Where("user_id = ?", userID)
		}
	}
	if action := r.URL.Query().Get("action"); action != "" {
		query = query.Where("action = ?", action)
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 100
	}
	var logs []models.ActivityLog
	if err := query.Order("created_at desc").Limit(limit).Find(&logs).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil activity log")
		return
	}
	response := make([]map[string]any, 0, len(logs))
	for _, log := range logs {
		response = append(response, log.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) exportTransactionsExcel(w http.ResponseWriter, r *http.Request) {
	var transactions []models.Transaction
	if err := preloadTransaction(h.DB).Order("created_at desc").Find(&transactions).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal export Excel transaksi")
		return
	}
	f := excelize.NewFile()
	sheet := "Transactions"
	f.SetSheetName("Sheet1", sheet)
	headers := []string{"ID", "Tanggal", "Kasir", "Pelanggan", "Subtotal", "Diskon", "Total", "Modal", "Laba", "Metode"}
	for idx, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(idx+1, 1)
		f.SetCellValue(sheet, cell, header)
	}
	for row, tx := range transactions {
		idx := row + 2
		userName, customerName := "-", "-"
		if tx.User != nil {
			userName = tx.User.FullName
		}
		if tx.Customer != nil {
			customerName = tx.Customer.Name
		}
		values := []any{tx.ID, tx.CreatedAt.Format("2006-01-02 15:04"), userName, customerName, tx.Subtotal, tx.DiscountAmount, tx.Total, tx.CostTotal, tx.Total - tx.CostTotal, tx.PaymentMethod}
		for col, value := range values {
			cell, _ := excelize.CoordinatesToCellName(col+1, idx)
			f.SetCellValue(sheet, cell, value)
		}
	}
	h.writeExcel(w, "laporan_transaksi_"+time.Now().Format("20060102_150405")+".xlsx", f)
}

func (h *Handler) exportProductsExcel(w http.ResponseWriter, r *http.Request) {
	var products []models.Product
	if err := h.DB.Where("is_active = ?", true).Order("category, name").Find(&products).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal export Excel produk")
		return
	}
	f := excelize.NewFile()
	sheet := "Products"
	f.SetSheetName("Sheet1", sheet)
	headers := []string{"ID", "Barcode", "Nama", "Kategori", "Harga Jual", "Harga Modal", "Margin", "Stok", "Min Stok", "Status", "Nilai Stok"}
	for idx, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(idx+1, 1)
		f.SetCellValue(sheet, cell, header)
	}
	for row, product := range products {
		idx := row + 2
		margin := 0.0
		if product.Price > 0 {
			margin = float64(product.Price-product.CostPrice) / float64(product.Price) * 100
		}
		status := "✅ OK"
		if product.Stock <= product.MinStock {
			status = "⚠️ RENDAH"
		}
		values := []any{product.ID, valueString(product.Barcode), product.Name, product.Category, product.Price, product.CostPrice, margin, product.Stock, product.MinStock, status, product.Stock * product.Price}
		for col, value := range values {
			cell, _ := excelize.CoordinatesToCellName(col+1, idx)
			f.SetCellValue(sheet, cell, value)
		}
	}
	h.writeExcel(w, "laporan_produk_"+time.Now().Format("20060102_150405")+".xlsx", f)
}

func (h *Handler) writeCSV(w http.ResponseWriter, filename string, rows [][]string) {
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)
	_ = writer.WriteAll(rows)
	writer.Flush()
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	_, _ = w.Write(buf.Bytes())
}

func (h *Handler) writeExcel(w http.ResponseWriter, filename string, file *excelize.File) {
	buf, err := file.WriteToBuffer()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat file Excel")
		return
	}
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	_, _ = w.Write(buf.Bytes())
}

func valueString(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}
