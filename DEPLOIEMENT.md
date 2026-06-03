# Guide de déploiement — RifLine sur O2switch

---

## Tâches avant déploiement

### 🔴 Bloquant — à faire absolument

- [x] **Tester le paiement SumUp dans le navigateur** — ✅ flux validé en E2E (accueil → panier → checkout → redirection SumUp réelle)
- [x] **Webhook SumUp** — ✅ réécrit selon le modèle officiel SumUp : notification `{ event_type, id }` → rappel `GET /checkouts/{id}` → traitement si `status === "PAID"` (passage `processing`, décrément stock, idempotence). Plus de secret webhook. À retester en réel en production après déploiement (un vrai paiement ne peut être confirmé qu'avec une URL publique joignable par SumUp).
- [x] **Décider pour Sendcloud** — ✅ Sendcloud entièrement retiré du projet. Livraison standard unique à 5,90 € (montant fixe), suivi saisi manuellement par l'admin. Plus de récupération de transporteurs via API, plus de widget Mondial Relay.
- [ ] **Renseigner les secrets JWT dans cPanel** — utiliser les valeurs générées ci-dessous (NE PAS committer). Le `.env` local garde encore les valeurs `change_me_…`, ce qui est sans risque en local, mais en prod il FAUT ces secrets forts :
  ```
  JWT_SECRET=EKJhKpWGYbFOawNbX7vyClyiN9gArlD1qLNYmaGErIUd27YF7CL9OX9yhZRnzbXc
  JWT_REFRESH_SECRET=ow2YHKWZJ9e_VLuXw2Gvfr_yLGKo9dq3tLNIBMU0ozgFkyxJSpCwJsTW551a_2Nz
  ```
  (ou en régénérer : `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
- [ ] **Mettre `NODE_ENV=production`** dans cPanel (active les cookies `secure` + masque les messages d'erreur internes)

### ✅ Sécurité serveur — déjà en place dans le code (session de durcissement)

- [x] `helmet` — en-têtes de sécurité HTTP (CSP, HSTS, X-Frame-Options…)
- [x] `express-rate-limit` — 10 req/15min sur les routes auth (anti brute-force, testé → 429), 300 req/15min sur le reste de l'API
- [x] `trust proxy` activé — vraie IP client derrière le proxy O2switch
- [x] Webhook SumUp exclu du rate-limit et du parser JSON (corps brut pour la signature)
- [x] Refresh token avec `jti` unique (corrige une collision 500 sur l'index UNIQUE)
- [x] Banner de démarrage silencieux en production (pas de logs verbeux)

### 🟡 À compléter dès que possible

- [ ] **Pages légales** — remplir les champs `À COMPLÉTER` dans `/mentions-legales`, `/cgv`, `/confidentialite` (SIRET, adresse, raison sociale, dates)
- [ ] **Catalogue produits** — créer les vrais produits + uploader leurs images depuis le back-office admin (la base ne contient que des produits de démo)
- [ ] **Images hero slider** — remplacer `hero1.webp`, `hero2.png`, `hero3.png` par les vraies photos
- [ ] **Liens réseaux sociaux** — remplacer les `href="#"` Instagram et TikTok dans le footer par les vraies URLs

### 🟢 Après déploiement

- [ ] Configurer l'URL du webhook SumUp en production : `https://api.rif-line.com/api/payment/webhook`
- [ ] Vérifier que les emails de confirmation commande arrivent bien (config SMTP)
- [ ] Faire un test de commande réel de bout en bout sur le site en production

---

## Vue d'ensemble de l'architecture en production

```
Internet
  │
  ▼
Apache (O2switch) ─── rif-line.com ──────── sert le build React (dist/)
  │
  └── api.rif-line.com ─── Phusion Passenger ─── Node.js / Express (server/)
                                                        │
                                                    MySQL (O2switch)
                                                        │
                                                 /uploads/products/ (images)
```

---

## 1. Prérequis O2switch

- Accès cPanel O2switch
- Node.js 20.x disponible via "Setup Node.js App"
- MySQL via phpMyAdmin
- Deux (sous-)domaines configurés :
  - `rif-line.com` → frontend React
  - `api.rif-line.com` → backend Express

---

## 2. Base de données MySQL

### 2.1 Créer la base dans cPanel

Dans cPanel → **MySQL Databases** :
1. Créer la base : `rifline_db`
2. Créer un utilisateur MySQL avec un mot de passe fort
3. Attribuer tous les privilèges à cet utilisateur sur la base

### 2.2 Importer le schéma

Ouvrir phpMyAdmin → sélectionner `rifline_db` → onglet SQL → coller et exécuter :

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(512) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  parent_id INT DEFAULT NULL,
  description TEXT,
  image_url VARCHAR(500),
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2) DEFAULT NULL,
  stock INT DEFAULT 0,
  weight DECIMAL(8, 3) DEFAULT 0,
  sku VARCHAR(100),
  category_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  alt TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'FR',
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  status ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_first_name VARCHAR(100),
  shipping_last_name VARCHAR(100),
  shipping_address VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(2) DEFAULT 'FR',
  shipping_phone VARCHAR(20),
  shipping_email VARCHAR(255),
  sumup_checkout_id VARCHAR(255),
  sumup_transaction_id VARCHAR(255),
  tracking_number VARCHAR(255),
  label_url VARCHAR(500),
  sendcloud_parcel_id INT,
  paid_at TIMESTAMP DEFAULT NULL,
  shipped_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT DEFAULT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  weight DECIMAL(8, 3) DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Index de performance
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### 2.2 bis — ⚠️ Appliquer la migration des colonnes manquantes

Le schéma ci-dessus ne contient pas certaines colonnes ajoutées ensuite
(`products.is_featured`, `orders.shipping_method_id`, `orders.guest_token`…).
**Après** avoir importé le schéma, exécuter dans phpMyAdmin le contenu de :

```
server/migrations/001_add_missing_columns.sql
```

Sans cette migration, l'admin (produits mis en avant) et le checkout (méthode de
livraison, commandes invité) échoueront. La migration est idempotente (`IF NOT EXISTS`).

