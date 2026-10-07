import * as Ably from 'ably'

let restClient: Ably.Rest | null = null

export function isAblyConfigured(): boolean {
  return Boolean(process.env.ABLY_API_KEY && process.env.ABLY_API_KEY.includes(':'))
}

export function getAblyRest(): Ably.Rest | null {
  const apiKey = process.env.ABLY_API_KEY
  if (!apiKey || !apiKey.includes(':')) return null

  if (!restClient) {
    restClient = new Ably.Rest({ key: apiKey })
  }
  return restClient
}

export async function createCalendarTokenRequest(
  calendarId: string,
  clientId?: string
): Promise<Ably.TokenRequest | null> {
  const rest = getAblyRest()
  if (!rest) return null

  const resolvedClientId = clientId || `client-${Math.random().toString(36).slice(2, 10)}`

  return rest.auth.createTokenRequest({
    clientId: resolvedClientId,
    capability: {
      [`calendar:${calendarId}`]: ['subscribe'],
    },
  })
}

export async function publishCalendarEvent(
  calendarId: string,
  eventName: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const rest = getAblyRest()
  if (!rest) return false

  try {
    const channel = rest.channels.get(`calendar:${calendarId}`)
    await channel.publish(eventName, payload)
    return true
  } catch (err) {
    console.error(`[Ably] Failed to publish ${eventName} to calendar:${calendarId}:`, err)
    return false
  }
}
