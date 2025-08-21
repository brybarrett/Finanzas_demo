const jwt = require('jsonwebtoken');
const Database = require('../models/database');

const db = new Database();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No hay token, acceso denegado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe en la base de datos
    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }
    
    db.getDb().get(
      'SELECT id, username, email, first_name, last_name, score FROM users WHERE id = ?',
      [decoded.userId],
      (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }
        
        if (!user) {
          return res.status(401).json({ message: 'Token no válido' });
        }
        
        req.user = user;
        next();
      }
    );
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({ message: 'Token no válido' });
  }
};

module.exports = auth;
