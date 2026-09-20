// Vercel Serverless Function for Loyverse receipts proxy
export default async function handler(req: any, res: any) {
  // Add CORS headers for web requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ success: false, error: 'Falta encabezado de autorización' });
  }

  try {
    const queryParams = new URLSearchParams();
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          queryParams.set(key, value);
        } else if (Array.isArray(value)) {
          queryParams.set(key, value[0]);
        }
      }
    }

    const loyverseUrl = `https://api.loyverse.com/v1.0/receipts?${queryParams.toString()}`;
    const loyverseRes = await fetch(loyverseUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await loyverseRes.json();
    return res.status(loyverseRes.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      error: `Error al consultar Loyverse desde Vercel Serverless: ${err?.message || 'Desconocido'}`
    });
  }
}
