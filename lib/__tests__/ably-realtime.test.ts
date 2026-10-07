import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isAblyConfigured,
  getAblyRest,
  createCalendarTokenRequest,
  publishCalendarEvent,
} from '../realtime/ably-server'

describe('Ably server realtime utility', () => {
  const originalEnv = process.env.ABLY_API_KEY

  beforeEach(() => {
    delete process.env.ABLY_API_KEY
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ABLY_API_KEY = originalEnv
    } else {
      delete process.env.ABLY_API_KEY
    }
  })

  it('detects unconfigured Ably when ABLY_API_KEY is missing', () => {
    expect(isAblyConfigured()).toBe(false)
    expect(getAblyRest()).toBeNull()
  })

  it('gracefully handles publishCalendarEvent when Ably is not configured', async () => {
    const success = await publishCalendarEvent('cal-123', 'update', { type: 'TASKS_MUTATED' })
    expect(success).toBe(false)
  })

  it('detects configured Ably when ABLY_API_KEY has valid format', () => {
    process.env.ABLY_API_KEY = 'appId.keyId:secretKey'
    expect(isAblyConfigured()).toBe(true)
  })

  it('creates token request scoped to calendar channel capability', async () => {
    process.env.ABLY_API_KEY = 'testApp.keyId:secretPart'
    const tokenRequest = await createCalendarTokenRequest('my-work-cal')
    expect(tokenRequest).not.toBeNull()
    expect(tokenRequest?.capability).toBe(
      JSON.stringify({
        'calendar:my-work-cal': ['subscribe'],
      })
    )
  })
})
