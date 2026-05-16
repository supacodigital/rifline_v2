const { validationResult } = require('express-validator');
const categoryRepository = require('../../repositories/category.repository');

const toSlug = (str) =>
  str.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const uniqueSlug = async (base, excludeId = null) => {
  let slug = base;
  let i = 1;
  while (true) {
    const existing = await categoryRepository.findBySlug(slug);
    if (!existing || existing.id == excludeId) break;
    slug = `${base}-${i++}`;
  }
  return slug;
};

exports.getAll = async (req, res, next) => {
  try {
    const categories = await categoryRepository.findAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, description, parentId } = req.body;
    const slug = await uniqueSlug(toSlug(name));
    const id = await categoryRepository.create({ name: name.trim(), slug, description, parentId });
    res.status(201).json({ id, slug });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;
    const id = req.params.id;
    const slug = name ? await uniqueSlug(toSlug(name), id) : undefined;
    await categoryRepository.update(id, { name: name?.trim(), slug, description, parentId });
    res.json({ message: 'Catégorie mise à jour.' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const count = await categoryRepository.countProducts(req.params.id);
    if (count > 0) {
      return res.status(409).json({ error: `Impossible de supprimer : ${count} produit(s) utilisent cette catégorie.` });
    }
    await categoryRepository.remove(req.params.id);
    res.json({ message: 'Catégorie supprimée.' });
  } catch (err) {
    next(err);
  }
};
