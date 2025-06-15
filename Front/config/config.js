// config/config.js - Configuration centralisée

// ================================
// CONFIGURATION API
// ================================

// 📱 Pour React Native, vous devez utiliser l'IP de votre machine
// Voici comment trouver votre IP :

// Windows: Ouvrir cmd et taper "ipconfig"
// Mac/Linux: Ouvrir terminal et taper "ifconfig" ou "ip addr show"
// Chercher votre adresse IPv4 locale (généralement 192.168.x.x ou 10.x.x.x)

const API_CONFIG = {
  // 🔧 Modifiez cette IP selon votre configuration
  HOST: '192.168.1.193', // ✅ Remplacez par l'IP de votre machine
  PORT: '3001',           // ✅ Port de votre backend
  
  // ⚠️ NE PAS utiliser localhost car ça ne fonctionne pas sur mobile
  // localhost: '127.0.0.1' ne fonctionne que sur la même machine
  
  get BASE_URL() {
    return `http://${this.HOST}:${this.PORT}/api`;
  },
  
  // Timeout pour les requêtes API
  TIMEOUT: 10000, // 10 secondes
};

// ================================
// CONFIGURATION DE DÉVELOPPEMENT
// ================================

const DEV_CONFIG = {
  // Activer les logs de debug
  DEBUG_API: true,
  
  // Logs réseau détaillés
  LOG_REQUESTS: true,
  
  // Gestion des erreurs en mode dev
  SHOW_ERROR_DETAILS: true,
};

// ================================
// EXPORT
// ================================

export { API_CONFIG, DEV_CONFIG };

// Exemple d'utilisation :
// import { API_CONFIG } from './config/config';
// console.log('URL API:', API_CONFIG.BASE_URL);

// ================================
// NOTES IMPORTANTES
// ================================

/*
🔍 Comment trouver votre IP :

1. Windows :
   - Ouvrir l'invite de commande (cmd)
   - Taper : ipconfig
   - Chercher "Adresse IPv4" dans la section WiFi ou Ethernet

2. Mac :
   - Ouvrir le Terminal
   - Taper : ifconfig en0 | grep inet
   - Ou aller dans Préférences Système > Réseau

3. Linux :
   - Ouvrir le Terminal
   - Taper : ip addr show
   - Ou : hostname -I

4. Autre méthode (tous OS) :
   - Aller sur https://whatismyipaddress.com/
   - Mais utiliser l'IP locale, pas l'IP publique

📱 Problèmes fréquents :

1. "Network Error" ou "Connection refused" :
   - Vérifiez que votre backend est démarré
   - Vérifiez que l'IP et le port sont corrects
   - Vérifiez que le firewall n'bloque pas la connexion

2. "ERR_NETWORK_CHANGED" :
   - L'IP de votre machine a changé
   - Redémarrez votre backend
   - Vérifiez votre connexion WiFi

3. "timeout" :
   - Augmentez la valeur TIMEOUT
   - Vérifiez la performance de votre réseau

4. CORS errors :
   - Configurez CORS dans votre backend Express
   - Autorisez les requêtes depuis l'IP de votre appareil

🔧 Configuration backend Express recommandée :

app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.193:*'],
  credentials: true
}));

app.listen(3001, '0.0.0.0', () => {
  console.log('Backend démarré sur http://0.0.0.0:3001');
});
*/