// app/[locale]/(app)/pets/[id]/page.tsx — หน้ารายละเอียดสัตว์เลี้ยง
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInYears, differenceInMonths } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { ArrowLeft, Edit, Calendar, Heart } from 'lucide-react'

const PET_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', rabbit: '🐰', bird: '🐦', fish: '🐟', other: '🐾',
}

const HEALTH_ICONS: Record<string, string> = {
  vaccine: '💉', checkup: '🏥', grooming: '✂️', treatment: '💊', other: '📋',
}

export default async function PetDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string }
}) {
  const t = await getTranslations('pets')
  const tAppt = await getTranslations('appointments')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dateLocale = locale === 'th' ? th : enUS

  // ดึงข้อมูลสัตว์เลี้ยง
  const { data: pet } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!pet) notFound()

  // ดึง health records และ upcoming appointments พร้อมกัน
  const [healthRes, upcomingRes] = await Promise.all([
    supabase
      .from('health_records')
      .select('*')
      .eq('pet_id', id)
      .order('record_date', { ascending: false }),
    supabase
      .from('appointments')
      .select('*')
      .eq('pet_id', id)
      .eq('status', 'pending')
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true })
      .limit(5),
  ])

  const healthRecords = healthRes.data || []
  const upcomingAppointments = upcomingRes.data || []

  // คำนวณอายุ
  const getAge = () => {
    if (!pet.birthdate) return null
    const birth = new Date(pet.birthdate)
    const years = differenceInYears(new Date(), birth)
    const months = differenceInMonths(new Date(), birth) % 12
    if (years === 0) return locale === 'th' ? `${months} เดือน` : `${months} months`
    return locale === 'th' ? `${years} ปี ${months} เดือน` : `${years}y ${months}m`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/pets`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{pet.name}</h1>
        </div>
        <Link
          href={`/${locale}/pets/${id}/edit`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 border border-gray-200 hover:border-green-300 px-3 py-2 rounded-xl transition-colors"
        >
          <Edit size={14} />
          {locale === 'th' ? 'แก้ไข' : 'Edit'}
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center text-4xl overflow-hidden flex-shrink-0">
            {pet.image_url ? (
              <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              PET_EMOJI[pet.type] || '🐾'
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{pet.name}</h2>
            <p className="text-gray-400 text-sm">{t(`types.${pet.type}`)} {pet.breed ? `· ${pet.breed}` : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-50">
          {getAge() && (
            <div>
              <p className="text-xs text-gray-400 mb-1">{t('age')}</p>
              <p className="text-sm font-medium text-gray-900">{getAge()}</p>
            </div>
          )}
          {pet.birthdate && (
            <div>
              <p className="text-xs text-gray-400 mb-1">{t('birthdate')}</p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(pet.birthdate), 'd MMM yyyy', { locale: dateLocale })}
              </p>
            </div>
          )}
          {pet.gender && (
            <div>
              <p className="text-xs text-gray-400 mb-1">{t('gender')}</p>
              <p className="text-sm font-medium text-gray-900">
                {pet.gender === 'male' ? t('male') : t('female')}
              </p>
            </div>
          )}
        </div>

        {pet.notes && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-1">{t('notes')}</p>
            <p className="text-sm text-gray-700">{pet.notes}</p>
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-green-500" />
            <h2 className="text-base font-semibold text-gray-900">
              {locale === 'th' ? 'นัดหมายที่กำลังจะมา' : 'Upcoming Appointments'}
            </h2>
          </div>
          <div className="space-y-2">
            {upcomingAppointments.map((appt) => (
              <Link
                key={appt.id}
                href={`/${locale}/appointments/${appt.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-green-200 transition-colors"
              >
                <span className="text-xl">{appt.type === 'vet' ? '🏥' : appt.type === 'vaccine' ? '💉' : appt.type === 'grooming' ? '✂️' : '📋'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{appt.title}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(appt.appointment_date), 'd MMM yyyy, HH:mm', { locale: dateLocale })}
                  </p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  {tAppt('statuses.pending')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Weight Tracker shortcut */}
      <Link
        href={`/${locale}/pets/${id}/weight`}
        className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-sm transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">⚖️</div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {locale === 'th' ? 'บันทึกน้ำหนัก' : 'Weight Tracker'}
            </p>
            <p className="text-xs text-gray-400">
              {locale === 'th' ? 'ดูกราฟน้ำหนักย้อนหลัง' : 'View weight history chart'}
            </p>
          </div>
        </div>
        <span className="text-gray-300">›</span>
      </Link>

      {/* Health Timeline */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-green-500" />
            <h2 className="text-base font-semibold text-gray-900">{t('healthHistory')}</h2>
          </div>
          <Link
            href={`/${locale}/appointments/new?pet=${id}`}
            className="text-sm text-green-600 hover:text-green-700"
          >
            + {locale === 'th' ? 'นัดหมายใหม่' : 'New appointment'}
          </Link>
        </div>

        {healthRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">
              {locale === 'th' ? 'ยังไม่มีประวัติสุขภาพ' : 'No health records yet'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-4">
              {healthRecords.map((record) => (
                <div key={record.id} className="relative flex gap-4 pl-12">
                  {/* Dot */}
                  <div className="absolute left-3.5 top-4 w-3 h-3 rounded-full bg-green-400 border-2 border-white shadow-sm" />
                  <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{HEALTH_ICONS[record.type] || '📋'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.title}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(record.record_date), 'd MMM yyyy', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                    </div>
                    {record.details && (
                      <p className="text-sm text-gray-500 mt-2">{record.details}</p>
                    )}
                    {record.next_due_date && (
                      <p className="text-xs text-green-600 mt-2">
                        {locale === 'th' ? 'ครั้งถัดไป: ' : 'Next due: '}
                        {format(new Date(record.next_due_date), 'd MMM yyyy', { locale: dateLocale })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
