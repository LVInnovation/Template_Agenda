import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCallback } from 'react'
import { localDataClient } from '../services/localDatabase'
import { DEFAULT_PROFESSIONAL_IMAGE, DEFAULT_WHATSAPP_TEMPLATE } from '../config/appConfig'

interface Professional {
  id: string | number
  name: string
  specialty?: string
  status?: string
  image?: string
  whatsappMessage?: string
}

interface Service {
  id: string | number
  professionalId: string | number
  name: string
  duration: string
}

interface Appointment {
  id: string
  clientName: string
  phone: string
  professionalId: string | number
  serviceId: string | number
  serviceName: string
  date: string
  time: string
  duration: string
  status: string
}

interface ScheduleBlock {
  id: string
  professionalId: string | number
  date: string
  type: 'full-day' | 'time-range'
  startTime: string
  endTime: string
  reason: string
}

type DatabaseScheduleBlock = {
  id: string
  professional_id: string
  block_date: string | null
  start_time: string | null
  end_time: string | null
  reason: string | null
}

type DatabaseAppointment = {
  id: string
  client_name: string | null
  client_phone?: string | null
  phone: string | null
  professional_id: string
  service_id: string | null
  appointment_date: string
  appointment_time: string
  status?: string | null
  services?: { name: string | null; duration: number | string | null } | null
}

const DEFAULT_IMAGE = DEFAULT_PROFESSIONAL_IMAGE

const formatInputDate = (date: Date) => date.toISOString().slice(0, 10)

const timeToMinutes = (time = '00:00') => {
  const [hours = '0', minutes = '0'] = time.split(':')
  return Number(hours) * 60 + Number(minutes)
}

const durationToMinutes = (duration?: string) => {
  const value = Number(String(duration || '').replace(/\D/g, ''))
  return Number.isFinite(value) && value > 0 ? value : 60
}

const normalizePhone = (value: string) => String(value || '').replace(/\D/g, '')

const isCanceledStatus = (status?: string | null) => {
  const normalized = String(status || '').toLowerCase()
  return normalized === 'cancelado' || normalized === 'canceled'
}

const formatDateTitle = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
    .format(date)
    .replace('.', '')
    .replace(/ de /g, '/')
}


const formatShortDate = (value: string) => {
  if (!value) return 'Selecionar data'

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace('.', '')
    .replace(/ de /g, '/')
}

const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'confirmado':
    case 'confirmed':
      return 'border-gold-400 bg-gold-400/15'
    case 'cancelado':
    case 'canceled':
      return 'border-red-500 bg-red-100'
    default:
      return 'border-gold-400/20 bg-dark-700'
  }
}

const fillTemplate = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce(
    (message, [key, value]) => message.split(`{${key}}`).join(value),
    template,
  )

