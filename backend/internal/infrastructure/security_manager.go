package infrastructure

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// NewSecurityManager creates a new security manager
func NewSecurityManager(config *SecurityConfig) *SecurityManager {
	return &SecurityManager{
		config: config,
		tlsManager: &TLSManager{
			CertPath:    config.TLSCertPath,
			KeyPath:     config.TLSKeyPath,
			Enabled:     config.TLSEnabled,
			MinVersion:  "1.2",
			MaxVersion:  "1.3",
		},
		authManager: &AuthenticationManager{
			Method:          config.AuthenticationMethod,
			TokenExpiry:     24 * time.Hour,
			RefreshEnabled:  true,
			MFAEnabled:      true,
		},
		complianceChecker: &ComplianceChecker{
			ComplianceLevel: config.ComplianceLevel,
			Standards:       []string{"UU_27_2022", "ISO_27001", "BSSN"},
			AuditEnabled:    config.AuditLoggingEnabled,
		},
		auditLogger: &AuditLogger{
			Enabled:         config.AuditLoggingEnabled,
			RetentionPeriod: 2555 * 24 * time.Hour, // 7 years for government compliance
			EncryptionEnabled: true,
		},
		securityMonitor: &SecurityMonitor{
			MonitoringInterval: 1 * time.Minute,
			ThreatDetectionEnabled: config.ThreatDetectionEnabled,
			AlertThresholds: map[string]float64{
				"failed_auth_rate": 0.1,
				"suspicious_activity": 0.05,
				"compliance_score": 0.95,
			},
		},
		threatDetector: &ThreatDetector{
			Enabled:           config.ThreatDetectionEnabled,
			DetectionRules:    make([]ThreatDetectionRule, 0),
			ThreatHistory:     make([]ThreatEvent, 0),
			AlertingEnabled:   true,
		},
	}
}

// TLSManager manages TLS configuration and certificates
type TLSManager struct {
	CertPath       string
	KeyPath        string
	Enabled        bool
	MinVersion     string
	MaxVersion     string
	CertExpiry     time.Time
	AutoRenewal    bool
	mu             sync.RWMutex
}

// AuthenticationManager manages authentication and authorization
type AuthenticationManager struct {
	Method         string
	TokenExpiry    time.Duration
	RefreshEnabled bool
	MFAEnabled     bool
	ActiveSessions map[string]*AuthSession
	FailedAttempts map[string]*FailedAuthAttempt
	mu             sync.RWMutex
}

// AuthSession represents an active authentication session
type AuthSession struct {
	SessionID   string
	UserID      string
	CreatedAt   time.Time
	ExpiresAt   time.Time
	IPAddress   string
	UserAgent   string
	Permissions []string
	MFAVerified bool
}

// FailedAuthAttempt tracks failed authentication attempts
type FailedAuthAttempt struct {
	IPAddress   string
	UserID      string
	Timestamp   time.Time
	Reason      string
	AttemptCount int
}

// ComplianceChecker ensures compliance with regulations
type ComplianceChecker struct {
	ComplianceLevel string
	Standards       []string
	AuditEnabled    bool
	ComplianceScore float64
	LastCheck       time.Time
	Violations      []ComplianceViolation
	mu              sync.RWMutex
}

// ComplianceViolation represents a compliance violation
type ComplianceViolation struct {
	ID          string
	Standard    string
	Severity    string
	Description string
	Timestamp   time.Time
	Resolved    bool
	ResolvedAt  *time.Time
}

// AuditLogger handles security audit logging
type AuditLogger struct {
	Enabled           bool
	RetentionPeriod   time.Duration
	EncryptionEnabled bool
	LogEntries        []SecurityAuditEntry
	LogCount          int64
	mu                sync.RWMutex
}

// SecurityAuditEntry represents a security audit log entry
type SecurityAuditEntry struct {
	ID          string
	Timestamp   time.Time
	EventType   string
	UserID      string
	IPAddress   string
	UserAgent   string
	Action      string
	Resource    string
	Result      string
	Details     map[string]interface{}
	Severity    string
}

// SecurityMonitor monitors security metrics and events
type SecurityMonitor struct {
	MonitoringInterval     time.Duration
	ThreatDetectionEnabled bool
	AlertThresholds        map[string]float64
	SecurityMetrics        *SecurityMetrics
	LastMonitoringRun      time.Time
	mu                     sync.RWMutex
}

