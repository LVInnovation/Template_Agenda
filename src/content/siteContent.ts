import { DEFAULT_THEME_ID, ThemeId, getThemePreset } from '../config/appConfig';
import {
  BusinessSegmentId,
  DEFAULT_SEGMENT_ID,
  getBusinessSegment,
} from '../config/templatePresets';

export interface SiteService {
  id: string | number;
  name: string;
  description: string;
}

export interface SiteConfig {
  themeId: ThemeId;
  segmentId: BusinessSegmentId;
  siteName: string;
  footerDescription: string;
  contactEmail: string;
  contactPhone: string;
  niches: string[];
  servicesBadge: string;
  servicesTitle: string;
  servicesSubtitle: string;
  services: SiteService[];
  header: {
    browserTitleSuffix: string;
    navHome: string;
    navProfessionals: string;
    navServices: string;
    navBooking: string;
    admin: string;
    agenda: string;
    activePackages: string;
    notifications: string;
    openMenuAria: string;
    closeMenuAria: string;
  };
  home: {
    heroBadge: string;
    heroTitleStart: string;
    heroTitleHighlight: string;
    heroTitleEnd: string;
    heroSubtitle: string;
    professionalsBadge: string;
    professionalsTitle: string;
    professionalsSubtitle: string;
    ctaTitle: string;
    ctaSubtitle: string;
  };
  footer: {
    quickLinksTitle: string;
    quickHome: string;
    quickProfessionals: string;
    quickServices: string;
    quickBooking: string;
    contactTitle: string;
    copyrightSuffix: string;
  };
  buttons: {
    scheduleNow: string;
    viewProfessionals: string;
    myAppointments: string;
    viewSchedule: string;
    scheduleTime: string;
    makeAppointment: string;
    cancelAppointment: string;
    backToSite: string;
    confirmBooking: string;
    saving: string;
  };
  messages: {
    bookingToastTitle: string;
    bookingToastDescription: string;
    professionalFallbackName: string;
    professionalFallbackSpecialty: string;
    closeNoticeAria: string;
    emptyProfessionalsTitle: string;
    emptyProfessionalsDescription: string;
    emptyServicesTitle: string;
    emptyServicesDescription: string;
  };
  bookingModal: {
    eyebrow: string;
    title: string;
    subtitle: string;
    clientDataTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    selectionTitle: string;
    professionalLabel: string;
    noProfessionals: string;
    serviceLabel: string;
    noServices: string;
    dateTimeTitle: string;
    dateTimeSubtitle: string;
    dateLabel: string;
    timeLabel: string;
    noDates: string;
    selectDateFirst: string;
    noTimes: string;
    summaryTitle: string;
    summaryProfessionalLabel: string;
    summaryServiceLabel: string;
    selectService: string;
    selectedDatePrefix: string;
    selectAvailableDate: string;
    selectedTimePrefix: string;
    selectAvailableTime: string;
    availableDaysSuffix: string;
    closeAria: string;
    requiredError: string;
    conflictError: string;
    phoneConflictError: string;
    blockedError: string;
    saveError: string;
    statusUnavailable: string;
    statusVacation: string;
    statusBlocked: string;
    statusPartial: string;
    statusAvailable: string;
    noSlotsReason: string;
  };
  appointmentsPage: {
    title: string;
    subtitle: string;
    phoneCardTitle: string;
    phoneCardDescription: string;
    phonePlaceholder: string;
    invalidPhoneError: string;
    searchError: string;
    cancelConfirm: string;
    cancelSuccess: string;
    cancelError: string;
    emptyTitle: string;
    emptyDescription: string;
    foundSingular: string;
    foundPlural: string;
    statusConfirmed: string;
    statusCanceled: string;
    statusScheduled: string;
  };
}

type AnyRecord = Record<string, any>;

const textOrDefault = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback;

const featuredServicesToSiteServices = (segmentId: BusinessSegmentId): SiteService[] =>
  getBusinessSegment(segmentId).featuredServices.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
  }));

