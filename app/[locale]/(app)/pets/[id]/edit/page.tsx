'use client'
import React from 'react'
// app/[locale]/(app)/pets/[id]/edit/page.tsx — แก้ไขสัตว์เลี้ยง

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Upload, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Pet } from '@/types'
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

export default function EditPetPage({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  const t = useTranslations('pets')
  const router = useRouter()
  const supabase = createClient()
  const [pet, setPet] = useState<Pet | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const fetchPet = async () => {
      const { data } = await supabase.from('pets').select('*').eq('id', id).single()
      if (data) {
        setPet(data)
        setImagePreview(data.image_url || null)
        reset({
          name: data.name,
          type: data.type,
          breed: data.breed || '',
          birthdate: data.birthdate || '',
          gender: data.gender || '',
          notes: data.notes || '',
        })
      }
      setLoading(false)
    }
    fetchPet()
  }, [id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !pet) return

    let image_url = pet.image_url
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

    const { error } = await supabase.from('pets').update({
      name: data.name,
      type: data.type,
      breed: data.breed || null,
      birthdate: data.birthdate || null,
      gender: data.gender || null,
      notes: data.notes || null,
      image_url,
    }).eq('id', id)

    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
      return
    }
    toast.success(t('editSuccess'))
    router.push(`/${locale}/pets/${id}`)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm', { name: pet?.name || '' }))) return
    setDeleting(true)
    const { error } = await supabase.from('pets').delete().eq('id', id)
    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
      setDeleting(false)
      return
    }
    toast.success(t('deleteSuccess'))
    router.push(`/${locale}/pets`)
    router.refresh()
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin text-green-500" size={28} />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/pets/${id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{locale === 'th' ? 'แก้ไขข้อมูล' : 'Edit Pet'}</h1>
        </div>
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          {locale === 'th' ? 'ลบ' : 'Delete'}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Image */}
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
          <p className="text-xs text-gray-400 mt-2">{locale === 'th' ? 'กดเพื่อเปลี่ยนรูป' : 'Tap to change photo'}</p>
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>{t('name')} *</label>
          <input {...register('name')} type="text" className={inputClass} />
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
          <input {...register('breed')} type="text" className={inputClass} />
        </div>

        {/* Birthdate — DatePicker */}
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
                <input {...register('gender')} type="radio" value={opt.value} className="hidden peer" />
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
          <textarea {...register('notes')} rows={3} className={`${inputClass} resize-none`} />
        </div>

        <button type="submit" disabled={isSubmitting || uploading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {(isSubmitting || uploading) && <Loader2 size={16} className="animate-spin" />}
          {locale === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
