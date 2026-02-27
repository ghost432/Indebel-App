# Images du Projet Indebel

## 📁 Emplacement : `/frontend/public/images/`

Placez vos fichiers images dans ce dossier.

## 🖼️ Fichiers requis

### 1. logo.png
- **Description** : Logo principal d'Indebel
- **Utilisation** : 
  - Navbar (toutes les pages)
  - Page Login
  - Page Register Freelancer
  - Page Register Employer
  - Page Account Type
  - Page Forgot Password
- **Dimensions recommandées** : 200x80px ou format similaire
- **Format** : PNG avec fond transparent

### 2. favicon.png
- **Description** : Icône du navigateur
- **Utilisation** : Onglet du navigateur
- **Dimensions** : 32x32px ou 64x64px
- **Format** : PNG

## 🔧 Comment ajouter les images

1. Copiez vos fichiers `logo.png` et `favicon.png` dans ce dossier
2. Les chemins sont déjà configurés :
   - Logo : `/images/logo.png`
   - Favicon : `/images/favicon.png`
3. Redémarrez le serveur Vite si nécessaire
4. Actualisez votre navigateur

## ⚠️ Important

Dans Vite, les fichiers du dossier `public/` sont servis à la racine.
- ✅ Correct : `<img src="/images/logo.png" />`
- ❌ Incorrect : `<img src="/public/images/logo.png" />`

## 🎨 Si vous n'avez pas encore les images

Une icône de fallback (Briefcase) s'affichera automatiquement dans la Navbar si le logo n'est pas trouvé.
