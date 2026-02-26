"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, ArrowLeft, ExternalLink, Play, Gamepad2, Puzzle, Trophy, BookOpen, Book } from "lucide-react";
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

interface MinecraftEditorProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  difficulty: string;
  category: string;
  editProject?: EditProjectData;
}

// Minecraft coding challenges and puzzles
const minecraftChallenges = [
  {
    id: 1,
    title: "Build a Simple House",
    description: "Use blocks to create a basic house structure",
    difficulty: "Easy",
    code: `// Minecraft House Builder
// Use these commands to build your house

/fill ~0 ~0 ~0 ~10 ~5 ~10 minecraft:oak_planks
/fill ~1 ~1 ~1 ~9 ~4 ~9 minecraft:air
/setblock ~5 ~1 ~0 minecraft:oak_door
/fill ~2 ~2 ~0 ~3 ~3 ~0 minecraft:glass
/fill ~7 ~2 ~0 ~8 ~3 ~0 minecraft:glass`,
    solution: "A cozy wooden house with windows and a door!"
  },
  {
    id: 2,
    title: "Create a Garden",
    description: "Plant crops and flowers in organized rows",
    difficulty: "Easy",
    code: `// Minecraft Garden Creator
// Plant different crops in rows

/fill ~0 ~0 ~0 ~15 ~0 ~10 minecraft:farmland
/fill ~0 ~1 ~0 ~15 ~1 ~2 minecraft:wheat
/fill ~0 ~1 ~3 ~15 ~1 ~5 minecraft:carrots
/fill ~0 ~1 ~6 ~15 ~1 ~8 minecraft:potatoes
/fill ~0 ~1 ~9 ~15 ~1 ~10 minecraft:beetroots`,
    solution: "A beautiful organized farm with different crops!"
  },
  {
    id: 3,
    title: "Redstone Circuit",
    description: "Build a simple redstone circuit with a button and lamp",
    difficulty: "Medium",
    code: `// Minecraft Redstone Circuit
// Create a button that lights up a lamp

/setblock ~0 ~0 ~0 minecraft:stone
/setblock ~0 ~1 ~0 minecraft:stone_button
/fill ~1 ~0 ~0 ~5 ~0 ~0 minecraft:redstone_wire
/setblock ~6 ~0 ~0 minecraft:redstone_lamp
/setblock ~6 ~-1 ~0 minecraft:stone`,
    solution: "Press the button to light up the lamp!"
  },
  {
    id: 4,
    title: "Automatic Farm",
    description: "Create a farm with water irrigation system",
    difficulty: "Medium",
    code: `// Minecraft Automatic Farm
// Build a farm with automatic water system

/fill ~0 ~0 ~0 ~20 ~0 ~20 minecraft:dirt
/fill ~2 ~0 ~2 ~18 ~0 ~18 minecraft:farmland
/fill ~4 ~0 ~4 ~16 ~0 ~16 minecraft:water
/fill ~6 ~1 ~6 ~14 ~1 ~14 minecraft:wheat
/setblock ~10 ~2 ~10 minecraft:water`,
    solution: "A self-watering farm that grows crops automatically!"
  },
  {
    id: 5,
    title: "Castle Defense",
    description: "Build a castle with defensive walls and towers",
    difficulty: "Hard",
    code: `// Minecraft Castle Builder
// Create a defensive castle structure

/fill ~0 ~0 ~0 ~30 ~15 ~30 minecraft:stone_bricks hollow
/fill ~0 ~0 ~0 ~30 ~2 ~30 minecraft:stone_bricks
/fill ~5 ~0 ~5 ~25 ~20 ~25 minecraft:air
/fill ~0 ~16 ~0 ~30 ~20 ~30 minecraft:stone_brick_wall
/setblock ~15 ~1 ~0 minecraft:iron_door`,
    solution: "A mighty castle ready to defend against any threat!"
  }
];

