import { useEffect, useRef, useCallback, useState } from 'react';

interface SpatialNavigationConfig {
  containerSelector?: string;
  itemSelector?: string;
  rowSelector?: string;
  onEnter?: () => void;
  onBack?: () => void;
  onFocusChange?: (element: HTMLElement | null, direction: string) => void;
}

interface FocusableElement extends HTMLElement {
  dataset: {
    focusable?: string;
    row?: string;
    col?: string;
    id?: string;
  } & HTMLElement['dataset'];
}

export function useSpatialNavigation(config: SpatialNavigationConfig = {}) {
  const {
    containerSelector = '[data-nav-container]',
    itemSelector = '[data-focusable]',
    rowSelector = '[data-nav-row]',
    onEnter,
    onBack,
    onFocusChange,
  } = config;

  const containerRef = useRef<HTMLElement>(null);
  const focusedElementRef = useRef<FocusableElement | null>(null);
  const focusHistoryRef = useRef<FocusableElement[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get all focusable elements in the container
  const getFocusableElements = useCallback((): FocusableElement[] => {
    const container = containerRef.current || document;
    return Array.from(container.querySelectorAll<FocusableElement>(itemSelector))
      .filter(el => el.offsetParent !== null && !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  }, [itemSelector]);

  // Get elements in the same row
  const getRowElements = useCallback((element: FocusableElement): FocusableElement[] => {
    const row = element.closest(rowSelector) as HTMLElement;
    if (!row) return [];
    return Array.from(row.querySelectorAll<FocusableElement>(itemSelector))
      .filter(el => el.offsetParent !== null && !el.hasAttribute('disabled'));
  }, [itemSelector, rowSelector]);

  // Focus an element
  const focusElement = useCallback((element: FocusableElement | null, direction: string = '') => {
    if (focusedElementRef.current) {
      focusedElementRef.current.classList.remove('focused');
      focusedElementRef.current.removeAttribute('data-focused');
    }

    if (element) {
      element.classList.add('focused');
      element.setAttribute('data-focused', 'true');
      element.focus({ preventScroll: true });
      focusedElementRef.current = element;

      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } else {
      focusedElementRef.current = null;
    }

    onFocusChange?.(element, direction);
  }, [onFocusChange]);

  // Navigate in a direction
  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const current = focusedElementRef.current;
    if (!current) {
      // Focus first element
      focusElement(elements[0], direction);
      return;
    }

    let nextElement: FocusableElement | null = null;
    const currentRect = current.getBoundingClientRect();
    const currentRow = current.dataset.row;
    const currentCol = parseInt(current.dataset.col || '0', 10);

    switch (direction) {
      case 'left': {
        const rowElements = getRowElements(current);
        const currentIndex = rowElements.indexOf(current);
        if (currentIndex > 0) {
          nextElement = rowElements[currentIndex - 1];
        } else if (currentIndex === 0 && rowElements.length > 0) {
          // Wrap to last element in row
          nextElement = rowElements[rowElements.length - 1];
        }
        break;
      }
      case 'right': {
        const rowElements = getRowElements(current);
        const currentIndex = rowElements.indexOf(current);
        if (currentIndex < rowElements.length - 1) {
          nextElement = rowElements[currentIndex + 1];
        } else if (currentIndex === rowElements.length - 1 && rowElements.length > 0) {
          // Wrap to first element in row
          nextElement = rowElements[0];
        }
        break;
      }
      case 'up':
      case 'down': {
        // Find element in adjacent row with closest horizontal position
        const allRows = Array.from(document.querySelectorAll<HTMLElement>(rowSelector));
        const currentRowIndex = allRows.findIndex(row => row.contains(current));

        if (currentRowIndex === -1) break;

        const targetRowIndex = direction === 'up' ? currentRowIndex - 1 : currentRowIndex + 1;
        if (targetRowIndex < 0 || targetRowIndex >= allRows.length) break;

        const targetRow = allRows[targetRowIndex];
        const targetElements = Array.from(targetRow.querySelectorAll<FocusableElement>(itemSelector))
          .filter(el => el.offsetParent !== null && !el.hasAttribute('disabled'));

        if (targetElements.length === 0) break;

        // Find element with closest horizontal center
        const currentCenter = currentRect.left + currentRect.width / 2;
        nextElement = targetElements.reduce((closest, el) => {
          const rect = el.getBoundingClientRect();
          const center = rect.left + rect.width / 2;
          const closestRect = closest.getBoundingClientRect();
          const closestCenter = closestRect.left + closestRect.width / 2;

          return Math.abs(center - currentCenter) < Math.abs(closestCenter - currentCenter) ? el : closest;
        }, targetElements[0]);
        break;
      }
    }

    if (nextElement) {
      focusElement(nextElement, direction);
    }
  }, [getFocusableElements, getRowElements, focusElement]);

  // Handle key events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle if we're in a navigation container
    const container = containerRef.current || document.querySelector(containerSelector);
    if (!container) return;

    const target = event.target as HTMLElement;
    const isInContainer = container.contains(target) || target === container;
    if (!isInContainer) return;

    let handled = false;

    switch (event.key) {
      case 'ArrowLeft':
        navigate('left');
        handled = true;
        break;
      case 'ArrowRight':
        navigate('right');
        handled = true;
        break;
      case 'ArrowUp':
        navigate('up');
        handled = true;
        break;
      case 'ArrowDown':
        navigate('down');
        handled = true;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onEnter?.();
        handled = true;
        break;
      case 'Backspace':
      case 'Escape':
        event.preventDefault();
        onBack?.();
        handled = true;
        break;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [containerSelector, navigate, onEnter, onBack]);

  // Initialize - focus first element
  const initialize = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0 && !focusedElementRef.current) {
      focusElement(elements[0], 'init');
    }
  }, [getFocusableElements, focusElement]);

  // Cleanup
  const destroy = useCallback(() => {
    if (focusedElementRef.current) {
      focusedElementRef.current.classList.remove('focused');
      focusedElementRef.current.removeAttribute('data-focused');
    }
    focusedElementRef.current = null;
    focusHistoryRef.current = [];
  }, []);

  // Set container ref
  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  // Effect for key handling
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Effect for initial focus
  useEffect(() => {
    const timer = setTimeout(initialize, 100);
    return () => clearTimeout(timer);
  }, [initialize]);

  return {
    containerRef: setContainerRef,
    focusedElement: focusedElementRef.current,
    navigate,
    focusElement,
    initialize,
    destroy,
    isNavigating,
  };
}