export const createSiteConfigForSegment = (
  segmentId: string | null | undefined = DEFAULT_SEGMENT_ID,
  themeId: string | null | undefined = DEFAULT_THEME_ID,
): SiteConfig => {
  const segment = getBusinessSegment(segmentId);
  const theme = getThemePreset(themeId);

  return {
    themeId: theme.id,
    segmentId: segment.id,
    siteName: segment.siteText.siteName,
    footerDescription: segment.siteText.footerDescription,
    contactEmail: '',
    contactPhone: '',
    niches: segment.niches,
    servicesBadge: segment.siteText.servicesBadge,
    servicesTitle: segment.siteText.servicesTitle,
    servicesSubtitle: segment.siteText.servicesSubtitle,
    services: featuredServicesToSiteServices(segment.id),
    header: {
      browserTitleSuffix: segment.siteText.header.browserTitleSuffix,
      navHome: segment.siteText.header.navHome,
      navProfessionals: segment.siteText.header.navProfessionals,
      navServices: segment.siteText.header.navServices,
      navBooking: segment.siteText.header.navBooking,
      admin: 'Painel',
      agenda: 'Agenda',
      activePackages: 'Pacotes',
      notifications: 'Notificações',
      openMenuAria: 'Abrir menu',
      closeMenuAria: 'Fechar menu',
    },
    home: {
      heroBadge: segment.siteText.home.heroBadge,
      heroTitleStart: segment.siteText.home.heroTitleStart,
      heroTitleHighlight: segment.siteText.home.heroTitleHighlight,
      heroTitleEnd: segment.siteText.home.heroTitleEnd,
      heroSubtitle: segment.siteText.home.heroSubtitle,
      professionalsBadge: segment.siteText.home.professionalsBadge,
      professionalsTitle: segment.siteText.home.professionalsTitle,
      professionalsSubtitle: segment.siteText.home.professionalsSubtitle,
      ctaTitle: segment.siteText.home.ctaTitle,
      ctaSubtitle: segment.siteText.home.ctaSubtitle,
    },
    footer: {
      quickLinksTitle: 'Links rápidos',
      quickHome: segment.siteText.header.navHome,
      quickProfessionals: segment.siteText.header.navProfessionals,
      quickServices: segment.siteText.header.navServices,
      quickBooking: segment.siteText.header.navBooking,
      contactTitle: 'Contato',
      copyrightSuffix: 'Template demonstrativo. Personalize antes de publicar.',
    },
    buttons: {
      scheduleNow: 'Agendar agora',
      viewProfessionals: 'Ver profissionais',
      myAppointments: 'Meus agendamentos',
      viewSchedule: 'Ver agenda',
      scheduleTime: 'Escolher horário',
      makeAppointment: 'Fazer agendamento',
      cancelAppointment: 'Cancelar agendamento',
      backToSite: 'Voltar ao site',
      confirmBooking: 'Confirmar agendamento',
      saving: 'Salvando...',
    },
    messages: {
      bookingToastTitle: 'Agendamento confirmado',
      bookingToastDescription: 'O horário foi reservado nesta demonstração local.',
      professionalFallbackName: 'Profissional exemplo',
      professionalFallbackSpecialty: 'Especialista',
      closeNoticeAria: 'Fechar aviso',
      emptyProfessionalsTitle: 'Cadastre profissionais ou use a demo do segmento',
      emptyProfessionalsDescription:
        'Este template pode exibir dados fictícios no site público e dados locais quando você cadastrar profissionais no painel.',
      emptyServicesTitle: 'Serviços demonstrativos disponíveis',
      emptyServicesDescription:
        'Os cards de vitrine são configuráveis e podem ser adaptados para qualquer cliente depois da venda.',
    },
    bookingModal: {
      eyebrow: 'Agendamento',
      title: 'Reserve seu horário',
      subtitle: 'Selecione profissional, serviço, data e horário disponíveis.',
      clientDataTitle: 'Dados do cliente',
      nameLabel: 'Nome',
      namePlaceholder: 'Nome do cliente',
      phoneLabel: 'Telefone',
      phonePlaceholder: '(00) 00000-0000',
      selectionTitle: 'Escolha profissional e serviço',
      professionalLabel: 'Profissional',
      noProfessionals: 'Nenhum profissional disponível nesta demonstração.',
      serviceLabel: 'Serviço',
      noServices: 'Este profissional ainda não possui serviços cadastrados.',
      dateTimeTitle: 'Escolha data e horário',
      dateTimeSubtitle: 'Toque em uma data e depois no horário.',
      dateLabel: 'Data',
      timeLabel: 'Horário',
      noDates: 'Nenhuma data disponível para este profissional.',
      selectDateFirst: 'Selecione uma data para ver os horários disponíveis.',
      noTimes: 'Não há horários disponíveis para esta data.',
      summaryTitle: 'Resumo',
      summaryProfessionalLabel: 'Profissional',
      summaryServiceLabel: 'Serviço',
      selectService: 'Selecione um serviço',
      selectedDatePrefix: 'Data escolhida',
      selectAvailableDate: 'Selecione uma data disponível',
      selectedTimePrefix: 'Horário escolhido',
      selectAvailableTime: 'Selecione um horário disponível',
      availableDaysSuffix: 'dias disponíveis até o mesmo dia do próximo mês.',
      closeAria: 'Fechar agendamento',
      requiredError: 'Preencha todos os campos para continuar.',
      conflictError:
        'Já existe um agendamento nesse intervalo com este profissional. Escolha outro horário.',
      phoneConflictError:
        'Este telefone já possui um agendamento nesse mesmo dia e horário. Escolha outro horário.',
      blockedError: 'Atendimento indisponível para este telefone. Entre em contato.',
      saveError:
        'Não foi possível salvar o agendamento. Verifique o armazenamento local do navegador.',
      statusUnavailable: 'Indisponível',
      statusVacation: 'Férias',
      statusBlocked: 'Bloqueado',
      statusPartial: 'Parcialmente disponível',
      statusAvailable: 'Disponível',
      noSlotsReason: 'Sem horários disponíveis',
    },
    appointmentsPage: {
      title: 'Meus Agendamentos',
      subtitle: 'Consulte e cancele horários cadastrados nesta demonstração',
      phoneCardTitle: 'Digite seu telefone',
      phoneCardDescription: 'Buscaremos os agendamentos futuros vinculados a este número.',
      phonePlaceholder: '(00) 00000-0000',
      invalidPhoneError: 'Digite um telefone válido.',
      searchError: 'Erro ao buscar agendamentos. Tente novamente.',
      cancelConfirm: 'Tem certeza que deseja cancelar este agendamento?',
      cancelSuccess: 'Agendamento cancelado com sucesso.',
      cancelError: 'Erro ao cancelar agendamento. Tente novamente.',
      emptyTitle: 'Nenhum agendamento encontrado',
      emptyDescription: 'Não encontramos agendamentos futuros para este número.',
      foundSingular: 'agendamento encontrado',
      foundPlural: 'agendamentos encontrados',
      statusConfirmed: 'Confirmado',
      statusCanceled: 'Cancelado',
      statusScheduled: 'Agendado',
    },
  };
};

