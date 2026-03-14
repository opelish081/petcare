// app/[locale]/(app)/dashboard/page.tsx — Dashboard พร้อม Stats + กราฟ
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { format, addDays, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { Calendar, Heart, CheckCircle, Plus, ChevronRight, TrendingUp } from 'lucide-react'
import { Appointment, Pet } from '@/types'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

const APPOINTMENT_ICONS: Record<string, string> = {
  vet: '🏥', vaccine: '💉', grooming: '✂️', other: '📋',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations('dashboard')
  const tApp = await getTranslations('appointments')
  const supabase = createClient()
  const dateLocale = locale === 'th' ? th : enUS

  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, petsRes, upcomingRes, allApptsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('pets').select('*').eq('user_id', user!.id),
    supabase
      .from('appointments')
      .select('*, pet:pets(name, type, image_url)')
      .eq('user_id', user!.id)
      .eq('status', 'pending')
      .gte('appointment_date', new Date().toISOString())
      .lte('appointment_date', addDays(new Date(), 7).toISOString())
      .order('appointment_date', { ascending: true }),
    supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user!.id)
      .gte('appointment_date', subMonths(new Date(), 5).toISOString())
      .order('appointment_date', { ascending: true }),
  ])

  const profile = profileRes.data
  const pets: Pet[] = petsRes.data || []
  const upcoming: Appointment[] = upcomingRes.data || []
  const allAppts: Appointment[] = allApptsRes.data || []

  const pendingCount = allAppts.filter(a => a.status === 'pending').length
  const completedThisMonth = allAppts.filter(a =>
    a.status === 'completed' &&
    new Date(a.appointment_date) >= startOfMonth(new Date()) &&
    new Date(a.appointment_date) <= endOfMonth(new Date())
  ).length

  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  })
  const monthlyData = last6Months.map(month => {
    const monthAppts = allAppts.filter(a => {
      const d = new Date(a.appointment_date)
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
    })
    return {
      month: format(month, 'MMM', { locale: dateLocale }),
      total: monthAppts.length,
      completed: monthAppts.filter(a => a.status === 'completed').length,
      pending: monthAppts.filter(a => a.status === 'pending').length,
    }
  })

  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('welcome', { name: firstName })} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={15} className="text-pink-400" />
            <span className="text-xs text-gray-500">{t('totalPets')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pets.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={15} className="text-yellow-400" />
            <span className="text-xs text-gray-500">{t('pendingAppointments')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={15} className="text-green-400" />
            <span className="text-xs text-gray-500">{t('completedThisMonth')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedThisMonth}</p>
        </div>
      </div>

      {allAppts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-500" />
            <p className="text-sm font-semibold text-gray-900">
              {locale === 'th' ? 'นัดหมาย 6 เดือนที่ผ่านมา' : 'Appointments (Last 6 months)'}
            </p>
          </div>
          <DashboardCharts data={monthlyData} locale={locale} />
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">{t('upcomingAppointments')}</h2>
          <Link href={`/${locale}/appointments`} className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
            {locale === 'th' ? 'ดูทั้งหมด' : 'View all'}<ChevronRight size={14} />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">{t('noUpcoming')}</p>
            <Link href={`/${locale}/appointments/new`} className="inline-flex items-center gap-2 mt-4 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} />{t('addAppointment')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <Link key={appt.id} href={`/${locale}/appointments/${appt.id}`} className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {APPOINTMENT_ICONS[appt.type] || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{appt.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(appt.pet as any)?.name} · {format(new Date(appt.appointment_date), 'd MMM yyyy, HH:mm', { locale: dateLocale })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[appt.status]}`}>
                    {tApp(`statuses.${appt.status}`)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">{t('myPets')}</h2>
          <Link href={`/${locale}/pets`} className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
            {locale === 'th' ? 'ดูทั้งหมด' : 'View all'}<ChevronRight size={14} />
          </Link>
        </div>
        {pets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-4xl mb-2">🐾</p>
            <p className="text-gray-400 text-sm mb-4">{locale === 'th' ? 'ยังไม่มีสัตว์เลี้ยง' : 'No pets yet'}</p>
            <Link href={`/${locale}/pets/new`} className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} />{t('addPet')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pets.slice(0, 6).map((pet) => (
              <Link key={pet.id} href={`/${locale}/pets/${pet.id}`} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-sm transition-all text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-2 overflow-hidden">
                  {pet.image_url ? <img src={pet.image_url} alt={pet.name} className="w-12 h-12 rounded-full object-cover" /> : pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : pet.type === 'rabbit' ? '🐰' : pet.type === 'bird' ? '🐦' : pet.type === 'fish' ? '🐟' : '🐾'}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{pet.name}</p>
                <p className="text-xs text-gray-400">{pet.breed || pet.type}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