// Hook for managing focus within a specific row/section
export function useRowNavigation(rowId: string) {
  const rowRef = useRef<HTMLElement>(null);
  const focusedIndexRef = useRef(0);

  const getItems = useCallback(() => {
    if (!rowRef.current) return [];
    return Array.from(rowRef.current.querySelectorAll<HTMLElement>('[data-focusable]'))
      .filter(el => el.offsetParent !== null && !el.hasAttribute('disabled'));
  }, []);

  const focusItem = useCallback((index: number) => {
    const items = getItems();
    if (index >= 0 && index < items.length) {
      items.forEach((item, i) => {
        if (i === index) {
          item.classList.add('focused');
          item.setAttribute('data-focused', 'true');
          item.focus({ preventScroll: true });
        } else {
          item.classList.remove('focused');
          item.removeAttribute('data-focused');
        }
      });
      focusedIndexRef.current = index;
    }
  }, [getItems]);

  const navigateLeft = useCallback(() => {
    const items = getItems();
    if (items.length === 0) return;
    const nextIndex = (focusedIndexRef.current - 1 + items.length) % items.length;
    focusItem(nextIndex);
  }, [getItems, focusItem]);

  const navigateRight = useCallback(() => {
    const items = getItems();
    if (items.length === 0) return;
    const nextIndex = (focusedIndexRef.current + 1) % items.length;
    focusItem(nextIndex);
  }, [getItems, focusItem]);

  const setRowRef = useCallback((element: HTMLElement | null) => {
    rowRef.current = element;
  }, []);

  return {
    rowRef: setRowRef,
    focusItem,
    navigateLeft,
    navigateRight,
    focusedIndex: focusedIndexRef.current,
  };
}