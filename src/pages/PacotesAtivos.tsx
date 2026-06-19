import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { localDataClient } from '../services/localDatabase'

type PackageStatus = 'ativo' | 'finalizado' | 'vencido' | 'cancelado'

interface ProfessionalOption {
  id: string | number
  name: string
}

interface ClientPackage {
  id: string
  clientId: string
  clientName: string
  phone: string
  normalizedPhone: string
  packageName: string
  professionalId: string | number
  professionalName: string
  totalSessions: number
  sessionsUsed: number
  purchaseDate: string
  expirationDate: string
  status: PackageStatus
  createdAt?: string
}

interface PackageSession {
  id: string
  packageId: string
  usedAt: string
  sessionNumber: number
  notes?: string
}

interface PackageForm {
  clientName: string
  phone: string
  packageName: string
  professionalId: string
  totalSessions: string
  purchaseDate: string
  expirationDate: string
}

const statusOptions: Array<{ value: PackageStatus; label: string }> = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'cancelado', label: 'Cancelado' },
]

const onlyDigits = (value?: string | null) => String(value || '').replace(/\D/g, '')

const normalizePhone = (value?: string | null) => {
  const digits = onlyDigits(value)
  if (digits.length === 13 && digits.startsWith('55')) return digits.slice(2)
  return digits
}

const todayKey = () => new Date().toISOString().slice(0, 10)

const datePlusDays = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const defaultPackageForm = (professionalId = ''): PackageForm => ({
  clientName: '',
  phone: '',
  packageName: '',
  professionalId,
  totalSessions: '10',
  purchaseDate: todayKey(),
  expirationDate: datePlusDays(90),
})

const formatDate = (value?: string) => {
  if (!value) return '-'

  try {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
  } catch {
    return value
  }
}

const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const toStatus = (value?: string | null): PackageStatus => {
  if (value === 'finalizado' || value === 'vencido' || value === 'cancelado') return value
  return 'ativo'
}

const getSessionsRemaining = (item: Pick<ClientPackage, 'totalSessions' | 'sessionsUsed'>) =>
  Math.max(0, item.totalSessions - item.sessionsUsed)

const resolvePackageStatus = (item: ClientPackage): PackageStatus => {
  if (item.status === 'cancelado' || item.status === 'finalizado') return item.status
  if (getSessionsRemaining(item) === 0) return 'finalizado'
  if (item.expirationDate && item.expirationDate < todayKey()) return 'vencido'
  return 'ativo'
}

const statusStyles: Record<PackageStatus, string> = {
  ativo: 'border-green-400/30 bg-green-400/10 text-green-300',
  finalizado: 'border-gold-400/30 bg-gold-400/10 text-gold-300',
  vencido: 'border-orange-300/30 bg-orange-300/10 text-orange-200',
  cancelado: 'border-red-400/30 bg-red-400/10 text-red-300',
}

const mapPackage = (row: any): ClientPackage => ({
  id: String(row.id),
  clientId: String(row.client_id || ''),
  clientName: row.client_name || '',
  phone: row.phone || '',
  normalizedPhone: row.normalized_phone || normalizePhone(row.phone),
  packageName: row.package_name || '',
  professionalId: row.professional_id || '',
  professionalName: row.professional_name || '',
  totalSessions: Number(row.total_sessions || 0),
  sessionsUsed: Number(row.sessions_used || 0),
  purchaseDate: row.purchase_date || '',
  expirationDate: row.expiration_date || '',
  status: toStatus(row.status),
  createdAt: row.created_at,
})

const mapSession = (row: any): PackageSession => ({
  id: String(row.id),
  packageId: String(row.package_id),
  usedAt: row.used_at || '',
  sessionNumber: Number(row.session_number || 0),
  notes: row.notes || '',
})

