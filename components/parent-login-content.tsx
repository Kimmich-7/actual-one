


"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogIn, Heart, UserPlus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function ParentLoginContent() {
  const router = useRouter()
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  })
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    studentGrade: "",
    studentClass: "",
    studentUsername: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Convex mutations and queries
  const createParent = useMutation(api.parents.createParent)
  const validateStudent = useQuery(api.parents.validateStudentForParent, 
    registerData.studentUsername && registerData.studentGrade && registerData.studentClass ? {
      studentUsername: registerData.studentUsername,
      studentGrade: registerData.studentGrade,
      studentClass: registerData.studentClass
    } : "skip"
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Check if parent exists in database
      const parent = await new Promise((resolve) => {
        const checkParent = async () => {
          const result = await fetch('/api/check-parent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loginData.username, password: loginData.password })
          })
          const data = await result.json()
          resolve(data.parent)
        }
        checkParent()
      })

      if (parent) {
        localStorage.setItem("parentUser", JSON.stringify({
          username: loginData.username,
          name: (parent as any).name,
          role: "parent"
        }))
        router.push("/parent")
      } else {
        setError("Invalid username or password")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await createParent(registerData)
      setSuccess("Parent account created successfully! You can now login.")
      setRegisterData({
        name: "",
        email: "",
        username: "",
        password: "",
        studentGrade: "",
        studentClass: "",
        studentUsername: ""
      })
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const grades = Array.from({ length: 8 }, (_, i) => `Grade ${i + 1}`)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png" 
              alt="Juja St. Peters School Logo" 
              className="w-12 h-12 rounded-lg object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Juja St. Peters School
              </h1>
              <p className="text-sm text-gray-600">Parent Portal</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <img 
                src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png" 
                alt="Juja St. Peters School Logo" 
                className="w-8 h-8 rounded object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Parent Access</CardTitle>
            <CardDescription className="text-gray-600">
              Login or register to view your child's progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      placeholder="Enter your username"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      placeholder="Enter your password"
                      required
                      className="mt-1"
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        placeholder="Your full name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        placeholder="your@email.com"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                        placeholder="Choose username"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        placeholder="Choose password"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Student Information (for account linking)</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="studentGrade">Student's Grade</Label>
                        <Select value={registerData.studentGrade} onValueChange={(value) => setRegisterData({...registerData, studentGrade: value})}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((grade) => (
                              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="studentClass">Student's Class</Label>
                        <Input
                          id="studentClass"
                          type="text"
                          value={registerData.studentClass}
                          onChange={(e) => setRegisterData({...registerData, studentClass: e.target.value})}
                          placeholder="e.g., Grade 5A"
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="studentUsername">Student's Username</Label>
                      <Input
                        id="studentUsername"
                        type="text"
                        value={registerData.studentUsername}
                        onChange={(e) => setRegisterData({...registerData, studentUsername: e.target.value})}
                        placeholder="Student's login username"
                        required
                        className="mt-1"
                      />
                    </div>

                    {validateStudent && !validateStudent.valid && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded mt-2">
                        {validateStudent.message}
                      </div>
                    )}

                    {validateStudent && validateStudent.valid && (
                      <div className="text-green-600 text-sm bg-green-50 p-2 rounded mt-2">
                        ✓ Student details verified
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">
                      {success}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={isLoading || (validateStudent && !validateStudent.valid)}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UserPlus className="w-4 h-4" />
                        <span>Create Parent Account</span>
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-green-600 hover:text-green-800">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}






