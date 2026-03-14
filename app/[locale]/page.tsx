// app/[locale]/page.tsx — Landing Page
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Heart, Bell, Calendar, Shield } from 'lucide-react'

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = useTranslations()

  const features = [
    {
      icon: Heart,
      title: locale === 'th' ? 'จัดการสัตว์เลี้ยง' : 'Pet Management',
      desc: locale === 'th'
        ? 'เก็บข้อมูลสัตว์เลี้ยงทุกตัว รูปภาพ สายพันธุ์ และประวัติสุขภาพ'
        : 'Keep track of all your pets, photos, breeds, and health history',
    },
    {
      icon: Calendar,
      title: locale === 'th' ? 'นัดหมายง่ายๆ' : 'Easy Scheduling',
      desc: locale === 'th'
        ? 'สร้างนัดหมายหมอ ตัดขน และฉีดวัคซีนได้ในที่เดียว'
        : 'Schedule vet visits, grooming, and vaccinations in one place',
    },
    {
      icon: Bell,
      title: locale === 'th' ? 'แจ้งเตือนอัตโนมัติ' : 'Auto Reminders',
      desc: locale === 'th'
        ? 'รับอีเมลแจ้งเตือนล่วงหน้า 1, 2, 3 วัน ก่อนถึงวันนัด'
        : 'Get email reminders 1, 2, 3 days before appointments',
    },
    {
      icon: Shield,
      title: locale === 'th' ? 'ประวัติสุขภาพ' : 'Health Records',
      desc: locale === 'th'
        ? 'บันทึกประวัติการรักษาอัตโนมัติเมื่อนัดหมายเสร็จ'
        : 'Auto-save health records when appointments are completed',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-bold text-gray-900">PetCare</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/login`}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t('auth.login')}
          </Link>
          <Link
            href={`/${locale}/register`}
            className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('auth.register')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="text-6xl mb-6">🐾</div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {locale === 'th' ? 'ดูแลสัตว์เลี้ยงที่รัก' : 'Care for Your'}
          <br />
          <span className="text-green-500">
            {locale === 'th' ? 'ให้ง่ายขึ้น' : 'Beloved Pets'}
          </span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          {locale === 'th'
            ? 'ระบบจัดการนัดหมายและประวัติสุขภาพสัตว์เลี้ยง พร้อมแจ้งเตือนอัตโนมัติทางอีเมล'
            : 'Manage pet appointments and health records with automatic email reminders'}
        </p>
        <Link
          href={`/${locale}/register`}
          className="inline-block bg-green-500 hover:bg-green-600 text-white text-lg font-medium px-8 py-4 rounded-xl transition-colors shadow-lg shadow-green-200"
        >
          {locale === 'th' ? 'เริ่มต้นใช้งานฟรี' : 'Get Started Free'} →
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-green-50 hover:border-green-100 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100">
        © 2024 PetCare — Made with 🐾
      </footer>
    </main>
  )
}
