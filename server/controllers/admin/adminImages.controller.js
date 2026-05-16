const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const productImageRepository = require('../../repositories/productImage.repository');
const productRepository = require('../../repositories/product.repository');

const uuidv4 = () => crypto.randomUUID();

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads/products');
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const THUMB_SIZE = 400;

exports.getImages = async (req, res, next) => {
  try {
    const images = await productImageRepository.findByProductId(req.params.id);
    res.json(images);
  } catch (err) {
    next(err);
  }
};

exports.upload = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    const product = await productRepository.findById(productId);
    if (!product) return res.status(404).json({ error: 'Produit introuvable.' });

    if (!req.file) return res.status(422).json({ error: 'Aucun fichier fourni.' });

    const filename = `${uuidv4()}.webp`;
    const thumbFilename = `${uuidv4()}-thumb.webp`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const thumbPath = path.join(UPLOADS_DIR, thumbFilename);

    await sharp(req.file.buffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(filePath);

    await sharp(req.file.buffer)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
      .webp({ quality: 75 })
      .toFile(thumbPath);

    const count = await productImageRepository.countByProductId(productId);
    const isPrimary = count === 0;

    if (isPrimary) {
      await productImageRepository.clearPrimary(productId);
    }

    const url = `/uploads/products/${filename}`;
    const imageId = await productImageRepository.create({
      productId,
      url,
      alt: product.name,
      isPrimary,
      sortOrder: count,
    });

    res.status(201).json({ id: imageId, url, isPrimary });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const image = await productImageRepository.findById(req.params.imageId);
    if (!image) return res.status(404).json({ error: 'Image introuvable.' });
    if (String(image.product_id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const filename = path.basename(image.url);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await productImageRepository.remove(image.id);

    if (image.is_primary) {
      const remaining = await productImageRepository.findByProductId(image.product_id);
      if (remaining.length > 0) {
        await productImageRepository.clearPrimary(image.product_id);
        await productImageRepository.setPrimary(remaining[0].id);
      }
    }

    res.json({ message: 'Image supprimée.' });
  } catch (err) {
    next(err);
  }
};

exports.setPrimary = async (req, res, next) => {
  try {
    const image = await productImageRepository.findById(req.params.imageId);
    if (!image) return res.status(404).json({ error: 'Image introuvable.' });
    if (String(image.product_id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    await productImageRepository.clearPrimary(image.product_id);
    await productImageRepository.setPrimary(image.id);
    res.json({ message: 'Image principale définie.' });
  } catch (err) {
    next(err);
  }
};
