import React from 'react'
// app/layout.tsx — Root layout (ไม่มี locale)
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PetCare',
  description: 'ระบบจัดการนัดหมายและสุขภาพสัตว์เลี้ยงของคุณ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
