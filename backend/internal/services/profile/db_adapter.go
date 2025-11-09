package profile

import (
	"context"
	"fmt"
	"time"

	"selly-backend/internal/services/database"
)

// DatabaseAdapterImpl implements the DatabaseAdapter interface
type DatabaseAdapterImpl struct {
	db *database.Service
}

// NewDatabaseAdapter creates a new database adapter
func NewDatabaseAdapter(db *database.Service) DatabaseAdapter {
	return &DatabaseAdapterImpl{
		db: db,
	}
}

// GetProfile retrieves a profile from the database
func (da *DatabaseAdapterImpl) GetProfile(ctx context.Context, userID string) (*ProfileData, error) {
	query := `
		SELECT id, name, nip, position, avatar_url, nik, role, email, updated_at
		FROM profiles
		WHERE id = $1
	`

	var profile ProfileData
	err := da.db.QueryRow(ctx, query, userID).Scan(
		&profile.ID,
		&profile.Name,
		&profile.NIP,
		&profile.Position,
		&profile.AvatarURL,
		&profile.NIK,
		&profile.Role,
		&profile.Email,
		&profile.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to query profile: %w", err)
	}

	return &profile, nil
}

// GetProfileByID is an alias for GetProfile
func (da *DatabaseAdapterImpl) GetProfileByID(ctx context.Context, id string) (*ProfileData, error) {
	return da.GetProfile(ctx, id)
}

// UpdateProfile updates a profile in the database
func (da *DatabaseAdapterImpl) UpdateProfile(ctx context.Context, userID string, updates map[string]interface{}) (*ProfileData, error) {
	if len(updates) == 0 {
		// If no updates provided, just fetch and return current profile
		return da.GetProfile(ctx, userID)
	}

	// Build dynamic update query
	query := `UPDATE profiles SET `
	args := []interface{}{}
	argNum := 1

	updateFields := []string{}
	for field, value := range updates {
		updateFields = append(updateFields, fmt.Sprintf("%s = $%d", field, argNum))
		args = append(args, value)
		argNum++
	}

	query += fmt.Sprintf("%s WHERE id = $%d RETURNING ", 
		concatStrings(updateFields, ", "), argNum)
	args = append(args, userID)

	query += `id, name, nip, position, avatar_url, nik, role, email, updated_at`

	var profile ProfileData
	err := da.db.QueryRow(ctx, query, args...).Scan(
		&profile.ID,
		&profile.Name,
		&profile.NIP,
		&profile.Position,
		&profile.AvatarURL,
		&profile.NIK,
		&profile.Role,
		&profile.Email,
		&profile.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return &profile, nil
}

// UpdateProfileAvatar updates only the avatar URL
func (da *DatabaseAdapterImpl) UpdateProfileAvatar(ctx context.Context, userID, avatarURL string) error {
	query := `
		UPDATE profiles
		SET avatar_url = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := da.db.Exec(ctx, query, avatarURL, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update profile avatar: %w", err)
	}

	return nil
}

// HealthCheck verifies database connectivity
func (da *DatabaseAdapterImpl) HealthCheck(ctx context.Context) error {
	err := da.db.QueryRow(ctx, "SELECT 1").Scan(nil)
	if err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}
	return nil
}

// Helper function to concatenate strings
func concatStrings(slice []string, sep string) string {
	result := ""
	for i, s := range slice {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
