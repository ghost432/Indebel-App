# 📧 Configuration Email - Label Indebel

## 🎯 **Vue d'ensemble**

Ce document décrit la configuration complète des emails envoyés pour le système de labels Indebel.

## 📋 **Types d'emails pour le Label**

### 1. **Email d'approbation du label**
- **Template**: `labelApproved`
- **Déclencheur**: Quand un label est approuvé (manuellement ou automatiquement)
- **Destinataires**: Utilisateurs avec label `accepte`

#### Contenu de l'email:
- **Sujet**: 🎉 Félicitations ! Votre Label Indebel est approuvé
- **Design**: Header vert avec félicitations
- **Sections**:
  - Message de félicitations personnel
  - Confirmation que le label est actif
  - Liste des bénéfices du label
  - Bouton pour voir le profil
  - Contact support

### 2. **Email de refus du label**
- **Template**: `labelRejected`
- **Déclencheur**: Quand une demande de label est refusée
- **Destinataires**: Utilisateurs avec demande refusée

#### Contenu de l'email:
- **Sujet**: 📋 Informations concernant votre demande de Label Indebel
- **Design**: Header rouge informatif
- **Sections**:
  - Message de refus poli
  - Motif du refus (si fourni)
  - Guide pour améliorer l'éligibilité
  - Bouton pour vérifier l'éligibilité

### 3. **Email d'éligibilité**
- **Déclencheur**: Quand un utilisateur devient éligible
- **Destinataires**: Utilisateurs éligibles sans demande

## 🔧 **Configuration SMTP**

### Paramètres Hostinger:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: 'noreply@indebel.be',
    pass: 'BelgiqueDreambis@272829',
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

### Variables d'environnement:
- `FRONTEND_URL`: URL du frontend pour les liens dans les emails
- `NODE_ENV`: Environnement (development/production)

## 📬 **Points d'envoi dans le code**

### 1. **Controller labelController.js**
```javascript
// Dans repondreLabel() - ligne 374-390
if (accepte && user) {
  const emailConfig = emailTemplates.labelApproved(user.prenom, user.nom, user.email);
  await sendEmail(emailConfig);
}

// Dans repondreLabel() - ligne 392-408  
if (!accepte && user) {
  const emailConfig = emailTemplates.labelRejected(user.prenom, user.nom, user.email, reason);
  await sendEmail(emailConfig);
}
```

### 2. **Envoi aux utilisateurs existants**
Script pour envoyer aux utilisateurs avec label déjà approuvé:
```bash
node scripts/send-label-approval-emails.js
```

## 📊 **Statistiques des emails envoyés**

### Emails déjà envoyés (29/11/2025):
- ✅ **thierryninja237@gmail.com** (User ID: 8) - Label approuvé
- ✅ **admin@indebel.com** (User ID: 1) - Label approuvé

### Total: 2 emails envoyés avec succès

## 🎨 **Templates disponibles**

### Template labelApproved:
- **Personnalisation**: `{prenom}`, `{nom}`
- **Liens**: Profil utilisateur avec label
- **Couleurs**: Vert (#16a34a, #22c55e)
- **Images**: Aucune (texte uniquement)

### Template labelRejected:
- **Personnalisation**: `{prenom}`, `{nom}`, `{reason}`
- **Liens**: Page d'éligibilité
- **Couleurs**: Rouge (#dc2626, #ef4444)
- **Sections**: Motif + amélioration

## 🔄 **Workflow complet**

### 1. **Demande de label**
```
Utilisateur éligible → Demande → Email aux admins → Décision admin → Email utilisateur
```

### 2. **Approbation automatique**
```
Critères remplis → Label accordé → Email approbation → Badge affiché
```

### 3. **Refus**
```
Critères non remplis → Refus → Email refus + améliorations → Nouvelle demande possible
```

## 📝 **Logs et monitoring**

### Logs d'envoi:
```javascript
console.log('✅ Email d\'approbation envoyé à:', user.email);
console.log('✅ Email de refus envoyé à:', user.email);
```

### Gestion des erreurs:
```javascript
try {
  await sendEmail(emailConfig);
} catch (emailError) {
  console.error('❌ Erreur envoi email:', emailError);
}
```

## 🚀 **Tests et validation**

### Test des templates:
```bash
node -e "require('./config/email').emailTemplates.labelApproved('Test', 'User', 'test@example.com')"
```

### Test d'envoi:
```bash
node scripts/test-email-sending.js
```

## 📞 **Support**

### En cas de problème:
1. Vérifier la configuration SMTP
2. Consulter les logs d'envoi
3. Tester avec un email de test
4. Contacter l'équipe technique

### Contact support:
- **Email**: support@indebel.be
- **Documentation**: `/backend/docs/email-configuration-label.md`

---

*Document mis à jour le 29/11/2025*
