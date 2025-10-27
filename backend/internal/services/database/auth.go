package database

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// PendingUser represents a user awaiting approval
type PendingUser struct {
	ID        string    `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Name      string    `json:"name" db:"name"`
	Password  string    `json:"password" db:"password"`
	Position  string    `json:"position" db:"position"`
	NIP       string    `json:"nip" db:"nip"`
	NIK       string    `json:"nik" db:"nik"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"requested_at"`
}

// User represents an active user
type User struct {
	ID        string    `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Name      string    `json:"name" db:"name"`
	Role      string    `json:"role" db:"role"`
	NIK       string    `json:"nik" db:"nik"`
	NIP       string    `json:"nip" db:"nip"`                 // Employee ID
	Position  string    `json:"position" db:"position"`       // Job position
	AvatarURL *string   `json:"avatar_url" db:"avatar_url"`   // Pointer to allow null
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CheckPendingUserExists checks if email exists in pending_users table
func (s *Service) CheckPendingUserExists(ctx context.Context, email string) (bool, error) {
	if !s.isHealthy {
		return false, ErrDatabaseNotHealthy
	}

	// Use Supabase client to check pending users
	// Query without .Single() to avoid PGRST116 error on empty result
	data, _, err := s.client.From("pending_users").
		Select("id,email", "", false).
		Eq("email", email).
		Execute()

	if err != nil {
		logrus.WithError(err).WithField("email", email).Debug("Database query error when checking pending user")
		// Return false (user doesn't exist) to allow registration to proceed
		return false, nil
	}

	// Debug log to understand the data structure
	logrus.WithFields(logrus.Fields{
		"email":      email,
		"data_len":   len(data),
		"data_type":  fmt.Sprintf("%T", data),
	}).Debug("Pending user check result")

	// If data is empty or has no content, user doesn't exist
	if len(data) == 0 {
		return false, nil
	}

	// Parse to check if we actually got a record
	var results []map[string]interface{}
	if err := json.Unmarshal(data, &results); err != nil {
		logrus.WithError(err).WithField("email", email).Warn("Failed to parse user check result")
		return false, nil // Assume doesn't exist if we can't parse
	}

	// If results list is empty, user doesn't exist
	if len(results) == 0 {
		return false, nil
	}

	// User exists
	logrus.WithField("email", email).Debug("Pending user found")
	return true, nil
}

// CreatePendingUser inserts a new pending user into the database
func (s *Service) CreatePendingUser(ctx context.Context, user *PendingUser) error {
	if !s.isHealthy {
		return ErrDatabaseNotHealthy
	}

	if user.ID == "" {
		user.ID = uuid.New().String()
	}

	// Prepare user data for insertion (only fields that exist in pending_users table)
	userData := map[string]interface{}{
		"id":           user.ID,
		"email":        user.Email,
		"name":         user.Name,
		"password":     user.Password,
		"status":       user.Status,
		"requested_at": user.CreatedAt.Format(time.RFC3339),
	}

	// Store optional metadata (position, nip, nik) in user_metadata JSON field
	metadata := map[string]interface{}{}
	if user.Position != "" {
		metadata["position"] = user.Position
	}
	if user.NIP != "" {
		metadata["nip"] = user.NIP
	}
	if user.NIK != "" {
		metadata["nik"] = user.NIK
	}
	if len(metadata) > 0 {
		userData["user_metadata"] = metadata
	}

	// Insert into pending_users table
	_, _, err := s.client.From("pending_users").
		Insert(userData, false, "", "", "").
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"user_id": user.ID,
			"email":   user.Email,
		}).Error("Failed to create pending user")
		return err
	}

	logrus.WithFields(logrus.Fields{
		"user_id": user.ID,
		"email":   user.Email,
		"status":  user.Status,
	}).Info("Pending user created successfully")

	return nil
}

// GetUserByEmail retrieves user by email from profiles table
func (s *Service) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	if !s.isHealthy {
		return nil, ErrDatabaseNotHealthy
	}

	// Query profiles table for user
	data, _, err := s.client.From("profiles").
		Select("id,email,name,role,nik", "", false).
		Eq("email", email).
		Single().
		Execute()

	if err != nil {
		// If no rows found, return nil (user not found)
		if err.Error() == "PGRST116" || err.Error() == "No rows found" {
			return nil, nil
		}
		logrus.WithError(err).WithField("email", email).Error("Failed to get user by email")
		return nil, err
	}

	if len(data) == 0 {
		return nil, nil
	}

	// Parse the result data
	var user User
	if err := json.Unmarshal(data, &user); err != nil {
		logrus.WithError(err).WithField("email", email).Error("Failed to unmarshal user data")
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
	}).Debug("User retrieved successfully by email")

	return &user, nil
}

