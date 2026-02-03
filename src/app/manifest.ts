import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DraftRoom - NFL Draft Scouting',
    short_name: 'DraftRoom',
    description: 'Community-driven NFL Draft scouting platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#78350f',
    theme_color: '#78350f',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
