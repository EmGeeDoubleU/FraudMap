import { createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ReportLayout from './components/Layout/ReportLayout';

import FraudExecutiveSummary from './pages/fraud/ExecutiveSummary';
import HowFraudHappens from './pages/fraud/HowFraudHappens';
import WhereMoneyGoes from './pages/fraud/WhereMoneyGoes';
import WhoGetsHurt from './pages/fraud/WhoGetsHurt';
import Geography from './pages/fraud/Geography';
import Trends from './pages/fraud/Trends';
import FraudMethodology from './pages/fraud/Methodology';
import { useReportDownload } from './pages/fraud/PrintReport';

import ComplaintsExecutiveSummary from './pages/complaints/ExecutiveSummary';
import Flood from './pages/complaints/Flood';
import Denials from './pages/complaints/Denials';
import Corrections from './pages/complaints/Corrections';
import ComplaintsMethodology from './pages/complaints/Methodology';

import ReportSwitcher from './pages/ReportSwitcher';
import DownloadOverlay from './components/Layout/DownloadOverlay';

export const DownloadContext = createContext(null);

export default function App() {
  const download = useReportDownload();

  return (
    <DownloadContext.Provider value={download}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ReportSwitcher />} />

          <Route element={<ReportLayout reportKey="fraud" />}>
            <Route path="/fraud" element={<FraudExecutiveSummary />} />
            <Route path="/fraud/how-fraud-happens" element={<HowFraudHappens />} />
            <Route path="/fraud/where-money-goes" element={<WhereMoneyGoes />} />
            <Route path="/fraud/who-gets-hurt" element={<WhoGetsHurt />} />
            <Route path="/fraud/geography" element={<Geography />} />
            <Route path="/fraud/trends" element={<Trends />} />
            <Route path="/fraud/methodology" element={<FraudMethodology />} />
          </Route>

          <Route element={<ReportLayout reportKey="complaints" />}>
            <Route path="/complaints" element={<ComplaintsExecutiveSummary />} />
            <Route path="/complaints/flood" element={<Flood />} />
            <Route path="/complaints/denials" element={<Denials />} />
            <Route path="/complaints/corrections" element={<Corrections />} />
            <Route path="/complaints/methodology" element={<ComplaintsMethodology />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DownloadOverlay />
      </BrowserRouter>
    </DownloadContext.Provider>
  );
}
