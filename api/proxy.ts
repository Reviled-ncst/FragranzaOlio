// Types for Vercel serverless functions
interface VercelRequest {
  method?: string;
  query: { [key: string]: string | string[] };
  body?: any;
  headers: { [key: string]: string | string[] | undefined };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

// Backend URL - Use environment variable or default to Cloudflare tunnel
const BACKEND_URL = process.env.BACKEND_URL || 'https://turner-removing-baking-moment.trycloudflare.com/FragranzaWeb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Admin-Email, Accept, Origin, ngrok-skip-browser-warning');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the path from query parameter
  const { path, ...queryParams } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  // Build the target URL
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  const queryString = new URLSearchParams(
    Object.entries(queryParams).reduce((acc, [key, val]) => {
      acc[key] = Array.isArray(val) ? val[0] : val || '';
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  
  const targetUrl = `${BACKEND_URL}/backend/api/${pathStr}${queryString ? `?${queryString}` : ''}`;

  try {
    // Get authorization headers from incoming request
    const authorization = req.headers['authorization'] || req.headers['Authorization'];
    const adminEmail = req.headers['x-admin-email'] || req.headers['X-Admin-Email'];
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
        ...(authorization ? { 'Authorization': Array.isArray(authorization) ? authorization[0] : authorization } : {}),
        ...(adminEmail ? { 'X-Admin-Email': Array.isArray(adminEmail) ? adminEmail[0] : adminEmail } : {}),
      },
    };

    // Add body for POST/PUT/PATCH requests
    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Make the request to backend
    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response text
    const responseText = await response.text();
    
    // Check if response is the anti-bot challenge page (InfinityFree)
    if (responseText.includes('aes.js') || responseText.includes('toNumbers')) {
      // InfinityFree is blocking the request with anti-bot challenge
      return res.status(503).json({
        success: false,
        error: 'Backend temporarily unavailable due to security challenge',
        message: 'The backend server is protected by an anti-bot system that blocks API requests. Please try again later or use a different hosting provider.',
        debug: {
          targetUrl,
          status: response.status,
          isChallengePage: true
        }
      });
    }

    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(responseText);
      return res.status(response.status).json(jsonData);
    } catch {
      // If not JSON, return as text
      return res.status(response.status).send(responseText);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
