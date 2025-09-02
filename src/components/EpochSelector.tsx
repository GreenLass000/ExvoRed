import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getEpochsByCentury, getCenturyFromEpoch, getCenturyName } from '../utils/epochUtils';

interface EpochSelectorProps {
  value: string;
  onChange: (epoch: string) => void;
  placeholder?: string;
  className?: string;
}

const EpochSelector: React.FC<EpochSelectorProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar época...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCentury, setCurrentCentury] = useState(15); // Siglo XV por defecto (1401-1500)
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obtener el siglo actual (para limitar la navegación hacia el futuro)
  const getCurrentCentury = (): number => {
    const currentYear = new Date().getFullYear();
    return Math.ceil(currentYear / 100);
  };

  const currentSystemCentury = getCurrentCentury();
  const minCentury = 13; // Siglo XIII (1201-1300)
  const maxCentury = currentSystemCentury; // Siglo actual

  // Épocas del siglo seleccionado
  const currentEpochs = useMemo(() => 
    getEpochsByCentury(currentCentury), 
    [currentCentury]
  );

  // Navegar entre siglos
  const goToPreviousCentury = () => {
    if (currentCentury > minCentury) {
      setCurrentCentury(currentCentury - 1);
    }
  };

  const goToNextCentury = () => {
    if (currentCentury < maxCentury) {
      setCurrentCentury(currentCentury + 1);
    }
  };

  // Detectar siglo del valor seleccionado para mostrar el correcto al abrir
  useEffect(() => {
    if (value && isOpen) {
      const yearMatch = value.match(/^(\d{4})-\d{4}$/);
      if (yearMatch) {
        const startYear = parseInt(yearMatch[1]);
        const detectedCentury = Math.ceil(startYear / 100);
        if (detectedCentury >= minCentury && detectedCentury <= maxCentury) {
          setCurrentCentury(detectedCentury);
        }
      }
    }
  }, [isOpen, value, minCentury, maxCentury]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEpochSelect = (epoch: string) => {
    onChange(epoch);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <span className={value ? 'text-slate-900' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Navegador de siglos */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <button
              type="button"
              onClick={goToPreviousCentury}
              disabled={currentCentury <= minCentury}
              className="p-1 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Siglo anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-700">
                {getCenturyName(currentCentury)}
              </div>
              <div className="text-xs text-slate-500">
                ({(currentCentury - 1) * 100 + 1}-{currentCentury * 100})
              </div>
            </div>
            
            <button
              type="button"
              onClick={goToNextCentury}
              disabled={currentCentury >= maxCentury}
              className="p-1 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Siguiente siglo"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Lista de épocas */}
          <div className="max-h-48 overflow-y-auto">
            {currentEpochs.map((epoch) => {
              const isSelected = value === epoch;
              return (
                <button
                  key={epoch}
                  type="button"
                  onClick={() => handleEpochSelect(epoch)}
                  className={`w-full px-4 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-slate-700'
                  }`}
                >
                  {epoch}
                </button>
              );
            })}
          </div>

          {/* Opciones adicionales */}
          <div className="border-t border-slate-200 p-2">
            <button
              type="button"
              onClick={() => handleEpochSelect('')}
              className="w-full px-3 py-2 text-left text-slate-500 hover:bg-slate-50 rounded text-sm transition-colors"
            >
              Limpiar selección
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpochSelector;
