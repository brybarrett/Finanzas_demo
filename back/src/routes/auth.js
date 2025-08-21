const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Database = require('../models/database');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new Database();

// Registrar usuario
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').optional().trim().escape(),
  body('last_name').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, first_name, last_name } = req.body;

    // Verificar si el usuario ya existe
    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    db.getDb().get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        if (existingUser) {
          return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Crear usuario
        db.getDb().run(
          'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
          [username, email, password_hash, first_name || '', last_name || ''],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error al crear usuario' });
            }

            // Generar token
            const token = jwt.sign(
              { userId: this.lastID },
              process.env.JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRE }
            );

            res.status(201).json({
              message: 'Usuario creado exitosamente',
              token,
              user: {
                id: this.lastID,
                username,
                email,
                first_name: first_name || '',
                last_name: last_name || ''
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Iniciar sesión
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    db.getDb().get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        if (!user) {
          return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Generar token
        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
          message: 'Inicio de sesión exitoso',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            score: user.score
          }
        });
      }
    );
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener usuario actual
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
