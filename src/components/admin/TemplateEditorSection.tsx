import type { ReactNode } from 'react';
import {
  SiteConfig,
  SiteService,
  createSiteConfigForSegment,
  normalizeSiteConfig,
} from '../../content/siteContent';
import { ThemeId, applyThemePreset, getThemePreset } from '../../config/appConfig';
import { businessSegments, getBusinessSegment } from '../../config/templatePresets';
import { themePalettes } from '../../config/themePalettes';

interface TemplateEditorSectionProps {
  config: SiteConfig;
  saved: boolean;
  onChange: (config: SiteConfig) => void;
  onSave: () => void;
  onReset: () => void;
}

interface EditorFieldProps {
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

const getHomeTitle = (config: SiteConfig) =>
  [
    config.home.heroTitleStart,
    config.home.heroTitleHighlight,
    config.home.heroTitleEnd,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const createServiceCard = (): SiteService => ({
  id: `site-service-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: '',
  description: '',
});

const EditorCard = ({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: ReactNode;
}) => (
  <section className="rounded-3xl border border-gold-400/20 bg-dark-800 p-4 shadow-sm sm:p-5">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-gold-300 sm:text-lg">
        {title}
      </h3>
      {helper && (
        <p className="mt-1 text-xs leading-relaxed text-gray-400 sm:text-sm">
          {helper}
        </p>
      )}
    </div>
    {children}
  </section>
);

const EditorField = ({
  label,
  helper,
  value,
  onChange,
  multiline = false,
}: EditorFieldProps) => (
  <label className="block">
    <span className="block text-sm font-semibold text-gray-100">{label}</span>
    <span className="mt-1 block text-xs leading-relaxed text-gray-400">
      {helper}
    </span>
    {multiline ? (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full rounded-2xl border border-gold-400/20 bg-dark-700 px-4 py-3 text-sm text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-gold-400/20 bg-dark-700 px-4 py-3 text-sm text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
      />
    )}
  </label>
);

const TemplateEditorSection = ({
  config,
  saved,
  onChange,
  onSave,
  onReset,
}: TemplateEditorSectionProps) => {
  const activeSegment = getBusinessSegment(config.segmentId);
  const activePalette = getThemePreset(config.themeId);

  const updateConfig = (update: Partial<SiteConfig>) => {
    onChange(normalizeSiteConfig({ ...config, ...update }));
  };

  const updateHome = (update: Partial<SiteConfig['home']>) => {
    onChange(
      normalizeSiteConfig({
        ...config,
        home: { ...config.home, ...update },
      }),
    );
  };

  const updateButtons = (update: Partial<SiteConfig['buttons']>) => {
    onChange(
      normalizeSiteConfig({
        ...config,
        buttons: { ...config.buttons, ...update },
      }),
    );
  };

  const updateService = (
    serviceId: string | number,
    update: Partial<SiteService>,
  ) => {
    updateConfig({
      services: config.services.map((service) =>
        service.id === serviceId ? { ...service, ...update } : service,
      ),
    });
  };

  const addService = () => {
    updateConfig({ services: [...config.services, createServiceCard()] });
  };

  const removeService = (serviceId: string | number) => {
    updateConfig({
      services: config.services.filter((service) => service.id !== serviceId),
    });
  };

  const updateNiches = (value: string) => {
    updateConfig({
      niches: value
        .split(',')
        .map((niche) => niche.trim())
        .filter(Boolean),
    });
  };

  const selectBusinessType = (segmentId: string) => {
    const previousDefaultName = activeSegment.siteText.siteName;
    const nextConfig = createSiteConfigForSegment(segmentId, config.themeId);

    onChange(
      normalizeSiteConfig({
        ...nextConfig,
        siteName:
          config.siteName && config.siteName !== previousDefaultName
            ? config.siteName
            : nextConfig.siteName,
        contactEmail: config.contactEmail,
        contactPhone: config.contactPhone,
        header: {
          ...nextConfig.header,
          admin: config.header.admin,
          agenda: config.header.agenda,
          activePackages: config.header.activePackages,
          notifications: config.header.notifications,
          openMenuAria: config.header.openMenuAria,
          closeMenuAria: config.header.closeMenuAria,
        },
      }),
    );
  };

  const selectPalette = (paletteId: ThemeId) => {
    applyThemePreset(paletteId);
    onChange(normalizeSiteConfig({ ...config, themeId: paletteId }));
  };

  const updateHomeTitle = (value: string) => {
    updateHome({
      heroTitleStart: value,
      heroTitleHighlight: '',
      heroTitleEnd: '',
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-3 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
              Área principal do site
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-100">
              Editor do Template
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">
              Configure o modelo público em um só lugar: identidade, textos da
              Home, tema visual e exemplos usados na demonstração.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-gold-400/20 bg-dark-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-dark-800"
            >
              Restaurar padrão
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-full bg-gold-400 px-5 py-2 text-sm font-semibold text-dark-900 hover:bg-gold-300"
            >
              Salvar template
            </button>
          </div>
        </div>

        {saved && (
          <div className="mb-5 rounded-2xl border border-green-300/40 bg-green-950/30 p-3 text-sm text-green-300">
            Template salvo com sucesso.
          </div>
        )}

        <div className="mb-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
            <p className="text-xs text-gray-400">Tipo de negócio ativo</p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {activeSegment.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Esse tipo altera textos, exemplos e estilo do layout.
            </p>
          </div>
          <div className="rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
            <p className="text-xs text-gray-400">Tema ativo</p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {activePalette.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Essa cor altera botões, bordas e destaques.
            </p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <EditorCard
              title="Identidade do Modelo"
              helper="O que identifica o site e define a base visual da demonstração."
            >
              <div className="space-y-5">
                <EditorField
                  label="Nome exibido no topo do site"
                  helper="Esse nome aparece no topo do site e no rodapé."
                  value={config.siteName}
                  onChange={(value) => updateConfig({ siteName: value })}
                />

                <div>
                  <p className="text-sm font-semibold text-gray-100">
                    Tipo de negócio
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Esse tipo altera textos, exemplos e estilo do layout.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {businessSegments.map((segment) => {
                      const active = segment.id === config.segmentId;

                      return (
                        <button
                          key={segment.id}
                          type="button"
                          onClick={() => selectBusinessType(segment.id)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            active
                              ? 'border-gold-400 bg-gold-400 text-dark-900 shadow-sm'
                              : 'border-gold-400/20 bg-dark-700 text-gray-100 hover:border-gold-400/60'
                          }`}
                        >
                          <span className="block font-semibold">
                            {segment.label}
                          </span>
                          <span
                            className={`mt-2 block text-xs leading-relaxed ${
                              active ? 'text-dark-800' : 'text-gray-400'
                            }`}
                          >
                            {segment.niches.slice(0, 3).join(', ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-100">
                    Estilo visual / paleta
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Essa cor altera botões, bordas e destaques.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {themePalettes.map((palette) => {
                      const active = palette.id === config.themeId;

                      return (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => selectPalette(palette.id)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            active
                              ? 'border-gold-400 bg-gold-400/15'
                              : 'border-gold-400/20 bg-dark-700 hover:border-gold-400/60'
                          }`}
                        >
                          <span className="mb-3 flex gap-1.5">
                            <span
                              className="h-5 w-5 rounded-full border border-white/20"
                              style={{ backgroundColor: palette.tokens.background }}
                            />
                            <span
                              className="h-5 w-5 rounded-full border border-white/20"
                              style={{ backgroundColor: palette.tokens.surface }}
                            />
                            <span
                              className="h-5 w-5 rounded-full border border-white/20"
                              style={{ backgroundColor: palette.tokens.primary }}
                            />
                          </span>
                          <span className="block text-sm font-semibold text-gray-100">
                            {palette.name}
                          </span>
                          <span className="mt-1 block text-xs text-gray-400">
                            {palette.mode === 'dark' ? 'Modo escuro' : 'Modo claro'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </EditorCard>

            <EditorCard
              title="Página Inicial"
              helper="Textos principais da primeira dobra do site."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <EditorField
                  label="Texto principal da Home"
                  helper="Esse texto aparece na primeira dobra da página inicial."
                  value={getHomeTitle(config)}
                  onChange={updateHomeTitle}
                />
                <EditorField
                  label="Descrição da Home"
                  helper="Aparece abaixo do texto principal da Home."
                  value={config.home.heroSubtitle}
                  onChange={(value) => updateHome({ heroSubtitle: value })}
                  multiline
                />
                <EditorField
                  label="Texto do botão principal"
                  helper="Aparece no botão de agendamento da Home."
                  value={config.buttons.scheduleNow}
                  onChange={(value) => updateButtons({ scheduleNow: value })}
                />
                <EditorField
                  label="Texto do botão secundário"
                  helper="Aparece no botão que leva para os profissionais."
                  value={config.buttons.viewProfessionals}
                  onChange={(value) =>
                    updateButtons({ viewProfessionals: value })
                  }
                />
              </div>
            </EditorCard>

            <EditorCard
              title="Seções do Site"
              helper="Textos que aparecem nas seções públicas abaixo da primeira dobra."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <EditorField
                  label="Título da seção de profissionais"
                  helper="Aparece acima dos cards de profissionais/especialistas."
                  value={config.home.professionalsTitle}
                  onChange={(value) =>
                    updateHome({ professionalsTitle: value })
                  }
                />
                <EditorField
                  label="Descrição da seção de profissionais"
                  helper="Aparece abaixo do título da seção."
                  value={config.home.professionalsSubtitle}
                  onChange={(value) =>
                    updateHome({ professionalsSubtitle: value })
                  }
                  multiline
                />
                <EditorField
                  label="Título da seção de serviços"
                  helper="Aparece acima dos cards demonstrativos de serviços."
                  value={config.servicesTitle}
                  onChange={(value) => updateConfig({ servicesTitle: value })}
                />
                <EditorField
                  label="Descrição da seção de serviços"
                  helper="Aparece abaixo do título da seção de serviços."
                  value={config.servicesSubtitle}
                  onChange={(value) =>
                    updateConfig({ servicesSubtitle: value })
                  }
                  multiline
                />
                <EditorField
                  label="Título da chamada de agendamento"
                  helper="Aparece antes do botão final de agendamento."
                  value={config.home.ctaTitle}
                  onChange={(value) => updateHome({ ctaTitle: value })}
                />
                <EditorField
                  label="Descrição da chamada de agendamento"
                  helper="Aparece abaixo do título da chamada final."
                  value={config.home.ctaSubtitle}
                  onChange={(value) => updateHome({ ctaSubtitle: value })}
                  multiline
                />
              </div>
            </EditorCard>

            <EditorCard
              title="Cards e Nichos"
              helper="Conteúdo demonstrativo exibido na vitrine pública do template."
            >
              <div className="space-y-4">
                <EditorField
                  label="Nichos exibidos"
                  helper="Separe por vírgula. Aparecem no card visual da Home."
                  value={config.niches.join(', ')}
                  onChange={updateNiches}
                  multiline
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-100">
                        Cards de serviços da Home
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Esses cards são a vitrine do site; os serviços reais
                        da agenda ficam dentro de cada profissional.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addService}
                      className="shrink-0 rounded-full border border-gold-400/20 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-400/10"
                    >
                      + Card
                    </button>
                  </div>

                  {config.services.map((service, index) => (
                    <div
                      key={service.id}
                      className="rounded-2xl border border-gold-400/10 bg-dark-700 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-gray-300">
                          Card {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeService(service.id)}
                          className="rounded-full px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-950/40"
                        >
                          Remover
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <EditorField
                          label="Nome do card"
                          helper="Título exibido no card de serviço."
                          value={service.name}
                          onChange={(value) =>
                            updateService(service.id, { name: value })
                          }
                        />
                        <EditorField
                          label="Descrição do card"
                          helper="Texto curto exibido no card."
                          value={service.description}
                          onChange={(value) =>
                            updateService(service.id, { description: value })
                          }
                          multiline
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </EditorCard>
          </div>

          <div className="space-y-5">
            <EditorCard
              title="Prévia do Site"
              helper="Veja rapidamente como nome, texto e cores aparecem juntos."
            >
              <div
                className="overflow-hidden rounded-3xl border"
                style={{
                  backgroundColor: activePalette.tokens.background,
                  borderColor: activePalette.tokens.border,
                  color: activePalette.tokens.textPrimary,
                }}
              >
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{ borderColor: activePalette.tokens.border }}
                >
                  <span className="text-sm font-bold">{config.siteName}</span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: activePalette.tokens.primary,
                      color: activePalette.tokens.primaryForeground,
                    }}
                  >
                    {activeSegment.label}
                  </span>
                </div>
                <div className="p-5">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: activePalette.tokens.primary }}
                  >
                    Home
                  </p>
                  <h4 className="mt-2 text-2xl font-bold leading-tight">
                    {getHomeTitle(config)}
                  </h4>
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: activePalette.tokens.textSecondary }}
                  >
                    {config.home.heroSubtitle}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span
                      className="rounded-full px-4 py-2 text-xs font-semibold"
                      style={{
                        backgroundColor: activePalette.tokens.primary,
                        color: activePalette.tokens.primaryForeground,
                      }}
                    >
                      {config.buttons.scheduleNow}
                    </span>
                    <span
                      className="rounded-full border px-4 py-2 text-xs font-semibold"
                      style={{
                        borderColor: activePalette.tokens.border,
                        color: activePalette.tokens.primary,
                      }}
                    >
                      {config.buttons.viewProfessionals}
                    </span>
                  </div>
                  <div
                    className="mt-5 rounded-2xl border p-4"
                    style={{
                      backgroundColor: activePalette.tokens.surface,
                      borderColor: activePalette.tokens.border,
                    }}
                  >
                    <p className="text-sm font-semibold">
                      Card de exemplo
                    </p>
                    <p
                      className="mt-1 text-xs leading-relaxed"
                      style={{ color: activePalette.tokens.textSecondary }}
                    >
                      Profissional, serviço ou chamada demonstrativa usando a
                      paleta escolhida.
                    </p>
                  </div>
                </div>
              </div>
            </EditorCard>

            <EditorCard
              title="Referência do Segmento"
              helper="Mostra qual preset está ativo para orientar a edição do template."
            >
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-gray-100">
                    Segmento ativo
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    {activeSegment.description}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-100">
                    Profissionais de exemplo
                  </p>
                  <div className="mt-2 grid gap-2">
                    {activeSegment.demoProfessionals.map((professional) => (
                      <div
                        key={professional.id}
                        className="rounded-2xl border border-gold-400/10 bg-dark-700 p-3"
                      >
                        <p className="text-sm font-semibold text-gray-100">
                          {professional.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {professional.specialty}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </EditorCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorSection;
