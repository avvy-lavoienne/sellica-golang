'use client';

import { useState, useCallback } from 'react';

export interface ChatUIState {
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
  hasUnreadMessages: boolean;
}

export function useChatUI(initialState?: Partial<ChatUIState>) {
  const [uiState, setUIState] = useState<ChatUIState>({
    isOpen: false,
    isMinimized: false,
    isExpanded: false,
    hasUnreadMessages: false,
    ...initialState,
  });

  const toggleChat = useCallback(() => {
    console.log("toggleChat called");
    setUIState((prev) => {
      const newState = {
        ...prev,
        isOpen: !prev.isOpen,
        isMinimized: false, // Reset minimize when opening/closing
      };
      console.log("toggleChat new state:", newState);
      return newState;
    });
  }, []);

  const minimizeChat = useCallback(() => {
    console.log("minimizeChat called");
    setUIState((prev) => {
      const newState = {
        ...prev,
        isMinimized: true,
      };
      console.log("minimizeChat new state:", newState);
      return newState;
    });
  }, []);

  const maximizeChat = useCallback(() => {
    console.log("maximizeChat called");
    setUIState((prev) => {
      const newState = {
        ...prev,
        isMinimized: false,
      };
      console.log("maximizeChat new state:", newState);
      return newState;
    });
  }, []);

  const toggleExpanded = useCallback(() => {
    console.log("toggleExpanded called");
    setUIState((prev) => {
      const newState = {
        ...prev,
        isExpanded: !prev.isExpanded,
      };
      console.log("toggleExpanded new state:", newState);
      return newState;
    });
  }, []);

  const openChat = useCallback(() => {
    console.log('openChat called');
    setUIState(prev => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
    }));
  }, []);

  const closeChat = useCallback(() => {
    console.log('closeChat called');
    setUIState(prev => ({
      ...prev,
      isOpen: false,
      isMinimized: false,
      isExpanded: false,
    }));
  }, []);

  return {
    uiState,
    toggleChat,
    minimizeChat,
    maximizeChat,
    toggleExpanded,
    openChat,
    closeChat,
    setUIState,
  };
}
