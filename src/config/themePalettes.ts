export type PaletteId =
  | 'neutral-light'
  | 'warm-sand'
  | 'soft-rose'
  | 'dark-elegant'
  | 'dark-neutral';

type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type ShadeMap = Record<Shade, string>;

export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
}

export interface ThemePalette {
  id: PaletteId;
  name: string;
  description: string;
  mode: 'light' | 'dark';
  tokens: ThemeTokens;
  accent: ShadeMap;
  surface: ShadeMap;
  text: {
    strong: string;
    body: string;
    muted: string;
    subtle: string;
    onAccent: string;
  };
  border: string;
  background: string;
  backgroundAccent: string;
  scrollbarTrack: string;
  success: string;
  danger: string;
  warning: string;
}

const shades = (
  values: [string, string, string, string, string, string, string, string, string, string],
): ShadeMap => ({
  50: values[0],
  100: values[1],
  200: values[2],
  300: values[3],
  400: values[4],
  500: values[5],
  600: values[6],
  700: values[7],
  800: values[8],
  900: values[9],
});

const createPalette = (
  palette: Omit<
    ThemePalette,
    'text' | 'border' | 'background' | 'scrollbarTrack' | 'success' | 'danger' | 'warning'
  >,
): ThemePalette => ({
  ...palette,
  text: {
    strong: palette.tokens.textPrimary,
    body: palette.tokens.textSecondary,
    muted: palette.tokens.textMuted,
    subtle: palette.tokens.textMuted,
    onAccent: palette.tokens.primaryForeground,
  },
  border: palette.tokens.border,
  background: palette.tokens.background,
  scrollbarTrack: palette.tokens.surfaceAlt,
  success: palette.tokens.success,
  danger: palette.tokens.danger,
  warning: palette.tokens.warning,
});

export const DEFAULT_PALETTE_ID: PaletteId = 'neutral-light';

