package models

import "time"

type User struct {
	ID           uint          `gorm:"primaryKey" json:"id"`
	Username     string        `gorm:"size:50;uniqueIndex;not null" json:"username"`
	PasswordHash string        `gorm:"size:255;not null" json:"-"`
	FullName     string        `gorm:"size:100;not null" json:"full_name"`
	Role         string        `gorm:"size:20;default:kasir" json:"role"`
	IsActive     bool          `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time     `json:"created_at"`
	Transactions []Transaction `json:"-"`
}

func (u User) ToMap() map[string]any {
	return map[string]any{
		"id":         u.ID,
		"username":   u.Username,
		"full_name":  u.FullName,
		"role":       u.Role,
		"is_active":  u.IsActive,
		"created_at": toISOTime(u.CreatedAt),
	}
}

type Product struct {
	ID               uint              `gorm:"primaryKey" json:"id"`
	Barcode          *string           `gorm:"size:50;uniqueIndex" json:"barcode"`
	Name             string            `gorm:"size:100;not null" json:"name"`
	Price            int               `gorm:"not null" json:"price"`
	CostPrice        int               `gorm:"default:0" json:"cost_price"`
	Stock            int               `gorm:"default:0" json:"stock"`
	MinStock         int               `gorm:"default:5" json:"min_stock"`
	Category         string            `gorm:"size:50;default:Makanan" json:"category"`
	Emoji            string            `gorm:"size:20;default:🍽️" json:"emoji"`
	ImageURL         *string           `gorm:"size:255" json:"image_url"`
	IsActive         bool              `gorm:"default:true" json:"is_active"`
	CreatedAt        time.Time         `json:"created_at"`
	UpdatedAt        time.Time         `json:"updated_at"`
	TransactionItems []TransactionItem `json:"-"`
	Barcodes         []ProductBarcode  `json:"-"`
}

func (p Product) ToMap() map[string]any {
	altBarcodes := make([]string, 0, len(p.Barcodes))
	for _, b := range p.Barcodes {
		altBarcodes = append(altBarcodes, b.Barcode)
	}
	return map[string]any{
		"id":           p.ID,
		"barcode":      derefString(p.Barcode),
		"name":         p.Name,
		"price":        p.Price,
		"cost_price":   p.CostPrice,
		"stock":        p.Stock,
		"min_stock":    p.MinStock,
		"is_low_stock": p.Stock <= p.MinStock,
		"category":     p.Category,
		"emoji":        p.Emoji,
		"image_url":    derefString(p.ImageURL),
		"is_active":    p.IsActive,
		"created_at":   toISOTime(p.CreatedAt),
		"updated_at":   toISOTime(p.UpdatedAt),
		"alt_barcodes": altBarcodes,
	}
}

type ProductBarcode struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Barcode     string    `gorm:"size:50;uniqueIndex;not null" json:"barcode"`
	ProductID   uint      `gorm:"not null;index" json:"product_id"`
	Description *string   `gorm:"size:100" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	Product     Product   `json:"-"`
}

func (p ProductBarcode) ToMap() map[string]any {
	return map[string]any{
		"id":          p.ID,
		"barcode":     p.Barcode,
		"product_id":  p.ProductID,
		"description": derefString(p.Description),
		"created_at":  toISOTime(p.CreatedAt),
	}
}

type Discount struct {
	ID           uint          `gorm:"primaryKey" json:"id"`
	Code         string        `gorm:"size:50;uniqueIndex;not null" json:"code"`
	Name         string        `gorm:"size:100;not null" json:"name"`
	DiscountType string        `gorm:"size:20;default:percentage" json:"discount_type"`
	Value        int           `gorm:"not null" json:"value"`
	MinPurchase  int           `gorm:"default:0" json:"min_purchase"`
	MaxDiscount  *int          `json:"max_discount"`
	IsActive     bool          `gorm:"default:true" json:"is_active"`
	ValidFrom    time.Time     `json:"valid_from"`
	ValidUntil   *time.Time    `json:"valid_until"`
	UsageLimit   *int          `json:"usage_limit"`
	UsageCount   int           `gorm:"default:0" json:"usage_count"`
	CreatedAt    time.Time     `json:"created_at"`
	Transactions []Transaction `json:"-"`
}

