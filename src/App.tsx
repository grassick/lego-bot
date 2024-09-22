import './App.css'
import LegoBoost from './boost/legoBoost'
import VideoCapture from "./VideoCapture"
import { useState, useEffect, useRef, useCallback } from 'react'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { useStableCallback } from './useStableCallback'

const checkAndSetApiKey = () => {
  const storedApiKey = localStorage.getItem('geminiFlashApiKey')
  if (!storedApiKey) {
    const apiKey = prompt("Please enter your Gemini Flash API key:")
    if (apiKey) {
      localStorage.setItem('geminiFlashApiKey', apiKey)
    }
  }
}

interface RobotAction {
  action: "speak" | "move forward" | "move backward" | "turn left" | "turn right"
  message?: string
}


function App() {
  const [boost, setBoost] = useState<LegoBoost | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [imageDescription, setImageDescription] = useState<string | null>(null)
  const [pastActions, setPastActions] = useState<RobotAction[]>([])

  useEffect(() => {
    checkAndSetApiKey()
  }, [])

  const handleConnect = async () => {
    const newBoost = new LegoBoost()
    await newBoost.connect()
    setBoost(newBoost)
  }

  const handleDisconnect = async () => {
    if (boost) {
      await boost.disconnect()
      setBoost(null)
    }
  }

  const handleFlash = async () => {
    if (boost) {
      await boost.ledAsync('red')
      await new Promise(resolve => setTimeout(resolve, 500))
      await boost.ledAsync('green')
      await new Promise(resolve => setTimeout(resolve, 500))
      await boost.ledAsync('blue')
    }
  }

  const handleMoveForward = async () => {
    if (boost) {
      await boost.motorTimeMultiAsync(1, 50, 50)
    }
  }

  const handleMoveBack = async () => {
    if (boost) {
      await boost.motorTimeMultiAsync(1, -50, -50)
    }
  }

  const handleTurnLeft = async () => {
    if (boost) {
      await boost.motorTimeMultiAsync(1, -50, 50)
    }
  }

  const handleTurnRight = async () => {
    if (boost) {
      await boost.motorTimeMultiAsync(1, 50, -50)
    }
  }

  const handleCapture = useStableCallback((base64Image: string) => {
    console.log("Captured image:", base64Image.substring(0, 50) + "...")
    setCapturedImage(base64Image)
    // handleDescribeImage()
  })

  const handleDescribeImage = async () => {
    if (!capturedImage) {
      alert("No image captured.")
      return
    }

    try {
      const genAI = new GoogleGenerativeAI(localStorage.getItem('geminiFlashApiKey') || "")
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.5
        }
      })
      const result = await model.generateContent([
        {
          inlineData: {
            data: capturedImage.split(',')[1],
            mimeType: "image/jpeg"
          },
        },
        {
          text: `
          You are a friendly pet robot. The image above is your camera view. Decide what action to take based on the image.
          You can do any of the following actions: speak, move forward, move backward, turn left, turn right.

          Your recent actions: ${JSON.stringify(pastActions.slice(-10))}

          Don't repeat actions, unless the situation has changed.

          Output action in JSON format as follows:

          { 
            action: "speak" | "move forward" | "move backward" | "turn left" | "turn right", 
            thought: "reasoning for the action",
            speech: "message to say" (for speak action) 
          }
          `
        },
      ])
      setImageDescription(result.response.text())
      setPastActions([...pastActions, JSON.parse(result.response.text())])
      // const decidedAction = result.response.text().trim().toLowerCase()
      // setAction(null)
      // for (const action of ["stop", "turn left", "turn right", "go forward", "go backward"]) {
      //   if (decidedAction.includes(action)) {
      //     setAction(action)
      //     break
      //   }
      // }
    } catch (error) {
      console.error("Error deciding action:", error)
      alert("Failed to decide on an action.")
    }
  }

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     if (capturedImage) {
  //       handleDescribeImage()
  //     }
  //   }, 2000)

  //   return () => clearInterval(intervalId)
  // }, [capturedImage])

  return (
    <div className="App">
      <h1>Lego Boost Control</h1>
      <div>
        {!boost && <button onClick={handleConnect}>Connect</button>}
        {boost && <button onClick={handleDisconnect}>Disconnect</button>}
        <button onClick={handleFlash}>Flash LED</button>
        <button onClick={handleDescribeImage}>Describe Image</button>
      </div>
      {boost && (
        <div>
          <button onClick={handleMoveForward}>Forward</button>
          <button onClick={handleMoveBack}>Back</button>
          <button onClick={handleTurnLeft}>Turn Left</button>
          <button onClick={handleTurnRight}>Turn Right</button>
        </div>
      )}
      <VideoCapture
        captureInterval={1000} // Capture every 1 second
        onCapture={handleCapture}
      />
      {imageDescription && (
        <div>
          <h2>Image Description</h2>
          <p>{imageDescription}</p>
        </div>
      )}
      {/* {action && (
        <div>
          <h2>Decided Action</h2>
          <p>{action}</p>
        </div>
      )} */}
    </div>
  )
}

export default App
