import { defaultSiteConfig, normalizeSiteConfig } from '../content/siteContent';

export type Row = Record<string, any>;
export type Db = Record<string, Row[]>;

const STORAGE_KEY = 'template_agendamento_local_database_v1';
const FILE_STORAGE_KEY = 'template_agendamento_local_files_v1';
const SITE_CONFIG_ROW_ID = 'template-site-config';

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const now = () => new Date().toISOString();


const DEMO_PROFESSIONALS: Row[] = [
  {
    id: 'demo-ana-clara',
    name: 'Ana Clara',
    specialty: 'Especialista em Beleza',
    photo_url: null,
    image: null,
    active: true,
    status: 'active',
    whatsapp_message: 'Olá! Seu agendamento com Ana Clara foi confirmado.',
    allow_simultaneous_appointments: false,
    created_at: now(),
  },
  {
    id: 'demo-beatriz-souza',
    name: 'Beatriz Souza',
    specialty: 'Manicure e Estética',
    photo_url: null,
    image: null,
    active: true,
    status: 'active',
    whatsapp_message: 'Olá! Seu agendamento com Beatriz Souza foi confirmado.',
    allow_simultaneous_appointments: false,
    created_at: now(),
  },
  {
    id: 'demo-camila-rocha',
    name: 'Camila Rocha',
    specialty: 'Maquiadora',
    photo_url: null,
    image: null,
    active: true,
    status: 'active',
    whatsapp_message: 'Olá! Seu agendamento com Camila Rocha foi confirmado.',
    allow_simultaneous_appointments: false,
    created_at: now(),
  },
];

const DEMO_SERVICES: Row[] = [
  { id: 'demo-service-ana-corte', professional_id: 'demo-ana-clara', name: 'Corte e Escova', duration: 60, price: 80, active: true, status: 'active', created_at: now() },
  { id: 'demo-service-ana-coloracao', professional_id: 'demo-ana-clara', name: 'Coloração', duration: 120, price: 150, active: true, status: 'active', created_at: now() },
  { id: 'demo-service-ana-maquiagem', professional_id: 'demo-ana-clara', name: 'Maquiagem', duration: 90, price: 120, active: true, status: 'active', created_at: now() },
  { id: 'demo-service-beatriz-manicure', professional_id: 'demo-beatriz-souza', name: 'Manicure', duration: 45, price: 40, active: true, status: 'active', created_at: now() },
  { id: 'demo-service-beatriz-maquiagem', professional_id: 'demo-beatriz-souza', name: 'Maquiagem', duration: 90, price: 120, active: true, status: 'active', created_at: now() },
  { id: 'demo-service-camila-maquiagem', professional_id: 'demo-camila-rocha', name: 'Maquiagem', duration: 90, price: 120, active: true, status: 'active', created_at: now() },
];

