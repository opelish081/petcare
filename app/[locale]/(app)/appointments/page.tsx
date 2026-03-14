// app/[locale]/(app)/appointments/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { Appointment } from '@/types'

const APPT_ICONS: Record<string, string> = {
  vet: '🏥', vaccine: '💉', grooming: '✂️', other: '📋',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function AppointmentsPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations('appointments')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dateLocale = locale === 'th' ? th : enUS

  const { data } = await supabase
    .from('appointments')
    .select('*, pet:pets(name, type, image_url)')
    .eq('user_id', user!.id)
    .order('appointment_date', { ascending: false })

  const appointments: Appointment[] = data || []

  const upcoming = appointments.filter(
    (a) => a.status === 'pending' && new Date(a.appointment_date) >= new Date()
  )
  const history = appointments.filter(
    (a) => a.status !== 'pending' || new Date(a.appointment_date) < new Date()
  )

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Link
          href={`/${locale}/appointments/new`}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          {t('newAppointment')}
        </Link>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('upcoming')}</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">{t('noAppointments')}</p>
            <Link href={`/${locale}/appointments/new`} className="inline-flex items-center gap-2 mt-4 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} />{t('newAppointment')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} locale={locale} dateLocale={dateLocale} t={t} />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('history')}</h2>
          <div className="space-y-3">
            {history.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} locale={locale} dateLocale={dateLocale} t={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AppointmentCard({ appt, locale, dateLocale, t }: {
  key?: string
  appt: Appointment
  locale: string
  dateLocale: any
  t: any
}) {
  return (
    <Link href={`/${locale}/appointments/${appt.id}`} className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {APPT_ICONS[appt.type] || '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{appt.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400">{(appt.pet as any)?.name}</p>
            <span className="text-gray-200">·</span>
            <p className="text-xs text-gray-400">{format(new Date(appt.appointment_date), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[appt.status]}`}>
          {t(`statuses.${appt.status}`)}
        </span>
      </div>
      {appt.location && <p className="text-xs text-gray-400 mt-2 ml-14">📍 {appt.location}</p>}
    </Link>
  )
}
