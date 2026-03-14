'use client'
// components/layout/Sidebar.tsx

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Heart, Calendar, User, LogOut, CalendarDays } from 'lucide-react'
import { Profile } from '@/types'
import { clsx } from 'clsx'

interface SidebarProps {
  locale: string
  profile: Profile | null
}

export default function Sidebar({ locale, profile }: SidebarProps) {
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = [
    { href: `/${locale}/dashboard`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/pets`, label: t('pets'), icon: Heart },
    { href: `/${locale}/appointments`, label: t('appointments'), icon: Calendar },
    { href: `/${locale}/calendar`, label: locale === 'th' ? 'ปฏิทิน' : 'Calendar', icon: CalendarDays },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success(tAuth('logoutSuccess'))
    router.push(`/${locale}/login`)
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-30">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <span className="text-2xl">🐾</span>
        <span className="text-lg font-bold text-gray-900">PetCare</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={18} className={active ? 'text-green-600' : 'text-gray-400'} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <User size={18} className="text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="truncate">{profile?.full_name || t('profile')}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="text-gray-400" />
          {tAuth('logout')}
        </button>
      </div>
    </aside>
  )
}
