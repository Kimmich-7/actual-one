




"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

export default function AdminProjectsContent() {
  const allCourses = useQuery(api.courses.getAllCourses)
  const allClasses = useQuery(api.users.getAllClasses)
  const allStudents = useQuery(api.users.getAllApprovedStudents)

  // Project filtering state
  const [projectFilters, setProjectFilters] = useState({
    grade: "",
    class: "",
    course: "",
    student: ""
  })

  const allProjects = useQuery(api.projects.getAllProjectsSimple, {
    gradeFilter: projectFilters.grade || undefined,
    courseFilter: (projectFilters.course || undefined) as Id<"courses"> | undefined,
    classFilter: projectFilters.class || undefined,
    studentFilter: (projectFilters.student || undefined) as Id<"users"> | undefined,
  })

  const projectsData = allProjects || []
  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)

  return (
    <div className="space-y-6">
      {/* Project Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{projectsData.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {projectsData.filter(p => p.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {projectsData.filter(p => p.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {projectsData.filter(p => p.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Filter Projects</CardTitle>
          <CardDescription>Filter projects by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Select value={projectFilters.grade} onValueChange={(value) => setProjectFilters({...projectFilters, grade: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={projectFilters.class} onValueChange={(value) => setProjectFilters({...projectFilters, class: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {allClasses?.filter(cls => cls.name && cls.name.trim() !== "").map((cls) => (
                    <SelectItem key={cls._id} value={cls.name}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={projectFilters.course} onValueChange={(value) => setProjectFilters({...projectFilters, course: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Courses</SelectItem>
                  {allCourses?.map((course) => (
                    <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={projectFilters.student} onValueChange={(value) => setProjectFilters({...projectFilters, student: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Students</SelectItem>
                  {allStudents?.map((student) => (
                    <SelectItem key={student._id} value={student._id}>{student.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">All Projects</CardTitle>
          <CardDescription>View and manage student project submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {projectsData && projectsData.length > 0 ? (
            <div className="space-y-4">
              {projectsData.map((project) => (
                <div key={project._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          Student: {allStudents?.find(s => s._id === project.studentId)?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Course: {allCourses?.find(c => c._id === project.courseId)?.title || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Submitted: {new Date(project.submissionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        project.status === "approved" ? "default" : 
                        project.status === "pending" ? "secondary" : 
                        "destructive"
                      }>
                        {project.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No projects found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




