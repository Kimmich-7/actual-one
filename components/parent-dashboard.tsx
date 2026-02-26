





"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Users, BookOpen, TrendingUp, Award, LogOut, User, Calendar, Trophy, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ParentDashboard() {
  const router = useRouter()
  const [parentUsername, setParentUsername] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("parentUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.role === "parent") {
          setParentUsername(user.username)
          setIsAuthenticated(true)
        } else {
          router.push("/parent/login")
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        router.push("/parent/login")
      }
    } else {
      router.push("/parent/login")
    }
  }, [router])

  // Queries using the Gate & Return Union pattern
  const parentDataResult = useQuery(
    api.parents.getParentData,
    isAuthenticated ? { parentUsername } : "skip"
  )

  const handleLogout = () => {
    localStorage.removeItem("parentUser")
    setIsAuthenticated(false)
    router.push("/parent/login")
  }

  // Handle loading states
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (parentDataResult === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading parent data...</div>
      </div>
    )
  }

  if (!parentDataResult || !parentDataResult.ok) {
    // For demo accounts, provide fallback data
    const storedUser = localStorage.getItem("parentUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.username === "parent1" || user.username === "parent2") {
          // Demo data for parent accounts
          const demoData = user.username === "parent1" ? {
            student: {
              _id: "student1",
              name: "John Wanjiku",
              grade: "Grade 5",
              class: "Grade 5A",
              username: "john.w",
              school: "Juja St. Peters School",
              registrationDate: Date.now() - 2592000000, // 30 days ago
              lastLoginTime: Date.now() - 86400000, // 1 day ago
              isApproved: true
            },
            performance: [
              {
                score: 85,
                correctAnswers: 17,
                totalQuestions: 20,
                timeSpent: 1200, // 20 minutes
                completedAt: Date.now() - 86400000,
                courseName: "Python Programming",
                performance: "Meeting Expectation"
              },
              {
                score: 92,
                correctAnswers: 18,
                totalQuestions: 20,
                timeSpent: 1080, // 18 minutes
                completedAt: Date.now() - 172800000,
                courseName: "Scratch Programming",
                performance: "Exceeding Expectation"
              },
              {
                score: 78,
                correctAnswers: 15,
                totalQuestions: 20,
                timeSpent: 1500, // 25 minutes
                completedAt: Date.now() - 259200000,
                courseName: "Typing Skills",
                performance: "Meeting Expectation"
              }
            ],
            projects: [
              {
                _id: "project1",
                title: "My First Python Game",
                description: "A simple number guessing game built with Python",
                submissionDate: Date.now() - 432000000, // 5 days ago
                status: "approved",
                language: "Python",
                grade: "A",
                feedback: "Excellent work! Great use of loops and conditionals."
              },
              {
                _id: "project2",
                title: "Interactive Story in Scratch",
                description: "An animated story with user choices",
                submissionDate: Date.now() - 864000000, // 10 days ago
                status: "reviewed",
                language: "Scratch",
                feedback: "Good creativity! Try adding more sound effects next time."
              }
            ]
          } : {
            student: {
              _id: "student2",
              name: "Grace Kamau",
              grade: "Grade 4",
              class: "Grade 4A",
              username: "grace.k",
              school: "Juja St. Peters School",
              registrationDate: Date.now() - 2592000000, // 30 days ago
              lastLoginTime: Date.now() - 172800000, // 2 days ago
              isApproved: true
            },
            performance: [
              {
                score: 88,
                correctAnswers: 17,
                totalQuestions: 20,
                timeSpent: 900, // 15 minutes
                completedAt: Date.now() - 172800000,
                courseName: "Scratch Junior",
                performance: "Exceeding Expectation"
              },
              {
                score: 82,
                correctAnswers: 16,
                totalQuestions: 20,
                timeSpent: 1200, // 20 minutes
                completedAt: Date.now() - 345600000,
                courseName: "Typing Skills",
                performance: "Meeting Expectation"
              }
            ],
            projects: [
              {
                _id: "project3",
                title: "My Pet Animation",
                description: "A cute animation of my pet cat using Scratch Jr",
                submissionDate: Date.now() - 604800000, // 7 days ago
                status: "approved",
                language: "Scratch Jr",
                grade: "A-",
                feedback: "Very creative! Love the smooth animations."
              }
            ]
          }
          
          // Use demo data
          const { student, performance, projects } = demoData
          
          // Calculate statistics
          const totalQuizzes = performance.length
          const averageScore = performance.length > 0 
            ? Math.round(performance.reduce((sum, p) => sum + p.score, 0) / performance.length)
            : 0
          const totalProjects = projects.length
          const completedProjects = projects.filter(p => p.status === "approved").length

          // Performance rating
          const getPerformanceRating = (score: number) => {
            if (score >= 80) return { label: "Exceeding", color: "text-green-400 border-green-500" }
            if (score >= 60) return { label: "Meeting", color: "text-yellow-400 border-yellow-500" }
            return { label: "Below", color: "text-red-400 border-red-500" }
          }

          const overallRating = getPerformanceRating(averageScore)

          return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-gray-800">
              {/* Header */}
              <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center py-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png" 
                        alt="Juja St. Peters School Logo" 
                        className="w-10 h-10 rounded-lg object-contain"
                      />
                      <div>
                        <h1 className="text-xl font-bold text-gray-800">
                          Juja St. Peters School
                        </h1>
                        <p className="text-sm text-gray-600">Parent Dashboard - {user.name}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout} 
                      className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </header>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Student Info Card */}
                <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 mb-8">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800 flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>My Child's Account Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{student.name}</h2>
                        <div className="space-y-2 text-gray-600">
                          <p><span className="text-gray-500">Grade:</span> {student.grade}</p>
                          <p><span className="text-gray-500">Class:</span> {student.class}</p>
                          <p><span className="text-gray-500">Username:</span> {student.username}</p>
                          <p><span className="text-gray-500">School:</span> {student.school || "Juja St. Peters School"}</p>
                          <p><span className="text-gray-500">Registration Date:</span> {new Date(student.registrationDate || Date.now()).toLocaleDateString()}</p>
                          {student.lastLoginTime && (
                            <p><span className="text-gray-500">Last Login:</span> {new Date(student.lastLoginTime).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`${overallRating.color} mb-4`}>
                          {overallRating.label} Standards
                        </Badge>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="text-gray-500">Account Status</p>
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            {student.isApproved ? "Active" : "Pending Approval"}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-2">
                            Overall Performance: {averageScore}% average
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Cards - Redesigned to match the provided image */}
                <div className="grid gap-6 md:grid-cols-4 mb-8">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">My Child</CardTitle>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-800">1</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">Quiz Attempts</CardTitle>
                      <div className="p-2 bg-green-100 rounded-full">
                        <BookOpen className="h-4 w-4 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-800">{totalQuizzes}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">Projects</CardTitle>
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Trophy className="h-4 w-4 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-800">{totalProjects}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">Average Score</CardTitle>
                      <div className="p-2 bg-purple-100 rounded-full">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-800">{averageScore}%</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="performance" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
                    <TabsTrigger value="performance" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Quiz Performance</TabsTrigger>
                    <TabsTrigger value="projects" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Projects</TabsTrigger>
                  </TabsList>

                  {/* Performance Tab */}
                  <TabsContent value="performance">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-800">Quiz Performance</CardTitle>
                        <CardDescription className="text-gray-600">Your child's quiz results and progress</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {performance.map((quiz, index) => {
                            const rating = getPerformanceRating(quiz.score)
                            return (
                              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h3 className="font-semibold text-gray-800">{quiz.courseName}</h3>
                                    <p className="text-sm text-gray-500">
                                      {new Date(quiz.completedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className={rating.color}>
                                    {rating.label}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700">Score: {quiz.score}%</span>
                                    <span className="text-gray-500">
                                      {quiz.correctAnswers}/{quiz.totalQuestions} correct
                                    </span>
                                  </div>
                                  <Progress 
                                    value={quiz.score} 
                                    className="h-2 bg-gray-200"
                                  />
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Time: {Math.round(quiz.timeSpent / 60)} minutes</span>
                                    <span>Performance: {quiz.performance}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Projects Tab */}
                  <TabsContent value="projects">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-800">Projects</CardTitle>
                        <CardDescription className="text-gray-600">Your child's submitted projects</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {projects.map((project) => (
                            <div key={project._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-gray-800">{project.title}</h3>
                                  <p className="text-sm text-gray-500">
                                    {new Date(project.submissionDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      project.status === "approved" 
                                        ? "border-green-500 text-green-600"
                                        : project.status === "reviewed"
                                        ? "border-yellow-500 text-yellow-600"
                                        : "border-blue-500 text-blue-600"
                                    }
                                  >
                                    {project.status}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const projectUrl = (project as any).projectUrl as string | undefined
                                      const codeContent = (project as any).codeContent as string | undefined

                                      if (projectUrl || codeContent) {
                                        // Show project output for parents
                                        if (project.language === 'scratch-junior') {
                                          const outputWindow = window.open('', '_blank');
                                          if (outputWindow) {
                                            outputWindow.document.write(`
                                              <html>
                                                <head><title>${project.title} - ${student.name}'s Project</title></head>
                                                <body style="font-family: Arial, sans-serif; padding: 20px;">
                                                  <h2>${project.title}</h2>
                                                  <p><strong>Student:</strong> ${student.name}</p>
                                                  <p><strong>Description:</strong> ${project.description || 'No description provided'}</p>
                                                  <p><strong>Language:</strong> Scratch Junior</p>
                                                  <hr>
                                                  <iframe src="${projectUrl}" width="100%" height="400" frameborder="0"></iframe>
                                                </body>
                                              </html>
                                            `);
                                          }
                                        } else if (codeContent && (project.language === 'html' || project.language === 'css' || project.language === 'javascript')) {
                                          const outputWindow = window.open('', '_blank');
                                          if (outputWindow) {
                                            outputWindow.document.write(codeContent);
                                          }
                                        } else if (codeContent) {
                                          const outputWindow = window.open('', '_blank');
                                          if (outputWindow) {
                                            outputWindow.document.write(`
                                              <html>
                                                <head><title>${project.title} - Output</title></head>
                                                <body style="font-family: monospace; padding: 20px; background: #f5f5f5;">
                                                  <h2>${project.title}</h2>
                                                  <p><strong>Student:</strong> ${student.name}</p>
                                                  <p><strong>Language:</strong> ${project.language}</p>
                                                  <hr>
                                                  <pre style="background: white; padding: 15px; border-radius: 5px; overflow: auto;">${codeContent}</pre>
                                                </body>
                                              </html>
                                            `);
                                          }
                                        } else {
                                          window.open(projectUrl, '_blank');
                                        }
                                      } else {
                                        alert('No project content available to view');
                                      }
                                    }}
                                  >
                                    View Output
                                  </Button>
                                </div>
                              </div>
                              
                              {project.description && (
                                <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Language: {project.language || "N/A"}</span>
                                {project.grade && (
                                  <span>Grade: {project.grade}</span>
                                )}
                              </div>
                              
                              {project.feedback && (
                                <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                                  <p className="text-gray-700"><strong>Feedback:</strong> {project.feedback}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )
        }
      } catch (error) {
        console.error("Error parsing stored user:", error)
      }
    }
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Error: {parentDataResult?.message || "Failed to load data"}</div>
      </div>
    )
  }

  const { student, performance, projects } = parentDataResult

  // Calculate statistics
  const totalQuizzes = performance.length
  const averageScore = performance.length > 0 
    ? Math.round(performance.reduce((sum, p) => sum + p.score, 0) / performance.length)
    : 0
  const totalProjects = projects.length
  const completedProjects = projects.filter(p => p.status === "approved").length

  // Performance rating
  const getPerformanceRating = (score: number) => {
    if (score >= 80) return { label: "Exceeding", color: "text-green-400 border-green-500" }
    if (score >= 60) return { label: "Meeting", color: "text-yellow-400 border-yellow-500" }
    return { label: "Below", color: "text-red-400 border-red-500" }
  }

  const overallRating = getPerformanceRating(averageScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png" 
                alt="Juja St. Peters School Logo" 
                className="w-10 h-10 rounded-lg object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Juja St. Peters School
                </h1>
                <p className="text-sm text-gray-600">Parent Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://img.freepik.com/free-vector/parent-child-concept-illustration_114360-8891.jpg" 
                  alt="Parent Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-gray-300 object-cover"
                />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{parentUsername}</p>
                  <p className="text-xs text-gray-500">Parent</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info Card */}
        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>My Child's Account Details</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  alert('Add Multiple Children feature coming soon! Contact admin to add more children to your account.');
                }}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Add Child
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{student.name}</h2>
                <div className="space-y-2 text-gray-600">
                  <p><span className="text-gray-500">Grade:</span> {student.grade}</p>
                  <p><span className="text-gray-500">Class:</span> {student.class}</p>
                  <p><span className="text-gray-500">Username:</span> {student.username}</p>
                  <p><span className="text-gray-500">School:</span> {student.school || "Juja St. Peters School"}</p>
                  <p><span className="text-gray-500">Registration Date:</span> {new Date(student.registrationDate || Date.now()).toLocaleDateString()}</p>
                  {student.lastLoginTime && (
                    <p><span className="text-gray-500">Last Login:</span> {new Date(student.lastLoginTime).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={`${overallRating.color} mb-4`}>
                  {overallRating.label} Standards
                </Badge>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="text-gray-500">Account Status</p>
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    {student.isApproved ? "Active" : "Pending Approval"}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">
                    Overall Performance: {averageScore}% average
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">My Child</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">1</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Quiz Attempts</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <BookOpen className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{totalQuizzes}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Projects</CardTitle>
              <div className="p-2 bg-orange-100 rounded-full">
                <Trophy className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800">{totalProjects}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Average Score</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">{averageScore}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
            <TabsTrigger value="performance" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Quiz Performance</TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Projects</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Quiz Performance</CardTitle>
                <CardDescription className="text-gray-600">Your child's quiz results and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {performance.length > 0 ? (
                  <div className="space-y-4">
                    {performance.map((quiz, index) => {
                      const rating = getPerformanceRating(quiz.score)
                      return (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-800">{quiz.courseName}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(quiz.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className={rating.color}>
                              {rating.label}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">Score: {quiz.score}%</span>
                              <span className="text-gray-500">
                                {quiz.correctAnswers}/{quiz.totalQuestions} correct
                              </span>
                            </div>
                            <Progress 
                              value={quiz.score} 
                              className="h-2 bg-gray-200"
                            />
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Time: {Math.round(quiz.timeSpent / 60)} minutes</span>
                              <span>Performance: {quiz.performance}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No quiz attempts yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Projects</CardTitle>
                <CardDescription className="text-gray-600">Your child's submitted projects</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800">{project.title}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(project.submissionDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              project.status === "approved" 
                                ? "border-green-500 text-green-600"
                                : project.status === "reviewed"
                                ? "border-yellow-500 text-yellow-600"
                                : "border-blue-500 text-blue-600"
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>
                        
                        {project.description && (
                          <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Language: {project.language || "N/A"}</span>
                          {project.grade && (
                            <span>Grade: {project.grade}</span>
                          )}
                        </div>
                        
                        {project.feedback && (
                          <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                            <p className="text-gray-700"><strong>Feedback:</strong> {project.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No projects submitted yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}















