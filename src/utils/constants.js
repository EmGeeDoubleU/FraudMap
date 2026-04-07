export const FRAUD_ROUTES = [
  {
    path: '/fraud',
    label: 'Overview',
    subsections: [],
  },
  {
    path: '/fraud/how-fraud-happens',
    label: 'How It Happens',
    subsections: [
      { id: 'how-lead', label: 'Conversion' },
      { id: 'how-channels', label: 'Loss & categories' },
      { id: 'how-pig', label: 'Pig butchering' },
      { id: 'how-growth', label: 'Vs market' },
    ],
  },
  {
    path: '/fraud/where-money-goes',
    label: 'Where Money Goes',
    subsections: [
      { id: 'where-lead', label: 'Severity' },
      { id: 'where-evidence', label: 'Distribution' },
      { id: 'where-domain', label: 'For teams' },
    ],
  },
  {
    path: '/fraud/who-gets-hurt',
    label: 'Who Gets Hurt',
    subsections: [
      { id: 'who-intro', label: 'Overview' },
      { id: 'who-charts', label: 'By age' },
      { id: 'who-callouts', label: 'Key stats' },
    ],
  },
  {
    path: '/fraud/geography',
    label: 'Geography',
    subsections: [
      { id: 'geo-maps', label: 'Maps' },
      { id: 'geo-context', label: 'Analysis' },
      { id: 'geo-surprises', label: 'Standouts' },
      { id: 'geo-table', label: 'Top 10' },
    ],
  },
  {
    path: '/fraud/trends',
    label: 'Trends',
    subsections: [
      { id: 'trends-lead', label: 'Long view' },
      { id: 'trends-outlook', label: 'Outlook' },
    ],
  },
  {
    path: '/fraud/methodology',
    label: 'Methodology',
    subsections: [
      { id: 'method-scope', label: 'Scope & limits' },
      { id: 'method-detail', label: 'Math & terms' },
    ],
  },
];

export const COMPLAINTS_ROUTES = [
  {
    path: '/complaints',
    label: 'Overview',
    subsections: [],
  },
  {
    path: '/complaints/flood',
    label: 'The Flood',
    subsections: [
      { id: 'flood-trend', label: 'Volume trend' },
      { id: 'flood-products', label: 'Products' },
      { id: 'flood-geo', label: 'Geography' },
      { id: 'flood-gaming', label: 'Why exploding' },
    ],
  },
  {
    path: '/complaints/denials',
    label: 'The Denials',
    subsections: [
      { id: 'denials-growth', label: 'Growth rates' },
      { id: 'denials-outcomes', label: 'Response outcomes' },
      { id: 'denials-authorized', label: 'Authorized defense' },
      { id: 'denials-checking', label: 'Checking issues' },
    ],
  },
  {
    path: '/complaints/corrections',
    label: 'The Corrections',
    subsections: [
      { id: 'corrections-outcomes', label: 'Response outcomes' },
      { id: 'corrections-issues', label: 'Top issues' },
      { id: 'corrections-growth', label: 'Issue growth' },
      { id: 'corrections-furnisher', label: 'Furnisher problem' },
    ],
  },
  {
    path: '/complaints/methodology',
    label: 'Methodology',
    subsections: [
      { id: 'method-scope', label: 'Scope & limits' },
      { id: 'method-detail', label: 'Terms' },
    ],
  },
];

// Legacy alias — kept for backward compat if anything references it
export const REPORT_ROUTES = FRAUD_ROUTES;

export function getRoutesForReport(reportKey) {
  return reportKey === 'complaints' ? COMPLAINTS_ROUTES : FRAUD_ROUTES;
}

export function getRouteByPath(pathname, reportKey) {
  const routes = getRoutesForReport(reportKey);
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
  return routes.find((r) => r.path === normalized) ?? routes[0];
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
