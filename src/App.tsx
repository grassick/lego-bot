import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LegoBoost from './boost/legoBoost'

function App() {
  const [connected, setConnected] = useState(false)

  const handleConnectAndFlash = async () => {
    const boost = new LegoBoost()
    await boost.connect()
    setConnected(true)
    await boost.ledAsync('red')
    await new Promise(resolve => setTimeout(resolve, 500))
    await boost.ledAsync('green')
    await new Promise(resolve => setTimeout(resolve, 500))
    await boost.ledAsync('blue')
  }

  return (
    <button onClick={handleConnectAndFlash}>
      { connected ? 'Connected' : 'Connect to LEGO Boost' }
    </button>
  )
}

export default App
