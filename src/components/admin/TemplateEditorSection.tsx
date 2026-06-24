import { useEffect, useMemo, useState } from 'react';
import { SiteConfig } from '../../content/siteContent';
import {
  ThemeColors,
  applyThemeColors,
  getReadableTextColor,
  isValidHexColor,
  normalizeHexColor,
  resolveThemeColors,
} from '../../utils/themeColors';

interface TemplateEditorSectionProps {
  config: SiteConfig;
  saved: boolean;
  themeColors: ThemeColors;
  onChange: (colors: ThemeColors) => void;
  onSave: () => void;
  onReset: () => void;
}

type ColorKey = keyof ThemeColors;

interface ColorFieldDefinition {
  key: ColorKey;
  label: string;
  helper: string;
}

const colorFields: ColorFieldDefinition[] = [
  {
    key: 'primary',
    label: 'Primária',
    helper: 'Botões principais, ações de destaque e links importantes.',
  },
  {
    key: 'secondary',
    label: 'Secundária',
    helper: 'Sidebar, blocos auxiliares e áreas de apoio visual.',
  },
  {
    key: 'accent',
    label: 'Destaque',
    helper: 'Badges, pequenos realces e elementos promocionais.',
  },
  {
    key: 'background',
    label: 'Fundo',
    helper: 'Fundo geral do site e do painel.',
  },
  {
    key: 'surface',
    label: 'Cards / Superfícies',
    helper: 'Cards, modais, inputs e painéis internos.',
  },
  {
    key: 'text',
    label: 'Texto principal',
    helper: 'Base para títulos e textos com contraste automático.',
  },
  {
    key: 'muted',
    label: 'Texto secundário',
    helper: 'Descrições, labels auxiliares e informações menos prioritárias.',
  },
  {
    key: 'border',
    label: 'Borda',
    helper: 'Bordas de cards, inputs e divisões visuais.',
  },
];

const PreviewCard = ({
  title,
  subtitle,
  background,
  foreground,
  border,
}: {
  title: string;
  subtitle: string;
  background: string;
  foreground: string;
  border: string;
}) => (
  <div
    className="rounded-3xl border p-4"
    style={{
      backgroundColor: background,
      color: foreground,
      borderColor: border,
    }}
  >
    <p className="text-sm font-semibold">{title}</p>
    <p className="mt-1 text-xs leading-relaxed" style={{ color: foreground }}>
      {subtitle}
    </p>
  </div>
);

