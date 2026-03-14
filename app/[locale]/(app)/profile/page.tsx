'use client'
// app/[locale]/(app)/profile/page.tsx — หน้าโปรไฟล์ผู้ใช้

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2, User, Globe, Lock } from 'lucide-react'
import { Profile } from '@/types'

const profileSchema = z.object({
  full_name: z.string().min(2, 'กรุณากรอกชื่อ'),
  locale: z.enum(['th', 'en']),
})

const passwordSchema = z.object({
  new_password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirm_password'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = useTranslations('nav')
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        profileForm.reset({
          full_name: data.full_name,
          locale: data.locale as 'th' | 'en',
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const onProfileSubmit = async (data: ProfileFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name, locale: data.locale })
      .eq('id', user.id)

    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
      return
    }

    toast.success(locale === 'th' ? 'บันทึกสำเร็จ' : 'Profile updated')

    // ถ้าเปลี่ยนภาษา → redirect ไป locale ใหม่
    if (data.locale !== locale) {
      router.push(`/${data.locale}/profile`)
    } else {
      router.refresh()
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    const { error } = await supabase.auth.updateUser({
      password: data.new_password,
    })

    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
      return
    }

    toast.success(locale === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จ' : 'Password updated')
    passwordForm.reset()
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="animate-spin text-green-500" size={28} />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold text-gray-900">{t('profile')}</h1>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <User size={28} className="text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{profile?.full_name}</p>
          <p className="text-sm text-gray-400">{profile?.email}</p>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe size={16} className="text-green-500" />
          <h2 className="text-base font-semibold text-gray-900">
            {locale === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Info'}
          </h2>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>
              {locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
            </label>
            <input {...profileForm.register('full_name')} type="text" className={inputClass} />
            {profileForm.formState.errors.full_name && (
              <p className="text-red-500 text-xs mt-1">
                {profileForm.formState.errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              {locale === 'th' ? 'ภาษา' : 'Language'}
            </label>
            <select {...profileForm.register('locale')} className={inputClass}>
              <option value="th">🇹🇭 ภาษาไทย</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {profileForm.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {locale === 'th' ? 'บันทึก' : 'Save'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={16} className="text-green-500" />
          <h2 className="text-base font-semibold text-gray-900">
            {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
          </h2>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>
              {locale === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}
            </label>
            <input
              {...passwordForm.register('new_password')}
              type="password"
              placeholder="••••••••"
              className={inputClass}
            />
            {passwordForm.formState.errors.new_password && (
              <p className="text-red-500 text-xs mt-1">
                {passwordForm.formState.errors.new_password.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              {locale === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}
            </label>
            <input
              {...passwordForm.register('confirm_password')}
              type="password"
              placeholder="••••••••"
              className={inputClass}
            />
            {passwordForm.formState.errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">
                {passwordForm.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {passwordForm.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* App Version */}
      <p className="text-center text-xs text-gray-300 pb-4">PetCare v1.0.0</p>
    </div>
  )
}