func (d Discount) ToMap() map[string]any {
	return map[string]any{
		"id":            d.ID,
		"code":          d.Code,
		"name":          d.Name,
		"discount_type": d.DiscountType,
		"value":         d.Value,
		"min_purchase":  d.MinPurchase,
		"max_discount":  derefInt(d.MaxDiscount),
		"is_active":     d.IsActive,
		"valid_from":    toISOTime(d.ValidFrom),
		"valid_until":   toISOTimePtr(d.ValidUntil),
		"usage_limit":   derefInt(d.UsageLimit),
		"usage_count":   d.UsageCount,
		"created_at":    toISOTime(d.CreatedAt),
	}
}

func (d Discount) CalculateDiscount(subtotal int) int {
	if subtotal < d.MinPurchase {
		return 0
	}
	if d.DiscountType == "percentage" {
		discount := subtotal * d.Value / 100
		if d.MaxDiscount != nil && discount > *d.MaxDiscount {
			return *d.MaxDiscount
		}
		return discount
	}
	if d.Value > subtotal {
		return subtotal
	}
	return d.Value
}

type Transaction struct {
	ID             uint              `gorm:"primaryKey" json:"id"`
	UserID         *uint             `gorm:"index" json:"-"`
	CustomerID     *uint             `gorm:"index" json:"-"`
	DiscountID     *uint             `gorm:"index" json:"-"`
	Subtotal       int               `gorm:"not null" json:"subtotal"`
	DiscountAmount int               `gorm:"default:0" json:"discount_amount"`
	Total          int               `gorm:"not null" json:"total"`
	CostTotal      int               `gorm:"default:0" json:"cost_total"`
	Paid           int               `gorm:"not null" json:"paid"`
	Change         int               `gorm:"not null" json:"change"`
	PaymentMethod  string            `gorm:"size:20;default:cash" json:"payment_method"`
	IsDebt         bool              `gorm:"default:false" json:"is_debt"`
	Notes          *string           `gorm:"type:text" json:"notes"`
	CreatedAt      time.Time         `json:"created_at"`
	User           *User             `json:"-"`
	Customer       *Customer         `json:"-"`
	Discount       *Discount         `json:"-"`
	Items          []TransactionItem `json:"-"`
}

func (t Transaction) ToMap() map[string]any {
	items := make([]map[string]any, 0, len(t.Items))
	for _, item := range t.Items {
		items = append(items, item.ToMap())
	}
	var discountCode any
	if t.Discount != nil {
		discountCode = t.Discount.Code
	}
	var customerName any
	if t.Customer != nil {
		customerName = t.Customer.Name
	}
	var userName any
	if t.User != nil {
		userName = t.User.FullName
	}
	return map[string]any{
		"id":              t.ID,
		"user_id":         derefUint(t.UserID),
		"user_name":       userName,
		"customer_id":     derefUint(t.CustomerID),
		"customer_name":   customerName,
		"discount_id":     derefUint(t.DiscountID),
		"discount_code":   discountCode,
		"subtotal":        t.Subtotal,
		"discount_amount": t.DiscountAmount,
		"total":           t.Total,
		"cost_total":      t.CostTotal,
		"profit":          t.Total - t.CostTotal,
		"paid":            t.Paid,
		"change":          t.Change,
		"payment_method":  t.PaymentMethod,
		"is_debt":         t.IsDebt,
		"notes":           derefString(t.Notes),
		"items":           items,
		"created_at":      toISOTime(t.CreatedAt),
	}
}

type TransactionItem struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	TransactionID uint        `gorm:"not null;index" json:"transaction_id"`
	ProductID     uint        `gorm:"not null;index" json:"product_id"`
	ProductName   string      `gorm:"size:100;not null" json:"product_name"`
	Quantity      int         `gorm:"not null" json:"quantity"`
	PriceAtSale   int         `gorm:"not null" json:"price_at_sale"`
	Transaction   Transaction `json:"-"`
	Product       Product     `json:"-"`
}

func (t TransactionItem) ToMap() map[string]any {
	return map[string]any{
		"id":           t.ID,
		"product_id":   t.ProductID,
		"product_name": t.ProductName,
		"quantity":     t.Quantity,
		"price":        t.PriceAtSale,
		"subtotal":     t.Quantity * t.PriceAtSale,
	}
}

