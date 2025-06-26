# Configuration de la base de données MySQL

## 🔧 Étapes de configuration

### 1. Vérifier MySQL
Assurez-vous que MySQL est installé et démarré :

**Windows :**
\`\`\`bash
# Vérifier si MySQL est installé
mysql --version

# Démarrer MySQL (si installé via XAMPP)
# Ouvrir XAMPP Control Panel et démarrer MySQL

# Démarrer MySQL (si installé directement)
net start mysql
\`\`\`

**macOS :**
\`\`\`bash
# Avec Homebrew
brew services start mysql

# Ou via les Préférences Système > MySQL
\`\`\`

**Linux :**
\`\`\`bash
sudo systemctl start mysql
sudo systemctl enable mysql
\`\`\`

### 2. Tester la connexion MySQL
\`\`\`bash
# Se connecter à MySQL
mysql -u root -p

# Si pas de mot de passe
mysql -u root
\`\`\`

### 3. Configurer le fichier .env
Copiez le fichier `.env` et modifiez les valeurs selon votre configuration :

\`\`\`env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=forko_social
\`\`\`

### 4. Créer la base de données
\`\`\`bash
# Option 1 : Via le script
npm run setup-db

# Option 2 : Manuellement via MySQL
mysql -u root -p
CREATE DATABASE forko_social;
exit
\`\`\`

### 5. Initialiser les tables et données
\`\`\`bash
npm run init-db
\`\`\`

## 🚨 Résolution des problèmes courants

### Erreur "Access denied"
1. Vérifiez votre mot de passe MySQL
2. Modifiez `DB_PASSWORD` dans `.env`
3. Si pas de mot de passe, laissez vide : `DB_PASSWORD=`

### Erreur "Connection refused"
1. Vérifiez que MySQL est démarré
2. Vérifiez le port (par défaut 3306)
3. Vérifiez `DB_HOST` dans `.env`

### MySQL non installé
**Windows :**
- Installer XAMPP : https://www.apachefriends.org/
- Ou MySQL Workbench : https://dev.mysql.com/downloads/workbench/

**macOS :**
\`\`\`bash
brew install mysql
brew services start mysql
\`\`\`

**Linux :**
\`\`\`bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
\`\`\`

## 🔄 Scripts disponibles

\`\`\`bash
npm run setup-db    # Créer la base de données
npm run init-db     # Créer les tables et données de test
npm run reset-db    # Supprimer toutes les tables
npm run dev         # Démarrer le serveur
\`\`\`

## 👤 Comptes créés automatiquement

Après `npm run init-db` :
- **Admin** : admin@forko-conseil.fr / admin123
- **Test** : emeline.lecourt@forko-conseil.fr / password123
