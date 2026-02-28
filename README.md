# Indebel - Freelancer Job Platform

Indebel est une plateforme de mise en relation entre freelances (Auto-entrepreneurs) et entreprises en Belgique. Elle permet la publication de missions, la recherche d'adresses via Mapbox, et la gestion des paiements via Stripe.

## 🚀 Fonctionnalités

- **Authentification Sécurisée** : Inscription et connexion pour Recruteurs et Indépendants (JWT).
- **Gestion des Missions** : Publication, recherche et candidature aux missions.
- **Recherche d'Adresse** : Intégration de Mapbox pour une autocomplétion précise des adresses en Belgique.
- **Paiements via Stripe** : Gestion des abonnements et des transactions.
- **Génération de PDF** : Création automatique de factures et documents (PDFKit).
- **Interface Moderne** : UI/UX premium construite avec React, TailwindCSS et Lucide React.

## 🛠️ Stack Technique

### Backend
- **Core** : Node.js, Express.js
- **Base de données** : MySQL (mysql2)
- **Sécurité** : JWT (jsonwebtoken), Bcryptjs, Helmet, Express-rate-limit
- **Services** : Stripe (Paiements), Nodemailer (Emails), PDFKit (Génération PDF)
- **Développement** : Nodemon

### Frontend
- **Framework** : React (Vite)
- **Styling** : TailwindCSS, PostCSS
- **Cartographie** : Mapbox (react-map-gl)
- **State/Forms** : Formik, Yup, React Router
- **Charts** : Recharts

## 📥 Installation

### Prérequis
- Node.js (v18+)
- MySQL
- Clés API Mapbox et Stripe

### Backend
1. Naviguer dans le dossier backend :
   ```bash
   cd backend
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer le fichier `.env` (voir `.env.example`).
4. Démarrer le serveur :
   ```bash
   npm run dev
   ```

### Frontend
1. Naviguer dans le dossier frontend :
   ```bash
   cd frontend
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer le fichier `.env` (voir `.env.example`).
4. Démarrer l'application :
   ```bash
   npm run dev
   ```

## 🔐 Sécurité

Les clés API Stripe et Mapbox ont été retirées de l'historique Git par sécurité. Assurez-vous d'utiliser vos propres tokens dans les fichiers `.env` locaux.

## 📝 Licence

Ce projet est sous licence MIT.
