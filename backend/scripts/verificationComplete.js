const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config({ path: '.env.production' });

const API_URL = 'https://api.indebel.be/api';

async function verificationComplete() {
  console.log('\n🔍 VÉRIFICATION COMPLÈTE DU SYSTÈME INDEBEL\n');
  console.log('='.repeat(60));
  
  let connection;
  const resultats = {
    database: { ok: 0, errors: [] },
    api: { ok: 0, errors: [] },
    tables: { ok: 0, errors: [] },
    routes: { ok: 0, errors: [] }
  };

  try {
    // 1. VÉRIFICATION BASE DE DONNÉES
    console.log('\n📊 1. VÉRIFICATION BASE DE DONNÉES');
    console.log('-'.repeat(60));
    
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'indebel_user',
        password: process.env.DB_PASSWORD || 'indebel_pass',
        database: process.env.DB_NAME || 'indebel_bd'
      });
      console.log('✅ Connexion BDD réussie');
      resultats.database.ok++;
    } catch (error) {
      console.log('❌ Connexion BDD échouée:', error.message);
      resultats.database.errors.push(error.message);
      return;
    }

    // 2. VÉRIFICATION DES TABLES
    console.log('\n📋 2. VÉRIFICATION DES TABLES');
    console.log('-'.repeat(60));
    
    const tablesRequises = [
      'users', 'jobs', 'applications', 'missions', 'messages', 
      'notifications', 'support_tickets', 'support_responses',
      'forfaits', 'factures_forfaits', 'evaluations',
      'secteurs', 'competences', 'label_indebel', 'label_exceptional_requests',
      'pwa_installations', 'push_subscriptions'
    ];

    for (const table of tablesRequises) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table.padEnd(30)} → ${rows[0].count} lignes`);
        resultats.tables.ok++;
      } catch (error) {
        console.log(`❌ ${table.padEnd(30)} → ERREUR: ${error.message}`);
        resultats.tables.errors.push(`${table}: ${error.message}`);
      }
    }

    // 3. VÉRIFICATION COLONNES CRITIQUES
    console.log('\n🔧 3. VÉRIFICATION COLONNES USERS');
    console.log('-'.repeat(60));
    
    const colonnesUsers = [
      'description_entreprise', 'taille_entreprise', 'site_web', 'annee_creation',
      'secteur', 'competences', 'poste', 'experience', 'a_propos'
    ];

    const [columns] = await connection.query('DESCRIBE users');
    const existingColumns = columns.map(col => col.Field);
    
    for (const col of colonnesUsers) {
      if (existingColumns.includes(col)) {
        console.log(`✅ ${col}`);
      } else {
        console.log(`❌ ${col} MANQUANTE`);
        resultats.tables.errors.push(`Colonne manquante: ${col}`);
      }
    }

    // 4. VÉRIFICATION API
    console.log('\n🌐 4. VÉRIFICATION ROUTES API');
    console.log('-'.repeat(60));
    
    const routes = [
      { name: 'Health', url: `${API_URL}/health`, requiresAuth: false },
      { name: 'Secteurs (public)', url: `${API_URL}/secteurs/with-competences`, requiresAuth: false }
    ];

    for (const route of routes) {
      try {
        const response = await axios.get(route.url, { timeout: 5000 });
        if (response.status === 200) {
          console.log(`✅ ${route.name.padEnd(30)} → OK`);
          resultats.routes.ok++;
        } else {
          console.log(`⚠️  ${route.name.padEnd(30)} → Status ${response.status}`);
        }
      } catch (error) {
        if (error.response?.status === 401 && route.requiresAuth) {
          console.log(`✅ ${route.name.padEnd(30)} → Auth requise (normal)`);
          resultats.routes.ok++;
        } else {
          console.log(`❌ ${route.name.padEnd(30)} → ${error.message}`);
          resultats.routes.errors.push(`${route.name}: ${error.message}`);
        }
      }
    }

    // 5. VÉRIFICATION HEALTH
    console.log('\n💚 5. VÉRIFICATION HEALTH ENDPOINT');
    console.log('-'.repeat(60));
    
    try {
      const health = await axios.get(`${API_URL}/health`);
      console.log(`✅ Version: ${health.data.version}`);
      console.log(`✅ Modules: ${health.data.features.length}`);
      console.log(`\nModules actifs:`);
      health.data.features.forEach(f => console.log(`   - ${f}`));
      resultats.api.ok++;
    } catch (error) {
      console.log(`❌ Health endpoint: ${error.message}`);
      resultats.api.errors.push(error.message);
    }

    // 6. RÉSUMÉ
    console.log('\n\n📊 RÉSUMÉ DE LA VÉRIFICATION');
    console.log('='.repeat(60));
    
    const totalOk = resultats.database.ok + resultats.tables.ok + resultats.routes.ok + resultats.api.ok;
    const totalErrors = resultats.database.errors.length + resultats.tables.errors.length + 
                        resultats.routes.errors.length + resultats.api.errors.length;

    console.log(`\n✅ Tests réussis:  ${totalOk}`);
    console.log(`❌ Erreurs:        ${totalErrors}`);
    
    if (totalErrors > 0) {
      console.log('\n⚠️  ERREURS DÉTECTÉES:');
      [...resultats.database.errors, ...resultats.tables.errors, 
       ...resultats.routes.errors, ...resultats.api.errors].forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    if (totalErrors === 0) {
      console.log('🎊 SYSTÈME 100% OPÉRATIONNEL !');
    } else {
      console.log('⚠️  ATTENTION: Erreurs détectées ci-dessus');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Erreur globale:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verificationComplete();
