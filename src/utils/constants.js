/**
 * Side-rail dots: one anchor per vertical "beat." Each id must exist as an
 * element on its page at a distinct scroll position.
 * Dot counts: Overview 0, How 4, Where 3, Who 3, Geography 4, Trends 2, Methodology 2.
 */
export const REPORT_ROUTES = [
  {
    path: '/',
    label: 'Overview',
    subsections: [],
  },
  {
    path: '/how-fraud-happens',
    label: 'How It Happens',
    subsections: [
      { id: 'how-lead', label: 'Conversion' },
      { id: 'how-channels', label: 'Loss & categories' },
      { id: 'how-pig', label: 'Pig butchering' },
      { id: 'how-growth', label: 'Vs market' },
    ],
  },
  {
    path: '/where-money-goes',
    label: 'Where Money Goes',
    subsections: [
      { id: 'where-lead', label: 'Severity' },
      { id: 'where-evidence', label: 'Distribution' },
      { id: 'where-domain', label: 'For teams' },
    ],
  },
  {
    path: '/who-gets-hurt',
    label: 'Who Gets Hurt',
    subsections: [
      { id: 'who-intro', label: 'Overview' },
      { id: 'who-charts', label: 'By age' },
      { id: 'who-callouts', label: 'Key stats' },
    ],
  },
  {
    path: '/geography',
    label: 'Geography',
    subsections: [
      { id: 'geo-maps', label: 'Maps' },
      { id: 'geo-context', label: 'Analysis' },
      { id: 'geo-surprises', label: 'Standouts' },
      { id: 'geo-table', label: 'Top 10' },
    ],
  },
  {
    path: '/trends',
    label: 'Trends',
    subsections: [
      { id: 'trends-lead', label: 'Long view' },
      { id: 'trends-outlook', label: 'Outlook' },
    ],
  },
  {
    path: '/methodology',
    label: 'Methodology',
    subsections: [
      { id: 'method-scope', label: 'Scope & limits' },
      { id: 'method-detail', label: 'Math & terms' },
    ],
  },
];

export function getRouteByPath(pathname) {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
  return REPORT_ROUTES.find((r) => r.path === normalized) ?? REPORT_ROUTES[0];
}

export const CHART_COLORS = {
  primary: '#006aff',
  primaryLight: '#b2d2ff',
  primaryDark: '#002a66',
  danger: '#c52233',
  warning: '#fe5800',
  success: '#47ce66',
  muted: '#757575',
};

export const MAP_COLOR_SCALE = [
  '#f7faff',
  '#e5f0ff',
  '#b2d2ff',
  '#66a6ff',
  '#006aff',
  '#002a66',
  '#001533',
];

export const US_BOUNDS = [
  [24.396308, -125.0],
  [49.384358, -66.93457],
];

export const US_CENTER = [39.8283, -98.5795];

export const US_STATES_GEOJSON_URL =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
