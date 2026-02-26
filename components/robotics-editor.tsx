"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, ArrowLeft, ExternalLink, Zap, Settings, BookOpen, Book } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import CourseQuiz from "./course-quiz";
import StudentNotesViewer from "./student-notes-viewer";

interface EditProjectData {
  _id: Id<"projects">;
  title: string;
  description?: string;
  codeContent?: string;
  projectUrl: string;
}

interface RoboticsEditorProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  difficulty: string;
  category: string;
  editProject?: EditProjectData;
}

export default function RoboticsEditor({ 
  courseId, 
  courseTitle, 
  courseDescription, 
  difficulty, 
  category,
  editProject
}: RoboticsEditorProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [roboticsProjectId, setRoboticsProjectId] = useState("");
  const [viewingQuiz, setViewingQuiz] = useState(false);
  const [viewingNotes, setViewingNotes] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const saveProject = useMutation(api.projects.submitProject);
  const saveProjectCustomAuth = useMutation(api.projects.submitProjectWithCustomAuth);
  const updateProject = useMutation(api.projects.updateProject);
  
  // Get current user from Convex (for Convex auth)
  const convexUser = useQuery(api.users.currentLoggedInUser);
  
  // Get user by username from localStorage (for custom auth)
  const userByUsername = useQuery(
    api.users.getUserByUsernameForAuth, 
    userFromStorage?.username ? { username: userFromStorage.username } : "skip"
  );

  useEffect(() => {
    // Check localStorage for user data
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserFromStorage(parsedUser);
    }
  }, []);

  useEffect(() => {
    // Set current user from either Convex auth or custom auth
    if (convexUser) {
      setCurrentUser(convexUser);
    } else if (userByUsername) {
      setCurrentUser(userByUsername);
    } else if (userFromStorage) {
      // Fallback to localStorage data if database query fails
      setCurrentUser(userFromStorage);
    }
  }, [convexUser, userByUsername, userFromStorage]);

  // Load existing project data if editing
  useEffect(() => {
    if (editProject) {
      console.log("Robotics Editor - Loading existing project:", editProject);
      setProjectTitle(editProject.title || "");
      // Extract project ID from URL if available
      if (editProject.projectUrl && editProject.projectUrl.includes("mblock.cc")) {
        const match = editProject.projectUrl.match(/project\/([^\/]+)/);
        if (match) setRoboticsProjectId(match[1]);
      }
      setIsEditMode(true);
      toast.success("Project loaded for editing");
    }
  }, [editProject]);

  const handleSaveProject = async () => {
    console.log("=== ROBOTICS SAVE PROJECT DEBUG START ===");
    console.log("Project title:", projectTitle);
    console.log("Course ID:", courseId);
    console.log("Current user state:", currentUser);
    console.log("User from storage:", userFromStorage);
    console.log("Convex user:", convexUser);
    console.log("User by username:", userByUsername);
    
    if (!projectTitle.trim()) {
      console.log("ERROR: No project title provided");
      toast.error("Please enter a project title");
      return;
    }

    // Check if user is authenticated
    if (!currentUser) {
      console.log("ERROR: User is null (not authenticated)");
      toast.error("Please log in to save your project. Click the 'Back' button and go to the login page.");
      return;
    }

    console.log("User authenticated, proceeding with save...");
    setIsSaving(true);
    
    try {
      console.log("Attempting to save Robotics project with:", {
        title: projectTitle,
        courseId: courseId,
        roboticsProjectId: roboticsProjectId,
        currentUser: currentUser
      });

      // For Robotics, we'll use the mBlock URL or project ID
      const projectUrl = roboticsProjectId.trim() 
        ? `https://ide.mblock.cc/project/${roboticsProjectId}`
        : "https://ide.mblock.cc/";
      
      console.log("Calling saveProject mutation...");
      
      let result;
      const codeContent = `Robotics programming project - ${projectTitle}${roboticsProjectId ? ` (Project ID: ${roboticsProjectId})` : ''}`;
      
      // If editing an existing project, use updateProject
      if (isEditMode && editProject) {
        console.log("Updating existing project:", editProject._id);
        result = await updateProject({
          projectId: editProject._id,
          title: projectTitle,
          projectUrl: projectUrl,
          codeContent: codeContent,
        });
        console.log("Robotics project updated successfully:", result);
        toast.success("Robotics project updated successfully! 🎉");
      } else {
        // Try custom auth first (for localStorage-based authentication)
        if (currentUser?.username) {
          console.log("Using custom auth with username:", currentUser.username);
          result = await saveProjectCustomAuth({
            username: currentUser.username,
            title: projectTitle,
            courseId: courseId as Id<"courses">,
            projectUrl: projectUrl,
            codeContent: codeContent,
            language: "python"
          });
          console.log("Robotics project saved successfully with custom auth:", result);
        } else {
          console.log("Using Convex auth");
          result = await saveProject({
            title: projectTitle,
            courseId: courseId as Id<"courses">,
            projectUrl: projectUrl,
            codeContent: codeContent,
            language: "python"
          });
          console.log("Robotics project saved successfully with Convex auth:", result);
        }
        toast.success("Robotics project saved successfully! 🎉");
        setProjectTitle("");
        setRoboticsProjectId("");
      }
      console.log("=== ROBOTICS SAVE PROJECT DEBUG END (SUCCESS) ===");
      
    } catch (error) {
      console.log("=== ROBOTICS SAVE PROJECT DEBUG END (ERROR) ===");
      console.error("Error saving Robotics project:", error);
      
      if (error instanceof Error) {
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        
        if (error.message.includes("Not authenticated")) {
          toast.error("Please log in to save your project");
        } else if (error.message.includes("Only students can submit projects")) {
          toast.error("Only students can save projects. Please check your account type.");
        } else {
          toast.error(`Failed to save project: ${error.message}`);
        }
      } else {
        console.log("Non-Error object thrown:", error);
        toast.error("Failed to save project. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openMBlockEditor = () => {
    window.open('https://ide.mblock.cc/', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Authentication Warning Banner - Only show when user is confirmed null, not when loading */}
      {currentUser === null && userFromStorage === null && (
        <div className="bg-yellow-600 text-white px-4 py-3 text-center">
          <p className="text-sm">
            ⚠️ You need to log in to save your projects. 
            <Link href="/auth" className="underline ml-2 font-semibold hover:text-yellow-200">
              Click here to log in
            </Link>
          </p>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white">{courseTitle}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-red-600 text-red-100 text-xs rounded-full">{difficulty}</span>
                  <span className="text-sm text-gray-400">{category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={openMBlockEditor}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open mBlock IDE
              </Button>
              <Button
                onClick={() => setViewingNotes(!viewingNotes)}
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-300 hover:text-white hover:bg-purple-700"
              >
                <Book className="w-4 h-4 mr-2" />
                Notes
              </Button>
              <Button
                onClick={() => setViewingQuiz(!viewingQuiz)}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-300 hover:text-white hover:bg-blue-700"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Quiz
              </Button>
              <Button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : isEditMode ? "Update Project" : "Save Project"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Project Title Input */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex space-x-4">
            <Input
              placeholder="Enter your robotics project title..."
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Input
              placeholder="mBlock Project ID (optional)"
              value={roboticsProjectId}
              onChange={(e) => setRoboticsProjectId(e.target.value)}
              className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Panel - Robot Control Simulator */}
          <div className="w-1/2 flex flex-col border-r border-gray-700">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm text-gray-300">Robot Control Panel</span>
            </div>
            <div className="flex-1 bg-gray-900 p-6">
              {/* Virtual Robot Display */}
              <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg p-6 mb-6 text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold text-white mb-2">Virtual mBot</h3>
                <p className="text-sm text-gray-400">Connect your real mBot to see it here!</p>
              </div>

              {/* Control Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div></div>
                  <Button className="bg-green-600 hover:bg-green-700">↑ Forward</Button>
                  <div></div>
                  <Button className="bg-blue-600 hover:bg-blue-700">← Left</Button>
                  <Button className="bg-red-600 hover:bg-red-700">⏹ Stop</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">Right →</Button>
                  <div></div>
                  <Button className="bg-green-600 hover:bg-green-700">↓ Backward</Button>
                  <div></div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button className="bg-yellow-600 hover:bg-yellow-700">💡 LED On</Button>
                  <Button className="bg-purple-600 hover:bg-purple-700">🔊 Buzzer</Button>
                </div>

                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-white mb-2">Sensor Readings:</h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>Distance: 25 cm</div>
                    <div>Light: 45%</div>
                    <div>Sound: 12 dB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - mBlock IDE */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-300 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-purple-400" />
                mBlock Programming Environment
              </span>
              <Button
                onClick={openMBlockEditor}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
            <div className="flex-1 bg-white">
              <iframe
                src="https://ide.mblock.cc/"
                className="w-full h-full border-0"
                title="mBlock Programming Environment"
                allow="camera; microphone; usb"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz View */}
      {viewingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Course Quiz</h2>
              <Button
                onClick={() => setViewingQuiz(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            <CourseQuiz courseId={courseId} courseName={courseTitle} />
          </div>
        </div>
      )}

      {/* Notes View */}
      {viewingNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Course Notes</h2>
              <Button
                onClick={() => setViewingNotes(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            <StudentNotesViewer courseId={courseId as Id<"courses">} />
          </div>
        </div>
      )}
    </div>
  );
}












