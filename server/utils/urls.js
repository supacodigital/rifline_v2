const toAbsoluteUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
  return `${base}${path}`;
};

module.exports = { toAbsoluteUrl };
