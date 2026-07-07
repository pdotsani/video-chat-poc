'use client'

import { useEffect, useRef, useState } from 'react'

// MediaPipe SelfieSegmentation loaded from CDN — no npm package needed
declare global {
  interface Window {
    SelfieSegmentation: new (config: { locateFile: (file: string) => string }) => {
      setOptions(opts: { modelSelection: number }): void
      onResults(cb: (r: {
        image: HTMLVideoElement
        segmentationMask: HTMLCanvasElement
      }) => void): void
      send(input: { image: HTMLVideoElement }): Promise<void>
      initialize(): Promise<void>
    }
  }
}

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation'

async function loadMediaPipeScript(): Promise<void> {
  if (typeof window === 'undefined') return
  if (document.querySelector('[data-mediapipe-ss]')) return

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${CDN}/selfie_segmentation.js`
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-mediapipe-ss', 'true')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load MediaPipe SelfieSegmentation'))
    document.head.appendChild(script)
  })
}

export function useBackgroundBlur() {
  const segmenterRef = useRef<InstanceType<Window['SelfieSegmentation']> | null>(null)
  const animFrameRef = useRef<number>(0)
  const [isReady, setIsReady] = useState(false)
  const loadingRef = useRef(false)

  useEffect(() => () => { cancelAnimationFrame(animFrameRef.current) }, [])

  async function ensureSegmenter() {
    if (segmenterRef.current) return
    if (loadingRef.current) return
    loadingRef.current = true

    await loadMediaPipeScript()

    const ss = new window.SelfieSegmentation({
      locateFile: (file) => `${CDN}/${file}`,
    })
    ss.setOptions({ modelSelection: 1 })
    await ss.initialize()
    segmenterRef.current = ss
    setIsReady(true)
  }

  async function startBlur(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement,
  ): Promise<MediaStream> {
    await ensureSegmenter()

    const seg = segmenterRef.current!
    const ctx = canvasEl.getContext('2d')!

    // Match canvas dimensions to video
    const syncSize = () => {
      if (videoEl.videoWidth > 0) {
        canvasEl.width = videoEl.videoWidth
        canvasEl.height = videoEl.videoHeight
      }
    }
    syncSize()

    seg.onResults((results) => {
      const { width, height } = canvasEl
      ctx.save()
      ctx.clearRect(0, 0, width, height)

      // 1. Draw the sharp frame
      ctx.drawImage(results.image, 0, 0, width, height)
      // 2. Mask: keep only person pixels
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(results.segmentationMask, 0, 0, width, height)
      // 3. Draw blurred background behind the person
      ctx.globalCompositeOperation = 'destination-over'
      ctx.filter = 'blur(15px)'
      ctx.drawImage(results.image, 0, 0, width, height)
      ctx.filter = 'none'
      ctx.globalCompositeOperation = 'source-over'

      ctx.restore()
    })

    const tick = () => {
      syncSize()
      if (videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        seg.send({ image: videoEl }).then(() => {
          animFrameRef.current = requestAnimationFrame(tick)
        })
      } else {
        animFrameRef.current = requestAnimationFrame(tick)
      }
    }
    animFrameRef.current = requestAnimationFrame(tick)

    return canvasEl.captureStream(30)
  }

  function stopBlur() {
    cancelAnimationFrame(animFrameRef.current)
  }

  return { startBlur, stopBlur, isReady }
}
