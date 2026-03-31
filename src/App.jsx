import { createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ReportLayout from './components/Layout/ReportLayout';
import ExecutiveSummary from './pages/ExecutiveSummary';
import HowFraudHappens from './pages/HowFraudHappens';
import WhereMoneyGoes from './pages/WhereMoneyGoes';
import WhoGetsHurt from './pages/WhoGetsHurt';
import Geography from './pages/Geography';
import Trends from './pages/Trends';
import Methodology from './pages/Methodology';
import { useReportDownload } from './pages/PrintReport';
import DownloadOverlay from './components/Layout/DownloadOverlay';

export const DownloadContext = createContext(null);

export default function App() {
  const download = useReportDownload();

  return (
    <DownloadContext.Provider value={download}>
      <BrowserRouter>
        <Routes>
          <Route element={<ReportLayout />}>
            <Route path="/" element={<ExecutiveSummary />} />
            <Route path="/how-fraud-happens" element={<HowFraudHappens />} />
            <Route path="/where-money-goes" element={<WhereMoneyGoes />} />
            <Route path="/who-gets-hurt" element={<WhoGetsHurt />} />
            <Route path="/geography" element={<Geography />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <DownloadOverlay />
      </BrowserRouter>
    </DownloadContext.Provider>
  );
}
