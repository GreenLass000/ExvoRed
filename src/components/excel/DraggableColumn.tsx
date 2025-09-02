import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface DraggableColumnProps {
  children: React.ReactNode;
  index: number;
  onDragStart?: (index: number) => void;
  onDragOver?: (fromIndex: number, toIndex: number) => void;
  onDragEnd?: (fromIndex: number, toIndex: number) => void;
  draggable?: boolean;
  locked?: boolean;
  className?: string;
  columnKey: string;
}

export const DraggableColumn: React.FC<DraggableColumnProps> = ({
  children,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  draggable = true,
  locked = false,
  className = '',
  columnKey
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverPosition, setDragOverPosition] = useState<'left' | 'right' | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragImageRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!draggable || locked) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    
    // Create custom drag image
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const dragImage = elementRef.current.cloneNode(true) as HTMLDivElement;
      
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-9999px';
      dragImage.style.width = `${rect.width}px`;
      dragImage.style.height = `${rect.height}px`;
      dragImage.style.background = 'white';
      dragImage.style.border = '2px solid #3b82f6';
      dragImage.style.borderRadius = '4px';
      dragImage.style.opacity = '0.9';
      dragImage.style.transform = 'rotate(2deg)';
      dragImage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      
      document.body.appendChild(dragImage);
      dragImageRef.current = dragImage;
      
      // Set the drag image
      e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `column-${index}-${columnKey}`);
    
    onDragStart?.(index);
  }, [draggable, locked, index, columnKey, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!draggable) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!isDragOver) {
      setIsDragOver(true);
    }
    
    // Determine which side of the column the drag is over
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const midPoint = rect.left + rect.width / 2;
      const position = e.clientX < midPoint ? 'left' : 'right';
      setDragOverPosition(position);
    }
  }, [draggable, isDragOver]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    setIsDragOver(true);
  }, [draggable]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!draggable) return;
    
    // Only remove drag over state if we're actually leaving the element
    if (elementRef.current && !elementRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragOverPosition(null);
    }
  }, [draggable]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!draggable) return;
    
    e.preventDefault();
    setIsDragOver(false);
    setDragOverPosition(null);
    
    const data = e.dataTransfer.getData('text/plain');
    const [, fromIndexStr] = data.split('-');
    const fromIndex = parseInt(fromIndexStr, 10);
    
    if (!isNaN(fromIndex) && fromIndex !== index) {
      let toIndex = index;
      
      // Adjust target index based on drop position
      if (dragOverPosition === 'right') {
        toIndex = index + 1;
      }
      
      // Adjust for the fact that we're removing an item from the array
      if (fromIndex < toIndex) {
        toIndex--;
      }
      
      onDragEnd?.(fromIndex, toIndex);
      onDragOver?.(fromIndex, toIndex);
    }
  }, [draggable, index, dragOverPosition, onDragEnd, onDragOver]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsDragOver(false);
    setDragOverPosition(null);
    
    // Clean up drag image
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragImageRef.current) {
        document.body.removeChild(dragImageRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={elementRef}
      draggable={draggable && !locked}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative transition-all duration-150",
        draggable && !locked && "cursor-move",
        isDragging && "opacity-50 scale-95",
        isDragOver && "bg-blue-50 dark:bg-blue-900/20",
        locked && "cursor-not-allowed opacity-60",
        className
      )}
      title={locked ? "Columna bloqueada" : draggable ? "Arrastrar para reordenar" : undefined}
    >
      {/* Drop indicators */}
      {isDragOver && !locked && (
        <>
          <div
            className={cn(
              "absolute top-0 bottom-0 w-1 bg-blue-500 transition-opacity",
              dragOverPosition === 'left' ? 'left-0 opacity-100' : 'left-0 opacity-0'
            )}
          />
          <div
            className={cn(
              "absolute top-0 bottom-0 w-1 bg-blue-500 transition-opacity",
              dragOverPosition === 'right' ? 'right-0 opacity-100' : 'right-0 opacity-0'
            )}
          />
        </>
      )}

      {/* Drag handle indicator */}
      {draggable && !locked && !isDragging && (
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path 
              d="M8 6h8M8 12h8M8 18h8" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "relative",
        isDragging && "pointer-events-none"
      )}>
        {children}
      </div>

      {/* Lock indicator */}
      {locked && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <svg 
            width="14" 
            height="14" 
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

export default DraggableColumn;
