import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { localDataClient } from '../services/localDatabase';
import {
  createSiteConfigForSegment,
  defaultSiteConfig,
  normalizeSiteConfig,
  SiteConfig,
} from '../content/siteContent';
import { loadSiteConfigFromDatabase } from '../services/siteConfig';
import { MonthlySchedule, ScheduleBlock, WeeklyRule, WeekDay } from '../components/schedule/types';
import { DEFAULT_PROFESSIONAL_IMAGE } from '../config/appConfig';
import { getBusinessSegment } from '../config/templatePresets';
import {
  TEMPLATE_PREFERENCES_EVENT,
  TemplatePreferences,
  loadTemplatePreferences,
} from '../services/templatePreferences';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import ProfessionalCard from '../components/common/ProfessionalCard';
import Footer from '../components/common/Footer';
import BookingModal from '../components/booking/BookingModal';

interface Service {
  id: string | number;
  name: string;
  duration: string;
  price: string;
}

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  intervalMinutes?: 30 | 60;
  hasLunchBreak?: boolean;
  lunchStartTime?: string;
  lunchEndTime?: string;
}

interface WorkSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface VacationPeriod {
  enabled: boolean;
  startDate: string;
  endDate: string;
}

interface Professional {
  id: string | number;
  name: string;
  specialty: string;
  status: 'active' | 'inactive';
  image: string;
  services: Service[];
  schedule?: WorkSchedule;
  monthlySchedules?: MonthlySchedule[];
  vacation?: VacationPeriod;
}

const defaultProfessionals: Professional[] = [];

type DatabaseProfessional = {
  id: string;
  name: string;
  specialty: string | null;
  status: string | null;
  image: string | null;
};

type DatabaseService = {
  id: string;
  professional_id: string;
  name: string;
  duration: number | string | null;
  price: number | string | null;
};

type DatabaseWeeklySchedule = {
  professional_id: string;
  week_day: WeekDay;
  enabled: boolean | null;
  start_time: string | null;
  end_time: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  interval_minutes: number | null;
};