const Agenda = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([])
  const [selectedDate, setSelectedDate] = useState(formatInputDate(new Date()))
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editServiceId, setEditServiceId] = useState<string | number>('')
  const [editStatus, setEditStatus] = useState('agendado')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [manualBooking, setManualBooking] = useState<{
    professionalId: string | number
    date: string
    time: string
  } | null>(null)
  const [manualClientName, setManualClientName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualServiceId, setManualServiceId] = useState<string | number>('')
  const [manualError, setManualError] = useState('')
  const [isSavingManual, setIsSavingManual] = useState(false)

  const startHour = 8
  const endHour = 21
  const slotHeight = 44
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60
  const agendaHeight = ((endMinutes - startMinutes) / 30) * slotHeight

  const times = Array.from(
    { length: (endHour - startHour) * 2 + 1 },
    (_, index) => {
      const totalMinutes = startMinutes + index * 30
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    },
  )

  const loadAgenda = useCallback(async () => {
    try {
      setLoading(true)
      setMessage('')

      const [
        professionalsResponse,
        servicesResponse,
        appointmentsResponse,
        scheduleBlocksResponse,
      ] = await Promise.all([
        localDataClient
          .from('professionals')
          .select('id,name,specialty,status,image,photo_url,whatsapp_message')
          .eq('status', 'active')
          .order('created_at', { ascending: true }),

        localDataClient
          .from('services')
          .select('id,professional_id,name,duration')
          .order('name', { ascending: true }),

        localDataClient
          .from('appointments')
          .select(`
            id,
            client_name,
            phone,
            client_phone,
            professional_id,
            service_id,
            appointment_date,
            appointment_time,
            status,
            services(name,duration)
          `)
          .eq('appointment_date', selectedDate)
          .not('status', 'in', '(cancelado,canceled)')
          .order('appointment_time', { ascending: true }),

        localDataClient
          .from('schedule_blocks')
          .select('id,professional_id,block_date,start_time,end_time,reason')
          .eq('block_date', selectedDate),
      ])

      if (professionalsResponse.error) throw professionalsResponse.error
      if (servicesResponse.error) throw servicesResponse.error
      if (appointmentsResponse.error) throw appointmentsResponse.error
      if (scheduleBlocksResponse.error) throw scheduleBlocksResponse.error

      setProfessionals(
        (professionalsResponse.data || []).map((professional: any) => ({
          id: professional.id,
          name: professional.name,
          specialty: professional.specialty || '',
          status: professional.status || 'active',
          image: professional.image || professional.photo_url || DEFAULT_IMAGE,
          whatsappMessage: professional.whatsapp_message || '',
        })),
      )

      setServices(
        (servicesResponse.data || []).map((service: any) => ({
          id: service.id,
          professionalId: service.professional_id,
          name: service.name,
          duration: service.duration ? `${service.duration} min` : '60 min',
        })),
      )

      setAppointments(
        ((appointmentsResponse.data || []) as unknown as DatabaseAppointment[])
          .filter((appointment) => !isCanceledStatus(appointment.status))
          .map((appointment) => ({
            id: appointment.id,
            clientName: appointment.client_name || '',
            phone: appointment.phone || appointment.client_phone || '',
            professionalId: appointment.professional_id,
            serviceId: appointment.service_id || '',
            serviceName: appointment.services?.name || '',
            date: appointment.appointment_date,
            time: appointment.appointment_time?.slice(0, 5) || '',
            duration: appointment.services?.duration
              ? `${appointment.services.duration} min`
              : '60 min',
            status: appointment.status || 'agendado',
          })),
      )

      setScheduleBlocks(
        ((scheduleBlocksResponse.data || []) as DatabaseScheduleBlock[]).map(
          (block) => ({
            id: block.id,
            professionalId: block.professional_id,
            date: block.block_date || selectedDate,
            type: block.start_time && block.end_time ? 'time-range' : 'full-day',
            startTime: block.start_time?.slice(0, 5) || '',
            endTime: block.end_time?.slice(0, 5) || '',
            reason: block.reason || 'Bloqueado',
          }),
        ),
      )
    } catch (error) {
      console.error('Erro ao carregar agenda:', error)
      setProfessionals([])
      setAppointments([])
      setScheduleBlocks([])
      setMessage('Erro ao carregar agenda local.')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    loadAgenda()
  }, [loadAgenda])

  const openAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setEditDate(appointment.date)
    setEditTime(appointment.time)
    setEditServiceId(appointment.serviceId)
    setEditStatus(appointment.status || 'agendado')
  }

  const closeModal = () => {
    setSelectedAppointment(null)
    setEditDate('')
    setEditTime('')
    setEditServiceId('')
    setEditStatus('agendado')
  }

  const saveAppointmentChanges = async () => {
    if (!selectedAppointment) return

    try {
      if (isCanceledStatus(editStatus)) {
        const { error } = await localDataClient
          .from('appointments')
          .delete()
          .eq('id', selectedAppointment.id)

        if (error) throw error

        closeModal()
        await loadAgenda()
        setMessage('Agendamento cancelado, apagado e horário liberado.')
        return
      }

      const { error } = await localDataClient
        .from('appointments')
        .update({
          appointment_date: editDate,
          appointment_time: editTime,
          service_id: editServiceId,
          status: editStatus,
        })
        .eq('id', selectedAppointment.id)

      if (error) throw error

      closeModal()
      setSelectedDate(editDate)
      await loadAgenda()
    } catch (error) {
      console.error('Erro ao alterar agendamento:', error)
      setMessage('Erro ao alterar agendamento.')
    }
  }

  const deleteAppointment = async () => {
    if (!selectedAppointment) return
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return

    try {
      const { error } = await localDataClient
        .from('appointments')
        .delete()
        .eq('id', selectedAppointment.id)

      if (error) throw error

      closeModal()
      await loadAgenda()
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error)
      setMessage('Erro ao excluir agendamento.')
    }
  }

  const openWhatsApp = () => {
    if (!selectedAppointment?.phone) {
      setMessage('Cliente sem telefone cadastrado.')
      return
    }

    const phone = selectedAppointment.phone.replace(/\D/g, '')
    if (!phone) {
      setMessage('Telefone da cliente inválido.')
      return
    }

    const professional = professionals.find(
      (item) => String(item.id) === String(selectedAppointment.professionalId),
    )

    const professionalName = professional?.name || 'Profissional'
    const defaultTemplate = DEFAULT_WHATSAPP_TEMPLATE

    const text = fillTemplate(professional?.whatsappMessage || defaultTemplate, {
      cliente: selectedAppointment.clientName,
      profissional: professionalName,
      servico: selectedAppointment.serviceName,
      data: formatDateTitle(selectedAppointment.date),
      hora: selectedAppointment.time,
    })

    const whatsappPhone = phone.startsWith('55') ? phone : `55${phone}`

    window.open(
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(text)}`,
      '_blank',
    )
  }

  const moveDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() + days)
    setSelectedDate(formatInputDate(date))
  }

  const getBlockPosition = (block: ScheduleBlock) => {
    if (block.type === 'full-day') {
      return {
        top: 0,
        height: agendaHeight,
        label: 'Dia inteiro',
      }
    }

    const blockStart = timeToMinutes(block.startTime)
    const blockEnd = timeToMinutes(block.endTime)
    const visibleStart = Math.max(blockStart, startMinutes)
    const visibleEnd = Math.min(blockEnd, endMinutes)
    const top = Math.max(0, ((visibleStart - startMinutes) / 30) * slotHeight)
    const height = Math.max(42, ((visibleEnd - visibleStart) / 30) * slotHeight - 4)

    return {
      top,
      height,
      label: `${block.startTime} às ${block.endTime}`,
    }
  }


  const openManualBooking = (professional: Professional, time: string) => {
    const firstService = services.find(
      (service) => String(service.professionalId) === String(professional.id),
    )

    setManualBooking({
      professionalId: professional.id,
      date: selectedDate,
      time,
    })
    setManualClientName('')
    setManualPhone('')
    setManualServiceId(firstService?.id || '')
    setManualError('')
  }

  const closeManualBooking = () => {
    setManualBooking(null)
    setManualClientName('')
    setManualPhone('')
    setManualServiceId('')
    setManualError('')
    setIsSavingManual(false)
  }

  const saveManualBooking = async () => {
    if (!manualBooking) return

    const professional = professionals.find(
      (item) => String(item.id) === String(manualBooking.professionalId),
    )
    const service = services.find(
      (item) => String(item.id) === String(manualServiceId),
    )

    if (!professional || !service) {
      setManualError('Escolha uma profissional e um serviço.')
      return
    }

    if (!manualClientName.trim() || !manualPhone.trim()) {
      setManualError('Informe o nome e telefone da cliente.')
      return
    }

    const selectedStart = timeToMinutes(manualBooking.time)
    const selectedDuration = durationToMinutes(service.duration)
    const selectedEnd = selectedStart + selectedDuration

    if (selectedEnd > endMinutes) {
      setManualError('O serviço ultrapassa o final da agenda visível.')
      return
    }

    const hasProfessionalConflict = appointments.some((appointment) => {
      if (
        String(appointment.professionalId) !== String(manualBooking.professionalId) ||
        appointment.date !== manualBooking.date
      ) {
        return false
      }

      const appointmentStart = timeToMinutes(appointment.time)
      const appointmentEnd =
        appointmentStart + durationToMinutes(appointment.duration)

      return selectedStart < appointmentEnd && appointmentStart < selectedEnd
    })

    if (hasProfessionalConflict) {
      setManualError(
        'Já existe agendamento nesse intervalo para esta profissional.',
      )
      return
    }

    const fullDayBlocked = scheduleBlocks.some(
      (block) =>
        String(block.professionalId) === String(manualBooking.professionalId) &&
        block.date === manualBooking.date &&
        block.type === 'full-day',
    )

    const timeBlocked = scheduleBlocks.some((block) => {
      if (
        String(block.professionalId) !== String(manualBooking.professionalId) ||
        block.date !== manualBooking.date ||
        block.type !== 'time-range'
      ) {
        return false
      }

      const blockStart = timeToMinutes(block.startTime)
      const blockEnd = timeToMinutes(block.endTime)

      return selectedStart < blockEnd && blockStart < selectedEnd
    })

    if (fullDayBlocked || timeBlocked) {
      setManualError(
        'Este horário está bloqueado para a profissional. Remova o bloqueio antes de agendar.',
      )
      return
    }

    try {
      setIsSavingManual(true)
      setManualError('')

      const { error } = await localDataClient.from('appointments').insert({
        client_name: manualClientName.trim(),
        phone: normalizePhone(manualPhone) || manualPhone.trim(),
        professional_id: String(professional.id),
        service_id: String(service.id),
        appointment_date: manualBooking.date,
        appointment_time: manualBooking.time,
        status: 'agendado',
      })

      if (error) throw error

      closeManualBooking()
      await loadAgenda()
      setMessage('Agendamento VIP/manual criado com sucesso.')
    } catch (error) {
      console.error('Erro ao criar agendamento manual:', error)
      setManualError('Erro ao salvar agendamento manual local.')
    } finally {
      setIsSavingManual(false)
    }
  }

  const manualProfessional = manualBooking
    ? professionals.find(
        (professional) =>
          String(professional.id) === String(manualBooking.professionalId),
      )
    : null

  const manualServices = manualBooking
    ? services.filter(
        (service) =>
          String(service.professionalId) === String(manualBooking.professionalId),
      )
    : []

  return (
    <div className="min-h-screen bg-dark-800">
      <div className="border-b bg-dark-700 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight text-gray-100 sm:text-3xl">Agenda do Modelo</h1>
            <p className="text-sm text-gray-300">
              Painel moderno de visualização diária dos horários
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/pacotes-ativos"
              className="w-fit rounded-full border border-gold-400/25 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/10"
            >
              Pacotes Ativos
            </Link>
            <Link
              to="/"
              className="w-fit rounded-full bg-gold-400/10 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/15"
            >
              ← Site
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => moveDate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/20 bg-dark-700 text-lg font-bold text-gold-300 transition hover:border-gold-400 hover:bg-dark-800"
          >
            ‹
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-full border border-gold-400/20 bg-dark-700 px-4 py-2 font-semibold text-gold-300 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
          />

          <button
            type="button"
            onClick={() => moveDate(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/20 bg-dark-700 text-lg font-bold text-gold-300 transition hover:border-gold-400 hover:bg-dark-800"
          >
            ›
          </button>

          <button
            type="button"
            onClick={loadAgenda}
            className="rounded-full bg-gold-400 px-5 py-2 font-semibold text-dark-900 transition hover:bg-gold-300"
          >
            Atualizar
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-400">
            {message}
          </div>
        )}

        <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-3 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold capitalize text-gold-300">
              {formatDateTitle(selectedDate)}
            </h2>
            <p className="text-xs text-gray-300">
              {loading
                ? 'Carregando agenda...'
                : `${appointments.length} agendamento(s) e ${scheduleBlocks.length} bloqueio(s) neste dia`}
            </p>
          </div>

          {!loading && professionals.length === 0 ? (
            <p className="rounded-2xl bg-dark-800 p-4 text-sm text-gray-300">
              Nenhuma profissional ativa encontrada.
            </p>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div
                className="grid min-w-max"
                style={{
                  gridTemplateColumns: `52px repeat(${professionals.length}, minmax(150px, 1fr))`,
                }}
              >
                <div className="sticky left-0 z-50 bg-dark-700" />

                {professionals.map((professional) => (
                  <div
                    key={professional.id}
                    className="border-b border-gold-400/20 bg-dark-700 px-2 pb-2 text-center"
                  >
                    <img
                      src={professional.image || DEFAULT_IMAGE}
                      alt={professional.name}
                      className="mx-auto h-10 w-10 rounded-full object-cover shadow-sm"
                    />
                    <p className="mt-1 line-clamp-2 text-xs font-bold leading-tight text-gray-100">
                      {professional.name}
                    </p>
                  </div>
                ))}

                <div
                  className="sticky left-0 z-40 border-r border-gold-400/20 bg-dark-700 shadow-[6px_0_8px_-8px_rgba(0,0,0,0.35)]"
                  style={{ height: agendaHeight }}
                >
                  {times.map((time) => (
                    <div
                      key={time}
                      className="absolute left-0 right-2 -translate-y-2 text-right text-[11px] font-medium text-gray-300"
                      style={{
                        top: ((timeToMinutes(time) - startMinutes) / 30) * slotHeight,
                      }}
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {professionals.map((professional) => {
                  const professionalAppointments = appointments.filter(
                    (appointment) =>
                      String(appointment.professionalId) === String(professional.id),
                  )

                  const professionalBlocks = scheduleBlocks.filter(
                    (block) =>
                      String(block.professionalId) === String(professional.id),
                  )

                  return (
                    <div
                      key={professional.id}
                      className="relative border-r border-gold-400/10 bg-dark-700"
                      style={{ height: agendaHeight }}
                    >
                      {Array.from(
                        { length: (endMinutes - startMinutes) / 30 + 1 },
                        (_, index) => (
                          <div
                            key={index}
                            className="absolute left-0 right-0 border-t border-gold-400/10"
                            style={{ top: index * slotHeight }}
                          />
                        ),
                      )}

                      {times
                        .filter((time) => timeToMinutes(time) < endMinutes)
                        .map((time) => (
                          <button
                            key={`manual-${professional.id}-${time}`}
                            type="button"
                            onClick={() => openManualBooking(professional, time)}
                            className="absolute left-0 right-0 z-0 cursor-pointer bg-transparent transition hover:bg-gold-400/10"
                            style={{
                              top:
                                ((timeToMinutes(time) - startMinutes) / 30) *
                                slotHeight,
                              height: slotHeight,
                            }}
                            title={`Agendar VIP/manual com ${professional.name} às ${time}`}
                            aria-label={`Agendar VIP/manual com ${professional.name} às ${time}`}
                          />
                        ))}

                      {professionalBlocks.map((block) => {
                        const position = getBlockPosition(block)

                        return (
                          <div
                            key={block.id}
                            className="absolute left-1 right-1 z-[9] overflow-hidden rounded-lg border border-red-200 bg-red-950/40 px-2 py-1 text-left shadow-sm"
                            style={{
                              top: position.top,
                              height: position.height,
                            }}
                            title={`Bloqueado: ${block.reason}`}
                          >
                            <p className="text-[10px] font-bold leading-tight text-red-400">
                              Bloqueado
                            </p>
                            <p className="line-clamp-1 text-[10px] font-semibold leading-tight text-red-600">
                              {position.label}
                            </p>
                            <p className="line-clamp-2 text-[10px] leading-tight text-red-500">
                              {block.reason}
                            </p>
                          </div>
                        )
                      })}

                      {professionalAppointments.map((appointment) => {
                        const start = timeToMinutes(appointment.time)
                        const duration = durationToMinutes(appointment.duration)
                        const top = Math.max(0, ((start - startMinutes) / 30) * slotHeight)
                        const height = Math.max(42, (duration / 30) * slotHeight - 4)
                        const cardStyle = getStatusStyle(appointment.status)

                        return (
                          <button
                            key={appointment.id}
                            type="button"
                            onClick={() => openAppointment(appointment)}
                            className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left shadow-sm transition hover:scale-[1.01] ${cardStyle}`}
                            style={{ top, height }}
                          >
                            <p className="text-[10px] font-semibold leading-tight text-gray-100">
                              {appointment.time} • {appointment.duration}
                            </p>

                            <p className="line-clamp-1 text-[11px] font-bold leading-tight text-gray-100">
                              {appointment.clientName}
                            </p>

                            <p className="line-clamp-1 text-[10px] leading-tight text-gray-200">
                              {appointment.serviceName}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {manualBooking && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-dark-900/60 p-2 sm:items-center sm:p-3">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-dark-700 p-4 shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-300 sm:text-xs">
                  Agendamento VIP/manual
                </p>
                <h2 className="mt-0.5 text-lg font-bold leading-tight text-gray-100 sm:mt-1 sm:text-xl">
                  Novo agendamento
                </h2>
                <p className="mt-0.5 text-xs leading-snug text-gray-300 sm:mt-1 sm:text-sm">
                  {manualProfessional?.name || 'Profissional'} •{' '}
                  {formatDateTitle(manualBooking.date)} às {manualBooking.time}
                </p>
              </div>

              <button
                type="button"
                onClick={closeManualBooking}
                className="shrink-0 rounded-full px-2 py-0.5 text-2xl text-gray-300 hover:bg-dark-700 hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-200">
                  Nome da cliente
                </label>
                <input
                  type="text"
                  value={manualClientName}
                  onChange={(event) => setManualClientName(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                  placeholder="Nome da cliente"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-200">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(event) => setManualPhone(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-200">
                  Serviço
                </label>
                <select
                  value={manualServiceId}
                  onChange={(event) => setManualServiceId(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-xs text-gray-100 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:text-sm"
                >
                  <option value="">Escolha um serviço</option>
                  {manualServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} • {service.duration}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-200">
                    Data
                  </span>
                  <label className="relative block w-full overflow-hidden rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm shadow-sm transition focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/30">
                    <span className="block truncate text-gray-100">
                      {formatShortDate(manualBooking.date)}
                    </span>
                    <input
                      type="date"
                      value={manualBooking.date}
                      onChange={(event) =>
                        setManualBooking((current) =>
                          current
                            ? { ...current, date: event.target.value }
                            : current,
                        )
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Data do agendamento VIP"
                    />
                  </label>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-200">
                    Horário
                  </span>
                  <label className="relative block w-full overflow-hidden rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm shadow-sm transition focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/30">
                    <span className="block truncate text-gray-100">
                      {manualBooking.time || 'Selecionar horário'}
                    </span>
                    <input
                      type="time"
                      value={manualBooking.time}
                      onChange={(event) =>
                        setManualBooking((current) =>
                          current
                            ? { ...current, time: event.target.value }
                            : current,
                        )
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Horário do agendamento VIP"
                    />
                  </label>
                </div>
              </div>

              {manualError && (
                <div className="rounded-2xl bg-red-950/40 p-3 text-xs text-red-400">
                  {manualError}
                </div>
              )}

              <div className="rounded-2xl border border-gold-400/20 bg-gold-400/10 p-2.5 text-[11px] leading-relaxed text-gold-300 sm:p-3 sm:text-xs">
                Este agendamento é manual e pode ser feito em datas futuras, mesmo fora da janela normal de liberação do cliente.
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={closeManualBooking}
                className="rounded-2xl border border-gold-400/20 px-3 py-2.5 text-sm font-bold text-gray-200 hover:bg-dark-800 sm:px-4 sm:py-3"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveManualBooking}
                disabled={isSavingManual}
                className="rounded-2xl bg-gold-400 px-3 py-2.5 text-sm font-bold text-white hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3"
              >
                {isSavingManual ? 'Salvando...' : 'Salvar VIP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-dark-900/60 p-2 sm:items-center sm:p-3">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-dark-700 p-4 shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl sm:p-5 sm:max-w-lg">
            <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-tight text-gray-100 sm:text-xl">
                  {selectedAppointment.clientName}
                </h2>
                <p className="text-sm text-gray-300">{selectedAppointment.phone}</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-3 py-1 text-2xl text-gray-300 hover:bg-dark-700 hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-200">
              <p>
                <strong>Data:</strong> {formatDateTitle(selectedAppointment.date)} às{' '}
                {selectedAppointment.time}
              </p>
              <p>
                <strong>Serviço:</strong> {selectedAppointment.serviceName}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                {selectedAppointment.status === 'confirmado' ||
                selectedAppointment.status === 'confirmed'
                  ? 'Confirmado'
                  : selectedAppointment.status === 'cancelado' ||
                      selectedAppointment.status === 'canceled'
                    ? 'Cancelado'
                    : 'Não confirmado'}
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-dark-800 p-3">
              <p className="mb-2.5 text-sm font-bold text-gray-100">
                Alterar agendamento
              </p>

              <div className="grid gap-2.5 sm:gap-3">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-xs font-medium text-gray-200">
                      Data
                    </span>
                    <label className="relative block w-full overflow-hidden rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm shadow-sm transition focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/30">
                      <span className="block truncate text-gray-100">
                        {formatShortDate(editDate)}
                      </span>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(event) => setEditDate(event.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label="Data do agendamento"
                      />
                    </label>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-medium text-gray-200">
                      Horário
                    </span>
                    <label className="relative block w-full overflow-hidden rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm shadow-sm transition focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/30">
                      <span className="block truncate text-gray-100">
                        {editTime || 'Selecionar horário'}
                      </span>
                      <input
                        type="time"
                        value={editTime}
                        onChange={(event) => setEditTime(event.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label="Horário do agendamento"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-200">
                    Serviço
                  </span>
                  <select
                    value={editServiceId}
                    onChange={(event) => setEditServiceId(event.target.value)}
                    className="w-full min-w-0 rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-xs outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:text-sm"
                  >
                    {services
                      .filter(
                        (service) =>
                          String(service.professionalId) ===
                          String(selectedAppointment.professionalId),
                      )
                      .map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} • {service.duration}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-200">
                    Status
                  </span>
                  <select
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value)}
                    className="w-full min-w-0 rounded-xl border border-gold-400/20 bg-dark-700 px-3 py-2 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                  >
                    <option value="agendado">Não confirmado</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelar e liberar horário</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={saveAppointmentChanges}
                className="rounded-2xl bg-green-700 px-3 py-2.5 text-sm font-bold text-white hover:bg-green-600 sm:px-4 sm:py-3"
              >
                Alterar
              </button>

              <button
                type="button"
                onClick={deleteAppointment}
                className="rounded-2xl bg-red-950/40 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 sm:px-4 sm:py-3"
              >
                Excluir
              </button>
            </div>

            <button
              type="button"
              onClick={openWhatsApp}
              disabled={!selectedAppointment.phone}
              className="mt-2.5 w-full rounded-2xl bg-green-700 px-3 py-2.5 text-sm font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-dark-700 sm:px-4 sm:py-3"
            >
              Chamar cliente no WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Agenda
