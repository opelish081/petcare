// app/[locale]/(app)/pets/page.tsx — หน้ารายการสัตว์เลี้ยง
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Pet } from '@/types'
import { differenceInYears, differenceInMonths } from 'date-fns'

const PET_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', rabbit: '🐰', bird: '🐦', fish: '🐟', other: '🐾',
}

function getAge(birthdate: string | undefined, locale: string) {
  if (!birthdate) return null
  const birth = new Date(birthdate)
  const years = differenceInYears(new Date(), birth)
  const months = differenceInMonths(new Date(), birth) % 12
  if (years === 0) return locale === 'th' ? `${months} เดือน` : `${months} months`
  return locale === 'th' ? `${years} ปี ${months} เดือน` : `${years}y ${months}m`
}

export default async function PetsPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations('pets')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pets } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const petList: Pet[] = pets || []

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Link
          href={`/${locale}/pets/new`}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          {t('addPet')}
        </Link>
      </div>

      {/* Empty State */}
      {petList.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-5xl mb-4">🐾</p>
          <p className="text-gray-500 mb-6">{t('noPets')}</p>
          <Link
            href={`/${locale}/pets/new`}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
          >
            <Plus size={16} />
            {t('addPet')}
          </Link>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {petList.map((pet) => (
          <Link
            key={pet.id}
            href={`/${locale}/pets/${pet.id}`}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all group"
          >
            {/* Image */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
                {pet.image_url ? (
                  <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  PET_EMOJI[pet.type] || '🐾'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-green-700 transition-colors truncate">
                  {pet.name}
                </h3>
                <p className="text-sm text-gray-400">{t(`types.${pet.type}`)}</p>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5">
              {pet.breed && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('breed')}</span>
                  <span className="text-gray-700 font-medium">{pet.breed}</span>
                </div>
              )}
              {pet.birthdate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('age')}</span>
                  <span className="text-gray-700 font-medium">{getAge(pet.birthdate, locale)}</span>
                </div>
              )}
              {pet.gender && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('gender')}</span>
                  <span className="text-gray-700 font-medium">
                    {pet.gender === 'male' ? t('male') : t('female')}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
