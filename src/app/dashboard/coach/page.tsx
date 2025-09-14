'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CoachDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
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

        if ((profile as any)?.role !== 'coach') {
          window.location.href = '/dashboard'
          return
        }

        setProfile(profile)

        // Récupérer les élèves (pour l'instant tous les élèves)
        const { data: allStudents } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false })

        setStudents(allStudents || [])
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
        <div className="text-lg">Chargement de votre espace coach...</div>
      </div>
    )
  }

  const totalStudents = students.length
  const activeStudents = students.filter(s => s.last_activity).length
  const avgLevel = totalStudents > 0 
    ? Math.round(students.reduce((sum, s) => sum + (s.level || 1), 0) / totalStudents)
    : 0
  const totalXP = students.reduce((sum, s) => sum + (s.total_xp || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">👥</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Espace Coach - {profile?.name || user?.email}
              </h1>
              <p className="text-sm text-gray-600">Tableau de bord enseignant</p>
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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{totalStudents}</div>
            <div className="text-sm text-gray-600">Élèves inscrits</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">{activeStudents}</div>
            <div className="text-sm text-gray-600">Élèves actifs</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">{avgLevel}</div>
            <div className="text-sm text-gray-600">Niveau moyen</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">{totalXP.toLocaleString()}</div>
            <div className="text-sm text-gray-600">XP collectifs</div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-blue-600 text-2xl mb-2">➕</div>
              <div className="font-semibold text-blue-800">Ajouter un élève</div>
              <div className="text-sm text-blue-600">Créer un nouveau compte élève</div>
            </button>
            
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors">
              <div className="text-green-600 text-2xl mb-2">📝</div>
              <div className="font-semibold text-green-800">Créer une question</div>
              <div className="text-sm text-green-600">Ajouter du contenu</div>
            </button>
            
            <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
              <div className="text-purple-600 text-2xl mb-2">📊</div>
              <div className="font-semibold text-purple-800">Voir les statistiques</div>
              <div className="text-sm text-purple-600">Analyser les performances</div>
            </button>
          </div>
        </div>

        {/* Liste des élèves */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Mes élèves</h2>
          
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📚</div>
              <p>Aucun élève inscrit pour le moment.</p>
              <p className="text-sm mt-2">Les élèves apparaîtront ici une fois qu'ils auront créé leur compte.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Nom</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Niveau</th>
                    <th className="text-left py-3 px-4 font-semibold">XP Total</th>
                    <th className="text-left py-3 px-4 font-semibold">Série</th>
                    <th className="text-left py-3 px-4 font-semibold">Dernière activité</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{student.name}</td>
                      <td className="py-3 px-4 text-gray-600">{student.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Niveau {student.level || 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.total_xp || 0} XP</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {student.current_streak || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {student.last_activity 
                          ? new Date(student.last_activity).toLocaleDateString('fr-FR')
                          : 'Jamais'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Voir profil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}