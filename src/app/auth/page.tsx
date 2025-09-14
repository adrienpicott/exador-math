'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function AuthForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'login'
  const role = searchParams.get('role') || 'student'
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isSignup = mode === 'signup'
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      if (isSignup) {
        // Vérifier que les mots de passe correspondent
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas')
          return
        }

        if (formData.password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères')
          return
        }

        // Inscription
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: role
            }
          }
        })

        if (error) {
          setError(error.message)
          return
        }

        if (data.user) {
          setSuccess('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.')
        }
      } else {
        // Connexion
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) {
          setError('Email ou mot de passe incorrect')
          return
        }

        if (data.user) {
          // Récupérer le profil utilisateur pour connaître son rôle
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          // Rediriger selon le rôle
          if (profile?.role === 'coach') {
            router.push('/dashboard/coach')
          } else {
            router.push('/dashboard')
          }
        }
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="text-center p-6 border-b">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">📍</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Exador Math
            </span>
          </div>

          {/* Role Badge */}
          <div className="flex justify-center mb-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
              role === 'coach' 
                ? 'border-orange-200 bg-orange-50 text-orange-700' 
                : 'border-blue-200 bg-blue-50 text-blue-700'
            }`}>
              {role === 'coach' ? (
                <>
                  <span className="mr-1">👥</span>
                  Espace Coach
                </>
              ) : (
                <>
                  <span className="mr-1">🎓</span>
                  Espace Élève
                </>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {isSignup ? 'Créer un compte' : 'Se connecter'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isSignup 
              ? `Rejoins l'aventure mathématique d'Exador !` 
              : 'Bon retour dans les continents d\'Exador !'
            }
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom (inscription uniquement) */}
            {isSignup && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">👤</span>
                  <input
                    id="name"
                    type="text"
                    placeholder="Ton nom complet"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">✉️</span>
                <input
                  id="email"
                  type="email"
                  placeholder="ton.email@exemple.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirmation mot de passe (inscription uniquement) */}
            {isSignup && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">🔒</span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Message de succès */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Bouton de soumission */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-semibold disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2">⏳</span>
                  {isSignup ? 'Création...' : 'Connexion...'}
                </>
              ) : (
                isSignup ? 'Créer mon compte' : 'Se connecter'
              )}
            </button>
          </form>

          {/* Liens de navigation */}
          <div className="mt-6 text-center space-y-2">
            <div>
              {isSignup ? (
                <span className="text-sm text-gray-600">
                  Déjà un compte ?{' '}
                  <Link 
                    href={`/auth?role=${role}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Se connecter
                  </Link>
                </span>
              ) : (
                <span className="text-sm text-gray-600">
                  Pas encore de compte ?{' '}
                  <Link 
                    href={`/auth?mode=signup&role=${role}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    S'inscrire
                  </Link>
                </span>
              )}
            </div>
            
            <div>
              <span className="text-sm text-gray-600">
                {role === 'coach' ? 'Élève ?' : 'Enseignant ?'}{' '}
                <Link 
                  href={`/auth?mode=${mode}&role=${role === 'coach' ? 'student' : 'coach'}`}
                  className="text-purple-600 hover:underline font-medium"
                >
                  {role === 'coach' ? 'Espace Élève' : 'Espace Coach'}
                </Link>
              </span>
            </div>
          </div>

          {/* Retour à l'accueil */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}