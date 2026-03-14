'use client'
// app/[locale]/(app)/appointments/[id]/page.tsx — รายละเอียด + เปลี่ยนสถานะ + Recurring

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { ArrowLeft, CheckCircle, XCircle, MapPin, Bell, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Appointment } from '@/types'
import RecurringModal from '@/components/appointments/RecurringModal'

const APPT_ICONS: Record<string, string> = {
  vet: '🏥', vaccine: '💉', grooming: '✂️', other: '📋',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function AppointmentDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string }
}) {
  const t = useTranslations('appointments')
  const router = useRouter()
  const supabase = createClient()
  const dateLocale = locale === 'th' ? th : enUS
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, pet:pets(id, name, type, image_url)')
        .eq('id', id)
        .single()
      setAppt(data)
      setLoading(false)
    }
    fetchData()
  }, [id])

  const updateStatus = async (status: 'completed' | 'cancelled') => {
    if (!appt) return
    setUpdating(true)

    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
      setUpdating(false)
      return
    }

    if (status === 'completed') {
      // Auto create health record
      const healthType = appt.type === 'vaccine' ? 'vaccine'
        : appt.type === 'vet' ? 'checkup'
        : appt.type === 'grooming' ? 'grooming'
        : 'other'

      await supabase.from('health_records').insert({
        pet_id: appt.pet_id,
        appointment_id: appt.id,
        type: healthType,
        title: appt.title,
        record_date: new Date(appt.appointment_date).toISOString().split('T')[0],
        details: appt.notes || null,
      })

      setUpdating(false)
      // แสดง Recurring Modal
      setShowRecurring(true)
    } else {
      toast.success(t('updateSuccess'))
      router.push(`/${locale}/appointments`)
      router.refresh()
    }
  }

  // สร้างนัดหมายถัดไป
  const handleRecurringConfirm = async (nextDate: Date, interval: string) => {
    if (!appt) return

    const pad = (n: number) => String(n).padStart(2, '0')
    const d = nextDate
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(new Date(appt.appointment_date).getHours())}:${pad(new Date(appt.appointment_date).getMinutes())}`

    const { error } = await supabase.from('appointments').insert({
      pet_id: appt.pet_id,
      user_id: appt.user_id,
      type: appt.type,
      title: appt.title,
      appointment_date: new Date(dateStr).toISOString(),
      location: appt.location || null,
      notes: appt.notes || null,
      notify_days: appt.notify_days,
      status: 'pending',
    })

    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
      return
    }

    toast.success(locale === 'th' ? '✅ บันทึกแล้ว และสร้างนัดถัดไปแล้ว!' : '✅ Done & next appointment created!')
    setShowRecurring(false)
    router.push(`/${locale}/appointments`)
    router.refresh()
  }

  const handleRecurringSkip = () => {
    toast.success(locale === 'th' ? '✅ บันทึกลงประวัติสุขภาพแล้ว' : '✅ Saved to health records')
    setShowRecurring(false)
    router.push(`/${locale}/appointments`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="animate-spin text-green-500" size={28} />
      </div>
    )
  }

  if (!appt) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">{locale === 'th' ? 'ไม่พบนัดหมาย' : 'Appointment not found'}</p>
        <Link href={`/${locale}/appointments`} className="text-green-600 text-sm mt-2 inline-block">
          {locale === 'th' ? 'กลับไปรายการ' : 'Back to list'}
        </Link>
      </div>
    )
  }

  const pet = appt.pet as any

  return (
    <>
      <div className="max-w-lg mx-auto space-y-5 pb-20 lg:pb-0">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/appointments`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {locale === 'th' ? 'รายละเอียดนัดหมาย' : 'Appointment Detail'}
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-3xl">
              {APPT_ICONS[appt.type]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{appt.title}</h2>
              <p className="text-sm text-gray-400">{t(`types.${appt.type}`)}</p>
            </div>
            <span className={`text-xs px-2.5 py-1.5 rounded-full font-medium ${STATUS_COLORS[appt.status]}`}>
              {t(`statuses.${appt.status}`)}
            </span>
          </div>

          <div className="border-t border-gray-50 pt-4 space-y-3">
            {pet && (
              <Link href={`/${locale}/pets/${pet.id}`} className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-1.5 -ml-1.5 transition-colors">
                <span className="text-xl">{pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐾'}</span>
                <div>
                  <p className="text-xs text-gray-400">{t('pet')}</p>
                  <p className="text-sm font-medium text-gray-900">{pet.name}</p>
                </div>
              </Link>
            )}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <span className="text-base">📅</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('appointmentDate')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(appt.appointment_date), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
                </p>
                <p className="text-xs text-gray-500">{format(new Date(appt.appointment_date), 'HH:mm น.')}</p>
              </div>
            </div>

            {appt.location && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <MapPin size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('location')}</p>
                  <p className="text-sm font-medium text-gray-900">{appt.location}</p>
                </div>
              </div>
            )}

            {appt.notify_days?.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Bell size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('notifyDays')}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {appt.notify_days.sort().map((d: number) =>
                      locale === 'th' ? `${d} วัน` : `${d} day${d > 1 ? 's' : ''}`
                    ).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {appt.notes && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{t('notes')}</p>
                <p className="text-sm text-gray-700">{appt.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {appt.status === 'pending' && (
          <div className="space-y-3">
            <p className="text-xs text-green-700 bg-green-50 rounded-xl p-3">
              ℹ️ {t('completedNote')}
            </p>
            <button
              onClick={() => updateStatus('completed')}
              disabled={updating}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {t('markCompleted')}
            </button>
            <button
              onClick={() => updateStatus('cancelled')}
              disabled={updating}
              className="w-full bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={16} />
              {t('markCancelled')}
            </button>
          </div>
        )}
      </div>

      {/* Recurring Modal */}
      {showRecurring && appt && (
        <RecurringModal
          appointmentTitle={appt.title}
          appointmentDate={appt.appointment_date}
          appointmentType={appt.type}
          locale={locale}
          onConfirm={handleRecurringConfirm}
          onSkip={handleRecurringSkip}
        />
      )}
    </>
  )
}
