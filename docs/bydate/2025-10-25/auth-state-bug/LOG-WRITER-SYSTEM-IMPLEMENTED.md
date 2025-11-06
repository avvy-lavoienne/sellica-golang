# 📝 Backend Log Writer System

**Status**: ✅ Implemented and Compiled
**Feature**: Automatic log file writing with timestamps

---

## What It Does

Every time you run the backend, logs are automatically saved to a file:

```
logs/backend/backend_2025-10-25_14-30-45_Oct-25-2025.txt
                 ↓                      ↓
              TIMESTAMP              DATE LABEL
```

**Logs are written to**:
- ✅ Console (still visible in terminal)
- ✅ File (saved for later review)

---

## How to Use

### Start Backend as Normal

```powershell
cd backend
go run cmd/server/main.go
```

**Output**:
```
📝 Logs will be saved to: ./logs/backend/backend_2025-10-25_14-30-45_Oct-25-2025.txt
✅ Server listening on :8080
...
```

### Find Your Logs

**File location**: `backend/logs/backend/`

**Filename format**: `backend_YYYY-MM-DD_HH-MM-SS_Mon-DD-YYYY.txt`

**Example**:
```
backend_2025-10-25_14-30-45_Oct-25-2025.txt
backend_2025-10-25_15-45-20_Oct-25-2025.txt
backend_2025-10-26_08-15-30_Oct-26-2025.txt
```

---

## Log File Structure

Each log file starts with a session header:

```
2025-10-25 14:30:45 UTC
========================================
BACKEND SESSION STARTED: Monday, October 25, 2025 at 2:30:45 PM UTC
========================================

✅ Server listening on :8080
🚀 All systems initialized
🔑 Auth service initialized
...
[More logs]
...

2025-10-25 15:45:32 UTC
BACKEND SESSION ENDED
========================================
```

---

## Clean Console

**Before** (Too many logs):
```powershell
$ go run cmd/server/main.go
[spam of logs...]
[can't see anything...]
```

**After** (Clean console):
```powershell
$ go run cmd/server/main.go
📝 Logs will be saved to: ./logs/backend/backend_2025-10-25_14-30-45_Oct-25-2025.txt
✅ Server listening on :8080
🚀 All systems initialized
[relevant logs only...]
```

---

## View Logs Later

### Option 1: Open Log File Directly
```powershell
# Open in VS Code
code backend/logs/backend/backend_2025-10-25_14-30-45_Oct-25-2025.txt

# Or open in Notepad
notepad backend/logs/backend/backend_2025-10-25_14-30-45_Oct-25-2025.txt
```

### Option 2: View in Terminal
```powershell
# View latest log
Get-Content (Get-Item backend/logs/backend/*.txt | Sort-Object LastWriteTime -Descending | Select-Object -First 1)

# Or tail last 50 lines
Get-Content backend/logs/backend/backend_*.txt -Tail 50

# Search for specific text
Select-String -Path "backend/logs/backend/*.txt" -Pattern "ERROR"
```

### Option 3: VS Code Explorer
1. Click Explorer (Ctrl+Shift+E)
2. Navigate: `backend/logs/backend/`
3. Double-click any `.txt` file to view

---

## Log Writer Features

| Feature | Description |
|---------|-------------|
| **Timestamped files** | Each run creates new file with timestamp |
| **Date labels** | Easy to find logs by date |
| **Dual output** | Console + file simultaneously |
| **Session headers** | Know when session started/ended |
| **Auto directory** | Creates `logs/backend/` if needed |
| **Append mode** | Can append to existing files if needed |
| **Formatted logs** | Same formatting in console and file |

---

## Use Cases

### Debugging Without Console Spam
```powershell
# Terminal stays clean, all logs in file
go run cmd/server/main.go
```

### Tracking Performance
```powershell
# All timing logs in file
# Easy to search for slow queries
```

### Error Investigation
```powershell
# Complete error history saved
# Can review errors after session ends
# Search for ERROR or WARN
```

### Audit Trail
```powershell
# Complete record of all operations
# Who did what and when
# Useful for compliance/debugging
```

---

## File Locations

```
backend/
├── logs/
│   └── backend/
│       ├── backend_2025-10-25_14-30-45_Oct-25-2025.txt
│       ├── backend_2025-10-25_15-45-20_Oct-25-2025.txt
│       ├── backend_2025-10-25_16-20-15_Oct-25-2025.txt
│       └── backend_2025-10-26_08-15-30_Oct-26-2025.txt
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   └── utils/
│       └── logwriter/
│           └── logwriter.go
└── ...
```

---

## Implementation Details

### Log Writer Code
**File**: `backend/internal/utils/logwriter/logwriter.go`

Features:
- Creates logs directory if needed
- Generates timestamped filenames
- Uses `io.MultiWriter` for dual output
- Proper file closing (session footer)
- Error handling

### Integration
**File**: `backend/cmd/server/main.go`

Integration:
```go
// Initialize log writer
lw, err := logwriter.NewLogWriter("./logs/backend")
if err != nil {
    // Continue without file logging
} else {
    defer lw.Close()
    lw.SetupLogrus()
}
```

---

## Troubleshooting

### Logs not being created?
```
✅ Check: ./logs/backend/ directory exists
✅ Check: You have write permissions
✅ Check: Disk has space available
✅ Check: Backend actually running (not erroring on startup)
```

### Can't find log file?
```
# List all log files
ls backend/logs/backend/

# Or in PowerShell
dir backend/logs/backend/
```

### File is huge/too many logs?
```
# Delete old logs
rm backend/logs/backend/backend_2025-10-20*.txt

# Or keep only recent logs
Get-ChildItem backend/logs/backend/ -File | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5 | Remove-Item
```

---

## Testing

When you run the backend now:

```powershell
cd backend
go run cmd/server/main.go
```

**You should see**:
```
📝 Logs will be saved to: ./logs/backend/backend_2025-10-25_14-30-45_Oct-25-2025.txt
✅ Server listening on :8080
🚀 All systems initialized
```

**Then check**:
```powershell
# View the log file
cat backend/logs/backend/backend_2025-10-25_14-30-45_Oct-25-2025.txt

# You should see complete logs including:
# - Session start header
# - All startup messages
# - Request/response logs
# - Errors (if any)
# - Session end header
```

---

## Benefits

✅ **Clean console** - See only important messages
✅ **Complete history** - All logs saved in files
✅ **Easy debugging** - Search logs for specific issues
✅ **Audit trail** - Know what happened and when
✅ **Performance tracking** - Monitor logs over time
✅ **Error investigation** - Complete error history

---

**Status**: ✅ Ready to use
**Next**: Run backend and check the log files!
**Location**: `backend/logs/backend/`
