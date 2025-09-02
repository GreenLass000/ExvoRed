import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Item = { label: string; keys: (string | React.ReactNode)[] };

const K = ({ children }: { children: React.ReactNode }) => (
  <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-slate-900 bg-slate-100 border border-slate-500 rounded">
    {children}
  </kbd>
);

const Row = ({ label, keys }: Item) => (
  <div className="grid grid-cols-12 items-start gap-2 py-2 px-3 hover:bg-slate-50">
    <div className="col-span-12 md:col-span-7 text-sm text-slate-900">{label}</div>
    <div className="col-span-12 md:col-span-5 flex flex-wrap gap-2 justify-start md:justify-end">
      {keys.map((k, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md border border-slate-400 bg-white px-2 py-1 shadow-sm"
        >
          {typeof k === 'string' ? <K>{k}</K> : k}
        </span>
      ))}
    </div>
  </div>
);

const Section = ({ title, items }: { title: string; items: Item[] }) => (
  <section className="bg-white rounded-lg shadow border border-slate-300 overflow-hidden">
    <div className="px-5 py-3 border-b border-slate-300 bg-slate-100">
      <h2 className="text-base md:text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    <div className="divide-y divide-slate-200">
      {items.map((item, idx) => (
        <Row key={idx} label={item.label} keys={item.keys} />
      ))}
    </div>
  </section>
);

const KeybindsPage: React.FC = () => {
  const navigate = useNavigate();

  // Navegación rápida en esta página: s/c/v/d/p/m
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox'
      );
      if (isTyping) return;

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          navigate('/sems');
          break;
        case 'c':
          e.preventDefault();
          navigate('/catalog');
          break;
        case 'v':
          e.preventDefault();
          navigate('/exvotos');
          break;
        case 'd':
          e.preventDefault();
          navigate('/divinities');
          break;
        case 'p':
          e.preventDefault();
          navigate('/characters');
          break;
        case 'm':
          e.preventDefault();
          navigate('/miracles');
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  const globalItems: Item[] = [
    {
      label: 'Crear nuevo registro en la página actual (Exvotos, SEMs, Catálogos, Divinidades, Personajes, Milagros)',
      keys: ['n']
    }
  ];

  const navItems: Item[] = [
    { label: 'Mover selección', keys: ['↑', '↓', '←', '→'] },
    { label: 'Ir a la primera/última columna', keys: [<><K>Ctrl</K> + <K>←</K></>, <><K>Ctrl</K> + <K>→</K></>] },
    { label: 'Moverse horizontalmente', keys: ['Tab', <><K>Shift</K> + <K>Tab</K></>] },
    { label: 'Primera/última columna de la fila', keys: ['Home', 'End'] },
    { label: 'Primera/última celda', keys: [<><K>Ctrl</K> + <K>Home</K></>, <><K>Ctrl</K> + <K>End</K></>] },
    { label: 'Desplazamiento por páginas (10 filas)', keys: ['PageUp', 'PageDown'] }
  ];

  const cellItems: Item[] = [
    { label: 'Ver contenido de la celda', keys: ['Enter'] },
    { label: 'Editar la celda', keys: ['e'] },
    { label: 'Ver detalles / navegar a referencia de la celda (SEM/Catálogo)', keys: ['i'] },
    { label: 'Editar registro completo (solo en detalle)', keys: ['E'] },
    { label: 'Seleccionar / deseleccionar fila', keys: [<><K>Shift</K> + <K>Espacio</K></>] },
    { label: 'Cerrar diálogos, paneles o limpiar selección', keys: ['Esc'] }
  ];

  const globalActions: Item[] = [
    { label: 'Seleccionar todas las filas visibles', keys: [<><K>Ctrl</K> + <K>A</K></>] },
    { label: 'Copiar contenido de la celda seleccionada', keys: [<><K>Ctrl</K> + <K>C</K></>] },
    { label: 'Imprimir', keys: [<><K>Ctrl</K> + <K>P</K></>, 'p'] },
    { label: 'Exportar', keys: [<><K>Ctrl</K> + <K>S</K></>] },
    { label: 'Abrir/cerrar panel de filtros/columnas', keys: [<><K>Ctrl</K> + <K>F</K></>] },
    { label: 'Resetear configuración de columnas', keys: [<><K>Ctrl</K> + <K>R</K></>] }
  ];

  const quickNav: Item[] = [
    { label: 'Ir a SEMs', keys: ['s'] },
    { label: 'Ir a Catálogos', keys: ['c'] },
    { label: 'Ir a Exvotos', keys: ['v'] },
    { label: 'Ir a Divinidades', keys: ['d'] },
    { label: 'Ir a Personajes', keys: ['p'] },
    { label: 'Ir a Milagros', keys: ['m'] }
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Atajos de Teclado</h1>
        <p className="text-slate-700 mt-2">Consulta todos los atajos disponibles en la aplicación.</p>
      </header>

      <Section title="Atajos globales por página" items={globalItems} />

      <Section title="Navegación en tablas tipo Excel" items={navItems} />

      <Section title="Acciones en celdas y registros" items={cellItems} />

      <Section title="Acciones globales" items={globalActions} />

      <Section title="Navegación rápida entre secciones" items={quickNav} />

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Nota: algunos atajos se desactivan si hay un modal abierto o si estás escribiendo en un campo de texto.
        </p>
      </section>
    </div>
  );
};

export default KeybindsPage;

