import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { localDataClient } from "../services/localDatabase";
import { Link, useLocation } from "react-router-dom";
import { defaultSiteConfig, normalizeSiteConfig, SiteConfig, SiteService } from "../content/siteContent";
import { DEFAULT_PROFESSIONAL_IMAGE, DEFAULT_WHATSAPP_TEMPLATE } from "../config/appConfig";
import { loadSiteConfigFromDatabase, saveSiteConfigToDatabase } from "../services/siteConfig";
import { loadTemplatePreferences, saveTemplatePreferences } from "../services/templatePreferences";
import TemplateEditorSection from "../components/admin/TemplateEditorSection";
import {
  MonthlySchedule,
  ScheduleBlock,
  WeeklyRule,
  WeekDay,
} from "../components/schedule/types";
import {
  ThemeColors,
  applyThemeColors,
  getDefaultThemeColors,
  normalizeThemeColors,
} from "../utils/themeColors";

// ============================================
// CONSTANTES
// ============================================

const PROFESSIONAL_PHOTOS_BUCKET = "professional-photos";
const getCurrentMonthYear = () => new Date().toISOString().slice(0, 7);

const createDefaultWeeklyRules = (): Record<WeekDay, WeeklyRule> => ({
  monday: {
    enabled: false,
    startTime: "08:00",
    endTime: "18:00",
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
  },
  tuesday: {
    enabled: false,
    startTime: "08:00",
    endTime: "18:00",
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
  },
  wednesday: {
    enabled: false,
    startTime: "08:00",
    endTime: "18:00",
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
  },
  thursday: {
    enabled: false,
    startTime: "08:00",
    endTime: "18:00",
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
  },
  friday: {
    enabled: false,
    startTime: "08:00",
    endTime: "18:00",
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
  },
  saturday: {
    enabled: false,
    startTime: "09:00",
    endTime: "14:00",
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
  },
  sunday: {
    enabled: false,
    startTime: "09:00",
    endTime: "14:00",
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
  },
});

const createMonthlySchedule = (monthYear: string): MonthlySchedule => ({
  monthYear,
  weeklyRules: createDefaultWeeklyRules(),
  blocks: [],
  released: false,
});

// ============================================
// TIPOS
// ============================================

interface Service {
  id: string | number;
  name: string;
  duration: string;
  price: string;
  status?: 'active' | 'inactive';
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
  status: "active" | "inactive";
  image: string;
  whatsappMessage?: string;
  allowSimultaneousAppointments?: boolean;
  services: Service[];
  schedule?: WorkSchedule;
  monthlySchedules?: MonthlySchedule[];
  vacation?: VacationPeriod;
}

interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  professionalId: string | number;
  professionalName: string;
  serviceId: string | number;
  serviceName: string;
  date: string;
  time: string;
  duration?: string;
  createdAt?: string;
}

interface BlockedClient {
  id: string;
  professionalId: string | number;
  professionalName: string;
  phone: string;
  reason: string;
  createdAt?: string;
}

// ============================================
// DADOS INICIAIS
// ============================================

const initialData: Professional[] = [];

// ============================================
// LOCAL DATA HELPERS
// ============================================

type DatabaseProfessional = {
  id: string;
  name: string | null;
  specialty: string | null;
  photo_url: string | null;
  image: string | null;
  active: boolean | null;
  status: string | null;
  whatsapp_message: string | null;
  allow_simultaneous_appointments?: boolean | null;
};

type DatabaseService = {
  id: string;
  professional_id: string;
  name: string | null;
  duration: number | string | null;
  price: number | string | null;
  active?: boolean | null;
  status?: string | null;
};

type DatabaseAppointment = {
  id: string;
  professional_id: string;
  service_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  phone?: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status?: string | null;
  created_at?: string | null;
};

type DatabaseBlockedClient = {
  id: string;
  professional_id: string;
  phone: string | null;
  reason: string | null;
  created_at?: string | null;
};

type DatabaseWeeklySchedule = {
  professional_id: string;
  weekday: string | number;
  enabled: boolean | null;
  start_time: string | null;
  end_time: string | null;
  interval_minutes: number | null;
  has_lunch_break: boolean | null;
  lunch_start: string | null;
  lunch_end: string | null;
};

