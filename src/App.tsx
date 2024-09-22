import { useState } from 'react'
import './App.css'
import LegoBoost from './boost/legoBoost'

function App() {
  const [boost, setBoost] = useState<LegoBoost | null>(null)

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

  return (
    <div>
      {!boost ? (
        <button onClick={handleConnect}>
          Connect to LEGO Boost
        </button>
      ) : (
        <>
          <button onClick={handleDisconnect}>
            Disconnect
          </button>
          <button onClick={handleFlash}>
            Flash LED
          </button>
        </>
      )}
    </div>
  )
}

export default App
