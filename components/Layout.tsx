import React from 'react';
import { NavLink } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { path: '/exvotos', label: 'Exvotos' },
    { path: '/sem', label: 'SEM (Lugares)' },
    { path: '/catalog', label: 'Catálogos' },
    { path: '/characters', label: 'Personajes' },
    { path: '/miracles', label: 'Milagros' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const activeLinkClass = "bg-blue-600 text-white";
    const inactiveLinkClass = "text-slate-300 hover:bg-slate-700 hover:text-white";

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="bg-slate-800 text-white shadow-md sticky top-0 z-40">
                <nav className="container mx-auto px-6 flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                         <h1 className="text-xl font-bold">ExvoRed</h1>
                    </div>
                    <div className="flex items-baseline space-x-4">
                        {navItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => 
                                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? activeLinkClass : inactiveLinkClass}`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>
            </header>
            <main className="py-6 px-6">
                {children}
            </main>
        </div>
    );
};

export default Layout;