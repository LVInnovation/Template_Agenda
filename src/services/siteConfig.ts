import { defaultSiteConfig, normalizeSiteConfig, SiteConfig } from '../content/siteContent';
import { SITE_CONFIG_EVENT } from '../config/appConfig';
import { localDataClient } from './localDatabase';
import { loadTemplatePreferences } from './templatePreferences';
import { applyThemeColors } from '../utils/themeColors';

export const APP_STATE_TABLE = 'site_config';
export const APP_STATE_ID = 'template-site-config';

export const loadSiteConfigFromDatabase = async (): Promise<SiteConfig> => {
  const preferences = loadTemplatePreferences();
  const { data, error } = await localDataClient
    .from(APP_STATE_TABLE)
    .select('config')
    .eq('id', APP_STATE_ID)
    .maybeSingle();

  if (error || !data?.config) {
    const fallback = normalizeSiteConfig(defaultSiteConfig);
    applyThemeColors(preferences.themeColors, preferences.paletteId);
    return fallback;
  }

  const state = data.config as { siteConfig?: Partial<SiteConfig> };
  const config = normalizeSiteConfig(state.siteConfig);
  applyThemeColors(preferences.themeColors, preferences.paletteId);
  return config;
};

export const saveSiteConfigToDatabase = async (siteConfig: SiteConfig) => {
  const normalized = normalizeSiteConfig(siteConfig);
  const preferences = loadTemplatePreferences();

  await localDataClient.from(APP_STATE_TABLE).upsert({
    id: APP_STATE_ID,
    config: { siteConfig: normalized },
    updated_at: new Date().toISOString(),
  });

  applyThemeColors(preferences.themeColors, preferences.paletteId);
  window.dispatchEvent(new CustomEvent(SITE_CONFIG_EVENT, { detail: normalized }));
};
