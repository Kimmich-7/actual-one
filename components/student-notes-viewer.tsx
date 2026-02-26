"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Image as ImageIcon } from "lucide-react"

interface StudentNotesViewerProps {
  courseId: string
}

export default function StudentNotesViewer({ courseId }: StudentNotesViewerProps) {
  const [selectedStrand, setSelectedStrand] = useState("")
  const [selectedSubStrand, setSelectedSubStrand] = useState("")
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)

  const strands = useQuery(api.courseNotes.getStrandsByCourse, { courseId: courseId as Id<"courses"> })
  const subStrands = useQuery(
    api.courseNotes.getSubStrandsByStrand,
    selectedStrand ? { courseId: courseId as Id<"courses">, strand: selectedStrand } : "skip"
  )
  const notes = useQuery(
    api.courseNotes.getNotesByStrand,
    selectedStrand && selectedSubStrand 
      ? { courseId: courseId as Id<"courses">, strand: selectedStrand, subStrand: selectedSubStrand }
      : "skip"
  )

  const handleStrandChange = (value: string) => {
    setSelectedStrand(value)
    setSelectedSubStrand("")
  }

  const handleViewNote = (note: any) => {
    setSelectedNote(note)
    setShowNoteDialog(true)
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Notes
          </CardTitle>
          <CardDescription>Select a topic to view study materials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Strand/Topic</label>
            <Select value={selectedStrand} onValueChange={handleStrandChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a strand or topic" />
              </SelectTrigger>
              <SelectContent>
                {strands?.map((strand) => (
                  <SelectItem key={strand} value={strand}>{strand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStrand && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Sub-Strand/Sub-Topic</label>
              <Select value={selectedSubStrand} onValueChange={setSelectedSubStrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sub-strand or sub-topic" />
                </SelectTrigger>
                <SelectContent>
                  {subStrands?.map((subStrand) => (
                    <SelectItem key={subStrand} value={subStrand}>{subStrand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {notes && notes.length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="text-sm font-semibold text-gray-700">Available Notes:</h3>
              {notes.map((note) => (
                <div 
                  key={note._id} 
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewNote(note)}
                >
                  <h4 className="font-semibold text-gray-800">{note.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{note.content.substring(0, 100)}...</p>
                  {note.images && note.images.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {note.images.length} image(s)
                    </p>
                  )}
                  <Button variant="link" className="p-0 h-auto text-sm mt-2">
                    Read more →
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedStrand && selectedSubStrand && (!notes || notes.length === 0) && (
            <p className="text-gray-500 text-center py-8 text-sm">No notes available for this topic yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Note Detail Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedNote?.title}</DialogTitle>
            <DialogDescription>
              {selectedNote?.strand} → {selectedNote?.subStrand}
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4 mt-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{selectedNote.content}</div>
              </div>
              {selectedNote.images && selectedNote.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">Images:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedNote.images.map((imageId: Id<"_storage">, index: number) => (
                      <NoteImage key={index} storageId={imageId} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NoteImage({ storageId }: { storageId: Id<"_storage"> }) {
  const imageUrl = useQuery(api.courseNotes.getImageUrl, { storageId })
  
  if (!imageUrl) {
    return <div className="w-full h-40 bg-gray-100 rounded animate-pulse" />
  }
  
  return (
    <img 
      src={imageUrl} 
      alt="Note image" 
      className="w-full h-auto rounded border border-gray-200"
    />
  )
}
