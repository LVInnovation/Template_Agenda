import { DEFAULT_THEME_ID, ThemeId, normalizeThemeId } from '../config/appConfig';
import { BusinessSegmentId, DEFAULT_SEGMENT_ID, getBusinessSegment } from '../config/templatePresets';

export interface TemplatePreferences {
  segmentId: BusinessSegmentId;
  paletteId: ThemeId;
}

export const TEMPLATE_PREFERENCES_EVENT = 'template-preferences-updated';

const STORAGE_KEY = 'template_agendamento_preferences_v1';

const normalizePreferences = (value?: Partial<TemplatePreferences> | null): TemplatePreferences => ({
  segmentId: getBusinessSegment(value?.segmentId).id,
  paletteId: normalizeThemeId(value?.paletteId || DEFAULT_THEME_ID),
});

export const loadTemplatePreferences = (): TemplatePreferences => {
  if (typeof localStorage === 'undefined') {
    return normalizePreferences({ segmentId: DEFAULT_SEGMENT_ID, paletteId: DEFAULT_THEME_ID });
  }

  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return normalizePreferences({ segmentId: DEFAULT_SEGMENT_ID, paletteId: DEFAULT_THEME_ID });
  }
};

export const saveTemplatePreferences = (
  preferences: Partial<TemplatePreferences>,
): TemplatePreferences => {
  const next = normalizePreferences({
    ...loadTemplatePreferences(),
    ...preferences,
  });

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TEMPLATE_PREFERENCES_EVENT, { detail: next }));
  }

  return next;
};