### 2.3 Créer le compte admin

Remplacer le hash ci-dessous par celui généré pour votre mot de passe (voir section Outils) :

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@rif-line.com', '$2b$12$HASH_A_GENERER', 'Admin', 'RifLine', 'admin');
```

Pour générer le hash du mot de passe admin :
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('VOTRE_MOT_DE_PASSE', 12).then(console.log);"
```
(Exécuter depuis le dossier `server/` après `npm install`)

---

## 3. Déploiement du backend (server/)

### 3.1 Uploader les fichiers

Via FTP/SFTP, uploader le dossier `server/` sur O2switch dans :
```
/home/VOTRE_USER/rifline-api/
```

**Ne pas uploader** :
- `node_modules/` (sera installé sur le serveur)
- `.env` (sera configuré via cPanel)
- `public/uploads/` (créer le dossier vide sur le serveur)

### 3.2 Configurer Node.js dans cPanel

Dans cPanel → **Setup Node.js App** → Create Application :

| Champ | Valeur |
|-------|--------|
| Node.js version | 20.x |
| Application mode | Production |
| Application root | `/home/VOTRE_USER/rifline-api` |
| Application URL | `api.rif-line.com` |
| Application startup file | `index.js` |

### 3.3 Variables d'environnement

Dans cPanel → Setup Node.js App → **Environment Variables**, ajouter :

```
PORT=3000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_USER=VOTRE_USER_MYSQL
DB_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL
DB_NAME=rifline_db

# Secrets JWT générés (à utiliser tels quels ou à régénérer) :
JWT_SECRET=EKJhKpWGYbFOawNbX7vyClyiN9gArlD1qLNYmaGErIUd27YF7CL9OX9yhZRnzbXc
JWT_REFRESH_SECRET=ow2YHKWZJ9e_VLuXw2Gvfr_yLGKo9dq3tLNIBMU0ozgFkyxJSpCwJsTW551a_2Nz

SUMUP_API_KEY=sup_sk_XXXX            # clé production pour encaisser, clé sandbox pour valider
SUMUP_MERCHANT_CODE=VOTRE_CODE_MARCHAND
# Pas de SUMUP_WEBHOOK_SECRET : la confirmation de paiement se fait en rappelant
# l'API SumUp (GET /checkouts/{id}), authentifiée par SUMUP_API_KEY.

APP_URL=https://rif-line.com
SERVER_URL=https://api.rif-line.com   # sert aussi de base à l'URL du webhook SumUp

# Email (optionnel — laisser SMTP_HOST vide désactive les notifications de commande)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=RifLine <contact@rif-line.com>
```

