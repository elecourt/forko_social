# Forko Conseil - Backend API

Backend Node.js/Express pour le réseau social interne de Forko Conseil.

## 🚀 Installation

1. **Installer les dépendances**
\`\`\`bash
cd server
npm install
\`\`\`

2. **Configuration de la base de données MySQL**
\`\`\`bash
# Créer la base de données
mysql -u root -p
CREATE DATABASE forko_social;
\`\`\`

3. **Configuration des variables d'environnement**
\`\`\`bash
cp .env.example .env
# Modifier les valeurs dans .env
\`\`\`

4. **Initialiser la base de données**
\`\`\`bash
npm run init-db
\`\`\`

5. **Démarrer le serveur**
\`\`\`bash
# Développement
npm run dev

# Production
npm start
\`\`\`

## 📊 Structure de la base de données

### Tables principales :
- **users** : Utilisateurs (consultants)
- **posts** : Publications du feed
- **post_likes** : Likes sur les publications
- **comments** : Commentaires sur les publications
- **conversations** : Conversations privées
- **conversation_participants** : Participants aux conversations
- **messages** : Messages privés

## 🔐 Authentification

- **JWT tokens** stockés dans des cookies HttpOnly
- **Middleware d'authentification** pour toutes les routes protégées
- **Rôles utilisateur** : Admin et utilisateur standard

## 📡 API Endpoints

### Authentification
- `POST /auth/login` - Connexion
- `GET /auth/me` - Utilisateur actuel
- `POST /auth/logout` - Déconnexion

### Utilisateurs
- `GET /users` - Liste des utilisateurs
- `GET /users/:id` - Détails d'un utilisateur
- `POST /users` - Créer un utilisateur (admin)
- `PUT /users/:id` - Modifier un utilisateur

### Publications
- `GET /posts` - Feed des publications
- `POST /posts` - Créer une publication
- `POST /posts/:id/like` - Liker/unliker
- `POST /posts/:id/comments` - Ajouter un commentaire

### Messagerie
- `GET /conversations` - Conversations de l'utilisateur
- `GET /conversations/:id/messages` - Messages d'une conversation
- `POST /messages` - Envoyer un message

## 🔌 Socket.IO

Fonctionnalités temps réel :
- **Messages instantanés**
- **Indicateurs de frappe**
- **Notifications en temps réel**

## 👤 Comptes de test

Après l'initialisation :
- **Admin** : admin@forko-conseil.fr / admin123
- **Test** : emeline.lecourt@forko-conseil.fr / password123

## 🛡️ Sécurité

- **Helmet.js** pour les headers de sécurité
- **Rate limiting** pour prévenir les abus
- **CORS** configuré pour le frontend
- **Validation des données** sur toutes les routes
- **Hashage bcrypt** pour les mots de passe

## 📝 Logs

Le serveur log automatiquement :
- Connexions/déconnexions Socket.IO
- Erreurs serveur
- Requêtes API importantes

## 🔧 Configuration

Variables d'environnement importantes :
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` : Configuration MySQL
- `JWT_SECRET` : Clé secrète JWT (à changer en production)
- `FRONTEND_URL` : URL du frontend pour CORS
- `NODE_ENV` : Environment (development/production)
