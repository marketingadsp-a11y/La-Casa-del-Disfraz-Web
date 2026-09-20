import React from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AnnouncementBarProps {
  onNavigate: (path: string) => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onNavigate }) => {
  const { content } = useSiteContent();
  const { announcement, theme } = content;

  if (!announcement?.enabled) {
    return null;
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (announcement.buttonLink) {
      e.preventDefault();
      onNavigate(announcement.buttonLink);
    }
  };

  const bgClasses: Record<string, string> = {
    fuchsia: 'bg-gradient-to-r from-fuchsia-700 via-purple-700 to-fuchsia-800 text-white',
    purple: 'bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white',
    rose: 'bg-gradient-to-r from-rose-600 via-pink-700 to-rose-700 text-white',
    amber: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white',
    emerald: 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white',
    indigo: 'bg-gradient-to-r from-indigo-800 via-blue-800 to-indigo-900 text-white'
  };

  const currentBg = bgClasses[theme.primaryColor] || bgClasses.fuchsia;

  return (
    <div className={`py-2 px-4 text-xs sm:text-sm font-medium transition-all ${currentBg} shadow-sm border-b border-white/10`}>
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2 text-center">
        {announcement.badge && (
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {announcement.badge}
          </span>
        )}
        <span>{announcement.text}</span>
        {announcement.buttonText && (
          <button
            onClick={handleLinkClick}
            className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:text-amber-200 transition-colors ml-1 cursor-pointer"
          >
            <span>{announcement.buttonText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
