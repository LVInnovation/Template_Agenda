import { DEFAULT_THEME_ID, getThemePreset } from '../config/appConfig';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
}

export interface ResolvedThemeColors extends ThemeColors {
  primaryForeground: string;
  secondaryForeground: string;
  accentForeground: string;
  backgroundForeground: string;
  surfaceForeground: string;
  mutedForeground: string;
  primaryHover: string;
  surfaceAlt: string;
  surfaceElevated: string;
  button: string;
  buttonForeground: string;
}

const SAFE_LIGHT = '#F8FAFC';
const SAFE_DARK = '#0F172A';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const stripOpacity = (color: string) => {
  const match = String(color || '').match(/rgba?\((\d+)\D+(\d+)\D+(\d+)/i);

  if (!match) return null;

  const [, red, green, blue] = match;
  return `#${[red, green, blue]
    .map((value) => Number(value).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
};

export const isValidHexColor = (color: string) =>
  /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(color || '').trim());

export const normalizeHexColor = (
  color: string,
  fallback?: string,
): string => {
  const value = String(color || '').trim();
  const rgbaValue = stripOpacity(value);
  const candidate = rgbaValue || value;

  if (!isValidHexColor(candidate)) {
    return fallback ? normalizeHexColor(fallback) : SAFE_DARK;
  }

  let normalized = candidate.startsWith('#') ? candidate : `#${candidate}`;

  if (normalized.length === 4) {
    normalized = `#${normalized
      .slice(1)
      .split('')
      .map((char) => `${char}${char}`)
      .join('')}`;
  }

  return normalized.toUpperCase();
};

const hexToRgb = (color: string) => {
  const normalized = normalizeHexColor(color);
  const hex = normalized.slice(1);

  return {
    red: parseInt(hex.slice(0, 2), 16),
    green: parseInt(hex.slice(2, 4), 16),
    blue: parseInt(hex.slice(4, 6), 16),
  };
};

const rgbToHex = (red: number, green: number, blue: number) =>
  `#${[red, green, blue]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();

const toRgbVariableValue = (color: string) => {
  const { red, green, blue } = hexToRgb(color);
  return `${red} ${green} ${blue}`;
};

const mixChannel = (source: number, target: number, weight: number) =>
  source + (target - source) * weight;

export const mixHexColors = (
  sourceColor: string,
  targetColor: string,
  weight: number,
) => {
  const source = hexToRgb(sourceColor);
  const target = hexToRgb(targetColor);
  const ratio = clamp(weight, 0, 1);

  return rgbToHex(
    mixChannel(source.red, target.red, ratio),
    mixChannel(source.green, target.green, ratio),
    mixChannel(source.blue, target.blue, ratio),
  );
};

const shiftHexColor = (color: string, amount: number) => {
  const normalized = normalizeHexColor(color);

  if (amount === 0) return normalized;

  return amount > 0
    ? mixHexColors(normalized, SAFE_LIGHT, clamp(amount, 0, 1))
    : mixHexColors(normalized, SAFE_DARK, clamp(Math.abs(amount), 0, 1));
};

const toLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.03928
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
};

export const getLuminance = (color: string) => {
  const { red, green, blue } = hexToRgb(color);
  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
};

const getContrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = getLuminance(foreground);
  const backgroundLuminance = getLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

export const isLightColor = (color: string) => getLuminance(color) > 0.55;

export const getContrastColor = (backgroundColor: string) =>
  getContrastRatio(SAFE_DARK, backgroundColor) >= getContrastRatio(SAFE_LIGHT, backgroundColor)
    ? SAFE_DARK
    : SAFE_LIGHT;

export const getReadableTextColor = (backgroundColor: string) =>
  getContrastColor(normalizeHexColor(backgroundColor));

export const ensureReadableColor = (
  textColor: string,
  backgroundColor: string,
  minimumRatio = 4.5,
) => {
  const normalizedBackground = normalizeHexColor(backgroundColor);
  const normalizedText = normalizeHexColor(textColor, getReadableTextColor(normalizedBackground));

  return getContrastRatio(normalizedText, normalizedBackground) >= minimumRatio
    ? normalizedText
    : getReadableTextColor(normalizedBackground);
};

const createAccentScale = (color: string) => {
  const normalized = normalizeHexColor(color);

  return {
    50: shiftHexColor(normalized, 0.88),
    100: shiftHexColor(normalized, 0.76),
    200: shiftHexColor(normalized, 0.56),
    300: shiftHexColor(normalized, 0.24),
    400: normalized,
    500: shiftHexColor(normalized, -0.08),
    600: shiftHexColor(normalized, -0.16),
    700: shiftHexColor(normalized, -0.26),
    800: shiftHexColor(normalized, -0.38),
    900: shiftHexColor(normalized, -0.52),
  };
};

const createSurfaceScale = (background: string, surface: string, text: string) => {
  const elevated = shiftHexColor(surface, isLightColor(surface) ? -0.05 : 0.07);

  return {
    50: mixHexColors(surface, SAFE_LIGHT, 0.92),
    100: mixHexColors(surface, SAFE_LIGHT, 0.82),
    200: mixHexColors(surface, SAFE_LIGHT, 0.68),
    300: mixHexColors(surface, text, 0.34),
    400: mixHexColors(surface, text, 0.24),
    500: mixHexColors(surface, text, 0.14),
    600: elevated,
    700: normalizeHexColor(surface),
    800: mixHexColors(surface, background, 0.42),
    900: normalizeHexColor(background),
  };
};

const fallbackBorder = (background: string, text: string) =>
  mixHexColors(background, text, isLightColor(background) ? 0.18 : 0.24);

export const getDefaultThemeColors = (themeId?: string | null): ThemeColors => {
  const preset = getThemePreset(themeId || DEFAULT_THEME_ID);
  const background = normalizeHexColor(preset.tokens.background, '#121212');
  const surface = normalizeHexColor(preset.tokens.surface, '#1F1F1F');
  const text = ensureReadableColor(
    normalizeHexColor(preset.tokens.textPrimary, '#F8F5EA'),
    background,
  );
  const muted = ensureReadableColor(
    normalizeHexColor(preset.tokens.textSecondary || preset.tokens.textMuted, '#D6D3D1'),
    background,
    3.5,
  );

  return {
    primary: normalizeHexColor(preset.tokens.primary, '#D6BD82'),
    secondary: normalizeHexColor(
      preset.tokens.surfaceAlt,
      shiftHexColor(surface, isLightColor(surface) ? -0.08 : 0.08),
    ),
    accent: normalizeHexColor(preset.tokens.accent, preset.tokens.primary),
    background,
    surface,
    text,
    muted,
    border: normalizeHexColor(preset.tokens.border, fallbackBorder(background, text)),
  };
};

export const normalizeThemeColors = (
  colors?: Partial<ThemeColors> | null,
  themeId?: string | null,
): ThemeColors => {
  const defaults = getDefaultThemeColors(themeId);
  const background = normalizeHexColor(colors?.background || defaults.background, defaults.background);
  const surface = normalizeHexColor(colors?.surface || defaults.surface, defaults.surface);
  const text = ensureReadableColor(colors?.text || defaults.text, background);
  const muted = ensureReadableColor(colors?.muted || defaults.muted, background, 3.5);

  return {
    primary: normalizeHexColor(colors?.primary || defaults.primary, defaults.primary),
    secondary: normalizeHexColor(colors?.secondary || defaults.secondary, defaults.secondary),
    accent: normalizeHexColor(colors?.accent || defaults.accent, defaults.accent),
    background,
    surface,
    text,
    muted,
    border: normalizeHexColor(
      colors?.border || defaults.border,
      fallbackBorder(background, text),
    ),
  };
};

export const resolveThemeColors = (
  colors?: Partial<ThemeColors> | null,
  themeId?: string | null,
): ResolvedThemeColors => {
  const normalized = normalizeThemeColors(colors, themeId);
  const surfaceAlt = mixHexColors(normalized.surface, normalized.secondary, 0.28);
  const surfaceElevated = shiftHexColor(
    normalized.surface,
    isLightColor(normalized.surface) ? -0.06 : 0.08,
  );

  return {
    ...normalized,
    primaryForeground: getReadableTextColor(normalized.primary),
    secondaryForeground: getReadableTextColor(normalized.secondary),
    accentForeground: getReadableTextColor(normalized.accent),
    backgroundForeground: ensureReadableColor(normalized.text, normalized.background),
    surfaceForeground: ensureReadableColor(normalized.text, normalized.surface),
    mutedForeground: ensureReadableColor(normalized.muted, normalized.surface, 3.5),
    primaryHover: shiftHexColor(
      normalized.primary,
      isLightColor(normalized.primary) ? -0.14 : 0.14,
    ),
    surfaceAlt,
    surfaceElevated,
    button: normalized.primary,
    buttonForeground: getReadableTextColor(normalized.primary),
  };
};

const setProperty = (name: string, value: string) => {
  document.documentElement.style.setProperty(name, value);
};

export const applyThemeColors = (
  colors?: Partial<ThemeColors> | null,
  themeId?: string | null,
) => {
  if (typeof document === 'undefined') {
    return resolveThemeColors(colors, themeId);
  }

  const theme = resolveThemeColors(colors, themeId);
  const primaryScale = createAccentScale(theme.primary);
  const surfaceScale = createSurfaceScale(
    theme.background,
    theme.surface,
    theme.backgroundForeground,
  );

  document.documentElement.dataset.themeMode = isLightColor(theme.background)
    ? 'light'
    : 'dark';

  Object.entries(primaryScale).forEach(([shade, value]) => {
    setProperty(`--color-gold-${shade}`, toRgbVariableValue(value));
    setProperty(`--color-primary-${shade}`, toRgbVariableValue(value));
  });

  Object.entries(surfaceScale).forEach(([shade, value]) => {
    setProperty(`--color-dark-${shade}`, toRgbVariableValue(value));
  });

  setProperty('--color-primary', theme.primary);
  setProperty('--color-primary-hover', theme.primaryHover);
  setProperty('--color-primary-foreground', theme.primaryForeground);
  setProperty('--color-secondary', theme.secondary);
  setProperty('--color-secondary-foreground', theme.secondaryForeground);
  setProperty('--color-accent', theme.accent);
  setProperty('--color-accent-foreground', theme.accentForeground);
  setProperty('--color-background', theme.background);
  setProperty('--color-background-foreground', theme.backgroundForeground);
  setProperty('--color-surface', theme.surface);
  setProperty('--color-surface-foreground', theme.surfaceForeground);
  setProperty('--color-surface-alt', theme.surfaceAlt);
  setProperty('--color-surface-elevated', theme.surfaceElevated);
  setProperty('--color-text', theme.backgroundForeground);
  setProperty('--color-text-primary', theme.backgroundForeground);
  setProperty('--color-text-secondary', ensureReadableColor(theme.muted, theme.background, 3.5));
  setProperty('--color-text-muted', ensureReadableColor(theme.muted, theme.surface, 3.5));
  setProperty('--color-muted', ensureReadableColor(theme.muted, theme.background, 3.5));
  setProperty('--color-border', theme.border);
  setProperty('--color-button', theme.button);
  setProperty('--color-button-foreground', theme.buttonForeground);
  setProperty('--color-input-background', theme.surface);
  setProperty('--color-input-foreground', theme.surfaceForeground);
  setProperty('--color-sidebar', theme.secondary);
  setProperty('--color-sidebar-foreground', theme.secondaryForeground);

  setProperty('--app-text-strong', theme.backgroundForeground);
  setProperty('--app-text-body', ensureReadableColor(theme.muted, theme.background, 3.5));
  setProperty('--app-text-muted', ensureReadableColor(theme.muted, theme.surface, 3.5));
  setProperty('--app-text-subtle', ensureReadableColor(theme.muted, theme.surfaceAlt, 3));
  setProperty('--app-on-accent', theme.primaryForeground);
  setProperty('--app-border', theme.border);
  setProperty('--app-background', theme.background);
  const accentGlow = hexToRgb(mixHexColors(theme.primary, theme.background, 0.78));
  setProperty(
    '--app-background-accent',
    `rgba(${accentGlow.red}, ${accentGlow.green}, ${accentGlow.blue}, 0.25)`,
  );
  setProperty('--app-scrollbar-track', theme.surfaceAlt);
  setProperty('--app-success', '#16A34A');
  setProperty('--app-danger', '#DC2626');
  setProperty('--app-warning', '#CA8A04');

  return theme;
};