export const themePalettes: ThemePalette[] = [
  createPalette({
    id: 'neutral-light',
    name: 'Neutral Light',
    description: 'Branco, cinzas suaves e contraste universal para qualquer segmento.',
    mode: 'light',
    tokens: {
      background: '#f7f8f7',
      surface: '#ffffff',
      surfaceAlt: '#eef1f3',
      surfaceElevated: '#f9fafb',
      textPrimary: '#172026',
      textSecondary: '#43505a',
      textMuted: '#6f7b84',
      primary: '#2f3a40',
      primaryHover: '#1f272c',
      primaryForeground: '#ffffff',
      border: '#d9dee2',
      accent: '#66727a',
      success: '#167a4a',
      warning: '#a15c07',
      danger: '#b42318',
    },
    accent: shades([
      '248 250 252',
      '241 245 249',
      '226 232 240',
      '203 213 225',
      '100 116 139',
      '71 85 105',
      '51 65 85',
      '30 41 59',
      '15 23 42',
      '2 6 23',
    ]),
    surface: shades([
      '255 255 255',
      '249 250 251',
      '243 244 246',
      '229 231 235',
      '209 213 219',
      '156 163 175',
      '249 250 251',
      '255 255 255',
      '238 241 243',
      '247 248 247',
    ]),
    backgroundAccent: 'rgba(47, 58, 64, 0.06)',
  }),
  createPalette({
    id: 'warm-sand',
    name: 'Warm Sand',
    description: 'Areia, off-white e marrom suave para uma presença elegante.',
    mode: 'light',
    tokens: {
      background: '#fbf7ef',
      surface: '#fffdf8',
      surfaceAlt: '#f1e8d9',
      surfaceElevated: '#fffaf0',
      textPrimary: '#2c241c',
      textSecondary: '#5f5143',
      textMuted: '#857669',
      primary: '#73563d',
      primaryHover: '#5c432e',
      primaryForeground: '#fffaf0',
      border: '#e5d7c5',
      accent: '#a88763',
      success: '#177245',
      warning: '#9a5b10',
      danger: '#a83a2f',
    },
    accent: shades([
      '252 248 239',
      '248 239 224',
      '239 222 198',
      '222 193 153',
      '177 135 92',
      '137 95 58',
      '115 86 61',
      '92 67 46',
      '72 51 35',
      '48 34 24',
    ]),
    surface: shades([
      '255 253 248',
      '252 248 239',
      '248 239 224',
      '239 222 198',
      '229 207 176',
      '186 163 134',
      '255 250 240',
      '255 253 248',
      '241 232 217',
      '251 247 239',
    ]),
    backgroundAccent: 'rgba(115, 86, 61, 0.08)',
  }),
  createPalette({
    id: 'soft-rose',
    name: 'Soft Rose',
    description: 'Rose queimado e neutros claros, delicado sem ficar saturado.',
    mode: 'light',
    tokens: {
      background: '#fff8f7',
      surface: '#ffffff',
      surfaceAlt: '#f4e8e6',
      surfaceElevated: '#fffafa',
      textPrimary: '#2d2021',
      textSecondary: '#62494a',
      textMuted: '#8a6f70',
      primary: '#9b5f5f',
      primaryHover: '#7f4d4d',
      primaryForeground: '#fff8f7',
      border: '#ead7d5',
      accent: '#bd8581',
      success: '#157a48',
      warning: '#a15c07',
      danger: '#b33b3b',
    },
    accent: shades([
      '255 247 247',
      '253 238 237',
      '249 220 218',
      '239 189 185',
      '189 133 129',
      '155 95 95',
      '127 77 77',
      '104 61 62',
      '82 47 49',
      '54 31 34',
    ]),
    surface: shades([
      '255 255 255',
      '255 250 250',
      '253 242 241',
      '244 232 230',
      '234 215 213',
      '194 161 160',
      '255 250 250',
      '255 255 255',
      '244 232 230',
      '255 248 247',
    ]),
    backgroundAccent: 'rgba(155, 95, 95, 0.08)',
  }),
  createPalette({
    id: 'dark-elegant',
    name: 'Dark Elegant',
    description: 'Escuro premium com contraste limpo e acento champagne.',
    mode: 'dark',
    tokens: {
      background: '#121212',
      surface: '#1f1f1f',
      surfaceAlt: '#181818',
      surfaceElevated: '#292929',
      textPrimary: '#f8f5ea',
      textSecondary: '#e1ddcf',
      textMuted: '#b9b3a4',
      primary: '#d6bd82',
      primaryHover: '#e4cc96',
      primaryForeground: '#17130d',
      border: 'rgba(214, 189, 130, 0.24)',
      accent: '#a9915e',
      success: '#86efac',
      warning: '#fde68a',
      danger: '#fca5a5',
    },
    accent: shades([
      '255 251 235',
      '252 243 207',
      '246 225 164',
      '231 201 117',
      '214 189 130',
      '194 157 82',
      '159 124 57',
      '127 97 45',
      '94 70 33',
      '60 44 22',
    ]),
    surface: shades([
      '248 245 234',
      '225 221 207',
      '185 179 164',
      '128 122 109',
      '86 82 74',
      '56 54 50',
      '41 41 41',
      '31 31 31',
      '24 24 24',
      '18 18 18',
    ]),
    backgroundAccent: 'rgba(214, 189, 130, 0.08)',
  }),
  createPalette({
    id: 'dark-neutral',
    name: 'Dark Neutral',
    description: 'Grafite moderno com acento azul acinzentado e leitura forte.',
    mode: 'dark',
    tokens: {
      background: '#0e1114',
      surface: '#1a2026',
      surfaceAlt: '#14191e',
      surfaceElevated: '#232b33',
      textPrimary: '#f4f7f9',
      textSecondary: '#d9e1e7',
      textMuted: '#a8b4bd',
      primary: '#8fb3c7',
      primaryHover: '#a7c4d4',
      primaryForeground: '#0c1115',
      border: 'rgba(143, 179, 199, 0.24)',
      accent: '#6f8796',
      success: '#7dd3a8',
      warning: '#f5d06f',
      danger: '#f4a3a3',
    },
    accent: shades([
      '241 248 252',
      '224 239 247',
      '198 222 235',
      '167 196 212',
      '143 179 199',
      '111 135 150',
      '88 108 121',
      '68 84 95',
      '49 63 72',
      '31 42 49',
    ]),
    surface: shades([
      '244 247 249',
      '217 225 231',
      '168 180 189',
      '104 120 132',
      '69 82 94',
      '48 59 69',
      '35 43 51',
      '26 32 38',
      '20 25 30',
      '14 17 20',
    ]),
    backgroundAccent: 'rgba(143, 179, 199, 0.08)',
  }),
];

const legacyPaletteMap: Record<string, PaletteId> = {
  'claro-elegante': 'warm-sand',
  'claro-suave': 'soft-rose',
  'colorido-profissional': 'neutral-light',
  'escuro-premium': 'dark-elegant',
  'escuro-moderno': 'dark-neutral',
};

export const resolvePaletteId = (value?: string | null): PaletteId => {
  if (themePalettes.some((palette) => palette.id === value)) return value as PaletteId;
  return legacyPaletteMap[String(value || '')] || DEFAULT_PALETTE_ID;
};

export const getThemePalette = (value?: string | null) =>
  themePalettes.find((palette) => palette.id === resolvePaletteId(value)) || themePalettes[0];
