'use client'
// components/dashboard/DashboardCharts.tsx — กราฟนัดหมายรายเดือน

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface MonthData {
  month: string
  total: number
  completed: number
  pending: number
}

interface DashboardChartsProps {
  data: MonthData[]
  locale: string
}

export default function DashboardCharts({ data, locale }: DashboardChartsProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            fontSize: 12,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          }}
          formatter={(value: number, name: string) => [
            value,
            name === 'completed'
              ? (locale === 'th' ? 'เสร็จแล้ว' : 'Completed')
              : (locale === 'th' ? 'รออยู่' : 'Pending'),
          ]}
        />
        <Legend
          formatter={(value) =>
            value === 'completed'
              ? (locale === 'th' ? 'เสร็จแล้ว' : 'Completed')
              : (locale === 'th' ? 'รออยู่' : 'Pending')
          }
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" fill="#fde68a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
