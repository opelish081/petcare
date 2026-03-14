// ============================================================
// types/index.ts — Type definitions สำหรับทั้งโปรเจค
// ============================================================

export type Locale = 'th' | 'en'

// ---------- Profile ----------
export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  locale: Locale
  created_at: string
}

// ---------- Pet ----------
export type PetType = 'dog' | 'cat' | 'rabbit' | 'bird' | 'fish' | 'other'
export type PetGender = 'male' | 'female'

export interface Pet {
  id: string
  user_id: string
  name: string
  type: PetType
  breed?: string
  birthdate?: string
  gender?: PetGender
  image_url?: string
  notes?: string
  created_at: string
}

// ---------- Appointment ----------
export type AppointmentType = 'vet' | 'vaccine' | 'grooming' | 'other'
export type AppointmentStatus = 'pending' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  pet_id: string
  user_id: string
  type: AppointmentType
  title: string
  appointment_date: string
  location?: string
  status: AppointmentStatus
  notes?: string
  notify_days: number[] // [1, 2, 3]
  created_at: string
  // joined
  pet?: Pet
}

// ---------- Health Record ----------
export type HealthRecordType = 'vaccine' | 'checkup' | 'grooming' | 'treatment' | 'other'

export interface HealthRecord {
  id: string
  pet_id: string
  appointment_id?: string
  type: HealthRecordType
  title: string
  record_date: string
  details?: string
  next_due_date?: string
  created_at: string
  // joined
  pet?: Pet
}

// ---------- Email Log ----------
export type EmailStatus = 'sent' | 'failed'

export interface EmailLog {
  id: string
  appointment_id: string
  days_before: number
  sent_at: string
  status: EmailStatus
}
