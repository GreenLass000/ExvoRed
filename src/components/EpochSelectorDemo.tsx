import React, { useState } from 'react';
import EpochSelector from './EpochSelector';
import { calculateEpochFromDate, calculateEpochFromYear } from '../utils/epochUtils';

/**
 * Componente de demostración del EpochSelector
 * Útil para probar la funcionalidad del selector de épocas
 */
const EpochSelectorDemo: React.FC = () => {
  const [selectedEpoch, setSelectedEpoch] = useState('');
  const [testDate, setTestDate] = useState('');
  const [testYear, setTestYear] = useState('');

  const handleDateTest = () => {
    const calculated = calculateEpochFromDate(testDate);
    if (calculated) {
      setSelectedEpoch(calculated);
    }
  };

  const handleYearTest = () => {
    const year = parseInt(testYear);
    if (!isNaN(year)) {
      const calculated = calculateEpochFromYear(year);
      setSelectedEpoch(calculated);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-700 mb-6">Demo del EpochSelector</h1>
      
      {/* Selector principal */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Selector de Épocas</h2>
        <EpochSelector
          value={selectedEpoch}
          onChange={setSelectedEpoch}
          placeholder="Selecciona una época..."
          className="max-w-md"
        />
        <p className="mt-2 text-sm text-gray-600">
          Época seleccionada: <span className="font-medium">{selectedEpoch || 'Ninguna'}</span>
        </p>
      </div>

      {/* Pruebas automáticas */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Calcular época desde fecha</h3>
          <div className="flex space-x-3 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleDateTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Calcular época
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Calcular época desde año</h3>
          <div className="flex space-x-3 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Año (ej: 1567)
              </label>
              <input
                type="number"
                value={testYear}
                onChange={(e) => setTestYear(e.target.value)}
                placeholder="1567"
                className="px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleYearTest}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Calcular época
            </button>
          </div>
        </div>
      </div>

      {/* Información útil */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Cómo funciona</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Las épocas se calculan en intervalos de 25 años</li>
          <li>• Los intervalos comienzan en años terminados en 01, 26, 51, 76</li>
          <li>• Puedes navegar entre siglos XIII (1201-1300) hasta el actual</li>
          <li>• Al introducir una fecha, la época se calcula automáticamente</li>
          <li>• Ejemplos: 1567 → 1551-1575, 1823 → 1801-1825</li>
        </ul>
      </div>
    </div>
  );
};

export default EpochSelectorDemo;