const createDemoWeeklySchedule = () => {
  const weekdays = [
    { weekday: 'monday', day: 1, enabled: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { weekday: 'tuesday', day: 2, enabled: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { weekday: 'wednesday', day: 3, enabled: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { weekday: 'thursday', day: 4, enabled: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { weekday: 'friday', day: 5, enabled: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { weekday: 'saturday', day: 6, enabled: true, start: '08:00', end: '12:00', lunchStart: null, lunchEnd: null },
    { weekday: 'sunday', day: 0, enabled: false, start: '09:00', end: '14:00', lunchStart: null, lunchEnd: null },
  ];

  return DEMO_PROFESSIONALS.flatMap((professional) =>
    weekdays.map((rule) => ({
      id: `demo-weekly-${professional.id}-${rule.weekday}`,
      professional_id: professional.id,
      weekday: rule.day,
      week_day: rule.weekday,
      day_of_week: rule.weekday,
      day: rule.weekday,
      enabled: rule.enabled,
      start: rule.start,
      end: rule.end,
      start_time: rule.start,
      end_time: rule.end,
      interval_minutes: 30,
      has_lunch_break: Boolean(rule.lunchStart && rule.lunchEnd),
      lunch_start: rule.lunchStart,
      lunch_end: rule.lunchEnd,
      created_at: now(),
    })),
  );
};

const defaultDb = (): Db => ({
  professionals: DEMO_PROFESSIONALS,
  services: DEMO_SERVICES,
  appointments: [],
  weekly_schedule: createDemoWeeklySchedule(),
  schedule_blocks: [],
  blocked_clients: [],
  clients: [],
  client_packages: [],
  package_sessions: [],
  site_config: [
    {
      id: SITE_CONFIG_ROW_ID,
      config: {
        siteConfig: defaultSiteConfig,
      },
      updated_at: now(),
    },
  ],
});

const ensureTables = (db: Partial<Db>): Db => {
  const fallback = defaultDb();
  return Object.keys(fallback).reduce<Db>((result, table) => {
    result[table] = Array.isArray(db[table]) ? [...(db[table] as Row[])] : fallback[table];
    return result;
  }, {} as Db);
};


const seedDemoDataIfEmpty = (db: Db) => {
  const hasProfessionals = Array.isArray(db.professionals) && db.professionals.length > 0;
  const hasServices = Array.isArray(db.services) && db.services.length > 0;

  if (!hasProfessionals) db.professionals = [...DEMO_PROFESSIONALS];
  if (!hasServices) db.services = [...DEMO_SERVICES];

  if (!Array.isArray(db.weekly_schedule) || db.weekly_schedule.length === 0) {
    db.weekly_schedule = createDemoWeeklySchedule();
  }

  return db;
};

const normalizeStoredDb = (db: Db) => {
  seedDemoDataIfEmpty(db);

  db.site_config = (db.site_config || []).map((item) => {
    const siteConfig = item.config?.siteConfig;
    if (!siteConfig) return item;

    return {
      ...item,
      config: {
        ...item.config,
        siteConfig: normalizeSiteConfig(siteConfig),
      },
    };
  });

  return db;
};

const readDb = (): Db => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      const seeded = normalizeStoredDb(defaultDb());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = normalizeStoredDb(ensureTables(JSON.parse(raw)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return normalizeStoredDb(defaultDb());
  }
};

const writeDb = (db: Db) => localStorage.setItem(STORAGE_KEY, JSON.stringify(ensureTables(db)));

const getFiles = () => {
  try {
    return JSON.parse(localStorage.getItem(FILE_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveFiles = (files: Record<string, string>) =>
  localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(files));

const normalize = (value: any) => (value === undefined || value === null ? value : String(value));

const valueForColumn = (row: Row, column: string) => {
  if (column === 'weekday' && row.weekday === undefined) return row.week_day;
  if (column === 'week_day' && row.week_day === undefined) return row.weekday;
  return row[column];
};

const matches = (row: Row, filter: { type: string; column: string; value: any }) => {
  const current = valueForColumn(row, filter.column);

  if (filter.type === 'eq') return normalize(current) === normalize(filter.value);
  if (filter.type === 'neq') return normalize(current) !== normalize(filter.value);
  if (filter.type === 'not_in') {
    const values = String(filter.value)
      .replace(/[()]/g, '')
      .split(',')
      .map((value) => value.trim());
    return !values.includes(String(current));
  }

  return true;
};

const withRelations = (table: string, rows: Row[], db: Db) => {
  if (table !== 'appointments') return rows;

  return rows.map((appointment) => ({
    ...appointment,
    professionals:
      db.professionals.find((professional) => normalize(professional.id) === normalize(appointment.professional_id)) ||
      null,
    services:
      db.services.find((service) => normalize(service.id) === normalize(appointment.service_id)) ||
      null,
  }));
};

type QueryResult = { data: any; error: any };

class LocalQuery implements PromiseLike<QueryResult> {
  private filters: { type: string; column: string; value: any }[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private mode: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private singleMode: 'single' | 'maybeSingle' | null = null;
  private returning = false;
  private maxRows: number | null = null;

  constructor(private table: string) {}

  select(_columns?: string) {
    this.returning = true;
    return this;
  }

  insert(payload: any) {
    this.mode = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.mode = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  upsert(payload: any) {
    this.mode = 'upsert';
    this.payload = payload;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'in') this.filters.push({ type: 'not_in', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.maxRows = count;
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this;
  }

  private run(): Promise<QueryResult> {
    const db = readDb();
    db[this.table] = db[this.table] || [];
    let data: any = null;

    if (this.mode === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = items.map((item) => ({ id: item.id || uuid(), created_at: item.created_at || now(), ...item }));
      db[this.table].push(...inserted);
      writeDb(db);
      data = inserted;
    } else if (this.mode === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const saved = items.map((item) => {
        const id = item.id || uuid();
        const index = db[this.table].findIndex((row) => normalize(row.id) === normalize(id));
        const next = { ...(index >= 0 ? db[this.table][index] : {}), ...item, id, updated_at: now() };
        if (index >= 0) db[this.table][index] = next;
        else db[this.table].push({ created_at: now(), ...next });
        return next;
      });
      writeDb(db);
      data = saved;
    } else if (this.mode === 'update') {
      const updated: Row[] = [];
      db[this.table] = db[this.table].map((row) => {
        if (this.filters.every((filter) => matches(row, filter))) {
          const next = { ...row, ...this.payload, updated_at: now() };
          updated.push(next);
          return next;
        }
        return row;
      });
      writeDb(db);
      data = updated;
    } else if (this.mode === 'delete') {
      const removed: Row[] = [];
      db[this.table] = db[this.table].filter((row) => {
        const shouldRemove = this.filters.length === 0 || this.filters.every((filter) => matches(row, filter));
        if (shouldRemove) removed.push(row);
        return !shouldRemove;
      });
      writeDb(db);
      data = removed;
    } else {
      data = db[this.table].filter((row) => this.filters.every((filter) => matches(row, filter)));
    }

    data = withRelations(this.table, Array.isArray(data) ? data : [data].filter(Boolean), db);

    for (const order of [...this.orders].reverse()) {
      data.sort((a: Row, b: Row) => {
        const av = valueForColumn(a, order.column) ?? '';
        const bv = valueForColumn(b, order.column) ?? '';
        return order.ascending ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }

    if (this.maxRows !== null) data = data.slice(0, this.maxRows);
    if (this.singleMode) data = data[0] || null;
    else if ((this.mode === 'insert' || this.mode === 'update' || this.mode === 'upsert') && this.returning && !Array.isArray(this.payload)) {
      data = data[0] || null;
    }

    return Promise.resolve({ data, error: null });
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

export const localDataClient = {
  from(table: string) {
    return new LocalQuery(table);
  },
  storage: {
    from(_bucket: string) {
      return {
        async upload(path: string, file: File, _options?: Record<string, unknown>) {
          const files = getFiles();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          files[path] = dataUrl;
          saveFiles(files);
          return { data: { path }, error: null };
        },
        getPublicUrl(path: string) {
          const files = getFiles();
          return { data: { publicUrl: files[path] || path } };
        },
      };
    },
  },
};

export const clearLocalDatabase = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb()));
  localStorage.removeItem(FILE_STORAGE_KEY);
};
