




















"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, Trophy, BookOpen, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"

interface CourseQuizProps {
  courseId: string
  courseName: string
  strand?: string
  subStrand?: string
}

export default function CourseQuiz({ courseId, courseName, strand, subStrand }: CourseQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<{ questionId: string; answer: number; isCorrect: boolean }[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [finalScore, setFinalScore] = useState<number>(0)

  // Get quiz questions - use strand-filtered query if strand is provided
  const strandQuestions = useQuery(
    api.quizManagement.getQuizQuestionsForStrand,
    strand ? { courseId: courseId as Id<"courses">, strand, subStrand } : "skip"
  )
  
  const courseQuestions = useQuery(
    api.quiz.getQuizForCourseSimple,
    !strand ? { courseId: courseId as Id<"courses"> } : "skip"
  )
  
  const questions = strand ? strandQuestions : courseQuestions
  
  // Get the quiz to get the quizId - use strand-filtered if available
  const strandQuizzes = useQuery(
    api.quizManagement.getQuizzesByStrandSimple,
    strand ? { courseId: courseId as Id<"courses">, strand, subStrand } : "skip"
  )
  
  const courseQuizzes = useQuery(
    api.quizManagement.getQuizzesForCourseSimple,
    !strand ? { courseId: courseId as Id<"courses"> } : "skip"
  )
  
  const quizResult = strand ? strandQuizzes : courseQuizzes
  const currentQuiz = Array.isArray(quizResult) ? quizResult[0] : null
  
  // Mutations
  const submitAnswer = useMutation(api.quiz.submitQuizAnswer)
  const completeQuiz = useMutation(api.quiz.completeQuizSession)

  const currentQuestion = questions?.[currentQuestionIndex]

  const startQuiz = () => {
    setQuizStarted(true)
    setStartTime(Date.now())
    setQuestionStartTime(Date.now())
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = async () => {
    if (selectedAnswer === null || !currentQuestion) return

    const timeSpent = Date.now() - questionStartTime

    try {
      // Get current user for custom authentication
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      
      // Submit the answer
      const result = await submitAnswer({
        courseId: courseId as Id<"courses">,
        questionId: currentQuestion._id,
        selectedAnswer,
        timeSpent,
        customUserId: currentUser.username || currentUser._id
      })

      // Store the answer result
      setAnswers(prev => [...prev, {
        questionId: currentQuestion._id,
        answer: selectedAnswer,
        isCorrect: result.isCorrect
      }])

      // Show feedback
      if (result.isCorrect) {
        toast.success("Correct! Well done! 🎉")
      } else {
        toast.error(`Incorrect. The correct answer was option ${result.correctAnswer + 1}.`)
      }

      // Move to next question or complete quiz
      if (currentQuestionIndex < (questions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setQuestionStartTime(Date.now())
      } else {
        // Quiz completed
        await completeQuizSession()
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes("Not authenticated") || error.message.includes("User not found")) {
          toast.error("Please log in to submit quiz answers. Go back and log in first.")
        } else if (error.message.includes("Only students can")) {
          toast.error("Only students can take quizzes. Please check your account type.")
        } else {
          toast.error(`Failed to submit answer: ${error.message}`)
        }
      } else {
        toast.error("Failed to submit answer. Please try again.")
      }
    }
  }

  const completeQuizSession = async () => {
    if (!questions) return

    const correctAnswers = answers.filter(a => a.isCorrect).length + (selectedAnswer !== null ? 1 : 0)
    const totalTime = Date.now() - startTime
    const score = Math.round((correctAnswers / questions.length) * 100)

    try {
      // Get current user for custom authentication
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      
      await completeQuiz({
        courseId: courseId as Id<"courses">,
        quizId: currentQuiz?._id as Id<"quizzes">,
        totalQuestions: questions?.length || 0,
        correctAnswers,
        startedAt: startTime,
        totalTimeSpent: totalTime,
        customUserId: currentUser.username || currentUser._id
      })

      setFinalScore(score)
      setQuizCompleted(true)
      
      if (score >= 80) {
        toast.success(`Excellent work! You scored ${score}%! 🏆`)
      } else if (score >= 60) {
        toast.success(`Good job! You scored ${score}%! 👍`)
      } else {
        toast.error(`You scored ${score}%. Keep practicing! 📚`)
      }
    } catch (error) {
      console.error("Error completing quiz:", error)
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes("Not authenticated") || error.message.includes("User not found")) {
          toast.error("Please log in to save quiz results. Go back and log in first.")
        } else if (error.message.includes("Only students can")) {
          toast.error("Only students can complete quizzes. Please check your account type.")
        } else {
          toast.error(`Failed to save quiz results: ${error.message}`)
        }
      } else {
        toast.error("Failed to save quiz results. Please try again.")
      }
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setAnswers([])
    setQuizStarted(false)
    setQuizCompleted(false)
    setStartTime(0)
    setQuestionStartTime(0)
    setFinalScore(0)
  }

  if (!questions) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading quiz questions...</p>
        </CardContent>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Quiz Available</h3>
          <p className="text-gray-600">There are no quiz questions available for this course yet.</p>
        </CardContent>
      </Card>
    )
  }

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1" />
            <div className="flex justify-center flex-1">
              <Trophy className="w-16 h-16 text-yellow-500" />
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                onClick={() => window.history.back()}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-800">Quiz Completed!</CardTitle>
          <CardDescription>Great job completing the {courseName} quiz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-800 mb-2">{finalScore}%</div>
            <Badge 
              variant={finalScore >= 80 ? "default" : finalScore >= 60 ? "secondary" : "destructive"}
              className={`text-lg px-4 py-2 ${
                finalScore >= 80 ? "bg-green-100 text-green-800" : 
                finalScore >= 60 ? "bg-yellow-100 text-yellow-800" : 
                "bg-red-100 text-red-800"
              }`}
            >
              {finalScore >= 80 ? "Excellent!" : finalScore >= 60 ? "Good Job!" : "Keep Practicing!"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-800">{answers.filter(a => a.isCorrect).length}</div>
              <div className="text-sm text-green-600">Correct</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-800">{answers.filter(a => !a.isCorrect).length}</div>
              <div className="text-sm text-red-600">Incorrect</div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={resetQuiz} variant="outline">
              Retake Quiz
            </Button>
            <Button onClick={() => window.history.back()}>
              Back to Course
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!quizStarted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1" />
            <div className="flex justify-center flex-1">
              <BookOpen className="w-16 h-16 text-blue-500" />
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                onClick={() => window.history.back()}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-800">{courseName} Quiz</CardTitle>
          <CardDescription>Test your knowledge with {questions.length} questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-800">{questions.length}</div>
              <div className="text-sm text-blue-600">Questions</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-800">~{Math.ceil(questions.length * 1.5)}</div>
              <div className="text-sm text-green-600">Minutes</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-800">80%</div>
              <div className="text-sm text-purple-600">To Pass</div>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={startQuiz} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Quiz
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-gray-800">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            <CardDescription>{courseName} Quiz</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {currentQuestion?.difficulty || "Medium"}
            </Badge>
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to close this quiz? Your progress will be lost.')) {
                  resetQuiz();
                }
              }}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
        </div>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentQuestion?.question}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedAnswer === index
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300"
                  }`}>
                    {selectedAnswer === index && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span className="ml-2">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Progress: {answers.length} of {questions.length} answered
          </div>
          <Button 
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentQuestionIndex === questions.length - 1 ? "Complete Quiz" : "Next Question"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}





















