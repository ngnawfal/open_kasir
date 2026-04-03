package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"program-kasir-go/internal/models"
	"program-kasir-go/internal/utils"
)

type userCreateRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type userUpdateRequest struct {
	Username *string `json:"username"`
	FullName *string `json:"full_name"`
	Role     *string `json:"role"`
	IsActive *bool   `json:"is_active"`
}

type passwordResetRequest struct {
	NewPassword string `json:"new_password"`
}

func (h *Handler) registerUserRoutes(r chi.Router) {
	r.With(h.adminRequired).Get("/", h.getUsers)
	r.With(h.adminRequired).Get("/{user_id}", h.getUser)
	r.With(h.adminRequired).Post("/", h.createUser)
	r.With(h.adminRequired).Put("/{user_id}", h.updateUser)
	r.With(h.adminRequired).Post("/{user_id}/reset-password", h.resetPassword)
	r.With(h.adminRequired).Delete("/{user_id}", h.deleteUser)
}

func (h *Handler) getUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	if err := h.DB.Order("created_at desc").Find(&users).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil user")
		return
	}
	response := make([]map[string]any, 0, len(users))
	for _, user := range users {
		response = append(response, user.ToMap())
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) getUser(w http.ResponseWriter, r *http.Request) {
	userID, err := parseUintParam(r, "user_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "User tidak valid")
		return
	}
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		writeError(w, http.StatusNotFound, "User tidak ditemukan")
		return
	}
	writeJSON(w, http.StatusOK, user.ToMap())
}

func (h *Handler) createUser(w http.ResponseWriter, r *http.Request) {
	var req userCreateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	if req.Role == "" {
		req.Role = "kasir"
	}
	if req.Username == "" || req.Password == "" || req.FullName == "" {
		writeError(w, http.StatusBadRequest, "Data user tidak lengkap")
		return
	}
	if req.Role != "kasir" && req.Role != "admin" {
		writeError(w, http.StatusBadRequest, "Role harus 'kasir' atau 'admin'")
		return
	}
	var existing models.User
	if err := h.DB.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		writeError(w, http.StatusBadRequest, "Username sudah digunakan")
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

func (h *Handler) updateUser(w http.ResponseWriter, r *http.Request) {
	userID, err := parseUintParam(r, "user_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "User tidak valid")
		return
	}
	var req userUpdateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		writeError(w, http.StatusNotFound, "User tidak ditemukan")
		return
	}
	admin := currentUser(r)
	if req.Role != nil {
		if *req.Role != "kasir" && *req.Role != "admin" {
			writeError(w, http.StatusBadRequest, "Role harus 'kasir' atau 'admin'")
			return
		}
		if admin != nil && admin.ID == user.ID && *req.Role != "admin" {
			writeError(w, http.StatusBadRequest, "Tidak bisa mengubah role sendiri")
			return
		}
		user.Role = *req.Role
	}
	if req.Username != nil {
		var existing models.User
		if err := h.DB.Where("username = ? AND id <> ?", *req.Username, user.ID).First(&existing).Error; err == nil {
			writeError(w, http.StatusBadRequest, "Username sudah digunakan")
			return
		}
		user.Username = *req.Username
	}
	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.IsActive != nil {
		if admin != nil && admin.ID == user.ID && !*req.IsActive {
			writeError(w, http.StatusBadRequest, "Tidak bisa menonaktifkan diri sendiri")
			return
		}
		user.IsActive = *req.IsActive
	}
	if err := h.DB.Save(&user).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal update user")
		return
	}
	writeJSON(w, http.StatusOK, user.ToMap())
}

func (h *Handler) resetPassword(w http.ResponseWriter, r *http.Request) {
	userID, err := parseUintParam(r, "user_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "User tidak valid")
		return
	}
	var req passwordResetRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}
	if len(req.NewPassword) < 4 {
		writeError(w, http.StatusBadRequest, "Password minimal 4 karakter")
		return
	}
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		writeError(w, http.StatusNotFound, "User tidak ditemukan")
		return
	}
	hash, _ := utils.HashPassword(req.NewPassword)
	user.PasswordHash = hash
	if err := h.DB.Save(&user).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal reset password")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Password " + user.Username + " berhasil direset"})
}

func (h *Handler) deleteUser(w http.ResponseWriter, r *http.Request) {
	userID, err := parseUintParam(r, "user_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "User tidak valid")
		return
	}
	admin := currentUser(r)
	if admin != nil && admin.ID == userID {
		writeError(w, http.StatusBadRequest, "Tidak bisa menghapus diri sendiri")
		return
	}
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		writeError(w, http.StatusNotFound, "User tidak ditemukan")
		return
	}
	user.IsActive = false
	if err := h.DB.Save(&user).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menonaktifkan user")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "User " + user.Username + " berhasil dinonaktifkan"})
}
