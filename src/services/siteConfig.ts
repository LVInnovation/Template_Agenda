import { defaultSiteConfig, normalizeSiteConfig, SiteConfig } from '../content/siteContent';
import { applyThemePreset, SITE_CONFIG_EVENT } from '../config/appConfig';
import { localDataClient } from './localDatabase';
import { loadTemplatePreferences } from './templatePreferences';

export const APP_STATE_TABLE = 'site_config';
export const APP_STATE_ID = 'template-site-config';

export const loadSiteConfigFromDatabase = async (): Promise<SiteConfig> => {
  const { data, error } = await localDataClient
    .from(APP_STATE_TABLE)
    .select('config')
    .eq('id', APP_STATE_ID)
    .maybeSingle();

  if (error || !data?.config) {
    const fallback = normalizeSiteConfig(defaultSiteConfig);
    applyThemePreset(loadTemplatePreferences().paletteId);
    return fallback;
  }

  const state = data.config as { siteConfig?: Partial<SiteConfig> };
  const config = normalizeSiteConfig(state.siteConfig);
  applyThemePreset(loadTemplatePreferences().paletteId);
  return config;
};

export const saveSiteConfigToDatabase = async (siteConfig: SiteConfig) => {
  const normalized = normalizeSiteConfig(siteConfig);

  await localDataClient.from(APP_STATE_TABLE).upsert({
    id: APP_STATE_ID,
    config: { siteConfig: normalized },
    updated_at: new Date().toISOString(),
  });

  applyThemePreset(normalized.themeId);
  window.dispatchEvent(new CustomEvent(SITE_CONFIG_EVENT, { detail: normalized }));
};
