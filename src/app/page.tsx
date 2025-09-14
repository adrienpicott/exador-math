'use client'

import React from 'react'
import Link from 'next/link'

export default function HomePage() {
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Exador Math
              </h1>
              <p className="text-sm text-gray-600">L'aventure mathématique</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link href="/auth" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Se connecter
            </Link>
            <Link href="/auth?mode=signup" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <div className="inline-block mb-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full">
              ✨ Nouveau : Version 1.0 disponible !
            </div>
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Découvre les Continents<br />Mathématiques d'Exador
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Embarque pour une aventure épique à travers 5 continents magiques, 
              résous des défis captivants et deviens un maître des mathématiques !
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth?mode=signup&role=student" className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
              ▶️ Commencer l'aventure
            </Link>
            <Link href="/auth?mode=signup&role=coach" className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-all">
              👥 Espace Coach
            </Link>
          </div>

          {/* Continents Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
            {[
              { name: 'Arithmia', icon: '🔢', color: 'from-blue-400 to-blue-600', desc: 'Nombres & Opérations' },
              { name: 'Algebria', icon: '📐', color: 'from-green-400 to-green-600', desc: 'Équations & Expressions' },
              { name: 'Geometria', icon: '📏', color: 'from-purple-400 to-purple-600', desc: 'Formes & Mesures' },
              { name: 'Analysia', icon: '📈', color: 'from-orange-400 to-orange-600', desc: 'Fonctions & Courbes' },
              { name: 'Probabilia', icon: '🎲', color: 'from-red-400 to-red-600', desc: 'Hasard & Statistiques' }
            ].map((continent, index) => (
              <div key={continent.name} className="bg-white rounded-lg p-6 text-center shadow-lg hover:scale-105 transition-transform border-2 border-white/50">
                <div className={`w-16 h-16 bg-gradient-to-br ${continent.color} rounded-full flex items-center justify-center mx-auto mb-3 text-2xl`}>
                  {continent.icon}
                </div>
                <h3 className="font-bold text-lg mb-1">{continent.name}</h3>
                <p className="text-sm text-gray-600">{continent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto text-center max-w-4xl">
          <h3 className="text-3xl font-bold mb-12">Exador Math en chiffres</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50+', label: 'Chapitres disponibles' },
              { number: '1000+', label: 'Questions créées' },
              { number: '5', label: 'Continents à explorer' },
              { number: '10', label: 'Niveaux de progression' }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white">📍</span>
            </div>
            <span className="text-xl font-bold">Exador Math</span>
          </div>
          <p className="text-gray-400 mb-4">
            L'aventure mathématique qui transforme l'apprentissage en plaisir
          </p>
          <p className="text-sm text-gray-500">
            Made with ❤️ for students in Frankfurt
          </p>
        </div>
      </footer>
    </div>
  )
}