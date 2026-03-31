import html2pdf from 'html2pdf.js';

export default function generatePDF(element) {
  const opt = {
    margin: [0.4, 0.6, 0.4, 0.6],
    filename: 'State-of-Fraud-US-2024-Rulebase.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
      windowWidth: 900,
    },
    jsPDF: {
      unit: 'in',
      format: 'letter',
      orientation: 'portrait',
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.pdf-page-break',
      avoid: [
        '.print-avoid-break',
        '.chart-section',
        '.chart-wrapper',
        '.callout',
        '.expert-commentary',
        '.geo-card',
        '.stat-pair',
        '.stat-pair-card',
        '.stat-card',
        '.comparison-table',
        '.iceberg-block',
        '.map-section',
        '.map-panel',
      ],
    },
  };

  return html2pdf().set(opt).from(element).save();
}
