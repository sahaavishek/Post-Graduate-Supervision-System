"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { X } from "lucide-react"

interface ProfilePicturePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  name?: string
  fallback?: string
}

export function ProfilePicturePreview({
  open,
  onOpenChange,
  imageSrc,
  name,
  fallback,
}: ProfilePicturePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Profile Picture Preview</span>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8">
          <Avatar className="h-64 w-64">
            <AvatarImage src={imageSrc} alt={name || "Profile picture"} />
            <AvatarFallback className="text-6xl">
              {fallback || (name ? name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U")}
            </AvatarFallback>
          </Avatar>
          {name && (
            <p className="mt-4 text-lg font-semibold text-foreground">{name}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

