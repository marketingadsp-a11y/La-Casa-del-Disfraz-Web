export type CostumeCategory = 
  | 'todos'
  | 'ninos'
  | 'ninas'
  | 'bebes'
  | 'adultos-mujer'
  | 'adultos-hombre'
  | 'parejas-grupos'
  | 'botargas'
  | 'accesorios';

export type CostumeTheme =
  | 'todos'
  | 'halloween'
  | 'primavera-escolar'
  | 'superheroes'
  | 'princesas-fantasia'
  | 'mexicano-patrio'
  | 'epocas-retro'
  | 'cine-series'
  | 'oficios-profesiones'
  | 'animalitos';

export type CostumeModality = 'renta' | 'venta' | 'ambos';

export interface Costume {
  id: string;
  name: string;
  category: CostumeCategory;
  theme: CostumeTheme;
  modality: CostumeModality;
  rentPrice: number;
  salePrice: number;
  deposit: number;
  sizes: string[];
  image: string;
  gallery?: string[];
  description: string;
  includes: string[];
  popular?: boolean;
  isNew?: boolean;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  occasionBadge?: string;
  fabricBrand?: 'Disfraces JoJo\'s' | 'Importado' | 'Personalizados CyC';
}

export interface QuoteItem {
  costume: Costume;
  selectedSize: string;
  modality: 'renta' | 'venta';
  quantity: number;
  eventDate?: string;
}

export interface Review {
  id: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  date: string;
  costumeName: string;
}