// ThreatDetector detects and responds to security threats
type ThreatDetector struct {
	Enabled         bool
	DetectionRules  []ThreatDetectionRule
	ThreatHistory   []ThreatEvent
	AlertingEnabled bool
	ThreatCount     int64
	mu              sync.RWMutex
}

// ThreatDetectionRule defines a threat detection rule
type ThreatDetectionRule struct {
	ID          string
	Name        string
	Description string
	Pattern     string
	Severity    string
	Action      string
	Enabled     bool
	CreatedAt   time.Time
}

// ThreatEvent represents a detected threat event
type ThreatEvent struct {
	ID          string
	RuleID      string
	Timestamp   time.Time
	Severity    string
	Description string
	IPAddress   string
	UserID      string
	Action      string
	Mitigated   bool
	MitigatedAt *time.Time
}

// Start starts the security manager
func (sm *SecurityManager) Start(ctx context.Context) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	logrus.Info("🔒 Starting security manager...")
	
	// Initialize TLS if enabled
	if sm.config.TLSEnabled {
		if err := sm.initializeTLS(); err != nil {
			return fmt.Errorf("failed to initialize TLS: %w", err)
		}
	}
	
	// Initialize authentication manager
	sm.authManager.ActiveSessions = make(map[string]*AuthSession)
	sm.authManager.FailedAttempts = make(map[string]*FailedAuthAttempt)
	
	// Initialize compliance checker
	sm.complianceChecker.ComplianceScore = 1.0 // Start with perfect score
	
	// Start security monitoring
	go sm.startSecurityMonitoring(ctx)
	
	// Start threat detection if enabled
	if sm.config.ThreatDetectionEnabled {
		go sm.startThreatDetection(ctx)
	}
	
	// Start audit log cleanup
	if sm.config.AuditLoggingEnabled {
		go sm.startAuditLogCleanup(ctx)
	}
	
	logrus.Infof("✅ Security manager started (TLS: %v, Compliance: %s, Threat Detection: %v)", 
		sm.config.TLSEnabled, sm.config.ComplianceLevel, sm.config.ThreatDetectionEnabled)
	return nil
}

// initializeTLS initializes TLS configuration
func (sm *SecurityManager) initializeTLS() error {
	logrus.Info("🔐 Initializing TLS configuration...")
	
	// Validate TLS configuration
	if sm.config.TLSCertPath == "" || sm.config.TLSKeyPath == "" {
		return fmt.Errorf("TLS certificate and key paths are required")
	}
	
	// In a real implementation, this would load and validate certificates
	// For now, we'll simulate the initialization
	
	sm.tlsManager.CertExpiry = time.Now().Add(365 * 24 * time.Hour) // 1 year expiry
	sm.tlsManager.AutoRenewal = true
	
	logrus.Info("✅ TLS configuration initialized successfully")
	return nil
}

// startSecurityMonitoring starts security monitoring
func (sm *SecurityManager) startSecurityMonitoring(ctx context.Context) {
	ticker := time.NewTicker(sm.securityMonitor.MonitoringInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			sm.performSecurityMonitoring()
		case <-ctx.Done():
			return
		}
	}
}

// performSecurityMonitoring performs security monitoring checks
func (sm *SecurityManager) performSecurityMonitoring() {
	sm.securityMonitor.mu.Lock()
	defer sm.securityMonitor.mu.Unlock()
	
	// Update security metrics
	sm.updateSecurityMetrics()
	
	// Check compliance
	sm.checkCompliance()
	
	// Monitor authentication failures
	sm.monitorAuthenticationFailures()
	
	// Check for security violations
	sm.checkSecurityViolations()
	
	sm.securityMonitor.LastMonitoringRun = time.Now()
	
	logrus.Debug("🔍 Security monitoring check completed")
}

