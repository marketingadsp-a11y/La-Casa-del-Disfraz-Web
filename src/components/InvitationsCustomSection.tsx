import React from 'react';
import { 
  Palette, 
  Smartphone, 
  Gift, 
  MessageCircle
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/storeStatus';
import { useSiteContent } from '../context/SiteContentContext';
import { CustomOrderItem } from '../types/siteContent';

export const InvitationsCustomSection: React.FC = () => {
  const { content } = useSiteContent();
  const { customOrders, storeInfo } = content;

  const itemIcons = [Smartphone, Gift, Palette];
  const itemColors = [
    'bg-fuchsia-100 text-fuchsia-700',
    'bg-emerald-100 text-emerald-800',
    'bg-amber-100 text-amber-800'
  ];

  return (
    <section id="invitaciones" className="py-16 px-4 sm:px-6 bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-5xl mx-auto relative">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Palette className="w-3.5 h-3.5 text-amber-300" />
            <span>{customOrders.badgeText}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-fun font-bold text-white tracking-tight">
            {customOrders.title}
          </h2>
          <p className="text-fuchsia-100/80 text-sm sm:text-base mt-2">
            {customOrders.description}
          </p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
          {customOrders.items.map((item: CustomOrderItem, idx: number) => {
            const Icon = itemIcons[idx % itemIcons.length];
            const colorClass = itemColors[idx % itemColors.length];

            return (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/15 hover:border-fuchsia-400/50 transition-all flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-fuchsia-100/70 leading-relaxed flex-1">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Direct WhatsApp Callout */}
        <div className="text-center">
          <a
            href={buildWhatsAppLink(customOrders.ctaWhatsappMessage, storeInfo.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-fun font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            id="invitations-whatsapp-promo-cta"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>{customOrders.ctaButtonText}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
