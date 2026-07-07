'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useBackgroundBlur } from '@/hooks/useBackgroundBlur'

type Props = {
  roomId: string
  userId: string
  title: string
}

export default function VideoRoom({ roomId, userId, title }: Props) {
  const router = useRouter()
  const { localStream, remoteStream, callState, replaceVideoTrack } = useWebRTC(roomId, userId)
  const { startBlur, stopBlur } = useBackgroundBlur()

  const rawVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blurStreamRef = useRef<MediaStream | null>(null)

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isBlurEnabled, setIsBlurEnabled] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Wire local stream to raw video element
  useEffect(() => {
    if (localStream && rawVideoRef.current) {
      rawVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Wire remote stream to remote video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  function handleMuteToggle() {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMuted(m => !m)
  }

  function handleVideoToggle() {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setIsVideoOff(v => !v)
  }

  async function handleBlurToggle() {
    if (!localStream || !rawVideoRef.current || !canvasRef.current) return

    if (!isBlurEnabled) {
      const blurStream = await startBlur(rawVideoRef.current, canvasRef.current)
      blurStreamRef.current = blurStream
      const blurTrack = blurStream.getVideoTracks()[0]
      if (blurTrack) await replaceVideoTrack(blurTrack)
      setIsBlurEnabled(true)
    } else {
      stopBlur()
      blurStreamRef.current = null
      const rawTrack = localStream.getVideoTracks()[0]
      if (rawTrack) await replaceVideoTrack(rawTrack)
      setIsBlurEnabled(false)
    }
  }

  function handleLeave() {
    stopBlur()
    localStream?.getTracks().forEach(t => t.stop())
    router.push('/dashboard')
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none">
      {/* Remote video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Waiting / ended overlay */}
      {(callState === 'waiting' || callState === 'ended') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
          {callState === 'waiting' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                <UserIcon />
              </div>
              <p className="text-white text-lg font-medium">Waiting for someone to join…</p>
              <p className="text-white/60 text-sm">Share the link to invite someone</p>
            </>
          ) : (
            <>
              <p className="text-white text-lg font-medium">Call ended</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-2 px-5 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Return to Dashboard
              </button>
            </>
          )}
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 px-5 py-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <p className="text-white font-medium truncate max-w-xs">{title}</p>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
        >
          <LinkIcon />
          {linkCopied ? 'Copied!' : 'Copy invite link'}
        </button>
      </div>

      {/* Local PiP — bottom-right corner */}
      <div className="absolute bottom-24 right-4 w-36 h-24 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black">
        {/* Raw video — always playing so canvas can read from it */}
        <video
          ref={rawVideoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${isBlurEnabled ? 'opacity-0' : 'opacity-100'}`}
        />
        {/* Canvas for blur output */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${isBlurEnabled ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Camera-off indicator */}
        {isVideoOff && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <VideoOffIcon className="w-6 h-6 text-white/50" />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-5 flex items-center justify-center gap-4 bg-gradient-to-t from-black/60 to-transparent">
        <ControlButton
          active={isMuted}
          onClick={handleMuteToggle}
          label={isMuted ? 'Unmute' : 'Mute'}
          activeColor="bg-red-500 hover:bg-red-600"
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </ControlButton>

        <ControlButton
          active={isVideoOff}
          onClick={handleVideoToggle}
          label={isVideoOff ? 'Start Video' : 'Stop Video'}
          activeColor="bg-red-500 hover:bg-red-600"
        >
          {isVideoOff ? <VideoOffIcon /> : <VideoIcon />}
        </ControlButton>

        <ControlButton
          active={isBlurEnabled}
          onClick={handleBlurToggle}
          label={isBlurEnabled ? 'Remove Blur' : 'Blur BG'}
          activeColor="bg-blue-500 hover:bg-blue-600"
        >
          <BlurIcon />
        </ControlButton>

        <ControlButton
          active={false}
          onClick={handleLeave}
          label="Leave"
          activeColor=""
          className="bg-red-600 hover:bg-red-700"
        >
          <PhoneDownIcon />
        </ControlButton>
      </div>
    </div>
  )
}

// ─── Control button ────────────────────────────────────────────────────────────

type ControlButtonProps = {
  active: boolean
  onClick: () => void
  label: string
  activeColor: string
  className?: string
  children: React.ReactNode
}

function ControlButton({ active, onClick, label, activeColor, className, children }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center transition-colors text-white
        ${active ? activeColor : className ?? 'bg-white/20 hover:bg-white/30'}`}
    >
      {children}
    </button>
  )
}

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────

function MicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function VideoOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25v-9m12.75 0H9M3 3l18 18" />
    </svg>
  )
}

function BlurIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  )
}

function PhoneDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  )
}
