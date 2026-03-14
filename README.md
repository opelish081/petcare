# 🐾 PetCare — ระบบแจ้งเตือนนัดหมายสัตว์เลี้ยง

ระบบจัดการสัตว์เลี้ยงและนัดหมาย พร้อมแจ้งเตือนอัตโนมัติทางอีเมล

## Tech Stack
- **Next.js 14** (App Router) — Frontend + Backend
- **Supabase** — Database (PostgreSQL) + Auth + Storage
- **Resend** — Email service
- **Vercel Cron** — ส่ง email อัตโนมัติทุกวัน 08:00 น.
- **Tailwind CSS** — Styling
- **next-intl** — ภาษาไทย / อังกฤษ

---

## 🚀 วิธีติดตั้งและรัน

### 1. Clone และติดตั้ง dependencies

```bash
git clone <your-repo>
cd petcare
npm install
```

### 2. ตั้งค่า Supabase

1. ไปที่ [supabase.com](https://supabase.com) → สร้าง Project ใหม่
2. ไปที่ **SQL Editor** → วางและรัน code จากไฟล์ `supabase/schema.sql`
3. ไปที่ **Settings → API** → คัดลอก URL และ Keys

### 3. ตั้งค่า Resend

1. ไปที่ [resend.com](https://resend.com) → สมัครและ verify domain
2. สร้าง API Key

### 4. สร้างไฟล์ .env.local

```bash
cp .env.example .env.local
```

แล้วแก้ไขค่าในไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

CRON_SECRET=my-super-secret-string-123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. รัน Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

---

## 📁 โครงสร้างโปรเจค

```
petcare/
├── app/
│   ├── [locale]/
│   │   ├── (app)/                    # หน้าที่ต้อง login
│   │   │   ├── layout.tsx            # App shell + Sidebar
│   │   │   ├── dashboard/page.tsx    # หน้าหลัก
│   │   │   ├── pets/
│   │   │   │   ├── page.tsx          # รายการสัตว์เลี้ยง
│   │   │   │   ├── new/page.tsx      # เพิ่มสัตว์เลี้ยง
│   │   │   │   └── [id]/page.tsx     # รายละเอียด + Health Timeline
│   │   │   └── appointments/
│   │   │       ├── page.tsx          # รายการนัดหมาย
│   │   │       ├── new/page.tsx      # สร้างนัดหมาย
│   │   │       └── [id]/page.tsx     # รายละเอียด + เปลี่ยนสถานะ
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── page.tsx                  # Landing page
│   └── api/
│       └── cron/send-reminders/      # Cron job ส่ง email
│           └── route.ts
├── components/
│   └── layout/
│       ├── Sidebar.tsx               # Sidebar (Desktop)
│       └── MobileNav.tsx             # Bottom Nav (Mobile)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   └── server.ts                 # Server client + Service role
│   └── email.ts                      # Email template + Resend
├── messages/
│   ├── th.json                       # ภาษาไทย
│   └── en.json                       # ภาษาอังกฤษ
├── supabase/
│   └── schema.sql                    # SQL สร้าง Database ทั้งหมด
├── types/index.ts                    # TypeScript types
├── middleware.ts                     # Auth guard + i18n
├── vercel.json                       # Cron schedule
└── .env.example                      # Template env
```

---

## 🗄️ Database Tables

| Table | คำอธิบาย |
|-------|----------|
| `profiles` | ข้อมูล user เพิ่มเติม |
| `pets` | สัตว์เลี้ยง |
| `appointments` | นัดหมาย |
| `health_records` | ประวัติสุขภาพ |
| `email_logs` | log การส่ง email |

---

## 📧 Cron Job Email

- รันทุกวัน **08:00 น.** (เวลาไทย)
- ส่ง email แจ้งเตือนล่วงหน้า **1, 2, 3 วัน**
- มีระบบป้องกันส่งซ้ำด้วย `email_logs` table

### ทดสอบ Cron ด้วยตัวเอง:
```bash
curl http://localhost:3000/api/cron/send-reminders?secret=my-super-secret-string-123
```

---

## 🌐 Deploy บน Vercel

1. Push code ขึ้น GitHub
2. เชื่อมต่อ Vercel กับ repo
3. ใส่ Environment Variables ใน Vercel Dashboard
4. ตั้งค่า `NEXT_PUBLIC_APP_URL` เป็น URL จริงของ Vercel
5. Deploy!

Cron job จะทำงานอัตโนมัติตาม schedule ใน `vercel.json`

---

## ✨ Features

- ✅ Login / Register ด้วย Email + Password
- ✅ จัดการสัตว์เลี้ยงหลายตัว พร้อมรูปภาพ
- ✅ สร้างนัดหมาย (หมอ / วัคซีน / ตัดขน / อื่นๆ)
- ✅ Email แจ้งเตือนล่วงหน้า 1, 2, 3 วัน พร้อม Tips เตรียมตัว
- ✅ สถานะนัดหมาย (รอ / เสร็จแล้ว / ยกเลิก)
- ✅ Auto บันทึก Health Record เมื่อนัดเสร็จ
- ✅ Health Timeline ย้อนหลังของแต่ละตัว
- ✅ รองรับภาษาไทย / อังกฤษ
- ✅ Responsive Design (Mobile + Desktop)
