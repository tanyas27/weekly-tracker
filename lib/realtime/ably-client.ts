'use client'

import * as Ably from 'ably'

export interface RealtimeMessagePayload {
  type: string
  calendarId?: string
  clientMutationId?: string
  [key: string]: unknown
}

export type RealtimeListener = (payload: RealtimeMessagePayload) => void

export interface RealtimeSubscription {
  close: () => void
  isConnected: () => boolean
}

/**
 * Initializes a client-side Ably Realtime connection subscribing to updates for a specific calendar.
 * Uses token-based authentication via /api/realtime/token, ensuring secret keys remain protected
 * and private calendars are verified before granting access.
 */
export function subscribeToCalendarRealtime(
  calendarId: string,
  passcode: string,
  onMessage: RealtimeListener
): RealtimeSubscription | null {
  if (typeof window === 'undefined' || !calendarId) return null

  try {
    const authUrl = `/api/realtime/token?calendarId=${encodeURIComponent(calendarId)}${
      passcode ? `&passcode=${encodeURIComponent(passcode)}` : ''
    }`

    const client = new Ably.Realtime({
      authUrl,
      authMethod: 'GET',
      autoConnect: true,
      disconnectedRetryTimeout: 10000,
      suspendedRetryTimeout: 30000,
    })

    const channelName = `calendar:${calendarId}`
    const channel = client.channels.get(channelName)

    const handleMessage = (message: Ably.Message) => {
      try {
        const payload: RealtimeMessagePayload =
          typeof message.data === 'string' ? JSON.parse(message.data) : message.data

        if (payload && typeof payload === 'object') {
          onMessage(payload)
        }
      } catch (err) {
        console.warn('[Ably] Could not parse message payload:', err)
      }
    }

    channel.subscribe('update', handleMessage)

    return {
      close: () => {
        try {
          channel.unsubscribe('update', handleMessage)
          client.close()
        } catch {}
      },
      isConnected: () => client.connection.state === 'connected',
    }
  } catch (err) {
    console.warn('[Ably] Failed to initialize connection:', err)
    return null
  }
}
