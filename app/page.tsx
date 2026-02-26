
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import AdminSeedCourses from "@/components/admin-seed-courses"

export default function Home() {
  return <HomePage />
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png" 
                alt="Juja St. Peters School Logo" 
                className="w-10 h-10 rounded-lg object-contain"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Juja St. Peters School
                </h1>
                <p className="text-sm text-gray-600">Coding Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth">
                <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                  Student Login</Button>
              </Link>
              <Link href="/teacher/login">
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  Teacher Login</Button>
              </Link>
              <Link href="/parent/login">
                <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                  Parent Login</Button>
              </Link>
              <Link href="/admin/school">
                <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  School Dashboard</Button>
              </Link>
              <Link href="/admin/login">
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Admin Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("back.jpg")`,
          }}
        />
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100/90 text-green-800 mb-8 backdrop-blur-sm">
                </span>
            </div>
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg">
              Learn to Code with
              <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Interactive Fun
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-100 leading-relaxed drop-shadow-md">
              Master HTML, CSS, JavaScript, Python, Scratch, and more with our integrated code editors. 
              Build real projects, save your work, and track your progress - all in one platform designed for students.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8 py-4 h-auto shadow-lg">
                  Start Learning Now
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto border-white/30 text-white hover:bg-white/10 backdrop-blur-sm" onClick={() => {
                const coursesElement = document.getElementById('courses');
                coursesElement?.scrollIntoView({behavior: 'smooth'});
              }}>
                View Courses
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What are our key initiatives at Juja St. Peter's School ?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              Everything you need to start your coding journey
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                image: "https://media.istockphoto.com/id/887814862/vector/web-design-browser.jpg?s=612x612&w=0&k=20&c=rRNW4h-qjNv3OzhnYFrx03MfBQCwGreRsJsjx_-Kp-Q=",
                title: "Integrated Code Editors",
                description: "Write, test, and save your code directly in the browser with live previews"
              },
              {
                image: "https://media.istockphoto.com/id/2154233504/photo/education-and-study-abroad-concept-design-of-globe-with-graduation-cap-on-book-stairs-3d.jpg?s=612x612&w=0&k=20&c=vNFDHV3L7cb6DL3e59aqm4Sio_DBkuON-4H7wdwH5W8=",
                title: "Grade-Based Learning",
                description: "Courses tailored to your grade level with progressive difficulty"
              },
              {
                image: "https://media.istockphoto.com/id/2185086011/vector/validation-icon-in-vector-logotype.jpg?s=612x612&w=0&k=20&c=V-KyXlQiFKA2PVoV2utkUu26Sf5AVaB7MgdJPpsGS-g=",
                title: "Project Saving",
                description: "Save your projects and share them with teachers and friends"
              },
              {
                image: "https://media.istockphoto.com/id/2178462005/vector/goal-tracker-task-completion-entering-check-mark-concept-businessman-project-manager-holding.jpg?s=612x612&w=0&k=20&c=Hyx9qDESfIm3aQv2xhopCNoE1XylMAmOy6kZKfc4o6k=",
                title: "Progress Tracking",
                description: "Monitor your learning journey with detailed progress reports"
              },
              {
                image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdfiK8fx5ecKO_capGa7MkB1KTdey3Lo0frQ&s",
                title: "Interactive Learning",
                description: "Learn through games, challenges, and hands-on projects"
              },
              {
                image: "https://images.pexels.com/photos/4709291/pexels-photo-4709291.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
                title: "Teacher Dashboard",
                description: "Teachers can track student progress and export project data"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <CardHeader className="text-center p-0">
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 pb-2">
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <CardDescription className="text-center text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Preview Section */}
      <section id="courses" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Our Coding Courses
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              From beginner-friendly visual programming to advanced web development
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              { 
                title: "HTML Basics", 
                description: "Learn to create websites with HTML", 
                image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9qcNUJfqfcIeGOxFw1bgTlYAoZsjlZ4-5CM1JPTAlafz8ft9Mmv5eziwX3NRjNUNnNWw&usqp=CAU", 
                difficulty: "Beginner", 
                isActive: true,
                color: "from-orange-400 to-red-500"
              },
              { 
                title: "CSS Styling", 
                description: "Make websites beautiful with CSS", 
                image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJEkLT86OmrTsV15RvPQYgtqK7zz2mnp-vyLDwOBjIlbMnoJ1M--EZ5d48_maF5i9GwRw&usqp=CAU", 
                difficulty: "Beginner", 
                isActive: true,
                color: "from-blue-400 to-blue-600"
              },
              { 
                title: "JavaScript", 
                description: "Add interactivity to your websites", 
                image: "https://amani.home.blog/wp-content/uploads/2018/12/javascript-logo.png", 
                difficulty: "Intermediate", 
                isActive: true,
                color: "from-yellow-400 to-orange-500"
              },
              { 
                title: "Scratch", 
                description: "Visual programming for beginners", 
                image: "https://media.moddb.com/images/engines/1/2/1192/Scratch-Project-Ideas-for-Beginn.jpg", 
                difficulty: "Beginner", 
                isActive: true,
                color: "from-purple-400 to-pink-500"
              },
              { 
                title: "Python", 
                description: "Learn Python programming", 
                image: "https://1000logos.net/wp-content/uploads/2020/08/Python-Logo.jpg", 
                difficulty: "Intermediate", 
                isActive: true,
                color: "from-green-400 to-blue-500"
              },
              { 
                title: "Robotics", 
                description: "Build and program robots", 
                image: "https://t4.ftcdn.net/jpg/08/59/67/65/360_F_859676599_IHRXerobOchMocdgQrxbuX8s2Tuqfkik.jpg", 
                difficulty: "Advanced", 
                isActive: true,
                color: "from-red-400 to-pink-600"
              },
              { 
                title: "Typing Skills", 
                description: "Master keyboard typing", 
                image: "https://todaysparent.mblycdn.com/uploads/tp/2021/07/fun-typing-games-for-kids-dance-mat-typing.jpg", 
                difficulty: "Beginner", 
                isActive: true,
                color: "from-indigo-400 to-purple-500"
              },
              { 
                title: "Minecraft", 
                description: "Code in Minecraft worlds", 
                image: "https://1000logos.net/wp-content/uploads/2018/10/Minecraft-Logo.jpg", 
                difficulty: "Intermediate", 
                isActive: true,
                color: "from-green-500 to-emerald-600"
              }
            ].map((course, index) => (
              <Card key={index} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${!course.isActive ? 'opacity-60' : 'hover:-translate-y-1'}`}>
                <CardHeader className="text-center pb-2 p-0">
                  <div className="w-full h-32 overflow-hidden">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 pb-2">
                    <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                    <Badge variant={course.isActive ? "default" : "secondary"} className="w-fit mx-auto">
                      {course.isActive ? "Available" : "Coming Soon"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-center pt-0 px-4 pb-4">
                  <CardDescription className="text-sm mb-3">
                    {course.description}
                  </CardDescription>
                  <Badge variant="outline" className="text-xs">
                    {course.difficulty}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to Start Your Coding Journey?
          </h2>
          <p className="mt-4 text-xl text-green-100">
            Join thousands of students already learning to code with our interactive platform
          </p>
          <div className="mt-8">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold">
                Create Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <h3 className="text-white text-xl font-bold">Juja St. Peters School</h3>
            </div>
            <p className="text-gray-400">Empowering the next generation of coders</p>
            <img style={{ width: 50 }} src="https://cdn-icons-png.flaticon.com/128/8522/8522275.png" />
            <img style={{ width: 50 }} src="https://cdn-icons-png.flaticon.com/128/13266/13266170.png" />
            <img style={{ width: 50 }} src="https://cdn-icons-png.flaticon.com/128/1077/1077042.png" />
            <div className="mt-6 flex justify-center space-x-6">
              <span className="text-gray-400 text-sm">© 2024 Juja St. Peters School. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

