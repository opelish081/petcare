// lib/email.ts — Email templates และ Resend helper

import { Resend } from 'resend'
import { Appointment, Pet, Profile } from '@/types'
import { format } from 'date-fns'
import { th, enUS } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)

// Tips ตามประเภทนัดหมาย
const TIPS: Record<string, { th: string[]; en: string[] }> = {
  vet: {
    th: [
      '🍽️ งดอาหาร 4-6 ชั่วโมงก่อนพบหมอ (กรณีตรวจเลือด)',
      '📋 เตรียมสมุดสุขภาพสัตว์เลี้ยงให้พร้อม',
      '🚗 เผื่อเวลาเดินทางเผื่อรถติด',
      '💊 จดรายการยาที่กินอยู่ (ถ้ามี)',
    ],
    en: [
      '🍽️ Fast 4-6 hours before visit (if blood test)',
      '📋 Bring your pet\'s health booklet',
      '🚗 Allow extra travel time',
      '💊 Note any current medications',
    ],
  },
  vaccine: {
    th: [
      '📗 เตรียมสมุดวัคซีนให้พร้อม',
      '✅ ตรวจสอบให้แน่ใจว่าสัตว์เลี้ยงมีสุขภาพดีก่อนฉีด',
      '🚫 หลีกเลี่ยงการอาบน้ำ 24 ชั่วโมงหลังฉีดวัคซีน',
      '👀 สังเกตอาการหลังฉีด เช่น บวม เซ หรือไม่กระตือรือร้น',
    ],
    en: [
      '📗 Bring vaccination record/booklet',
      '✅ Ensure your pet is healthy before vaccination',
      '🚫 Avoid bathing 24 hours after vaccination',
      '👀 Watch for side effects: swelling, lethargy',
    ],
  },
  grooming: {
    th: [
      '🛁 อาบน้ำสัตว์เลี้ยงก่อนนัดได้เลย หรือปล่อยให้ร้านจัดการ',
      '✂️ แจ้งทรงขนที่ต้องการให้ร้านทราบล่วงหน้า',
      '🍖 ให้อาหารเบาๆ ก่อนไปเพื่อลดความเครียด',
      '🐾 พาไปเดินเล่นก่อนเพื่อให้ขับถ่ายก่อนเข้าร้าน',
    ],
    en: [
      '🛁 You can bathe your pet before, or let the salon handle it',
      '✂️ Tell the groomer your preferred style in advance',
      '🍖 Light meal before to reduce stress',
      '🐾 Walk your pet first to let them relieve themselves',
    ],
  },
  other: {
    th: [
      '📋 เตรียมเอกสารที่เกี่ยวข้องให้พร้อม',
      '⏰ มาก่อนเวลาสักเล็กน้อย',
      '🐾 ดูแลให้สัตว์เลี้ยงสบายใจก่อนออกเดินทาง',
    ],
    en: [
      '📋 Prepare relevant documents',
      '⏰ Arrive a few minutes early',
      '🐾 Keep your pet calm before the trip',
    ],
  },
}

interface SendReminderParams {
  appointment: Appointment
  pet: Pet
  profile: Profile
  daysLeft: number
}

export async function sendAppointmentReminder({
  appointment,
  pet,
  profile,
  daysLeft,
}: SendReminderParams) {
  const locale = profile.locale || 'th'
  const dateLocale = locale === 'th' ? th : enUS

  const daysText: Record<number, Record<string, string>> = {
    1: { th: 'พรุ่งนี้', en: 'tomorrow' },
    2: { th: 'อีก 2 วัน', en: 'in 2 days' },
    3: { th: 'อีก 3 วัน', en: 'in 3 days' },
  }

  const tips = TIPS[appointment.type]?.[locale as 'th' | 'en'] || TIPS.other[locale as 'th' | 'en']
  const apptDateStr = format(
    new Date(appointment.appointment_date),
    locale === 'th' ? 'EEEE d MMMM yyyy เวลา HH:mm น.' : 'EEEE, MMMM d, yyyy at HH:mm',
    { locale: dateLocale }
  )

  const subject = locale === 'th'
    ? `🐾 แจ้งเตือน: ${pet.name} มีนัดหมาย${daysText[daysLeft]?.th}`
    : `🐾 Reminder: ${pet.name} has an appointment ${daysText[daysLeft]?.en}`

  const tipsHtml = tips.map((tip) => `<li style="margin-bottom:8px">${tip}</li>`).join('')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const appointmentUrl = `${appUrl}/${locale}/appointments/${appointment.id}`

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">

    <!-- Header -->
    <div style="background:#ffffff;border-radius:20px;border:1px solid #f0f0f0;overflow:hidden;margin-bottom:16px">
      <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">🐾</div>
        <h1 style="color:white;margin:0;font-size:22px;font-weight:700">PetCare</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">
          ${locale === 'th' ? 'ระบบแจ้งเตือนนัดหมายสัตว์เลี้ยง' : 'Pet Appointment Reminder'}
        </p>
      </div>

      <div style="padding:28px">
        <!-- Greeting -->
        <p style="color:#374151;font-size:16px;margin:0 0 20px">
          ${locale === 'th' ? `สวัสดีคุณ ${profile.full_name},` : `Hello ${profile.full_name},`}
        </p>

        <!-- Alert Box -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:14px;color:#16a34a;font-weight:600">
            ${locale === 'th' ? `⏰ ${pet.name} มีนัดหมาย${daysText[daysLeft]?.th}!` : `⏰ ${pet.name} has an appointment ${daysText[daysLeft]?.en}!`}
          </p>
          <h2 style="margin:0;font-size:18px;color:#111827;font-weight:700">${appointment.title}</h2>
        </div>

        <!-- Details -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6">
              <span style="font-size:13px;color:#9ca3af">${locale === 'th' ? 'สัตว์เลี้ยง' : 'Pet'}</span>
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right">
              <span style="font-size:13px;font-weight:600;color:#111827">${pet.name}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6">
              <span style="font-size:13px;color:#9ca3af">${locale === 'th' ? 'วันเวลา' : 'Date & Time'}</span>
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right">
              <span style="font-size:13px;font-weight:600;color:#111827">${apptDateStr}</span>
            </td>
          </tr>
          ${appointment.location ? `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6">
              <span style="font-size:13px;color:#9ca3af">${locale === 'th' ? 'สถานที่' : 'Location'}</span>
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right">
              <span style="font-size:13px;font-weight:600;color:#111827">${appointment.location}</span>
            </td>
          </tr>` : ''}
        </table>

        <!-- Tips -->
        <div style="background:#fafafa;border-radius:14px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151">
            ${locale === 'th' ? '✅ เตรียมตัวก่อนวันนัด' : '✅ Preparation Tips'}
          </p>
          <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.6">
            ${tipsHtml}
          </ul>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center">
          <a
            href="${appointmentUrl}"
            style="display:inline-block;background:#22c55e;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px"
          >
            ${locale === 'th' ? 'ดูรายละเอียดนัดหมาย' : 'View Appointment Details'} →
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin:0">
      ${locale === 'th' ? 'อีเมลนี้ส่งโดยอัตโนมัติจากระบบ PetCare' : 'This email was sent automatically by PetCare'}
      <br>© ${new Date().getFullYear()} PetCare
    </p>
  </div>
</body>
</html>
  `

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: profile.email,
    subject,
    html,
  })
}