type DatabaseScheduleBlock = {
  id: string;
  professional_id: string;
  block_date: string | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

const hasLocalDataStore = true;

const isValidUuid = (value: string | number) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const uploadProfessionalImage = async (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `professionals/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await localDataClient.storage
    .from(PROFESSIONAL_PHOTOS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (error) throw error;

  const { data } = localDataClient.storage
    .from(PROFESSIONAL_PHOTOS_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

const toStatusForApp = (
  status?: string | null,
  active?: boolean | null,
): "active" | "inactive" => {
  if (active === false) return "inactive";
  const normalized = String(status || "active").toLowerCase();
  return normalized === "inactive" || normalized === "inativo"
    ? "inactive"
    : "active";
};

const toStatusTextForDatabase = (status: "active" | "inactive") => status;

const formatPriceFromDatabase = (price: number | string | null) => {
  if (price === null || price === undefined || price === "") return "";
  if (typeof price === "number") {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
  return String(price).startsWith("R$") ? String(price) : String(price);
};

const normalizePhone = (value: string) => String(value).replace(/\D/g, "");

const parseDurationToNumber = (duration: string) => {
  const value = Number(String(duration).replace(/\D/g, ""));
  return Number.isFinite(value) && value > 0 ? value : 30;
};

const parsePriceToNumber = (price: string) => {
  const normalized = String(price)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
};

const weeklyRulesToLegacySchedule = (
  rules: Record<WeekDay, WeeklyRule>,
): WorkSchedule => ({
  monday: rules.monday,
  tuesday: rules.tuesday,
  wednesday: rules.wednesday,
  thursday: rules.thursday,
  friday: rules.friday,
  saturday: rules.saturday,
  sunday: rules.sunday,
});

const buildMonthlySchedulesFromDatabase = (
  weeklyRules: Record<WeekDay, WeeklyRule>,
  blocks: ScheduleBlock[] = [],
): MonthlySchedule[] => [
  {
    monthYear: getCurrentMonthYear(),
    weeklyRules,
    blocks,
    released: true,
  },
];


const loadWeeklyRulesFromDatabase = async () => {
  const { data, error } = await localDataClient
    .from("weekly_schedule")
    .select(
      "professional_id,weekday,enabled,start_time,end_time,interval_minutes,has_lunch_break,lunch_start,lunch_end",
    );

  if (error) {
    console.warn("Agenda semanal não carregada:", error);
    return new Map<string, Record<WeekDay, WeeklyRule>>();
  }

  const scheduleByProfessional = new Map<string, Record<WeekDay, WeeklyRule>>();

  ((data || []) as DatabaseWeeklySchedule[]).forEach((row) => {
    const day =
      typeof row.weekday === "number"
        ? numberToWeekDay[row.weekday]
        : (row.weekday as WeekDay);

    if (!day || !weekDayOrder.includes(day)) return;

    const current =
      scheduleByProfessional.get(row.professional_id) || createDefaultWeeklyRules();

    scheduleByProfessional.set(row.professional_id, {
      ...current,
      [day]: {
        ...current[day],
        enabled: Boolean(row.enabled),
        startTime: row.start_time?.slice(0, 5) || current[day].startTime,
        endTime: row.end_time?.slice(0, 5) || current[day].endTime,
        intervalMinutes: (row.interval_minutes === 60 ? 60 : 30) as 30 | 60,
        hasLunchBreak: Boolean(row.has_lunch_break),
        lunchStartTime:
          row.lunch_start?.slice(0, 5) || current[day].lunchStartTime,
        lunchEndTime:
          row.lunch_end?.slice(0, 5) || current[day].lunchEndTime,
      },
    });
  });

  return scheduleByProfessional;
};

const loadScheduleBlocksFromDatabase = async () => {
  const { data, error } = await localDataClient
    .from("schedule_blocks")
    .select("id,professional_id,block_date,start_time,end_time,reason");

  if (error) {
    console.warn("Bloqueios de agenda não carregados:", error);
    return new Map<string, ScheduleBlock[]>();
  }

  const blocksByProfessional = new Map<string, ScheduleBlock[]>();

  ((data || []) as DatabaseScheduleBlock[]).forEach((block) => {
    const current = blocksByProfessional.get(block.professional_id) || [];

    current.push({
      id: block.id,
      date: block.block_date || "",
      type: block.start_time && block.end_time ? "time-range" : "full-day",
      startTime: block.start_time?.slice(0, 5) || "",
      endTime: block.end_time?.slice(0, 5) || "",
      reason: block.reason || "",
    });

    blocksByProfessional.set(block.professional_id, current);
  });

  return blocksByProfessional;
};

const saveWeeklyRulesToDatabase = async (
  professionalId: string,
  weeklyRules: Record<WeekDay, WeeklyRule>,
) => {
  await localDataClient
    .from("weekly_schedule")
    .delete()
    .eq("professional_id", professionalId);

  const rows = weekDayOrder.map((weekday) => {
    const rule = weeklyRules[weekday];

    return {
      professional_id: professionalId,
      weekday: weekDayToNumber[weekday],
      day_of_week: weekday,
      day: weekday,
      week_day: weekday,
      start: rule.startTime,
      end: rule.endTime,
      enabled: Boolean(rule.enabled),
      start_time: rule.startTime,
      end_time: rule.endTime,
      interval_minutes: rule.intervalMinutes || 30,
      has_lunch_break: rule.hasLunchBreak === true,
      // IMPORTANTE: quando o almoço não estiver marcado, salve NULL.
      // Assim a tela de agendamento não deve bloquear 12:00/13:00 apenas
      // porque existem horários padrão de almoço cadastrados.
      lunch_start: rule.hasLunchBreak === true ? rule.lunchStartTime || "12:00" : null,
      lunch_end: rule.hasLunchBreak === true ? rule.lunchEndTime || "13:00" : null,
    };
  });

  const { error } = await localDataClient.from("weekly_schedule").insert(rows);
  if (error) throw error;
};

const saveScheduleBlocksToDatabase = async (
  professionalId: string,
  monthlySchedules: MonthlySchedule[],
) => {
  await localDataClient
    .from("schedule_blocks")
    .delete()
    .eq("professional_id", professionalId);

  const blocks = monthlySchedules.flatMap((schedule) => schedule.blocks ?? []);
  if (!blocks.length) return;

  const rows = blocks.map((block) => ({
    professional_id: professionalId,
    block_date: block.date,
    start_time: block.type === "time-range" ? block.startTime || null : null,
    end_time: block.type === "time-range" ? block.endTime || null : null,
    reason: block.reason || null,
  }));

  const { error } = await localDataClient.from("schedule_blocks").insert(rows);
  if (error) throw error;
};

const mapDatabaseProfessional = (
  professional: DatabaseProfessional,
  services: DatabaseService[],
  weeklyRulesByProfessional: Map<string, Record<WeekDay, WeeklyRule>>,
  blocksByProfessional: Map<string, ScheduleBlock[]>,
): Professional => {
  const weeklyRules =
    weeklyRulesByProfessional.get(professional.id) || createDefaultWeeklyRules();
  const blocks = blocksByProfessional.get(professional.id) || [];

  return {
    id: professional.id,
    name: professional.name || "",
    specialty: professional.specialty || "",
    status: toStatusForApp(professional.status, professional.active),
    image:
      professional.photo_url ||
      professional.image ||
      DEFAULT_PROFESSIONAL_IMAGE,
    whatsappMessage: professional.whatsapp_message || "",
    allowSimultaneousAppointments:
      professional.allow_simultaneous_appointments === true,
    services: services
      .filter((service) => service.professional_id === professional.id)
      .map((service) => ({
        id: service.id,
        name: service.name || "",
        duration: `${parseDurationToNumber(String(service.duration || 30))} min`,
        price: formatPriceFromDatabase(service.price),
        status: toStatusForApp(service.status, service.active),
      })),
    schedule: weeklyRulesToLegacySchedule(weeklyRules),
    monthlySchedules: buildMonthlySchedulesFromDatabase(weeklyRules, blocks),
  };
};

const loadAdminStateFromDatabase = async () => {
  return { siteConfig: await loadSiteConfigFromDatabase() };
};

const saveAdminStateToDatabase = async (siteConfig: SiteConfig) => {
  await saveSiteConfigToDatabase(siteConfig);
};

const loadProfessionalsFromDatabase = async (): Promise<Professional[]> => {
  const [
    professionalsResponse,
    servicesResponse,
    weeklyRulesByProfessional,
    blocksByProfessional,
  ] = await Promise.all([
    localDataClient
      .from("professionals")
      .select(
        "id,name,specialty,status,active,image,photo_url,whatsapp_message,allow_simultaneous_appointments",
      )
      .order("created_at", { ascending: true }),
    localDataClient
      .from("services")
      .select("id,professional_id,name,duration,price")
      .order("name", { ascending: true }),
    loadWeeklyRulesFromDatabase(),
    loadScheduleBlocksFromDatabase(),
  ]);

  if (professionalsResponse.error) throw professionalsResponse.error;
  if (servicesResponse.error) throw servicesResponse.error;

  const professionals = (professionalsResponse.data || []) as DatabaseProfessional[];
  const services = (servicesResponse.data || []) as DatabaseService[];

  return professionals.map((professional) =>
    mapDatabaseProfessional(
      professional,
      services,
      weeklyRulesByProfessional,
      blocksByProfessional,
    ),
  );
};

const loadAppointmentsFromDatabase = async (): Promise<Appointment[]> => {
  const [appointmentsResponse, professionalsResponse, servicesResponse] =
    await Promise.all([
      localDataClient
        .from("appointments")
        .select(
          "id,professional_id,service_id,client_name,phone,client_phone,appointment_date,appointment_time,status,created_at",
        )
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true }),
      localDataClient.from("professionals").select("id,name"),
      localDataClient.from("services").select("id,name,duration"),
    ]);

  if (appointmentsResponse.error) throw appointmentsResponse.error;
  if (professionalsResponse.error) throw professionalsResponse.error;
  if (servicesResponse.error) throw servicesResponse.error;

  const professionalNameById = new Map(
    ((professionalsResponse.data || []) as Array<{ id: string; name: string | null }>).map(
      (professional) => [String(professional.id), professional.name || ""],
    ),
  );

  const serviceById = new Map(
    ((servicesResponse.data || []) as Array<{
      id: string;
      name: string | null;
      duration: number | string | null;
    }>).map((service) => [
      String(service.id),
      {
        name: service.name || "",
        duration: service.duration ? `${service.duration} min` : "",
      },
    ]),
  );

  return ((appointmentsResponse.data || []) as DatabaseAppointment[])
    .filter((appointment) => {
      const status = String(appointment.status || '').toLowerCase();
      return status !== 'cancelado' && status !== 'canceled';
    })
    .map((appointment) => {
      const service = appointment.service_id
        ? serviceById.get(String(appointment.service_id))
        : null;

      return {
        id: appointment.id,
        clientName: appointment.client_name || "",
        phone: appointment.phone || appointment.client_phone || "",
        professionalId: appointment.professional_id,
        professionalName:
          professionalNameById.get(String(appointment.professional_id)) || "",
        serviceId: appointment.service_id || "",
        serviceName: service?.name || "",
        date: appointment.appointment_date || "",
        time: appointment.appointment_time?.slice(0, 5) || "",
        duration: service?.duration || "",
        createdAt: appointment.created_at || "",
      };
    });
};

const mapDatabaseBlockedClient = (
  client: DatabaseBlockedClient,
  professionalNameById: Map<string, string>,
): BlockedClient => ({
  id: client.id,
  professionalId: client.professional_id,
  professionalName: professionalNameById.get(String(client.professional_id)) || "",
  phone: client.phone || "",
  reason: client.reason || "",
  createdAt: client.created_at || "",
});

const loadBlockedClientsFromDatabase = async (): Promise<BlockedClient[]> => {
  const [blockedResponse, professionalsResponse] = await Promise.all([
    localDataClient
      .from("blocked_clients")
      .select("id,professional_id,phone,reason,created_at")
      .order("created_at", { ascending: false }),
    localDataClient.from("professionals").select("id,name"),
  ]);

  if (blockedResponse.error) throw blockedResponse.error;
  if (professionalsResponse.error) throw professionalsResponse.error;

  const professionalNameById = new Map(
    ((professionalsResponse.data || []) as Array<{ id: string; name: string | null }>).map(
      (professional) => [String(professional.id), professional.name || ""],
    ),
  );

  return ((blockedResponse.data || []) as DatabaseBlockedClient[]).map((client) =>
    mapDatabaseBlockedClient(client, professionalNameById),
  );
};

const saveProfessionalToDatabase = async (
  data: {
    name: string;
    specialty: string;
    status: "active" | "inactive";
    image: string;
    whatsappMessage?: string;
    allowSimultaneousAppointments?: boolean;
    imageFile?: File | null;
    monthlySchedules: MonthlySchedule[];
    vacation?: VacationPeriod;
  },
  editingProfessional: Professional | null,
) => {
  const professionalPayload = {
    name: data.name,
    specialty: data.specialty,
    status: toStatusTextForDatabase(data.status),
    active: data.status === "active",
    image: data.image || "",
    photo_url: data.image || "",
    whatsapp_message: data.whatsappMessage || "",
    allow_simultaneous_appointments:
      data.allowSimultaneousAppointments === true,
  };

  const { data: savedProfessional, error } = editingProfessional
    ? await localDataClient
        .from("professionals")
        .update(professionalPayload)
        .eq("id", editingProfessional.id)
        .select("id")
        .single()
    : await localDataClient
        .from("professionals")
        .insert(professionalPayload)
        .select("id")
        .single();

  if (error) throw error;

  const professionalId = String(savedProfessional.id);
  const weeklyRules =
    data.monthlySchedules[0]?.weeklyRules || createDefaultWeeklyRules();

  await saveWeeklyRulesToDatabase(professionalId, weeklyRules);
  await saveScheduleBlocksToDatabase(professionalId, data.monthlySchedules);

  return professionalId;
};

const deleteProfessionalFromDatabase = async (
  professionalId: string | number,
) => {
  if (!isValidUuid(professionalId)) return;

  const id = String(professionalId);

  const deletions = [
    localDataClient.from("appointments").delete().eq("professional_id", id),
    localDataClient.from("services").delete().eq("professional_id", id),
    localDataClient.from("blocked_clients").delete().eq("professional_id", id),
    localDataClient.from("weekly_schedule").delete().eq("professional_id", id),
    localDataClient.from("schedule_blocks").delete().eq("professional_id", id),
  ];

  const results = await Promise.all(deletions);
  const dependencyError = results.find((result) => result.error)?.error;
  if (dependencyError) throw dependencyError;

  const { error } = await localDataClient.from("professionals").delete().eq("id", id);
  if (error) throw error;
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

// Função para formatar resumo da agenda
const formatScheduleSummary = (schedule?: WorkSchedule): string => {
  if (!schedule) return "Não configurado";

  const days = [
    { key: "monday", label: "Seg" },
    { key: "tuesday", label: "Ter" },
    { key: "wednesday", label: "Qua" },
    { key: "thursday", label: "Qui" },
    { key: "friday", label: "Sex" },
    { key: "saturday", label: "Sáb" },
    { key: "sunday", label: "Dom" },
  ];

  const enabledDays = days.filter(
    (d) => schedule[d.key as keyof WorkSchedule]?.enabled,
  );

  if (enabledDays.length === 0) return "Não configurado";

  // Agrupar dias com mesmo horário
  const dayGroups: { days: string[]; start: string; end: string }[] = [];

  enabledDays.forEach(({ key, label }) => {
    const day = schedule[key as keyof WorkSchedule];
    const existing = dayGroups.find(
      (g) => g.start === day.startTime && g.end === day.endTime,
    );
    if (existing) {
      existing.days.push(label);
    } else {
      dayGroups.push({ days: [label], start: day.startTime, end: day.endTime });
    }
  });

  return dayGroups
    .map((g) => `${g.days.join(" a ")}: ${g.start} às ${g.end}`)
    .join(" | ");
};

const formatMonthlyScheduleSummary = (
  monthlySchedules?: MonthlySchedule[],
): string => {
  if (!monthlySchedules || monthlySchedules.length === 0) return "";
  const selected = monthlySchedules[0];
  const enabledDays = Object.entries(selected.weeklyRules).filter(
    ([, rule]) => rule.enabled,
  );
  if (enabledDays.length === 0) {
    return "Agenda semanal não configurada";
  }
  const groups: { days: string[]; start: string; end: string }[] = [];
  enabledDays.forEach(([dayKey, rule]) => {
    const labelMap: Record<string, string> = {
      monday: "Seg",
      tuesday: "Ter",
      wednesday: "Qua",
      thursday: "Qui",
      friday: "Sex",
      saturday: "Sáb",
      sunday: "Dom",
    };
    const label = labelMap[dayKey];
    const existing = groups.find(
      (g) => g.start === rule.startTime && g.end === rule.endTime,
    );
    if (existing) existing.days.push(label);
    else
      groups.push({ days: [label], start: rule.startTime, end: rule.endTime });
  });
  const summary = groups
    .map((g) => `${g.days.join(" a ")}: ${g.start} às ${g.end}`)
    .join(" | ");
  return `Agenda semanal: ${summary}`;
};

const getInitialWeeklyRules = (
  professional: Professional | null,
): Record<WeekDay, WeeklyRule> => {
  const defaults = createDefaultWeeklyRules();

  if (professional?.monthlySchedules?.[0]?.weeklyRules) {
    const rules = professional.monthlySchedules[0].weeklyRules;
    return {
      monday: { ...defaults.monday, ...rules.monday },
      tuesday: { ...defaults.tuesday, ...rules.tuesday },
      wednesday: { ...defaults.wednesday, ...rules.wednesday },
      thursday: { ...defaults.thursday, ...rules.thursday },
      friday: { ...defaults.friday, ...rules.friday },
      saturday: { ...defaults.saturday, ...rules.saturday },
      sunday: { ...defaults.sunday, ...rules.sunday },
    };
  }

  if (professional?.schedule) {
    return {
      monday: { ...defaults.monday, ...professional.schedule.monday },
      tuesday: { ...defaults.tuesday, ...professional.schedule.tuesday },
      wednesday: { ...defaults.wednesday, ...professional.schedule.wednesday },
      thursday: { ...defaults.thursday, ...professional.schedule.thursday },
      friday: { ...defaults.friday, ...professional.schedule.friday },
      saturday: { ...defaults.saturday, ...professional.schedule.saturday },
      sunday: { ...defaults.sunday, ...professional.schedule.sunday },
    };
  }

  return defaults;
};

const buildAutomaticSchedules = (
  weeklyRules: Record<WeekDay, WeeklyRule>,
  currentSchedules: MonthlySchedule[],
): MonthlySchedule[] => {
  const allBlocks = currentSchedules.flatMap(
    (schedule) => schedule.blocks ?? [],
  );

  return [
    {
      monthYear: getCurrentMonthYear(),
      weeklyRules,
      blocks: allBlocks,
      released: true,
    },
  ];
};

const weeklyDayLabels: Record<WeekDay, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

const dayLabels: Record<WeekDay, string> = {
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
  sunday: "Dom",
};

const weekDayOrder: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const weekDayToNumber: Record<WeekDay, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const numberToWeekDay: Record<number, WeekDay> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const WeeklyScheduleEditor = ({
  weeklyRules,
  onChange,
}: {
  weeklyRules: Record<WeekDay, WeeklyRule>;
  onChange: (rules: Record<WeekDay, WeeklyRule>) => void;
}) => {
  const firstEnabledDay =
    weekDayOrder.find((day) => weeklyRules[day]?.enabled) || "monday";
  const [openDay, setOpenDay] = useState<WeekDay>(firstEnabledDay);

  const updateDay = (day: WeekDay, update: Partial<WeeklyRule>) => {
    onChange({
      ...weeklyRules,
      [day]: {
        ...weeklyRules[day],
        ...update,
      },
    });
  };

  const openedRule = weeklyRules[openDay];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gold-400/20 bg-gold-400/10 px-3 py-2">
        <p className="text-xs font-semibold text-gold-300">
          Liberação automática
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-300">
          A agenda libera de hoje até o mesmo dia do próximo mês.
        </p>
      </div>

      <div className="rounded-xl border border-gold-400/20 bg-dark-700 p-2.5">
        <p className="mb-2 text-xs font-semibold text-gray-100">
          Toque no dia para editar
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          {weekDayOrder.map((day) => {
            const active = openDay === day;
            const enabled = weeklyRules[day]?.enabled;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setOpenDay(day)}
                className={`rounded-full px-2 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-gold-400/100 text-white"
                    : enabled
                      ? "bg-gold-400/10 text-gold-300"
                      : "bg-dark-700 text-gray-300"
                }`}
              >
                {dayLabels[day]}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-2xl border border-gold-400/10 bg-dark-800 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-100">
              {weeklyDayLabels[openDay]}
            </p>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-300">
              <input
                type="checkbox"
                checked={openedRule.enabled}
                onChange={(event) =>
                  updateDay(openDay, { enabled: event.target.checked })
                }
                className="h-4 w-4 rounded border-gold-400/20 text-gold-300 focus:ring-gold-400"
              />
              Trabalha
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-300">
                Início
              </label>
              <input
                type="time"
                value={openedRule.startTime}
                onChange={(event) =>
                  updateDay(openDay, { startTime: event.target.value })
                }
                disabled={!openedRule.enabled}
                className="w-full rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm text-gray-100 outline-none disabled:opacity-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-300">
                Fim
              </label>
              <input
                type="time"
                value={openedRule.endTime}
                onChange={(event) =>
                  updateDay(openDay, { endTime: event.target.value })
                }
                disabled={!openedRule.enabled}
                className="w-full rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm text-gray-100 outline-none disabled:opacity-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-gray-300">
                Intervalo
              </label>
              <select
                value={openedRule.intervalMinutes || 30}
                onChange={(event) =>
                  updateDay(openDay, {
                    intervalMinutes: Number(event.target.value) as 30 | 60,
                  })
                }
                disabled={!openedRule.enabled}
                className="w-full rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm text-gray-100 outline-none disabled:opacity-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
              >
                <option value={30}>30 em 30 min</option>
                <option value={60}>1 em 1 hora</option>
              </select>
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-300">
            <input
              type="checkbox"
              checked={openedRule.hasLunchBreak === true}
              onChange={(event) =>
                updateDay(openDay, {
                  hasLunchBreak: event.target.checked,
                  // Mantém os horários padrão apenas para quando o almoço for ativado.
                  // Desmarcado = não bloqueia nada.
                  lunchStartTime: event.target.checked
                    ? openedRule.lunchStartTime || "12:00"
                    : openedRule.lunchStartTime,
                  lunchEndTime: event.target.checked
                    ? openedRule.lunchEndTime || "13:00"
                    : openedRule.lunchEndTime,
                })
              }
              disabled={!openedRule.enabled}
              className="h-4 w-4 rounded border-gold-400/20 text-gold-300 disabled:opacity-50 focus:ring-gold-400"
            />
            Bloquear almoço
          </label>

          {openedRule.hasLunchBreak && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-300">
                  Início almoço
                </label>
                <input
                  type="time"
                  value={openedRule.lunchStartTime || "12:00"}
                  onChange={(event) =>
                    updateDay(openDay, { lunchStartTime: event.target.value })
                  }
                  disabled={!openedRule.enabled}
                  className="w-full rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm text-gray-100 outline-none disabled:opacity-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-300">
                  Fim almoço
                </label>
                <input
                  type="time"
                  value={openedRule.lunchEndTime || "13:00"}
                  onChange={(event) =>
                    updateDay(openDay, { lunchEndTime: event.target.value })
                  }
                  disabled={!openedRule.enabled}
                  className="w-full rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm text-gray-100 outline-none disabled:opacity-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CompactScheduleBlockForm = ({
  availableDates,
  onAdd,
}: {
  availableDates: { dateKey: string; label: string }[];
  onAdd: (block: ScheduleBlock) => void;
}) => {
  const [date, setDate] = useState(availableDates[0]?.dateKey || "");
  const [type, setType] = useState<"full-day" | "time-range">("full-day");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!date && availableDates[0]?.dateKey) setDate(availableDates[0].dateKey);
  }, [availableDates, date]);

  const handleSubmit = () => {
    if (!date) return;

    onAdd({
      id: `${Date.now()}`,
      date,
      type,
      startTime: type === "time-range" ? startTime : "",
      endTime: type === "time-range" ? endTime : "",
      reason,
    });

    setReason("");
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-300">
            Data
          </label>
          <select
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-9 w-full rounded-xl border border-gold-400/20 bg-dark-700 px-2 text-xs text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
          >
            {availableDates.map((item) => (
              <option key={item.dateKey} value={item.dateKey}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-300">
            Tipo
          </label>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "full-day" | "time-range")
            }
            className="h-9 w-full rounded-xl border border-gold-400/20 bg-dark-700 px-2 text-xs text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
          >
            <option value="full-day">Dia inteiro</option>
            <option value="time-range">Horário</option>
          </select>
        </div>
      </div>

      {type === "time-range" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-300">
              Início
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="h-9 w-full rounded-xl border border-gold-400/20 bg-dark-700 px-2 text-xs outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-300">
              Fim
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="h-9 w-full rounded-xl border border-gold-400/20 bg-dark-700 px-2 text-xs outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-300">
          Motivo
        </label>
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Opcional"
          className="h-9 w-full rounded-xl border border-gold-400/20 bg-dark-700 px-3 text-xs outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!date}
        className="h-9 w-full rounded-xl bg-gold-400/100 text-xs font-semibold text-white hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Adicionar bloqueio
      </button>
    </div>
  );
};

type ProfessionalModalTab = "data" | "schedule" | "blocks";
type ProfessionalPanelTab = "data" | "services" | "schedule" | "blocks";

// Modal para editar/adicionar profissional
const ProfessionalModal = ({
  professional,
  initialTab = "data",
  onSave,
  onClose,
}: {
  professional: Professional | null;
  initialTab?: ProfessionalModalTab;
  onSave: (data: {
    name: string;
    specialty: string;
    status: "active" | "inactive";
    image: string;
    whatsappMessage?: string;
    allowSimultaneousAppointments?: boolean;
    imageFile?: File | null;
    monthlySchedules: MonthlySchedule[];
    vacation?: VacationPeriod;
  }) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(professional?.name || "");
  const [specialty, setSpecialty] = useState(professional?.specialty || "");
  const [status, setStatus] = useState<"active" | "inactive">(
    professional?.status || "active",
  );
  const [image, setImage] = useState(professional?.image || "");
  const [whatsappMessage, setWhatsappMessage] = useState(
    professional?.whatsappMessage || DEFAULT_WHATSAPP_TEMPLATE,
  );
  const [allowSimultaneousAppointments, setAllowSimultaneousAppointments] =
    useState(professional?.allowSimultaneousAppointments === true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [monthlySchedules, setMonthlySchedules] = useState<MonthlySchedule[]>(
    professional?.monthlySchedules || [],
  );
  const [weeklyRules, setWeeklyRules] = useState<Record<WeekDay, WeeklyRule>>(
    getInitialWeeklyRules(professional),
  );
  const [vacation, setVacation] = useState<VacationPeriod>(
    professional?.vacation || {
      enabled: false,
      startDate: "",
      endDate: "",
    },
  );
  const [activeTab, setActiveTab] = useState<ProfessionalModalTab>(initialTab);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      specialty,
      status,
      image,
      whatsappMessage,
      allowSimultaneousAppointments,
      imageFile,
      monthlySchedules: buildAutomaticSchedules(weeklyRules, monthlySchedules),
      vacation,
    });
  };

  const tabs: Array<{
    key: ProfessionalModalTab;
    label: string;
  }> = [
    { key: "data", label: "Dados" },
    { key: "schedule", label: "Horários" },
    { key: "blocks", label: "Bloqueios" },
  ];

  const updateMonthlySchedule = (update: MonthlySchedule) => {
    const updated = monthlySchedules.some(
      (item) => item.monthYear === update.monthYear,
    )
      ? monthlySchedules.map((item) =>
          item.monthYear === update.monthYear ? update : item,
        )
      : [...monthlySchedules, update];
    setMonthlySchedules(updated);
  };

  const handleAddBlock = (block: ScheduleBlock) => {
    const scheduleMonth = getCurrentMonthYear();
    const schedule = monthlySchedules.find(
      (item) => item.monthYear === scheduleMonth,
    );

    if (schedule) {
      updateMonthlySchedule({
        ...schedule,
        blocks: [...schedule.blocks, block],
      });
      return;
    }

    updateMonthlySchedule({
      ...createMonthlySchedule(scheduleMonth),
      blocks: [block],
      released: true,
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    setMonthlySchedules(
      monthlySchedules.map((schedule) => ({
        ...schedule,
        blocks: schedule.blocks.filter((block) => block.id !== blockId),
      })),
    );
  };

  const toLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (date: Date) => {
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const weekdayFromIndex: WeekDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const getRollingAvailableDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limitDate = new Date(today);
    limitDate.setMonth(limitDate.getMonth() + 1);

    const dates: { dateKey: string; label: string }[] = [];
    const current = new Date(today);

    while (current <= limitDate) {
      const dayKey = weekdayFromIndex[current.getDay()];
      const rule = weeklyRules[dayKey];

      if (rule.enabled) {
        dates.push({
          dateKey: toLocalDateKey(current),
          label: `${formatDateLabel(current)} • ${dayLabels[dayKey]}`,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const availableBlockDates = getRollingAvailableDates();
  const availableBlockDateKeys = availableBlockDates.map(
    (item) => item.dateKey,
  );
  const allBlocks = monthlySchedules.flatMap(
    (schedule) => schedule.blocks ?? [],
  );
  const visibleBlocks = allBlocks.filter((block) =>
    availableBlockDateKeys.includes(block.date),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-dark-900/60 p-1.5 sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-0.75rem)] w-full max-w-[340px] flex-col overflow-hidden rounded-2xl border border-gold-400/20 bg-dark-700 shadow-xl sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
        <div className="z-10 border-b bg-dark-700 px-3 py-2 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold leading-tight text-gray-100 sm:text-xl">
                {professional ? "Editar Profissional" : "Nova Profissional"}
              </h3>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-300 sm:text-sm">
                Gerencie dados, serviços e disponibilidade.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-gray-300 hover:bg-dark-700 hover:text-gray-200 sm:text-sm"
            >
              Fechar
            </button>
          </div>

          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10.5px] font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                  activeTab === tab.key
                    ? "bg-gold-400/100 text-white"
                    : "bg-dark-700 text-gray-200 hover:bg-dark-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2.5 sm:px-5 sm:py-5">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
            {activeTab === "data" && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2.5 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                      Especialidade
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                      Mensagem do WhatsApp
                    </label>
                    <textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      rows={5}
                      placeholder="Use {cliente}, {profissional}, {servico}, {data} e {hora}"
                      className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:rounded-lg"
                    />
                    <p className="mt-1 text-[11px] leading-snug text-gray-300">
                      Variáveis disponíveis: {"{cliente}"}, {"{profissional}"}, {"{servico}"}, {"{data}"} e {"{hora}"}.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as "active" | "inactive")
                      }
                      className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:rounded-lg"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-gold-400/20 bg-gold-400/10 p-3">
                    <label className="flex items-start gap-3 text-sm font-medium text-gray-200">
                      <input
                        type="checkbox"
                        checked={allowSimultaneousAppointments}
                        onChange={(event) =>
                          setAllowSimultaneousAppointments(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-gold-400/20 text-gold-300 focus:ring-gold-400"
                      />
                      <span>
                        <span className="block font-semibold text-gray-100">
                          Permitir atendimento simultâneo
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-gray-300">
                          Quando ativado, esta profissional pode receber agendamento no mesmo horário de outra profissional.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                      Foto da profissional
                    </label>

                    <div className="flex items-center gap-3 rounded-xl border border-gold-400/20 bg-dark-800 p-3">
                      <img
                        src={image || DEFAULT_PROFESSIONAL_IMAGE}
                        alt={name || "Foto da profissional"}
                        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setImageFile(file);
                            if (file) setImage(URL.createObjectURL(file));
                          }}
                          className="block w-full text-xs text-gray-300 file:mr-2 file:rounded-full file:border-0 file:bg-gold-400/100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-gold-300"
                        />
                        <p className="mt-1 text-[11px] text-gray-300">
                          JPG, PNG ou WEBP. A imagem será salva localmente neste navegador.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gold-400/20 bg-dark-800 p-3 sm:rounded-2xl sm:p-4">
                    <p className="text-xs font-medium text-gray-200 sm:text-sm">
                      Resumo
                    </p>
                    <p className="mt-1.5 text-xs leading-snug text-gray-300 sm:text-sm">
                      Nome, especialidade, status e imagem são campos principais
                      da profissional.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Serviços" && (
              <div className="rounded-xl border border-gold-400/20 bg-dark-800 p-3">
                <p className="mb-2 text-xs font-semibold text-gray-200">
                  Serviços vinculados
                </p>
                {professional?.services.length ? (
                  <div className="space-y-2">
                    {professional.services.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-xl border border-gold-400/10 bg-dark-700 p-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-100">
                            {service.name}
                          </p>
                          <span className="shrink-0 rounded-full bg-gold-400/10 px-2 py-0.5 text-[11px] font-medium text-gold-300">
                            {service.duration}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-gray-300">
                          {service.price}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300">
                    Nenhum serviço vinculado.
                  </p>
                )}
                <p className="mt-2 text-[11px] text-gray-300">
                  Adicione ou edite serviços no card da profissional.
                </p>
              </div>
            )}

            {activeTab === "schedule" && (
              <WeeklyScheduleEditor
                weeklyRules={weeklyRules}
                onChange={setWeeklyRules}
              />
            )}

            {activeTab === "Férias" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gold-400/20 bg-gold-400/10 p-4">
                  <p className="text-sm font-semibold text-gold-300">
                    Período de férias da profissional
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    Quando marcado, a profissional não ficará disponível para
                    agendamentos dentro do período escolhido. Você pode
                    desmarcar depois caso ela decida trabalhar.
                  </p>
                </div>

                <div className="rounded-2xl border border-gold-400/20 bg-dark-700 p-5">
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-200">
                    <input
                      type="checkbox"
                      checked={vacation.enabled}
                      onChange={(event) =>
                        setVacation((current) => ({
                          ...current,
                          enabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gold-400/20 text-gold-300 focus:ring-gold-400"
                    />
                    Vai tirar férias
                  </label>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Início das férias
                      </label>
                      <input
                        type="date"
                        value={vacation.startDate}
                        onChange={(event) =>
                          setVacation((current) => ({
                            ...current,
                            startDate: event.target.value,
                          }))
                        }
                        disabled={!vacation.enabled}
                        className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Fim das férias
                      </label>
                      <input
                        type="date"
                        value={vacation.endDate}
                        onChange={(event) =>
                          setVacation((current) => ({
                            ...current,
                            endDate: event.target.value,
                          }))
                        }
                        disabled={!vacation.enabled}
                        className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {vacation.enabled &&
                    vacation.startDate &&
                    vacation.endDate && (
                      <div className="mt-5 rounded-2xl border border-green-300/40 bg-green-950/30 p-4 text-sm text-green-300">
                        Férias configuradas de {vacation.startDate} até{" "}
                        {vacation.endDate}.
                      </div>
                    )}

                  {vacation.enabled &&
                    (!vacation.startDate || !vacation.endDate) && (
                      <div className="mt-5 rounded-2xl border border-gold-400/20 bg-yellow-950/20 p-4 text-sm text-gold-300">
                        Informe a data de início e fim para bloquear o período
                        de férias.
                      </div>
                    )}
                </div>
              </div>
            )}

            {activeTab === "blocks" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-gold-400/20 bg-gold-400/10 px-3 py-2">
                  <p className="text-xs font-semibold text-gold-300">
                    Bloqueios da agenda
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-300">
                    Bloqueie dias ou horários dentro da janela liberada.
                  </p>
                </div>

                <div className="rounded-xl border border-gold-400/20 bg-dark-700 p-3">
                  <p className="text-xs font-semibold text-gray-100">
                    Férias / período sem atendimento
                  </p>
                  <label className="mt-3 flex items-center gap-3 text-sm font-medium text-gray-200">
                    <input
                      type="checkbox"
                      checked={vacation.enabled}
                      onChange={(event) =>
                        setVacation((current) => ({
                          ...current,
                          enabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gold-400/20 text-gold-300 focus:ring-gold-400"
                    />
                    Vai tirar férias
                  </label>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-300">
                        Início
                      </label>
                      <input
                        type="date"
                        value={vacation.startDate}
                        onChange={(event) =>
                          setVacation((current) => ({
                            ...current,
                            startDate: event.target.value,
                          }))
                        }
                        disabled={!vacation.enabled}
                        className="w-full rounded-xl border border-gold-400/20 bg-dark-800 px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-300">
                        Fim
                      </label>
                      <input
                        type="date"
                        value={vacation.endDate}
                        onChange={(event) =>
                          setVacation((current) => ({
                            ...current,
                            endDate: event.target.value,
                          }))
                        }
                        disabled={!vacation.enabled}
                        className="w-full rounded-xl border border-gold-400/20 bg-dark-800 px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gold-400/20 bg-dark-700 p-2.5">
                  <h3 className="mb-2 text-xs font-semibold text-gray-100">
                    Adicionar bloqueio
                  </h3>
                  <CompactScheduleBlockForm
                    availableDates={availableBlockDates}
                    onAdd={handleAddBlock}
                  />
                </div>

                <div className="rounded-xl border border-gold-400/20 bg-dark-700 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold text-gray-100">
                      Bloqueios cadastrados
                    </h3>
                    <span className="rounded-full bg-gold-400/10 px-2 py-0.5 text-[11px] font-semibold text-gold-300">
                      {visibleBlocks.length}
                    </span>
                  </div>

                  {visibleBlocks.length ? (
                    <div className="space-y-2">
                      {visibleBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="rounded-xl border border-gold-400/10 bg-dark-800 p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-100">
                                {block.date}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-300">
                                {block.type === "full-day"
                                  ? "Dia inteiro"
                                  : `${block.startTime} às ${block.endTime}`}
                              </p>
                              {block.reason && (
                                <p className="mt-1 line-clamp-2 text-[11px] text-gray-300">
                                  {block.reason}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(block.id)}
                              className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-950/40"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-dark-800 p-3 text-xs text-gray-300">
                      Nenhum bloqueio registrado na janela atual.
                    </p>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex flex-col gap-2 border-t bg-dark-700 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-end sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gold-400/20 px-4 py-2 text-sm text-gray-200 hover:bg-dark-800 sm:w-auto sm:rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-xl bg-gold-400/100 px-4 py-2 text-sm font-semibold text-white hover:bg-gold-300 sm:w-auto sm:rounded-lg"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para editar/adicionar serviço
const ServiceModal = ({
  service,
  onSave,
  onClose,
}: {
  service: Service | null;
  onSave: (data: { name: string; duration: string; price: string; status: 'active' | 'inactive' }) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(service?.name || "");
  const [duration, setDuration] = useState(service?.duration || "");
  const [price, setPrice] = useState(service?.price || "");
  const [status, setStatus] = useState<'active' | 'inactive'>(service?.status || 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationNumber = Number(String(duration).replace(/\D/g, ''));
    if (!name.trim() || !durationNumber || durationNumber <= 0) return;
    onSave({ name: name.trim(), duration, price, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/60 p-3">
      <div className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-dark-700 shadow-xl">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-100">
            {service ? "Editar serviço" : "Novo serviço"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">
              Serviço
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-300">
                Duração
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-300">
                Preço
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="R$ 100"
                className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full rounded-xl border border-gold-400/20 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gold-400/20 px-4 py-2 text-sm text-gray-200 hover:bg-dark-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gold-400/100 px-4 py-2 text-sm font-semibold text-white hover:bg-gold-300"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface ContentFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

const ContentField = ({
  label,
  value,
  onChange,
  multiline = false,
}: ContentFieldProps) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        className="w-full rounded-xl border border-gold-400/20 bg-dark-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:rounded-2xl sm:px-4 sm:py-3"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gold-400/20 bg-dark-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:rounded-2xl sm:px-4 sm:py-3"
      />
    )}
  </div>
);

const ContentSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="rounded-2xl border border-gold-400/20 bg-dark-800 p-4">
    <h3 className="mb-4 text-sm font-semibold text-gold-300 sm:text-base">
      {title}
    </h3>
    {children}
  </section>
);

const Admin = () => {
  const location = useLocation();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [professionalModalInitialTab, setProfessionalModalInitialTab] =
    useState<ProfessionalModalTab>("data");
  const [professionalPanelTab, setProfessionalPanelTab] =
    useState<ProfessionalPanelTab>("data");
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedClients, setBlockedClients] = useState<BlockedClient[]>([]);
  const [blockedProfessionalId, setBlockedProfessionalId] = useState<string | number>("");
  const [blockedPhone, setBlockedPhone] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [isSavingBlockedClient, setIsSavingBlockedClient] = useState(false);
  const [appointmentTab, setAppointmentTab] = useState<
    "por-profissional" | "base-geral"
  >("por-profissional");
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [themeColors, setThemeColors] = useState<ThemeColors>(() =>
    loadTemplatePreferences().themeColors,
  );
  const [siteConfigSaved, setSiteConfigSaved] = useState(false);
  const [adminSection, setAdminSection] = useState<"template" | "professionals">("template");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [databaseMessage, setDatabaseMessage] = useState("");

  // Filtros para "Por profissional"
  const [professionalDateFilter, setProfessionalDateFilter] =
    useState<string>("");

  // Filtros para "Base geral"
  const [clientFilter, setClientFilter] = useState<string>("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [professionalFilter, setProfessionalFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<string>("");
  const [durationFilter, setDurationFilter] = useState<string>("");
  const [createdAtFilter, setCreatedAtFilter] = useState<string>("");

  // ============================================
  // CARREGAR DADOS DO BANCO
  // ============================================

  const loadAdminData = async () => {
    if (!hasLocalDataStore) {
      setProfessionals([]);
      setAppointments([]);
      setSiteConfig(defaultSiteConfig);
      setThemeColors(getDefaultThemeColors(defaultSiteConfig.themeId));
      setIsLoadingData(false);
      setDatabaseMessage("Armazenamento local iniciado.");
      return;
    }

    try {
      setIsLoadingData(true);
      setDatabaseMessage("");

      const [
        databaseProfessionals,
        databaseAppointments,
        databaseBlockedClients,
        databaseState,
      ] = await Promise.all([
        loadProfessionalsFromDatabase(),
        loadAppointmentsFromDatabase(),
        loadBlockedClientsFromDatabase(),
        loadAdminStateFromDatabase(),
      ]);

      setProfessionals(databaseProfessionals);
      setAppointments(databaseAppointments);
      setBlockedClients(databaseBlockedClients);
      setBlockedProfessionalId((current) => current || databaseProfessionals[0]?.id || "");
      const preferences = loadTemplatePreferences();
      const nextThemeColors = normalizeThemeColors(
        preferences.themeColors,
        databaseState?.siteConfig?.themeId || preferences.paletteId,
      );

      setSiteConfig(normalizeSiteConfig(databaseState?.siteConfig));
      setThemeColors(nextThemeColors);
    } catch (error) {
      setDatabaseMessage("Erro ao salvar as cores do site.");
      console.error("Erro ao carregar dados locais:", error);
      setProfessionals([]);
      setAppointments([]);
      setSiteConfig(defaultSiteConfig);
      setDatabaseMessage(
        "Não consegui carregar os dados locais.",
      );
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    applyThemeColors(themeColors, siteConfig.themeId);
  }, [siteConfig.themeId, themeColors]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "template") {
      setAdminSection("template");
    } else if (tab === "professionals") {
      setAdminSection("professionals");
    }
  }, [location.search]);

  const refreshAppointments = async () => {
    try {
      const databaseAppointments = await loadAppointmentsFromDatabase();
      setAppointments(databaseAppointments);
      setDatabaseMessage("Agendamentos atualizados.");
    } catch (error) {
      console.error("Erro ao atualizar agendamentos:", error);
      setDatabaseMessage("Erro ao atualizar agendamentos.");
    }
  };

  const refreshBlockedClients = async () => {
    try {
      const databaseBlockedClients = await loadBlockedClientsFromDatabase();
      setBlockedClients(databaseBlockedClients);
    } catch (error) {
      console.error("Erro ao atualizar clientes bloqueados:", error);
      setDatabaseMessage("Erro ao atualizar clientes bloqueados.");
    }
  };


  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

    const previousAppointments = appointments;
    const updatedAppointments = appointments.filter(
      (appointment) => appointment.id !== appointmentId,
    );
    setAppointments(updatedAppointments);

    try {
      const { error } = await localDataClient
        .from("appointments")
        .delete()
        .eq("id", appointmentId);
      if (error) throw error;
      setDatabaseMessage("Agendamento excluído.");
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      setAppointments(previousAppointments);
      setDatabaseMessage("Erro ao excluir agendamento.");
    }
  };
  const handleBlockClient = async (appointment: Appointment) => {
    const cleanPhone = normalizePhone(appointment.phone);

    if (!cleanPhone) {
      setDatabaseMessage("Não foi possível bloquear: telefone inválido.");
      return;
    }

    if (
      !confirm(
        `Bloquear este cliente para ${appointment.professionalName}? Ele não conseguirá mais agendar com esta profissional.`,
      )
    )
      return;

    try {
      const { data: existingBlock, error: searchError } = await localDataClient
        .from("blocked_clients")
        .select("id")
        .eq("professional_id", String(appointment.professionalId))
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingBlock) {
        setDatabaseMessage("Este telefone já está bloqueado para esta profissional.");
        return;
      }

      const { error } = await localDataClient.from("blocked_clients").insert({
        professional_id: String(appointment.professionalId),
        phone: cleanPhone,
        reason: `Bloqueado pelo painel administrativo: ${appointment.clientName}`,
      });

      if (error) throw error;

      await refreshBlockedClients();
      setDatabaseMessage("Cliente bloqueado para esta profissional.");
    } catch (error) {
      console.error("Erro ao bloquear cliente:", error);
      setDatabaseMessage("Erro ao bloquear cliente no armazenamento local.");
    }
  };

  const handleAddBlockedClient = async () => {
    const cleanPhone = normalizePhone(blockedPhone);

    if (!blockedProfessionalId || !cleanPhone) {
      setDatabaseMessage("Escolha a profissional e informe um telefone válido.");
      return;
    }

    try {
      setIsSavingBlockedClient(true);

      const { data: existingBlock, error: searchError } = await localDataClient
        .from("blocked_clients")
        .select("id")
        .eq("professional_id", String(blockedProfessionalId))
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingBlock) {
        setDatabaseMessage("Este telefone já está bloqueado para esta profissional.");
        return;
      }

      const { error } = await localDataClient.from("blocked_clients").insert({
        professional_id: String(blockedProfessionalId),
        phone: cleanPhone,
        reason: blockedReason.trim() || null,
      });

      if (error) throw error;

      setBlockedPhone("");
      setBlockedReason("");
      await refreshBlockedClients();
      setDatabaseMessage("Cliente bloqueado para esta profissional.");
    } catch (error) {
      console.error("Erro ao bloquear cliente:", error);
      setDatabaseMessage("Erro ao bloquear cliente no armazenamento local.");
    } finally {
      setIsSavingBlockedClient(false);
    }
  };

  const handleUnblockClient = async (blockedClientId: string) => {
    if (!confirm("Tem certeza que deseja desbloquear este cliente?")) return;

    try {
      const { error } = await localDataClient
        .from("blocked_clients")
        .delete()
        .eq("id", blockedClientId);

      if (error) throw error;

      setBlockedClients((current) =>
        current.filter((client) => client.id !== blockedClientId),
      );
      setDatabaseMessage("Cliente desbloqueado.");
    } catch (error) {
      console.error("Erro ao desbloquear cliente:", error);
      setDatabaseMessage("Erro ao desbloquear cliente.");
    }
  };

  // Funções de filtro
  const clearProfessionalFilters = () => {
    setProfessionalDateFilter("");
  };

  const clearGeneralFilters = () => {
    setClientFilter("");
    setPhoneFilter("");
    setProfessionalFilter("");
    setServiceFilter("");
    setDateFilter("");
    setTimeFilter("");
    setDurationFilter("");
    setCreatedAtFilter("");
  };

  // Obter opções únicas para filtros
  const getUniqueProfessionals = () => {
    const unique = new Set(appointments.map((a) => a.professionalName));
    return Array.from(unique).sort();
  };

  const getUniqueServices = () => {
    const unique = new Set(appointments.map((a) => a.serviceName));
    return Array.from(unique).sort();
  };

  const getUniqueDurations = () => {
    const unique = new Set(
      appointments.map((a) => a.duration || "").filter((d) => d),
    );
    return Array.from(unique).sort();
  };

  // Aplicar filtros aos agendamentos
  const getFilteredAppointments = () => {
    return appointments.filter((appointment) => {
      if (
        clientFilter &&
        !appointment.clientName
          .toLowerCase()
          .includes(clientFilter.toLowerCase())
      )
        return false;
      if (phoneFilter && !appointment.phone.includes(phoneFilter)) return false;
      if (
        professionalFilter &&
        appointment.professionalName !== professionalFilter
      )
        return false;
      if (serviceFilter && appointment.serviceName !== serviceFilter)
        return false;
      if (dateFilter && appointment.date !== dateFilter) return false;
      if (timeFilter && !appointment.time.includes(timeFilter)) return false;
      if (durationFilter && appointment.duration !== durationFilter)
        return false;
      if (
        createdAtFilter &&
        appointment.createdAt &&
        !appointment.createdAt.includes(createdAtFilter)
      )
        return false;
      return true;
    });
  };

  const getFilteredAppointmentsByDate = (date: string) => {
    if (!date) return appointments;
    return appointments.filter((appointment) => appointment.date === date);
  };

  // Função de exportação CSV
  const exportToCSV = () => {
    const filteredAppointments = getFilteredAppointments();
    const headers = [
      "Cliente",
      "Telefone",
      "Profissional",
      "Serviço",
      "Data",
      "Horário",
      "Duração",
      "Criado em",
    ];
    const rows = filteredAppointments.map((appointment) => [
      appointment.clientName,
      appointment.phone,
      appointment.professionalName,
      appointment.serviceName,
      appointment.date,
      appointment.time,
      appointment.duration || "",
      appointment.createdAt
        ? new Date(appointment.createdAt).toLocaleString("pt-BR")
        : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "agendamentos-modelo.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateSiteConfig = (update: Partial<SiteConfig>) => {
    setSiteConfig((current) => ({
      ...current,
      ...update,
    }));
    setSiteConfigSaved(false);
  };

  const updateTemplateConfig = (colors: ThemeColors) => {
    setThemeColors(normalizeThemeColors(colors, siteConfig.themeId));
    setSiteConfigSaved(false);
  };

  const updateSiteSection = <K extends keyof SiteConfig>(
    section: K,
    update: Partial<SiteConfig[K]>,
  ) => {
    setSiteConfig((current) => ({
      ...current,
      [section]: {
        ...(current[section] as Record<string, unknown>),
        ...update,
      },
    }));
    setSiteConfigSaved(false);
  };

  const updateProfessionalText = (
    professionalId: string | number,
    update: Pick<Partial<Professional>, "name" | "specialty">,
  ) => {
    setProfessionals((current) =>
      current.map((professional) =>
        String(professional.id) === String(professionalId)
          ? { ...professional, ...update }
          : professional,
      ),
    );
    setSiteConfigSaved(false);
  };

  const updateSiteService = (
    serviceId: string | number,
    update: Partial<SiteService>,
  ) => {
    setSiteConfig((current) => ({
      ...current,
      services: current.services.map((service) =>
        service.id === serviceId ? { ...service, ...update } : service,
      ),
    }));
    setSiteConfigSaved(false);
  };

  const handleSaveSiteConfig = async () => {
    try {
      const normalizedConfig = normalizeSiteConfig(siteConfig);
      const normalizedThemeColors = normalizeThemeColors(
        themeColors,
        normalizedConfig.themeId,
      );

      await saveAdminStateToDatabase(normalizedConfig);
      saveTemplatePreferences({
        segmentId: normalizedConfig.segmentId,
        paletteId: normalizedConfig.themeId,
        themeColors: normalizedThemeColors,
      });
      setSiteConfig(normalizedConfig);
      setThemeColors(normalizedThemeColors);
      applyThemeColors(normalizedThemeColors, normalizedConfig.themeId);
      setDatabaseMessage("Cores do site salvas localmente.");
      setSiteConfigSaved(true);
      setDatabaseMessage("Configurações salvas localmente.");
      window.setTimeout(() => setSiteConfigSaved(false), 2500);
      window.setTimeout(() => setDatabaseMessage("Cores do site salvas localmente."), 0);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setDatabaseMessage("Erro ao salvar configurações.");
    }
  };

  const handleResetSiteConfig = async () => {
    if (
      !confirm(
        "Tem certeza que deseja restaurar as informações padrão do site?",
      )
    )
      return;

    const normalizedConfig = normalizeSiteConfig(siteConfig);
    const defaultThemeColors = getDefaultThemeColors(normalizedConfig.themeId);

    setThemeColors(defaultThemeColors);
    saveTemplatePreferences({
      segmentId: normalizedConfig.segmentId,
      paletteId: normalizedConfig.themeId,
      themeColors: defaultThemeColors,
    });
    applyThemeColors(defaultThemeColors, normalizedConfig.themeId);

    try {
      await saveAdminStateToDatabase(normalizedConfig);
      setSiteConfigSaved(true);
      setDatabaseMessage("Cores padrÃ£o restauradas.");
      window.setTimeout(() => setSiteConfigSaved(false), 2500);
    } catch (error) {
      console.error("Erro ao restaurar as cores:", error);
      setDatabaseMessage("Erro ao restaurar as cores do site.");
    }

    return;

    const normalizedDefault = normalizeSiteConfig(defaultSiteConfig);
    setSiteConfig(normalizedDefault);
    saveTemplatePreferences({
      segmentId: normalizedDefault.segmentId,
      paletteId: normalizedDefault.themeId,
    });

    try {
      await saveAdminStateToDatabase(normalizedDefault);
      setSiteConfigSaved(true);
      setDatabaseMessage("Configurações padrão salvas localmente.");
      window.setTimeout(() => setSiteConfigSaved(false), 2500);
    } catch (error) {
      console.error("Erro ao restaurar configurações:", error);
      setDatabaseMessage("Erro ao restaurar configurações.");
    }
  };

  // ============================================
  // SINCRONIZAÇÃO COM BANCO
  // ============================================

  const reloadProfessionals = async () => {
    const databaseProfessionals = await loadProfessionalsFromDatabase();
    setProfessionals(databaseProfessionals);
  };

  // ============================================
  // LIMPAR DADOS DO MODELO
  // ============================================

  const handleResetToDefault = async () => {
    if (
      !confirm(
        "Tem certeza que deseja limpar os dados do modelo? Profissionais, serviços, agendamentos, bloqueios e horários serão apagados.",
      )
    )
      return;

    try {
      const tablesToClear = [
        "appointments",
        "services",
        "blocked_clients",
        "weekly_schedule",
        "schedule_blocks",
        "professionals",
      ];

      await Promise.all(tablesToClear.map((table) => localDataClient.from(table).delete()));

      for (const professional of initialData) {
        const monthlySchedules = buildAutomaticSchedules(
          getInitialWeeklyRules(professional),
          professional.monthlySchedules || [],
        );

        const professionalId = await saveProfessionalToDatabase(
          {
            name: professional.name,
            specialty: professional.specialty,
            status: professional.status,
            image: professional.image,
            whatsappMessage: professional.whatsappMessage || "",
            monthlySchedules,
          },
          null,
        );

        if (professional.services.length) {
          const serviceRows = professional.services.map((service) => ({
            professional_id: professionalId,
            name: service.name,
            duration: parseDurationToNumber(service.duration),
            price: parsePriceToNumber(service.price),
          }));

          await localDataClient.from("services").insert(serviceRows);
        }
      }

      await reloadProfessionals();
      setSelectedProfessional(null);
      setAppointments([]);
      setBlockedClients([]);
      setDatabaseMessage("Dados do modelo limpos localmente.");
    } catch (error) {
      console.error("Erro ao limpar dados do modelo:", error);
      setProfessionals([]);
      setDatabaseMessage("Erro ao limpar dados do modelo.");
    }
  };

  // ============================================
  // HANDLERS - PROFISSIONAIS
  // ============================================

  const handleAddProfessional = () => {
    setEditingProfessional(null);
    setProfessionalModalInitialTab("data");
    setShowProfessionalModal(true);
  };

  const handleEditProfessional = (
    professional: Professional,
    initialTab: ProfessionalModalTab = "data",
  ) => {
    setEditingProfessional(professional);
    setSelectedProfessional(professional);
    setProfessionalModalInitialTab(initialTab);
    setShowProfessionalModal(true);
  };

  const handleSaveProfessional = async (data: {
    name: string;
    specialty: string;
    status: "active" | "inactive";
    image: string;
    whatsappMessage?: string;
    allowSimultaneousAppointments?: boolean;
    imageFile?: File | null;
    monthlySchedules: MonthlySchedule[];
    vacation?: VacationPeriod;
  }) => {
    try {
      const imageUrl = data.imageFile
        ? await uploadProfessionalImage(data.imageFile)
        : data.image;

      await saveProfessionalToDatabase(
        {
          ...data,
          image: imageUrl,
        },
        editingProfessional,
      );
      await reloadProfessionals();

      setShowProfessionalModal(false);
      setEditingProfessional(null);
      setDatabaseMessage("Profissional salva localmente.");
    } catch (error) {
      console.error("Erro ao salvar profissional/imagem:", error);
      setDatabaseMessage("Erro ao salvar profissional/imagem.");
    }
  };

  const handleDeleteProfessional = async (id: string | number) => {
    if (!confirm("Tem certeza que deseja excluir esta profissional?")) return;

    const previousProfessionals = professionals;
    setProfessionals((current) =>
      current.filter((professional) => String(professional.id) !== String(id)),
    );

    try {
      await deleteProfessionalFromDatabase(id);

      if (String(selectedProfessional?.id) === String(id))
        setSelectedProfessional(null);
      await refreshAppointments();
      setDatabaseMessage(
        isValidUuid(id)
          ? "Profissional excluída localmente."
          : "Profissional antiga removida da tela. Recarregue para atualizar os dados locais.",
      );
    } catch (error) {
      console.error("Erro ao excluir profissional:", error);
      setProfessionals(previousProfessionals);
      setDatabaseMessage(
        "Erro ao excluir profissional no armazenamento local.",
      );
    }
  };

  // ============================================
  // HANDLERS - SERVIÇOS
  // ============================================

  const handleAddService = (professionalId: string | number) => {
    const professional = professionals.find((p) => p.id === professionalId);
    if (professional) {
      setSelectedProfessional(professional);
      setProfessionalPanelTab("services");
    }
    setEditingService(null);
    setShowServiceModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceModal(true);
  };

  const handleSaveService = async (data: {
    name: string;
    duration: string;
    price: string;
    status: 'active' | 'inactive';
  }) => {
    if (!selectedProfessional) return;

    try {
      const payload = {
        professional_id: String(selectedProfessional.id),
        name: data.name,
        duration: parseDurationToNumber(data.duration),
        price: parsePriceToNumber(data.price),
        active: data.status === 'active',
        status: data.status,
      };

      const { error } = editingService
        ? await localDataClient
            .from("services")
            .update(payload)
            .eq("id", editingService.id)
        : await localDataClient.from("services").insert(payload);

      if (error) throw error;

      await reloadProfessionals();

      setShowServiceModal(false);
      setEditingService(null);
      setDatabaseMessage("Serviço salvo localmente.");
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      setDatabaseMessage("Erro ao salvar serviço.");
    }
  };

  const handleDeleteService = async (serviceId: string | number) => {
    if (!selectedProfessional) return;
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

    const previousProfessionals = professionals;
    const updatedProfessionals = professionals.map((p) =>
      String(p.id) === String(selectedProfessional.id)
        ? {
            ...p,
            services: p.services.filter(
              (s) => String(s.id) !== String(serviceId),
            ),
          }
        : p,
    );
    setProfessionals(updatedProfessionals);

    try {
      const { error } = await localDataClient
        .from("services")
        .delete()
        .eq("id", serviceId);
      if (error) throw error;

      await reloadProfessionals();
      setDatabaseMessage("Serviço excluído localmente.");
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      setProfessionals(previousProfessionals);
      setDatabaseMessage("Erro ao excluir serviço.");
    }
  };

  const getServiceDuration = (appointment: Appointment) => {
    const professional = professionals.find(
      (p) => String(p.id) === String(appointment.professionalId),
    );
    const service = professional?.services.find(
      (s) => String(s.id) === String(appointment.serviceId),
    );
    return service?.duration ?? appointment.duration ?? "-";
  };

  const formatCreatedAt = (value?: string) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const getProfessionalBlocks = (professional: Professional) =>
    (professional.monthlySchedules || []).flatMap(
      (schedule) => schedule.blocks || [],
    );

  const formatBlockLabel = (block: ScheduleBlock) =>
    block.type === "full-day"
      ? `${block.date} • dia inteiro`
      : `${block.date} • ${block.startTime} às ${block.endTime}`;

  const selectProfessionalPanel = (
    professional: Professional,
    tab: ProfessionalPanelTab,
  ) => {
    setSelectedProfessional(professional);
    setProfessionalPanelTab(tab);
  };

  const isProfessionalArea = adminSection === "professionals";

  return (
    <div className="min-h-screen bg-dark-800">
      {/* Header Admin */}
      <div className="border-b bg-dark-700 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold leading-tight text-gray-100 sm:text-2xl">
                Painel Administrativo
              </h1>
              <p className="mt-1 max-w-[190px] text-xs leading-relaxed text-gray-300 sm:max-w-none sm:text-sm">
                Configure o template e gerencie a operação da agenda
              </p>
            </div>
            <Link
              to="/"
              className="shrink-0 rounded-full bg-gold-400/10 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-400/15 hover:text-gold-300 sm:text-sm"
            >
              ← Site
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-gold-400/20 bg-dark-700">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3">
            {[
              { key: "template", label: "Cores do Site" },
              { key: "professionals", label: "Profissionais" },
            ].map((section: { key: "template" | "professionals"; label: string }) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setAdminSection(section.key)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                  adminSection === section.key
                    ? "bg-gold-400/100 text-white shadow-sm"
                    : "bg-dark-700 text-gray-200 hover:bg-dark-700"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(isLoadingData || databaseMessage) && (
        <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 lg:px-8">
          <div
            className={`rounded-2xl border p-3 text-xs sm:text-sm ${
              databaseMessage.includes("Erro") ||
              databaseMessage.includes("Não consegui")
                ? "border-red-400/30 bg-red-950/40 text-red-400"
                : "border-gold-400/20 bg-gold-400/10 text-gold-300"
            }`}
          >
            {isLoadingData ? "Carregando dados locais..." : databaseMessage}
          </div>
        </div>
      )}

      {adminSection === "template" && (
        <TemplateEditorSection
          config={siteConfig}
          saved={siteConfigSaved}
          themeColors={themeColors}
          onChange={updateTemplateConfig}
          onSave={handleSaveSiteConfig}
          onReset={handleResetSiteConfig}
        />
      )}

      {/* Lista de Profissionais */}
      {isProfessionalArea && (
        <div className="mx-auto w-full max-w-md px-3 py-5 sm:max-w-7xl sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-100 sm:text-lg">
                Profissionais ({professionals.length})
              </h2>
              <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                Selecione um profissional para gerenciar dados, serviços,
                horários e bloqueios vinculados a ele.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
              <button
                onClick={handleResetToDefault}
                className="inline-flex w-full items-center justify-center rounded-full border border-gold-400/20 px-3 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-dark-800 sm:w-auto sm:text-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Limpar dados do modelo
              </button>
              <button
                onClick={handleAddProfessional}
                className="inline-flex w-full items-center justify-center rounded-full bg-gold-400/100 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gold-300 sm:w-auto sm:px-4 sm:text-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Adicionar profissional
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {professionals.map((professional) => (
              <div
                key={professional.id}
                className="w-full overflow-hidden rounded-2xl bg-dark-700 p-3.5 shadow-sm sm:rounded-xl sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <img
                      src={professional.image || DEFAULT_PROFESSIONAL_IMAGE}
                      alt={professional.name}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-base font-semibold text-gray-100 sm:text-lg">
                          {professional.name}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            professional.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-dark-700 text-gray-100"
                          }`}
                        >
                          {professional.status === "active"
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 sm:text-sm">
                        {professional.specialty}
                      </p>
                      <p className="mt-1 text-xs text-gold-300 sm:text-sm">
                        {professional.services.length} serviço(s) vinculado(s)
                      </p>
                      {professional.allowSimultaneousAppointments && (
                        <span className="mt-1 inline-flex rounded-full bg-gold-400/10 px-2 py-0.5 text-[11px] font-semibold text-gold-300">
                          Atendimento simultâneo liberado
                        </span>
                      )}
                      <p className="mt-2 flex items-start gap-1 break-words text-[11px] leading-relaxed text-gray-300 sm:text-xs">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {professional.monthlySchedules?.length
                          ? formatMonthlyScheduleSummary(
                              professional.monthlySchedules,
                            )
                          : formatScheduleSummary(professional.schedule)}
                      </p>
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                    <button
                      onClick={() => selectProfessionalPanel(professional, "data")}
                      className="rounded-full px-2 py-1.5 text-center text-xs text-gold-300 transition-colors hover:bg-gold-400/10 sm:px-3 sm:text-sm"
                    >
                      Gerenciar
                    </button>
                    <button
                      onClick={() => handleEditProfessional(professional)}
                      className="rounded-full px-2 py-1.5 text-center text-xs text-gray-300 transition-colors hover:bg-dark-700 sm:px-3 sm:text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProfessional(professional.id)}
                      className="rounded-full px-2 py-1.5 text-center text-xs text-red-600 transition-colors hover:bg-red-950/40 sm:px-3 sm:text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Área operacional da profissional selecionada */}
                {String(selectedProfessional?.id) ===
                  String(professional.id) && (
                  <div className="mt-4 border-t pt-4">
                    <div className="mb-4 flex gap-2 overflow-x-auto">
                      {[
                        { key: "data", label: "Dados" },
                        { key: "services", label: "Serviços" },
                        { key: "schedule", label: "Horários" },
                        { key: "blocks", label: "Bloqueios" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() =>
                            setProfessionalPanelTab(
                              tab.key as ProfessionalPanelTab,
                            )
                          }
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                            professionalPanelTab === tab.key
                              ? "bg-gold-400/100 text-white"
                              : "bg-dark-800 text-gray-200 hover:bg-gold-400/10 hover:text-gold-300"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {professionalPanelTab === "data" && (
                      <div className="rounded-2xl border border-gold-400/10 bg-dark-800 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-100">
                              Dados da profissional
                            </h4>
                            <div className="mt-3 grid gap-3 text-xs text-gray-300 sm:grid-cols-2 sm:text-sm">
                              <p>
                                <span className="block text-gray-400">Nome</span>
                                {professional.name}
                              </p>
                              <p>
                                <span className="block text-gray-400">
                                  Especialidade
                                </span>
                                {professional.specialty}
                              </p>
                              <p>
                                <span className="block text-gray-400">Status</span>
                                {professional.status === "active"
                                  ? "Ativo"
                                  : "Inativo"}
                              </p>
                              <p>
                                <span className="block text-gray-400">
                                  Atendimento simultâneo
                                </span>
                                {professional.allowSimultaneousAppointments
                                  ? "Liberado"
                                  : "Desativado"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleEditProfessional(professional, "data")
                            }
                            className="rounded-full bg-gold-400/10 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-400/15"
                          >
                            Editar dados
                          </button>
                        </div>
                      </div>
                    )}

                    {professionalPanelTab === "services" && (
                      <div className="rounded-2xl border border-gold-400/10 bg-dark-800 p-4">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h4 className="text-sm font-semibold text-gray-200">
                            Serviços de {professional.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleAddService(professional.id)}
                            className="rounded-full bg-gold-400/10 px-3 py-2 text-center text-xs font-semibold text-gold-300 hover:bg-gold-400/15"
                          >
                            + Adicionar serviço
                          </button>
                        </div>

                        {professional.services.length === 0 ? (
                          <p className="rounded-xl bg-dark-700 p-3 text-xs italic text-gray-300">
                            Nenhum serviço cadastrado para esta profissional.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {professional.services.map((service) => (
                              <div
                                key={service.id}
                                className="rounded-2xl border border-gold-400/10 bg-dark-700 p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h5 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-100">
                                      {service.name}
                                    </h5>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-300">
                                      <span>{service.duration}</span>
                                      <span>•</span>
                                      <span className="font-medium text-gray-200">
                                        {service.price}
                                      </span>
                                      <span>•</span>
                                      <span className={service.status === 'inactive' ? 'text-red-400' : 'text-green-400'}>
                                        {service.status === 'inactive' ? 'Inativo' : 'Ativo'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 flex-col items-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleEditService(service)}
                                      className="rounded-full px-2 py-1 text-xs font-medium text-gold-300 hover:bg-gold-400/10"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteService(service.id)
                                      }
                                      className="rounded-full px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-950/40"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {professionalPanelTab === "schedule" && (
                      <div className="rounded-2xl border border-gold-400/10 bg-dark-800 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-100">
                              Horários de atendimento
                            </h4>
                            <p className="mt-2 text-xs leading-relaxed text-gray-300 sm:text-sm">
                              {professional.monthlySchedules?.length
                                ? formatMonthlyScheduleSummary(
                                    professional.monthlySchedules,
                                  )
                                : formatScheduleSummary(professional.schedule)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleEditProfessional(professional, "schedule")
                            }
                            className="rounded-full bg-gold-400/10 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-400/15"
                          >
                            Editar horários
                          </button>
                        </div>
                      </div>
                    )}

                    {professionalPanelTab === "blocks" && (
                      <div className="rounded-2xl border border-gold-400/10 bg-dark-800 p-4">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-100">
                              Bloqueios da profissional
                            </h4>
                            <p className="mt-1 text-xs text-gray-300">
                              Bloqueie datas, intervalos de horário e períodos
                              sem atendimento.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleEditProfessional(professional, "blocks")
                            }
                            className="rounded-full bg-gold-400/10 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-400/15"
                          >
                            Editar bloqueios
                          </button>
                        </div>

                        {professional.vacation?.enabled && (
                          <div className="mb-3 rounded-xl border border-gold-400/10 bg-dark-700 p-3 text-xs text-gray-300">
                            Férias: {professional.vacation.startDate || "início não definido"} até{" "}
                            {professional.vacation.endDate || "fim não definido"}
                          </div>
                        )}

                        {getProfessionalBlocks(professional).length === 0 ? (
                          <p className="rounded-xl bg-dark-700 p-3 text-xs italic text-gray-300">
                            Nenhum bloqueio de agenda cadastrado.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {getProfessionalBlocks(professional).map((block) => (
                              <div
                                key={block.id}
                                className="rounded-xl border border-gold-400/10 bg-dark-700 p-3"
                              >
                                <p className="text-sm font-semibold text-gray-100">
                                  {formatBlockLabel(block)}
                                </p>
                                {block.reason && (
                                  <p className="mt-1 text-xs text-gray-300">
                                    {block.reason}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {adminSection === "blocked-clients" && (
        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-4 flex flex-col gap-2 sm:mb-6">
            <h2 className="text-base font-semibold text-gray-100 sm:text-lg">
              Clientes bloqueados
            </h2>
            <p className="text-xs text-gray-300 sm:text-sm">
              Bloqueie um telefone antes do cliente tentar agendar. O bloqueio vale apenas para a profissional escolhida.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
            <div className="rounded-2xl border border-gold-400/20 bg-dark-700 p-4 shadow-sm sm:rounded-3xl sm:p-6">
              <h3 className="text-sm font-semibold text-gray-100">
                Novo bloqueio
              </h3>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-200">
                    Profissional
                  </label>
                  <select
                    value={blockedProfessionalId}
                    onChange={(event) => setBlockedProfessionalId(event.target.value)}
                    className="w-full rounded-xl border border-gold-400/20 bg-dark-800 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                  >
                    <option value="">Escolha uma profissional</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-200">
                    Telefone do cliente
                  </label>
                  <input
                    type="tel"
                    value={blockedPhone}
                    onChange={(event) => setBlockedPhone(event.target.value)}
                    placeholder="(11) 9 9999-9999"
                    className="w-full rounded-xl border border-gold-400/20 bg-dark-800 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                  />
                  <p className="mt-1 text-[11px] text-gray-300">
                    O sistema salva apenas os números, sem máscara.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-200">
                    Motivo
                  </label>
                  <textarea
                    value={blockedReason}
                    onChange={(event) => setBlockedReason(event.target.value)}
                    rows={3}
                    placeholder="Opcional. Ex: cliente rude, falta recorrente..."
                    className="w-full rounded-xl border border-gold-400/20 bg-dark-800 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddBlockedClient}
                  disabled={isSavingBlockedClient}
                  className="w-full rounded-full bg-dark-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-dark-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingBlockedClient ? "Bloqueando..." : "Bloquear telefone"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gold-400/20 bg-dark-700 p-4 shadow-sm sm:rounded-3xl sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">
                    Lista de bloqueados
                  </h3>
                  <p className="text-xs text-gray-300">
                    {blockedClients.length} telefone(s) bloqueado(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshBlockedClients}
                  className="rounded-full border border-gold-400/20 bg-dark-700 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-400/10"
                >
                  Atualizar
                </button>
              </div>

              {blockedClients.length === 0 ? (
                <p className="rounded-2xl bg-dark-800 p-4 text-sm text-gray-300">
                  Nenhum cliente bloqueado.
                </p>
              ) : (
                <div className="grid gap-3">
                  {blockedClients.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-2xl border border-gold-400/10 bg-dark-800 p-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-100">
                            {client.phone}
                          </p>
                          <p className="mt-1 text-xs text-gray-300">
                            Profissional: {client.professionalName || "Não informada"}
                          </p>
                          {client.reason && (
                            <p className="mt-1 text-xs text-gray-300">
                              Motivo: {client.reason}
                            </p>
                          )}
                          {client.createdAt && (
                            <p className="mt-1 text-[11px] text-gray-300">
                              Criado em: {formatCreatedAt(client.createdAt)}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnblockClient(client.id)}
                          className="rounded-full bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Desbloquear
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {adminSection === "appointments" && (
        <div className="mx-auto max-w-7xl px-2.5 py-4 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-100 sm:text-lg">
                Agendamentos
              </h2>
              <p className="text-xs text-gray-300 sm:text-sm">
                Visualize os agendamentos realizados por profissional ou na base
                geral.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => setAppointmentTab("por-profissional")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  appointmentTab === "por-profissional"
                    ? "bg-gold-400/100 text-white"
                    : "bg-dark-700 text-gray-200 hover:bg-dark-700"
                }`}
              >
                Por profissional
              </button>
              <button
                type="button"
                onClick={() => setAppointmentTab("base-geral")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  appointmentTab === "base-geral"
                    ? "bg-gold-400/100 text-white"
                    : "bg-dark-700 text-gray-200 hover:bg-dark-700"
                }`}
              >
                Base geral
              </button>
              <button
                type="button"
                onClick={refreshAppointments}
                className="rounded-full border border-gold-400/20 bg-dark-700 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-400/10 sm:px-4 sm:text-sm"
              >
                Atualizar lista
              </button>
            </div>
          </div>

          {appointmentTab === "por-profissional" ? (
            <div className="space-y-6">
              {/* Filtros para "Por profissional" */}
              <div className="rounded-2xl border border-gold-400/20 bg-dark-700 p-4 sm:rounded-3xl sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Filtrar por data
                      </label>
                      <input
                        type="date"
                        value={professionalDateFilter}
                        onChange={(e) =>
                          setProfessionalDateFilter(e.target.value)
                        }
                        className="rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearProfessionalFilters}
                      className="rounded-2xl border border-gold-400/20 bg-dark-700 px-4 py-3 text-sm font-medium text-gray-200 hover:bg-dark-800 transition"
                    >
                      Limpar filtro
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 sm:text-sm">
                    {professionalDateFilter
                      ? `Mostrando agendamentos para ${professionalDateFilter}`
                      : "Mostrando todos os agendamentos"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {professionals.length === 0 ? (
                  <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-6 text-sm text-gray-300">
                    Nenhuma profissional encontrada para exibir agendamentos.
                  </div>
                ) : (
                  professionals.map((professional) => {
                    const professionalAppointments =
                      getFilteredAppointmentsByDate(
                        professionalDateFilter,
                      ).filter(
                        (appointment) =>
                          String(appointment.professionalId) ===
                          String(professional.id),
                      );

                    return (
                      <div
                        key={professional.id}
                        className="rounded-2xl border border-gold-400/20 bg-dark-700 p-4 sm:rounded-3xl sm:p-6"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-gray-100 sm:text-lg">
                              {professional.name}
                            </h3>
                            <p className="text-xs text-gray-300 sm:text-sm">
                              {professional.specialty}
                            </p>
                          </div>
                          <span className="inline-flex rounded-full bg-gold-400/10 px-3 py-1 text-sm font-medium text-gold-300">
                            {professionalAppointments.length} agendamento(s)
                          </span>
                        </div>

                        {professionalAppointments.length === 0 ? (
                          <p className="mt-4 text-sm text-gray-300">
                            Nenhum agendamento encontrado para esta
                            profissional.
                          </p>
                        ) : (
                          <div className="mt-4 grid gap-4">
                            {professionalAppointments.map((appointment) => (
                              <div
                                key={appointment.id}
                                className="rounded-3xl border border-gold-400/20 bg-gold-400/10 p-4"
                              >
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div>
                                    <p className="text-xs text-gray-300 sm:text-sm">
                                      Cliente
                                    </p>
                                    <p className="text-sm font-medium text-gray-100">
                                      {appointment.clientName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-300 sm:text-sm">
                                      Telefone
                                    </p>
                                    <p className="text-sm font-medium text-gray-100">
                                      {appointment.phone}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-300 sm:text-sm">
                                      Serviço
                                    </p>
                                    <p className="text-sm font-medium text-gray-100">
                                      {appointment.serviceName} •{" "}
                                      {getServiceDuration(appointment)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-300 sm:text-sm">
                                      Data / Horário
                                    </p>
                                    <p className="text-sm font-medium text-gray-100">
                                      {appointment.date} • {appointment.time}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 border-t border-gold-400/20 pt-3">
                                  <button
                                    type="button"
                                    onClick={() => handleBlockClient(appointment)}
                                    className="rounded-full bg-dark-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dark-800"
                                  >
                                    Bloquear cliente
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filtros para "Base geral" */}
              <div className="rounded-2xl border border-gold-400/20 bg-dark-700 p-4 sm:rounded-3xl sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-gray-100 sm:text-lg">
                      Filtros
                    </h3>
                    <button
                      type="button"
                      onClick={clearGeneralFilters}
                      className="rounded-2xl border border-gold-400/20 bg-dark-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-dark-800 transition"
                    >
                      Limpar filtros
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Cliente
                      </label>
                      <input
                        type="text"
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={phoneFilter}
                        onChange={(e) => setPhoneFilter(e.target.value)}
                        placeholder="Buscar telefone..."
                        className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Profissional
                      </label>
                      <select
                        value={professionalFilter}
                        onChange={(e) => setProfessionalFilter(e.target.value)}
                        className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      >
                        <option value="">Todas as profissionais</option>
                        {getUniqueProfessionals().map((prof) => (
                          <option key={prof} value={prof}>
                            {prof}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Serviço
                      </label>
                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      >
                        <option value="">Todos os serviços</option>
                        {getUniqueServices().map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Data
                      </label>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Horário
                      </label>
                      <input
                        type="text"
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        placeholder="Ex: 14:00"
                        className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Duração
                      </label>
                      <select
                        value={durationFilter}
                        onChange={(e) => setDurationFilter(e.target.value)}
                        className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      >
                        <option value="">Todas as durações</option>
                        {getUniqueDurations().map((duration) => (
                          <option key={duration} value={duration}>
                            {duration}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-200 sm:text-sm">
                        Criado em
                      </label>
                      <input
                        type="date"
                        value={createdAtFilter}
                        onChange={(e) => setCreatedAtFilter(e.target.value)}
                        className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela e botão de exportação */}
              <div className="rounded-2xl border border-gold-400/20 bg-dark-700 p-4 sm:rounded-3xl sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-100 sm:text-lg">
                    Base geral de agendamentos
                  </h3>
                  <button
                    type="button"
                    onClick={exportToCSV}
                    className="inline-flex items-center rounded-full bg-gold-400/100 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gold-300 sm:px-4 sm:text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Exportar CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Cliente
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Telefone
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Profissional
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Serviço
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Data
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Horário
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Duração
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Criado em
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-300 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getFilteredAppointments().length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-6 text-center text-sm text-gray-300"
                          >
                            Nenhum agendamento encontrado com os filtros
                            aplicados.
                          </td>
                        </tr>
                      ) : (
                        getFilteredAppointments().map((appointment) => (
                          <tr key={appointment.id}>
                            <td className="px-4 py-3">
                              {appointment.clientName}
                            </td>
                            <td className="px-4 py-3">{appointment.phone}</td>
                            <td className="px-4 py-3">
                              {appointment.professionalName}
                            </td>
                            <td className="px-4 py-3">
                              {appointment.serviceName}
                            </td>
                            <td className="px-4 py-3">{appointment.date}</td>
                            <td className="px-4 py-3">{appointment.time}</td>
                            <td className="px-4 py-3">
                              {getServiceDuration(appointment)}
                            </td>
                            <td className="px-4 py-3">
                              {formatCreatedAt(appointment.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleBlockClient(appointment)}
                                  className="text-sm font-medium text-gray-200 hover:text-black"
                                >
                                  Bloquear
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteAppointment(appointment.id)
                                  }
                                  className="text-sm font-medium text-red-600 hover:text-red-800"
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Profissional */}
      {showProfessionalModal && (
        <ProfessionalModal
          professional={editingProfessional}
          initialTab={professionalModalInitialTab}
          onSave={handleSaveProfessional}
          onClose={() => {
            setShowProfessionalModal(false);
            setEditingProfessional(null);
          }}
        />
      )}

      {/* Modal de Serviço */}
      {showServiceModal && selectedProfessional && (
        <ServiceModal
          service={editingService}
          onSave={handleSaveService}
          onClose={() => {
            setShowServiceModal(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
};

export default Admin;
