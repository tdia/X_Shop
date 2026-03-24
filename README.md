# X-Shop

Application web de gestion de boutique (POS) avec interface moderne, API backend et base de donnees MariaDB.

## Objectif du projet

X-Shop vise a centraliser les operations essentielles d'un commerce :

- gestion des ventes en caisse (POS)
- gestion de l'inventaire et du stock
- suivi des performances (dashboard + rapports)
- gestion des utilisateurs et des roles

Le projet est construit avec une architecture separant clairement le frontend (React/Vite) et le backend (Express/Sequelize).

## Fonctionnalites principales

- **Authentification** avec roles (`admin`, `gestionnaire`, `vendeur`, `manager`)
- **POS/Caisse** : ajout d'articles au panier, validation de vente, ticket de caisse
- **Inventaire** : creation, modification, suppression de produits, suivi de stock
- **Dashboard** : chiffre d'affaires, nombre de ventes, alertes stock
- **Rapports** : vue journaliere/mensuelle et export impression PDF
- **Gestion des utilisateurs** : CRUD collaborateurs + attribution de role

## Stack technique

### Frontend

- React 19
- Vite
- framer-motion
- lucide-react
- recharts

### Backend

- Node.js
- Express
- Sequelize
- MariaDB

### Orchestration

- Docker + Docker Compose

## Structure du projet

```text
X_Shop/
|- src/                    # Frontend React
|- backend/                # API Express + Sequelize
|- Dockerfile              # Image frontend (build + nginx)
|- docker-compose.yml      # Frontend + backend + DB
```

## Prerequis

### Option Docker (recommandee)

- Docker Desktop (ou Docker Engine + Compose)

### Option locale (sans Docker)

- Node.js 20+ et npm
- MariaDB 10.11+ (ou compatible)

## Lancement rapide (Docker)

Depuis la racine du projet :

```bash
cd "/Users/zahraalbatoul/Documents/Projects Code/X_Shop"
docker compose up --build
```

Services exposes :

- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend API: [http://localhost:5001](http://localhost:5001)
- MariaDB: `localhost:3306`

Arreter les services :

```bash
docker compose down
```

Arreter et supprimer les volumes (reset complet DB) :

```bash
docker compose down -v
```

## Lancement en developpement local (frontend Vite + backend Docker)

Ce mode est pratique pour coder le frontend avec hot reload.

### 1) Demarrer DB + backend

```bash
cd "/Users/zahraalbatoul/Documents/Projects Code/X_Shop"
docker compose up -d db backend
```

### 2) Installer les dependances frontend (si pas deja fait)

```bash
npm install
```

### 3) Lancer le frontend en pointant vers l'API Docker

```bash
VITE_API_URL="http://localhost:5001/api" npm run dev
```

Frontend dev :

- [http://localhost:5173](http://localhost:5173)

## Lancement 100% local (sans Docker)

### 1) Installer les dependances

```bash
cd "/Users/zahraalbatoul/Documents/Projects Code/X_Shop"
npm install
cd backend
npm install
```

### 2) Demarrer MariaDB local

Configurer une base :

- `DB_NAME=xshop_db`
- `DB_USER=root`
- `DB_PASSWORD=root`
- `DB_HOST=localhost`

### 3) Lancer le backend

```bash
cd "/Users/zahraalbatoul/Documents/Projects Code/X_Shop/backend"
npm start
```

### 4) Lancer le frontend (autre terminal)

```bash
cd "/Users/zahraalbatoul/Documents/Projects Code/X_Shop"
npm run dev
```

Par defaut, le frontend utilise :

- `VITE_API_URL=http://localhost:5000/api`

## Identifiants par defaut

Au premier demarrage backend, un compte admin est cree automatiquement :

- **username**: `admin`
- **password**: `password`

## Scripts utiles

### Frontend (`/`)

- `npm run dev` : lance Vite en mode developpement
- `npm run build` : build de production
- `npm run preview` : previsualisation du build
- `npm run lint` : lint ESLint

### Backend (`/backend`)

- `npm start` : demarre le serveur Node
- `npm run dev` : demarre le serveur avec nodemon

## Endpoints API principaux

Base URL:

- En Docker: `http://localhost:5001/api`
- En local: `http://localhost:5000/api`

Routes:

- `POST /login`
- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /products`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`
- `GET /sales`
- `POST /sales`

## Depannage

### Impossible de se connecter avec `admin/password`

Verifier d'abord l'URL API du frontend :

- Si backend via Docker compose: utiliser `http://localhost:5001/api`
- Si backend local: utiliser `http://localhost:5000/api`

Exemple :

```bash
VITE_API_URL="http://localhost:5001/api" npm run dev
```

### Port deja occupe

Exemples frequents :

- `5000` deja pris par un service systeme
- `3306` deja pris par une autre instance MariaDB

Dans ce cas, modifier les mappings de ports dans `docker-compose.yml`.

### Les donnees semblent "bloquees"

Reset complet DB :

```bash
docker compose down -v
docker compose up --build
```

## Notes

- Le champ `version` dans `docker-compose.yml` est obsolete en Compose V2 (warning non bloquant).
- Pour un environnement de production, il est recommande d'ajouter une couche de securite plus robuste (hash mot de passe, auth token, validation stricte des entrees, etc.).
