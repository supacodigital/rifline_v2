-- Migration 002 — Colonnes de réinitialisation de mot de passe
-- À exécuter une seule fois en base de données
-- Date : 2026-06-04
--
-- Contexte : auth.controller.forgotPassword / resetPassword et
-- user.repository (setResetToken / findByResetToken / clearResetToken)
-- utilisent ces colonnes, mais elles n'étaient créées par aucun script SQL,
-- ce qui provoquait une erreur 500 (Unknown column) sur /api/auth/forgot-password.

-- Jeton de réinitialisation (32 octets en hexadécimal = 64 caractères)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL;

-- Date d'expiration du jeton (1 heure après génération)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP NULL DEFAULT NULL;

-- Index pour la recherche par jeton (findByResetToken)
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token);