> Pour régénérer des secrets JWT : `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

### 3.4 Installer les dépendances

Dans cPanel → Setup Node.js App → cliquer **Run NPM Install** (ou via terminal SSH) :
```bash
cd ~/rifline-api && npm install --production
```

### 3.5 Créer le dossier uploads

```bash
mkdir -p ~/rifline-api/public/uploads/products
chmod 755 ~/rifline-api/public/uploads/products
```

### 3.6 Démarrer l'application

Dans cPanel → Setup Node.js App → cliquer **Start App** (ou Restart si déjà lancée).

Phusion Passenger gère le process — pas besoin de PM2 en production.

---

## 4. Déploiement du frontend (client/)

### 4.1 Configurer les variables d'environnement du build

Créer/modifier `client/.env.production` :
```env
VITE_API_URL=https://api.rif-line.com/api
```

> ⚠️ Ces variables `VITE_*` sont **figées au moment du `npm run build`** : elles
> sont compilées dans le bundle. Toute modification nécessite un nouveau build.

### 4.2 Builder le frontend

En local, depuis le dossier `client/` :
```bash
npm run build
```

Cela génère un dossier `client/dist/`.

### 4.3 Uploader le build

Via FTP/SFTP, uploader **le contenu** de `client/dist/` dans :
```
/home/VOTRE_USER/public_html/
```

(ou dans un sous-dossier si le domaine pointe ailleurs)

### 4.4 Configurer Apache pour le routing React

Ce fichier est essentiel pour que React Router fonctionne — sans lui, un refresh sur
`/catalogue` retourne une **404 Apache** (seule la home `/` fonctionne).

✅ **Plus rien à faire manuellement** : le `.htaccess` est versionné dans
`client/public/.htaccess`. Vite le copie automatiquement dans `dist/` à chaque
`npm run build`. Il part donc avec votre upload FTP.

> ⚠️ **Attention à l'upload FTP** : les fichiers commençant par un point (`.htaccess`)
> sont masqués par défaut dans la plupart des clients FTP. Activez l'affichage des
> fichiers cachés (FileZilla : Serveur → Forcer l'affichage des fichiers cachés)
> pour bien transférer le `.htaccess` vers `public_html/`.

Contenu (pour référence — règle SPA + compression gzip + cache long sur les assets hashés) :
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

---

## 5. Configuration des domaines et SSL

### 5.1 Domaines

Dans cPanel → **Subdomains** ou **Addon Domains** :
- `rif-line.com` → pointe vers `public_html/`
- `api.rif-line.com` → pointe vers le dossier de l'app Node.js (géré par Passenger)

### 5.2 SSL/HTTPS

Dans cPanel → **SSL/TLS** → **Let's Encrypt** :
- Activer SSL pour `rif-line.com`
- Activer SSL pour `api.rif-line.com`

---

## 6. Configuration des services tiers

### 6.1 SumUp

1. Créer un compte sur [sumup.com](https://sumup.com)
2. Dans le dashboard développeur [developer.sumup.com](https://developer.sumup.com) → **API keys** → générer une clé `sup_sk_...`. Basculer en mode **production** (et non sandbox) pour encaisser réellement.
3. Récupérer le **merchant code** sur [me.sumup.com](https://me.sumup.com) → profil / paramètres du compte.
4. Renseigner `SUMUP_API_KEY` et `SUMUP_MERCHANT_CODE` dans les variables d'environnement cPanel.
5. **Pas d'URL de webhook à configurer manuellement dans le dashboard** : le backend passe automatiquement `return_url = {SERVER_URL}/api/payment/webhook` à chaque création de checkout. SumUp y enverra la notification de changement de statut. Vérifier simplement que `SERVER_URL=https://api.rif-line.com` est bien défini.
6. **Confirmation de paiement** : à réception du webhook, le backend rappelle `GET /v0.1/checkouts/{id}` et ne valide la commande que si `status === "PAID"`. Aucun secret webhook n'est nécessaire (la sécurité vient de cet appel authentifié).

### 6.2 Livraison

Pas de service tiers à configurer. La livraison est une **option standard unique à 5,90 €**
(montant fixe, affiché directement au checkout). L'admin génère l'étiquette manuellement
(panel transporteur, La Poste…) puis saisit le numéro de suivi dans le back-office.

---

## 7. Checklist de déploiement

### Avant de mettre en ligne

- [ ] Schéma SQL importé et vérifié dans phpMyAdmin
- [ ] Compte admin créé en base avec mot de passe fort
- [ ] Toutes les variables d'environnement renseignées dans cPanel
- [ ] `NODE_ENV=production` bien configuré
- [ ] JWT_SECRET et JWT_REFRESH_SECRET différents et de 64+ caractères
- [ ] Dossier `public/uploads/products/` créé avec permissions 755
- [ ] `npm install --production` exécuté sur le serveur
- [ ] Application Node.js démarrée dans cPanel