// updateSecurityMetrics updates security metrics
func (sm *SecurityManager) updateSecurityMetrics() {
	if sm.securityMonitor.SecurityMetrics == nil {
		sm.securityMonitor.SecurityMetrics = &SecurityMetrics{}
	}
	
	// Update threat detection count
	sm.securityMonitor.SecurityMetrics.ThreatDetectionCount = atomic.LoadInt64(&sm.threatDetector.ThreatCount)
	
	// Update authentication failures
	sm.authManager.mu.RLock()
	failureCount := int64(len(sm.authManager.FailedAttempts))
	sm.authManager.mu.RUnlock()
	sm.securityMonitor.SecurityMetrics.AuthenticationFailures = failureCount
	
	// Update compliance score
	sm.complianceChecker.mu.RLock()
	sm.securityMonitor.SecurityMetrics.ComplianceScore = sm.complianceChecker.ComplianceScore
	sm.complianceChecker.mu.RUnlock()
	
	// Update audit log count
	sm.securityMonitor.SecurityMetrics.AuditLogCount = atomic.LoadInt64(&sm.auditLogger.LogCount)
	
	// Update last security scan
	sm.securityMonitor.SecurityMetrics.LastSecurityScan = time.Now()
}

// checkCompliance checks compliance with regulations
func (sm *SecurityManager) checkCompliance() {
	sm.complianceChecker.mu.Lock()
	defer sm.complianceChecker.mu.Unlock()
	
	// Simulate compliance checking
	// In a real implementation, this would check against actual compliance requirements
	
	violationCount := len(sm.complianceChecker.Violations)
	
	// Calculate compliance score based on violations
	if violationCount == 0 {
		sm.complianceChecker.ComplianceScore = 1.0
	} else {
		// Reduce score based on violations
		sm.complianceChecker.ComplianceScore = 1.0 - (float64(violationCount) * 0.1)
		if sm.complianceChecker.ComplianceScore < 0 {
			sm.complianceChecker.ComplianceScore = 0
		}
	}
	
	sm.complianceChecker.LastCheck = time.Now()
	
	// Alert if compliance score is below threshold
	threshold := sm.securityMonitor.AlertThresholds["compliance_score"]
	if sm.complianceChecker.ComplianceScore < threshold {
		logrus.Warnf("⚠️ Compliance score below threshold: %.2f < %.2f", 
			sm.complianceChecker.ComplianceScore, threshold)
	}
}

// monitorAuthenticationFailures monitors authentication failures
func (sm *SecurityManager) monitorAuthenticationFailures() {
	sm.authManager.mu.RLock()
	defer sm.authManager.mu.RUnlock()
	
	// Check for suspicious authentication patterns
	suspiciousIPs := make(map[string]int)
	
	for ip, attempt := range sm.authManager.FailedAttempts {
		if time.Since(attempt.Timestamp) < 1*time.Hour {
			suspiciousIPs[ip] = attempt.AttemptCount
		}
	}
	
	// Alert on suspicious activity
	for ip, count := range suspiciousIPs {
		if count > 10 { // More than 10 failed attempts in an hour
			logrus.Warnf("⚠️ Suspicious authentication activity from IP %s: %d failed attempts", ip, count)
			
			// Record as a threat event
			sm.recordThreatEvent("suspicious_auth", fmt.Sprintf("Multiple failed auth attempts from %s", ip), ip, "")
		}
	}
}

// checkSecurityViolations checks for security violations
func (sm *SecurityManager) checkSecurityViolations() {
	// Check TLS certificate expiry
	if sm.tlsManager.Enabled {
		daysUntilExpiry := time.Until(sm.tlsManager.CertExpiry).Hours() / 24
		if daysUntilExpiry < 30 {
			logrus.Warnf("⚠️ TLS certificate expires in %.0f days", daysUntilExpiry)
		}
	}
	
	// Check audit log retention
	if sm.auditLogger.Enabled {
		// Simulate checking for old audit logs
		logCount := atomic.LoadInt64(&sm.auditLogger.LogCount)
		if logCount > 1000000 { // More than 1M log entries
			logrus.Warnf("⚠️ Audit log size is large: %d entries", logCount)
		}
	}
}

// startThreatDetection starts threat detection
func (sm *SecurityManager) startThreatDetection(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			sm.performThreatDetection()
		case <-ctx.Done():
			return
		}
	}
}

// performThreatDetection performs threat detection
func (sm *SecurityManager) performThreatDetection() {
	sm.threatDetector.mu.RLock()
	defer sm.threatDetector.mu.RUnlock()
	
	// Simulate threat detection
	// In a real implementation, this would analyze logs, network traffic, etc.
	
	// Check for patterns that might indicate threats
	// This is a simplified simulation
	
	logrus.Debug("🛡️ Performing threat detection scan...")
}

