package httpapi

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"gorm.io/gorm"

	"program-kasir-go/internal/config"
)

func NewRouter(cfg config.Config, db *gorm.DB) (http.Handler, error) {
	if err := os.MkdirAll(filepath.Join(cfg.UploadDir, "products"), 0o755); err != nil {
		return nil, err
	}
	h := &Handler{DB: db, Config: cfg}
	r := chi.NewRouter()
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"message": "Sistem Kasir API v2.0 (Go)",
			"docs":    nil,
			"endpoints": map[string]any{
				"auth":         "/api/auth",
				"products":     "/api/products",
				"transactions": "/api/transactions",
				"discounts":    "/api/discounts",
				"reports":      "/api/reports",
				"customers":    "/api/customers",
				"export":       "/api/export",
				"users":        "/api/users",
			},
		})
	})
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"status": "healthy", "version": "2.0.0-go"})
	})

	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(cfg.UploadDir))))

	r.Route("/api/auth", h.registerAuthRoutes)
	r.Route("/api/users", h.registerUserRoutes)
	r.Route("/api/products", h.registerProductRoutes)
	r.Route("/api/transactions", h.registerTransactionRoutes)
	r.Route("/api/discounts", h.registerDiscountRoutes)
	r.Route("/api/customers", h.registerCustomerRoutes)
	r.Route("/api/reports", h.registerReportRoutes)
	r.Route("/api/export", h.registerExportRoutes)

	return r, nil
}
