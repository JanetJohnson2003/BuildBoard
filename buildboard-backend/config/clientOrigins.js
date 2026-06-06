const DEFAULT_CLIENT_URL = 'https://build-board-cyan.vercel.app';

const normalizeOrigin = (origin) => (origin || '').replace(/\/$/, '');

const clientUrl = normalizeOrigin(
  process.env.CLIENT_URL || process.env.FRONTEND_URL || DEFAULT_CLIENT_URL
);

const allowedClientOrigins = Array.from(
  new Set(
    [
      clientUrl,
      DEFAULT_CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]
      .map(normalizeOrigin)
      .filter(Boolean)
  )
);

module.exports = { clientUrl, allowedClientOrigins };
