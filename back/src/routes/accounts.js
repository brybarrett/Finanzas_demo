const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('../models/database');
const auth = require('../middleware/auth');
const { CURRENCIES, DEFAULT_CURRENCY, isValidCurrency } = require('../utils/currencies');

const router = express.Router();
const db = new Database();

// Obtener todas las cuentas del usuario
router.get('/', auth, async (req, res) => {
  try {
    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    db.getDb().all(
      'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
      [req.user.id],
      (err, accounts) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }
        res.json(accounts);
      }
    );
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear nueva cuenta
router.post('/', [
  auth,
  body('name').isLength({ min: 1 }).trim().escape(),
  body('type').isIn(['checking', 'savings', 'credit', 'cash', 'investment']),
  body('balance').isFloat({ min: 0 }).optional(),
  body('currency').custom(value => {
    if (value && !isValidCurrency(value)) {
      throw new Error('Divisa no válida');
    }
    return true;
  }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, balance = 0, currency = DEFAULT_CURRENCY } = req.body;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    db.getDb().run(
      'INSERT INTO accounts (name, type, balance, currency, user_id) VALUES (?, ?, ?, ?, ?)',
      [name, type, balance, currency, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error al crear cuenta' });
        }

        // Obtener la cuenta creada
        db.getDb().get(
          'SELECT * FROM accounts WHERE id = ?',
          [this.lastID],
          (err, account) => {
            if (err) {
              return res.status(500).json({ message: 'Error al obtener cuenta' });
            }
            res.status(201).json(account);
          }
        );
      }
    );
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar cuenta
router.put('/:id', [
  auth,
  body('name').isLength({ min: 1 }).trim().escape().optional(),
  body('type').isIn(['checking', 'savings', 'credit', 'cash', 'investment']).optional(),
  body('balance').isFloat().optional(),
  body('currency').custom(value => {
    if (value && !isValidCurrency(value)) {
      throw new Error('Divisa no válida');
    }
    return true;
  }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Verificar que la cuenta pertenece al usuario
    db.getDb().get(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, account) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        if (!account) {
          return res.status(404).json({ message: 'Cuenta no encontrada' });
        }

        // Construir query de actualización
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(new Date().toISOString());
        values.push(id);

        db.getDb().run(
          `UPDATE accounts SET ${setClause}, updated_at = ? WHERE id = ?`,
          values,
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error al actualizar cuenta' });
            }

            // Obtener cuenta actualizada
            db.getDb().get(
              'SELECT * FROM accounts WHERE id = ?',
              [id],
              (err, updatedAccount) => {
                if (err) {
                  return res.status(500).json({ message: 'Error al obtener cuenta actualizada' });
                }
                res.json(updatedAccount);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar cuenta (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Verificar que la cuenta pertenece al usuario
    db.getDb().get(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, account) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        if (!account) {
          return res.status(404).json({ message: 'Cuenta no encontrada' });
        }

        // Soft delete
        db.getDb().run(
          'UPDATE accounts SET is_active = 0, updated_at = ? WHERE id = ?',
          [new Date().toISOString(), id],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error al eliminar cuenta' });
            }
            res.json({ message: 'Cuenta eliminada exitosamente' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener resumen de cuentas
router.get('/summary', auth, async (req, res) => {
  try {
    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    db.getDb().get(
      `SELECT 
        COUNT(*) as total_accounts,
        SUM(CASE WHEN type IN ('checking', 'savings', 'cash') THEN balance ELSE 0 END) as total_assets,
        SUM(CASE WHEN type = 'credit' THEN balance ELSE 0 END) as total_liabilities,
        SUM(balance) as net_worth
       FROM accounts 
       WHERE user_id = ? AND is_active = 1`,
      [req.user.id],
      (err, summary) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }
        res.json(summary);
      }
    );
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener divisas disponibles
router.get('/currencies', (req, res) => {
  try {
    res.json({
      currencies: CURRENCIES,
      default: DEFAULT_CURRENCY
    });
  } catch (error) {
    console.error('Error al obtener divisas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
