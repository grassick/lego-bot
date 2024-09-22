import { RobotAPI } from "./RobotAPI";
import { useState, useRef, useEffect, useCallback } from "react";
import React from "react";
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

export const Controller = (props: {
  robotAPI: RobotAPI
}) => {
  return <div>
    <div>
      <button type="button" className="btn btn-sm btn-default" style={{ color: "red" }} onClick={() => props.robotAPI.ledAsync("red")}>Red</button>
      <button type="button" className="btn btn-sm btn-default" style={{ color: "green" }} onClick={() => props.robotAPI.ledAsync("green")}>Green</button>
      <button type="button" className="btn btn-sm btn-default" style={{ color: "blue" }} onClick={() => props.robotAPI.ledAsync("blue")}>Blue</button>
      <button type="button" className="btn btn-sm btn-default" style={{ color: "yellow" }} onClick={() => props.robotAPI.ledAsync("yellow")}>Yellow</button>
      <button type="button" className="btn btn-sm btn-default" style={{ color: "orange" }} onClick={() => props.robotAPI.ledAsync("orange")}>Orange</button>
      <button type="button" className="btn btn-sm btn-default" style={{ color: "purple" }} onClick={() => props.robotAPI.ledAsync("purple")}>Purple</button>
      <button type="button" className="btn btn-sm btn-default" style={{ color: "black" }} onClick={() => props.robotAPI.ledAsync("off")}>Off</button>
      <button type="button" className="btn btn-sm btn-default" style={{ color: "white" }} onClick={() => props.robotAPI.ledAsync("white")}>White</button>
    </div>
    <div style={{ padding: 10 }}>
      <XYController robotAPI={props.robotAPI} size={Math.min(window.innerWidth, window.innerHeight) * 0.75 - 20}/>
    </div>
    <br/>
    <SpeedController robotAPI={props.robotAPI} motor="D"/>
  </div>
}

export const XYController = (props: {
  robotAPI: RobotAPI,
  size: number
}) => {
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }
    ctx.clearRect(0, 0, props.size, props.size)

    ctx.beginPath()
    ctx.moveTo(props.size / 2, 0)
    ctx.lineTo(props.size / 2, props.size)
    ctx.strokeStyle = "#8888FF"
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, props.size / 2)
    ctx.lineTo(props.size, props.size / 2)
    ctx.strokeStyle = "#8888FF"
    ctx.stroke()

    ctx.fillStyle = "green"
    ctx.beginPath()
    ctx.arc(props.size / 2 + x * props.size / 2, props.size / 2 + y * props.size / 2, 10, 0, Math.PI * 2)
    ctx.fill()
  }, [x, y])

  // Move robot
  const moveRobot = useCallback((x: number, y: number) => {
    // Determine left and right rates
    const left = Math.min(Math.max(x + y, -1), 1)
    const right = Math.min(Math.max(y - x, -1), 1)
    
    props.robotAPI.motorTimeAsync("A", 10, left * 100, false)
    props.robotAPI.motorTimeAsync("B", 10, right * 100, false)
  }, [props.robotAPI])

  const handleTouchStart = (ev: React.TouchEvent) => {
    let newX = (ev.touches[0].pageX - canvasRef.current!.offsetLeft) / (props.size / 2) - 1
    let newY = (ev.touches[0].pageY - canvasRef.current!.offsetTop) / (props.size / 2) - 1

    if (Math.abs(newX) < 0.15) {
      newX = 0
    }
    if (Math.abs(newY) < 0.15) {
      newY = 0
    }
    setX(newX)
    setY(newY)
    moveRobot(newX, newY)
  }

  const handleClick = (ev: React.MouseEvent) => {
    let newX = (ev.pageX - canvasRef.current!.offsetLeft) / (props.size / 2) - 1
    let newY = (ev.pageY - canvasRef.current!.offsetTop) / (props.size / 2) - 1

    if (Math.abs(newX) < 0.15) {
      newX = 0
    }
    if (Math.abs(newY) < 0.15) {
      newY = 0
    }
    setX(newX)
    setY(newY)
    moveRobot(newX, newY)
  }

  return <div>
    <canvas 
      width={props.size} 
      height={props.size} 
      style={{ 
        position: "relative",
        border: "solid 1px blue"
      }} 
      ref={canvasRef}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      />
  </div>
}

export const AngleController = (props: {
  robotAPI: RobotAPI,
  motor: string
}) => {
  const [currentAngle, setCurrentAngle] = useState(0)
  const [destAngle, setDestAngle] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (busy) {
      return
    }

    if (destAngle == currentAngle) {
      return
    }

    setBusy(true)
    props.robotAPI.motorAngleAsync(props.motor, Math.abs(destAngle - currentAngle), destAngle > currentAngle ? 100 : -100, true).then(() => {
      setCurrentAngle(destAngle)
      setBusy(false)
    }).catch(() => {
      setBusy(false)
    })
  }, [destAngle, busy, currentAngle])

  return <Slider
    min={-180}
    max={180}
    step={1}
    value={destAngle}
    onChange={setDestAngle}/>
}

export const SpeedController = (props: {
  robotAPI: RobotAPI,
  motor: string
}) => {
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (busy) {
      return
    }

    setBusy(true)
      props.robotAPI.motorTimeAsync(props.motor, 10, currentSpeed, false).then(() => {
      setBusy(false)
    }).catch(() => {
      setBusy(false)
    })
  }, [currentSpeed])

  return <Slider
    min={-100}
    max={100}
    step={20}
    marks={{ 0: "stop" }}
    value={currentSpeed}
    onChange={setCurrentSpeed}/>
}
