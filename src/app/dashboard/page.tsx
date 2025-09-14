'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CONTINENTS } from '@/lib/constants'

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = '/auth'
          return
        }

        setUser(user)

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setProfile(profile)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement de ton aventure...</div>
      </div>
    )
  }

  const currentLevel = profile?.level || 1
  const currentXP = profile?.xp || 0
  const totalXP = profile?.total_xp || 0
  const currentStreak = profile?.current_streak || 0
  const bestStreak = profile?.best_streak || 0

  // XP requis pour le prochain niveau (exemple de calcul)
  const xpForNextLevel = currentLevel * 100
  const progressPercentage = Math.min((currentXP / xpForNextLevel) * 100, 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">📍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Bonjour, {profile?.name || user?.email} !
              </h1>
              <p className="text-sm text-gray-600">Prêt pour l'aventure ?</p>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">Niveau {currentLevel}</div>
            <div className="text-sm text-gray-600">Rang actuel</div>
            <div className="mt-2 bg-blue-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{currentXP}/{xpForNextLevel} XP</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{totalXP}</div>
            <div className="text-sm text-gray-600">XP total</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-red-600 mb-2">{currentStreak}</div>
            <div className="text-sm text-gray-600">Série actuelle</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">{bestStreak}</div>
            <div className="text-sm text-gray-600">Meilleure série</div>
          </div>
        </div>

        {/* Quêtes du jour */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Quêtes du jour
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Quiz quotidien</h3>
              <p className="text-sm text-green-600 mb-3">Complète un quiz aujourd'hui</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-500">0/1 quiz</span>
                <span className="text-xs font-bold text-green-700">+50 XP</span>
              </div>
            </div>
            
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Série parfaite</h3>
              <p className="text-sm text-blue-600 mb-3">Obtiens 3 bonnes réponses consécutives</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-500">0/3 réponses</span>
                <span className="text-xs font-bold text-blue-700">+30 XP</span>
              </div>
            </div>
            
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Explorateur</h3>
              <p className="text-sm text-purple-600 mb-3">Découvre un nouveau chapitre</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-500">0/1 chapitre</span>
                <span className="text-xs font-bold text-purple-700">+40 XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Continents */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-2">🗺️</span>
            Explore les Continents d'Exador
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONTINENTS.map((continent, index) => (
              <div key={continent.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className={`w-16 h-16 ${continent.color} rounded-full flex items-center justify-center mx-auto mb-4 text-2xl`}>
                  {continent.id === 'arithmia' && '🔢'}
                  {continent.id === 'algebria' && '📐'}
                  {continent.id === 'geometria' && '📏'}
                  {continent.id === 'analysia' && '📈'}
                  {continent.id === 'probabilia' && '🎲'}
                </div>
                
                <h3 className="text-xl font-bold text-center mb-2">{continent.name}</h3>
                <p className="text-sm text-gray-600 text-center mb-4">{continent.description}</p>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-3">Progression : 0%</div>
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  
                  <Link 
                    href={`/quiz/${continent.id}`}
                    className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-semibold"
                  >
                    Commencer l'exploration
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}