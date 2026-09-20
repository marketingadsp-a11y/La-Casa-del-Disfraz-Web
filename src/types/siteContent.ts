export interface SiteTheme {
  primaryColor: 'fuchsia' | 'purple' | 'rose' | 'amber' | 'emerald' | 'indigo';
  heroTheme: 'classic-fuchsia' | 'dark-violet' | 'emerald-festive' | 'midnight-blue';
}

export interface SiteAnnouncement {
  enabled: boolean;
  badge: string;
  text: string;
  buttonText?: string;
  buttonLink?: string;
}

export interface SiteStoreInfo {
  name: string;
  tagline: string;
  founder: string;
  experienceYears: string;
  phone: string;
  phoneFormatted: string;
  whatsappNumber: string;
  email: string;
  addressLine: string;
  cityState: string;
  googleMapsUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  manualStatusOverride: 'auto' | 'open' | 'closed';
}

export interface SiteHero {
  livePillLocation: string;
  badgeText: string;
  title: string;
  description: string;
  btn1Text: string;
  btn2Text: string;
  btn3Text: string;
  whatsappCustomMessage: string;
  btn4Text: string;
}

export interface SiteLocationSection {
  badgeText: string;
  title: string;
  description: string;
  addressTitle: string;
  addressLine: string;
  addressCity: string;
  gpsCardTitle: string;
  gpsCardSubtitle: string;
}

export interface RentalStepItem {
  step: string;
  title: string;
  desc: string;
}

export interface SiteRentalSteps {
  badgeText: string;
  title: string;
  description: string;
  steps: RentalStepItem[];
  contractBannerTitle: string;
  contractBannerSubtitle: string;
  contractBannerBtnText: string;
}

export interface StrengthItem {
  title: string;
  desc: string;
}

export interface SiteStory {
  badgeText: string;
  title: string;
  imageUrl: string;
  badgeNumber: string;
  badgeSub: string;
  paragraphs: string[];
  strengths: StrengthItem[];
  ctaButtonText: string;
  ctaWhatsappMessage: string;
}

export interface CustomOrderItem {
  title: string;
  desc: string;
  badge: string;
}

export interface SiteCustomOrders {
  badgeText: string;
  title: string;
  description: string;
  items: CustomOrderItem[];
  ctaButtonText: string;
  ctaWhatsappMessage: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SiteFaqSection {
  badgeText: string;
  title: string;
  description: string;
  items: FaqItem[];
}

export interface ReviewItem {
  id: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  date: string;
  costumeName: string;
}

export interface SiteReviewsSection {
  badgeText: string;
  title: string;
  description: string;
  items: ReviewItem[];
}

export interface SiteFooter {
  aboutText: string;
  copyright: string;
  brandsText: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHashOrPlain: string;
  role: 'superadmin' | 'admin';
  name?: string;
  createdAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
  order: number;
  icon?: string;
}

export interface CustomPageItem {
  id?: string;
  title: string;
  desc?: string;
  description?: string;
  tag?: string;
  price?: string;
}

export interface CustomPageSection {
  id: string;
  slug: string; // e.g. "promociones", "catalogo", "temporada"
  title: string;
  subtitle?: string;
  badge?: string;
  content: string;
  heroImage?: string;
  ctaText?: string;
  ctaWhatsappMsg?: string;
  whatsappCtaText?: string;
  whatsappMessage?: string;
  items?: CustomPageItem[];
  showInMenu: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteBranding {
  webLogoUrl: string;
  webLogoFooterUrl?: string;
  pwaIconUrl: string;
  pwaAppName?: string;
  pwaShortName?: string;
}

export interface SiteContent {
  updatedAt: string;
  branding?: SiteBranding;
  theme: SiteTheme;
  announcement: SiteAnnouncement;
  storeInfo: SiteStoreInfo;
  hero: SiteHero;
  locationSection: SiteLocationSection;
  rentalSteps: SiteRentalSteps;
  story: SiteStory;
  customOrders: SiteCustomOrders;
  faqSection: SiteFaqSection;
  reviewsSection: SiteReviewsSection;
  footer: SiteFooter;
  navigationMenu: NavigationItem[];
  customPages: CustomPageSection[];
  adminUsers: AdminUser[];
}
