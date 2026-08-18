const { execSync } = require('child_process');

function getLocalIp() {
  try {
    // hostname -I retourne les IP séparées par des espaces. La première est généralement l'IP réseau (LAN).
    const output = execSync('hostname -I', { encoding: 'utf8' });
    const ips = output.trim().split(' ');
    // On cherche une IP de réseau local typique (192.168.x.x, 10.x.x.x, 172.x.x.x)
    const bestIp = ips.find(ip => ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) || ips[0];
    return bestIp.trim();
  } catch (error) {
    return '192.168.0.199'; // Fallback
  }
}

const ip = getLocalIp();
console.log('🚀 Démarrage de Expo sur la vraie IP Wi-Fi détectée :', ip);

process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;

// Lancer expo sans vérifier les mises à jour pour éviter l'erreur fetch
execSync('npx expo start -c --offline', { stdio: 'inherit' });
