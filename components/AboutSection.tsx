import React from 'react';

const AboutSection: React.FC = () => (
  <div className="flex flex-col gap-2 mt-4 border-t border-slate-700 pt-4">
    <label className="text-slate-400 text-sm font-medium">About</label>
    <div className="text-slate-300 text-xs">
      <div>Kharch Baant Shared Expense Tracker</div>
      <div>Version: 1.0.0</div>
      <div>© 2025 Kodanda10</div>
      <a href="https://github.com/Kodanda10/Kharch-Baant" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">GitHub Repo</a>
    </div>
  </div>
);

export default AboutSection;
