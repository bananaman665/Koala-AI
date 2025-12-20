import { useRef, useCallback, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { VoiceRecorder } from 'capacitor-voice-recorder'

/**
 * Simple audio capture hook - completely separate from transcription.
 * Just records audio and returns a blob when stopped.
 */
export function useAudioCapture() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isCapturingRef = useRef(false)
  
  const isNative = Capacitor.isNativePlatform()

  const startCapture = useCallback(async () => {
    if (!isNative) {
      console.log('[AudioCapture] Not on native platform, skipping')
      return
    }

    if (isCapturingRef.current) {
      console.log('[AudioCapture] Already capturing')
      return
    }

    try {
      setError(null)
      console.log('[AudioCapture] Requesting permission...')
      
      const permission = await VoiceRecorder.requestAudioRecordingPermission()
      if (!permission.value) {
        throw new Error('Microphone permission denied')
      }

      console.log('[AudioCapture] Starting recording...')
      const result = await VoiceRecorder.startRecording()
      
      if (!result.value) {
        throw new Error('Failed to start recording')
      }

      isCapturingRef.current = true
      setIsCapturing(true)
      console.log('[AudioCapture] Recording started')
    } catch (err: any) {
      console.error('[AudioCapture] Failed to start:', err)
      setError(err.message)
      isCapturingRef.current = false
      setIsCapturing(false)
    }
  }, [isNative])

  const stopCapture = useCallback(async (): Promise<Blob | null> => {
    if (!isNative || !isCapturingRef.current) {
      console.log('[AudioCapture] Not capturing or not native')
      return null
    }

    try {
      console.log('[AudioCapture] Stopping recording...')
      const result = await VoiceRecorder.stopRecording()
      
      isCapturingRef.current = false
      setIsCapturing(false)

      if (!result.value.recordDataBase64) {
        console.log('[AudioCapture] No audio data')
        return null
      }

      console.log('[AudioCapture] Got audio:', {
        mimeType: result.value.mimeType,
        duration: result.value.msDuration,
        base64Length: result.value.recordDataBase64.length
      })

      // Convert base64 to blob
      const response = await fetch(`data:${result.value.mimeType};base64,${result.value.recordDataBase64}`)
      const blob = await response.blob()
      
      console.log('[AudioCapture] Created blob:', blob.size, 'bytes')
      return blob
    } catch (err: any) {
      console.error('[AudioCapture] Failed to stop:', err)
      setError(err.message)
      isCapturingRef.current = false
      setIsCapturing(false)
      return null
    }
  }, [isNative])

  const cancelCapture = useCallback(async () => {
    if (!isNative || !isCapturingRef.current) return

    try {
      await VoiceRecorder.stopRecording()
    } catch (err) {
      // Ignore errors on cancel
    }
    
    isCapturingRef.current = false
    setIsCapturing(false)
  }, [isNative])

  return {
    isCapturing,
    isNative,
    error,
    startCapture,
    stopCapture,
    cancelCapture,
  }
}