type Customer struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"size:100;not null" json:"name"`
	Phone        *string        `gorm:"size:20;uniqueIndex" json:"phone"`
	Email        *string        `gorm:"size:100" json:"email"`
	Address      *string        `gorm:"type:text" json:"address"`
	Points       int            `gorm:"default:0" json:"points"`
	MemberLevel  string         `gorm:"size:20;default:Bronze" json:"member_level"`
	TotalSpent   int            `gorm:"default:0" json:"total_spent"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	Debts        []CustomerDebt `json:"-"`
	Transactions []Transaction  `json:"-"`
}

func (c Customer) ToMap() map[string]any {
	totalDebt := 0
	for _, debt := range c.Debts {
		if !debt.IsPaid {
			totalDebt += debt.Amount - debt.Paid
		}
	}
	return map[string]any{
		"id":           c.ID,
		"name":         c.Name,
		"phone":        derefString(c.Phone),
		"email":        derefString(c.Email),
		"address":      derefString(c.Address),
		"points":       c.Points,
		"member_level": c.MemberLevel,
		"total_spent":  c.TotalSpent,
		"total_debt":   totalDebt,
		"is_active":    c.IsActive,
		"created_at":   toISOTime(c.CreatedAt),
	}
}

type CustomerDebt struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	CustomerID    uint       `gorm:"not null;index" json:"customer_id"`
	TransactionID *uint      `gorm:"index" json:"-"`
	Amount        int        `gorm:"not null" json:"amount"`
	Paid          int        `gorm:"default:0" json:"paid"`
	IsPaid        bool       `gorm:"default:false" json:"is_paid"`
	Notes         *string    `gorm:"type:text" json:"notes"`
	DueDate       *time.Time `json:"due_date"`
	CreatedAt     time.Time  `json:"created_at"`
	PaidAt        *time.Time `json:"paid_at"`
	Customer      *Customer  `json:"-"`
}

func (d CustomerDebt) ToMap() map[string]any {
	var customerName any
	if d.Customer != nil {
		customerName = d.Customer.Name
	}
	return map[string]any{
		"id":             d.ID,
		"customer_id":    d.CustomerID,
		"customer_name":  customerName,
		"transaction_id": derefUint(d.TransactionID),
		"amount":         d.Amount,
		"paid":           d.Paid,
		"remaining":      d.Amount - d.Paid,
		"is_paid":        d.IsPaid,
		"notes":          derefString(d.Notes),
		"due_date":       toISOTimePtr(d.DueDate),
		"created_at":     toISOTime(d.CreatedAt),
		"paid_at":        toISOTimePtr(d.PaidAt),
	}
}

type ActivityLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     *uint     `gorm:"index" json:"-"`
	Action     string    `gorm:"size:50;not null" json:"action"`
	EntityType *string   `gorm:"size:50" json:"entity_type"`
	EntityID   *uint     `json:"entity_id"`
	Details    *string   `gorm:"type:text" json:"details"`
	IPAddress  *string   `gorm:"size:50" json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`
	User       *User     `json:"-"`
}

func (a ActivityLog) ToMap() map[string]any {
	userName := "System"
	if a.User != nil {
		userName = a.User.FullName
	}
	return map[string]any{
		"id":          a.ID,
		"user_id":     derefUint(a.UserID),
		"user_name":   userName,
		"action":      a.Action,
		"entity_type": derefString(a.EntityType),
		"entity_id":   derefUint(a.EntityID),
		"details":     derefString(a.Details),
		"ip_address":  derefString(a.IPAddress),
		"created_at":  toISOTime(a.CreatedAt),
	}
}

func toISOTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

func toISOTimePtr(t *time.Time) any {
	if t == nil || t.IsZero() {
		return nil
	}
	return t.UTC().Format(time.RFC3339)
}

func derefString(v *string) any {
	if v == nil {
		return nil
	}
	return *v
}

func derefInt(v *int) any {
	if v == nil {
		return nil
	}
	return *v
}

func derefUint(v *uint) any {
	if v == nil {
		return nil
	}
	return *v
}
