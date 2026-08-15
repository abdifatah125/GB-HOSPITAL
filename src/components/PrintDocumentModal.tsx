import React, { useState } from 'react';
import {
  Printer,
  ExternalLink,
  Download,
  Copy,
  Check,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { renderFullHtml } from '../utils/printDocument';

export interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentType: 'Patient Card' | 'Appointment Slip' | 'Billing Receipt' | 'Document';
  htmlContent: string;
  rawText?: string;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  title,
  documentType,
  htmlContent,
  rawText,
}) => {
  const [copied, setCopied] = useState(false);
  const [printErrorNotice, setPrintErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const fullHtml = renderFullHtml(title, htmlContent);

  // 1. Direct Print Handler with iframe sandbox resilience
  const handleDirectPrint = () => {
    setPrintErrorNotice(null);
    try {
      // Try iframe print first
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch {}
            }, 2000);
          } catch (err: any) {
            console.warn('Iframe print blocked by sandbox:', err);
            handleOpenInNewTab();
          }
        }, 300);
      } else {
        handleOpenInNewTab();
      }
    } catch (err: any) {
      console.warn('Direct print error:', err);
      handleOpenInNewTab();
    }
  };

  // 2. Open in New Tab (Bypasses iframe sandbox 100% reliably)
  const handleOpenInNewTab = () => {
    try {
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        setPrintErrorNotice(
          'Browser popup was blocked. Please click "Download HTML" or allow popups.'
        );
      }
    } catch {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(fullHtml);
        win.document.close();
      } else {
        setPrintErrorNotice(
          'Popup was blocked. Please click "Download HTML" below to open and print.'
        );
      }
    }
  };

  // 3. Download HTML file
  const handleDownload = () => {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 4. Copy raw text
  const handleCopyText = () => {
    const textToCopy = rawText || htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                {title}
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  {documentType}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Garasbaley Hospital Electronic Reception System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDirectPrint}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>

            <button
              onClick={handleOpenInNewTab}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Open print-ready page in a clean new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab to Print</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download HTML</span>
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        </div>

        {printErrorNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{printErrorNotice}</span>
          </div>
        )}

        {/* Paper Document Preview Frame */}
        <div className="p-4 sm:p-6 bg-slate-200/70 overflow-y-auto flex-1 flex justify-center">
          <div
            className="bg-white rounded-xl shadow-md border border-slate-300 p-6 w-full max-w-2xl text-slate-900 print-document-container"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Official Garasbaley Hospital Document
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
