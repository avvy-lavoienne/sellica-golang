# Session-Based Logging Structure

**Date**: 2025-10-26  
**Update**: Changed from date/level-based organization to session-based  
**Benefit**: Perfect isolation of logs for each browser session

## What Changed

### Before
```
frontend/logs/
  frontend_info_2025-10-26.txt      ← All info logs for entire day
  frontend_error_2025-10-26.txt     ← All errors for entire day
  frontend_combined.txt              ← All logs for entire day
```

**Problem**: Multiple sessions mixed together → hard to debug one session

### After
```
frontend/logs/
  session_2025-10-26_15-30-45_ABC123/
    INFO.txt           ← Just this session's info logs
    ERROR.txt          ← Just this session's errors
    WARN.txt           ← Just this session's warnings
    DEBUG.txt          ← Just this session's debug logs
    COMBINED.txt       ← Just this session's all logs
  
  session_2025-10-26_15-45-20_XYZ789/
    INFO.txt
    ERROR.txt
    WARN.txt
    DEBUG.txt
    COMBINED.txt
```

**Benefit**: Each session completely isolated ✅

## Session ID Format

`session_YYYY-MM-DD_HH-MM-SS_[RANDOM]`

Example: `session_2025-10-26_15-30-45_ABC123`

- **Date**: When session started
- **Time**: Hour-Minute-Second precision
- **Random**: 6-character random code (distinguishes multiple sessions started in same second)

## How to Use

### View Logs from Current Session

```bash
# List all sessions today
ls "d:\Journey Code\Project\lab\sellica-golang\frontend\logs"

# Find your session (most recent usually at bottom)
# Example: session_2025-10-26_15-30-45_ABC123

# View complete log from that session
cat "d:\Journey Code\Project\lab\sellica-golang\frontend\logs\session_2025-10-26_15-30-45_ABC123\COMBINED.txt"

# View only errors
cat "d:\Journey Code\Project\lab\sellica-golang\frontend\logs\session_2025-10-26_15-30-45_ABC123\ERROR.txt"

# View only info
cat "d:\Journey Code\Project\lab\sellica-golang\frontend\logs\session_2025-10-26_15-30-45_ABC123\INFO.txt"
```

### Compare Two Sessions

```bash
# Side-by-side comparison
diff "d:\Journey Code\Project\lab\sellica-golang\frontend\logs\session_2025-10-26_15-30-45_ABC123\ERROR.txt" `
     "d:\Journey Code\Project\lab\sellica-golang\frontend\logs\session_2025-10-26_15-45-20_XYZ789\ERROR.txt"
```

### Find Session by Timestamp

```bash
# List all sessions for a specific hour
ls "d:\Journey Code\Project\lab\sellica-golang\frontend\logs" | grep "session_2025-10-26_15"

# Find sessions between two times
ls "d:\Journey Code\Project\lab\sellica-golang\frontend\logs" | grep "session_2025-10-26" | Select-String "15-3[0-9]|15-4[0-5]"
```

## Implementation Details

### API Route Changes

**File**: `frontend/src/app/api/logs/route.ts`

**Key changes**:
1. **Session tracking**: Generates unique session ID on first request
2. **Session persistence**: Stores session ID in memory for request lifetime
3. **Directory structure**: Creates `/logs/session_XXX/` directories
4. **File organization**: Writes `INFO.txt`, `ERROR.txt`, etc. within session dir
5. **Combined log**: Always writes to `COMBINED.txt` in session directory

**Session lifecycle**:
- **First request** → Generate session ID → Create directory
- **Subsequent requests** → Use same session ID → Write to same directory
- **Server restart** → New session ID generated (separate logs)
- **Browser refresh** → Same session ID (logs continue)

### Benefits for Debugging

✅ **Isolation**: Each session completely separate  
✅ **Precision**: Timestamp down to second level  
✅ **Uniqueness**: Random suffix handles multiple sessions per second  
✅ **Clarity**: Can immediately see which files belong to which session  
✅ **Comparison**: Easy to compare two sessions side-by-side  
✅ **Archival**: Sessions naturally organize by date and time  

## Migration Notes

- **Old files**: Removed `frontend_info_2025-10-26.txt` style files
- **New files**: Created on next session (automatic)
- **No code change needed**: Logger utility unchanged, only API route updated
- **Backward compatible**: Existing logger calls work exactly the same

## Next Steps

1. Restart dev server: `pnpm dev`
2. Browser will start a new session automatically
3. Session directory will be created: `session_2025-10-26_XX-XX-XX_XXXXXX`
4. All logs written to that directory
5. Check logs: `cat frontend/logs/session_2025-10-26_XX-XX-XX_XXXXXX/COMBINED.txt`
