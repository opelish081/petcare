// app/api/cron/send-reminders/route.ts
// Cron Job: รันทุกวัน 08:00 น. — ส่ง Email แจ้งเตือนล่วงหน้า 1, 2, 3 วัน
// ตั้งค่าใน vercel.json: {"crons": [{"path": "/api/cron/send-reminders", "schedule": "0 1 * * *"}]}
// (0 1 UTC = 08:00 น. เวลาไทย UTC+7)

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendAppointmentReminder } from '@/lib/email'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  // ตรวจสอบ secret ป้องกันคนอื่นเรียก endpoint นี้โดยตรง
  const secret = request.headers.get('x-cron-secret')
    || request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results = { sent: 0, skipped: 0, failed: 0 }

  // วนลูปตรวจสอบ 1, 2, 3 วัน
  for (const daysLeft of [1, 2, 3]) {
    const targetDate = addDays(new Date(), daysLeft)
    const dayStart = startOfDay(targetDate).toISOString()
    const dayEnd = endOfDay(targetDate).toISOString()

    // ดึงนัดหมายที่ตรงกับวันนี้ + daysLeft และยัง pending
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        pet:pets(*),
        user:profiles(*)
      `)
      .eq('status', 'pending')
      .gte('appointment_date', dayStart)
      .lte('appointment_date', dayEnd)
      .contains('notify_days', [daysLeft])

    if (error || !appointments) continue

    for (const appt of appointments) {
      // ตรวจว่าส่งไปแล้วหรือยัง (ป้องกันส่งซ้ำ)
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('appointment_id', appt.id)
        .eq('days_before', daysLeft)
        .single()

      if (existingLog) {
        results.skipped++
        continue
      }

      try {
        await sendAppointmentReminder({
          appointment: appt,
          pet: appt.pet,
          profile: appt.user,
          daysLeft,
        })

        // บันทึก log ว่าส่งแล้ว
        await supabase.from('email_logs').insert({
          appointment_id: appt.id,
          days_before: daysLeft,
          status: 'sent',
        })

        results.sent++
      } catch (err) {
        console.error('Failed to send reminder:', err)

        // บันทึก log ว่าส่งไม่สำเร็จ
        await supabase.from('email_logs').insert({
          appointment_id: appt.id,
          days_before: daysLeft,
          status: 'failed',
        })

        results.failed++
      }
    }
  }

  console.log('Cron results:', results)

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  })
}
