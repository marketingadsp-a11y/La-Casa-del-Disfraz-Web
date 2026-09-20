// Vercel Serverless Function for testing Loyverse API token
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ success: false, message: 'Falta encabezado de autorización' });
  }

  try {
    const loyverseRes = await fetch('https://api.loyverse.com/v1.0/receipts?limit=1', {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (loyverseRes.status === 401 || loyverseRes.status === 403) {
      return res.status(loyverseRes.status).json({
        success: false,
        message: 'Ficha de acceso inválida o sin permisos en Loyverse (401/403).'
      });
    }

    if (!loyverseRes.ok) {
      const errorText = await loyverseRes.text();
      return res.status(loyverseRes.status).json({
        success: false,
        message: `Error de Loyverse (HTTP ${loyverseRes.status}): ${errorText.slice(0, 100)}`
      });
    }

    return res.json({
      success: true,
      message: 'Conexión con Loyverse exitosa. Ficha de acceso válida.'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Error al conectar con Loyverse desde Vercel: ${err?.message || 'Desconocido'}`
    });
  }
}
