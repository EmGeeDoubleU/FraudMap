import { useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollProgress from '../common/ScrollProgress';
import { getRoutesForReport, getRouteByPath } from '../../utils/constants';

export default function ReportLayout({ reportKey = 'fraud' }) {
  const location = useLocation();
  const routes = useMemo(() => getRoutesForReport(reportKey), [reportKey]);
  const currentRoute = useMemo(() => getRouteByPath(location.pathname, reportKey), [location.pathname, reportKey]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Header sections={routes} reportKey={reportKey} />
      <ScrollProgress
        subsections={currentRoute.subsections}
        routePath={location.pathname}
      />
      <main>
        <Outlet />
      </main>
      <Footer reportKey={reportKey} />
    </>
  );
}