export default function MinecraftEditor({ 
  courseId, 
  courseTitle, 
  courseDescription, 
  difficulty, 
  category,
  editProject
}: MinecraftEditorProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);
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
      console.log("Minecraft Editor - Loading existing project:", editProject);
      setProjectTitle(editProject.title || "");
      if (editProject.codeContent) {
        try {
          const projectData = JSON.parse(editProject.codeContent);
          if (projectData.code) setUserCode(projectData.code);
        } catch (e) {
          // Code content might not be JSON
        }
      }
      setIsEditMode(true);
      toast.success("Project loaded for editing");
    }
  }, [editProject]);

  const challenge = minecraftChallenges[currentChallenge];

  const handleSaveProject = async () => {
    console.log("=== MINECRAFT SAVE PROJECT DEBUG START ===");
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
      console.log("Attempting to save Minecraft project with:", {
        title: projectTitle,
        courseId: courseId,
        challenge: challenge.title,
        currentUser: currentUser
      });

      const projectData = {
        challenge: challenge.title,
        code: userCode || challenge.code,
        completed: completedChallenges.length,
        totalChallenges: minecraftChallenges.length
      };
      
      const projectUrl = `data:text/plain,${encodeURIComponent(JSON.stringify(projectData, null, 2))}`;
      
      console.log("Calling saveProject mutation...");
      
      let result;
      const codeContent = JSON.stringify(projectData);
      
      // If editing an existing project, use updateProject
      if (isEditMode && editProject) {
        console.log("Updating existing project:", editProject._id);
        result = await updateProject({
          projectId: editProject._id,
          title: projectTitle,
          projectUrl: projectUrl,
          codeContent: codeContent,
        });
        console.log("Minecraft project updated successfully:", result);
        toast.success("Minecraft project updated successfully! 🎉");
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
            language: "minecraft"
          });
          console.log("Minecraft project saved successfully with custom auth:", result);
        } else {
          console.log("Using Convex auth");
          result = await saveProject({
            title: projectTitle,
            courseId: courseId as Id<"courses">,
            projectUrl: projectUrl,
            codeContent: codeContent,
            language: "minecraft"
          });
          console.log("Minecraft project saved successfully with Convex auth:", result);
        }
        toast.success("Minecraft project saved successfully! 🎉");
        setProjectTitle("");
      }
      console.log("=== MINECRAFT SAVE PROJECT DEBUG END (SUCCESS) ===");
      
    } catch (error) {
      console.log("=== MINECRAFT SAVE PROJECT DEBUG END (ERROR) ===");
      console.error("Error saving Minecraft project:", error);
      
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

  const completeChallenge = () => {
    if (!completedChallenges.includes(challenge.id)) {
      setCompletedChallenges([...completedChallenges, challenge.id]);
      toast.success(`🎉 Challenge "${challenge.title}" completed!`);
    }
  };

  const nextChallenge = () => {
    if (currentChallenge < minecraftChallenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1);
      setUserCode("");
    } else {
      toast.success("🏆 Congratulations! You've completed all Minecraft challenges!");
    }
  };

  const openMinecraft = () => {
    toast.info("💡 Copy the commands and paste them in your Minecraft world!");
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
                  <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded-full">{difficulty}</span>
                  <span className="text-sm text-gray-400">{category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={openMinecraft}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Open Minecraft
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
          <div className="flex space-x-4 items-center">
            <Input
              placeholder="Enter your Minecraft project title..."
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <div className="text-sm text-gray-400">
              Challenge {currentChallenge + 1} of {minecraftChallenges.length} | 
              Completed: {completedChallenges.length}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Challenge Panel */}
          <div className="w-1/3 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Puzzle className="w-5 h-5 mr-2 text-green-400" />
                {challenge.title}
              </h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  challenge.difficulty === 'Easy' ? 'bg-green-600 text-green-100' :
                  challenge.difficulty === 'Medium' ? 'bg-yellow-600 text-yellow-100' :
                  'bg-red-600 text-red-100'
                }`}>
                  {challenge.difficulty}
                </span>
                {completedChallenges.includes(challenge.id) && (
                  <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded-full flex items-center">
                    <Trophy className="w-3 h-3 mr-1" />
                    Completed
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-4 flex-1">
              <p className="text-gray-300 mb-4">{challenge.description}</p>
              
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white mb-2">Expected Result:</h3>
                <p className="text-sm text-green-400">{challenge.solution}</p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={completeChallenge}
                  disabled={completedChallenges.includes(challenge.id)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  {completedChallenges.includes(challenge.id) ? "Completed!" : "Mark Complete"}
                </Button>
                
                <Button
                  onClick={nextChallenge}
                  disabled={currentChallenge >= minecraftChallenges.length - 1}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Next Challenge
                </Button>
              </div>
            </div>

            {/* Challenge List */}
            <div className="border-t border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">All Challenges:</h3>
              <div className="space-y-1">
                {minecraftChallenges.map((ch, index) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChallenge(index);
                      setUserCode("");
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs ${
                      index === currentChallenge 
                        ? 'bg-green-600 text-white' 
                        : completedChallenges.includes(ch.id)
                        ? 'bg-purple-600/30 text-purple-300'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {index + 1}. {ch.title}
                    {completedChallenges.includes(ch.id) && " ✓"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-300 flex items-center">
                <Play className="w-4 h-4 mr-2 text-green-400" />
                Minecraft Commands
              </span>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(userCode || challenge.code);
                  toast.success("Commands copied to clipboard!");
                }}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                Copy Commands
              </Button>
            </div>
            
            <div className="flex-1 bg-gray-900">
              <textarea
                value={userCode || challenge.code}
                onChange={(e) => setUserCode(e.target.value)}
                className="w-full h-full resize-none border-0 bg-gray-900 text-green-400 p-4 focus:outline-none font-mono text-sm leading-relaxed"
                placeholder="Modify the Minecraft commands here..."
                style={{
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  tabSize: 2
                }}
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









