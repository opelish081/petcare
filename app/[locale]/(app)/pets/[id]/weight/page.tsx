'use client'
// app/[locale]/(app)/pets/[id]/weight/page.tsx — บันทึกน้ำหนัก + กราฟ

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Minus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import DatePicker from '@/components/ui/DatePicker'
import { cn } from '@/lib/utils'

interface WeightRecord {
  id: string
  pet_id: string
  weight: number
  unit: string
  recorded_at: string
  notes: string | null
  created_at: string
}

export default function WeightPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string }
}) {
  const dateLocale = locale === 'th' ? th : enUS
  const supabase = createClient()

  const [petName, setPetName] = useState('')
  const [records, setRecords] = useState<WeightRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    const [petRes, weightRes] = await Promise.all([
      supabase.from('pets').select('name').eq('id', id).single(),
      supabase.from('weight_records').select('*').eq('pet_id', id).order('recorded_at', { ascending: true }),
    ])
    if (petRes.data) setPetName(petRes.data.name)
    setRecords(weightRes.data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
      toast.error(locale === 'th' ? 'กรุณากรอกน้ำหนักให้ถูกต้อง' : 'Please enter valid weight')
      return
    }
    if (!date) {
      toast.error(locale === 'th' ? 'กรุณาเลือกวันที่' : 'Please select a date')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('weight_records').insert({
      pet_id: id,
      weight: Number(weight),
      unit: 'kg',
      recorded_at: date,
      notes: notes || null,
    })
    if (error) {
      toast.error(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
    } else {
      toast.success(locale === 'th' ? '✅ บันทึกน้ำหนักแล้ว' : '✅ Weight saved')
      setWeight('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      setShowForm(false)
      fetchData()
    }
    setSaving(false)
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm(locale === 'th' ? 'ลบข้อมูลนี้ไหม?' : 'Delete this record?')) return
    await supabase.from('weight_records').delete().eq('id', recordId)
    toast.success(locale === 'th' ? 'ลบแล้ว' : 'Deleted')
    fetchData()
  }

  // คำนวณ trend
  const latest = records[records.length - 1]
  const previous = records[records.length - 2]
  const diff = latest && previous ? (latest.weight - previous.weight) : null
  const diffStr = diff !== null ? (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)) : null
  const trend = diff === null ? null : diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
  const avgWeight = records.length
    ? (records.reduce((s, r) => s + r.weight, 0) / records.length).toFixed(2)
    : null

  const chartData = records.map(r => ({
    date: format(new Date(r.recorded_at), 'd MMM', { locale: dateLocale }),
    weight: r.weight,
  }))

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm bg-white'

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin text-green-500" size={28} />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/pets/${id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {locale === 'th' ? 'บันทึกน้ำหนัก' : 'Weight Tracker'}
            </h1>
            <p className="text-sm text-gray-400">{petName}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors',
            showForm
              ? 'bg-gray-100 text-gray-600'
              : 'bg-green-500 hover:bg-green-600 text-white'
          )}
        >
          <Plus size={15} />
          {locale === 'th' ? 'บันทึก' : 'Add'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
          <div className="bg-green-50 px-5 py-3 border-b border-green-100">
            <p className="text-sm font-semibold text-green-800">
              ⚖️ {locale === 'th' ? 'บันทึกน้ำหนักใหม่' : 'New Weight Record'}
            </p>
          </div>
          <div className="p-5 space-y-4">
            {/* Weight input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'th' ? 'น้ำหนัก (kg) *' : 'Weight (kg) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="0.0"
                  className={inputClass + ' pr-12'}
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">kg</span>
              </div>
            </div>

            {/* Date — ใช้ DatePicker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'th' ? 'วันที่ชั่ง *' : 'Date *'}
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                locale={locale}
                maxDate={new Date()}
                placeholder={locale === 'th' ? 'เลือกวันที่ชั่งน้ำหนัก' : 'Select date'}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'th' ? 'โน้ต' : 'Notes'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={locale === 'th' ? 'เช่น หลังตรวจสุขภาพ...' : 'e.g. After checkup...'}
                className={inputClass}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors font-medium">
                {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {locale === 'th' ? 'บันทึก' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {records.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-4">⚖️</p>
          <p className="text-gray-700 font-medium mb-1">
            {locale === 'th' ? 'ยังไม่มีข้อมูลน้ำหนัก' : 'No weight records yet'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {locale === 'th' ? 'บันทึกน้ำหนักทุกครั้งที่ไปหาหมอ' : 'Record weight every vet visit'}
          </p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            <Plus size={15} />
            {locale === 'th' ? 'บันทึกครั้งแรก' : 'Add first record'}
          </button>
        </div>
      )}

      {records.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1.5">{locale === 'th' ? 'น้ำหนักล่าสุด' : 'Latest'}</p>
              <p className="text-2xl font-bold text-gray-900">{latest?.weight}</p>
              <p className="text-xs text-gray-400 mt-0.5">kg</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1.5">{locale === 'th' ? 'เปลี่ยนแปลง' : 'Change'}</p>
              <div className="flex items-center justify-center gap-1">
                {trend === 'up' && <TrendingUp size={14} className="text-red-400" />}
                {trend === 'down' && <TrendingDown size={14} className="text-green-500" />}
                {trend === 'same' && <Minus size={14} className="text-gray-400" />}
                <p className={cn(
                  'text-xl font-bold',
                  trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-500'
                )}>
                  {diffStr ?? '—'}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">kg</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1.5">{locale === 'th' ? 'เฉลี่ย' : 'Average'}</p>
              <p className="text-2xl font-bold text-gray-900">{avgWeight}</p>
              <p className="text-xs text-gray-400 mt-0.5">kg</p>
            </div>
          </div>

          {/* Chart */}
          {records.length >= 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-green-500" />
                <p className="text-sm font-semibold text-gray-900">
                  {locale === 'th' ? 'กราฟน้ำหนัก' : 'Weight Chart'}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: 12 }}
                    formatter={(val: number) => [`${val} kg`, locale === 'th' ? 'น้ำหนัก' : 'Weight']}
                  />
                  {avgWeight && (
                    <ReferenceLine y={Number(avgWeight)} stroke="#86efac" strokeDasharray="4 4"
                      label={{ value: locale === 'th' ? 'เฉลี่ย' : 'avg', fill: '#16a34a', fontSize: 10, position: 'insideTopRight' }}
                    />
                  )}
                  <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5}
                    dot={{ fill: '#22c55e', r: 5, strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: '#16a34a', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* History list */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-900">
                {locale === 'th' ? 'ประวัติทั้งหมด' : 'All Records'}
              </p>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {records.length} {locale === 'th' ? 'ครั้ง' : 'records'}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {[...records].reverse().map((r, i) => {
                const prev = [...records].reverse()[i + 1]
                const d = prev ? r.weight - prev.weight : null
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">⚖️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{r.weight} kg</p>
                        {d !== null && (
                          <span className={cn(
                            'text-xs font-medium',
                            d > 0 ? 'text-red-400' : d < 0 ? 'text-green-500' : 'text-gray-400'
                          )}>
                            {d > 0 ? `+${d.toFixed(2)}` : d.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(r.recorded_at), 'd MMMM yyyy', { locale: dateLocale })}
                        {r.notes && <span className="ml-1">· {r.notes}</span>}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
