package database

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"program-kasir-go/internal/config"
	"program-kasir-go/internal/models"
	"program-kasir-go/internal/utils"
)

func Open(cfg config.Config) (*gorm.DB, error) {
	existingDB := false
	if info, err := os.Stat(cfg.DBPath); err == nil && info.Size() > 0 {
		existingDB = true
	}

	if err := os.MkdirAll(filepath.Dir(cfg.DBPath), 0o755); err != nil && filepath.Dir(cfg.DBPath) != "." {
		return nil, fmt.Errorf("create db dir: %w", err)
	}
	if err := os.MkdirAll(filepath.Join(cfg.UploadDir, "products"), 0o755); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}

	db, err := gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxOpenConns(1)
	}

	if !existingDB {
		if err := db.AutoMigrate(
			&models.User{},
			&models.Product{},
			&models.ProductBarcode{},
			&models.Discount{},
			&models.Customer{},
			&models.Transaction{},
			&models.TransactionItem{},
			&models.CustomerDebt{},
			&models.ActivityLog{},
		); err != nil {
			return nil, err
		}
	}

	if err := seedDefaults(db); err != nil {
		return nil, err
	}

	return db, nil
}

func seedDefaults(db *gorm.DB) error {
	var userCount int64
	if err := db.Model(&models.User{}).Count(&userCount).Error; err != nil {
		return err
	}
	if userCount == 0 {
		adminHash, _ := utils.HashPassword("admin123")
		kasirHash, _ := utils.HashPassword("kasir123")
		users := []models.User{
			{Username: "admin", PasswordHash: adminHash, FullName: "Administrator", Role: "admin", IsActive: true},
			{Username: "kasir", PasswordHash: kasirHash, FullName: "Kasir 1", Role: "kasir", IsActive: true},
		}
		if err := db.Create(&users).Error; err != nil {
			return err
		}
	}

	var productCount int64
	if err := db.Model(&models.Product{}).Count(&productCount).Error; err != nil {
		return err
	}
	if productCount == 0 {
		products := []models.Product{
			{Name: "Nasi Goreng", Price: 15000, Stock: 50, Category: "Makanan", Emoji: "🍛", IsActive: true},
			{Name: "Mie Ayam", Price: 12000, Stock: 45, Category: "Makanan", Emoji: "🍜", IsActive: true},
			{Name: "Bakso", Price: 13000, Stock: 40, Category: "Makanan", Emoji: "🍲", IsActive: true},
			{Name: "Soto Ayam", Price: 14000, Stock: 50, Category: "Makanan", Emoji: "🍵", IsActive: true},
			{Name: "Ayam Geprek", Price: 18000, Stock: 30, Category: "Makanan", Emoji: "🍗", IsActive: true},
			{Name: "Nasi Padang", Price: 25000, Stock: 30, Category: "Makanan", Emoji: "🍛", IsActive: true},
			{Name: "Es Teh", Price: 5000, Stock: 100, Category: "Minuman", Emoji: "🧊", IsActive: true},
			{Name: "Es Jeruk", Price: 6000, Stock: 100, Category: "Minuman", Emoji: "🍊", IsActive: true},
			{Name: "Kopi", Price: 7000, Stock: 100, Category: "Minuman", Emoji: "☕", IsActive: true},
			{Name: "Air Mineral", Price: 4000, Stock: 200, Category: "Minuman", Emoji: "💧", IsActive: true},
			{Name: "Jus Alpukat", Price: 12000, Stock: 50, Category: "Minuman", Emoji: "🥤", IsActive: true},
			{Name: "Kerupuk", Price: 3000, Stock: 100, Category: "Snack", Emoji: "🍘", IsActive: true, Barcode: strPtr("8991234567201")},
			{Name: "Gorengan", Price: 5000, Stock: 50, Category: "Snack", Emoji: "🍟", IsActive: true, Barcode: strPtr("8991234567202")},
		}
		if err := db.Create(&products).Error; err != nil {
			return err
		}
	}

	var discountCount int64
	if err := db.Model(&models.Discount{}).Count(&discountCount).Error; err != nil {
		return err
	}
	if discountCount == 0 {
		discounts := []models.Discount{
			{Code: "WELCOME10", Name: "Welcome Discount 10%", DiscountType: "percentage", Value: 10, MinPurchase: 50000},
			{Code: "HEMAT5K", Name: "Potongan Rp 5.000", DiscountType: "fixed", Value: 5000, MinPurchase: 30000},
		}
		maxDiscount := 20000
		discounts[0].MaxDiscount = &maxDiscount
		if err := db.Create(&discounts).Error; err != nil {
			return err
		}
	}

	return nil
}

func strPtr(v string) *string { return &v }