export const defaultSiteConfig: SiteConfig = createSiteConfigForSegment();

const mergeObject = <T extends AnyRecord>(fallback: T, value?: Partial<T>): T =>
  Object.keys(fallback).reduce((result, key) => {
    const fallbackValue = fallback[key];
    const nextValue = value?.[key as keyof T];

    if (typeof fallbackValue === 'string') {
      result[key] = textOrDefault(nextValue, fallbackValue);
      return result;
    }

    if (Array.isArray(fallbackValue)) {
      result[key] = Array.isArray(nextValue) ? nextValue : fallbackValue;
      return result;
    }

    result[key] = mergeObject(fallbackValue, nextValue as AnyRecord);
    return result;
  }, {} as AnyRecord) as T;

const normalizeServices = (services?: SiteService[], segmentId: BusinessSegmentId = DEFAULT_SEGMENT_ID) => {
  if (!Array.isArray(services)) return featuredServicesToSiteServices(segmentId);

  return services.map((service, index) => ({
    id: service.id || `service-${index + 1}`,
    name: textOrDefault(service.name, `Serviço demonstrativo ${index + 1}`),
    description: textOrDefault(service.description, ''),
  }));
};

const normalizeNiches = (niches?: string[], segmentId: BusinessSegmentId = DEFAULT_SEGMENT_ID) => {
  if (!Array.isArray(niches)) return getBusinessSegment(segmentId).niches;

  const normalized = niches
    .map((niche) => String(niche || '').trim())
    .filter(Boolean);

  return normalized.length ? normalized : getBusinessSegment(segmentId).niches;
};

const isLegacyDefaultConfig = (value?: Partial<SiteConfig> | null) =>
  !value?.segmentId &&
  (value?.siteName === 'Nome do Negócio' ||
    value?.home?.heroBadge === 'Modelo pronto para personalizar');

export const normalizeSiteConfig = (value?: Partial<SiteConfig> | null): SiteConfig => {
  const selectedSegment = getBusinessSegment(value?.segmentId);
  const selectedTheme = getThemePreset(value?.themeId);
  const fallback = createSiteConfigForSegment(selectedSegment.id, selectedTheme.id);
  const source = isLegacyDefaultConfig(value) ? {} : value || {};
  const merged = mergeObject(fallback, source);

  return {
    ...merged,
    themeId: selectedTheme.id,
    segmentId: selectedSegment.id,
    servicesBadge: textOrDefault(source.servicesBadge, merged.servicesBadge),
    servicesTitle: textOrDefault(source.servicesTitle, merged.servicesTitle),
    servicesSubtitle: textOrDefault(source.servicesSubtitle, merged.servicesSubtitle),
    niches: normalizeNiches(source.niches ?? merged.niches, selectedSegment.id),
    services: normalizeServices(source.services ?? merged.services, selectedSegment.id),
  };
};
