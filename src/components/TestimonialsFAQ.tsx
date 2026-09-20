import React, { useState } from 'react';
import { 
  Star, 
  HelpCircle, 
  ChevronDown, 
  MessageCircle
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/storeStatus';
import { useSiteContent } from '../context/SiteContentContext';
import { FaqItem, ReviewItem } from '../types/siteContent';

export const TestimonialsFAQ: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { content } = useSiteContent();
  const { faqSection, reviewsSection, storeInfo } = content;

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-white via-amber-50/20 to-white">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Testimonials */}
        {reviewsSection && reviewsSection.items && reviewsSection.items.length > 0 && (
          <div>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{reviewsSection.badgeText}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-fun font-bold text-slate-900 tracking-tight">
                {reviewsSection.title}
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1">
                {reviewsSection.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {reviewsSection.items.map((rev: ReviewItem) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-0.5">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{rev.date}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic mb-4">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900">{rev.author}</h4>
                    <span className="text-[11px] text-fuchsia-600 block">{rev.role}</span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                      Disfraz: {rev.costumeName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-fuchsia-100 text-fuchsia-800 text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-fuchsia-600" />
              <span>{faqSection.badgeText}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-fun font-bold text-slate-900 tracking-tight">
              {faqSection.title}
            </h3>
            {faqSection.description && (
              <p className="text-slate-600 text-sm mt-1">
                {faqSection.description}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {faqSection.items.map((faq: FaqItem, idx: number) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center bg-fuchsia-50 rounded-2xl p-4 border border-fuchsia-200/60">
            <span className="text-xs text-slate-700 block font-medium mb-2">
              ¿Tienes alguna pregunta que no esté aquí?
            </span>
            <a
              href={buildWhatsAppLink('¡Hola La Casa del Disfraz! Tengo una duda sobre la renta de disfraces.', storeInfo.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Preguntarle directamente al equipo por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
