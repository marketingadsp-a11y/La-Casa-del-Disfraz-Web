import React from 'react';
import { 
  ShoppingBag, 
  CreditCard, 
  Sparkles, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import { RentalStepItem } from '../types/siteContent';

interface RentalGuideSectionProps {
  onNavigateToTyc: () => void;
}

export const RentalGuideSection: React.FC<RentalGuideSectionProps> = ({
  onNavigateToTyc
}) => {
  const { content } = useSiteContent();
  const { rentalSteps } = content;

  const stepIcons = [ShoppingBag, CreditCard, Sparkles, RotateCcw];
  const stepGradients = [
    'from-fuchsia-500 to-rose-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-purple-500 to-indigo-500'
  ];

  return (
    <section id="requisitos" className="py-16 px-4 sm:px-6 bg-gradient-to-b from-white via-fuchsia-50/40 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{rentalSteps.badgeText}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-fun font-bold text-slate-900 tracking-tight">
            {rentalSteps.title}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            {rentalSteps.description}
          </p>
        </div>

        {/* 4-Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {rentalSteps.steps.map((s: RentalStepItem, idx: number) => {
            const Icon = stepIcons[idx % stepIcons.length];
            const gradient = stepGradients[idx % stepGradients.length];

            return (
              <div 
                key={idx} 
                className="relative bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-fun font-black text-slate-200 group-hover:text-fuchsia-200 transition-colors">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Dedicated Callout to the Official /tyc Page */}
        <div className="bg-gradient-to-r from-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              <span>Contrato Legal Oficial</span>
            </div>
            <h3 className="text-lg sm:text-xl font-fun font-bold text-white">
              {rentalSteps.contractBannerTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {rentalSteps.contractBannerSubtitle}
            </p>
          </div>

          <button
            onClick={onNavigateToTyc}
            className="shrink-0 px-6 py-3.5 bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white font-fun font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            id="view-official-tyc-btn"
          >
            <span>{rentalSteps.contractBannerBtnText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
