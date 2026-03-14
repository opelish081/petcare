'use client'
// app/[locale]/(app)/calendar/page.tsx — Calendar View

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  startOfWeek, endOfWeek
} from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { Appointment } from '@/types'
import { cn } from '@/lib/utils'

const TYPE_COLOR: Record<string, { dot: string; badge: string; text: string }> = {
  vet:      { dot: 'bg-blue-400',   badge: 'bg-blue-50 border-blue-200',   text: 'text-blue-700' },
  vaccine:  { dot: 'bg-purple-400', badge: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  grooming: { dot: 'bg-pink-400',   badge: 'bg-pink-50 border-pink-200',   text: 'text-pink-700' },
  other:    { dot: 'bg-gray-400',   badge: 'bg-gray-50 border-gray-200',   text: 'text-gray-600' },
}

const APPT_ICONS: Record<string, string> = {
  vet: '🏥', vaccine: '💉', grooming: '✂️', other: '📋',
}

export default function CalendarPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const dateLocale = locale === 'th' ? th : enUS
  const supabase = createClient()

  const [viewDate, setViewDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const weekDays = locale === 'th'
    ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  useEffect(() => { fetchAppointments() }, [viewDate])

  const fetchAppointments = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('appointments')
      .select('*, pet:pets(name, type)')
      .eq('user_id', user.id)
      .gte('appointment_date', calStart.toISOString())
      .lte('appointment_date', calEnd.toISOString())
      .neq('status', 'cancelled')
      .order('appointment_date')
    setAppointments(data || [])
    setLoading(false)
  }

  const getApptForDay = (day: Date) =>
    appointments.filter(a => isSameDay(new Date(a.appointment_date), day))

  const selectedDayAppts = selectedDay ? getApptForDay(selectedDay) : []

  const handleDayClick = (day: Date) => {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null)
    } else {
      setSelectedDay(day)
    }
  }

  // นัดหมายทั้งเดือน
  const monthAppts = appointments.filter(a =>
    isSameMonth(new Date(a.appointment_date), viewDate)
  )

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === 'th' ? 'ปฏิทินนัดหมาย' : 'Calendar'}
        </h1>
        <Link
          href={`/${locale}/appointments/new`}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} />
          {locale === 'th' ? 'นัดหมาย' : 'New'}
        </Link>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <button
            onClick={() => { setViewDate(subMonths(viewDate, 1)); setSelectedDay(null) }}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>

          <div className="text-center">
            <p className="text-base font-bold text-gray-900">
              {format(viewDate, 'MMMM', { locale: dateLocale })}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{format(viewDate, 'yyyy')}</p>
          </div>

          <button
            onClick={() => { setViewDate(addMonths(viewDate, 1)); setSelectedDay(null) }}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-50">
          {weekDays.map((d, i) => (
            <div key={d} className={cn(
              'text-center text-xs font-semibold py-2',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            )}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-green-400" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
            {days.map((day, i) => {
              const dayAppts = getApptForDay(day)
              const inMonth = isSameMonth(day, viewDate)
              const isTodayDate = isToday(day)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
              const isWeekend = i % 7 === 0 || i % 7 === 6

              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'min-h-[72px] p-1.5 text-left transition-colors relative',
                    !inMonth && 'bg-gray-50/60',
                    isSelected && 'bg-green-50',
                    inMonth && !isSelected && 'hover:bg-gray-50',
                  )}
                >
                  {/* Day number */}
                  <div className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 mx-auto font-medium',
                    !inMonth && 'text-gray-300',
                    inMonth && !isTodayDate && !isSelected && (isWeekend ? 'text-gray-500' : 'text-gray-700'),
                    isTodayDate && !isSelected && 'bg-green-500 text-white font-bold',
                    isSelected && !isTodayDate && 'bg-green-100 text-green-700 font-bold',
                    isSelected && isTodayDate && 'bg-green-500 text-white font-bold',
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* Appointment indicators */}
                  <div className="space-y-0.5 px-0.5">
                    {dayAppts.slice(0, 2).map((appt) => {
                      const color = TYPE_COLOR[appt.type] || TYPE_COLOR.other
                      return (
                        <div
                          key={appt.id}
                          className={cn(
                            'rounded-md px-1 py-0.5 text-[10px] font-medium truncate border',
                            color.badge, color.text
                          )}
                        >
                          <span className="hidden sm:inline">{appt.title}</span>
                          <span className="sm:hidden">{APPT_ICONS[appt.type]}</span>
                        </div>
                      )
                    })}
                    {dayAppts.length > 2 && (
                      <p className="text-[10px] text-gray-400 px-1">
                        +{dayAppts.length - 2} {locale === 'th' ? 'อื่น' : 'more'}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Stats bar */}
        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex gap-4">
            {Object.entries(TYPE_COLOR).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={cn('w-2 h-2 rounded-full', color.dot)} />
                <span className="text-xs text-gray-400">
                  {locale === 'th'
                    ? type === 'vet' ? 'หมอ' : type === 'vaccine' ? 'วัคซีน' : type === 'grooming' ? 'ตัดขน' : 'อื่นๆ'
                    : type === 'vet' ? 'Vet' : type === 'vaccine' ? 'Vaccine' : type === 'grooming' ? 'Grooming' : 'Other'
                  }
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            {monthAppts.length} {locale === 'th' ? 'นัดเดือนนี้' : 'this month'}
          </p>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {format(selectedDay, locale === 'th' ? 'EEEE d MMMM yyyy' : 'EEEE, d MMMM yyyy', { locale: dateLocale })}
              </p>
              {selectedDayAppts.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedDayAppts.length} {locale === 'th' ? 'นัดหมาย' : 'appointment(s)'}
                </p>
              )}
            </div>
            <Link
              href={`/${locale}/appointments/new`}
              className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              <Plus size={12} />
              {locale === 'th' ? 'เพิ่มนัด' : 'Add'}
            </Link>
          </div>

          {selectedDayAppts.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm text-gray-400">
                {locale === 'th' ? 'ไม่มีนัดหมายวันนี้' : 'No appointments'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedDayAppts.map((appt) => {
                const color = TYPE_COLOR[appt.type] || TYPE_COLOR.other
                return (
                  <Link
                    key={appt.id}
                    href={`/${locale}/appointments/${appt.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    {/* Color dot */}
                    <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', color.dot)} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{appt.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">
                          {format(new Date(appt.appointment_date), 'HH:mm')}
                        </p>
                        {(appt.pet as any)?.name && (
                          <>
                            <span className="text-gray-200">·</span>
                            <p className="text-xs text-gray-400">{(appt.pet as any).name}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium border flex-shrink-0',
                      appt.status === 'completed'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    )}>
                      {appt.status === 'completed'
                        ? (locale === 'th' ? 'เสร็จ' : 'Done')
                        : (locale === 'th' ? 'รอ' : 'Pending')
                      }
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* This month overview — แสดงนัดที่กำลังจะมา */}
      {!selectedDay && monthAppts.filter(a => a.status === 'pending').length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900">
              {locale === 'th' ? '📋 นัดหมายเดือนนี้' : '📋 This Month'}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {monthAppts
              .filter(a => a.status === 'pending')
              .map((appt) => {
                const color = TYPE_COLOR[appt.type] || TYPE_COLOR.other
                return (
                  <Link
                    key={appt.id}
                    href={`/${locale}/appointments/${appt.id}`}
                    onClick={() => setSelectedDay(new Date(appt.appointment_date))}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', color.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{appt.title}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(appt.appointment_date), locale === 'th' ? 'd MMM, HH:mm น.' : 'd MMM, HH:mm', { locale: dateLocale })}
                        {(appt.pet as any)?.name && ` · ${(appt.pet as any).name}`}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </Link>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
