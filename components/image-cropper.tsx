"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, RotateCw, X } from "lucide-react"
import "react-easy-crop/react-easy-crop.css"

interface ImageCropperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  aspectRatio?: number
}

type Area = {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation)
  }, [])

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", (error) => reject(error))
      image.src = url
    })

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180
  }

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation)
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
  }

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
  ): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    const rotRad = getRadianAngle(rotation)

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    )

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)

    // draw rotated image
    ctx.drawImage(image, 0, 0)

    const croppedCanvas = document.createElement("canvas")
    const croppedCtx = croppedCanvas.getContext("2d")

    if (!croppedCtx) {
      throw new Error("No 2d context")
    }

    // Set the size of the cropped canvas
    croppedCanvas.width = pixelCrop.width
    croppedCanvas.height = pixelCrop.height

    // Draw the cropped image onto the new canvas
    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    // As a blob
    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Canvas is empty"))
        }
      }, "image/jpeg", 0.95)
    })
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      return
    }

    setIsProcessing(true)
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      )
      onCropComplete(croppedImageBlob)
      // Reset state
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setCroppedAreaPixels(null)
      onOpenChange(false)
    } catch (error) {
      console.error("Error cropping image:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crop and Adjust Your Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onRotationChange={onRotationChange}
              onCropComplete={onCropCompleteCallback}
              cropShape="round"
              showGrid={true}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Zoom</label>
                </div>
                <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => onZoomChange(value[0])}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Rotation</label>
                </div>
                <span className="text-sm text-muted-foreground">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={(value) => onRotationChange(value[0])}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing || !croppedAreaPixels}>
            {isProcessing ? "Processing..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

