'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { assistantSocketUrl } from '@/lib/utils'

export type LiveAction = { type: string; href?: string; label?: string }

export type LiveEvent = {
  type: string
  text?: string
  reply?: string
  language?: string
  message?: string
  state?: string
  openai?: boolean
  voice?: boolean
  provider?: string
  action?: LiveAction
}

type Options = {
  enabled: boolean
  onEvent: (event: LiveEvent) => void
}

export function useAssistantSocket({ enabled, onEvent }: Options) {
  const [connected, setConnected] = useState(false)
  const [readyMessage, setReadyMessage] = useState('Connecting to Sahayak…')
  const socketRef = useRef<WebSocket | null>(null)
  const onEventRef = useRef(onEvent)
  const retryRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const disconnect = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const socket = socketRef.current
    socketRef.current = null
    if (socket && socket.readyState < 2) socket.close()
    setConnected(false)
  }, [])

  useEffect(() => {
    if (!enabled) {
      disconnect()
      return
    }

    let cancelled = false

    const connect = () => {
      if (cancelled) return
      const socket = new WebSocket(assistantSocketUrl())
      socketRef.current = socket

      socket.onopen = () => {
        retryRef.current = 0
        setConnected(true)
        setReadyMessage('Live · ask anything')
      }

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as LiveEvent
          if (payload.type === 'ready') {
            setReadyMessage(payload.message || 'Live · ask anything')
          }
          onEventRef.current(payload)
        } catch {
          onEventRef.current({ type: 'error', message: 'Could not read the live reply.' })
        }
      }

      socket.onerror = () => {
        setReadyMessage('Live chat had a connection error')
      }

      socket.onclose = () => {
        setConnected(false)
        if (cancelled) return
        const wait = Math.min(8000, 600 * 2 ** retryRef.current)
        retryRef.current += 1
        setReadyMessage('Reconnecting…')
        timerRef.current = window.setTimeout(connect, wait)
      }
    }

    connect()
    return () => {
      cancelled = true
      disconnect()
    }
  }, [enabled, disconnect])

  const sendMessage = useCallback((text: string, history: { role: string; text: string }[], language = '') => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error('Sahayak is still connecting. Wait a second and try again.')
    }
    socket.send(JSON.stringify({ type: 'message', text, history, language }))
  }, [])

  return { connected, readyMessage, sendMessage }
}
