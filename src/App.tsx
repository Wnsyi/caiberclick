import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import HomePage from './pages/HomePage';
import ConsultationPage from './pages/ConsultationPage';
import PrescriptionPage from './pages/PrescriptionPage';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="min-h-screen bg-[#1a1a2e] text-amber-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route path="/prescription" element={<PrescriptionPage />} />
          </Routes>
        </div>
      </HashRouter>
    </AppProvider>
  );
}
