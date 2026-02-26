"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, ArrowLeft, Play, Square, FileText, BookOpen, Book } from "lucide-react";
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

interface PythonEditorProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  difficulty: string;
  category: string;
  editProject?: EditProjectData;
}

export default function PythonEditor({ 
  courseId, 
  courseTitle, 
  courseDescription, 
  difficulty, 
  category,
  editProject
}: PythonEditorProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [pythonCode, setPythonCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      console.log("Python Editor - Loading existing project:", editProject);
      setProjectTitle(editProject.title || "");
      if (editProject.codeContent) {
        setPythonCode(editProject.codeContent);
      }
      setIsEditMode(true);
      toast.success("Project loaded for editing");
    }
  }, [editProject]);

  // Set default Python code on component mount (only if not editing)
  useEffect(() => {
    if (editProject) return; // Don't override if editing
    setPythonCode(`# Welcome to Python Programming!
# Let's start with a simple "Hello, World!" program

print("Hello, World!")
print("Welcome to Python programming!")

# Try some basic Python concepts:

# Variables
name = "Student"
age = 12
print(f"My name is {name} and I am {age} years old")

# Simple math
x = 10
y = 5
print(f"{x} + {y} = {x + y}")
print(f"{x} - {y} = {x - y}")
print(f"{x} * {y} = {x * y}")

# Lists
fruits = ["apple", "banana", "orange"]
print("My favorite fruits:")
for fruit in fruits:
    print(f"- {fruit}")

# Simple function
def greet(person):
    return f"Hello, {person}! Welcome to Python!"

print(greet("Coder"))

# Fun with loops
print("\\nCounting to 5:")
for i in range(1, 6):
    print(f"Count: {i}")
`);
  }, []);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("Running Python code...\n");
    
    // Simulate Python execution with better variable handling
    setTimeout(() => {
      try {
        // Simple simulation of Python output with improved variable tracking
        let simulatedOutput = "";
        const lines = pythonCode.split('\n');
        
        // Track variables for better simulation
        const variables = {
          name: "Student",
          age: 12,
          x: 10,
          y: 5,
          fruits: ["apple", "banana", "orange"]
        };
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          // Handle variable assignments
          if (trimmed.includes('=') && !trimmed.includes('==') && !trimmed.startsWith('print')) {
            const [varName, varValue] = trimmed.split('=').map(s => s.trim());
            if (varValue.startsWith('"') || varValue.startsWith("'")) {
              // String variable
              variables[varName] = varValue.replace(/['"]/g, '');
            } else if (!isNaN(Number(varValue))) {
              // Number variable
              variables[varName] = Number(varValue);
            } else if (varValue.startsWith('[')) {
              // List variable (simple parsing)
              try {
                variables[varName] = JSON.parse(varValue.replace(/'/g, '"'));
              } catch (e) {
                variables[varName] = varValue;
              }
            }
          }
          
          // Handle print statements
          if (trimmed.startsWith('print(')) {
            const match = trimmed.match(/print\((.*)\)/);
            if (match) {
              let content = match[1];
              
              // Handle f-strings and variable substitution
              if (content.includes('f"') || content.includes("f'")) {
                // Process f-string
                content = content.replace(/f["'](.*)["']/, '$1');
                
                // Replace variables in f-string
                for (const [varName, varValue] of Object.entries(variables)) {
                  const regex = new RegExp(`\\{${varName}\\}`, 'g');
                  content = content.replace(regex, String(varValue));
                }
                
                // Handle expressions in f-strings
                content = content.replace(/\{x \+ y\}/g, String(variables.x + variables.y));
                content = content.replace(/\{x - y\}/g, String(variables.x - variables.y));
                content = content.replace(/\{x \* y\}/g, String(variables.x * variables.y));
                content = content.replace(/\{x \/ y\}/g, String(variables.x / variables.y));
              } else {
                // Handle regular variable references
                for (const [varName, varValue] of Object.entries(variables)) {
                  if (content === varName) {
                    content = String(varValue);
                    break;
                  }
                }
              }
              
              // Remove quotes from string literals
              content = content.replace(/^["']|["']$/g, '');
              simulatedOutput += content + "\n";
            }
          }
        }
        
        // Add some additional simulated output for loops and functions
        if (pythonCode.includes('for fruit in fruits:')) {
          simulatedOutput += "- apple\n- banana\n- orange\n";
        }
        if (pythonCode.includes('greet(')) {
          const greetMatch = pythonCode.match(/greet\(["'](.*)["']\)/);
          if (greetMatch) {
            simulatedOutput += `Hello, ${greetMatch[1]}! Welcome to Python!\n`;
          }
        }
        if (pythonCode.includes('for i in range(1, 6):')) {
          simulatedOutput += "\nCounting to 5:\nCount: 1\nCount: 2\nCount: 3\nCount: 4\nCount: 5\n";
        }
        
        setOutput(simulatedOutput || "Code executed successfully! (No output to display)");
      } catch (error) {
        setOutput("Error: " + (error as Error).message);
      }
      setIsRunning(false);
    }, 1500);
  };

  const handleSaveProject = async () => {
    console.log("=== PYTHON SAVE PROJECT DEBUG START ===");
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

    if (!pythonCode.trim()) {
      console.log("ERROR: No Python code provided");
      toast.error("Please write some Python code before saving");
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
      console.log("Attempting to save Python project with:", {
        title: projectTitle,
        courseId: courseId,
        codeLength: pythonCode.length,
        currentUser: currentUser
      });

      // Create a simple HTML page to display the Python code
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .code { background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .output { background: #1a202c; color: #68d391; padding: 15px; border-radius: 5px; margin-top: 10px; white-space: pre-wrap; }
        h1 { color: #2d3748; }
        h2 { color: #4a5568; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐍 Python Project: ${projectTitle}</h1>
        <h2>Code:</h2>
        <div class="code">${pythonCode.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</div>
        <h2>Output:</h2>
        <div class="output">${output.replace(/\n/g, '<br>')}</div>
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const projectUrl = URL.createObjectURL(blob);

      console.log("Calling saveProject mutation...");
      
      let result;
      
      // If editing an existing project, use updateProject
      if (isEditMode && editProject) {
        console.log("Updating existing project:", editProject._id);
        result = await updateProject({
          projectId: editProject._id,
          title: projectTitle,
          projectUrl: projectUrl,
          codeContent: pythonCode,
        });
        console.log("Python project updated successfully:", result);
        toast.success("Python project updated successfully! 🎉");
      } else {
        // Try custom auth first (for localStorage-based authentication)
        if (currentUser?.username) {
          console.log("Using custom auth with username:", currentUser.username);
          result = await saveProjectCustomAuth({
            username: currentUser.username,
            title: projectTitle,
            courseId: courseId as Id<"courses">,
            projectUrl: projectUrl,
            codeContent: pythonCode,
            language: "python"
          });
          console.log("Python project saved successfully with custom auth:", result);
        } else {
          console.log("Using Convex auth");
          result = await saveProject({
            title: projectTitle,
            courseId: courseId as Id<"courses">,
            projectUrl: projectUrl,
            codeContent: pythonCode,
            language: "python"
          });
          console.log("Python project saved successfully with Convex auth:", result);
        }
        console.log("Python project saved successfully:", result);
        toast.success("Python project saved successfully! 🎉");
        setProjectTitle("");
      }
      console.log("=== PYTHON SAVE PROJECT DEBUG END (SUCCESS) ===");
      
    } catch (error) {
      console.log("=== PYTHON SAVE PROJECT DEBUG END (ERROR) ===");
      console.error("Error saving Python project:", error);
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white overflow-hidden">
      {/* Authentication Warning Banner - Only show when user is confirmed null AND not loading */}
      {currentUser === null && userFromStorage === null && convexUser === undefined && userByUsername === undefined && (
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
                  <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded-full">{difficulty}</span>
                  <span className="text-sm text-gray-400">{category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRunCode}
                disabled={isRunning}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? "Running..." : "Run Code"}
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
          <Input
            placeholder="Enter your Python project title..."
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        {/* Main Editor Layout */}
        <div className="flex-1 flex">
          {viewingNotes ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <StudentNotesViewer courseId={courseId as Id<"courses">} />
            </div>
          ) : viewingQuiz ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <CourseQuiz courseId={courseId as Id<"courses">} courseName={courseTitle} />
            </div>
          ) : (
            <>
              {/* Python Code Editor */}
              <div className="w-1/2 flex flex-col border-r border-gray-700">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-green-400" />
                  <span className="text-sm text-gray-300">Python Code</span>
                </div>
                <textarea
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  className="flex-1 resize-none border-0 bg-gray-900 text-green-400 p-4 focus:outline-none font-mono text-sm leading-relaxed"
                  placeholder="# Write your Python code here..."
                  style={{
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    tabSize: 4
                  }}
                />
              </div>

              {/* Output Panel */}
              <div className="w-1/2 flex flex-col">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
                  <Play className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-sm text-gray-300">Output</span>
                </div>
                <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                    {output || "Click 'Run Code' to see the output of your Python program..."}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}









