import { useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { REPORT_METADATA } from '../data/reportData';

interface ReportPdfModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ReportPdfModal({ open, onClose }: ReportPdfModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Original DMGT Experiential Learning Report PDF"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[86vh] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-[#1D4ED8] shrink-0" />
            <div className="truncate text-sm font-semibold text-slate-900">
              {REPORT_METADATA.title} — Experiential Learning Report (18 Pages)
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={REPORT_METADATA.pdfPath}
              download="DMGT_Logic_Rule_Verification_Report.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close report viewer"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100">
          <iframe
            src={REPORT_METADATA.pdfPath}
            title="DMGT Experiential Learning Report PDF"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
