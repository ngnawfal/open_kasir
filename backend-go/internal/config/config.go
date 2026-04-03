package config

import (
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Config struct {
	Port         string
	JWTSecret    string
	TokenTTL     time.Duration
	DBPath       string
	UploadDir    string
	AllowOrigins []string
}

func Load() Config {
	dbPath := firstExistingPath(
		os.Getenv("DB_PATH"),
		filepath.Join("data", "kasir.db"),
		"kasir.db",
	)
	if dbPath == "" {
		dbPath = filepath.Join("data", "kasir.db")
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "uploads"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "kasir-secret-2024"
	}

	allowOrigins := []string{"*"}
	if raw := os.Getenv("ALLOW_ORIGINS"); raw != "" {
		parts := strings.Split(raw, ",")
		allowOrigins = allowOrigins[:0]
		for _, part := range parts {
			trimmed := strings.TrimSpace(part)
			if trimmed != "" {
				allowOrigins = append(allowOrigins, trimmed)
			}
		}
		if len(allowOrigins) == 0 {
			allowOrigins = []string{"*"}
		}
	}

	return Config{
		Port:         port,
		JWTSecret:    secret,
		TokenTTL:     8 * time.Hour,
		DBPath:       dbPath,
		UploadDir:    uploadDir,
		AllowOrigins: allowOrigins,
	}
}

func firstExistingPath(paths ...string) string {
	for _, path := range paths {
		if path == "" {
			continue
		}
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	return ""
}
