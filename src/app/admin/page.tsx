'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ImportStats {
  total: number
  imported: number
  errors: number
  warnings: number
}

interface ValidationError {
  row: number
  field: string
  message: string
  data: any
}

export default function AdminImportPage() {
  const [csvContent, setCsvContent] = useState('')
  const [importing, setImporting] = useState(false)
  const [stats, setStats] = useState<ImportStats>({ total: 0, imported: 0, errors: 0, warnings: 0 })
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState('')

  const supabase = createClient()

  // Validation des données CSV
  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = []
    
    // Champs obligatoires
    const required = ['continent', 'chapter_code', 'difficulty', 'question_text', 'question_type', 'correct_answer']
    required.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          row: index + 1,
          field,
          message: `Champ obligatoire manquant`,
          data: row
        })
      }
    })

    // Validation des énumérations
    const validContinents = ['acceptation', 'apprentissage', 'autonomie', 'autodidacte', 'aisance', 'anticipation', 'amusement']
    if (row.continent && !validContinents.includes(row.continent)) {
      errors.push({
        row: index + 1,
        field: 'continent',
        message: `Continent invalide. Valeurs possibles: ${validContinents.join(', ')}`,
        data: row
      })
    }

    const validDifficulties = ['facile', 'moyen', 'difficile', 'tres_difficile', 'piege']
    if (row.difficulty && !validDifficulties.includes(row.difficulty)) {
      errors.push({
        row: index + 1,
        field: 'difficulty',
        message: `Difficulté invalide. Valeurs possibles: ${validDifficulties.join(', ')}`,
        data: row
      })
    }

    const validTypes = ['multiple_choice', 'free_text']
    if (row.question_type && !validTypes.includes(row.question_type)) {
      errors.push({
        row: index + 1,
        field: 'question_type',
        message: `Type de question invalide. Valeurs possibles: ${validTypes.join(', ')}`,
        data: row
      })
    }

    // Validation pour questions à choix multiples
    if (row.question_type === 'multiple_choice') {
      const options = [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean)
      if (options.length < 2) {
        errors.push({
          row: index + 1,
          field: 'options',
          message: 'Les questions QCM doivent avoir au moins 2 options',
          data: row
        })
      }
      
      if (!options.includes(row.correct_answer)) {
        errors.push({
          row: index + 1,
          field: 'correct_answer',
          message: 'La réponse correcte doit correspondre à une des options',
          data: row
        })
      }
    }

    // Validation des points
    const points = parseInt(row.points_base)
    if (isNaN(points) || points < 1 || points > 10) {
      errors.push({
        row: index + 1,
        field: 'points_base',
        message: 'Les points doivent être un nombre entre 1 et 10',
        data: row
      })
    }

    return errors
  }

  // Traitement du CSV
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) throw new Error('CSV vide ou invalide')
    
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim().replace(/"/g, '') : ''
      })
      
      rows.push(row)
    }
    
    return rows
  }

  // Import des questions
  const handleImport = async () => {
    if (!csvContent.trim()) {
      setResults('Veuillez coller votre contenu CSV')
      return
    }

    setImporting(true)
    setErrors([])
    setStats({ total: 0, imported: 0, errors: 0, warnings: 0 })
    setProgress(0)
    setResults('')

    try {
      const rows = parseCSV(csvContent)
      const totalRows = rows.length
      setStats(prev => ({ ...prev, total: totalRows }))

      // Validation de toutes les lignes
      const allErrors: ValidationError[] = []
      rows.forEach((row, index) => {
        const rowErrors = validateRow(row, index)
        allErrors.push(...rowErrors)
      })

      if (allErrors.length > 0) {
        setErrors(allErrors)
        setStats(prev => ({ ...prev, errors: allErrors.length }))
        setResults(`${allErrors.length} erreurs détectées. Corrigez-les avant d'importer.`)
        setImporting(false)
        return
      }

      // Import des questions valides
      let imported = 0
      let errors = 0

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        setProgress(((i + 1) / totalRows) * 100)

        try {
          // 1. Vérifier/créer le chapitre
          let chapter = await supabase
            .from('chapters')
            .select('id')
            .eq('code', row.chapter_code)
            .single()

          if (!chapter.data) {
            const { data: newChapter } = await supabase
              .from('chapters')
              .insert({
                code: row.chapter_code,
                title: `Chapitre ${row.chapter_code}`,
                continent: row.continent,
                description: `Questions générées pour ${row.competence_code}`,
                level: parseInt(row.competence_code.split('-')[0].replace('CE', '')) || 1
              })
              .select('id')
              .single()
            chapter = newChapter
          }

          // 2. Créer la question
          const questionData = {
            chapter_id: chapter.data?.id,
            question_text: row.question_text,
            question_type: row.question_type,
            difficulty: row.difficulty,
            points_base: parseInt(row.points_base) || 1,
            explanation: row.explanation || null,
            hints: [row.hint_1, row.hint_2, row.hint_3].filter(Boolean),
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
          }

          const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert(questionData)
            .select('id')
            .single()

          if (questionError) throw questionError

          // 3. Créer les options pour QCM
          if (row.question_type === 'multiple_choice' && question?.id) {
            const options = [
              { text: row.option_a, correct: row.option_a === row.correct_answer },
              { text: row.option_b, correct: row.option_b === row.correct_answer },
              { text: row.option_c, correct: row.option_c === row.correct_answer },
              { text: row.option_d, correct: row.option_d === row.correct_answer }
            ].filter(opt => opt.text)

            for (let j = 0; j < options.length; j++) {
              await supabase.from('question_options').insert({
                question_id: question.id,
                option_text: options[j].text,
                is_correct: options[j].correct,
                order_index: j
              })
            }
          }

          imported++
          setStats(prev => ({ ...prev, imported }))
          
        } catch (error) {
          console.error(`Erreur ligne ${i + 1}:`, error)
          errors++
          setStats(prev => ({ ...prev, errors }))
        }
      }

      setResults(`Import terminé ! ${imported} questions importées, ${errors} erreurs.`)

    } catch (error) {
      setResults(`Erreur lors de l'import: ${error}`)
    } finally {
      setImporting(false)
      setProgress(100)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administration Exador Math</h1>
          <p className="text-gray-600 mt-2">Import massif de questions depuis CSV</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Importées</p>
                  <p className="text-xl font-bold text-green-600">{stats.imported}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Erreurs</p>
                  <p className="text-xl font-bold text-red-600">{stats.errors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Avertissements</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.warnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Zone d'import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Import CSV</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format CSV attendu
                  </label>
                  <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                    continent,chapter_code,difficulty,question_text,question_type,explanation,hint_1,hint_2,hint_3,option_a,option_b,option_c,option_d,correct_answer,points_base,competence_code,metadata
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu CSV
                  </label>
                  <textarea
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder="Collez votre contenu CSV ici..."
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>

                {importing && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progression</span>
                      <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={importing || !csvContent.trim()}
                  className="w-full"
                >
                  {importing ? 'Import en cours...' : 'Importer les questions'}
                </Button>

                {results && (
                  <div className={`p-4 rounded-lg ${
                    results.includes('erreurs détectées') ? 'bg-red-50 border border-red-200' :
                    results.includes('Import terminé') ? 'bg-green-50 border border-green-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <p className="text-sm">{results}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Liste des erreurs */}
          <Card>
            <CardHeader>
              <CardTitle>Validation & Erreurs</CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-start space-x-2">
                        <Badge variant="destructive" size="sm">
                          Ligne {error.row}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">
                            {error.field}: {error.message}
                          </p>
                          {error.data.question_text && (
                            <p className="text-xs text-red-600 mt-1">
                              Question: {error.data.question_text.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune erreur détectée</p>
                  <p className="text-sm">Importez votre CSV pour voir les validations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions d'utilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">1. Générer les questions</h4>
                <p className="text-sm text-gray-600">
                  Utilisez les prompts fournis dans d'autres conversations Claude pour générer des questions au format CSV.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Valider le format</h4>
                <p className="text-sm text-gray-600">
                  Assurez-vous que votre CSV respecte exactement le format avec toutes les colonnes obligatoires.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Importer</h4>
                <p className="text-sm text-gray-600">
                  Collez votre CSV et lancez l'import. Les erreurs seront automatiquement détectées.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}