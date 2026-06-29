import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

export type FloatingWindowBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DragState = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export function useFloatingWindow(params: {
  defaultBounds: FloatingWindowBounds;
  minWidth: number;
  minHeight: number;
}) {
  const { defaultBounds, minWidth, minHeight } = params;
  const windowRef = useRef<HTMLDivElement | null>(null);
  const restoreBoundsRef = useRef(defaultBounds);
  const dragRef = useRef<DragState | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [bounds, setBounds] = useState(defaultBounds);
  const [fullscreen, setFullscreen] = useState(false);

  const clampBounds = (nextBounds: FloatingWindowBounds) => {
    if (typeof window === 'undefined') {
      return nextBounds;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(Math.max(nextBounds.width, minWidth), Math.max(minWidth, viewportWidth - 32));
    const height = Math.min(Math.max(nextBounds.height, minHeight), Math.max(minHeight, viewportHeight - 32));
    const left = Math.min(Math.max(nextBounds.left, 16), Math.max(16, viewportWidth - width - 16));
    const top = Math.min(Math.max(nextBounds.top, 16), Math.max(16, viewportHeight - height - 16));

    return { left, top, width, height };
  };

  const openWindow = () => {
    setFullscreen(false);
    setBounds((current) => {
      if (typeof window === 'undefined') {
        return clampBounds(current);
      }

      return clampBounds({
        ...current,
        left: Math.round((window.innerWidth - current.width) / 2),
        top: Math.round((window.innerHeight - current.height) / 2),
      });
    });
    setIsOpen(true);
  };

  const closeWindow = () => {
    setIsOpen(false);
  };

  const handleHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (fullscreen || event.button !== 0) {
      return;
    }

    const element = windowRef.current;
    const rect = element?.getBoundingClientRect();
    const liveBounds = rect
      ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      : bounds;

    const clampedLiveBounds = clampBounds(liveBounds);
    setBounds(clampedLiveBounds);
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - clampedLiveBounds.left,
      offsetY: event.clientY - clampedLiveBounds.top,
      width: clampedLiveBounds.width,
      height: clampedLiveBounds.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (fullscreen) {
      return;
    }
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    setBounds(
      clampBounds({
        left: event.clientX - dragState.offsetX,
        top: event.clientY - dragState.offsetY,
        width: dragState.width,
        height: dragState.height,
      })
    );
  };

  const handleHeaderPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const toggleFullscreen = () => {
    if (typeof window === 'undefined') {
      return;
    }

    setBounds((current) => {
      if (fullscreen) {
        return clampBounds(restoreBoundsRef.current);
      }

      restoreBoundsRef.current = current;
      return {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });
    setFullscreen((current) => !current);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncFullscreenBounds = () => {
      if (fullscreen) {
        setBounds({
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    syncFullscreenBounds();
    window.addEventListener('resize', syncFullscreenBounds);
    return () => window.removeEventListener('resize', syncFullscreenBounds);
  }, [fullscreen]);

  return {
    windowRef: windowRef as RefObject<HTMLDivElement>,
    isOpen,
    setIsOpen,
    openWindow,
    closeWindow,
    bounds,
    setBounds,
    clampBounds,
    fullscreen,
    setFullscreen,
    toggleFullscreen,
    handleHeaderPointerDown,
    handleHeaderPointerMove,
    handleHeaderPointerUp,
  };
}
