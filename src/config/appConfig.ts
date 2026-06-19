import {
  DEFAULT_PALETTE_ID,
  PaletteId,
  getThemePalette,
  resolvePaletteId,
  themePalettes,
} from './themePalettes';

export const SETTINGS_ROUTE = '/modelo-config';
export const TEMPLATE_APP_NAME = 'Template de Agendamento';
export const SITE_CONFIG_EVENT = 'template-site-config-updated';

export type ThemeId = PaletteId;
export type ThemePreset = (typeof themePalettes)[number];

export const DEFAULT_THEME_ID: ThemeId = DEFAULT_PALETTE_ID;
export const themePresets = themePalettes;

export const getThemePreset = (themeId?: string | null) => getThemePalette(themeId);

const setProperty = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(name, value);
};

export const normalizeThemeId = (themeId?: string | null): ThemeId => resolvePaletteId(themeId);

export const applyThemePreset = (themeId?: string | null) => {
  if (typeof document === 'undefined') return;

  const theme = getThemePreset(themeId);
  document.documentElement.dataset.theme = theme.id;
  document.documentElement.dataset.themeMode = theme.mode;

  Object.entries(theme.accent).forEach(([shade, value]) => {
    setProperty(`--color-gold-${shade}`, value);
    setProperty(`--color-primary-${shade}`, value);
  });

  Object.entries(theme.surface).forEach(([shade, value]) => {
    setProperty(`--color-dark-${shade}`, value);
  });

  setProperty('--color-background', theme.tokens.background);
  setProperty('--color-surface', theme.tokens.surface);
  setProperty('--color-surface-alt', theme.tokens.surfaceAlt);
  setProperty('--color-surface-elevated', theme.tokens.surfaceElevated);
  setProperty('--color-text-primary', theme.tokens.textPrimary);
  setProperty('--color-text-secondary', theme.tokens.textSecondary);
  setProperty('--color-text-muted', theme.tokens.textMuted);
  setProperty('--color-primary', theme.tokens.primary);
  setProperty('--color-primary-hover', theme.tokens.primaryHover);
  setProperty('--color-primary-foreground', theme.tokens.primaryForeground);
  setProperty('--color-border', theme.tokens.border);
  setProperty('--color-accent', theme.tokens.accent);
  setProperty('--color-success', theme.tokens.success);
  setProperty('--color-warning', theme.tokens.warning);
  setProperty('--color-danger', theme.tokens.danger);

  setProperty('--app-text-strong', theme.tokens.textPrimary);
  setProperty('--app-text-body', theme.tokens.textSecondary);
  setProperty('--app-text-muted', theme.tokens.textMuted);
  setProperty('--app-text-subtle', theme.tokens.textMuted);
  setProperty('--app-on-accent', theme.tokens.primaryForeground);
  setProperty('--app-border', theme.tokens.border);
  setProperty('--app-background', theme.tokens.background);
  setProperty('--app-background-accent', theme.backgroundAccent);
  setProperty('--app-scrollbar-track', theme.tokens.surfaceAlt);
  setProperty('--app-success', theme.tokens.success);
  setProperty('--app-danger', theme.tokens.danger);
  setProperty('--app-warning', theme.tokens.warning);
};

export const DEFAULT_PROFESSIONAL_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f4f1eb"/>
        <stop offset="1" stop-color="#d8d1c4"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#7f8c8d" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#4b5563" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
    <rect width="600" height="700" fill="url(#bg)"/>
    <circle cx="300" cy="250" r="106" fill="url(#accent)" opacity="0.18"/>
    <circle cx="300" cy="238" r="72" fill="#2f3a40" opacity="0.16"/>
    <path d="M135 585c30-110 105-168 165-168s135 58 165 168" fill="#2f3a40" opacity="0.14"/>
    <rect x="120" y="610" width="360" height="8" rx="4" fill="#2f3a40" opacity="0.24"/>
    <text x="300" y="655" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#2f3a40" opacity="0.72">Profissional demo</text>
  </svg>`,
)}`;

export const DEFAULT_WHATSAPP_TEMPLATE =
  'Olá {cliente}, tudo bem? Aqui é {profissional}. Estou entrando em contato sobre seu agendamento de {servico}, marcado para {data} às {hora}.';
