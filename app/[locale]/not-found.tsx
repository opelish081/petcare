// app/[locale]/not-found.tsx — หน้า 404
import Link from 'next/link'

export default function NotFound({
  params,
}: {
  params?: { locale?: string }
}) {
  const locale = params?.locale || 'th'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl mb-6">🐾</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-400 mb-8">
          {locale === 'th'
            ? 'ไม่พบหน้าที่คุณต้องการ'
            : 'Page not found'}
        </p>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          {locale === 'th' ? '← กลับหน้าหลัก' : '← Back to Dashboard'}
        </Link>
      </div>
    </div>
  )
}
