// Back/middleware/auth.js - Version de diagnostic complète

const jwt = require('jsonwebtoken');

// Middleware d'authentification avec diagnostic détaillé
const authenticateToken = (req, res, next) => {
  console.log('\n🔍 === DIAGNOSTIC AUTHENTIFICATION ===');
  console.log('📡 Route appelée:', req.method, req.originalUrl);
  console.log('🔑 Headers reçus:', {
    authorization: req.headers.authorization ? 'Présent' : 'Absent',
    contentType: req.headers['content-type'],
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
  });
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ ÉCHEC: Aucun token fourni');
    console.log('📋 authHeader:', authHeader);
    return res.status(401).json({ 
      error: 'DIAGNOSTIC_AUTH',
      message: 'Token manquant',
      received: { authHeader }
    });
  }

  console.log('🔑 Token reçu (premiers caractères):', token.substring(0, 20) + '...');
  console.log('🔑 JWT_SECRET présent:', !!process.env.JWT_SECRET);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ ÉCHEC: Token invalide');
      console.log('📋 Erreur JWT:', {
        name: err.name,
        message: err.message,
        expiredAt: err.expiredAt
      });
      return res.status(403).json({ 
        error: 'DIAGNOSTIC_TOKEN',
        message: 'Token invalide',
        details: err.message
      });
    }
    
    console.log('✅ Token valide décodé:');
    console.log('📋 Données utilisateur:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      iat: new Date(decoded.iat * 1000).toLocaleString(),
      exp: new Date(decoded.exp * 1000).toLocaleString()
    });
    
    req.user = decoded;
    console.log('✅ req.user défini, passage au middleware suivant');
    next();
  });
};

// Middleware de vérification des rôles avec diagnostic détaillé
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log('\n🔍 === DIAGNOSTIC AUTORISATION ===');
    console.log('🎯 Rôles autorisés:', allowedRoles);
    console.log('👤 req.user présent:', !!req.user);
    
    if (!req.user) {
      console.log('❌ ÉCHEC: req.user non défini');
      return res.status(401).json({ 
        error: 'DIAGNOSTIC_USER',
        message: 'Utilisateur non authentifié',
        details: 'req.user est undefined'
      });
    }

    console.log('👤 Utilisateur connecté:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    console.log('🔍 Vérification du rôle:');
    console.log('  - Rôle utilisateur:', `"${req.user.role}"`);
    console.log('  - Type du rôle:', typeof req.user.role);
    console.log('  - Rôles autorisés:', allowedRoles.map(r => `"${r}"`));
    console.log('  - Types autorisés:', allowedRoles.map(r => typeof r));

    // Vérification détaillée
    const userRole = req.user.role;
    const isAllowed = allowedRoles.includes(userRole);
    
    console.log('🔍 Test d\'inclusion:');
    allowedRoles.forEach(role => {
      const matches = role === userRole;
      console.log(`  - "${role}" === "${userRole}": ${matches}`);
    });
    
    console.log('✅ Résultat final: allowedRoles.includes(userRole) =', isAllowed);

    if (!isAllowed) {
      console.log('❌ ÉCHEC: Rôle non autorisé');
      console.log('📋 Détails de l\'échec:', {
        userRole: userRole,
        allowedRoles: allowedRoles,
        comparison: allowedRoles.map(role => ({ role, matches: role === userRole }))
      });
      
      return res.status(403).json({ 
        error: 'DIAGNOSTIC_ROLE',
        message: `Accès refusé pour le rôle "${userRole}"`,
        details: {
          userRole: userRole,
          allowedRoles: allowedRoles,
          userRoleType: typeof userRole,
          allowedRoleTypes: allowedRoles.map(r => typeof r)
        }
      });
    }

    console.log('✅ SUCCÈS: Accès autorisé pour le rôle:', userRole);
    console.log('🎉 Passage au contrôleur\n');
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};