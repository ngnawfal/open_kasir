package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/pbkdf2"
)

const (
	passlibPrefix = "$pbkdf2-sha256$"
	defaultRounds = 29000
	saltSize      = 16
	keySize       = 32
)

func HashPassword(password string) (string, error) {
	salt := make([]byte, saltSize)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	checksum := pbkdf2.Key([]byte(password), salt, defaultRounds, keySize, sha256.New)
	return fmt.Sprintf("%s%d$%s$%s", passlibPrefix, defaultRounds, encodePasslibBase64(salt), encodePasslibBase64(checksum)), nil
}

func VerifyPassword(password, encodedHash string) bool {
	if strings.HasPrefix(encodedHash, passlibPrefix) {
		return verifyPasslibPBKDF2(password, encodedHash)
	}
	return bcrypt.CompareHashAndPassword([]byte(encodedHash), []byte(password)) == nil
}

func verifyPasslibPBKDF2(password, encodedHash string) bool {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 5 || parts[1] != "pbkdf2-sha256" {
		return false
	}
	rounds, err := strconv.Atoi(parts[2])
	if err != nil || rounds <= 0 {
		return false
	}
	salt, err := decodePasslibBase64(parts[3])
	if err != nil {
		return false
	}
	expected, err := decodePasslibBase64(parts[4])
	if err != nil {
		return false
	}
	actual := pbkdf2.Key([]byte(password), salt, rounds, len(expected), sha256.New)
	return subtle.ConstantTimeCompare(actual, expected) == 1
}

func encodePasslibBase64(data []byte) string {
	return strings.TrimRight(strings.ReplaceAll(base64.StdEncoding.EncodeToString(data), "+", "."), "=")
}

func decodePasslibBase64(value string) ([]byte, error) {
	normalized := strings.ReplaceAll(value, ".", "+")
	if mod := len(normalized) % 4; mod != 0 {
		normalized += strings.Repeat("=", 4-mod)
	}
	return base64.StdEncoding.DecodeString(normalized)
}
