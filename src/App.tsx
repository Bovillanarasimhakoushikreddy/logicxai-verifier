import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import OverviewSection from './components/OverviewSection';
import RuleLabSection from './components/RuleLabSection';
import FaultStudioSection from './components/FaultStudioSection';
import ExplainerSection from './components/ExplainerSection';
import ExperimentsSection from './components/ExperimentsSection';
import ReportPdfModal from './components/ReportPdfModal';
import { REPORT_METADATA } from './data/reportData';

type WorkspaceTab = 'overview' | 'rule-lab' | 'fault-studio' | 'explainer' | 'experiments';

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'rule-lab', label: 'Rule Lab' },
  { id: 'fault-studio', label: 'Fault Studio' },
  { id: 'explainer', label: 'Explainer' },
  { id: 'experiments', label: 'Experiments' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [reportOpen, setReportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate('overview')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            LogicXAI Verifier
          </button>

          {/* Zone 2: 5 Clean Single-Line Nav Links */}
          <nav
            aria-label="Primary Workspaces"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-[#1D4ED8] border-[#1D4ED8] font-semibold'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action (+ Mobile Menu button on small viewports) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Report PDF
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-6 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 lg:px-10 py-8 sm:py-10">
        {activeTab === 'overview' && (
          <OverviewSection
            onNavigate={handleNavigate}
            onOpenReport={() => setReportOpen(true)}
          />
        )}
        {activeTab === 'rule-lab' && <RuleLabSection />}
        {activeTab === 'fault-studio' && <FaultStudioSection />}
        {activeTab === 'explainer' && <ExplainerSection />}
        {activeTab === 'experiments' && <ExperimentsSection />}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">
              {REPORT_METADATA.institution}
            </span>{' '}
            · {REPORT_METADATA.course} · {REPORT_METADATA.topicNo}
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="text-[#1D4ED8] font-medium hover:underline cursor-pointer"
            >
              Full Report PDF
            </button>
          </div>
        </div>
      </footer>

      {/* Attached PDF Report Viewer Modal */}
      <ReportPdfModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
