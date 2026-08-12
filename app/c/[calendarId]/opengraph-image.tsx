import { ImageResponse } from 'next/og'

export const alt = 'DailyForest Shared Planner'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1B3828 0%, #2D5F3E 60%, #3D7A52 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#E8E6DC',
          padding: '60px',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            fontSize: '40px',
            marginBottom: '24px',
          }}
        >
          📅
        </div>
        <div
          style={{
            fontSize: '56px',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            marginBottom: '16px',
            color: '#FFFFFF',
          }}
        >
          DailyForest Shared Planner
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#D8ECE0',
            fontWeight: '500',
            maxWidth: '750px',
            lineHeight: 1.4,
          }}
        >
          View and collaborate on this weekly schedule.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
