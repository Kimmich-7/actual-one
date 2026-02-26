

"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, UserPlus, LogIn, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Login form data
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  })
  
  // Register form data
  const [registerData, setRegisterData] = useState({
    name: "",
    username: "",
    password: "",
    grade: "",
    class: "", // Add class field
    school: "Juja St. Peters School" // Default school name
  })

  const registerStudent = useMutation(api.schoolAuth.registerStudent)
  const loginStudent = useMutation(api.schoolAuth.loginStudent)
  
  // Get available classes for registration
  const availableClasses = useQuery(api.users.getExistingClassNames)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const result = await loginStudent({
        username: loginData.username,
        password: loginData.password
      })
      
      if (result.success) {
        // Store user info in localStorage for simple session management
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        router.push("/dashboard")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      // Validate that class exists if provided
      if (registerData.class && availableClasses && !availableClasses.includes(registerData.class)) {
        setError("The selected class does not exist. Please contact your administrator.")
        setIsLoading(false)
        return
      }

      const result = await registerStudent({
        name: registerData.name,
        username: registerData.username,
        password: registerData.password,
        grade: `Grade ${registerData.grade}`,
        class: registerData.class || undefined, // Only send class if provided
        school: registerData.school
      })
      
      if (result.success) {
        // Show success message for pending approval
        setError("Account created successfully! Please wait for admin approval before you can log in.")
        setMode("login") // Switch to login mode
        // Clear form data
        setRegisterData({ name: "", username: "", password: "", grade: "", class: "", school: "Juja St. Peters School" })
      }
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login")
    setError("")
    setLoginData({ username: "", password: "" })
    setRegisterData({ name: "", username: "", password: "", grade: "", class: "", school: "Juja St. Peters School" })
  }

  if (mode === "login") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl border-0">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img 
              src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png" 
              alt="Juja St. Peters School Logo" 
              className="w-16 h-16 rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Juja St. Peters School
          </CardTitle>
          <CardDescription className="text-gray-500">
            Welcome back! Enter your username to continue learning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                required
                disabled={isLoading}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={isLoading}
                className="h-12"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={isLoading || !loginData.username || !loginData.password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?
            </p>
            <Button 
              variant="link" 
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create Account
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <img 
            src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png" 
            alt="Juja St. Peters School Logo" 
            className="w-16 h-16 rounded-lg"
          />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Juja St. Peters School
        </CardTitle>
        <CardDescription className="text-gray-500">
          Create your account to start your coding journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={registerData.name}
              onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
              required
              disabled={isLoading}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={registerData.username}
              onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
              required
              disabled={isLoading}
              className="h-12"
            />
            <p className="text-xs text-gray-500">
              This will be used to log in to your account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a secure password"
              value={registerData.password}
              onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
              required
              disabled={isLoading}
              className="h-12"
            />
            <p className="text-xs text-gray-500">
              Choose a strong password to secure your account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade Level</Label>
            <Select 
              value={registerData.grade} 
              onValueChange={(value) => setRegisterData(prev => ({ ...prev, grade: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select your grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Grade 1</SelectItem>
                <SelectItem value="2">Grade 2</SelectItem>
                <SelectItem value="3">Grade 3</SelectItem>
                <SelectItem value="4">Grade 4</SelectItem>
                <SelectItem value="5">Grade 5</SelectItem>
                <SelectItem value="6">Grade 6</SelectItem>
                <SelectItem value="7">Grade 7</SelectItem>
                <SelectItem value="8">Grade 8</SelectItem>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Class (Optional)</Label>
            <Select 
              value={registerData.class} 
              onValueChange={(value) => setRegisterData(prev => ({ ...prev, class: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select your class (optional)" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses && availableClasses
                  .filter(className => className && className.trim() !== '') // Filter out empty strings
                  .map((className) => (
                    <SelectItem key={className} value={className}>{className}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              If your class is not listed, leave this blank or contact your administrator
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">School</Label>
            <Input
              id="school"
              name="school"
              type="text"
              value={registerData.school}
              onChange={(e) => setRegisterData(prev => ({ ...prev, school: e.target.value }))}
              required
              disabled={isLoading}
              className="h-12"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            disabled={isLoading || !registerData.name || !registerData.username || !registerData.password || !registerData.grade}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?
          </p>
          <Button 
            variant="link" 
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

