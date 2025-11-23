# API Contract: Supabase Real-Time Subscriptions & Direct Queries

**Date**: 2025-11-02  
**Component**: TopNav (Search, Notifications, Real-Time Updates)  
**Technology**: Supabase JavaScript Client v2.x

## 1. Real-Time Subscription: notifications Channel

**Purpose**: Receive real-time updates when notifications are marked read/unread  
**Table**: public.notifications  
**RLS Policy**: Users see only their own notifications  
**Message Rate**: 1-100 per minute per user

### Subscribe

```typescript
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Payload contains new row data
      console.log('Notification updated:', payload.new);
      setNotifications(prev => 
        prev.map(n => n.id === payload.new.id ? payload.new : n)
      );
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new);
      setNotifications(prev => [payload.new, ...prev]);
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### Payload Format (INSERT)

```json
{
  "type": "INSERT",
  "new": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pengajuan Baru",
    "message": "Ada pengajuan data rekam baru yang perlu ditinjau",
    "type": "info",
    "read": false,
    "action_json": {
      "label": "Lihat Detail",
      "href": "/data-rekam/123e4567"
    },
    "created_at": "2025-11-02T10:00:00Z",
    "updated_at": "2025-11-02T10:00:00Z"
  }
}
```

### Payload Format (UPDATE)

```json
{
  "type": "UPDATE",
  "new": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "read": true,
    "updated_at": "2025-11-02T10:05:00Z"
  },
  "old": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "read": false,
    "updated_at": "2025-11-02T10:00:00Z"
  }
}
```

### Error Handling

```typescript
const subscription = channel
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Subscribed to notifications');
    } else if (status === 'CLOSED') {
      console.log('Subscription closed');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Subscription error:', err);
      // Show graceful error state (not error toast)
      setNotifications([]); // Clear and show empty state
    }
  });
```

---

## 2. Direct Query: Select Notifications

**Purpose**: Initial load of notifications on component mount  
**Table**: public.notifications  
**RLS Policy**: Users see only their own notifications  
**Performance SLA**: <200ms p95

### Query

```typescript
const { data: notifications, error } = await supabase
  .from('notifications')
  .select(`
    id,
    title,
    message,
    time,
    read,
    type,
    action_json,
    created_at,
    updated_at
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('Failed to fetch notifications:', error);
  return [];
}

return notifications || [];
```

### Response

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Pengajuan Baru",
    "message": "Ada pengajuan data rekam baru...",
    "time": "15 menit yang lalu",
    "read": false,
    "type": "info",
    "action_json": { "label": "Lihat Detail", "href": "/data-rekam/123" },
    "created_at": "2025-11-02T10:00:00Z",
    "updated_at": "2025-11-02T10:00:00Z"
  },
  {
    "id": "234e5678-e89b-12d3-a456-426614174001",
    "title": "Pengingat Validasi",
    "message": "Jangan lupa untuk menyelesaikan validasi...",
    "time": "2 jam yang lalu",
    "read": false,
    "type": "warning",
    "action_json": null,
    "created_at": "2025-11-02T08:00:00Z",
    "updated_at": "2025-11-02T08:00:00Z"
  }
]
```

---

## 3. Update: Mark Notification as Read

**Purpose**: Update notification read status  
**Table**: public.notifications  
**RLS Policy**: Users can update only their own notifications  
**Performance SLA**: <100ms p95

### Mutation

```typescript
const { error } = await supabase
  .from('notifications')
  .update({ read: true })
  .eq('id', notificationId)
  .eq('user_id', userId);

if (error) {
  console.error('Failed to mark notification as read:', error);
  // Show toast error, allow retry
  toast.error('Unable to mark notification as read');
  return false;
}

// Real-time listener will update UI automatically
return true;
```

### Supabase RLS Constraint

```sql
CREATE POLICY "users_update_own_notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
```

---

## 4. Direct Query: Search SILPANA Tickets

**Purpose**: Admin search for tickets (SearchBar component)  
**Table**: public.silpana  
**RLS Policy**: Admins see all, users see only own  
**Performance SLA**: <200ms p95 (after 300ms debounce)

### Query (Admin)

```typescript
const { data: tickets, error } = await supabase
  .from('silpana')
  .select(`
    id,
    ticket_code,
    nama_pengaduan,
    status,
    priority_level,
    created_at
  `)
  .or(
    `ticket_code.ilike.%${searchQuery}%,` +
    `nama_pengaduan.ilike.%${searchQuery}%`
  )
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('Search error:', error);
  return [];
}

