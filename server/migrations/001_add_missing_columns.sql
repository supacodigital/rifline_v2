-- Migration 001 — Colonnes manquantes
-- À exécuter une seule fois en base de données
-- Date : 2026-05-16

-- Colonne is_featured sur products (produits mis en avant sur la home)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products (is_featured);

-- Colonne shipping_method_id sur orders (méthode Sendcloud choisie par le client)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method_id INT DEFAULT NULL;

-- Colonne sendcloud_parcel_id si absente (référencée dans updateShipping)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS sendcloud_parcel_id INT DEFAULT NULL;
