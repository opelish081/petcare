'use client'
import React from 'react'
// app/[locale]/(app)/pets/new/page.tsx — เพิ่มสัตว์เลี้ยงใหม่

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import Link from 'next/link'
import DatePicker from '@/components/ui/DatePicker'

const schema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อสัตว์เลี้ยง'),
  type: z.enum(['dog', 'cat', 'rabbit', 'bird', 'fish', 'other']),
  breed: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.enum(['male', 'female', '']).optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function NewPetPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('pets')
  const router = useRouter()
  const supabase = createClient()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'dog' },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let image_url: string | undefined
    if (imageFile) {
      setUploading(true)
      const ext = imageFile.name.split('.').pop()
      const filename = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('pet-images').upload(filename, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('pet-images').getPublicUrl(filename)
        image_url = urlData.publicUrl
      }
      setUploading(false)
    }

    const { error } = await supabase.from('pets').insert({
      user_id: user.id,
      name: data.name,
      type: data.type,
      breed: data.breed || null,
      birthdate: data.birthdate || null,
      gender: data.gender || null,
      notes: data.notes || null,
      image_url: image_url || null,
    })

    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
      return
    }
    toast.success(t('addSuccess'))
    router.push(`/${locale}/pets`)
    router.refresh()
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-lg mx-auto pb-20 lg:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/pets`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('addPet')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Image Upload */}
        <div className="flex flex-col items-center">
          <label className="cursor-pointer group">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 group-hover:bg-green-50 border-2 border-dashed border-gray-200 group-hover:border-green-300 flex items-center justify-center overflow-hidden transition-colors">
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                : <div className="text-center"><Upload size={20} className="text-gray-300 mx-auto mb-1" /><span className="text-xs text-gray-400">{t('image')}</span></div>
              }
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
          <p className="text-xs text-gray-400 mt-2">{locale === 'th' ? 'กดเพื่ออัปโหลดรูป' : 'Tap to upload photo'}</p>
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>{t('name')} *</label>
          <input {...register('name')} type="text" placeholder={locale === 'th' ? 'ชื่อสัตว์เลี้ยง' : 'Pet name'} className={inputClass} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Type */}
        <div>
          <label className={labelClass}>{t('type')} *</label>
          <div className="grid grid-cols-3 gap-2">
            {(['dog', 'cat', 'rabbit', 'bird', 'fish', 'other'] as const).map((type) => (
              <label key={type} className="cursor-pointer">
                <input {...register('type')} type="radio" value={type} className="hidden peer" />
                <div className="peer-checked:bg-green-50 peer-checked:border-green-400 border border-gray-200 rounded-xl p-2.5 text-center transition-colors hover:bg-gray-50">
                  <div className="text-xl mb-0.5">
                    {type === 'dog' ? '🐶' : type === 'cat' ? '🐱' : type === 'rabbit' ? '🐰' : type === 'bird' ? '🐦' : type === 'fish' ? '🐟' : '🐾'}
                  </div>
                  <p className="text-xs text-gray-600">{t(`types.${type}`)}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Breed */}
        <div>
          <label className={labelClass}>{t('breed')}</label>
          <input {...register('breed')} type="text" placeholder={locale === 'th' ? 'สายพันธุ์ (ถ้ามี)' : 'Breed (optional)'} className={inputClass} />
        </div>

        {/* Birthdate — ใช้ DatePicker */}
        <div>
          <label className={labelClass}>{t('birthdate')}</label>
          <Controller
            name="birthdate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                locale={locale}
                maxDate={new Date()}
                placeholder={locale === 'th' ? 'เลือกวันเกิด' : 'Select birthdate'}
              />
            )}
          />
        </div>

        {/* Gender */}
        <div>
          <label className={labelClass}>{t('gender')}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: '', label: locale === 'th' ? 'ไม่ระบุ' : 'Unknown', icon: '❓' },
              { value: 'male', label: t('male'), icon: '♂️' },
              { value: 'female', label: t('female'), icon: '♀️' },
            ].map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input {...register('gender')} type="radio" value={opt.value} className="hidden peer" defaultChecked={opt.value === ''} />
                <div className="peer-checked:bg-green-50 peer-checked:border-green-400 border border-gray-200 rounded-xl p-2.5 text-center transition-colors hover:bg-gray-50">
                  <div className="text-lg mb-0.5">{opt.icon}</div>
                  <p className="text-xs text-gray-600">{opt.label}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>{t('notes')}</label>
          <textarea {...register('notes')} rows={3} placeholder={locale === 'th' ? 'โน้ตเพิ่มเติม เช่น อาหารที่แพ้...' : 'Additional notes...'} className={`${inputClass} resize-none`} />
        </div>

        <button type="submit" disabled={isSubmitting || uploading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {(isSubmitting || uploading) && <Loader2 size={16} className="animate-spin" />}
          {t('addPet')}
        </button>
      </form>
    </div>
  )
}
