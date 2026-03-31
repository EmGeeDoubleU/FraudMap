import { useContext } from 'react';
import { DownloadContext } from '../../App';
import PrintReport from '../../pages/PrintReport';

export default function DownloadOverlay() {
  const { downloading, onDone } = useContext(DownloadContext);

  if (!downloading) return null;

  return (
    <>
      {/* Visible overlay with spinner */}
      <div className="download-overlay">
        <div className="download-overlay-content">
          <div className="page-loading-spinner" />
          <p>Generating PDF...</p>
        </div>
      </div>

      {/* Offscreen container where the report renders for html2pdf */}
      <div className="pdf-offscreen">
        <PrintReport onDone={onDone} />
      </div>
    </>
  );
}
