const categoryRepository = require('../repositories/category.repository');

exports.getAll = async (req, res, next) => {
  try {
    const categories = await categoryRepository.findAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
};
