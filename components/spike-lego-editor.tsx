









"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Settings, Zap, BookOpen, Book } from "lucide-react";
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

interface SpikeLegoEditorProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  difficulty: string;
  category: string;
  editProject?: EditProjectData;
}

export default function SpikeLegoEditor({ 
  courseId, 
  courseTitle, 
  courseDescription, 
  difficulty, 
  category,
  editProject
}: SpikeLegoEditorProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [buildInstructions, setBuildInstructions] = useState("");
  const [codeBlocks, setCodeBlocks] = useState("");
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
    } else if (userFromStorage) {
      // Fallback to localStorage data if database query fails
      setCurrentUser(userFromStorage);
    }
  }, [convexUser, userFromStorage]);

  // Load existing project data if editing
  useEffect(() => {
    if (editProject) {
      console.log("Spike Lego Editor - Loading existing project:", editProject);
      setProjectTitle(editProject.title || "");
      if (editProject.codeContent) {
        try {
          const projectData = JSON.parse(editProject.codeContent);
          if (projectData.description) setProjectDescription(projectData.description);
          if (projectData.buildInstructions) setBuildInstructions(projectData.buildInstructions);
          if (projectData.codeBlocks) setCodeBlocks(projectData.codeBlocks);
        } catch (e) {
          // Code content might not be JSON
        }
      }
      setIsEditMode(true);
      toast.success("Project loaded for editing");
    }
  }, [editProject]);

  // Set default content on component mount
  useEffect(() => {
    setProjectDescription("My LEGO Spike robot project with custom programming and building instructions.");
    setBuildInstructions(`Building Instructions:
1. Start with the Spike Prime hub as the main controller
2. Attach motors to ports A and B for movement
3. Connect sensors to ports 1 and 2 for input
4. Build a sturdy chassis using LEGO Technic beams
5. Add wheels or tracks for mobility
6. Secure all connections and test movement`);
    
    setCodeBlocks(`# LEGO Spike Prime Programming
# This is a sample program for your Spike robot

from spike import PrimeHub, LightMatrix, Button, StatusLight, ForceSensor, MotionSensor, Speaker, ColorSensor, App, DistanceSensor, Motor, MotorPair
from spike.control import wait_for_seconds, wait_until, Timer
import math

# Initialize the hub
hub = PrimeHub()

# Initialize motors
motor_pair = MotorPair('A', 'B')
arm_motor = Motor('C')

# Initialize sensors
distance_sensor = DistanceSensor('1')
color_sensor = ColorSensor('2')

# Welcome message
hub.light_matrix.write("Hi!")
hub.speaker.beep(60, 0.5)

# Main program
def main():
    print("🤖 Starting Spike Robot Program!")
    
    # Move forward
    print("Moving forward...")
    motor_pair.move(10, 'cm', steering=0, speed=50)
    
    # Check distance
    distance = distance_sensor.get_distance_cm()
    if distance and distance < 20:
        print("Obstacle detected! Turning...")
        motor_pair.move(5, 'cm', steering=100, speed=30)
    
    # Check color
    color = color_sensor.get_color()
    if color == 'red':
        print("Red detected! Stopping...")
        hub.light_matrix.write("STOP")
        hub.speaker.beep(80, 1)
    
    # Move arm
    print("Moving arm...")
    arm_motor.run_for_degrees(90, speed=50)
    
    print("Program complete! 🎉")
    hub.light_matrix.write(":)")

# Run the main program
if __name__ == "__main__":
    main()`);
  }, []);

  const handleSaveProject = async () => {
    console.log("=== SPIKE LEGO SAVE PROJECT DEBUG START ===");
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

    if (!projectDescription.trim() && !buildInstructions.trim() && !codeBlocks.trim()) {
      toast.error("Please add some content to your project");
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
      console.log("Attempting to save Spike Lego project with:", {
        title: projectTitle,
        courseId: courseId,
        description: projectDescription,
        currentUser: currentUser
      });

      // Create a comprehensive HTML page for the LEGO Spike project
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 1000px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .robot-icon { font-size: 4em; margin-bottom: 10px; }
        h1 { color: #2c3e50; margin-bottom: 10px; }
        h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        .description { color: #7f8c8d; font-size: 1.1em; line-height: 1.6; }
        .section { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #3498db; }
        .code-section { background: #2c3e50; color: #ecf0f1; padding: 20px; border-radius: 10px; margin: 20px 0; font-family: 'Courier New', monospace; }
        .instructions { background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #27ae60; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .feature { background: #ecf0f1; padding: 15px; border-radius: 8px; text-align: center; }
        .feature-icon { font-size: 2em; margin-bottom: 10px; }
        pre { white-space: pre-wrap; font-size: 0.9em; line-height: 1.4; }
        .highlight { background: #f39c12; color: white; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="robot-icon">🤖</div>
            <h1>LEGO Spike Project: ${projectTitle}</h1>
            <p class="description">${projectDescription}</p>
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🧱</div>
                <h3>LEGO Building</h3>
                <p>Creative construction with LEGO Technic elements</p>
            </div>
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <h3>Smart Programming</h3>
                <p>Python-based programming for intelligent behavior</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🔧</div>
                <h3>Engineering Design</h3>
                <p>Problem-solving through iterative design</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎯</div>
                <h3>Mission Ready</h3>
                <p>Designed to complete specific challenges</p>
            </div>
        </div>
        
        <div class="instructions">
            <h2>🔨 Building Instructions</h2>
            <pre>${buildInstructions}</pre>
        </div>
        
        <div class="code-section">
            <h2 style="color: #ecf0f1;">💻 Python Code</h2>
            <pre>${codeBlocks}</pre>
        </div>
        
        <div class="section">
            <h2>🎓 Learning Outcomes</h2>
            <ul>
                <li><span class="highlight">Engineering</span> - Mechanical design and construction principles</li>
                <li><span class="highlight">Programming</span> - Python syntax and robotics programming</li>
                <li><span class="highlight">Problem Solving</span> - Debugging and iterative improvement</li>
                <li><span class="highlight">Creativity</span> - Custom solutions and innovative designs</li>
                <li><span class="highlight">Collaboration</span> - Teamwork and communication skills</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>🚀 Next Steps</h2>
            <p>Consider these enhancements for your robot:</p>
            <ul>
                <li>Add more sensors for better environmental awareness</li>
                <li>Implement advanced movement patterns</li>
                <li>Create custom functions for repeated actions</li>
                <li>Design challenges for other students to solve</li>
                <li>Document your testing and improvement process</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(45deg, #3498db, #2ecc71); color: white; border-radius: 10px;">
            <h3>🏆 Project Complete!</h3>
            <p>Great work on your LEGO Spike robotics project!</p>
        </div>
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const projectUrl = URL.createObjectURL(blob);
      
      console.log("Calling saveProject mutation...");
      
      let result;
      const codeContent = JSON.stringify({
        description: projectDescription,
        buildInstructions: buildInstructions,
        codeBlocks: codeBlocks
      });
      
      // If editing an existing project, use updateProject
      if (isEditMode && editProject) {
        console.log("Updating existing project:", editProject._id);
        result = await updateProject({
          projectId: editProject._id,
          title: projectTitle,
          projectUrl: projectUrl,
          codeContent: codeContent,
        });
        console.log("Spike Lego project updated successfully:", result);
        toast.success("LEGO Spike project updated successfully! 🎉");
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
          console.log("Spike Lego project saved successfully with custom auth:", result);
        } else {
          console.log("Using Convex auth");
          result = await saveProject({
            title: projectTitle,
            courseId: courseId as Id<"courses">,
            projectUrl: projectUrl,
            codeContent: codeContent,
            language: "python"
          });
          console.log("Spike Lego project saved successfully with Convex auth:", result);
        }
        toast.success("LEGO Spike project saved successfully! 🎉");
        setProjectTitle("");
      }
      console.log("=== SPIKE LEGO SAVE PROJECT DEBUG END (SUCCESS) ===");
      
    } catch (error) {
      console.log("=== SPIKE LEGO SAVE PROJECT DEBUG END (ERROR) ===");
      console.error("Error saving Spike Lego project:", error);
      
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
    <div className="min-h-screen bg-gray-900">
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
      <header className="bg-gray-800 shadow-lg border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white">{courseTitle}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-orange-900 text-orange-200 text-xs rounded-full">{difficulty}</span>
                  <span className="text-sm text-gray-400">{category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setViewingQuiz(!viewingQuiz)}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-400 hover:text-white hover:bg-blue-700"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Quiz
              </Button>
              <Button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
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
            placeholder="Enter your LEGO Spike project title..."
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="max-w-md bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>

        {/* Main Editor Layout */}
        <div className="flex-1 flex">
          {/* Left Panel - Project Details */}
          <div className="w-1/2 flex flex-col border-r border-gray-700">
            {/* Project Description */}
            <div className="flex-1 border-b border-gray-700">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-sm font-medium text-gray-200">Project Description</span>
              </div>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full h-full resize-none border-0 bg-gray-900 text-gray-200 p-4 focus:outline-none text-sm"
                placeholder="Describe your LEGO Spike robot project..."
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {/* Building Instructions */}
            <div className="flex-1">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
                <span className="text-sm font-medium text-gray-200">🔨 Building Instructions</span>
              </div>
              <textarea
                value={buildInstructions}
                onChange={(e) => setBuildInstructions(e.target.value)}
                className="w-full h-full resize-none border-0 bg-gray-800 text-gray-200 p-4 focus:outline-none font-mono text-sm"
                placeholder="Step-by-step building instructions..."
                style={{
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
              />
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-400" />
              <span className="text-sm font-medium text-gray-200">Python Code</span>
            </div>
            <textarea
              value={codeBlocks}
              onChange={(e) => setCodeBlocks(e.target.value)}
              className="flex-1 resize-none border-0 bg-gray-950 text-green-400 p-4 focus:outline-none font-mono text-sm"
              placeholder="# Write your LEGO Spike Python code here..."
              style={{
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                tabSize: 4
              }}
            />
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

      {/* Instructions Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-2">🤖 LEGO Spike Programming Tips</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <h4 className="font-semibold text-orange-400 mb-1">Building:</h4>
              <ul className="space-y-1">
                <li>• Use strong connections</li>
                <li>• Plan cable management</li>
                <li>• Test mechanical parts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400 mb-1">Programming:</h4>
              <ul className="space-y-1">
                <li>• Import required modules</li>
                <li>• Initialize hub and sensors</li>
                <li>• Use clear variable names</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-1">Testing:</h4>
              <ul className="space-y-1">
                <li>• Test each function separately</li>
                <li>• Use print() for debugging</li>
                <li>• Iterate and improve</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












