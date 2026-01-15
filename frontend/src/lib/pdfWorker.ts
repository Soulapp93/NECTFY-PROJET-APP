import type { PDFWorker } from 'pdfjs-dist/types/src/display/api';

// Vite supports importing assets as URLs with ?url.
// IMPORTANT: react-pdf currently uses PDF.js v5.x, so the worker must match.
// eslint-disable-next-line import/no-unresolved
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

function isIOSWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  // All browsers on iOS use WebKit (WKWebView), including Chrome/Firefox.
  // PDF.js workers can be unstable there, so we treat all iOS as needing the fallback.
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function configurePdfJsWorker(pdfjs: { GlobalWorkerOptions: { workerSrc: string | PDFWorker } }) {
  // Always prefer a same-origin/bundled worker for maximum reliability.
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  // iOS WebKit (Safari/Chrome/Firefox) has recurring issues with module workers in PDF.js/react-pdf
  // that can crash rendering or break parsing. Fallback: disable worker on iOS to keep PDFs opening reliably.
  if (isIOSWebKit()) {
    (pdfjs as any).disableWorker = true;
  }
}

