# Forko Conseil - Réseau Social Interne

Plateforme collaborative mobile-first pour les consultants de Forko Conseil.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- MySQL 8.0+
- npm ou yarn

### Installation complète

1. **Cloner le projet**
\`\`\`bash
git clone <repository-url>
cd forko-social-network
\`\`\`

2. **Installation des dépendances**
\`\`\`bash
# Frontend et backend
npm run setup
\`\`\`

3. **Configuration MySQL**
\`\`\`bash
mysql -u root -p
CREATE DATABASE forko_social;
\`\`\`

4. **Configuration des variables d'environnement**

**Frontend (.env.local)**
\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

**Backend (server/.env)**
\`\`\`bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=forko_social
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:3000
PORT=3001
\`\`\`

5. **Initialiser la base de données**
\`\`\`bash
cd server
npm run init-db
\`\`\`

6. **Démarrer les serveurs**

**Option 1 : Démarrage simultané**
\`\`\`bash
npm run dev:full
\`\`\`

**Option 2 : Démarrage séparé**
\`\`\`bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
\`\`\`

## 🌐 URLs

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Health Check** : http://localhost:3001/health

## 👤 Comptes de test

- **Admin** : admin@forko-conseil.fr / admin123
- **Utilisateur** : emeline.lecourt@forko-conseil.fr / password123

## 📱 Fonctionnalités

- ✅ Authentification sécurisée (JWT + cookies)
- ✅ Feed d'actualités avec filtres
- ✅ Annuaire des consultants
- ✅ Messagerie privée temps réel
- ✅ Profils utilisateur
- ✅ Interface mobile-first
- ✅ Administration des utilisateurs

## 🛠️ Technologies

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Socket.IO Client

**Backend**
- Node.js + Express
- MySQL
- JWT Authentication
- Socket.IO
- bcryptjs

## 📁 Structure du projet

\`\`\`
forko-social-network/
├── app/                    # Pages Next.js
├── components/             # Composants React
├── lib/                   # Utilitaires et APIs
├── server/                # Backend Node.js
│   ├── routes/           # Routes API
│   ├── config/           # Configuration
│   └── scripts/          # Scripts utilitaires
├── .env.local            # Variables frontend
└── package.json          # Dépendances frontend
\`\`\`

## 🔧 Scripts disponibles

**Frontend**
\`\`\`bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Serveur production
npm run dev:full     # Frontend + Backend
npm run setup        # Installation complète
\`\`\`

**Backend**
\`\`\`bash
cd server
npm run dev          # Développement
npm start            # Production
npm run init-db      # Initialiser BDD
\`\`\`

## 🎨 Charte graphique

- **Couleurs principales** : 
  - Rose framboise : #FDC3DC
  - Vert clair : #187C71
  - Vert foncé : #04383F
- **Typographie** : Anton (titres) + Open Sans (texte)

## 🔒 Sécurité

- Authentification JWT avec cookies HttpOnly
- Middleware de protection des routes
- Rate limiting sur les APIs
- Validation des données
- Headers de sécurité (Helmet.js)

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.
