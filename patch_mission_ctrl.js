const fs = require('fs');
const file = 'backend/controllers/missionController.js';
let content = fs.readFileSync(file, 'utf8');

// The getAllMissions is probably fetching from missions_forfait_horaire and missions_forfait_fixe
// We need to find getAllMissions
const getMissionsRegex = /exports\.getAllMissions\s*=\s*async\s*\(req,\s*res\)\s*=>\s*\{([\s\S]*?)res\.json/g;

// Let's modify the file properly. I'll just write a script to inject the filter into both queries inside getAllMissions.
// Let's first read the file to see how it's structured.
