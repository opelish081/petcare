// app/page.tsx — Redirect / ไปยัง /th โดยอัตโนมัติ
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/th')
}
