import './App.css'
import LegoBoost from './boost/legoBoost'
import VideoCapture from "./VideoCapture"
import { useState, useEffect } from 'react'

const checkAndSetApiKey = () => {
  const storedApiKey = localStorage.getItem('geminiFlashApiKey')
  if (!storedApiKey) {
    const apiKey = prompt("Please enter your Gemini Flash API key:")
    if (apiKey) {
      localStorage.setItem('geminiFlashApiKey', apiKey)
    }
  }
}

function App() {
  const [boost, setBoost] = useState<LegoBoost | null>(null)

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

  const handleCapture = (base64Image: string) => {
    console.log("Captured image:", base64Image.substring(0, 50) + "...") // Log the first 50 characters of the base64 string
    // Here you can send the image to a server, store it, or process it further
  }

  return (
    <div className="App">
      <h1>Lego Boost Control</h1>
      <div>
        { !boost && <button onClick={handleConnect}>Connect</button> }
        { boost && <button onClick={handleDisconnect}>Disconnect</button> }
        <button onClick={handleFlash}>Flash LED</button>
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
        captureInterval={5000} // Capture every 5 seconds
        onCapture={handleCapture}
      />
    </div>
  )
}

export default App
