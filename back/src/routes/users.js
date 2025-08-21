const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('../models/database');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new Database();

// Calcular y actualizar puntuación del usuario
const calculateUserScore = async (userId) => {
  return new Promise((resolve, reject) => {
    const dbInstance = db.getDb();
    
    // Obtener datos del último mes
    const query = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthly_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthly_expenses,
        COUNT(DISTINCT DATE(date)) as active_days,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE user_id = ? AND date >= date('now', '-30 days')
    `;

    dbInstance.get(query, [userId], (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const { monthly_income = 0, monthly_expenses = 0, active_days = 0, total_transactions = 0 } = result;

      // Calcular métricas
      const savings_rate = monthly_income > 0 ? ((monthly_income - monthly_expenses) / monthly_income) * 100 : 0;
      const expense_ratio = monthly_income > 0 ? (monthly_expenses / monthly_income) * 100 : 100;
      const consistency_score = (active_days / 30) * 100; // Actividad en los últimos 30 días

      // Calcular puntuación (0-1000 puntos)
      let score = 0;

      // Puntos por tasa de ahorro (0-400 puntos)
      if (savings_rate >= 30) score += 400;
      else if (savings_rate >= 20) score += 300;
      else if (savings_rate >= 10) score += 200;
      else if (savings_rate >= 0) score += 100;

      // Puntos por control de gastos (0-300 puntos)
      if (expense_ratio <= 50) score += 300;
      else if (expense_ratio <= 70) score += 200;
      else if (expense_ratio <= 90) score += 100;

      // Puntos por consistencia (0-200 puntos)
      score += Math.floor(consistency_score * 2);

      // Puntos por número de transacciones (0-100 puntos)
      if (total_transactions >= 30) score += 100;
      else if (total_transactions >= 20) score += 75;
      else if (total_transactions >= 10) score += 50;
      else if (total_transactions >= 5) score += 25;

      // Actualizar puntuación del usuario
      dbInstance.run(
        'UPDATE users SET score = ?, updated_at = ? WHERE id = ?',
        [Math.min(score, 1000), new Date().toISOString(), userId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              score: Math.min(score, 1000),
              savings_rate: Math.round(savings_rate * 100) / 100,
              expense_ratio: Math.round(expense_ratio * 100) / 100,
              consistency_score: Math.round(consistency_score * 100) / 100,
              monthly_income,
              monthly_expenses,
              active_days,
              total_transactions
            });
          }
        }
      );
    });
  });
};

// Obtener perfil del usuario
router.get('/profile', auth, async (req, res) => {
  try {
    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Calcular puntuación actualizada
    const scoreData = await calculateUserScore(req.user.id);

    // Obtener datos adicionales del usuario
    dbInstance.get(
      `SELECT 
        u.*,
        COUNT(DISTINCT a.id) as total_accounts,
        COUNT(DISTINCT t.id) as total_transactions,
        SUM(CASE WHEN a.type IN ('checking', 'savings', 'cash') THEN a.balance ELSE 0 END) as net_worth
       FROM users u
       LEFT JOIN accounts a ON u.id = a.user_id AND a.is_active = 1
       LEFT JOIN transactions t ON u.id = t.user_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.user.id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        res.json({
          ...user,
          password_hash: undefined, // No enviar hash de contraseña
          score_details: scoreData
        });
      }
    );
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar perfil del usuario
router.put('/profile', [
  auth,
  body('first_name').optional().trim().escape(),
  body('last_name').optional().trim().escape(),
  body('username').optional().isLength({ min: 3 }).trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Si se quiere cambiar username, verificar que no existe
    if (updates.username) {
      dbInstance.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [updates.username, req.user.id],
        (err, existingUser) => {
          if (err) {
            return res.status(500).json({ message: 'Error del servidor' });
          }

          if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya existe' });
          }

          updateUser();
        }
      );
    } else {
      updateUser();
    }

    function updateUser() {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(new Date().toISOString());
      values.push(req.user.id);

      dbInstance.run(
        `UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error al actualizar perfil' });
          }

          // Obtener usuario actualizado
          dbInstance.get(
            'SELECT id, username, email, first_name, last_name, score FROM users WHERE id = ?',
            [req.user.id],
            (err, user) => {
              if (err) {
                return res.status(500).json({ message: 'Error al obtener usuario actualizado' });
              }
              res.json(user);
            }
          );
        }
      );
    }
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener ranking de usuarios
router.get('/ranking', auth, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Primero actualizar todas las puntuaciones (esto se podría hacer con un cron job en producción)
    dbInstance.all('SELECT id FROM users', [], async (err, users) => {
      if (err) {
        return res.status(500).json({ message: 'Error del servidor' });
      }

      // Obtener ranking actualizado
      dbInstance.all(
        `SELECT 
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          u.score,
          ROW_NUMBER() OVER (ORDER BY u.score DESC, u.updated_at ASC) as rank_position,
          CASE WHEN u.id = ? THEN 1 ELSE 0 END as is_current_user
         FROM users u
         ORDER BY u.score DESC, u.updated_at ASC
         LIMIT ? OFFSET ?`,
        [req.user.id, parseInt(limit), offset],
        (err, ranking) => {
          if (err) {
            return res.status(500).json({ message: 'Error del servidor' });
          }

          // Obtener posición del usuario actual si no está en la página actual
          dbInstance.get(
            `SELECT 
              COUNT(*) + 1 as user_position
             FROM users 
             WHERE score > (SELECT score FROM users WHERE id = ?)
                OR (score = (SELECT score FROM users WHERE id = ?) 
                    AND updated_at < (SELECT updated_at FROM users WHERE id = ?))`,
            [req.user.id, req.user.id, req.user.id],
            (err, userPosition) => {
              if (err) {
                return res.status(500).json({ message: 'Error del servidor' });
              }

              res.json({
                ranking,
                current_user_position: userPosition.user_position,
                pagination: {
                  page: parseInt(page),
                  limit: parseInt(limit)
                }
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener comparación con otros usuarios
router.get('/compare', auth, async (req, res) => {
  try {
    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Calcular estadísticas del usuario actual
    const userStats = await calculateUserScore(req.user.id);

    // Obtener estadísticas promedio de todos los usuarios
    dbInstance.get(
      `SELECT 
        AVG(score) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score,
        COUNT(*) as total_users
       FROM users
       WHERE score > 0`,
      [],
      (err, globalStats) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        // Obtener posición del usuario
        dbInstance.get(
          `SELECT 
            COUNT(*) + 1 as position,
            (SELECT COUNT(*) FROM users WHERE score > 0) as total_users
           FROM users 
           WHERE score > (SELECT score FROM users WHERE id = ?)
              OR (score = (SELECT score FROM users WHERE id = ?) 
                  AND updated_at < (SELECT updated_at FROM users WHERE id = ?))`,
          [req.user.id, req.user.id, req.user.id],
          (err, position) => {
            if (err) {
              return res.status(500).json({ message: 'Error del servidor' });
            }

            const percentile = ((position.total_users - position.position + 1) / position.total_users) * 100;

            res.json({
              user_stats: userStats,
              global_stats: globalStats,
              position: position.position,
              total_users: position.total_users,
              percentile: Math.round(percentile * 100) / 100
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error al obtener comparación:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Recalcular puntuación manualmente
router.post('/recalculate-score', auth, async (req, res) => {
  try {
    const scoreData = await calculateUserScore(req.user.id);
    res.json({
      message: 'Puntuación recalculada exitosamente',
      score_details: scoreData
    });
  } catch (error) {
    console.error('Error al recalcular puntuación:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
