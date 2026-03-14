// app/[locale]/(app)/loading.tsx — Loading state สำหรับ App pages
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">กำลังโหลด...</p>
      </div>
    </div>
  )
}
