package httpapi

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"

	"program-kasir-go/internal/models"
	"program-kasir-go/internal/utils"
)

type contextKey string

const userContextKey contextKey = "user"

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type registerRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

func (h *Handler) registerAuthRoutes(r chi.Router) {
	r.Post("/login", h.login)
	r.With(h.adminRequired).Post("/register", h.register)
	r.With(h.authRequired).Get("/me", h.me)
	r.With(h.adminRequired).Get("/users", h.authUsers)
	r.With(h.adminRequired).Put("/users/{user_id}/toggle", h.toggleAuthUser)
}

func (h *Handler) authRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := h.userFromRequest(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Could not validate credentials")
			return
		}
		if !user.IsActive {
			writeError(w, http.StatusForbidden, "User account is deactivated")
			return
		}
		ctx := context.WithValue(r.Context(), userContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *Handler) adminRequired(next http.Handler) http.Handler {
	return h.authRequired(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := currentUser(r)
		if user == nil || user.Role != "admin" {
			writeError(w, http.StatusForbidden, "Admin access required")
			return
		}
		next.ServeHTTP(w, r)
	}))
}

func (h *Handler) optionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := h.userFromRequest(r)
		if err == nil && user != nil && user.IsActive {
			r = r.WithContext(context.WithValue(r.Context(), userContextKey, user))
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}

	var user models.User
	if err := h.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		writeError(w, http.StatusUnauthorized, "Username atau password salah")
		return
	}

	if !utils.VerifyPassword(req.Password, user.PasswordHash) {
		writeError(w, http.StatusUnauthorized, "Username atau password salah")
		return
	}

	if !user.IsActive {
		writeError(w, http.StatusForbidden, "Akun tidak aktif")
		return
	}

	token, err := h.issueToken(user.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat token")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"access_token": token,
		"token_type":   "bearer",
		"user":         user.ToMap(),
	})
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	if req.Username == "" || req.Password == "" || req.FullName == "" {
		writeError(w, http.StatusBadRequest, "Data user tidak lengkap")
		return
	}
	if req.Role == "" {
		req.Role = "kasir"
	}
	if req.Role != "admin" && req.Role != "kasir" {
		writeError(w, http.StatusBadRequest, "Role harus 'admin' atau 'kasir'")
		return
	}
	var existing models.User
	err := h.DB.Where("username = ?", req.Username).First(&existing).Error
	if err == nil {
		writeError(w, http.StatusBadRequest, "Username sudah digunakan")
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		writeError(w, http.StatusInternalServerError, "Gagal memeriksa user")
		return
	}
	hash, _ := utils.HashPassword(req.Password)
	user := models.User{Username: req.Username, PasswordHash: hash, FullName: req.FullName, Role: req.Role, IsActive: true}
	if err := h.DB.Create(&user).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat user")
		return
	}
	writeJSON(w, http.StatusOK, user.ToMap())
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, currentUser(r).ToMap())
}

func (h *Handler) authUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	if err := h.DB.Order("id asc").Find(&users).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil user")
		return
	}
	response := make([]map[string]any, 0, len(users))
	for _, user := range users {
		response = append(response, user.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) toggleAuthUser(w http.ResponseWriter, r *http.Request) {
	userID, err := parseUintParam(r, "user_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "User tidak valid")
		return
	}
	admin := currentUser(r)
	if admin != nil && admin.ID == userID {
		writeError(w, http.StatusBadRequest, "Tidak bisa menonaktifkan diri sendiri")
		return
	}
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		writeError(w, http.StatusNotFound, "User tidak ditemukan")
		return
	}
	user.IsActive = !user.IsActive
	if err := h.DB.Save(&user).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengubah status user")
		return
	}
	writeJSON(w, http.StatusOK, user.ToMap())
}

func (h *Handler) issueToken(username string) (string, error) {
	claims := jwt.MapClaims{
		"sub": username,
		"exp": time.Now().Add(h.Config.TokenTTL).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.Config.JWTSecret))
}

func (h *Handler) userFromRequest(r *http.Request) (*models.User, error) {
	header := r.Header.Get("Authorization")
	if header == "" {
		return nil, http.ErrNoCookie
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return nil, http.ErrNoCookie
	}
	token, err := jwt.Parse(parts[1], func(token *jwt.Token) (any, error) {
		return []byte(h.Config.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, http.ErrNoCookie
	}
	username, _ := claims["sub"].(string)
	if username == "" {
		return nil, http.ErrNoCookie
	}
	var user models.User
	if err := h.DB.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func currentUser(r *http.Request) *models.User {
	user, _ := r.Context().Value(userContextKey).(*models.User)
	return user
}
