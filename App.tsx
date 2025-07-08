import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const SemPage = lazy(() => import('./pages/SemPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ExvotoPage = lazy(() => import('./pages/ExvotoPage'));
const ExvotoDetailPage = lazy(() => import('./pages/ExvotoDetailPage'));
const CharactersPage = lazy(() => import('./pages/CharactersPage'));
const MiraclesPage = lazy(() => import('./pages/MiraclesPage'));

const App: React.FC = () => {
    return (
        <Router>
            <Layout>
                <ErrorBoundary>
                    <Suspense fallback={<div className="p-8 text-center">Cargando página...</div>}>
                        <Routes>
                            <Route path="/" element={<Navigate replace to="/exvotos" />} />
                            <Route path="/sem" element={<SemPage />} />
                            <Route path="/catalog" element={<CatalogPage />} />
                            <Route path="/exvotos" element={<ExvotoPage />} />
                            <Route path="/exvoto/:id" element={<ExvotoDetailPage />} />
                            <Route path="/characters" element={<CharactersPage />} />
                            <Route path="/miracles" element={<MiraclesPage />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </Layout>
        </Router>
    );
};

export default App;