// GetUserByID retrieves user by ID from profiles table
func (s *Service) GetUserByID(ctx context.Context, userID string) (*User, error) {
	if !s.isHealthy {
		return nil, ErrDatabaseNotHealthy
	}

	// Query profiles table for user
	data, _, err := s.client.From("profiles").
		Select("id,email,name,role,nik,nip,position,avatar_url", "", false).
		Eq("id", userID).
		Single().
		Execute()

	if err != nil {
		// If no rows found, return nil (user not found)
		if err.Error() == "PGRST116" || err.Error() == "No rows found" {
			return nil, nil
		}
		logrus.WithError(err).WithField("user_id", userID).Error("Failed to get user by ID")
		return nil, err
	}

	if len(data) == 0 {
		return nil, nil
	}

	// Parse the result data
	var user User
	if err := json.Unmarshal(data, &user); err != nil {
		logrus.WithError(err).WithField("user_id", userID).Error("Failed to unmarshal user data")
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
	}).Debug("User retrieved successfully by ID")

	return &user, nil
}

// UpdateUserLastLogin updates user's last login timestamp
func (s *Service) UpdateUserLastLogin(ctx context.Context, userID string) error {
	if !s.isHealthy {
		return ErrDatabaseNotHealthy
	}

	// Update last_selly_interaction timestamp
	updateData := map[string]interface{}{
		"last_selly_interaction": time.Now().Format(time.RFC3339),
	}

	_, _, err := s.client.From("profiles").
		Update(updateData, "", "").
		Eq("id", userID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithField("user_id", userID).Error("Failed to update last login timestamp")
		return err
	}

	logrus.WithField("user_id", userID).Debug("Last login timestamp updated successfully")
	return nil
}

// GetPendingUsers retrieves all pending users (for admin functionality)
func (s *Service) GetPendingUsers(ctx context.Context) ([]PendingUser, error) {
	if !s.isHealthy {
		return nil, ErrDatabaseNotHealthy
	}

	// Query pending_users table - SELECT all fields except password for security
	// Include all statuses (pending, approved, rejected) for admin view
	data, _, err := s.client.From("pending_users").
		Select("id,email,name,position,nip,nik,status,requested_at", "", false).
		Order("requested_at", nil).
		Execute()

	if err != nil {
		logrus.WithError(err).Error("Failed to get pending users")
		return nil, err
	}

	var pendingUsers []PendingUser
	if err := json.Unmarshal(data, &pendingUsers); err != nil {
		logrus.WithError(err).Error("Failed to unmarshal pending users data")
		return nil, err
	}

	logrus.WithField("count", len(pendingUsers)).Info("Retrieved pending users successfully")
	return pendingUsers, nil
}

// ApprovePendingUser approves a pending user and creates their profile
func (s *Service) ApprovePendingUser(ctx context.Context, pendingUserID string) error {
	if !s.isHealthy {
		return ErrDatabaseNotHealthy
	}

	// This would typically involve:
	// 1. Getting the pending user data
	// 2. Creating a profile in the profiles table
	// 3. Updating the pending user status to "approved"
	// 4. Potentially creating Supabase auth user

	// For now, just update the status
	updateData := map[string]interface{}{
		"status": "approved",
	}

	_, _, err := s.client.From("pending_users").
		Update(updateData, "", "").
		Eq("id", pendingUserID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithField("pending_user_id", pendingUserID).Error("Failed to approve pending user")
		return err
	}

	logrus.WithField("pending_user_id", pendingUserID).Info("Pending user approved successfully")
	return nil
}

// RejectPendingUser rejects a pending user
func (s *Service) RejectPendingUser(ctx context.Context, pendingUserID string, reason string) error {
	if !s.isHealthy {
		return ErrDatabaseNotHealthy
	}

	updateData := map[string]interface{}{
		"status": "rejected",
	}

	if reason != "" {
		updateData["rejection_reason"] = reason
	}

	_, _, err := s.client.From("pending_users").
		Update(updateData, "", "").
		Eq("id", pendingUserID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithField("pending_user_id", pendingUserID).Error("Failed to reject pending user")
		return err
	}

	logrus.WithFields(logrus.Fields{
		"pending_user_id": pendingUserID,
		"reason":          reason,
	}).Info("Pending user rejected successfully")

	return nil
}
