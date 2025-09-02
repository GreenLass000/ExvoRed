import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ResizableColumnProps {
  children: React.ReactNode;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (width: number) => void;
  className?: string;
  resizable?: boolean;
  locked?: boolean;
}

export const ResizableColumn: React.FC<ResizableColumnProps> = ({
  children,
  width,
  minWidth = 50,
  maxWidth = 500,
  onResize,
  className = '',
  resizable = true,
  locked = false
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);
  const columnRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!resizable || locked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
    
    // Add cursor style to body
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [resizable, locked, width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
    
    onResize(newWidth);
  }, [isResizing, startX, startWidth, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    
    // Remove cursor style from body
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Handle mouse events
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Double click to auto-fit column
  const handleDoubleClick = useCallback(() => {
    if (!resizable || locked) return;
    
    // Get the text content and calculate optimal width
    const textContent = columnRef.current?.textContent || '';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
      context.font = '14px system-ui, -apple-system, sans-serif';
      const textWidth = context.measureText(textContent).width;
      
      // Add padding and clamp between min and max
      const optimalWidth = Math.min(maxWidth, Math.max(minWidth, textWidth + 40));
      onResize(optimalWidth);
    }
  }, [resizable, locked, minWidth, maxWidth, onResize]);

  return (
    <div 
      ref={columnRef}
      className={cn(
        "relative flex items-center",
        isResizing && "select-none",
        className
      )}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {resizable && !locked && (
        <div
          ref={resizeHandleRef}
          className={cn(
            "absolute right-0 top-0 h-full w-1 cursor-col-resize",
            "bg-transparent hover:bg-blue-500 hover:bg-opacity-20",
            "transition-colors duration-150",
            isResizing && "bg-blue-500 bg-opacity-40"
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          title="Arrastrar para redimensionar. Doble clic para ajustar automáticamente"
        >
          <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-300 dark:bg-gray-600" />
          
          {/* Visual indicator when hovering */}
          <div 
            className={cn(
              "absolute right-[-2px] top-1/2 transform -translate-y-1/2",
              "w-1 h-4 bg-blue-500 opacity-0 transition-opacity duration-150",
              "hover:opacity-100",
              isResizing && "opacity-100"
            )}
          />
        </div>
      )}
      
      {/* Lock indicator */}
      {locked && (
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-gray-400"
          >
            <path 
              d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" 
              fill="currentColor"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ResizableColumn;
