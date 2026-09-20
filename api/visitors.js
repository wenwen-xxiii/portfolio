// Real-time visitor tracking via heartbeats + total visit counter
// - Live visitors: tracked via heartbeats, cleaned up after 60s of inactivity
// - Total visits: counts every unique session ID seen since last cold start

const visitors = new Map();    // sessionId -> lastHeartbeat timestamp
const seenSessions = new Set(); // all unique session IDs ever seen
let totalVisits = 0;
const TIMEOUT = 60000; // 60 seconds before a visitor is considered gone

function cleanup() {
  const now = Date.now();
  for (const [id, timestamp] of visitors) {
    if (now - timestamp > TIMEOUT) {
      visitors.delete(id);
    }
  }
}

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = req.query.sid || req.headers['x-forwarded-for'] || 'anon';

  cleanup();

  // Count new unique visit
  if (!seenSessions.has(clientId)) {
    seenSessions.add(clientId);
    totalVisits++;
  }

  // Record heartbeat for live tracking
  visitors.set(clientId, Date.now());

  res.status(200).json({
    live: visitors.size,
    total: totalVisits
  });
}