return tickets || [];
```

### Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ticket_code": "AK-2025-001",
    "nama_pengaduan": "Akta Kelahiran - Koreksi Nama",
    "status": "open",
    "priority_level": 2,
    "created_at": "2025-11-01T08:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "ticket_code": "AK-2025-002",
    "nama_pengaduan": "Akta Kelahiran - Data Induk Tidak Jelas",
    "status": "in_progress",
    "priority_level": 1,
    "created_at": "2025-11-02T10:15:00Z"
  }
]
```

### RLS Policy (SILPANA)

```sql
-- Admins see all tickets
-- Users see only their own (where user_id = auth.uid())
-- Anonymous submissions have user_id = NULL
CREATE POLICY "silpana_select_by_role" ON public.silpana
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() = user_id
  OR user_id IS NULL
);
```

---

## 5. Direct Query: Fetch User Avatar

**Purpose**: Get avatar_url from profiles table (fallback if GoAuthAPI missing)  
**Table**: public.profiles  
**RLS Policy**: Users see own profile, admins see all  
**Performance SLA**: <200ms p95

### Query

```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('id, email, name, avatar_url, nip, position')
  .eq('id', userId)
  .single();

if (error) {
  console.error('Failed to fetch profile:', error);
  return null; // Fallback to initials
}

return profile?.avatar_url || null;
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar_url": "https://supabase.../avatar-123.jpg",
  "nip": "197503152005011001",
  "position": "Kepala Bagian"
}
```

### Note

- GoAuthAPI.getProfile() is PREFERRED over direct Supabase query
- Use this only if GoAuthAPI fails or is unavailable
- Respects RLS: User can only see own profile unless admin

---

## RLS Policy Reference

### notifications Table

```sql
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Users mark their own as read
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- System inserts notifications
GRANT INSERT ON public.notifications TO postgres;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
```

### silpana Table

```sql
-- Enable RLS
ALTER TABLE public.silpana ENABLE ROW LEVEL SECURITY;

-- Admins see all, users see own, anonymous see own (user_id IS NULL)
CREATE POLICY "silpana_select_by_role" ON public.silpana
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() = user_id
  OR user_id IS NULL
);

-- Authenticated users can insert
CREATE POLICY "silpana_anon_insert" ON public.silpana
FOR INSERT WITH CHECK (true);

-- Users update only their own tickets
CREATE POLICY "silpana_update_own" ON public.silpana
FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

GRANT INSERT ON public.silpana TO anon, authenticated;
GRANT SELECT, UPDATE ON public.silpana TO authenticated;
```

### profiles Table

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users see own profile, admins see all
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

-- Users update own profile
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
```

---

## Error Handling Strategies

### Network Timeout (>3 seconds)

```typescript
const query = supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId);

// Add timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 3000)
);

try {
  const { data, error } = await Promise.race([query, timeoutPromise]);
  if (error) throw error;
} catch (err) {
  console.error('Query timeout or error:', err);
  // Show graceful error, not crash
  setNotifications([]); // Empty state
}
```

### RLS Violation (403)

```typescript
const { error } = await supabase
  .from('notifications')
  .update({ read: true })
  .eq('id', id)
  .eq('user_id', userId);

if (error?.code === 'PGRST301') {
  // RLS violation - user doesn't own this notification
  console.warn('Not authorized to update this notification');
  toast.error('You do not have permission to update this notification');
} else if (error) {
  console.error('Unexpected error:', error);
  toast.error('Failed to update notification');
}
```

### Subscription Reconnect (Auto)

```typescript
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', { /* ... */ }, handleChange)
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Resubscribed after disconnect');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Subscription error:', err);
      // Supabase client auto-reconnects with exponential backoff
    }
  });
```

---

**Supabase Contracts Complete**: 2025-11-02  
**Status**: ✅ Ready for frontend development
