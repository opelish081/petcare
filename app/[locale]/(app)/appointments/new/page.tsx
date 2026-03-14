'use client'
// app/[locale]/(app)/appointments/new/page.tsx — ใช้ Custom DateTimePicker

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Pet } from '@/types'
import DateTimePicker from '@/components/ui/DateTimePicker'

const schema = z.object({
  pet_id: z.string().min(1, 'กรุณาเลือกสัตว์เลี้ยง'),
  type: z.enum(['vet', 'vaccine', 'grooming', 'other']),
  title: z.string().min(1, 'กรุณากรอกชื่อนัดหมาย'),
  appointment_date: z.string().min(1, 'กรุณาเลือกวันเวลา'),
  location: z.string().optional(),
  notes: z.string().optional(),
  notify_1: z.boolean().default(true),
  notify_2: z.boolean().default(true),
  notify_3: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

const PET_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', rabbit: '🐰', bird: '🐦', fish: '🐟', other: '🐾',
}

export default function NewAppointmentPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = useTranslations('appointments')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [pets, setPets] = useState<Pet[]>([])
  const defaultPetId = searchParams.get('pet') || ''

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'vet',
      pet_id: defaultPetId,
      notify_1: true,
      notify_2: true,
      notify_3: true,
    },
  })

  useEffect(() => {
    const fetchPets = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      setPets(data || [])
    }
    fetchPets()
  }, [])

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const notify_days = [
      data.notify_1 ? 1 : null,
      data.notify_2 ? 2 : null,
      data.notify_3 ? 3 : null,
    ].filter(Boolean) as number[]

    const { error } = await supabase.from('appointments').insert({
      pet_id: data.pet_id,
      user_id: user.id,
      type: data.type,
      title: data.title,
      appointment_date: new Date(data.appointment_date).toISOString(),
      location: data.location || null,
      notes: data.notes || null,
      notify_days,
      status: 'pending',
    })

    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
      return
    }

    toast.success(t('addSuccess'))
    router.push(`/${locale}/appointments`)
    router.refresh()
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-lg mx-auto pb-20 lg:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/appointments`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('newAppointment')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Pet */}
        <div>
          <label className={labelClass}>{t('pet')} *</label>
          <select {...register('pet_id')} className={inputClass}>
            <option value="">{locale === 'th' ? 'เลือกสัตว์เลี้ยง' : 'Select pet'}</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {PET_EMOJI[pet.type]} {pet.name}
              </option>
            ))}
          </select>
          {errors.pet_id && <p className="text-red-500 text-xs mt-1">{errors.pet_id.message}</p>}
        </div>

        {/* Type */}
        <div>
          <label className={labelClass}>{t('appointmentType')} *</label>
          <div className="grid grid-cols-4 gap-2">
            {(['vet', 'vaccine', 'grooming', 'other'] as const).map((type) => (
              <label key={type} className="cursor-pointer">
                <input {...register('type')} type="radio" value={type} className="hidden peer" />
                <div className="peer-checked:bg-green-50 peer-checked:border-green-400 border border-gray-200 rounded-xl p-3 text-center transition-colors hover:bg-gray-50">
                  <div className="text-xl mb-1">
                    {type === 'vet' ? '🏥' : type === 'vaccine' ? '💉' : type === 'grooming' ? '✂️' : '📋'}
                  </div>
                  <p className="text-xs text-gray-600">{t(`types.${type}`)}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>{t('appointmentTitle')} *</label>
          <input
            {...register('title')}
            type="text"
            placeholder={locale === 'th' ? 'เช่น ฉีดวัคซีนพิษสุนัขบ้า' : 'e.g. Rabies vaccination'}
            className={inputClass}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        {/* Date — Custom DateTimePicker */}
        <div>
          <label className={labelClass}>{t('appointmentDate')} *</label>
          <Controller
            name="appointment_date"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                locale={locale}
                placeholder={locale === 'th' ? 'เลือกวันและเวลา' : 'Select date & time'}
              />
            )}
          />
          {errors.appointment_date && (
            <p className="text-red-500 text-xs mt-1">{errors.appointment_date.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className={labelClass}>{t('location')}</label>
          <input
            {...register('location')}
            type="text"
            placeholder={locale === 'th' ? 'คลินิก / โรงพยาบาลสัตว์...' : 'Clinic / Vet hospital...'}
            className={inputClass}
          />
        </div>

        {/* Notify Days */}
        <div>
          <label className={labelClass}>{t('notifyDays')}</label>
          <div className="flex gap-3">
            {([1, 2, 3] as const).map((day) => (
              <label key={day} className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register(`notify_${day}` as 'notify_1' | 'notify_2' | 'notify_3')}
                  type="checkbox"
                  className="w-4 h-4 accent-green-500"
                />
                <span className="text-sm text-gray-700">{t(`day${day}`)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>{t('notes')}</label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder={locale === 'th' ? 'โน้ตเพิ่มเติม...' : 'Additional notes...'}
            className={`${inputClass} resize-none`}
          />
        </div>

        <p className="text-xs text-gray-400 bg-green-50 rounded-xl p-3">
          ℹ️ {t('completedNote')}
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {t('newAppointment')}
        </button>
      </form>
    </div>
  )
}
