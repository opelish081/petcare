// lib/utils.ts — Helper functions ที่ใช้ทั่วโปรเจค

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInYears, differenceInMonths, format } from 'date-fns'
import { th, enUS } from 'date-fns/locale'

// ============================================================
// cn() — รวม class names (Tailwind-safe)
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// formatAge() — แปลงวันเกิดเป็นอายุ
// ============================================================
export function formatAge(birthdate: string, locale: string = 'th'): string {
  const birth = new Date(birthdate)
  const years = differenceInYears(new Date(), birth)
  const months = differenceInMonths(new Date(), birth) % 12

  if (locale === 'th') {
    if (years === 0) return `${months} เดือน`
    if (months === 0) return `${years} ปี`
    return `${years} ปี ${months} เดือน`
  } else {
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`
    return `${years}y ${months}m`
  }
}

// ============================================================
// formatDate() — แสดงวันที่สวยงาม
// ============================================================
export function formatDate(
  dateStr: string,
  locale: string = 'th',
  formatStr: string = 'd MMM yyyy'
): string {
  return format(new Date(dateStr), formatStr, {
    locale: locale === 'th' ? th : enUS,
  })
}

// ============================================================
// formatDateTime() — แสดงวันที่ + เวลา
// ============================================================
export function formatDateTime(dateStr: string, locale: string = 'th'): string {
  const dateLocale = locale === 'th' ? th : enUS
  if (locale === 'th') {
    return format(new Date(dateStr), 'd MMM yyyy เวลา HH:mm น.', { locale: dateLocale })
  }
  return format(new Date(dateStr), 'd MMM yyyy, HH:mm', { locale: dateLocale })
}

// ============================================================
// getPetEmoji() — emoji ตามประเภทสัตว์เลี้ยง
// ============================================================
export function getPetEmoji(type: string): string {
  const map: Record<string, string> = {
    dog: '🐶',
    cat: '🐱',
    rabbit: '🐰',
    bird: '🐦',
    fish: '🐟',
    other: '🐾',
  }
  return map[type] || '🐾'
}

// ============================================================
// getAppointmentIcon() — emoji ตามประเภทนัดหมาย
// ============================================================
export function getAppointmentIcon(type: string): string {
  const map: Record<string, string> = {
    vet: '🏥',
    vaccine: '💉',
    grooming: '✂️',
    other: '📋',
  }
  return map[type] || '📋'
}

// ============================================================
// getHealthIcon() — emoji ตามประเภท health record
// ============================================================
export function getHealthIcon(type: string): string {
  const map: Record<string, string> = {
    vaccine: '💉',
    checkup: '🏥',
    grooming: '✂️',
    treatment: '💊',
    other: '📋',
  }
  return map[type] || '📋'
}

// ============================================================
// getStatusColor() — Tailwind class สำหรับ status badge
// ============================================================
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  return map[status] || 'bg-gray-100 text-gray-500'
}

// ============================================================
// mapAppointmentTypeToHealthType()
// แปลง appointment type → health record type
// ============================================================
export function mapAppointmentTypeToHealthType(
  apptType: string
): 'vaccine' | 'checkup' | 'grooming' | 'other' {
  const map: Record<string, 'vaccine' | 'checkup' | 'grooming' | 'other'> = {
    vaccine: 'vaccine',
    vet: 'checkup',
    grooming: 'grooming',
    other: 'other',
  }
  return map[apptType] || 'other'
}
