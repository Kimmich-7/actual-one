"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, GraduationCap, BookOpen, UserPlus, School, TrendingUp, BarChart3 } from "lucide-react"

export default function AdminOverviewContent() {
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  
  // Convex queries
  const studentStats = useQuery(api.users.getStudentStatistics)
  const allClasses = useQuery(api.users.getAllClasses)
  const quizStats = useQuery(api.quizManagement.getQuizStatistics)
  const allTeachers = useQuery(api.teachers.getAllTeachers)
  const allParents = useQuery(api.parents.getAllParents)
  const leaderboardData = useQuery(api.users.getAllStudentsWithQuizScores) || []
  const createDummyAccounts = useMutation(api.createDummyAccounts.createDummyAccounts)
  
  // Generate grades list
  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{studentStats?.totalStudents || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Approved</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{studentStats?.approvedStudents || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
            <BookOpen className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{studentStats?.pendingStudents || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Classes</CardTitle>
            <School className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{allClasses?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-700">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-800 mb-2">
              {quizStats?.averageScore || 0}%
            </div>
            <p className="text-sm text-emerald-600">School Average Score</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Quiz Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 mb-2">
              {quizStats?.totalAttempts || 0}
            </div>
            <p className="text-sm text-blue-600">Total Quiz Attempts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-lg text-purple-700">Active Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800 mb-2">
              {quizStats?.totalQuizzes || 0}
            </div>
            <p className="text-sm text-purple-600">Available Quizzes</p>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance by Grade Graph */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Class Performance by Grade
              </CardTitle>
              <CardDescription>Average quiz scores across streams/classes</CardDescription>
            </div>
            <div className="w-48">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            // Group students by grade and class, calculate averages
            const classPerformanceData: Record<string, { className: string; avgScore: number; studentCount: number; quizCount: number }[]> = {}
            
            leaderboardData.forEach((student: any) => {
              const grade = student.grade || "Unassigned"
              const className = student.class || grade
              
              if (!classPerformanceData[grade]) {
                classPerformanceData[grade] = []
              }
              
              let classEntry = classPerformanceData[grade].find(c => c.className === className)
              if (!classEntry) {
                classEntry = { className, avgScore: 0, studentCount: 0, quizCount: 0 }
                classPerformanceData[grade].push(classEntry)
              }
              
              if (student.averageScore !== undefined && student.averageScore !== null) {
                classEntry.avgScore += student.averageScore
                classEntry.studentCount += 1
                classEntry.quizCount += student.totalQuizzes || 0
              }
            })
            
            // Calculate averages
            Object.values(classPerformanceData).forEach(classes => {
              classes.forEach(cls => {
                if (cls.studentCount > 0) {
                  cls.avgScore = Math.round(cls.avgScore / cls.studentCount)
                }
              })
            })
            
            // Filter classes based on selected grade
            const classesToShow = selectedGrade 
              ? classPerformanceData[selectedGrade] || []
              : []
            
            // Sort classes alphabetically
            const sortedClasses = [...classesToShow].sort((a, b) => a.className.localeCompare(b.className))
            
            // Get performance color based on score
            const getBarColor = (score: number) => {
              if (score >= 85) return 'bg-gradient-to-r from-green-400 to-emerald-500'
              if (score >= 70) return 'bg-gradient-to-r from-blue-400 to-cyan-500'
              if (score >= 50) return 'bg-gradient-to-r from-yellow-400 to-orange-500'
              return 'bg-gradient-to-r from-red-400 to-pink-500'
            }
            
            const getPerformanceLabel = (score: number) => {
              if (score >= 85) return { label: 'Exceeding', color: 'text-green-600' }
              if (score >= 70) return { label: 'Meeting', color: 'text-blue-600' }
              if (score >= 50) return { label: 'Approaching', color: 'text-yellow-600' }
              return { label: 'Below', color: 'text-red-600' }
            }
            
            if (!selectedGrade) {
              return (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-2">Select a grade to view class performance</p>
                  <p className="text-sm text-gray-400">Compare average scores across streams within a grade</p>
                </div>
              )
            }
            
            if (sortedClasses.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No class data available for {selectedGrade}</p>
                </div>
              )
            }
            
            return (
              <div className="space-y-4">
                {sortedClasses.map((cls, index) => {
                  const perf = getPerformanceLabel(cls.avgScore)
                  return (
                    <div key={cls.className + index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 w-24">{cls.className}</span>
                          <span className={`text-xs font-medium ${perf.color}`}>({perf.label})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-800">{cls.avgScore}%</span>
                          <span className="text-xs text-gray-500 ml-2">({cls.studentCount} students)</span>
                        </div>
                      </div>
                      <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-lg transition-all duration-700 ${getBarColor(cls.avgScore)}`}
                          style={{ width: `${Math.max(cls.avgScore, 5)}%` }}
                        >
                          <div className="flex items-center justify-end h-full px-3">
                            <span className="text-white text-sm font-bold drop-shadow">{cls.avgScore}%</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{cls.quizCount} total quiz attempts</p>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Teachers and Parents Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Teachers Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 mb-4">
              {allTeachers?.length || 0} Active Teachers
            </div>
            {allTeachers && allTeachers.length > 0 && (
              <div className="space-y-2">
                {allTeachers.slice(0, 3).map((teacher: any) => (
                  <div key={teacher._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{teacher.name}</span>
                    <Badge variant="outline">Coding Teacher</Badge>
                  </div>
                ))}
                {allTeachers.length > 3 && (
                  <p className="text-sm text-gray-500">+{allTeachers.length - 3} more teachers</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Parents Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 mb-4">
              {allParents?.length || 0} Registered Parents
            </div>
            {allParents && allParents.length > 0 && (
              <div className="space-y-2">
                {allParents.slice(0, 3).map((parent: any) => (
                  <div key={parent._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{parent.name}</span>
                    <Badge variant="outline">{parent.children?.length || 0} child(ren)</Badge>
                  </div>
                ))}
                {allParents.length > 3 && (
                  <p className="text-sm text-gray-500">+{allParents.length - 3} more parents</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={async () => {
              try {
                await createDummyAccounts({});
                alert("Dummy accounts created successfully!");
              } catch (error) {
                alert("Error creating dummy accounts: " + (error as Error).message);
              }
            }}
            variant="outline"
            className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Test Accounts</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}