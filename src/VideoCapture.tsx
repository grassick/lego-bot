import { useRef, useEffect } from "react"

interface VideoCaptureProps {
  captureInterval: number // Interval in milliseconds
  onCapture: (base64Image: string) => void
}

function VideoCapture({ captureInterval, onCapture }: VideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    startCamera()
    const intervalId = setInterval(captureImage, captureInterval)

    return () => {
      stopCamera()
      clearInterval(intervalId)
    }
  }, [captureInterval])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext("2d")?.drawImage(video, 0, 0)

      const base64Image = canvas.toDataURL("image/jpeg", 0.8) // Compress as JPEG with 80% quality
      onCapture(base64Image)
    }
  }

  return (
    <div>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ width: "100%", maxHeight: "80vh" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  )
}

export default VideoCapture