export type BusinessSegmentId = 'beauty' | 'health' | 'services';
export type LayoutVariant = 'beauty' | 'health' | 'services';

export interface TemplateDemoService {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
}

export interface TemplateDemoProfessional {
  id: string;
  name: string;
  specialty: string;
  services: TemplateDemoService[];
}

export interface BusinessSegment {
  id: BusinessSegmentId;
  label: string;
  description: string;
  niches: string[];
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  layoutVariant: LayoutVariant;
  demoProfessionals: TemplateDemoProfessional[];
  featuredServices: TemplateDemoService[];
  siteText: {
    siteName: string;
    footerDescription: string;
    servicesBadge: string;
    servicesTitle: string;
    servicesSubtitle: string;
    header: {
      browserTitleSuffix: string;
      navHome: string;
      navProfessionals: string;
      navServices: string;
      navBooking: string;
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
  };
}

export const DEFAULT_SEGMENT_ID: BusinessSegmentId = 'beauty';

export const businessSegments: BusinessSegment[] = [
  {
    id: 'beauty',
    label: 'Beauty',
    description: 'Elegante, suave e acolhedor para beleza, estética, salão, barbearia e lash.',
    niches: ['Salão de beleza', 'Barbearia', 'Lash designer', 'Estética', 'Sobrancelhas'],
    heroTitle: 'Agendamentos elegantes para negócios de beleza',
    heroSubtitle:
      'Uma vitrine demonstrativa para apresentar profissionais, serviços e horários com uma experiência acolhedora e comercial.',
    ctaText: 'Criar experiência de agendamento para beleza',
    layoutVariant: 'beauty',
    demoProfessionals: [
      {
        id: 'demo-beauty-1',
        name: 'Especialista em Beleza',
        specialty: 'Cortes, finalização e consultoria',
        services: [
          {
            id: 'demo-beauty-service-1',
            name: 'Corte e finalização',
            description: 'Atendimento demonstrativo para corte, escova e acabamento.',
            duration: '60 min',
            price: 'R$ 90',
          },
          {
            id: 'demo-beauty-service-2',
            name: 'Limpeza de pele',
            description: 'Serviço demo para estética facial e cuidado personalizado.',
            duration: '75 min',
            price: 'R$ 140',
          },
        ],
      },
      {
        id: 'demo-beauty-2',
        name: 'Designer de Sobrancelhas',
        specialty: 'Design, henna e lash',
        services: [
          {
            id: 'demo-beauty-service-3',
            name: 'Design de sobrancelhas',
            description: 'Modelo de serviço para design, alinhamento e acabamento.',
            duration: '45 min',
            price: 'R$ 60',
          },
          {
            id: 'demo-beauty-service-4',
            name: 'Extensão de cílios',
            description: 'Exemplo de atendimento para lash e manutenção.',
            duration: '90 min',
            price: 'R$ 180',
          },
        ],
      },
      {
        id: 'demo-beauty-3',
        name: 'Barbeiro',
        specialty: 'Corte masculino e barba',
        services: [
          {
            id: 'demo-beauty-service-5',
            name: 'Corte masculino',
            description: 'Exemplo de serviço rápido para agenda de barbearia.',
            duration: '45 min',
            price: 'R$ 55',
          },
          {
            id: 'demo-beauty-service-6',
            name: 'Barba',
            description: 'Atendimento demo para barba, acabamento e cuidado.',
            duration: '30 min',
            price: 'R$ 40',
          },
        ],
      },
    ],
    featuredServices: [
      {
        id: 'featured-beauty-1',
        name: 'Corte',
        description: 'Serviço demonstrativo para agenda de salão ou barbearia.',
        duration: '60 min',
        price: 'R$ 90',
      },
      {
        id: 'featured-beauty-2',
        name: 'Barba',
        description: 'Atendimento demo com duração curta e fluxo objetivo.',
        duration: '30 min',
        price: 'R$ 40',
      },
      {
        id: 'featured-beauty-3',
        name: 'Limpeza de pele',
        description: 'Exemplo para clínicas de estética e cuidados faciais.',
        duration: '75 min',
        price: 'R$ 140',
      },
      {
        id: 'featured-beauty-4',
        name: 'Extensão de cílios',
        description: 'Serviço demo para lash designer e manutenção.',
        duration: '90 min',
        price: 'R$ 180',
      },
    ],
    siteText: {
      siteName: 'Studio Demo Beauty',
      footerDescription:
        'Template demonstrativo para negócios de beleza que precisam apresentar serviços, profissionais e horários de forma elegante.',
      servicesBadge: 'Serviços demo',
      servicesTitle: 'Atendimentos em destaque',
      servicesSubtitle:
        'Exemplos fictícios para demonstrar como a vitrine pode ficar para salão, estética, lash ou barbearia.',
      header: {
        browserTitleSuffix: 'Agendamento para Beauty',
        navHome: 'Início',
        navProfessionals: 'Especialistas',
        navServices: 'Serviços',
        navBooking: 'Agendar',
      },
      home: {
        heroBadge: 'Template demonstrativo Beauty',
        heroTitleStart: 'Uma agenda elegante para',
        heroTitleHighlight: 'beleza',
        heroTitleEnd: 'e estética',
        heroSubtitle:
          'Mostre serviços, especialistas e horários disponíveis em uma experiência suave, acolhedora e pronta para personalizar.',
        professionalsBadge: 'Equipe demo',
        professionalsTitle: 'Especialistas em destaque',
        professionalsSubtitle:
          'Cards fictícios para demonstrar como profissionais de beleza, estética, lash e barbearia aparecem no site.',
        ctaTitle: 'Agendamento simples para o cliente final',
        ctaSubtitle:
          'O cliente escolhe profissional, serviço, data e horário em poucos passos. Tudo ainda funciona localmente para demonstração.',
      },
    },
  },
  {
    id: 'health',
    label: 'Health',
    description: 'Limpo, confiável e calmo para saúde, bem-estar e acompanhamento profissional.',
    niches: ['Psicologia', 'Nutrição', 'Personal trainer', 'Fisioterapia', 'Bem-estar'],
    heroTitle: 'Agenda clara para atendimentos de saúde e bem-estar',
    heroSubtitle:
      'Um modelo organizado para demonstrar consultas, sessões e acompanhamentos com tom profissional e tranquilo.',
    ctaText: 'Criar experiência de agendamento para saúde',
    layoutVariant: 'health',
    demoProfessionals: [
      {
        id: 'demo-health-1',
        name: 'Psicólogo',
        specialty: 'Sessões individuais',
        services: [
          {
            id: 'demo-health-service-1',
            name: 'Consulta inicial',
            description: 'Exemplo de primeiro atendimento para entender a demanda.',
            duration: '50 min',
            price: 'R$ 180',
          },
          {
            id: 'demo-health-service-2',
            name: 'Sessão de acompanhamento',
            description: 'Serviço demo para acompanhamento recorrente.',
            duration: '50 min',
            price: 'R$ 180',
          },
        ],
      },
      {
        id: 'demo-health-2',
        name: 'Nutricionista',
        specialty: 'Avaliação e plano alimentar',
        services: [
          {
            id: 'demo-health-service-3',
            name: 'Avaliação nutricional',
            description: 'Exemplo para consulta com análise e objetivos.',
            duration: '60 min',
            price: 'R$ 220',
          },
          {
            id: 'demo-health-service-4',
            name: 'Retorno',
            description: 'Atendimento demo para acompanhamento do plano.',
            duration: '40 min',
            price: 'R$ 140',
          },
        ],
      },
      {
        id: 'demo-health-3',
        name: 'Fisioterapeuta',
        specialty: 'Reabilitação e movimento',
        services: [
          {
            id: 'demo-health-service-5',
            name: 'Avaliação funcional',
            description: 'Serviço demonstrativo para entender quadro e metas.',
            duration: '60 min',
            price: 'R$ 190',
          },
          {
            id: 'demo-health-service-6',
            name: 'Sessão de fisioterapia',
            description: 'Exemplo de sessão recorrente de reabilitação.',
            duration: '50 min',
            price: 'R$ 160',
          },
        ],
      },
    ],
    featuredServices: [
      {
        id: 'featured-health-1',
        name: 'Consulta',
        description: 'Modelo para atendimentos individuais com horário reservado.',
        duration: '50 min',
        price: 'R$ 180',
      },
      {
        id: 'featured-health-2',
        name: 'Avaliação',
        description: 'Exemplo para primeira consulta, triagem ou avaliação física.',
        duration: '60 min',
        price: 'R$ 220',
      },
      {
        id: 'featured-health-3',
        name: 'Sessão',
        description: 'Fluxo demonstrativo para sessões recorrentes.',
        duration: '50 min',
        price: 'R$ 160',
      },
      {
        id: 'featured-health-4',
        name: 'Acompanhamento',
        description: 'Exemplo para planos e evolução contínua do cliente.',
        duration: '40 min',
        price: 'R$ 140',
      },
    ],
    siteText: {
      siteName: 'Clínica Demo Health',
      footerDescription:
        'Template demonstrativo para profissionais de saúde, bem-estar e acompanhamento com agenda clara e confiável.',
      servicesBadge: 'Atendimentos demo',
      servicesTitle: 'Consultas e sessões',
      servicesSubtitle:
        'Dados fictícios para demonstrar uma agenda de saúde com leitura limpa, tranquila e profissional.',
      header: {
        browserTitleSuffix: 'Agendamento para Health',
        navHome: 'Início',
        navProfessionals: 'Profissionais',
        navServices: 'Atendimentos',
        navBooking: 'Agendar',
      },
      home: {
        heroBadge: 'Template demonstrativo Health',
        heroTitleStart: 'Agendamento claro para',
        heroTitleHighlight: 'saúde',
        heroTitleEnd: 'e bem-estar',
        heroSubtitle:
          'Uma experiência limpa para apresentar consultas, sessões e horários com organização, confiança e calma.',
        professionalsBadge: 'Profissionais demo',
        professionalsTitle: 'Especialidades disponíveis',
        professionalsSubtitle:
          'Exemplos fictícios para psicologia, nutrição, fisioterapia, personal trainer e outras áreas de cuidado.',
        ctaTitle: 'Um fluxo simples para consultas e sessões',
        ctaSubtitle:
          'A demonstração mantém o agendamento local, sem backend real, pronta para ser conectada depois em uma cópia do projeto.',
      },
    },
  },
  {
    id: 'services',
    label: 'Services',
    description: 'Direto, sólido e versátil para prestadores de serviço e atendimentos especializados.',
    niches: ['Tatuagem', 'Podologia', 'Massoterapia', 'Consultoria', 'Serviços locais'],
    heroTitle: 'Agenda prática para serviços especializados',
    heroSubtitle:
      'Um template objetivo para demonstrar disponibilidade, tipos de atendimento e operação diária.',
    ctaText: 'Criar experiência de agendamento para serviços',
    layoutVariant: 'services',
    demoProfessionals: [
      {
        id: 'demo-services-1',
        name: 'Tatuador',
        specialty: 'Sessões e orçamento',
        services: [
          {
            id: 'demo-services-service-1',
            name: 'Avaliação de projeto',
            description: 'Exemplo para briefing, orçamento e definição de agenda.',
            duration: '45 min',
            price: 'R$ 80',
          },
          {
            id: 'demo-services-service-2',
            name: 'Sessão de tatuagem',
            description: 'Serviço demo para atendimento com duração maior.',
            duration: '120 min',
            price: 'R$ 350',
          },
        ],
      },
      {
        id: 'demo-services-2',
        name: 'Podólogo',
        specialty: 'Atendimento preventivo',
        services: [
          {
            id: 'demo-services-service-3',
            name: 'Atendimento podológico',
            description: 'Exemplo de procedimento com horário reservado.',
            duration: '60 min',
            price: 'R$ 130',
          },
          {
            id: 'demo-services-service-4',
            name: 'Avaliação',
            description: 'Serviço demonstrativo para primeiro contato.',
            duration: '30 min',
            price: 'R$ 60',
          },
        ],
      },
      {
        id: 'demo-services-3',
        name: 'Massoterapeuta',
        specialty: 'Massagem e relaxamento',
        services: [
          {
            id: 'demo-services-service-5',
            name: 'Sessão relaxante',
            description: 'Exemplo para massoterapia e bem-estar.',
            duration: '60 min',
            price: 'R$ 150',
          },
          {
            id: 'demo-services-service-6',
            name: 'Procedimento especializado',
            description: 'Serviço demo para atendimentos personalizados.',
            duration: '75 min',
            price: 'R$ 190',
          },
        ],
      },
    ],
    featuredServices: [
      {
        id: 'featured-services-1',
        name: 'Sessão',
        description: 'Atendimento demonstrativo para serviços com duração definida.',
        duration: '60 min',
        price: 'R$ 150',
      },
      {
        id: 'featured-services-2',
        name: 'Avaliação',
        description: 'Exemplo para orçamento, triagem ou primeiro contato.',
        duration: '30 min',
        price: 'R$ 60',
      },
      {
        id: 'featured-services-3',
        name: 'Atendimento',
        description: 'Modelo versátil para prestadores que recebem por horário.',
        duration: '60 min',
        price: 'R$ 130',
      },
      {
        id: 'featured-services-4',
        name: 'Procedimento',
        description: 'Exemplo para serviços especializados e agenda operacional.',
        duration: '75 min',
        price: 'R$ 190',
      },
    ],
    siteText: {
      siteName: 'Agenda Demo Services',
      footerDescription:
        'Template demonstrativo para prestadores de serviço que precisam organizar disponibilidade, clientes e atendimentos.',
      servicesBadge: 'Serviços demo',
      servicesTitle: 'Tipos de atendimento',
      servicesSubtitle:
        'Exemplos fictícios para demonstrar como serviços variados podem ser apresentados em uma agenda comercial.',
      header: {
        browserTitleSuffix: 'Agendamento para Services',
        navHome: 'Início',
        navProfessionals: 'Especialistas',
        navServices: 'Serviços',
        navBooking: 'Agendar',
      },
      home: {
        heroBadge: 'Template demonstrativo Services',
        heroTitleStart: 'Uma agenda prática para',
        heroTitleHighlight: 'serviços',
        heroTitleEnd: 'sob demanda',
        heroSubtitle:
          'Mostre profissionais, tipos de atendimento e disponibilidade em um layout direto, sólido e fácil de adaptar.',
        professionalsBadge: 'Equipe demo',
        professionalsTitle: 'Prestadores em destaque',
        professionalsSubtitle:
          'Dados fictícios para tatuadores, podólogos, massoterapeutas e outros profissionais de atendimento local.',
        ctaTitle: 'Organize atendimentos sem complicar',
        ctaSubtitle:
          'O cliente escolhe o serviço e agenda um horário disponível. O template segue local/demo até você conectar uma base real.',
      },
    },
  },
];

export const getBusinessSegment = (value?: string | null): BusinessSegment =>
  businessSegments.find((segment) => segment.id === value) ||
  businessSegments.find((segment) => segment.id === DEFAULT_SEGMENT_ID) ||
  businessSegments[0];
