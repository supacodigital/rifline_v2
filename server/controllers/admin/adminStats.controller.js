const statsRepository = require('../../repositories/stats.repository');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await statsRepository.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
