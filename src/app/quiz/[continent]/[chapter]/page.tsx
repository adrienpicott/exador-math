'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DIFFICULTY_CONFIG, CONTINENTS } from '@/lib/constants'

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'free_text'
  difficulty: 'facile' | 'moyen' | 'difficile' | 'expert' | 'piege'
  points_base: number
  explanation?: string
  hints: string[]
  time_limit?: number
  options?: QuestionOption[]
}

interface QuestionOption {
  id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const continentId = params.continent as string
  const chapterId = params.chapter as string
  
  const [user, setUser] = useState<any>(null)
  const [chapter, setChapter] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [answers, setAnswers] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [usedHints, setUsedHints] = useState<number[]>([])
  const [hintsUsedForQuestion, setHintsUsedForQuestion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState<number>(Date.now())
  
  const supabase = createClient()
  const continent = CONTINENTS.find(c => c.id === continentId)
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  useEffect(() => {
    async function loadQuizData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }
        setUser(user)

        // Charger le chapitre
        const { data: chapterData } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single()

        if (!chapterData) {
          router.push(`/quiz/${continentId}`)
          return
        }

        setChapter(chapterData)

        // Charger les questions avec leurs options
        const { data: questionsData } = await supabase
          .from('questions')
          .select(`
            *,
            options:question_options(*)
          `)
          .eq('chapter_id', chapterId)
          .eq('is_active', true)
          .order('created_at')

        if (!questionsData || questionsData.length === 0) {
          router.push(`/quiz/${continentId}`)
          return
        }

        // Formater les questions
        const formattedQuestions = questionsData.map(q => ({
          ...q,
          options: q.options?.sort((a: any, b: any) => a.order_index - b.order_index)
        }))

        setQuestions(formattedQuestions)
        setAnswers(new Array(formattedQuestions.length).fill(''))
        
        // Initialiser le timer si la première question en a un
        if (formattedQuestions[0]?.time_limit) {
          setTimeLeft(formattedQuestions[0].time_limit)
        }

        setStartTime(Date.now())
      } catch (error) {
        console.error('Error loading quiz:', error)
        router.push(`/quiz/${continentId}`)
      } finally {
        setLoading(false)
      }
    }

    loadQuizData()
  }, [chapterId, continentId, router])

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || showResult || quizCompleted) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          handleNextQuestion()
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, showResult, quizCompleted])

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answer
    setAnswers(newAnswers)
  }

  const handleUseHint = () => {
    if (hintsUsedForQuestion < currentQuestion.hints.length) {
      setHintsUsedForQuestion(prev => prev + 1)
      const hintIndex = currentQuestionIndex * 100 + hintsUsedForQuestion
      setUsedHints(prev => [...prev, hintIndex])
    }
  }

  const getCorrectAnswer = (question: Question): string => {
    if (question.question_type === 'multiple_choice') {
      return question.options?.find(opt => opt.is_correct)?.option_text || ''
    }
    return question.explanation || ''
  }

 const calculateQuestionScore = (question: Question, userAnswer: string, hintsUsed: number): number => {
  console.log('=== CALCUL SCORE QUESTION ===')
  console.log('Question:', question.question_text)
  console.log('Réponse utilisateur:', userAnswer)
  console.log('Type de question:', question.question_type)
  
  const correctAnswer = getCorrectAnswer(question)
  console.log('Réponse correcte:', correctAnswer)
  
  let isCorrect = false

  if (question.question_type === 'multiple_choice') {
    isCorrect = userAnswer === correctAnswer
    console.log('QCM - Comparaison exacte:', isCorrect)
  } else {
    // Pour les questions texte libre, comparaison simple
    isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    console.log('Texte libre - Comparaison:', isCorrect)
  }

  if (!isCorrect) {
    console.log('❌ Réponse incorrecte, 0 point')
    return 0
  }

  // Points de base selon la difficulté
  let points = question.points_base || DIFFICULTY_CONFIG[question.difficulty].points
  console.log('Points de base:', points)
  console.log('Indices utilisés:', hintsUsed)

  // Malus pour les indices utilisés
  points = Math.max(1, points - hintsUsed)
  console.log('Points finaux:', points)

  return points
}

