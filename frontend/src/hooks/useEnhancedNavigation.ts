'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SilpanaMode, type NavigationState, type SilpanaTab } from '@/types/silpana/silpana';

// Enhanced navigation configuration
const SILPANA_TABS: SilpanaTab[] = [
  {
    id: SilpanaMode.FORM,
    label: 'Buat Pengaduan',
    icon: '📝',
    description: 'Buat pengaduan baru dan dapatkan kode tiket',
    keyboardShortcut: 'F'
  },
  {
    id: SilpanaMode.LOOKUP,
    label: 'Lihat Pengaduan Saya',
    icon: '🔍',
    description: 'Cari dan lihat status pengaduan Anda',
    keyboardShortcut: 'L'
  },
  {
    id: SilpanaMode.REKAP,
    label: 'Rekap Data',
    icon: '📊',
    description: 'Lihat rekapitulasi semua pengaduan',
    keyboardShortcut: 'R'
  },
  {
    id: SilpanaMode.ADMIN,
    label: 'Admin Panel',
    icon: '⚙️',
    description: 'Panel administrasi untuk pengelolaan tiket',
    keyboardShortcut: 'A',
    requiresAuth: true
  }
];

interface UseEnhancedNavigationOptions {
  enableKeyboardShortcuts?: boolean;
  enableUrlSync?: boolean;
  defaultMode?: SilpanaMode;
  onModeChange?: (mode: SilpanaMode, previous: SilpanaMode | null) => void;
}

export function useEnhancedNavigation(options: UseEnhancedNavigationOptions = {}) {
  const {
    enableKeyboardShortcuts = true,
    enableUrlSync = true,
    defaultMode = SilpanaMode.FORM,
    onModeChange
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL or default
  const getInitialMode = useCallback((): SilpanaMode => {
    if (!enableUrlSync) return defaultMode;
    
    const urlMode = searchParams?.get('mode') as SilpanaMode;
    if (urlMode && Object.values(SilpanaMode).includes(urlMode)) {
      return urlMode;
    }
    return defaultMode;
  }, [searchParams, enableUrlSync, defaultMode]);

  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeMode: getInitialMode(),
    previousMode: null,
    transitionDirection: 'none',
    isLoading: false
  });

  // Tab configuration with dynamic states
  const tabs = useMemo(() => {
    return SILPANA_TABS.map(tab => ({
      ...tab,
      isActive: tab.id === navigationState.activeMode,
      isDisabled: tab.disabled || false
    }));
  }, [navigationState.activeMode]);

  // Enhanced navigation function
  const navigateToMode = useCallback((
    newMode: SilpanaMode, 
    options: { 
      skipTransition?: boolean;
      updateUrl?: boolean;
      silent?: boolean;
    } = {}
  ) => {
    const { skipTransition = false, updateUrl = enableUrlSync, silent = false } = options;

    if (newMode === navigationState.activeMode) return;

    // Check if tab requires auth (future enhancement)
    const targetTab = SILPANA_TABS.find(tab => tab.id === newMode);
    if (targetTab?.requiresAuth) {
      // TODO: Implement auth check
      console.warn('Tab requires authentication:', newMode);
    }

    // Determine transition direction
    const currentIndex = SILPANA_TABS.findIndex(tab => tab.id === navigationState.activeMode);
    const newIndex = SILPANA_TABS.findIndex(tab => tab.id === newMode);
    const direction = newIndex > currentIndex ? 'forward' : 'backward';

    // Update state with transition
    setNavigationState(prev => ({
      activeMode: newMode,
      previousMode: prev.activeMode,
      transitionDirection: skipTransition ? 'none' : direction,
      isLoading: false
    }));

    // Update URL if enabled
    if (updateUrl && router) {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('mode', newMode);
      router.replace(`?${params.toString()}`, { scroll: false });
    }

    // Trigger callback
    if (!silent && onModeChange) {
      onModeChange(newMode, navigationState.activeMode);
    }
  }, [navigationState.activeMode, enableUrlSync, router, searchParams, onModeChange]);

  // Keyboard shortcut handler
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Ctrl/Cmd + Shift + key
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) return;

      // Prevent default browser shortcuts
      const shortcutTab = SILPANA_TABS.find(tab => 
        tab.keyboardShortcut && 
        event.key.toLowerCase() === tab.keyboardShortcut.toLowerCase()
      );

      if (shortcutTab) {
        event.preventDefault();
        navigateToMode(shortcutTab.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, navigateToMode]);

  // URL sync effect
  useEffect(() => {
    if (!enableUrlSync) return;

    const urlMode = searchParams?.get('mode') as SilpanaMode;
    if (urlMode && urlMode !== navigationState.activeMode && Object.values(SilpanaMode).includes(urlMode)) {
      navigateToMode(urlMode, { updateUrl: false, silent: true });
    }
  }, [searchParams, enableUrlSync, navigationState.activeMode, navigateToMode]);

  // Navigation utilities
  const goToNext = useCallback(() => {
    const currentIndex = SILPANA_TABS.findIndex(tab => tab.id === navigationState.activeMode);
    const nextIndex = (currentIndex + 1) % SILPANA_TABS.length;
    navigateToMode(SILPANA_TABS[nextIndex].id);
  }, [navigationState.activeMode, navigateToMode]);

  const goToPrevious = useCallback(() => {
    const currentIndex = SILPANA_TABS.findIndex(tab => tab.id === navigationState.activeMode);
    const prevIndex = currentIndex === 0 ? SILPANA_TABS.length - 1 : currentIndex - 1;
    navigateToMode(SILPANA_TABS[prevIndex].id);
  }, [navigationState.activeMode, navigateToMode]);

  const goBack = useCallback(() => {
    if (navigationState.previousMode) {
      navigateToMode(navigationState.previousMode);
    }
  }, [navigationState.previousMode, navigateToMode]);

  // Get tab by mode
  const getTab = useCallback((mode: SilpanaMode) => {
    return SILPANA_TABS.find(tab => tab.id === mode);
  }, []);

  return {
    // Current state
    currentMode: navigationState.activeMode,
    previousMode: navigationState.previousMode,
    isTransitioning: navigationState.transitionDirection !== 'none',
    transitionDirection: navigationState.transitionDirection,
    isLoading: navigationState.isLoading,
    
    // Tab configuration
    tabs,
    availableModes: SILPANA_TABS.map(tab => tab.id),
    
    // Navigation actions
    navigateToMode,
    goToNext,
    goToPrevious,
    goBack,
    
    // Utilities
    getTab,
    isActiveMode: (mode: SilpanaMode) => mode === navigationState.activeMode,
    canNavigate: (mode: SilpanaMode) => {
      const tab = getTab(mode);
      return !tab?.disabled && (!tab?.requiresAuth || true); // TODO: Add auth check
    }
  };
}