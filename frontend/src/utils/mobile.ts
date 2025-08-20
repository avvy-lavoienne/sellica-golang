/**
 * Mobile-specific utilities for touch interactions and device detection
 */

import React from 'react';

// Device detection
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
};

// Touch and haptic feedback
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light'): void => {
  if (typeof window === 'undefined') return;
  
  // Modern Haptic API (limited support)
  if ('vibrate' in navigator) {
    const patterns = {
      light: 50,
      medium: 100,
      heavy: 200,
    };
    
    navigator.vibrate(patterns[type]);
  }
  
  // iOS Haptic Feedback (requires user gesture)
  if (isIOS() && 'DeviceMotionEvent' in window) {
    // iOS haptic feedback would require native integration
    // For now, we'll use vibration API fallback
  }
};

// Screen and viewport utilities
export const getViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0;
  
  // Use visual viewport if available (accounts for virtual keyboard)
  if ('visualViewport' in window && window.visualViewport) {
    return window.visualViewport.height;
  }
  
  return window.innerHeight;
};

export const getViewportWidth = (): number => {
  if (typeof window === 'undefined') return 0;
  
  if ('visualViewport' in window && window.visualViewport) {
    return window.visualViewport.width;
  }
  
  return window.innerWidth;
};

// Safe area utilities
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
  };
};

// Touch gesture utilities
export interface TouchGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'none';
  duration: number;
}

export const detectSwipeGesture = (
  startTouch: Touch,
  endTouch: Touch,
  startTime: number,
  endTime: number,
  threshold: number = 50
): TouchGesture => {
  const deltaX = endTouch.clientX - startTouch.clientX;
  const deltaY = endTouch.clientY - startTouch.clientY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const duration = endTime - startTime;
  
  let direction: TouchGesture['direction'] = 'none';
  
  if (distance > threshold) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
  }
  
  return {
    startX: startTouch.clientX,
    startY: startTouch.clientY,
    endX: endTouch.clientX,
    endY: endTouch.clientY,
    deltaX,
    deltaY,
    distance,
    direction,
    duration,
  };
};

// Virtual keyboard detection
export const useVirtualKeyboard = () => {
  const [keyboardState, setKeyboardState] = React.useState({
    isVisible: false,
    height: 0,
  });

  React.useEffect(() => {
    // Early return inside useEffect is allowed
    if (typeof window === 'undefined') return;
    if (!('visualViewport' in window)) return;

    const viewport = window.visualViewport!;

    const handleViewportChange = () => {
      const keyboardHeight = window.innerHeight - viewport.height;
      const isVisible = keyboardHeight > 150; // Threshold for keyboard detection

      setKeyboardState({
        isVisible,
        height: isVisible ? keyboardHeight : 0,
      });
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);

    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  return keyboardState;
};

// Prevent zoom on double tap
export const preventZoom = (element: HTMLElement): (() => void) => {
  let lastTouchEnd = 0;
  
  const handleTouchEnd = (e: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  };
  
  element.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  return () => {
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

// Smooth scroll utilities
export const smoothScrollToElement = (
  element: HTMLElement,
  options: ScrollIntoViewOptions = {}
): void => {
  const defaultOptions: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
  };
  
  element.scrollIntoView({ ...defaultOptions, ...options });
};

export const smoothScrollToBottom = (container: HTMLElement): void => {
  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  });
};

// Performance utilities for mobile
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Mobile-specific CSS classes
export const getMobileClasses = () => {
  const classes = [];
  
  if (isMobile()) {
    classes.push('mobile-device');
  }
  
  if (isIOS()) {
    classes.push('ios-device');
  }
  
  if (isAndroid()) {
    classes.push('android-device');
  }
  
  return classes.join(' ');
};

// Network detection for mobile
export const getNetworkInfo = () => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return { effectiveType: 'unknown', downlink: 0, rtt: 0 };
  }
  
  const connection = (navigator as any).connection;
  
  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
  };
};

// Battery API for mobile optimization
export const getBatteryInfo = async () => {
  if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
    return { level: 1, charging: true };
  }
  
  try {
    const battery = await (navigator as any).getBattery();
    return {
      level: battery.level,
      charging: battery.charging,
    };
  } catch {
    return { level: 1, charging: true };
  }
};


