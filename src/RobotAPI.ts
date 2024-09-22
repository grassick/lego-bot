import Peer from "peerjs"
import LegoBoost from './boost/legoBoost'
import { CodeRunner } from "./CodeRunner"
import { Face } from "./Face"

/** Interface for an API to the entire robot, including Face, Lego, speech */
export interface RobotAPI {
  /**
   * Stop engines A and B
   * @method LegoBoost#stop
   * @returns {Promise}
   */
  stop(): Promise<void>

  ledAsync(color: string | null): Promise<void>

  /**
   * Turn a motor by specific angle
   * @method LegoBoost#motorAngleAsync
   * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
   * @param {number} angle - degrees to turn from `0` to `2147483647`
   * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given
   * rotation is counterclockwise.
   * @param {boolean} [wait=false] will promise wait unitll motorAngle has turned
   * @returns {Promise}
   */
  motorAngleAsync(port: string, angle: number, dutyCycle: number, wait: boolean): Promise<void>

  /**
   * Run a motor for specific time
   * @method LegoBoost#motorTimeAsync
   * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
   * @param {number} seconds
   * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
   * is counterclockwise.
   * @param {boolean} [wait=false] will promise wait unitll motorTime run time has elapsed
   * @returns {Promise}
   */
  motorTimeAsync(port: string, seconds: number, dutyCycle: number, wait: boolean): Promise<void>

  motorPowerCommand(port: string, power: number): Promise<void>

  /** Say the given text */
  say(text: string): Promise<void>

  /** Run the specified program */
  run(code: string): Promise<void>

  /** Print the text */
  print(text: string): Promise<void>

  /** Ask with prompt */
  ask(prompt: string): Promise<null | string>

  /** Gets the tilt of the block */
  getTilt(): Promise<{ roll: number, pitch: number }>
}

export class RobotAPIImpl implements RobotAPI {
  legoBoost: LegoBoost
  face: Face | undefined

  constructor(legoBoost: LegoBoost, face?: Face) {
    this.legoBoost = legoBoost    
    this.face = face
  }

  async stop() { 
    await this.legoBoost.stop() 
  }

  async ledAsync(color: string) {
    await this.legoBoost.ledAsync(color)
  }

  async motorAngleAsync(port: string, angle: number, dutyCycle: number, wait: boolean) {
    console.log(`motorAngleAsync(${port}, ${angle}, ${dutyCycle}, ${wait})`)
    if (wait) {
      await this.legoBoost.motorAngleAsync(port, angle, dutyCycle, true)
    }
    else {
      this.legoBoost.motorAngle(port, angle, dutyCycle)
    }
  }

  async motorTimeAsync(port: string, seconds: number, dutyCycle: number, wait: boolean) {
    console.log(`motorTimeAsync(${port}, ${seconds}, ${dutyCycle}, ${wait})`)
    if (wait) {
      await this.legoBoost.motorTimeAsync(port, seconds, dutyCycle, true)
    }
    else {
      this.legoBoost.motorTime(port, seconds, dutyCycle)
    }
  }

  async motorPowerCommand(port: string, power: number) {
    return this.legoBoost.motorPowerCommand(port, power)
  }

  async say(text: string) {
    const msg = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(msg)
  }

  async print(text: string) {
    if (!this.face) {
      return
    }

    this.face.print(text)
  }

  async ask(prompt: string) {
    if (!this.face) {
      return null
    }

    return this.face.ask(prompt)
  }

  async run(code: string) {
    await new CodeRunner(code, this).run()
  }

  async getTilt(): Promise<{ roll: number, pitch: number }> {
    return this.legoBoost.deviceInfo.tilt
  }
}

export class PeerRobotAPI implements RobotAPI {
  connection: Peer.DataConnection
  nextCallId: number
  calls: { [id: number]: { resolve: (result: any) => void, reject: (error: any) => void }}

  constructor(connection: Peer.DataConnection) {
    this.connection = connection
    this.nextCallId = 0
    this.calls = {}

    this.connection.on("data", this.handleData)
  }

  handleData = (data: any) => {
    data = JSON.parse(data)
    if (data.type == "response") {
      const call = this.calls[data.callId]
      if (data.error) {
        call.reject(data.error)
      }
      else {
        call.resolve(data.value)
      }
      delete this.calls[data.callId]
    }
  }

  performCall(method: string, args: IArguments): Promise<any> {
    return new Promise((resolve, reject) => {
      const callId = this.nextCallId
      this.nextCallId += 1
      this.calls[callId] = { resolve, reject }

      // Send call
      this.connection.send(JSON.stringify({
        type: "call",
        callId: callId,
        method: method,
        args: Array.from(args)
      }))
    })
  }

  stop(): Promise<void> {
    return this.performCall("stop", arguments)
  }

  ledAsync(color: string): Promise<void> {
    return this.performCall("ledAsync", arguments)
  }

  motorAngleAsync(port: string, angle: number, dutyCycle: number, wait: boolean): Promise<void> {
    return this.performCall("motorAngleAsync", arguments)
  }

  motorTimeAsync(port: string, seconds: number, dutyCycle: number, wait: boolean): Promise<void> {
    return this.performCall("motorTimeAsync", arguments)
  }

  motorPowerCommand(port: string, power: number): Promise<void> {
    return this.performCall("motorPowerCommand", arguments)
  }

  say(text: string) {
    return this.performCall("say", arguments)
  }

  ask(text: string) {
    return this.performCall("ask", arguments)
  }

  run(text: string) {
    return this.performCall("run", arguments)
  }

  print(): Promise<void> {
    return this.performCall("print", arguments)
  }

  getTilt(): Promise<{ roll: number, pitch: number }> {
    return this.performCall("getTilt", arguments)
  }

}

/** Wrapper class that takes calls and forwards them to the underlying object */
export class PeerServer {
  connection: Peer.DataConnection
  wraps: any

  constructor(connection: Peer.DataConnection, wraps: any) {
    this.connection = connection
    this.wraps = wraps
    this.connection.on("data", this.handleData)
  }

  handleData = (data: any) => {
    data = JSON.parse(data)
    if (data.type == "call") {
      console.log(`Call received: ${data.method} (${JSON.stringify(data.args)})`)
      this.wraps[data.method].apply(this.wraps, data.args).then((value: any) => {
        this.connection.send(JSON.stringify({
          type: "response",
          callId: data.callId,
          value: value
        }))
      }).catch((error: any) => {
        this.connection.send(JSON.stringify({
          type: "response",
          callId: data.callId,
          error: error
        }))
      })
    }
  }
}

