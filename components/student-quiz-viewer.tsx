"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, BookOpen } from "lucide-react"
import CourseQuiz from "./course-quiz"

interface StudentQuizViewerProps {
  courseId: string
  courseName: string
}

export default function StudentQuizViewer({ courseId, courseName }: StudentQuizViewerProps) {
  const [selectedStrand, setSelectedStrand] = useState("")
  const [selectedSubStrand, setSelectedSubStrand] = useState("")
  const [showQuiz, setShowQuiz] = useState(false)

  // Get strands from course notes (quizzes must follow notes organization)
  const strands = useQuery(api.courseNotes.getStrandsByCourse, { courseId: courseId as Id<"courses"> })
  const subStrands = useQuery(
    api.courseNotes.getSubStrandsByStrand,
    selectedStrand ? { courseId: courseId as Id<"courses">, strand: selectedStrand } : "skip"
  )
  
  // Get quizzes for the selected strand/sub-strand
  const availableQuizzes = useQuery(
    api.quizManagement.getQuizzesByStrandSimple,
    selectedStrand && selectedSubStrand 
      ? { courseId: courseId as Id<"courses">, strand: selectedStrand, subStrand: selectedSubStrand }
      : "skip"
  )

  const handleStrandChange = (value: string) => {
    setSelectedStrand(value)
    setSelectedSubStrand("")
    setShowQuiz(false)
  }

  const handleSubStrandChange = (value: string) => {
    setSelectedSubStrand(value)
    setShowQuiz(false)
  }

  const handleStartQuiz = () => {
    if (selectedStrand && selectedSubStrand) {
      setShowQuiz(true)
    }
  }

  // If quiz is started, show the quiz component
  if (showQuiz && selectedStrand && selectedSubStrand) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowQuiz(false)}
          className="mb-4"
        >
          ← Back to Topic Selection
        </Button>
        <CourseQuiz 
          courseId={courseId} 
          courseName={courseName}
          strand={selectedStrand}
          subStrand={selectedSubStrand}
        />
      </div>
    )
  }

  // Show topic selection UI (mirrors notes system)
  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Select Quiz Topic
          </CardTitle>
          <CardDescription>Choose a topic to start your quiz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Strand/Topic</label>
            <Select value={selectedStrand} onValueChange={handleStrandChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a strand or topic" />
              </SelectTrigger>
              <SelectContent>
                {strands?.map((strand) => (
                  <SelectItem key={strand} value={strand}>{strand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(!strands || strands.length === 0) && (
              <p className="text-xs text-amber-600 mt-1">
                No topics available. Please check with your teacher.
              </p>
            )}
          </div>

          {selectedStrand && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Sub-Strand/Sub-Topic</label>
              <Select value={selectedSubStrand} onValueChange={handleSubStrandChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sub-strand or sub-topic" />
                </SelectTrigger>
                <SelectContent>
                  {subStrands?.map((subStrand) => (
                    <SelectItem key={subStrand} value={subStrand}>{subStrand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!subStrands || subStrands.length === 0) && (
                <p className="text-xs text-gray-500 mt-1">No sub-topics available for this strand.</p>
              )}
            </div>
          )}

          {selectedStrand && selectedSubStrand && (
            <div className="pt-4 border-t">
              {availableQuizzes && availableQuizzes.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {availableQuizzes.length} quiz(zes) available for this topic
                  </p>
                  <p className="text-xs text-gray-600">
                    Total Questions: {availableQuizzes.reduce((sum, quiz) => sum + (quiz.questionCount || 0), 0)}
                  </p>
                  <Button 
                    onClick={handleStartQuiz}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Start Quiz
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-amber-600">No quizzes available for this topic yet.</p>
                  <p className="text-xs text-gray-500 mt-1">Please select a different topic or check back later.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
