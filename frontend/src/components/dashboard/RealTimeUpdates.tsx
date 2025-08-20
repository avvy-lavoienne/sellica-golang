"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info,
  X,
  Pause,
  Play,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/conn/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'react-toastify'

// Real-time connection status
interface ConnectionStatusProps {
  isOnline: boolean
  lastUpdate?: Date
  className?: string
}

export function ConnectionStatus({ isOnline, lastUpdate, className }: ConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer",
        isOnline 
          ? "bg-success/10 text-success hover:bg-success/20" 
          : "bg-destructive/10 text-destructive hover:bg-destructive/20",
        className
      )}
      onClick={() => setShowDetails(!showDetails)}
    >
      {isOnline ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
      
      <AnimatePresence>
        {showDetails && lastUpdate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 p-2 bg-popover border rounded-md shadow-md z-50"
          >
            <p className="text-xs text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Real-time notification system
interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClearAll: () => void
  className?: string
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  className
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Info className="h-4 w-4 text-primary" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear all
            </Button>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-3 border-b hover:bg-muted/50 cursor-pointer",
                  !notification.read && "bg-primary/5"
                )}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {notification.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    {notification.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          notification.action!.onClick()
                        }}
                      >
                        {notification.action.label}
                      </Button>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Auto-refresh component
interface AutoRefreshProps {
  onRefresh: () => Promise<void>
  interval?: number // in seconds
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
  className?: string
}

export function AutoRefresh({
  onRefresh,
  interval = 30,
  enabled = false,
  onToggle,
  className
}: AutoRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeLeft, setTimeLeft] = useState(interval)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    setTimeLeft(interval)
    
    // Countdown timer
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return interval
        }
        return prev - 1
      })
    }, 1000)

    // Refresh timer
    intervalRef.current = setInterval(async () => {
      if (!isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } catch (error) {
          console.error('Auto-refresh failed:', error)
        } finally {
          setIsRefreshing(false)
        }
      }
    }, interval * 1000)
  }, [interval, onRefresh, isRefreshing])

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setTimeLeft(interval)
  }, [interval])

  useEffect(() => {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }

    return () => {
      stopAutoRefresh()
    }
  }, [enabled, startAutoRefresh, stopAutoRefresh])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      if (enabled) {
        startAutoRefresh() // Reset the timer
      }
    } catch (error) {
      console.error('Manual refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleManualRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        <span className="ml-2 hidden sm:inline">
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-refresh</span>
              <Switch
                checked={enabled}
                onCheckedChange={onToggle}
              />
            </div>
            
            {enabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Next refresh in:</span>
                  <Badge variant="secondary">{timeLeft}s</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggle?.(false)}
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                </div>
              </div>
            )}
            
            {!enabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle?.(true)}
                className="w-full"
              >
                <Play className="h-3 w-3 mr-1" />
                Start Auto-refresh
              </Button>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Real-time data hook
export function useRealTimeData<T>(
  fetchFunction: () => Promise<T>,
  options: {
    interval?: number
    enabled?: boolean
    onError?: (error: Error) => void
    onSuccess?: (data: T) => void
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const {
    interval = 30000, // 30 seconds
    enabled = true,
    onError,
    onSuccess
  } = options

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchFunction()
      setData(result)
      setLastUpdate(new Date())
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, onError, onSuccess])

  useEffect(() => {
    if (!enabled) return

    fetchData()
    const intervalId = setInterval(fetchData, interval)

    return () => clearInterval(intervalId)
  }, [fetchData, interval, enabled])

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch: fetchData
  }
}

// WebSocket connection hook
export function useWebSocket(url: string, options: {
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  enabled?: boolean
} = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const { onMessage, onError, onOpen, onClose, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      onOpen?.()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        onMessage?.(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      onError?.(error)
    }

    ws.onclose = () => {
      setIsConnected(false)
      onClose?.()
    }

    return () => {
      ws.close()
    }
  }, [url, enabled, onMessage, onError, onOpen, onClose])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [isConnected])

  return {
    isConnected,
    lastMessage,
    sendMessage
  }
}
