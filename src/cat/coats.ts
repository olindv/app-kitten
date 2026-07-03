export type CoatId = 'ginger' | 'gray' | 'blackwhite' | 'tabby' | 'white' | 'siamese';

export interface CoatPalette {
  body: string; // основной мех
  belly: string; // грудка и мордочка
  stripes: string | null; // полоски (рыжий, табби)
  mask: string | null; // сиамские отметины: уши, мордочка, хвост
  earInner: string;
  nose: string;
}

export const COAT_IDS: CoatId[] = ['ginger', 'gray', 'blackwhite', 'tabby', 'white', 'siamese'];

export const COATS: Record<CoatId, CoatPalette> = {
  ginger: {
    body: '#F0944D',
    belly: '#FFE9CC',
    stripes: '#D2691E',
    mask: null,
    earInner: '#FFC9A3',
    nose: '#E8836F',
  },
  gray: {
    body: '#A6ADB8',
    belly: '#E8EAEE',
    stripes: null,
    mask: null,
    earInner: '#D9BFC7',
    nose: '#C98A97',
  },
  blackwhite: {
    body: '#3A3A45',
    belly: '#F5F5F5',
    stripes: null,
    mask: null,
    earInner: '#C9A3B0',
    nose: '#E8836F',
  },
  tabby: {
    body: '#C29A6B',
    belly: '#EFDFC5',
    stripes: '#8A6A42',
    mask: null,
    earInner: '#E3BFA9',
    nose: '#C97B63',
  },
  white: {
    body: '#F7F3EC',
    belly: '#FFFFFF',
    stripes: null,
    mask: null,
    earInner: '#F2C7CF',
    nose: '#E89AA7',
  },
  siamese: {
    body: '#EFE3D0',
    belly: '#FAF4E8',
    stripes: null,
    mask: '#7A6152',
    earInner: '#B08E7E',
    nose: '#8C6A5C',
  },
};

export const COLLAR_COLORS = ['#E4572E', '#2E86AB', '#F5B700', '#7BB661'] as const;
