import { MetadataRoute } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://draftroomfe.vercel.app'

  // Fetch all players for dynamic routes
  let players = []
  try {
    const res = await fetch(`${API_URL}/api/players`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })
    players = await res.json()
  } catch (error) {
    console.error('Failed to fetch players for sitemap:', error)
  }

  // Generate player pages
  const playerPages = Array.isArray(players) ? players.map((player: any) => ({
    url: `${baseUrl}/player/${player.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  })) : []

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...playerPages,
  ]
}
