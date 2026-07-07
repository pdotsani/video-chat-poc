'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

type SignalPayload =
  | { type: 'offer'; sdp: string; from: string }
  | { type: 'answer'; sdp: string; from: string }
  | { type: 'ice'; candidate: RTCIceCandidateInit; from: string }
  | { type: 'leave'; from: string }

export type CallState = 'waiting' | 'connecting' | 'connected' | 'ended'

export function useWebRTC(roomId: string, userId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [callState, setCallState] = useState<CallState>('waiting')

  // Expose PC so VideoRoom can call replaceTrack
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    if (!roomId || !userId) return
    let mounted = true

    const supabase = createClient()
    let pc: RTCPeerConnection | null = null
    let localStream: MediaStream | null = null
    let hasCreatedOffer = false
    const pendingCandidates: RTCIceCandidateInit[] = []

    async function createAndSendOffer() {
      if (!pc || !channelRef.current) return
      setCallState('connecting')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'offer', sdp: offer.sdp!, from: userId },
      })
    }

    async function init() {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (!mounted) { localStream.getTracks().forEach(t => t.stop()); return }
      setLocalStream(localStream)

      const remoteMediaStream = new MediaStream()

      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pcRef.current = pc

      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach(t => remoteMediaStream.addTrack(t))
        setRemoteStream(new MediaStream(remoteMediaStream.getTracks()))
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'ice', candidate: e.candidate.toJSON(), from: userId },
          })
        }
      }

      pc.onconnectionstatechange = () => {
        if (!mounted) return
        if (pc?.connectionState === 'connected') setCallState('connected')
        if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed') setCallState('ended')
      }

      localStream.getTracks().forEach(t => pc!.addTrack(t, localStream!))

      const channel = supabase.channel(`video:${roomId}`, {
        config: {
          broadcast: { ack: false, self: false },
          presence: { key: userId },
        },
      })
      channelRef.current = channel

      channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (!mounted || !pc) return
        const sig = payload as SignalPayload
        if (sig.from === userId) return

        if (sig.type === 'offer') {
          setCallState('connecting')
          await pc.setRemoteDescription({ type: 'offer', sdp: sig.sdp })
          for (const c of pendingCandidates) await pc.addIceCandidate(new RTCIceCandidate(c))
          pendingCandidates.length = 0
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', sdp: answer.sdp!, from: userId },
          })
        }

        if (sig.type === 'answer') {
          await pc.setRemoteDescription({ type: 'answer', sdp: sig.sdp })
          for (const c of pendingCandidates) await pc.addIceCandidate(new RTCIceCandidate(c))
          pendingCandidates.length = 0
        }

        if (sig.type === 'ice') {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(sig.candidate))
          } else {
            pendingCandidates.push(sig.candidate)
          }
        }

        if (sig.type === 'leave') setCallState('ended')
      })

      // Deterministic role: user with lexicographically larger ID creates the offer
      channel.on('presence', { event: 'sync' }, () => {
        if (!mounted) return
        const keys = Object.keys(channel.presenceState()).sort()
        if (keys.length === 2 && !hasCreatedOffer) {
          if (keys[1] === userId) {
            hasCreatedOffer = true
            createAndSendOffer()
          }
        }
      })

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && mounted) {
          await channel.track({ userId, joinedAt: Date.now() })
        }
      })
    }

    init().catch(console.error)

    return () => {
      mounted = false
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'leave', from: userId },
      })
      pc?.close()
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      localStream?.getTracks().forEach(t => t.stop())
    }
  }, [roomId, userId])

  const replaceVideoTrack = async (track: MediaStreamTrack) => {
    const pc = pcRef.current
    if (!pc) return
    const sender = pc.getSenders().find(s => s.track?.kind === 'video')
    if (sender) await sender.replaceTrack(track)
  }

  return { localStream, remoteStream, callState, replaceVideoTrack }
}
