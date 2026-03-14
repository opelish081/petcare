'use client'
import React from 'react'
// components/ui/DatePicker.tsx — เลือกวันเดือนปี (ไม่มีเวลา) สำหรับวันเกิดสัตว์เลี้ยง

import { useState, useRef, useEffect } from 'react'
import {
  format, addMonths, subMonths, addYears, subYears,
  startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek
} from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string          // YYYY-MM-DD
  onChange: (value: string) => void
  locale?: string
  placeholder?: string
  maxDate?: Date          // ไม่ให้เลือกวันในอนาคต (สำหรับวันเกิด)
}

export default function DatePicker({
  value,
  onChange,
  locale = 'th',
  placeholder,
  maxDate,
}: DatePickerProps) {
  const dateLocale = locale === 'th' ? th : enUS
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
  const [mode, setMode] = useState<'day' | 'month' | 'year'>('day')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  // คำนวณ position ของ dropdown แบบ fixed ให้ไม่ถูก clip
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropdownHeight = 380

      if (spaceBelow >= dropdownHeight) {
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width,
          minWidth: 300,
          zIndex: 9999,
        })
      } else {
        setDropdownStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + 6,
          left: rect.left,
          width: rect.width,
          minWidth: 300,
          zIndex: 9999,
        })
      }
    }
  }, [open])

  const weekDays = locale === 'th'
    ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Grid วันในเดือน
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  })

  // ปีที่แสดงใน year picker (range 12 ปี)
  const yearBase = Math.floor(viewDate.getFullYear() / 12) * 12
  const years = Array.from({ length: 12 }, (_, i) => yearBase + i)

  const selectedDate = value ? new Date(value) : null

  const isDisabled = (day: Date) => maxDate ? day > maxDate : false

  const handleSelectDay = (day: Date) => {
    if (isDisabled(day)) return
    const pad = (n: number) => String(n).padStart(2, '0')
    onChange(`${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`)
    setOpen(false)
  }

  const displayValue = value
    ? format(new Date(value), locale === 'th' ? 'd MMMM yyyy' : 'd MMMM yyyy', { locale: dateLocale })
    : ''

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(!open); setMode('day') }}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors text-left bg-white',
          open ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || placeholder || (locale === 'th' ? 'เลือกวันเกิด' : 'Select birthdate')}
        </span>
      </button>

      {open && (
        <div style={dropdownStyle} className="bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">

          {/* ===== MODE: DAY ===== */}
          {mode === 'day' && (
            <div className="p-4">
              {/* Header navigation */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                  <button type="button" onClick={() => setViewDate(subYears(viewDate, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronsLeft size={14} className="text-gray-500" />
                  </button>
                  <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={14} className="text-gray-500" />
                  </button>
                </div>

                {/* กดที่เดือน/ปีเพื่อเปลี่ยน mode */}
                <div className="flex gap-1">
                  <button type="button" onClick={() => setMode('month')}
                    className="px-2 py-1 rounded-lg hover:bg-green-50 text-sm font-semibold text-gray-800 transition-colors">
                    {format(viewDate, 'MMMM', { locale: dateLocale })}
                  </button>
                  <button type="button" onClick={() => setMode('year')}
                    className="px-2 py-1 rounded-lg hover:bg-green-50 text-sm font-semibold text-gray-800 transition-colors">
                    {format(viewDate, 'yyyy')}
                  </button>
                </div>

                <div className="flex gap-1">
                  <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRight size={14} className="text-gray-500" />
                  </button>
                  <button type="button" onClick={() => setViewDate(addYears(viewDate, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronsRight size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {days.map((day) => {
                  const inMonth = isSameMonth(day, viewDate)
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                  const isTodayDate = isToday(day)
                  const disabled = isDisabled(day)

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      disabled={disabled}
                      className={cn(
                        'w-full aspect-square flex items-center justify-center rounded-full text-sm transition-colors',
                        !inMonth && 'text-gray-300',
                        inMonth && !isSelected && !disabled && 'hover:bg-green-50 text-gray-700',
                        isTodayDate && !isSelected && 'font-bold text-green-600',
                        isSelected && 'bg-green-500 text-white font-semibold shadow-sm',
                        disabled && 'text-gray-300 cursor-not-allowed opacity-50',
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>

              {/* Clear button */}
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false) }}
                  className="w-full mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  {locale === 'th' ? 'ล้างค่า' : 'Clear'}
                </button>
              )}
            </div>
          )}

          {/* ===== MODE: MONTH ===== */}
          {mode === 'month' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => setViewDate(subYears(viewDate, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronLeft size={16} className="text-gray-500" />
                </button>
                <button type="button" onClick={() => setMode('year')}
                  className="text-sm font-bold text-gray-900 hover:text-green-600 transition-colors">
                  {format(viewDate, 'yyyy')}
                </button>
                <button type="button" onClick={() => setViewDate(addYears(viewDate, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const m = new Date(viewDate.getFullYear(), i, 1)
                  const isCurrentMonth = viewDate.getMonth() === i
                  return (
                    <button key={i} type="button"
                      onClick={() => { setViewDate(new Date(viewDate.getFullYear(), i, 1)); setMode('day') }}
                      className={cn(
                        'py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isCurrentMonth ? 'bg-green-500 text-white' : 'hover:bg-green-50 text-gray-700'
                      )}
                    >
                      {format(m, 'MMM', { locale: dateLocale })}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== MODE: YEAR ===== */}
          {mode === 'year' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => setViewDate(subYears(viewDate, 12))}
                  className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronLeft size={16} className="text-gray-500" />
                </button>
                <p className="text-sm font-bold text-gray-900">{yearBase} – {yearBase + 11}</p>
                <button type="button" onClick={() => setViewDate(addYears(viewDate, 12))}
                  className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {years.map(year => (
                  <button key={year} type="button"
                    onClick={() => { setViewDate(new Date(year, viewDate.getMonth(), 1)); setMode('month') }}
                    className={cn(
                      'py-2.5 rounded-xl text-sm font-medium transition-colors',
                      viewDate.getFullYear() === year ? 'bg-green-500 text-white' : 'hover:bg-green-50 text-gray-700'
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
