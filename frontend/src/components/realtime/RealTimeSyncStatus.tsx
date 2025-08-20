/**
 * Real-Time Sync Status Component
 * Visual indicator for real-time synchronization status with device presence
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  WifiIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';

interface RealTimeSyncStatusProps {
  sessionId: string;
  userId?: string;
  showDetails?: boolean;
  showDeviceList?: boolean;
  className?: string;
}

export function RealTimeSyncStatus({
  sessionId,
  userId,
  showDetails = false,
  showDeviceList = false,
  className = ''
}: RealTimeSyncStatusProps) {
  const {
    isConnected,
    connectionQuality,
    connectedDevices,
    syncMetrics,
    lastSyncTime,
    isTyping,
    otherDevicesTyping,
    error,
    reconnect,
    syncHealth
  } = useRealTimeSync({
    sessionId,
    userId,
    enablePresenceTracking: true,
    enableTypingIndicators: true,
    enableAutoReconnect: true
  });

  const [showDetailedView, setShowDetailedView] = useState(showDetails);

  const getConnectionIcon = () => {
    if (!isConnected) {
      return <WifiIcon className="h-5 w-5 text-red-500" />;
    }
    
    switch (connectionQuality) {
      case 'excellent':
        return <SignalIcon className="h-5 w-5 text-green-500" />;
      case 'good':
        return <SignalIcon className="h-5 w-5 text-yellow-500" />;
      case 'poor':
        return <SignalIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <WifiIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'tablet':
        return <DeviceTabletIcon className="h-4 w-4" />;
      case 'desktop':
        return <ComputerDesktopIcon className="h-4 w-4" />;
      default:
        return <ComputerDesktopIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (!isConnected) return 'text-gray-500';
    
    switch (connectionQuality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (!isConnected) return 'Offline';
    
    switch (connectionQuality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`${className}`}>
      {/* Compact Status Indicator */}
      {!showDetailedView && (
        <div className="flex items-center space-x-2">
          {getConnectionIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          
          {connectedDevices.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {connectedDevices.length} devices
            </Badge>
          )}
          
          {otherDevicesTyping.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-blue-600">typing...</span>
            </div>
          )}
          
          {showDetails && (
            <button
              onClick={() => setShowDetailedView(true)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Details
            </button>
          )}
        </div>
      )}

      {/* Detailed Status View */}
      {showDetailedView && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getConnectionIcon()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Real-Time Sync
                </h3>
                <p className={`text-sm ${getStatusColor()}`}>
                  Status: {getStatusText()}
                </p>
              </div>
            </div>
            
            {showDetails && (
              <button
                onClick={() => setShowDetailedView(false)}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Hide Details
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={reconnect}
                className="mt-2"
              >
                Reconnect
              </Button>
            </div>
          )}

          {/* Sync Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {syncMetrics.totalOperations}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Total Syncs</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {(syncMetrics.successRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Success Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {syncMetrics.averageLatency.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Avg Latency</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {syncMetrics.conflictsResolved}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Conflicts Resolved</div>
            </div>
          </div>

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
              <ClockIcon className="h-4 w-4" />
              <span>
                Last sync: {lastSyncTime.toLocaleTimeString('id-ID')}
              </span>
            </div>
          )}

          {/* Connected Devices */}
          {showDeviceList && connectedDevices.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <UsersIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Connected Devices ({connectedDevices.length})
                </h4>
              </div>
              
              <div className="space-y-2">
                {connectedDevices.map((device) => (
                  <div key={device.deviceId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device.metadata.deviceType)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {device.metadata.deviceType.charAt(0).toUpperCase() + device.metadata.deviceType.slice(1)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {device.currentPage} • {device.lastSeen.toLocaleTimeString('id-ID')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`text-xs ${
                          device.status === 'online' ? 'bg-green-100 text-green-800' :
                          device.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {device.status}
                      </Badge>
                      
                      {device.isTyping && (
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal sync indicator for chat interface
 */
export function SyncIndicator({ sessionId, userId }: { sessionId: string; userId?: string }) {
  const { isConnected, connectionQuality, lastSyncTime, error } = useRealTimeSync({
    sessionId,
    userId,
    enablePresenceTracking: false,
    enableTypingIndicators: false
  });

  if (error) {
    return (
      <div className="flex items-center space-x-1 text-red-600">
        <ExclamationTriangleIcon className="h-3 w-3" />
        <span className="text-xs">Sync Error</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-1 text-gray-500">
        <WifiIcon className="h-3 w-3" />
        <span className="text-xs">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 text-green-600">
      <CheckCircleIcon className="h-3 w-3" />
      <span className="text-xs">Synced</span>
      {lastSyncTime && (
        <span className="text-xs text-gray-500">
          {lastSyncTime.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
}
