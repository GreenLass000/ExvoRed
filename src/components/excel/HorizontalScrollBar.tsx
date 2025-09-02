import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface HorizontalScrollBarProps {
  scrollPosition: number;
  containerWidth: number;
  contentWidth: number;
  onScroll: (position: number) => void;
  className?: string;
  visible?: boolean;
}

export const HorizontalScrollBar: React.FC<HorizontalScrollBarProps> = ({
  scrollPosition,
  containerWidth,
  contentWidth,
  onScroll,
  className = '',
  visible = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startScrollPosition, setStartScrollPosition] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Calculate thumb properties
  const maxScroll = Math.max(0, contentWidth - containerWidth);
  const scrollRatio = maxScroll > 0 ? scrollPosition / maxScroll : 0;
  const thumbRatio = containerWidth / contentWidth;
  const thumbWidth = Math.max(20, containerWidth * thumbRatio);
  const trackWidth = containerWidth;
  const thumbPosition = (trackWidth - thumbWidth) * scrollRatio;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartScrollPosition(scrollPosition);
    
    document.body.style.userSelect = 'none';
  }, [scrollPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    
    const deltaX = e.clientX - startX;
    const trackRect = trackRef.current.getBoundingClientRect();
    const maxThumbPosition = trackRect.width - thumbWidth;
    const newThumbPosition = Math.max(0, Math.min(maxThumbPosition, thumbPosition + deltaX));
    const newScrollRatio = maxThumbPosition > 0 ? newThumbPosition / maxThumbPosition : 0;
    const newScrollPosition = newScrollRatio * maxScroll;
    
    onScroll(newScrollPosition);
  }, [isDragging, startX, thumbPosition, thumbWidth, maxScroll, onScroll]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  }, []);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current || e.target === thumbRef.current) return;
    
    const trackRect = trackRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - trackRect.left;
    const clickRatio = clickPosition / trackRect.width;
    const newScrollPosition = clickRatio * maxScroll;
    
    onScroll(newScrollPosition);
  }, [maxScroll, onScroll]);

  // Handle mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const scrollStep = containerWidth * 0.1; // 10% of container width
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onScroll(Math.max(0, scrollPosition - scrollStep));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onScroll(Math.min(maxScroll, scrollPosition + scrollStep));
        break;
      case 'Home':
        e.preventDefault();
        onScroll(0);
        break;
      case 'End':
        e.preventDefault();
        onScroll(maxScroll);
        break;
      case 'PageLeft':
        e.preventDefault();
        onScroll(Math.max(0, scrollPosition - containerWidth * 0.5));
        break;
      case 'PageRight':
        e.preventDefault();
        onScroll(Math.min(maxScroll, scrollPosition + containerWidth * 0.5));
        break;
    }
  }, [scrollPosition, maxScroll, containerWidth, onScroll]);

  // Don't render if not needed
  if (!visible || maxScroll <= 0) {
    return null;
  }

  return (
    <div className={cn(
      "relative h-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700",
      className
    )}>
      {/* Track */}
      <div
        ref={trackRef}
        className="absolute inset-0 cursor-pointer"
        onClick={handleTrackClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="scrollbar"
        aria-orientation="horizontal"
        aria-valuenow={scrollPosition}
        aria-valuemin={0}
        aria-valuemax={maxScroll}
        aria-label="Barra de desplazamiento horizontal"
      >
        {/* Thumb */}
        <div
          ref={thumbRef}
          className={cn(
            "absolute top-0.5 bottom-0.5 rounded transition-all duration-150",
            "bg-gray-400 dark:bg-gray-500 hover:bg-gray-500 dark:hover:bg-gray-400",
            isDragging && "bg-gray-600 dark:bg-gray-300",
            "cursor-pointer"
          )}
          style={{
            left: `${thumbPosition}px`,
            width: `${thumbWidth}px`
          }}
          onMouseDown={handleMouseDown}
          title="Arrastrar para desplazar horizontalmente"
        />
      </div>

      {/* Scroll indicators */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
        {scrollPosition > 0 && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
        {scrollPosition < maxScroll && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Position indicator */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded pointer-events-none">
        {Math.round(scrollRatio * 100)}%
      </div>
    </div>
  );
};

export default HorizontalScrollBar;
