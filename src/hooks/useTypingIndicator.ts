"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseTypingIndicatorOptions {
  // Callback to send typing status via WebSocket
  sendTypingStatus: (isTyping: boolean) => void;
  // Delay in ms before stopping typing indicator (default: 3000ms)
  stopDelay?: number;
}

export function useTypingIndicator({
  sendTypingStatus,
  stopDelay = 3000,
}: UseTypingIndicatorOptions) {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentRef = useRef<boolean | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle typing start
  const handleTypingStart = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only send if status changed
    if (lastSentRef.current !== true) {
      sendTypingStatus(true);
      lastSentRef.current = true;
    }

    setIsTyping(true);

    // Set timeout to stop typing after delay
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (lastSentRef.current !== false) {
        sendTypingStatus(false);
        lastSentRef.current = false;
      }
    }, stopDelay);
  }, [sendTypingStatus, stopDelay]);

  // Handle typing stop (explicit)
  const handleTypingStop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsTyping(false);

    if (lastSentRef.current !== false) {
      sendTypingStatus(false);
      lastSentRef.current = false;
    }
  }, [sendTypingStatus]);

  return {
    isTyping,
    handleTypingStart,
    handleTypingStop,
  };
}

// Hook to receive typing status from others
interface UseTypingReceiverOptions {
  // Map of conversationId -> isTyping
  initialTypingStatus?: Record<string, boolean>;
}

export function useTypingReceiver({ initialTypingStatus = {} }: UseTypingReceiverOptions = {}) {
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>(initialTypingStatus);

  // Update typing status for a conversation
  const updateTypingStatus = useCallback((conversationId: string, isTyping: boolean) => {
    setTypingUsers((prev) => ({
      ...prev,
      [conversationId]: isTyping,
    }));
  }, []);

  // Check if user is typing in a conversation
  const isUserTyping = useCallback((conversationId: string) => {
    return typingUsers[conversationId] ?? false;
  }, [typingUsers]);

  return {
    typingUsers,
    updateTypingStatus,
    isUserTyping,
  };
}
