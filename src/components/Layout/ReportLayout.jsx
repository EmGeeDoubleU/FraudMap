import { useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollProgress from '../common/ScrollProgress';
import { REPORT_ROUTES, getRouteByPath } from '../../utils/constants';

export default function ReportLayout() {
  const location = useLocation();

  const currentRoute = useMemo(() => getRouteByPath(location.pathname), [location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Header sections={REPORT_ROUTES} />
      <ScrollProgress
        subsections={currentRoute.subsections}
        routePath={location.pathname}
      />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
