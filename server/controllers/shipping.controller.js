const { validationResult } = require('express-validator');
const sendcloudService = require('../services/sendcloud.service');

exports.getMethods = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { weight, country } = req.query;
    const result = await sendcloudService.getShippingMethods({ weight, toCountry: country });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
