const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Erreur] ${err.message}`);
  }

  const status = err.status || 500;
  const message = err.isOperational
    ? err.message
    : 'Une erreur interne est survenue. Veuillez réessayer.';

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