const PacotesAtivos = () => {
  const [packages, setPackages] = useState<ClientPackage[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([])
  const [sessionsByPackageId, setSessionsByPackageId] = useState<Record<string, PackageSession[]>>({})
  const [statusFilter, setStatusFilter] = useState<PackageStatus>('ativo')
  const [search, setSearch] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [form, setForm] = useState<PackageForm>(defaultPackageForm())
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadPackages = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [packagesResponse, professionalsResponse, sessionsResponse] = await Promise.all([
        localDataClient.from('client_packages').select('*').order('created_at', { ascending: false }),
        localDataClient.from('professionals').select('id,name').order('created_at', { ascending: true }),
        localDataClient.from('package_sessions').select('*').order('used_at', { ascending: false }),
      ])

      if (packagesResponse.error) throw packagesResponse.error
      if (professionalsResponse.error) throw professionalsResponse.error
      if (sessionsResponse.error) throw sessionsResponse.error

      const normalizedPackages = ((packagesResponse.data || []) as any[]).map((row) => {
        const item = mapPackage(row)
        return { ...item, status: resolvePackageStatus(item) }
      })

      await Promise.all(
        normalizedPackages
          .filter((item, index) => item.status !== toStatus((packagesResponse.data || [])[index]?.status))
          .map((item) =>
            localDataClient
              .from('client_packages')
              .update({ status: item.status })
              .eq('id', item.id),
          ),
      )

      setPackages(normalizedPackages)
      setProfessionals(
        ((professionalsResponse.data || []) as any[]).map((professional) => ({
          id: professional.id,
          name: professional.name || 'Profissional',
        })),
      )

      const sessions = ((sessionsResponse.data || []) as any[]).map(mapSession)
      setSessionsByPackageId(
        sessions.reduce<Record<string, PackageSession[]>>((result, session) => {
          result[session.packageId] = result[session.packageId] || []
          result[session.packageId].push(session)
          return result
        }, {}),
      )
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error)
      setMessage('Não consegui carregar os pacotes ativos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  useEffect(() => {
    document.title = 'Pacotes Ativos - Modelo de Agendamento'
  }, [])

  useEffect(() => {
    if (!form.professionalId && professionals[0]) {
      setForm((current) => ({
        ...current,
        professionalId: String(professionals[0].id),
      }))
    }
  }, [form.professionalId, professionals])

  const visiblePackages = useMemo(() => {
    const term = search.trim().toLowerCase()

    return packages
      .filter((item) => item.status === statusFilter)
      .filter((item) => {
        if (!term) return true

        return [
          item.clientName,
          item.phone,
          item.normalizedPhone,
          item.packageName,
          item.professionalName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      })
  }, [packages, search, statusFilter])

  const selectedPackage = packages.find((item) => item.id === selectedPackageId) || null
  const selectedSessions = selectedPackage ? sessionsByPackageId[selectedPackage.id] || [] : []

  const updateForm = (update: Partial<PackageForm>) => {
    setForm((current) => ({ ...current, ...update }))
    setMessage('')
  }

  const handleCreatePackage = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')

    try {
      const normalizedPhone = normalizePhone(form.phone)
      const totalSessions = Number(form.totalSessions)

      if (!form.clientName.trim() || !normalizedPhone || normalizedPhone.length < 8) {
        setMessage('Informe nome e telefone válido da cliente.')
        return
      }

      if (!form.packageName.trim() || !form.professionalId || !totalSessions || totalSessions < 1) {
        setMessage('Informe pacote, profissional e quantidade de sessões.')
        return
      }

      const selectedProfessional = professionals.find(
        (professional) => String(professional.id) === String(form.professionalId),
      )

      const { data: existingClient } = await localDataClient
        .from('clients')
        .select('*')
        .eq('normalized_phone', normalizedPhone)
        .maybeSingle()

      let clientId = existingClient?.id
      const clientPayload = {
        client_name: form.clientName.trim(),
        phone: formatPhone(form.phone),
        normalized_phone: normalizedPhone,
      }

      if (clientId) {
        await localDataClient.from('clients').update(clientPayload).eq('id', clientId)
      } else {
        const { data: insertedClient, error: clientError } = await localDataClient
          .from('clients')
          .insert(clientPayload)
          .select('*')
          .maybeSingle()

        if (clientError) throw clientError
        clientId = insertedClient?.id
      }

      const { error } = await localDataClient.from('client_packages').insert({
        client_id: clientId,
        client_name: clientPayload.client_name,
        phone: clientPayload.phone,
        normalized_phone: normalizedPhone,
        package_name: form.packageName.trim(),
        professional_id: form.professionalId,
        professional_name: selectedProfessional?.name || 'Profissional',
        total_sessions: totalSessions,
        sessions_used: 0,
        purchase_date: form.purchaseDate || todayKey(),
        expiration_date: form.expirationDate || datePlusDays(90),
        status: 'ativo',
      })

      if (error) throw error

      setMessage('Pacote cadastrado com sucesso.')
      setShowPackageForm(false)
      setForm(defaultPackageForm(String(professionals[0]?.id || '')))
      await loadPackages()
    } catch (error) {
      console.error('Erro ao cadastrar pacote:', error)
      setMessage('Não consegui cadastrar o pacote.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegisterSession = async (item: ClientPackage) => {
    const remaining = getSessionsRemaining(item)
    if (remaining <= 0 || item.status === 'cancelado') return

    setIsSaving(true)
    setMessage('')

    try {
      const nextUsed = Math.min(item.totalSessions, item.sessionsUsed + 1)
      const nextStatus: PackageStatus = nextUsed >= item.totalSessions ? 'finalizado' : resolvePackageStatus({
        ...item,
        sessionsUsed: nextUsed,
      })

      const { error: historyError } = await localDataClient.from('package_sessions').insert({
        package_id: item.id,
        used_at: todayKey(),
        session_number: nextUsed,
        notes: 'Sessão registrada pela profissional.',
      })

      if (historyError) throw historyError

      const { error: updateError } = await localDataClient
        .from('client_packages')
        .update({
          sessions_used: nextUsed,
          status: nextStatus,
        })
        .eq('id', item.id)

      if (updateError) throw updateError

      setMessage('Uso de sessão registrado.')
      await loadPackages()
      setSelectedPackageId(item.id)
    } catch (error) {
      console.error('Erro ao registrar sessão:', error)
      setMessage('Não consegui registrar o uso da sessão.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelPackage = async (item: ClientPackage) => {
    if (!confirm('Deseja cancelar este pacote?')) return

    setIsSaving(true)
    setMessage('')

    try {
      const { error } = await localDataClient
        .from('client_packages')
        .update({ status: 'cancelado' })
        .eq('id', item.id)

      if (error) throw error

      setMessage('Pacote cancelado.')
      await loadPackages()
      setSelectedPackageId(item.id)
    } catch (error) {
      console.error('Erro ao cancelar pacote:', error)
      setMessage('Não consegui cancelar o pacote.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-800">
      <div className="border-b border-gold-400/20 bg-dark-700 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold leading-tight text-gold-300 sm:text-3xl">
              Pacotes Ativos
            </h1>
            <p className="text-sm text-gray-300">
              Acompanhe clientes com pacotes, sessões usadas e vencimentos
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/agenda"
              className="rounded-full border border-gold-400/25 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/10"
            >
              Agenda
            </Link>
            <Link
              to="/"
              className="rounded-full bg-gold-400/10 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/15"
            >
              Site
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
        <section className="mb-5 rounded-3xl border border-gold-400/20 bg-dark-700 p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Buscar pacote
              </label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, telefone, pacote ou profissional"
                className="w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setStatusFilter(status.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                    statusFilter === status.value
                      ? 'border-gold-400 bg-gold-400 text-dark-900'
                      : 'border-gold-400/20 text-gray-300 hover:bg-gold-400/10 hover:text-gold-300'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPackageForm((current) => !current)}
              className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-dark-900 transition hover:bg-gold-300"
            >
              {showPackageForm ? 'Fechar cadastro' : 'Cadastrar pacote'}
            </button>
          </div>

          {showPackageForm && (
            <form onSubmit={handleCreatePackage} className="mt-5 grid gap-3 border-t border-gold-400/10 pt-5 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="text"
                value={form.clientName}
                onChange={(event) => updateForm({ clientName: event.target.value })}
                placeholder="Nome da cliente"
                className="rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-gold-400"
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateForm({ phone: formatPhone(event.target.value) })}
                placeholder="Telefone"
                className="rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-gold-400"
              />
              <input
                type="text"
                value={form.packageName}
                onChange={(event) => updateForm({ packageName: event.target.value })}
                placeholder="Nome do pacote"
                className="rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-gold-400"
              />
              <select
                value={form.professionalId}
                onChange={(event) => updateForm({ professionalId: event.target.value })}
                className="rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none focus:border-gold-400"
              >
                <option value="">Profissional</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={String(professional.id)}>
                    {professional.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={form.totalSessions}
                onChange={(event) => updateForm({ totalSessions: event.target.value })}
                placeholder="Total de sessões"
                className="rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-gold-400"
              />
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(event) => updateForm({ purchaseDate: event.target.value })}
                className="rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none focus:border-gold-400"
              />
              <input
                type="date"
                value={form.expirationDate}
                onChange={(event) => updateForm({ expirationDate: event.target.value })}
                className="rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none focus:border-gold-400"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-gold-400 px-4 py-3 text-sm font-semibold text-dark-900 transition hover:bg-gold-300 disabled:opacity-60"
              >
                {isSaving ? 'Salvando...' : 'Salvar pacote'}
              </button>
            </form>
          )}
        </section>

        {message && (
          <div className="mb-5 rounded-2xl border border-gold-400/20 bg-gold-400/10 p-3 text-sm text-gold-300">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-8 text-center text-gray-300">
            Carregando pacotes...
          </div>
        ) : visiblePackages.length === 0 ? (
          <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-8 text-center">
            <p className="font-serif text-xl font-bold text-gold-300">
              Nenhum pacote encontrado
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Ajuste a busca, troque o filtro de status ou cadastre um novo pacote.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visiblePackages.map((item) => {
              const remaining = getSessionsRemaining(item)

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-gold-400/20 bg-dark-700 p-4 shadow-card sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-serif text-xl font-bold text-gold-300">
                        {item.clientName}
                      </h2>
                      <p className="mt-1 text-sm text-gray-300">{item.phone}</p>
                    </div>
                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                      {statusOptions.find((status) => status.value === item.status)?.label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                    <p><strong className="text-gray-100">Pacote:</strong> {item.packageName}</p>
                    <p><strong className="text-gray-100">Profissional:</strong> {item.professionalName}</p>
                    <p><strong className="text-gray-100">Total:</strong> {item.totalSessions} sessões</p>
                    <p><strong className="text-gray-100">Usadas:</strong> {item.sessionsUsed}</p>
                    <p><strong className="text-gray-100">Restantes:</strong> {remaining}</p>
                    <p><strong className="text-gray-100">Compra:</strong> {formatDate(item.purchaseDate)}</p>
                    <p><strong className="text-gray-100">Vencimento:</strong> {formatDate(item.expirationDate)}</p>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-dark-800">
                    <div
                      className="h-full rounded-full bg-gold-400"
                      style={{
                        width: `${Math.min(100, Math.round((item.sessionsUsed / Math.max(1, item.totalSessions)) * 100))}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPackageId(item.id)}
                    className="mt-4 w-full rounded-full border border-gold-400/30 px-4 py-2.5 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/10"
                  >
                    Ver detalhes
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-gold-400/20 bg-dark-700 p-4 shadow-2xl sm:mx-auto sm:max-w-3xl sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">
                  Detalhes do pacote
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-gold-300">
                  {selectedPackage.packageName}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {selectedPackage.clientName} • {selectedPackage.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPackageId(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-400/20 text-xl leading-none text-gold-300 hover:bg-gold-400/10"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gold-300">
                  Cliente
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong className="text-gray-100">Nome:</strong> {selectedPackage.clientName}</p>
                  <p><strong className="text-gray-100">Telefone:</strong> {selectedPackage.phone}</p>
                  <p><strong className="text-gray-100">Identificador:</strong> {selectedPackage.normalizedPhone}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gold-300">
                  Pacote
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong className="text-gray-100">Profissional:</strong> {selectedPackage.professionalName}</p>
                  <p><strong className="text-gray-100">Sessões totais:</strong> {selectedPackage.totalSessions}</p>
                  <p><strong className="text-gray-100">Usadas:</strong> {selectedPackage.sessionsUsed}</p>
                  <p><strong className="text-gray-100">Restantes:</strong> {getSessionsRemaining(selectedPackage)}</p>
                  <p><strong className="text-gray-100">Compra:</strong> {formatDate(selectedPackage.purchaseDate)}</p>
                  <p><strong className="text-gray-100">Vencimento:</strong> {formatDate(selectedPackage.expirationDate)}</p>
                  <p>
                    <strong className="text-gray-100">Status:</strong>{' '}
                    {statusOptions.find((status) => status.value === selectedPackage.status)?.label}
                  </p>
                </div>
              </section>
            </div>

            <section className="mt-4 rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gold-300">
                Histórico de uso das sessões
              </h3>

              {selectedSessions.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nenhuma sessão utilizada ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-gold-400/10 bg-dark-700 p-3 text-sm text-gray-300"
                    >
                      <p>
                        <strong className="text-gray-100">Sessão {session.sessionNumber}</strong> • {formatDate(session.usedAt)}
                      </p>
                      {session.notes && <p className="mt-1 text-xs text-gray-400">{session.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-5 grid gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => handleRegisterSession(selectedPackage)}
                disabled={
                  isSaving ||
                  selectedPackage.status === 'cancelado' ||
                  selectedPackage.status === 'finalizado' ||
                  getSessionsRemaining(selectedPackage) === 0
                }
                className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-dark-900 transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Registrar uso de sessão
              </button>

              <button
                type="button"
                onClick={() => handleCancelPackage(selectedPackage)}
                disabled={isSaving || selectedPackage.status === 'cancelado'}
                className="rounded-full border border-red-400/30 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar pacote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PacotesAtivos