### Build frontend

- [ ] `client/.env.production` contient `VITE_API_URL=https://api.rif-line.com/api`
- [ ] `npm run build` exécuté en local sans erreur
- [ ] Contenu de `dist/` uploadé dans `public_html/`
- [ ] Fichier `.htaccess` bien transféré dans `public_html/` (afficher les fichiers cachés dans le client FTP)

### Tests post-déploiement

- [ ] `https://rif-line.com` charge la page d'accueil
- [ ] `https://api.rif-line.com/api/products` retourne du JSON (pas d'erreur CORS)
- [ ] Inscription d'un compte client fonctionne
- [ ] Connexion admin fonctionne (`/compte/connexion`)
- [ ] Ajout d'un produit avec image fonctionne
- [ ] Checkout → redirection SumUp fonctionne
- [ ] Webhook SumUp reçu et commande passée en `processing`

---

## 8. Mises à jour futures

### Mise à jour du backend

```bash
# 1. Uploader les nouveaux fichiers server/ via FTP (hors node_modules et .env)
# 2. Dans cPanel → Setup Node.js App → Restart App
```

### Mise à jour du frontend

```bash
# En local
cd client && npm run build

# Uploader client/dist/ dans public_html/ via FTP
# (écraser les anciens fichiers)
```

### Migrations de base de données

Il n'y a pas de système de migration automatique. Pour chaque modification de schéma :
1. Écrire le SQL `ALTER TABLE` correspondant
2. L'exécuter dans phpMyAdmin
3. Redéployer le backend si le code a changé

---

## 9. Structure des fichiers sur le serveur

```
/home/VOTRE_USER/
├── public_html/               ← Frontend React (build)
│   ├── index.html
│   ├── assets/
│   └── .htaccess
│
└── rifline-api/               ← Backend Node.js
    ├── index.js
    ├── package.json
    ├── config/
    ├── controllers/
    ├── middlewares/
    ├── repositories/
    ├── routes/
    ├── services/
    ├── utils/
    ├── node_modules/          ← généré par npm install
    └── public/
        └── uploads/
            └── products/      ← images uploadées (à sauvegarder !)
```

> **Important** : le dossier `public/uploads/products/` contient les images produits. Pensez à le sauvegarder régulièrement — il n'est pas versionné dans git.

---

## 10. Variables d'environnement — référence complète

| Variable | Dev (local) | Prod (O2switch) | Description |
|----------|------------|-----------------|-------------|
| `PORT` | `3000` | `3000` | Port Express |
| `NODE_ENV` | `development` | `production` | Mode Node |
| `DB_HOST` | `localhost` | `localhost` | Hôte MySQL |
| `DB_PORT` | `8889` (MAMP) | `3306` | Port MySQL |
| `DB_USER` | `root` | user cPanel | Utilisateur MySQL |
| `DB_PASSWORD` | `root` | mot de passe fort | Mot de passe MySQL |
| `DB_NAME` | `rifline` | `rifline_db` | Nom de la base |
| `JWT_SECRET` | `change_me_...` | 64+ chars random | Secret access token |
| `JWT_REFRESH_SECRET` | `change_me_...` | 64+ chars random | Secret refresh token |
| `SUMUP_API_KEY` | `sup_sk_...` (sandbox) | `sup_sk_...` (production) | Clé API SumUp |
| `SUMUP_MERCHANT_CODE` | code marchand | code marchand | Code marchand SumUp |
| `APP_URL` | `http://localhost:5173` | `https://rif-line.com` | URL frontend (CORS + redirects SumUp) |
| `SERVER_URL` | `http://localhost:3000` | `https://api.rif-line.com` | URL API (URLs absolues des images) |
| `SMTP_HOST` | vide | hôte SMTP | Email (vide = notifications désactivées) |
| `SMTP_PORT` | `587` | `587` | Port SMTP |
| `SMTP_SECURE` | `false` | `true`/`false` | TLS SMTP |
| `SMTP_USER` | — | identifiant SMTP | Compte d'envoi |
| `SMTP_PASS` | — | mot de passe SMTP | Mot de passe d'envoi |
| `SMTP_FROM` | — | `RifLine <…>` | Expéditeur des emails |

### Variables frontend (Vite — dans `client/.env.production`, figées au build)

| Variable | Dev | Prod | Description |
|----------|-----|------|-------------|
| `VITE_API_URL` | `http://localhost:3000/api` | `https://api.rif-line.com/api` | URL de l'API consommée par le front |
