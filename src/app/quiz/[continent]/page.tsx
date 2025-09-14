'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CONTINENTS, DIFFICULTY_CONFIG } from '@/lib/constants'

export default function ContinentChaptersPage() {
  const params = useParams()
  const router = useRouter()
  const continentId = params.continent as string
  
  const [user, setUser] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const continent = CONTINENTS.find(c => c.id === continentId)

  useEffect(() => {
    async function loadData() {
      try {
        // Vérifier l'authentification
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }
        setUser(user)

        // Charger les chapitres de ce continent
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select(`
            *,
            questions:questions(count)
          `)
          .eq('continent', continentId)
          .eq('is_active', true)
          .order('order_index')

        setChapters(chaptersData || [])
      } catch (error) {
        console.error('Error loading chapters:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [continentId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-lg">Chargement des chapitres...</div>
      </div>
    )
  }

  if (!continent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Continent introuvable</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
              ← Retour
            </Link>
            <div className={`w-10 h-10 ${continent.color} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">
                {continent.id === 'arithmia' && '🔢'}
                {continent.id === 'algebria' && '📐'}
                {continent.id === 'geometria' && '📏'}
                {continent.id === 'analysia' && '📈'}
                {continent.id === 'probabilia' && '🎲'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{continent.name}</h1>
              <p className="text-sm text-gray-600">{continent.description}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Introduction */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8 text-center">
          <div className={`w-24 h-24 ${continent.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-white text-4xl">
              {continent.id === 'arithmia' && '🔢'}
              {continent.id === 'algebria' && '📐'}
              {continent.id === 'geometria' && '📏'}
              {continent.id === 'analysia' && '📈'}
              {continent.id === 'probabilia' && '🎲'}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue en {continent.name} !
          </h2>
          <p className="text-lg text-gray-600 mb-4">{continent.description}</p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <div>
              <span className="font-semibold text-blue-600">{chapters.length}</span> chapitres
            </div>
            <div>
              <span className="font-semibold text-green-600">
                {chapters.reduce((sum, ch) => sum + (ch.questions?.[0]?.count || 0), 0)}
              </span> questions
            </div>
          </div>
        </div>

        {/* Chapitres */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Chapitres disponibles</h3>
          
          {chapters.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun chapitre disponible</h3>
              <p className="text-gray-600 mb-4">
                Les chapitres pour ce continent seront bientôt ajoutés !
              </p>
              <Link 
                href="/dashboard"
                className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retour au tableau de bord
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chapters.map((chapter, index) => {
                const questionCount = chapter.questions?.[0]?.count || 0
                const isUnlocked = index === 0 || true // Pour l'instant tous débloqués
                
                return (
                  <div 
                    key={chapter.id} 
                    className={`bg-white rounded-lg p-6 shadow-lg transition-all ${
                      isUnlocked ? 'hover:shadow-xl cursor-pointer' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            Chapitre {chapter.order_index}
                          </span>
                          {!isUnlocked && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              🔒 Verrouillé
                            </span>
                          )}
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          {chapter.title}
                        </h4>
                        {chapter.description && (
                          <p className="text-gray-600 text-sm mb-3">{chapter.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Statistiques */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <div>
                          <span className="font-semibold text-blue-600">{questionCount}</span> questions
                        </div>
                        <div>
                          <span className="font-semibold text-green-600">{chapter.school_level}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Progression: 0%
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all" 
                          style={{ width: '0%' }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {isUnlocked && questionCount > 0 ? (
                        <Link 
                          href={`/quiz/${continentId}/${chapter.id}`}
                          className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-semibold"
                        >
                          🎯 Commencer le quiz
                        </Link>
                      ) : isUnlocked ? (
                        <div className="flex-1 text-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg">
                          Aucune question disponible
                        </div>
                      ) : (
                        <div className="flex-1 text-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg">
                          Terminez le chapitre précédent
                        </div>
                      )}
                      
                      <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                        📊 Statistiques
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}