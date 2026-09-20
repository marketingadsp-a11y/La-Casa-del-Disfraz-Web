import React from 'react';
import { 
  ArrowLeft, 
  MessageCircle, 
  Sparkles, 
  Tag, 
  CheckCircle,
  Share2
} from 'lucide-react';
import { CustomPageSection } from '../types/siteContent';
import { useSiteContent } from '../context/SiteContentContext';
import { buildWhatsAppLink } from '../utils/storeStatus';

interface DynamicCustomPageProps {
  page: CustomPageSection;
  onNavigate: (path: string) => void;
}

export const DynamicCustomPage: React.FC<DynamicCustomPageProps> = ({ page, onNavigate }) => {
  const { content } = useSiteContent();
  const { storeInfo } = content;

  const whatsappMsg = page.ctaWhatsappMsg || page.whatsappMessage || `¡Hola La Casa del Disfraz! Me gustaría consultar información sobre ${page.title}.`;
  const whatsappUrl = buildWhatsAppLink(whatsappMsg, storeInfo.whatsappNumber);

  return (
    <div className="py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-fuchsia-600 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          /{page.slug}
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          {page.badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{page.badge}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-4xl font-fun font-bold text-white tracking-tight leading-tight">
            {page.title}
          </h1>

          {page.subtitle && (
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {page.subtitle}
            </p>
          )}

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{page.ctaText || page.whatsappCtaText || 'Consultar por WhatsApp'}</span>
            </a>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: page.title,
                    text: page.subtitle || page.title,
                    url: window.location.href
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('¡Enlace copiado al portapapeles!');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-white/20"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir sección</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Image if present */}
      {page.heroImage && (
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 max-h-[480px]">
          <img
            src={page.heroImage}
            alt={page.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content description */}
      {page.content && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {page.content}
        </div>
      )}

      {/* Featured Items Grid if provided */}
      {page.items && page.items.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-fun font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-fuchsia-600" />
            <span>Elementos y Opciones de la Sección</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {page.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {item.tag && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-800 mb-2">
                      {item.tag}
                    </span>
                  )}
                  <h4 className="text-base font-bold text-slate-800 mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc || item.description}
                  </p>
                </div>

                {item.price && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{item.price}</span>
                    <a
                      href={buildWhatsAppLink(`¡Hola! Me interesa: "${item.title}" visto en la sección /${page.slug}`, storeInfo.whatsappNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Pedir</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA and Help */}
      <div className="bg-fuchsia-50 rounded-3xl p-6 sm:p-8 border border-fuchsia-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="font-fun font-bold text-slate-900 text-base sm:text-lg">
            ¿Tienes dudas o deseas atención personalizada?
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            En {storeInfo.name} te atendemos con gusto en nuestra sucursal de Quintanar #189 o por WhatsApp.
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-transform active:scale-95"
        >
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
};
