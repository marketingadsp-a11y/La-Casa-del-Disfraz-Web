import React from 'react';
import { 
  Sparkles, 
  Scissors, 
  Award, 
  Smile, 
  CalendarCheck,
  MessageCircle
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/storeStatus';
import { useSiteContent } from '../context/SiteContentContext';
import { StrengthItem } from '../types/siteContent';

export const OurStorySection: React.FC = () => {
  const { content } = useSiteContent();
  const { story, storeInfo } = content;

  const strengthIcons = [Scissors, Award, Smile, CalendarCheck];

  return (
    <section id="historia" className="py-16 px-4 sm:px-6 bg-amber-50/30 overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-fuchsia-100 text-fuchsia-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-600" />
            <span>{story.badgeText}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-fun font-bold text-slate-900 tracking-tight leading-tight">
            {story.title}
          </h2>
        </div>

        {/* Horizontal Photo Display (Full Width & Uncropped) */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
            <img
              src={story.imageUrl || 'https://i.ibb.co/wFCb0tK9/banner-foto-1.jpg'}
              alt={`${storeInfo.name} - Confección JoJo's`}
              className="w-full h-auto block object-cover max-h-[520px]"
            />
          </div>

          {/* Overlapping Badge */}
          <div className="absolute -bottom-4 right-4 sm:-right-3 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-xl border-2 border-white">
            <span className="text-xl sm:text-2xl font-fun font-black block leading-none">
              {story.badgeNumber}
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block mt-0.5">
              {story.badgeSub}
            </span>
          </div>
        </div>

        {/* Narrative Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-amber-100/80 shadow-sm text-sm sm:text-base text-slate-700 space-y-4 leading-relaxed">
          {story.paragraphs.map((p: string, idx: number) => (
            <p key={idx} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        {/* Key Milestones / Strengths */}
        {story.strengths && story.strengths.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {story.strengths.map((s: StrengthItem, idx: number) => {
              const Icon = strengthIcons[idx % strengthIcons.length];
              return (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3">
                  <Icon className="w-5 h-5 text-fuchsia-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{s.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-2">
          <a
            href={buildWhatsAppLink(story.ctaWhatsappMessage, storeInfo.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
            id="story-custom-order-cta"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{story.ctaButtonText}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