const TemplateEditorSection = ({
  config,
  saved,
  themeColors,
  onChange,
  onSave,
  onReset,
}: TemplateEditorSectionProps) => {
  const [draftColors, setDraftColors] = useState<Record<ColorKey, string>>(themeColors);

  useEffect(() => {
    setDraftColors(themeColors);
  }, [themeColors]);

  useEffect(() => {
    applyThemeColors(themeColors, config.themeId);
  }, [config.themeId, themeColors]);

  const previewTheme = useMemo(
    () => resolveThemeColors(themeColors, config.themeId),
    [config.themeId, themeColors],
  );

  const commitColor = (key: ColorKey, value: string) => {
    const normalized = normalizeHexColor(value, themeColors[key]);

    setDraftColors((current) => ({
      ...current,
      [key]: normalized,
    }));

    onChange({
      ...themeColors,
      [key]: normalized,
    });
  };

  const handleTextInputChange = (key: ColorKey, value: string) => {
    setDraftColors((current) => ({
      ...current,
      [key]: value.toUpperCase(),
    }));
  };

  const previewInputText = getReadableTextColor(previewTheme.surface);

  return (
    <div className="mx-auto max-w-7xl px-3 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Tema visual
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              Personalização Visual
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Esta área ajusta somente as cores do site e do painel. Os textos
              da demonstração permanecem fixos, enquanto o contraste é corrigido
              automaticamente para evitar letras apagadas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-surface-foreground)] transition hover:opacity-90"
            >
              Restaurar padrão
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-full bg-[var(--color-button)] px-5 py-2 text-sm font-semibold text-[var(--color-button-foreground)] transition hover:bg-[var(--color-primary-hover)]"
            >
              Salvar cores
            </button>
          </div>
        </div>

        {saved && (
          <div className="mb-5 rounded-2xl border border-green-300/40 bg-green-950/20 p-3 text-sm text-green-300">
            Cores salvas com sucesso.
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 sm:p-5">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">
                Tokens do tema
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-sm">
                Aceita hex de 3 ou 6 dígitos. Se uma cor for inválida, o sistema
                restaura automaticamente uma opção segura.
              </p>
            </div>

            <div className="grid gap-4">
              {colorFields.map((field) => {
                const rawValue = draftColors[field.key];
                const normalizedValue = themeColors[field.key];
                const swatchColor = isValidHexColor(rawValue)
                  ? normalizeHexColor(rawValue)
                  : normalizedValue;

                return (
                  <label
                    key={field.key}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                          {field.label}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-[var(--color-text-secondary)]">
                          {field.helper}
                        </span>
                      </div>
                      <span
                        className="h-10 w-10 shrink-0 rounded-2xl border"
                        style={{
                          backgroundColor: swatchColor,
                          borderColor: previewTheme.border,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="color"
                        value={normalizedValue}
                        onChange={(event) => commitColor(field.key, event.target.value)}
                        className="h-12 w-full cursor-pointer rounded-2xl border border-[var(--color-border)] bg-transparent p-1 sm:w-20"
                        aria-label={`Selecionar cor ${field.label}`}
                      />
                      <input
                        type="text"
                        inputMode="text"
                        value={rawValue}
                        onChange={(event) =>
                          handleTextInputChange(field.key, event.target.value)
                        }
                        onBlur={() => commitColor(field.key, rawValue)}
                        placeholder="#000000"
                        className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-input-foreground)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 sm:p-5">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">
                Prévia visual
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-sm">
                Botões, badges, cards, sidebar, inputs e textos abaixo usam os
                foregrounds automáticos gerados pelo sistema.
              </p>
            </div>

            <div
              className="overflow-hidden rounded-[2rem] border shadow-card"
              style={{
                backgroundColor: previewTheme.background,
                borderColor: previewTheme.border,
                color: previewTheme.backgroundForeground,
              }}
            >
              <div
                className="flex items-center justify-between border-b px-4 py-3"
                style={{
                  backgroundColor: previewTheme.secondary,
                  borderColor: previewTheme.border,
                  color: previewTheme.secondaryForeground,
                }}
              >
                <div>
                  <p className="text-sm font-bold">{config.siteName}</p>
                  <p
                    className="text-xs"
                    style={{
                      color: previewTheme.secondaryForeground,
                    }}
                  >
                    Home demonstrativa com contraste automático
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: previewTheme.accent,
                    color: previewTheme.accentForeground,
                  }}
                >
                  Badge
                </span>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.2em]"
                      style={{ color: previewTheme.primary }}
                    >
                      Site público
                    </p>
                    <h4 className="mt-2 text-2xl font-bold">
                      Cores do site com contraste seguro
                    </h4>
                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: previewTheme.muted }}
                    >
                      Mesmo que você escolha fundos claros ou escuros, o sistema
                      recalcula automaticamente a cor do texto para manter a
                      leitura em botões, cards e áreas administrativas.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full px-5 py-2.5 text-sm font-semibold"
                      style={{
                        backgroundColor: previewTheme.button,
                        color: previewTheme.buttonForeground,
                      }}
                    >
                      Botão principal
                    </button>
                    <button
                      type="button"
                      className="rounded-full border px-5 py-2.5 text-sm font-semibold"
                      style={{
                        backgroundColor: previewTheme.surface,
                        color: previewTheme.surfaceForeground,
                        borderColor: previewTheme.border,
                      }}
                    >
                      Botão secundário
                    </button>
                  </div>

                  <PreviewCard
                    title="Card principal"
                    subtitle="Títulos e descrições permanecem legíveis sobre superfícies dinâmicas."
                    background={previewTheme.surface}
                    foreground={previewTheme.surfaceForeground}
                    border={previewTheme.border}
                  />
                </div>

                <div
                  className="space-y-4 rounded-[1.75rem] border p-4"
                  style={{
                    backgroundColor: previewTheme.surfaceAlt,
                    borderColor: previewTheme.border,
                    color: previewTheme.surfaceForeground,
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold">Sidebar / Painel</p>
                    <p
                      className="mt-1 text-xs leading-relaxed"
                      style={{ color: previewTheme.mutedForeground }}
                    >
                      Os blocos laterais e indicadores usam a cor secundária com
                      foreground calculado automaticamente.
                    </p>
                  </div>

                  <div
                    className="rounded-3xl border p-3"
                    style={{
                      backgroundColor: previewTheme.secondary,
                      color: previewTheme.secondaryForeground,
                      borderColor: previewTheme.border,
                    }}
                  >
                    <p className="text-sm font-semibold">Menu lateral</p>
                    <p className="mt-1 text-xs">Visão geral • Agendamentos • Cores</p>
                  </div>

                  <div
                    className="rounded-3xl border p-3"
                    style={{
                      backgroundColor: previewTheme.surface,
                      borderColor: previewTheme.border,
                    }}
                  >
                    <label
                      className="mb-2 block text-xs font-semibold"
                      style={{ color: previewTheme.mutedForeground }}
                    >
                      Input de exemplo
                    </label>
                    <input
                      type="text"
                      value="#AABBCC"
                      readOnly
                      className="w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none"
                      style={{
                        backgroundColor: previewTheme.surface,
                        borderColor: previewTheme.border,
                        color: previewInputText,
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: previewTheme.primary,
                        color: previewTheme.primaryForeground,
                      }}
                    >
                      Badge primária
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: previewTheme.accent,
                        color: previewTheme.accentForeground,
                      }}
                    >
                      Badge destaque
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorSection;