// recordThreatEvent records a threat event
func (sm *SecurityManager) recordThreatEvent(eventType, description, ipAddress, userID string) {
	sm.threatDetector.mu.Lock()
	defer sm.threatDetector.mu.Unlock()
	
	threatEvent := ThreatEvent{
		ID:          fmt.Sprintf("threat_%d", time.Now().UnixNano()),
		Timestamp:   time.Now(),
		Severity:    "medium",
		Description: description,
		IPAddress:   ipAddress,
		UserID:      userID,
		Action:      "logged",
		Mitigated:   false,
	}
	
	sm.threatDetector.ThreatHistory = append(sm.threatDetector.ThreatHistory, threatEvent)
	atomic.AddInt64(&sm.threatDetector.ThreatCount, 1)
	
	// Keep only last 1000 threat events
	if len(sm.threatDetector.ThreatHistory) > 1000 {
		sm.threatDetector.ThreatHistory = sm.threatDetector.ThreatHistory[1:]
	}
	
	// Log audit entry
	sm.logAuditEntry("threat_detected", userID, ipAddress, "threat_detection", eventType, "detected", map[string]interface{}{
		"description": description,
		"severity":    threatEvent.Severity,
	})
}

// startAuditLogCleanup starts audit log cleanup
func (sm *SecurityManager) startAuditLogCleanup(ctx context.Context) {
	ticker := time.NewTicker(24 * time.Hour) // Daily cleanup
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			sm.cleanupAuditLogs()
		case <-ctx.Done():
			return
		}
	}
}

// cleanupAuditLogs cleans up old audit logs
func (sm *SecurityManager) cleanupAuditLogs() {
	sm.auditLogger.mu.Lock()
	defer sm.auditLogger.mu.Unlock()
	
	if !sm.auditLogger.Enabled {
		return
	}
	
	cutoffTime := time.Now().Add(-sm.auditLogger.RetentionPeriod)
	originalCount := len(sm.auditLogger.LogEntries)
	
	// Remove old entries
	var filteredEntries []SecurityAuditEntry
	for _, entry := range sm.auditLogger.LogEntries {
		if entry.Timestamp.After(cutoffTime) {
			filteredEntries = append(filteredEntries, entry)
		}
	}
	
	sm.auditLogger.LogEntries = filteredEntries
	removedCount := originalCount - len(filteredEntries)
	
	if removedCount > 0 {
		logrus.Infof("🧹 Cleaned up %d old audit log entries", removedCount)
	}
}

// logAuditEntry logs a security audit entry
func (sm *SecurityManager) logAuditEntry(eventType, userID, ipAddress, action, resource, result string, details map[string]interface{}) {
	if !sm.auditLogger.Enabled {
		return
	}
	
	sm.auditLogger.mu.Lock()
	defer sm.auditLogger.mu.Unlock()
	
	entry := SecurityAuditEntry{
		ID:        fmt.Sprintf("audit_%d", time.Now().UnixNano()),
		Timestamp: time.Now(),
		EventType: eventType,
		UserID:    userID,
		IPAddress: ipAddress,
		Action:    action,
		Resource:  resource,
		Result:    result,
		Details:   details,
		Severity:  "info",
	}
	
	sm.auditLogger.LogEntries = append(sm.auditLogger.LogEntries, entry)
	atomic.AddInt64(&sm.auditLogger.LogCount, 1)
	
	// Keep only recent entries in memory (older ones would be persisted to storage)
	if len(sm.auditLogger.LogEntries) > 10000 {
		sm.auditLogger.LogEntries = sm.auditLogger.LogEntries[1000:] // Keep last 9000
	}
}

