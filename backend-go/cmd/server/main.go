package main

import (
	"log"
	"net/http"

	"program-kasir-go/internal/config"
	"program-kasir-go/internal/database"
	"program-kasir-go/internal/httpapi"
)

func main() {
	cfg := config.Load()

	db, err := database.Open(cfg)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}

	r, err := httpapi.NewRouter(cfg, db)
	if err != nil {
		log.Fatalf("create router: %v", err)
	}

	log.Printf("Go backend listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
