import type { VercelRequest, VercelResponse } from '@vercel/node';

// Backend URL for images - Cloudflare tunnel to local XAMPP
const BACKEND_URL = process.env.BACKEND_URL || 'https://atom-climbing-shark-threshold.trycloudflare.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the image path from query parameter
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const imagePath = Array.isArray(path) ? path.join('/') : path;
  
  // Build the full image URL - images are served from backend root
  const imageUrl = `${BACKEND_URL}/backend${imagePath}`;

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      // Return a placeholder or 404
      return res.status(404).json({ error: 'Image not found', path: imagePath });
    }

    // Get content type from response
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Get the image buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Set caching headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // Send the image
    return res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Image proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
