'use client'
// components/layout/MobileNav.tsx

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Heart, Calendar, CalendarDays, LogOut } from 'lucide-react'
import { Profile } from '@/types'
import { clsx } from 'clsx'

interface MobileNavProps {
  locale: string
  profile: Profile | null
}

export default function MobileNav({ locale, profile }: MobileNavProps) {
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
    <>
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐾</span>
          <span className="font-bold text-gray-900">PetCare</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={18} />
              <span className="text-[10px]">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
