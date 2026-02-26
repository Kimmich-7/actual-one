




"use client"

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, ArrowLeft, Play, Eye, Code, BookOpen } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import CourseQuiz from "./course-quiz";

interface AcodeEditorProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  language: "html" | "css" | "javascript" | "python";
  difficulty: string;
  category: string;
}

export default function AcodeEditor({ 
  courseId, 
  courseTitle, 
  courseDescription, 
  language, 
  difficulty, 
  category 
}: AcodeEditorProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [code, setCode] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  const [viewingQuiz, setViewingQuiz] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const saveProject = useMutation(api.projects.submitProject);
  const saveProjectCustomAuth = useMutation(api.projects.submitProjectWithCustomAuth);
  
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

  // Set default code based on language
  useEffect(() => {
    const defaultCode = getDefaultCode(language);
    setCode(defaultCode);
  }, [language]);

  const getDefaultCode = (lang: string) => {
    switch (lang) {
      case "html":
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My HTML Project</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            text-align: center;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        p {
            font-size: 1.2em;
            line-height: 1.6;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to HTML!</h1>
        <p>Start coding here and watch your creation come to life!</p>
        <p>Edit this code to create something amazing.</p>
    </div>
</body>
</html>`;
      case "css":
        return `/* Modern CSS Styles */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
    min-height: 100vh;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    transform: translateY(0);
    transition: transform 0.3s ease;
}

.container:hover {
    transform: translateY(-5px);
}

h1 {
    color: #2d3436;
    text-align: center;
    font-size: 2.5em;
    margin-bottom: 30px;
    background: linear-gradient(45deg, #74b9ff, #0984e3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

p {
    color: #636e72;
    font-size: 1.1em;
    line-height: 1.8;
    text-align: center;
}

.button {
    display: inline-block;
    padding: 12px 30px;
    background: linear-gradient(45deg, #74b9ff, #0984e3);
    color: white;
    text-decoration: none;
    border-radius: 25px;
    margin: 20px auto;
    display: block;
    width: fit-content;
    transition: all 0.3s ease;
}

.button:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 20px rgba(116, 185, 255, 0.3);
}

/* Add your custom styles here */`;
      case "javascript":
        return `// JavaScript Code - Interactive Programming
console.log("🚀 Welcome to JavaScript!");

// Function to create interactive elements
function createInteractiveDemo() {
    // Create a greeting function
    function greetUser(name) {
        return \`Hello, \${name}! Welcome to JavaScript programming! 🎉\`;
    }
    
    // Array of programming concepts
    const concepts = [
        "Variables and Data Types",
        "Functions and Scope",
        "Arrays and Objects",
        "DOM Manipulation",
        "Event Handling"
    ];
    
    // Display greeting
    const userName = "Student";
    console.log(greetUser(userName));
    
    // Show programming concepts
    console.log("\\n📚 JavaScript Concepts to Learn:");
    concepts.forEach((concept, index) => {
        console.log(\`\${index + 1}. \${concept}\`);
    });
    
    // Interactive calculation
    const numbers = [1, 2, 3, 4, 5];
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    console.log(\`\\n🔢 Sum of numbers [1,2,3,4,5]: \${sum}\`);
    
    // Current date and time
    const now = new Date();
    console.log(\`\\n⏰ Current time: \${now.toLocaleString()}\`);
}

// Run the demo
createInteractiveDemo();

// Add your JavaScript code here...
// Try creating functions, working with arrays, or manipulating the DOM!`;
      case "python":
        return `# Python Programming - Getting Started
print("🐍 Welcome to Python Programming!")

# Function to demonstrate Python basics
def python_demo():
    # Variables and data types
    name = "Student"
    age = 15
    is_learning = True
    
    # String formatting
    greeting = f"Hello {name}! You are {age} years old."
    print(greeting)
    
    # Lists and loops
    subjects = ["Math", "Science", "Programming", "Art", "Music"]
    print("\\n📚 Your subjects:")
    for i, subject in enumerate(subjects, 1):
        print(f"{i}. {subject}")
    
    # Dictionary example
    student_info = {
        "name": name,
        "age": age,
        "grade": "A+",
        "favorite_subject": "Programming"
    }
    
    print(f"\\n👨‍🎓 Student Info:")
    for key, value in student_info.items():
        print(f"{key.title()}: {value}")
    
    # Simple calculation
    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    total = sum(numbers)
    average = total / len(numbers)
    
    print(f"\\n🔢 Numbers: {numbers}")
    print(f"Sum: {total}")
    print(f"Average: {average}")
    
    # Conditional statement
    if average > 5:
        print("✅ The average is greater than 5!")
    else:
        print("❌ The average is 5 or less.")

# Run the demo
python_demo()

# Add your Python code here...
# Try creating functions, working with lists, or solving problems!`;
      default:
        return "";
    }
  };

  const handleSaveProject = async () => {
    console.log("=== ACODE SAVE PROJECT DEBUG START ===");
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

    if (!code.trim()) {
      console.log("ERROR: No code provided");
      toast.error("Please write some code before saving");
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
      console.log("Attempting to save ACode project with:", {
        title: projectTitle,
        courseId: courseId,
        language: language,
        currentUser: currentUser
      });

      // Create appropriate project content based on language
      let projectContent = code;
      if (language === "css") {
        projectContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>
    <style>
${code}
    </style>
</head>
<body>
    <div class="container">
        <h1>CSS Project: ${projectTitle}</h1>
        <p>This is a sample content to showcase your CSS styles.</p>
        <a href="#" class="button">Sample Button</a>
    </div>
</body>
</html>`;
      } else if (language === "javascript") {
        projectContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        #output { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>JavaScript Project: ${projectTitle}</h1>
        <div id="output"></div>
    </div>
    <script>
${code}
    </script>
</body>
</html>`;
      }

      // Create a blob URL for the project
      const blob = new Blob([projectContent], { type: 'text/html' });
      const projectUrl = URL.createObjectURL(blob);

      console.log("Calling saveProject mutation...");
      
      let result;
      // Try custom auth first (for localStorage-based authentication)
      if (currentUser?.username) {
        console.log("Using custom auth with username:", currentUser.username);
        result = await saveProjectCustomAuth({
          username: currentUser.username,
          title: projectTitle,
          courseId: courseId as Id<"courses">,
          projectUrl: projectUrl,
          codeContent: code,
          language: language
        });
        console.log("ACode project saved successfully with custom auth:", result);
      } else {
        console.log("Using Convex auth");
        result = await saveProject({
          title: projectTitle,
          courseId: courseId as Id<"courses">,
          projectUrl: projectUrl,
          codeContent: code,
          language: language
        });
        console.log("ACode project saved successfully with Convex auth:", result);
      }

      console.log("ACode project saved successfully:", result);
      toast.success("Project saved successfully! 🎉");
      setProjectTitle("");
      console.log("=== ACODE SAVE PROJECT DEBUG END (SUCCESS) ===");
      
    } catch (error) {
      console.log("=== ACODE SAVE PROJECT DEBUG END (ERROR) ===");
      console.error("Error saving ACode project:", error);
      
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

  const renderPreview = () => {
    if (language === "html") {
      return (
        <iframe
          srcDoc={code}
          className="w-full h-full border-0"
          title="HTML Preview"
        />
      );
    } else if (language === "css") {
      const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Preview</title>
    <style>
${code}
    </style>
</head>
<body>
    <div class="container">
        <h1>CSS Preview</h1>
        <p>This is a sample content to showcase your CSS styles.</p>
        <a href="#" class="button">Sample Button</a>
    </div>
</body>
</html>`;
      return (
        <iframe
          srcDoc={previewHtml}
          className="w-full h-full border-0"
          title="CSS Preview"
        />
      );
    } else if (language === "javascript") {
      const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        #output { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #007bff; min-height: 100px; }
        .log-entry { padding: 5px 0; border-bottom: 1px solid #eee; font-family: monospace; }
        .log-entry:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>JavaScript Output</h1>
        <div id="output"></div>
    </div>
    <script>
      // Capture console.log output
      const originalLog = console.log;
      const outputDiv = document.getElementById('output');
      
      console.log = function(...args) {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.textContent = args.join(' ');
        outputDiv.appendChild(div);
        originalLog.apply(console, args);
      };
      
      try {
${code}
      } catch (error) {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.style.color = 'red';
        div.textContent = 'Error: ' + error.message;
        outputDiv.appendChild(div);
      }
    </script>
</body>
</html>`;
      return (
        <iframe
          srcDoc={previewHtml}
          className="w-full h-full border-0"
          title="JavaScript Preview"
        />
      );
    } else if (language === "python") {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-8">
          <div className="text-center">
            <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Python Code Editor</h3>
            <p className="text-gray-600 mb-4">
              Your Python code is ready! In a real environment, this would run on a Python server.
            </p>
            <div className="bg-white p-4 rounded-lg shadow-sm border max-w-md">
              <p className="text-sm text-gray-500 mb-2">Code Preview:</p>
              <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                {code.substring(0, 200)}...
              </pre>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Preview not available for {language}</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{courseTitle}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{difficulty}</span>
                  <span className="text-sm text-gray-500">{category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center space-x-2"
              >
                {isPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{isPreview ? "Code" : "Preview"}</span>
              </Button>
              <Button
                onClick={() => setViewingQuiz(!viewingQuiz)}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:text-white hover:bg-blue-700"
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
                {isSaving ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Project Title Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter your project title..."
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Editor and Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
          {/* Code Editor */}
          <Card className={`${isPreview ? 'hidden lg:block' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Code Editor ({language.toUpperCase()})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              <div className="relative h-full">
                <textarea
                  ref={editorRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full resize-none border-0 rounded-none font-mono text-sm p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-green-400"
                  placeholder={`Start coding in ${language.toUpperCase()}...`}
                  style={{
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    tabSize: 2
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className={`${!isPreview ? 'hidden lg:block' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              {renderPreview()}
            </CardContent>
          </Card>
        </div>

        {/* Course Description */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About This Course</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{courseDescription}</p>
          </CardContent>
        </Card>
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
    </div>
  );
}




