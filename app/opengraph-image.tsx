import { ImageResponse } from 'next/og'

export const alt = 'DailyForest — Free Daily & Weekly Planner'
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
            width: '96px',
            height: '96px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            fontSize: '48px',
            marginBottom: '28px',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-2l3-3.3a1 1 0 0 1-.7-1.7H5.7a1 1 0 0 1-.7-1.7L12 2l7 5.3a1 1 0 0 1-.7 1.7h-1.6a1 1 0 0 1-.7 1.7L19 14h-2z"/>
            <path d="M12 19v3"/>
          </svg>
        </div>
        <div
          style={{
            fontSize: '68px',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            color: '#FFFFFF',
          }}
        >
          DailyForest
        </div>
        <div
          style={{
            fontSize: '32px',
            color: '#D8ECE0',
            fontWeight: '500',
            maxWidth: '850px',
            lineHeight: 1.4,
          }}
        >
          Free Daily & Weekly Planner • Time Blocking • Shareable Calendars • Offline PWA
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
