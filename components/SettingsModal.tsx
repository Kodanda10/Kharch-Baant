import React, { useState, useEffect } from 'react';
import ArchivedGroupsModal from './ArchivedGroupsModal';
import BaseModal from './BaseModal';
import ThemeToggle from './ThemeToggle';
import CurrencySelector from './CurrencySelector';
import LanguageSelector from './LanguageSelector';
import DataExport from './DataExport';
import DangerZone from './DangerZone';
import AboutSection from './AboutSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManagePaymentSources: () => void;
}

const LANGUAGES = ['English', 'Hindi'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onManagePaymentSources }) => {
  const [showArchivedGroups, setShowArchivedGroups] = useState(false);

  // Placeholder state for demo
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [currency, setCurrency] = useState('INR');
  const [language, setLanguage] = useState('English');

  // Placeholder handlers
  const handleExport = () => alert('Exporting data...');
  const handleImport = (file: File) => alert(`Importing from ${file.name}`);
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all app data? This cannot be undone.')) {
      alert('App data reset!');
    }
  };
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      alert('Account deleted!');
    }
  };

  return (
    <BaseModal
      open={isOpen}
      onClose={onClose}
      title="App Settings"
      size="sm"
      description={<span className="text-slate-300 text-sm">Manage app-wide settings and preferences.</span>}
      footer={
        <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Close</button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Archived Groups Button */}
        <button
          type="button"
          onClick={() => setShowArchivedGroups(true)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md text-left border-t border-slate-700 mt-4"
        >
          View Archived Groups
        </button>
        {showArchivedGroups && (
          <ArchivedGroupsModal
            isOpen={showArchivedGroups}
            onClose={() => setShowArchivedGroups(false)}
            currentUserId={"CURRENT_USER_ID"}
          />
        )}

        {/* Profile/Account (placeholder) */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-300 text-sm font-medium">Profile</label>
          <div className="text-slate-400 text-xs">(User profile management coming soon)</div>
        </div>

        {/* Theme toggle */}
        <ThemeToggle theme={theme} onChange={setTheme} />

        {/* Currency selector */}
        <CurrencySelector value={currency} onChange={setCurrency} options={CURRENCIES} />

        {/* Notifications (placeholder) */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-300 text-sm font-medium">Notifications</label>
          <div className="text-slate-400 text-xs">(Notification preferences coming soon)</div>
        </div>

        {/* Data management */}
        <DataExport onExport={handleExport} onImport={handleImport} />

        {/* Language selector */}
        <LanguageSelector value={language} onChange={setLanguage} options={LANGUAGES} />

        {/* Manage Payment Sources */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onManagePaymentSources();
          }}
          className="px-3 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white text-sm rounded-md text-left"
        >
          Manage Payment Sources
        </button>

        {/* About section */}
        <AboutSection />

        {/* Danger zone */}
        <DangerZone onReset={handleReset} onDeleteAccount={handleDeleteAccount} />
      </div>
    </BaseModal>
  );
};

export default SettingsModal;
