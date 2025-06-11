const mysql = require('mysql2');

// Création du pool de connexions
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promisify pour utiliser async/await
const promisePool = pool.promise();

// Test de connexion
const testConnection = async () => {
  try {
    const [rows] = await promisePool.execute('SELECT 1');
    console.log('✅ Base de données connectée');
  } catch (error) {
    console.error('❌ Erreur connexion DB:', error.message);
  }
};

testConnection();

module.exports = promisePool;