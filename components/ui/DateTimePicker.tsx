'use client'
// components/ui/DateTimePicker.tsx — Custom Date/Time Picker สวยงามและใช้งานง่าย

import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast, startOfWeek, endOfWeek } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value?: string         // ISO string หรือ datetime-local string
  onChange: (value: string) => void
  locale?: string
  minDate?: Date         // ไม่ให้เลือกวันก่อนหน้านี้
  placeholder?: string
}

export default function DateTimePicker({
  value,
  onChange,
  locale = 'th',
  minDate,
  placeholder,
}: DateTimePickerProps) {
  const dateLocale = locale === 'th' ? th : enUS
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
  const [hour, setHour] = useState(value ? new Date(value).getHours() : 9)
  const [minute, setMinute] = useState(value ? new Date(value).getMinutes() : 0)
  const [step, setStep] = useState<'date' | 'time'>('date')

  const weekDays = locale === 'th'
    ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // สร้าง grid ของวันในเดือน
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const handleSelectDate = (day: Date) => {
    if (minDate && isPast(day) && !isToday(day)) return
    setSelectedDate(day)
    setStep('time')
  }

  const handleConfirm = () => {
    if (!selectedDate) return
    const result = new Date(selectedDate)
    result.setHours(hour, minute, 0, 0)
    // format เป็น datetime-local string
    const pad = (n: number) => String(n).padStart(2, '0')
    const formatted = `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}T${pad(hour)}:${pad(minute)}`
    onChange(formatted)
    setOpen(false)
    setStep('date')
  }

  const displayValue = value
    ? format(new Date(value), locale === 'th' ? 'd MMM yyyy HH:mm น.' : 'd MMM yyyy, HH:mm', { locale: dateLocale })
    : ''

  return (
    <div className="relative">
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors text-left',
          open
            ? 'border-green-400 ring-2 ring-green-100'
            : 'border-gray-200 hover:border-gray-300',
          !displayValue && 'text-gray-400'
        )}
      >
        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || placeholder || (locale === 'th' ? 'เลือกวันเวลา' : 'Select date & time')}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[320px] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">

          {/* ---- STEP 1: DATE PICKER ---- */}
          {step === 'date' && (
            <div className="p-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setViewDate(subMonths(viewDate, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <p className="text-sm font-semibold text-gray-900">
                  {format(viewDate, locale === 'th' ? 'MMMM yyyy' : 'MMMM yyyy', { locale: dateLocale })}
                </p>
                <button
                  type="button"
                  onClick={() => setViewDate(addMonths(viewDate, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-y-1">
                {days.map((day) => {
                  const isCurrentMonth = isSameMonth(day, viewDate)
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                  const isTodayDate = isToday(day)
                  const isDisabled = minDate ? (isPast(day) && !isToday(day)) : false

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleSelectDate(day)}
                      disabled={isDisabled}
                      className={cn(
                        'w-full aspect-square flex items-center justify-center rounded-full text-sm transition-colors',
                        !isCurrentMonth && 'text-gray-300',
                        isCurrentMonth && !isSelected && !isDisabled && 'hover:bg-green-50 text-gray-700',
                        isTodayDate && !isSelected && 'font-bold text-green-600',
                        isSelected && 'bg-green-500 text-white font-semibold',
                        isDisabled && 'text-gray-300 cursor-not-allowed',
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>

              {/* Today shortcut */}
              <button
                type="button"
                onClick={() => { setViewDate(new Date()); handleSelectDate(new Date()) }}
                className="w-full mt-3 text-sm text-green-600 hover:text-green-700 font-medium py-2 border-t border-gray-50"
              >
                {locale === 'th' ? 'วันนี้' : 'Today'}
              </button>
            </div>
          )}

          {/* ---- STEP 2: TIME PICKER ---- */}
          {step === 'time' && (
            <div className="p-4">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep('date')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ChevronLeft size={14} />
                {selectedDate && format(selectedDate, locale === 'th' ? 'd MMMM yyyy' : 'd MMM yyyy', { locale: dateLocale })}
              </button>

              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-green-500" />
                <p className="text-sm font-semibold text-gray-900">
                  {locale === 'th' ? 'เลือกเวลา' : 'Select time'}
                </p>
              </div>

              {/* Time display */}
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-gray-900 tabular-nums">
                  {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {locale === 'th' ? 'น.' : 'hrs'}
                </p>
              </div>

              {/* Hour slider */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{locale === 'th' ? 'ชั่วโมง' : 'Hour'}</span>
                  <span>{String(hour).padStart(2, '0')}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={23}
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                  <span>00</span>
                  <span>12</span>
                  <span>23</span>
                </div>
              </div>

              {/* Minute buttons */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 mb-2">
                  {locale === 'th' ? 'นาที' : 'Minute'}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 15, 30, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinute(m)}
                      className={cn(
                        'py-2 rounded-xl text-sm font-medium transition-colors',
                        minute === m
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                      )}
                    >
                      :{String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm */}
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-colors"
              >
                {locale === 'th' ? 'ยืนยัน' : 'Confirm'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setOpen(false); setStep('date') }}
        />
      )}
    </div>
  )
}