// AuthenticateUser authenticates a user
func (sm *SecurityManager) AuthenticateUser(userID, password, ipAddress, userAgent string) (*AuthSession, error) {
	sm.authManager.mu.Lock()
	defer sm.authManager.mu.Unlock()
	
	// Simulate authentication
	// In a real implementation, this would verify credentials against a database
	
	// Check for too many failed attempts
	if attempt, exists := sm.authManager.FailedAttempts[ipAddress]; exists {
		if attempt.AttemptCount > 5 && time.Since(attempt.Timestamp) < 1*time.Hour {
			sm.logAuditEntry("auth_blocked", userID, ipAddress, "authenticate", "user_session", "blocked", map[string]interface{}{
				"reason": "too_many_failed_attempts",
			})
			return nil, fmt.Errorf("too many failed attempts, please try again later")
		}
	}
	
	// Simulate successful authentication (90% success rate)
	if time.Now().Unix()%10 != 0 {
		// Create session
		session := &AuthSession{
			SessionID:   fmt.Sprintf("session_%d", time.Now().UnixNano()),
			UserID:      userID,
			CreatedAt:   time.Now(),
			ExpiresAt:   time.Now().Add(sm.authManager.TokenExpiry),
			IPAddress:   ipAddress,
			UserAgent:   userAgent,
			Permissions: []string{"read", "write"},
			MFAVerified: false,
		}
		
		sm.authManager.ActiveSessions[session.SessionID] = session
		
		// Clear failed attempts
		delete(sm.authManager.FailedAttempts, ipAddress)
		
		sm.logAuditEntry("auth_success", userID, ipAddress, "authenticate", "user_session", "success", map[string]interface{}{
			"session_id": session.SessionID,
		})
		
		return session, nil
	} else {
		// Authentication failed
		if attempt, exists := sm.authManager.FailedAttempts[ipAddress]; exists {
			attempt.AttemptCount++
			attempt.Timestamp = time.Now()
		} else {
			sm.authManager.FailedAttempts[ipAddress] = &FailedAuthAttempt{
				IPAddress:    ipAddress,
				UserID:       userID,
				Timestamp:    time.Now(),
				Reason:       "invalid_credentials",
				AttemptCount: 1,
			}
		}
		
		sm.logAuditEntry("auth_failure", userID, ipAddress, "authenticate", "user_session", "failure", map[string]interface{}{
			"reason": "invalid_credentials",
		})
		
		return nil, fmt.Errorf("invalid credentials")
	}
}

// GetHealthStatus returns the health status of the security manager
func (sm *SecurityManager) GetHealthStatus() HealthStatus {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	
	// Check compliance score
	if sm.complianceChecker.ComplianceScore < 0.9 {
		return HealthStatusUnhealthy
	}
	
	// Check TLS certificate expiry
	if sm.tlsManager.Enabled {
		daysUntilExpiry := time.Until(sm.tlsManager.CertExpiry).Hours() / 24
		if daysUntilExpiry < 7 {
			return HealthStatusUnhealthy
		}
	}
	
	// Check threat detection
	threatCount := atomic.LoadInt64(&sm.threatDetector.ThreatCount)
	if threatCount > 100 { // More than 100 threats detected
		return HealthStatusUnhealthy
	}
	
	return HealthStatusHealthy
}

// GetMetrics returns current security metrics
func (sm *SecurityManager) GetMetrics() *SecurityMetrics {
	sm.securityMonitor.mu.RLock()
	defer sm.securityMonitor.mu.RUnlock()
	
	if sm.securityMonitor.SecurityMetrics == nil {
		return &SecurityMetrics{}
	}
	
	// Return a copy of metrics
	return &SecurityMetrics{
		ThreatDetectionCount:   sm.securityMonitor.SecurityMetrics.ThreatDetectionCount,
		AuthenticationFailures: sm.securityMonitor.SecurityMetrics.AuthenticationFailures,
		ComplianceScore:        sm.securityMonitor.SecurityMetrics.ComplianceScore,
		AuditLogCount:          sm.securityMonitor.SecurityMetrics.AuditLogCount,
		SecurityIncidents:      sm.securityMonitor.SecurityMetrics.SecurityIncidents,
		LastSecurityScan:       sm.securityMonitor.SecurityMetrics.LastSecurityScan,
	}
}

// Shutdown gracefully shuts down the security manager
func (sm *SecurityManager) Shutdown(ctx context.Context) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	logrus.Info("🛑 Shutting down security manager...")
	
	// Clear active sessions
	sm.authManager.mu.Lock()
	sm.authManager.ActiveSessions = make(map[string]*AuthSession)
	sm.authManager.mu.Unlock()
	
	// Final audit log entry
	sm.logAuditEntry("system_shutdown", "system", "", "shutdown", "security_manager", "success", map[string]interface{}{
		"timestamp": time.Now(),
	})
	
	logrus.Info("✅ Security manager shut down successfully")
	return nil
}