type DatabaseScheduleBlock = {
  id: string;
  professional_id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

const fallbackImages = defaultProfessionals.map((professional) => professional.image);

const createDefaultWeeklyRules = (): Record<WeekDay, WeeklyRule> => ({
  monday: { enabled: false, startTime: '08:00', endTime: '18:00', intervalMinutes: 30, hasLunchBreak: false, lunchStartTime: '12:00', lunchEndTime: '13:00' },
  tuesday: { enabled: false, startTime: '08:00', endTime: '18:00', intervalMinutes: 30, hasLunchBreak: false, lunchStartTime: '12:00', lunchEndTime: '13:00' },
  wednesday: { enabled: false, startTime: '08:00', endTime: '18:00', intervalMinutes: 30, hasLunchBreak: false, lunchStartTime: '12:00', lunchEndTime: '13:00' },
  thursday: { enabled: false, startTime: '08:00', endTime: '18:00', intervalMinutes: 30, hasLunchBreak: false, lunchStartTime: '12:00', lunchEndTime: '13:00' },
  friday: { enabled: false, startTime: '08:00', endTime: '18:00', intervalMinutes: 30, hasLunchBreak: false, lunchStartTime: '12:00', lunchEndTime: '13:00' },
  saturday: { enabled: false, startTime: '09:00', endTime: '14:00', intervalMinutes: 30, hasLunchBreak: false, lunchStartTime: '12:00', lunchEndTime: '13:00' },
  sunday: { enabled: false, startTime: '09:00', endTime: '14:00', intervalMinutes: 30, hasLunchBreak: false, lunchStartTime: '12:00', lunchEndTime: '13:00' },
});

const getCurrentMonthYear = () => new Date().toISOString().slice(0, 7);

const weeklyRulesToSchedule = (rules: Record<WeekDay, WeeklyRule>): WorkSchedule => ({
  monday: rules.monday,
  tuesday: rules.tuesday,
  wednesday: rules.wednesday,
  thursday: rules.thursday,
  friday: rules.friday,
  saturday: rules.saturday,
  sunday: rules.sunday,
});

const formatPriceFromDatabase = (price: number | string | null) => {
  if (price === null || price === undefined || price === '') return '';
  if (typeof price === 'number') {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return price.startsWith('R$') ? price : price;
};

const parseDurationToNumber = (duration: number | string | null) => {
  const value = Number(String(duration || 30).replace(/\D/g, ''));
  return Number.isFinite(value) && value > 0 ? value : 30;
};

const mapStatus = (status?: string | null): 'active' | 'inactive' => {
  const normalized = String(status || 'active').toLowerCase();
  return normalized === 'inactive' || normalized === 'inativo' ? 'inactive' : 'active';
};

const mapDatabaseProfessional = (
  professional: DatabaseProfessional,
  services: DatabaseService[],
  weeklySchedules: DatabaseWeeklySchedule[],
  blocks: DatabaseScheduleBlock[],
  index: number,
): Professional => {
  const weeklyRules = createDefaultWeeklyRules();

  weeklySchedules
    .filter((rule) => rule.professional_id === professional.id)
    .forEach((rule) => {
      if (!rule.week_day || !weeklyRules[rule.week_day]) return;

      weeklyRules[rule.week_day] = {
        ...weeklyRules[rule.week_day],
        enabled: Boolean(rule.enabled),
        startTime: rule.start_time?.slice(0, 5) || weeklyRules[rule.week_day].startTime,
        endTime: rule.end_time?.slice(0, 5) || weeklyRules[rule.week_day].endTime,
        intervalMinutes: (rule.interval_minutes === 60 ? 60 : 30) as 30 | 60,
        hasLunchBreak: Boolean(rule.lunch_start && rule.lunch_end),
        lunchStartTime: rule.lunch_start?.slice(0, 5) || '12:00',
        lunchEndTime: rule.lunch_end?.slice(0, 5) || '13:00',
      };
    });

  const scheduleBlocks: ScheduleBlock[] = blocks
    .filter((block) => block.professional_id === professional.id)
    .map((block) => ({
      id: block.id,
      date: block.block_date,
      type: block.start_time && block.end_time ? 'time-range' : 'full-day',
      startTime: block.start_time?.slice(0, 5) || '',
      endTime: block.end_time?.slice(0, 5) || '',
      reason: block.reason || '',
    }));

  return {
    id: professional.id,
    name: professional.name,
    specialty: professional.specialty || '',
    status: mapStatus(professional.status),
    image: professional.image || fallbackImages[index % fallbackImages.length] || DEFAULT_PROFESSIONAL_IMAGE,
    services: services
      .filter((service) => service.professional_id === professional.id)
      .map((service) => ({
        id: service.id,
        name: service.name,
        duration: `${parseDurationToNumber(service.duration)} min`,
        price: formatPriceFromDatabase(service.price),
      })),
    schedule: weeklyRulesToSchedule(weeklyRules),
    monthlySchedules: [
      {
        monthYear: getCurrentMonthYear(),
        weeklyRules,
        blocks: scheduleBlocks,
        released: true,
      },
    ],
  };
};

const loadProfessionalsFromDatabase = async (): Promise<Professional[]> => {
  const [
    professionalsResponse,
    servicesResponse,
    weeklyResponse,
    blocksResponse,
  ] = await Promise.all([
    localDataClient.from('professionals').select('id,name,specialty,status,image').eq('status', 'active').order('created_at', { ascending: true }),
    localDataClient.from('services').select('id,professional_id,name,duration,price').order('created_at', { ascending: true }),
    localDataClient.from('weekly_schedule').select('professional_id,week_day,enabled,start_time,end_time,lunch_start,lunch_end,interval_minutes'),
    localDataClient.from('schedule_blocks').select('id,professional_id,block_date,start_time,end_time,reason'),
  ]);

  if (professionalsResponse.error) throw professionalsResponse.error;

  const professionals = (professionalsResponse.data || []) as DatabaseProfessional[];
  const services = (servicesResponse.data || []) as DatabaseService[];
  const weeklySchedules = (weeklyResponse.data || []) as DatabaseWeeklySchedule[];
  const blocks = (blocksResponse.data || []) as DatabaseScheduleBlock[];

  return professionals.map((professional, index) =>
    mapDatabaseProfessional(professional, services, weeklySchedules, blocks, index),
  );
};

const createDemoWeeklyRules = (): Record<WeekDay, WeeklyRule> => {
  const rules = createDefaultWeeklyRules();
  const workDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  workDays.forEach((day) => {
    rules[day] = {
      ...rules[day],
      enabled: true,
      startTime: '09:00',
      endTime: '18:00',
      hasLunchBreak: true,
      lunchStartTime: '12:00',
      lunchEndTime: '13:00',
    };
  });

  rules.saturday = {
    ...rules.saturday,
    enabled: true,
    startTime: '09:00',
    endTime: '13:00',
  };

  return rules;
};

const buildDemoProfessionals = (segmentId: string): Professional[] => {
  const weeklyRules = createDemoWeeklyRules();

  return getBusinessSegment(segmentId).demoProfessionals.map((professional) => ({
    id: professional.id,
    name: professional.name,
    specialty: professional.specialty,
    status: 'active',
    image: DEFAULT_PROFESSIONAL_IMAGE,
    services: professional.services.map((service) => ({
      id: service.id,
      name: service.name,
      duration: service.duration,
      price: service.price,
    })),
    schedule: weeklyRulesToSchedule(weeklyRules),
    monthlySchedules: [
      {
        monthYear: getCurrentMonthYear(),
        weeklyRules,
        blocks: [],
        released: true,
      },
    ],
  }));
};

const resolveHomeConfig = (config: SiteConfig, preferences: TemplatePreferences): SiteConfig => {
  if (config.segmentId === preferences.segmentId) {
    return normalizeSiteConfig({
      ...config,
      segmentId: preferences.segmentId,
      themeId: preferences.paletteId,
    });
  }

  return createSiteConfigForSegment(preferences.segmentId, preferences.paletteId);
};

const Home = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [templatePreferences, setTemplatePreferences] = useState<TemplatePreferences>(() => loadTemplatePreferences());
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingProfessionalId, setBookingProfessionalId] = useState<string | number | null>(null);
  const [bookingToast, setBookingToast] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const scrollTarget = (location.state as { scrollTo?: string } | null)?.scrollTo;

  useEffect(() => {
    const loadData = async () => {
      try {
        const preferences = loadTemplatePreferences();
        const [databaseProfessionals, databaseSiteConfig] = await Promise.all([
          loadProfessionalsFromDatabase(),
          loadSiteConfigFromDatabase(),
        ]);

        setTemplatePreferences(preferences);
        setProfessionals(databaseProfessionals);
        setSiteConfig(resolveHomeConfig(databaseSiteConfig, preferences));
      } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
        setProfessionals([]);
        setSiteConfig(resolveHomeConfig(defaultSiteConfig, loadTemplatePreferences()));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handlePreferencesChange = (event: Event) => {
      const preferences = (event as CustomEvent<TemplatePreferences>).detail;
      if (!preferences) return;

      setTemplatePreferences(preferences);
      setSiteConfig((current) => resolveHomeConfig(current, preferences));
    };

    window.addEventListener(TEMPLATE_PREFERENCES_EVENT, handlePreferencesChange);
    return () => window.removeEventListener(TEMPLATE_PREFERENCES_EVENT, handlePreferencesChange);
  }, []);

  useEffect(() => {
    document.title = `${siteConfig.siteName} - ${siteConfig.header.browserTitleSuffix}`;
  }, [siteConfig.header.browserTitleSuffix, siteConfig.siteName]);

  const handleNavigate = useCallback((sectionId: string) => {
    if (sectionId === 'booking') {
      setBookingProfessionalId(null);
      setBookingOpen(true);
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!scrollTarget) return;

    const timeout = window.setTimeout(() => {
      handleNavigate(scrollTarget);
      navigate('/', { replace: true, state: null });
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [handleNavigate, navigate, scrollTarget]);

  const handleViewSchedule = (professionalId: string | number) => {
    setBookingProfessionalId(professionalId);
    setBookingOpen(true);
  };

  const closeBooking = () => {
    setBookingOpen(false);
    setBookingProfessionalId(null);
  };

  const handleBookingSuccess = () => {
    setBookingToast('Agendamento confirmado com sucesso!');
  };

  useEffect(() => {
    if (!bookingToast) return;
    const timeout = window.setTimeout(() => setBookingToast(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [bookingToast]);

  const selectedSegment = getBusinessSegment(templatePreferences.segmentId);
  const displayedProfessionals =
    professionals.length > 0 ? professionals : buildDemoProfessionals(templatePreferences.segmentId);
  const showcasedServices =
    siteConfig.services.length > 0
      ? siteConfig.services
      : createSiteConfigForSegment(templatePreferences.segmentId, templatePreferences.paletteId).services;
  const layoutVariant = selectedSegment.layoutVariant;
  const displayedNiches = siteConfig.niches.length ? siteConfig.niches : selectedSegment.niches;
  const heroContainerClass =
    layoutVariant === 'beauty'
      ? 'mx-auto max-w-md text-center md:max-w-3xl'
      : 'mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.12fr_0.88fr] md:items-center md:text-left';
  const heroTextClass = layoutVariant === 'beauty' ? '' : 'md:max-w-2xl';
  const sectionSpacingClass = layoutVariant === 'health' ? 'py-12 sm:py-20 md:py-24' : 'py-10 sm:py-16 md:py-20';
  const cardRadiusClass = layoutVariant === 'services' ? 'rounded-2xl' : 'rounded-3xl';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <Navbar content={siteConfig} onNavigate={handleNavigate} />

      {bookingToast && (
        <div className="fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-[280px] -translate-x-1/2 sm:left-auto sm:right-4 sm:max-w-sm sm:translate-x-0">
          <div className="overflow-hidden rounded-3xl border border-gold-400/50 bg-dark-700 shadow-2xl shadow-gold-400/20 ring-1 ring-black/5">
            <div className="h-1 bg-gold-400" />

            <div className="flex items-start gap-3 p-3 sm:p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gold-400 text-dark-900 shadow-md shadow-gold-400/40">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight text-gold-300">
                  {siteConfig.messages.bookingToastTitle}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  {siteConfig.messages.bookingToastDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBookingToast('')}
                aria-label={siteConfig.messages.closeNoticeAria}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-gray-500 transition hover:bg-gold-400/10 hover:text-gold-400"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <section id="home" className="relative scroll-mt-20 px-4 pb-10 pt-20 sm:pb-16 sm:pt-28 md:pb-24 md:pt-32">
        <div className={heroContainerClass}>
          <div className={heroTextClass}>
            <span className="mb-4 inline-block rounded-full bg-gold-400/10 px-4 py-1.5 text-xs font-semibold text-[var(--color-primary)] sm:mb-6 sm:px-4 sm:py-1.5 sm:text-sm">
                {siteConfig.home.heroBadge}
              </span>

            <h1 className="mb-4 font-serif text-[30px] font-bold leading-[1.12] text-[var(--color-text-primary)] sm:text-4xl md:mb-6 md:text-6xl">
              {siteConfig.home.heroTitleStart}{' '}
              <span className="text-[var(--color-primary)]">{siteConfig.home.heroTitleHighlight}</span>{' '}
              {siteConfig.home.heroTitleEnd}
            </h1>

            <p className={`mb-6 max-w-sm text-[15px] leading-relaxed text-[var(--color-text-secondary)] sm:text-lg md:mb-8 md:max-w-2xl md:text-xl ${layoutVariant === 'beauty' ? 'mx-auto' : ''}`}>
              {siteConfig.home.heroSubtitle}
            </p>

            <div className={`flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:gap-4 ${layoutVariant === 'beauty' ? 'mx-auto sm:justify-center' : ''}`}>
              <Button onClick={() => setBookingOpen(true)} className="w-full sm:w-auto">
                {siteConfig.buttons.scheduleNow}
              </Button>
              <Button variant="outline" onClick={() => handleNavigate('professionals')} className="w-full sm:w-auto">
                {siteConfig.buttons.viewProfessionals}
              </Button>
              <Link
                to="/meus-agendamentos"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-base font-medium text-[var(--color-primary)] transition-all duration-300 hover:bg-gold-400/10 sm:w-auto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {siteConfig.buttons.myAppointments}
              </Link>
            </div>
          </div>

          {layoutVariant !== 'beauty' && (
            <div className={`${cardRadiusClass} border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card sm:p-6`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {selectedSegment.label}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-[var(--color-text-primary)]">
                {selectedSegment.heroTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {selectedSegment.heroSubtitle}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {displayedNiches.slice(0, 5).map((niche) => (
                  <span
                    key={niche}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]"
                  >
                    {niche}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="professionals" className={`scroll-mt-20 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 ${sectionSpacingClass}`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center sm:mb-16">
            <span className="mb-4 inline-block rounded-full bg-gold-400/10 px-4 py-1.5 text-xs font-semibold text-[var(--color-primary)] sm:mb-6 sm:px-4 sm:py-1.5 sm:text-sm">
              {siteConfig.home.professionalsBadge}
            </span>
            <h2 className="mb-4 font-serif text-2xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-3xl md:mb-6 md:text-4xl">
              {siteConfig.home.professionalsTitle}
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)] sm:max-w-xl sm:text-base">
              {siteConfig.home.professionalsSubtitle}
            </p>
          </div>

          {displayedProfessionals.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3 md:gap-8">
              {displayedProfessionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional as any}
                  actionLabel={siteConfig.buttons.viewSchedule}
                  fallbackName={siteConfig.messages.professionalFallbackName}
                  fallbackSpecialty={siteConfig.messages.professionalFallbackSpecialty}
                  onViewSchedule={handleViewSchedule as any}
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6 text-center shadow-card sm:p-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400/10 text-[var(--color-primary)]">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-6a4 4 0 11-8 0 4 4 0 018 0zm8 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
                {siteConfig.messages.emptyProfessionalsTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {siteConfig.messages.emptyProfessionalsDescription}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="services" className={`scroll-mt-20 bg-[var(--color-surface-alt)] px-4 ${sectionSpacingClass}`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center sm:mb-16">
            <span className="mb-4 inline-block rounded-full bg-gold-400/10 px-4 py-1.5 text-xs font-semibold text-[var(--color-primary)] sm:mb-6 sm:px-4 sm:py-1.5 sm:text-sm">
              {siteConfig.servicesBadge}
            </span>
            <h2 className="mb-4 font-serif text-2xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-3xl md:mb-6 md:text-4xl">
              {siteConfig.servicesTitle}
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)] sm:max-w-xl sm:text-base">
              {siteConfig.servicesSubtitle}
            </p>
          </div>

          {showcasedServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {showcasedServices.map((service) => (
                <div
                  key={service.id}
                  className={`group ${cardRadiusClass} border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)] sm:p-7`}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/10 text-[var(--color-primary)] transition-colors">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="mb-2 font-serif text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">
                    {service.name || 'Serviço demonstrativo'}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {service.description || 'Descrição demonstrativa do serviço.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-card sm:p-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400/10 text-[var(--color-primary)]">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
                {siteConfig.messages.emptyServicesTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {siteConfig.messages.emptyServicesDescription}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="booking" className="relative scroll-mt-20 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 font-serif text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl md:mb-6 md:text-4xl">
            {siteConfig.home.ctaTitle}
          </h2>
          <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)] sm:max-w-xl sm:text-lg md:mb-10">
            {siteConfig.home.ctaSubtitle}
          </p>
          <Button
            onClick={() => setBookingOpen(true)}
          >
            {siteConfig.buttons.scheduleTime}
          </Button>
        </div>
      </section>

      <Footer content={siteConfig} />
      <BookingModal
        isOpen={bookingOpen}
        content={siteConfig}
        professionals={displayedProfessionals}
        initialProfessionalId={bookingProfessionalId}
        onClose={closeBooking}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default Home;
