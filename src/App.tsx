import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const SemPage = lazy(() => import('./pages/SemPage'));
const SemDetailPage = lazy(() => import('./pages/SemDetailPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CatalogDetailPage = lazy(() => import('./pages/CatalogDetailPage'));
const ExvotoPage = lazy(() => import('./pages/ExvotoPage'));
const ExvotoDetailPage = lazy(() => import('./pages/ExvotoDetailPage'));
const CharactersPage = lazy(() => import('./pages/CharactersPage'));
const MiraclesPage = lazy(() => import('./pages/MiraclesPage'));
const DivinitiesPage = lazy(() => import('./pages/DivinitiesPage'));

const App: React.FC = () => {
    return (
        <Router>
            <Layout>
                <ErrorBoundary>
                    <Suspense fallback={<div className="p-8 text-center">Cargando página...</div>}>
                        <Routes>
                            <Route path="/" element={<Navigate replace to="/exvotos" />} />
                            <Route path="/sems" element={<SemPage />} />
                            <Route path="/sem/:id" element={<SemDetailPage />} />
                            <Route path="/catalog" element={<CatalogPage />} />
                            <Route path="/catalog/:id" element={<CatalogDetailPage />} />
                            <Route path="/exvotos" element={<ExvotoPage />} />
                            <Route path="/exvoto/:id" element={<ExvotoDetailPage />} />
                            <Route path="/characters" element={<CharactersPage />} />
<Route path="/miracles" element={<MiraclesPage />} />
                            <Route path="/divinities" element={<DivinitiesPage />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </Layout>
        </Router>
    );
};

export default App;