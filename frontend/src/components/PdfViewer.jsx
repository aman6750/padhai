import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Point PDF.js to its worker (CDN, version-matched)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
function PdfViewer({ fileBlob, onClose }) {
  const [numPages, setNumPages] = useState(null);

  return (
    <div style={{ marginBottom: '24px' }}>
      <button className="btn btn-secondary" onClick={onClose}>← Close</button>

      <div
        style={{
          marginTop: '12px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: '#525659',
          padding: '20px',
          maxHeight: '80vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // block right-click "save as"
          userSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Document
          file={fileBlob}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<p style={{ color: 'white' }}>Loading note...</p>}
          error={<p style={{ color: 'white' }}>Could not display note.</p>}
        >
          {Array.from(new Array(numPages || 0), (el, index) => (
            <div key={index} style={{ marginBottom: '16px' }}>
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={800}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}

export default PdfViewer;