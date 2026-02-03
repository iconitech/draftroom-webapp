import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DraftRoom - Community NFL Draft Scouting'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fef3c7',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 120, marginBottom: 20 }}>
          🏈
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            marginBottom: 20,
            letterSpacing: '-0.05em',
            textAlign: 'center',
          }}
        >
          DraftRoom
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.9,
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Community-Driven NFL Draft Scouting
        </div>
        <div
          style={{
            fontSize: 24,
            marginTop: 30,
            opacity: 0.7,
            display: 'flex',
            gap: 40,
          }}
        >
          <span>Expert Analysis</span>
          <span>•</span>
          <span>Community Reports</span>
          <span>•</span>
          <span>Big Board Rankings</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
