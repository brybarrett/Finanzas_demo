const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('../models/database');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new Database();

// Obtener todas las categorías (predeterminadas + del usuario)
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    let whereClause = 'WHERE (is_default = 1 OR user_id = ?)';
    let params = [req.user.id];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    db.getDb().all(
      `SELECT * FROM categories ${whereClause} ORDER BY is_default DESC, name ASC`,
      params,
      (err, categories) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }
        res.json(categories);
      }
    );
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear nueva categoría
router.post('/', [
  auth,
  body('name').isLength({ min: 1 }).trim().escape(),
  body('type').isIn(['income', 'expense']),
  body('color').isLength({ min: 4, max: 7 }).optional(),
  body('icon').isLength({ min: 1 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, color = '#007bff', icon = 'folder' } = req.body;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Verificar que no existe una categoría con el mismo nombre para el usuario
    db.getDb().get(
      'SELECT id FROM categories WHERE name = ? AND (user_id = ? OR is_default = 1) AND type = ?',
      [name, req.user.id, type],
      (err, existingCategory) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        if (existingCategory) {
          return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
        }

        db.getDb().run(
          'INSERT INTO categories (name, type, color, icon, user_id) VALUES (?, ?, ?, ?, ?)',
          [name, type, color, icon, req.user.id],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error al crear categoría' });
            }

            // Obtener la categoría creada
            db.getDb().get(
              'SELECT * FROM categories WHERE id = ?',
              [this.lastID],
              (err, category) => {
                if (err) {
                  return res.status(500).json({ message: 'Error al obtener categoría' });
                }
                res.status(201).json(category);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar categoría
router.put('/:id', [
  auth,
  body('name').isLength({ min: 1 }).trim().escape().optional(),
  body('type').isIn(['income', 'expense']).optional(),
  body('color').isLength({ min: 4, max: 7 }).optional(),
  body('icon').isLength({ min: 1 }).optional()
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

    // Verificar que la categoría pertenece al usuario (no puede editar las predeterminadas)
    db.getDb().get(
      'SELECT * FROM categories WHERE id = ? AND user_id = ? AND is_default = 0',
      [id, req.user.id],
      (err, category) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        if (!category) {
          return res.status(404).json({ message: 'Categoría no encontrada o no se puede editar' });
        }

        // Construir query de actualización
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);

        db.getDb().run(
          `UPDATE categories SET ${setClause} WHERE id = ?`,
          values,
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error al actualizar categoría' });
            }

            // Obtener categoría actualizada
            db.getDb().get(
              'SELECT * FROM categories WHERE id = ?',
              [id],
              (err, updatedCategory) => {
                if (err) {
                  return res.status(500).json({ message: 'Error al obtener categoría actualizada' });
                }
                res.json(updatedCategory);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar categoría
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Verificar que la categoría pertenece al usuario (no puede eliminar las predeterminadas)
    db.getDb().get(
      'SELECT * FROM categories WHERE id = ? AND user_id = ? AND is_default = 0',
      [id, req.user.id],
      (err, category) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        if (!category) {
          return res.status(404).json({ message: 'Categoría no encontrada o no se puede eliminar' });
        }

        // Verificar si hay transacciones usando esta categoría
        db.getDb().get(
          'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
          [id],
          (err, result) => {
            if (err) {
              return res.status(500).json({ message: 'Error del servidor' });
            }

            if (result.count > 0) {
              return res.status(400).json({ 
                message: 'No se puede eliminar la categoría porque tiene transacciones asociadas' 
              });
            }

            // Eliminar categoría
            db.getDb().run(
              'DELETE FROM categories WHERE id = ?',
              [id],
              function(err) {
                if (err) {
                  return res.status(500).json({ message: 'Error al eliminar categoría' });
                }
                res.json({ message: 'Categoría eliminada exitosamente' });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener estadísticas por categoría
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    let dateCondition = '';
    let params = [req.user.id];

    if (start_date && end_date) {
      dateCondition = 'AND t.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (period === 'month') {
      dateCondition = "AND t.date >= date('now', 'start of month')";
    } else if (period === 'year') {
      dateCondition = "AND t.date >= date('now', 'start of year')";
    }

    const query = `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        c.type,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count,
        AVG(t.amount) as average_amount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = ?
      WHERE (c.is_default = 1 OR c.user_id = ?) ${dateCondition}
      GROUP BY c.id, c.name, c.color, c.icon, c.type
      HAVING transaction_count > 0
      ORDER BY total_amount DESC
    `;

    params.push(req.user.id);

    db.getDb().all(query, params, (err, stats) => {
      if (err) {
        return res.status(500).json({ message: 'Error del servidor' });
      }
      res.json(stats);
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
