'use client'
// components/appointments/RecurringModal.tsx
// Popup ถามหลังกด "เสร็จแล้ว" ว่าจะสร้างนัดครั้งถัดไปไหม

import { useState } from 'react'
import { addMonths, addYears, format } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { RefreshCw, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecurringModalProps {
  appointmentTitle: string
  appointmentDate: string
  appointmentType: string
  locale: string
  onConfirm: (nextDate: Date, interval: string) => Promise<void>
  onSkip: () => void
}

const INTERVALS = [
  { key: '1month', label: { th: '1 เดือน', en: '1 month' }, fn: (d: Date) => addMonths(d, 1) },
  { key: '3months', label: { th: '3 เดือน', en: '3 months' }, fn: (d: Date) => addMonths(d, 3) },
  { key: '6months', label: { th: '6 เดือน', en: '6 months' }, fn: (d: Date) => addMonths(d, 6) },
  { key: '1year', label: { th: '1 ปี', en: '1 year' }, fn: (d: Date) => addYears(d, 1) },
]

export default function RecurringModal({
  appointmentTitle,
  appointmentDate,
  appointmentType,
  locale,
  onConfirm,
  onSkip,
}: RecurringModalProps) {
  const dateLocale = locale === 'th' ? th : enUS
  const [selected, setSelected] = useState('1year')
  const [loading, setLoading] = useState(false)

  const currentDate = new Date(appointmentDate)
  const selectedInterval = INTERVALS.find(i => i.key === selected)!
  const nextDate = selectedInterval.fn(currentDate)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm(nextDate, selected)
    setLoading(false)
  }

  const APPT_ICONS: Record<string, string> = {
    vet: '🏥', vaccine: '💉', grooming: '✂️', other: '📋',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-green-50 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                {APPT_ICONS[appointmentType] || '📋'}
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium mb-0.5">
                  {locale === 'th' ? '✅ บันทึกเสร็จแล้ว!' : '✅ Marked as complete!'}
                </p>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{appointmentTitle}</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="p-1.5 rounded-full hover:bg-green-100 transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={16} className="text-green-500" />
            <p className="text-sm font-semibold text-gray-900">
              {locale === 'th' ? 'สร้างนัดครั้งถัดไปไหม?' : 'Schedule next appointment?'}
            </p>
          </div>

          {/* Interval selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {INTERVALS.map((interval) => {
              const nextPreview = interval.fn(currentDate)
              return (
                <button
                  key={interval.key}
                  type="button"
                  onClick={() => setSelected(interval.key)}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all',
                    selected === interval.key
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <p className={cn(
                    'text-sm font-semibold mb-0.5',
                    selected === interval.key ? 'text-green-700' : 'text-gray-700'
                  )}>
                    {interval.label[locale as 'th' | 'en']}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(nextPreview, 'd MMM yyyy', { locale: dateLocale })}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-2xl p-3 mb-5">
            <p className="text-xs text-gray-500 mb-1">
              {locale === 'th' ? 'นัดถัดไปจะถูกสร้างในวันที่' : 'Next appointment will be set for'}
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {format(nextDate, locale === 'th' ? 'EEEE d MMMM yyyy' : 'EEEE, d MMMM yyyy', { locale: dateLocale })}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors font-medium"
            >
              {locale === 'th' ? 'ข้ามไปก่อน' : 'Skip'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {locale === 'th' ? 'สร้างนัด' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
