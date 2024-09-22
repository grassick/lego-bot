import React, { useEffect, useRef, useMemo } from "react"
import { useState } from "react"
import LegoBoost from './boost/legoBoost'
import { RobotAPIImpl, RobotAPI } from "./RobotAPI"
import './Direct.css'
import { Controller } from "./controller"

const boost = new LegoBoost()

export const DirectControl = () => {
  const robotAPI = useMemo<RobotAPI>(() => new RobotAPIImpl(boost), [])
  const [connected, setConnected] = useState(false)

  const connectLego = async () => {
    await boost.connect()
    console.log("Connected")
    setConnected(true)
  }

  return <div className="direct-control-container">
    <div id="header">
      { !connected ?
        <button type="button" className="btn btn-success btn-block" onClick={connectLego}>Connect to Lego</button>
      : 
        <button type="button" className="btn btn-success btn-block" disabled={true}>Connected</button>
      }
    </div>
    <div id="controller">
      { connected ? <Controller robotAPI={robotAPI}/> : null }
    </div>
  </div>
}
