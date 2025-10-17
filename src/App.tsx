import { useCallback, useRef, useState } from 'react'
import './index.css'
import CameraFeed from './components/CameraFeed'
import MonkeyDisplay from './components/MonkeyDisplay'
import ExpressionAnalyzer from './components/ExpressionAnalyzer'

export default function App() {
  const [monkeyPath, setMonkeyPath] = useState('/monkeys/neutral_expression.png')
  const [label, setLabel] = useState('Detecting…')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)

  const handleStreamReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video
    setVideoEl(video)
  }, [])

  const handleMonkeyChange = useCallback((path: string, lbl: string) => {
    setMonkeyPath(path)
    setLabel(lbl)
  }, [])

  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">🐒 monkeyview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-xl aspect-video bg-black rounded-lg overflow-hidden">
            <CameraFeed onStreamReady={handleStreamReady} />
          </div>
        </div>
        <MonkeyDisplay imagePath={monkeyPath} label={label} />
      </div>
      <ExpressionAnalyzer videoEl={videoEl} onMonkeyChange={handleMonkeyChange} />
    </div>
  )
}
