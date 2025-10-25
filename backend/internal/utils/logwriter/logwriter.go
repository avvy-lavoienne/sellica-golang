package logwriter

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/sirupsen/logrus"
)

// LogWriter writes logs to both console and file
type LogWriter struct {
	logFile *os.File
	logPath string
}

// NewLogWriter creates a new log writer that saves logs to files
func NewLogWriter(logsDir string) (*LogWriter, error) {
	// Create logs directory if it doesn't exist
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create logs directory: %w", err)
	}

	// Generate filename with timestamp
	now := time.Now()
	timestamp := now.Format("2006-01-02_15-04-05")
	dateLabel := now.Format("Jan-02-2006")
	filename := fmt.Sprintf("backend_%s_%s.txt", timestamp, dateLabel)
	logPath := filepath.Join(logsDir, filename)

	// Create log file
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return nil, fmt.Errorf("failed to open log file: %w", err)
	}

	// Write session header
	header := fmt.Sprintf("\n========================================\nBACKEND SESSION STARTED: %s\n========================================\n\n",
		now.Format("Monday, January 2, 2006 at 3:04:05 PM MST"))
	logFile.WriteString(header)

	fmt.Printf("📝 Logs will be saved to: %s\n", logPath)

	return &LogWriter{
		logFile: logFile,
		logPath: logPath,
	}, nil
}

// SetupLogrus configures logrus to write to both console and file
func (lw *LogWriter) SetupLogrus() {
	// Create multi-writer for console and file
	multiWriter := io.MultiWriter(os.Stdout, lw.logFile)

	// Setup logrus
	logrus.SetOutput(multiWriter)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02 15:04:05",
		ForceColors:     true,
	})
	logrus.SetLevel(logrus.InfoLevel)
}

// Close closes the log file properly
func (lw *LogWriter) Close() error {
	if lw.logFile != nil {
		// Write session footer
		footer := fmt.Sprintf("\n========================================\nBACKEND SESSION ENDED: %s\n========================================\n",
			time.Now().Format("Monday, January 2, 2006 at 3:04:05 PM MST"))
		lw.logFile.WriteString(footer)

		return lw.logFile.Close()
	}
	return nil
}

// GetLogPath returns the current log file path
func (lw *LogWriter) GetLogPath() string {
	return lw.logPath
}