const handleNextQuestion = useCallback(async () => {
  if (!currentQuestion) return

  console.log('=== NEXT QUESTION ===')
  console.log('Question actuelle:', currentQuestion.question_text)
  console.log('Réponse sélectionnée:', selectedAnswer)
  console.log('Indices utilisés pour cette question:', hintsUsedForQuestion)

  setShowResult(true)

  // Calculer le score pour cette question
  const questionScore = calculateQuestionScore(
    currentQuestion, 
    selectedAnswer, 
    hintsUsedForQuestion
  )
  
  console.log('Score calculé pour cette question:', questionScore)
  
  setScore(prev => {
    console.log('Score avant:', prev, 'Score après:', prev + questionScore)
    return prev + questionScore
  })
  
  setXpGained(prev => {
    console.log('XP avant:', prev, 'XP après:', prev + questionScore)
    return prev + questionScore
  })

  // Attendre un peu pour montrer le résultat
  setTimeout(() => {
    setShowResult(false)
    
    if (isLastQuestion) {
      console.log('=== QUIZ TERMINÉ ===')
      console.log('XP total final:', score + questionScore)
      // Quiz terminé
      setQuizCompleted(true)
      saveQuizResults()
    } else {
      // Question suivante
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setSelectedAnswer(answers[nextIndex] || '')
      setHintsUsedForQuestion(0)
      
      // Réinitialiser le timer si nécessaire
      if (questions[nextIndex]?.time_limit) {
        setTimeLeft(questions[nextIndex].time_limit)
      }
    }
  }, 2000)
}, [currentQuestion, selectedAnswer, hintsUsedForQuestion, isLastQuestion, currentQuestionIndex, answers, questions])

 const saveQuizResults = async () => {
  try {
    console.log('=== DEBUT SAUVEGARDE ===')
    console.log('User ID:', user.id)
    console.log('XP to gain:', xpGained)

    // Récupérer d'abord le profil actuel
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('xp, total_xp')
      .eq('id', user.id)
      .single()

    console.log('Current profile:', currentProfile)
    console.log('Profile error:', profileError)

    if (profileError) {
      console.error('Erreur récupération profil:', profileError)
      return
    }

    // Créer une session de quiz
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        student_id: user.id,
        chapter_id: chapterId,
        status: 'completed',
        score,
        xp_gained: xpGained,
        time_spent: Date.now() - startTime,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    console.log('Session créée:', session)

    if (sessionError) {
      console.error('Session error:', sessionError)
      return
    }

    // Sauvegarder les réponses individuelles
    if (session) {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        const userAnswer = answers[i] || ''
        const correctAnswer = getCorrectAnswer(question)
        const isCorrect = userAnswer === correctAnswer
        const hintsUsed = usedHints.filter(h => Math.floor(h / 100) === i).length

        await supabase.from('student_answers').insert({
          session_id: session.id,
          question_id: question.id,
          student_answer: userAnswer,
          is_correct: isCorrect,
          time_taken: 30,
          hints_used: hintsUsed,
          xp_earned: calculateQuestionScore(question, userAnswer, hintsUsed)
        })
      }
    }

    // Mettre à jour le profil de l'élève avec les nouveaux totaux
    const newXP = (currentProfile?.xp || 0) + xpGained
    const newTotalXP = (currentProfile?.total_xp || 0) + xpGained

    console.log('Calculs XP:')
    console.log('- XP actuel:', currentProfile?.xp || 0)
    console.log('- XP à ajouter:', xpGained)
    console.log('- Nouveau XP:', newXP)
    console.log('- Nouveau Total XP:', newTotalXP)

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({
        xp: newXP,
        total_xp: newTotalXP,
        last_activity: new Date().toISOString()
      })
      .eq('id', user.id)

    console.log('Résultat mise à jour:', updateResult)
    console.log('Erreur mise à jour:', updateError)

    if (updateError) {
      console.error('Erreur lors de la mise à jour du profil:', updateError)
    } else {
      console.log('Quiz results saved successfully!')
    }

  } catch (error) {
    console.error('Error saving quiz results:', error)
  }
}
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-lg">Préparation du quiz...</div>
      </div>
    )
  }

  if (quizCompleted) {
    const correctAnswers = questions.filter((q, index) => 
      answers[index] === getCorrectAnswer(q)
    ).length
    const accuracy = Math.round((correctAnswers / questions.length) * 100)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz terminé !</h1>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span>Score :</span>
              <span className="font-bold text-blue-600">{score} points</span>
            </div>
            <div className="flex justify-between">
              <span>Précision :</span>
              <span className="font-bold text-green-600">{accuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span>XP gagnés :</span>
              <span className="font-bold text-purple-600">+{xpGained} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Questions :</span>
              <span className="font-bold">{correctAnswers}/{questions.length}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => router.push(`/quiz/${continentId}`)}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Retour aux chapitres
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tableau de bord
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Aucune question trouvée</div>
      </div>
    )
  }

  const correctAnswer = getCorrectAnswer(currentQuestion)
  const isCorrect = selectedAnswer === correctAnswer
  const difficulty = DIFFICULTY_CONFIG[currentQuestion.difficulty]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header avec progression */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push(`/quiz/${continentId}`)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Retour
              </button>
              <h1 className="font-bold text-gray-900">{chapter?.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {timeLeft !== null && (
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  timeLeft <= 10 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  ⏱️ {timeLeft}s
                </div>
              )}
              <div className="text-sm text-gray-600">
                {currentQuestionIndex + 1} / {questions.length}
              </div>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Difficulté et points */}
          <div className="flex items-center justify-between mb-6">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${difficulty.color}`}>
              <span className="mr-2">{difficulty.icon}</span>
              {difficulty.name}
            </div>
            <div className="text-sm font-bold text-gray-600">
              +{currentQuestion.points_base} XP
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            {/* Options de réponse */}
            {currentQuestion.question_type === 'multiple_choice' ? (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => {
                  const isSelected = selectedAnswer === option.option_text
                  const optionLetter = String.fromCharCode(65 + index)
                  
                  let buttonClass = 'w-full text-left p-4 border-2 rounded-lg transition-all hover:bg-gray-50'
                  
                  if (showResult) {
                    if (option.is_correct) {
                      buttonClass = 'w-full text-left p-4 border-2 rounded-lg bg-green-100 border-green-500 text-green-800'
                    } else if (isSelected && !option.is_correct) {
                      buttonClass = 'w-full text-left p-4 border-2 rounded-lg bg-red-100 border-red-500 text-red-800'
                    } else {
                      buttonClass = 'w-full text-left p-4 border-2 rounded-lg border-gray-200 opacity-60'
                    }
                  } else if (isSelected) {
                    buttonClass = 'w-full text-left p-4 border-2 rounded-lg border-blue-500 bg-blue-50'
                  } else {
                    buttonClass = 'w-full text-left p-4 border-2 rounded-lg border-gray-200 hover:border-gray-300'
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => !showResult && handleAnswerSelect(option.option_text)}
                      className={buttonClass}
                      disabled={showResult}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                          {optionLetter}
                        </div>
                        <div className="flex-1">{option.option_text}</div>
                        {showResult && option.is_correct && (
                          <span className="text-green-600">✓</span>
                        )}
                        {showResult && isSelected && !option.is_correct && (
                          <span className="text-red-600">✗</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Tape ta réponse ici..."
                  value={selectedAnswer}
                  onChange={(e) => !showResult && handleAnswerSelect(e.target.value)}
                  disabled={showResult}
                  className={`w-full px-4 py-3 border-2 rounded-lg ${
                    showResult
                      ? isCorrect 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:outline-none`}
                />
                
                {showResult && (
                  <div className={`p-3 rounded-lg ${
                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span>{isCorrect ? '✓' : '✗'}</span>
                      <span className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                        {isCorrect ? 'Bonne réponse !' : `Réponse correcte : ${correctAnswer}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Indices */}
          {currentQuestion.hints.length > 0 && (
            <div className="mb-6">
              {Array.from({ length: hintsUsedForQuestion }, (_, i) => (
                <div key={i} className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600">💡</span>
                    <div>
                      <strong className="text-yellow-800">Indice {i + 1} :</strong>
                      <span className="text-yellow-700 ml-2">{currentQuestion.hints[i]}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {hintsUsedForQuestion < currentQuestion.hints.length && !showResult && (
                <button
                  onClick={handleUseHint}
                  className="px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors text-sm"
                >
                  💡 Obtenir un indice ({currentQuestion.hints.length - hintsUsedForQuestion} restant)
                </button>
              )}
            </div>
          )}

          {/* Explication après réponse */}
          {showResult && currentQuestion.explanation && (
            <div className={`mb-6 p-4 rounded-lg ${
              isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start space-x-2">
                <span className={isCorrect ? 'text-green-600' : 'text-blue-600'}>
                  {isCorrect ? '✓' : '💡'}
                </span>
                <div>
                  <div className={`font-semibold mb-1 ${
                    isCorrect ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {isCorrect ? 'Excellente réponse !' : 'Explication :'}
                  </div>
                  <div className={isCorrect ? 'text-green-700' : 'text-blue-700'}>
                    {currentQuestion.explanation}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">
              Score actuel : {score} points
            </div>
            
            {!showResult && (
              <button
                onClick={handleNextQuestion}
                disabled={!selectedAnswer.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}