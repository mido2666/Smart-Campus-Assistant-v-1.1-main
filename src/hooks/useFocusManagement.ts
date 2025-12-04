import { useEffect, useRef, useCallback } from 'react';
import { focus } from '../utils/accessibility.tsx';

interface UseFocusManagementOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: HTMLElement | null;
  onFocusChange?: (element: HTMLElement | null) => void;
}

export function useFocusManagement(options: UseFocusManagementOptions = {}) {
  const {
    trapFocus = false,
    restoreFocus = true,
    initialFocus = null,
    onFocusChange,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const currentFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (restoreFocus) {
      previousFocusRef.current = focus.storeFocus();
    }
  }, [restoreFocus]);

  // Set initial focus
  useEffect(() => {
    if (initialFocus) {
      focus.focus(initialFocus);
      currentFocusRef.current = initialFocus;
      onFocusChange?.(initialFocus);
    } else if (containerRef.current && trapFocus) {
      focus.focusFirst(containerRef.current);
      const firstElement = focus.getFocusableElements(containerRef.current)[0];
      currentFocusRef.current = firstElement;
      onFocusChange?.(firstElement);
    }
  }, [initialFocus, trapFocus, onFocusChange]);

  // Handle focus trapping
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!trapFocus || !containerRef.current) return;
    
    focus.trapFocus(containerRef.current, event);
  }, [trapFocus]);

  // Set up focus trapping
  useEffect(() => {
    if (trapFocus && containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
      
      return () => {
        containerRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [trapFocus, handleKeyDown]);

  // Focus management functions
  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      focus.focusFirst(containerRef.current);
      const firstElement = focus.getFocusableElements(containerRef.current)[0];
      currentFocusRef.current = firstElement;
      onFocusChange?.(firstElement);
    }
  }, [onFocusChange]);

  const focusLast = useCallback(() => {
    if (containerRef.current) {
      focus.focusLast(containerRef.current);
      const focusableElements = focus.getFocusableElements(containerRef.current);
      const lastElement = focusableElements[focusableElements.length - 1];
      currentFocusRef.current = lastElement;
      onFocusChange?.(lastElement);
    }
  }, [onFocusChange]);

  const focusNext = useCallback(() => {
    if (currentFocusRef.current) {
      focus.focusNext(currentFocusRef.current);
      const focusableElements = focus.getFocusableElements(document.body);
      const currentIndex = focusableElements.indexOf(currentFocusRef.current);
      if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
        currentFocusRef.current = focusableElements[currentIndex + 1];
        onFocusChange?.(currentFocusRef.current);
      }
    }
  }, [onFocusChange]);

  const focusPrevious = useCallback(() => {
    if (currentFocusRef.current) {
      focus.focusPrevious(currentFocusRef.current);
      const focusableElements = focus.getFocusableElements(document.body);
      const currentIndex = focusableElements.indexOf(currentFocusRef.current);
      if (currentIndex !== -1 && currentIndex > 0) {
        currentFocusRef.current = focusableElements[currentIndex - 1];
        onFocusChange?.(currentFocusRef.current);
      }
    }
  }, [onFocusChange]);

  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousFocusRef.current) {
      focus.restoreFocus(previousFocusRef.current);
      currentFocusRef.current = previousFocusRef.current;
      onFocusChange?.(previousFocusRef.current);
    }
  }, [restoreFocus, onFocusChange]);

  const setFocus = useCallback((element: HTMLElement | null) => {
    focus.focus(element);
    currentFocusRef.current = element;
    onFocusChange?.(element);
  }, [onFocusChange]);

  const getFocusableElements = useCallback(() => {
    if (containerRef.current) {
      return focus.getFocusableElements(containerRef.current);
    }
    return [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        focus.restoreFocus(previousFocusRef.current);
      }
    };
  }, [restoreFocus]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    restorePreviousFocus,
    setFocus,
    getFocusableElements,
    currentFocus: currentFocusRef.current,
  };
}

export default useFocusManagement;
