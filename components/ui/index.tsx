import React from 'react'
// components/ui/Badge.tsx — Badge component สำหรับแสดงสถานะ
import { cn } from '@/lib/utils'

interface BadgeProps {
  label: string
  variant?: 'green' | 'yellow' | 'red' | 'gray'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ label, variant = 'gray', size = 'sm', className }: BadgeProps) {
  const variants = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-500',
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }

  return (
    <span className={cn('rounded-full font-medium', variants[variant], sizes[size], className)}>
      {label}
    </span>
  )
}

// ============================================================
// EmptyState — แสดงเมื่อไม่มีข้อมูล
// ============================================================
interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ emoji = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <p className="text-5xl mb-4">{emoji}</p>
      <p className="text-gray-700 font-medium mb-1">{title}</p>
      {description && <p className="text-sm text-gray-400 mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

// ============================================================
// Card — Wrapper card สำหรับ section ต่างๆ
// ============================================================
interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100', className)}>
      {children}
    </div>
  )
}

// ============================================================
// SectionHeader — หัวข้อพร้อม action button
// ============================================================
interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  )
}
