
"use client"

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Download, Filter, Users, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AdminProjectsDashboard() {
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get all projects with filtering
  const projectsResult = useQuery(api.projects.getAllProjects, {
    gradeFilter: selectedGrade === "all" ? undefined : selectedGrade,
  });

  const projects = projectsResult || [];
  const isLoading = projectsResult === undefined;
  const hasError = false;

  // Filter projects by search term
  const filteredProjects = projects.filter(project => 
    project.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group projects by grade
  const projectsByGrade = filteredProjects.reduce((acc, project) => {
    const grade = project.studentGrade || "Unknown";
    if (!acc[grade]) {
      acc[grade] = [];
    }
    acc[grade].push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  // Get unique grades for filter dropdown
  const availableGrades = Array.from(new Set(projects.map(p => p.studentGrade || "Unknown"))).sort();

  const handleExportProjects = () => {
    if (filteredProjects.length === 0) {
      toast.error("No projects to export");
      return;
    }

    // Create CSV content
    const headers = ["Student Name", "Email", "Grade", "Project Title", "Language", "Submission Date", "Status", "Project URL"];
    const csvContent = [
      headers.join(","),
      ...filteredProjects.map(project => [
        `"${project.studentName}"`,
        `"${project.studentEmail}"`,
        `"${project.studentGrade}"`,
        `"${project.title}"`,
        `"${project.language || 'Unknown'}"`,
        `"${new Date(project.submissionDate).toLocaleDateString()}"`,
        `"${project.status}"`,
        `"${project.projectUrl}"`
      ].join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects-${selectedGrade === "all" ? "all-grades" : selectedGrade}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Projects exported successfully!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading projects...</h1>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Projects Dashboard</h1>
          <p className="text-gray-600">View and manage student project submissions by grade level</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredProjects.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(filteredProjects.map(p => p.studentEmail)).size}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade Levels</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(projectsByGrade).length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProjects.filter(p => {
                  const projectDate = new Date(p.submissionDate);
                  const now = new Date();
                  return projectDate.getMonth() === now.getMonth() && 
                         projectDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters & Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Grade</label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {availableGrades.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search Students/Projects</label>
                <Input
                  placeholder="Search by name, email, or project title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleExportProjects}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Grade */}
        {Object.entries(projectsByGrade).map(([grade, gradeProjects]) => (
          <Card key={grade} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{grade} ({gradeProjects.length} projects)</span>
                <Badge variant="outline">{new Set(gradeProjects.map(p => p.studentEmail)).size} students</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Project Title</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradeProjects.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.studentName}</div>
                            <div className="text-sm text-gray-500">{project.studentEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{project.language || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(project.submissionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={project.status === "submitted" ? "default" : "secondary"}
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(project.projectUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600">
                {selectedGrade === "all" 
                  ? "No projects have been submitted yet." 
                  : `No projects found for ${selectedGrade}.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
