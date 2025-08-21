const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('../models/database');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new Database();

// Obtener todas las transacciones del usuario
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, account_id, category_id, type, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    let whereClause = 'WHERE t.user_id = ?';
    let params = [req.user.id];

    if (account_id) {
      whereClause += ' AND t.account_id = ?';
      params.push(account_id);
    }

    if (category_id) {
      whereClause += ' AND t.category_id = ?';
      params.push(category_id);
    }

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }

    if (start_date) {
      whereClause += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND t.date <= ?';
      params.push(end_date);
    }

    const query = `
      SELECT 
        t.*,
        a.name as account_name,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        ta.name as to_account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    db.getDb().all(query, params, (err, transactions) => {
      if (err) {
        return res.status(500).json({ message: 'Error del servidor' });
      }

      // Obtener total de transacciones para paginación
      const countQuery = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
      db.getDb().get(countQuery, params.slice(0, -2), (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        res.json({
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.total,
            pages: Math.ceil(countResult.total / limit)
          }
        });
      });
    });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear nueva transacción
router.post('/', [
  auth,
  body('description').isLength({ min: 1 }).trim().escape(),
  body('amount').isFloat({ gt: 0 }),
  body('type').isIn(['income', 'expense', 'transfer']),
  body('account_id').isInt(),
  body('category_id').isInt().optional(),
  body('category_name').optional().trim().escape(),
  body('to_account_id').isInt().optional(),
  body('date').isISO8601(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, type, account_id, category_id, category_name, to_account_id, date, notes } = req.body;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Función para crear la transacción con el category_id correspondiente
    function createTransactionWithCategory(finalCategoryId) {
      // Verificar que la cuenta pertenece al usuario
      db.getDb().get(
        'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
        [account_id, req.user.id],
        (err, account) => {
          if (err) {
            return res.status(500).json({ message: 'Error del servidor' });
          }

          if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada' });
          }

          // Si es transferencia, verificar cuenta destino
          if (type === 'transfer' && to_account_id) {
            db.getDb().get(
              'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
              [to_account_id, req.user.id],
              (err, toAccount) => {
                if (err) {
                  return res.status(500).json({ message: 'Error del servidor' });
                }

                if (!toAccount) {
                  return res.status(404).json({ message: 'Cuenta destino no encontrada' });
                }

                createTransaction();
              }
            );
          } else {
            createTransaction();
          }

          function createTransaction() {
            // Iniciar transacción de base de datos
            db.getDb().serialize(() => {
              db.getDb().run('BEGIN TRANSACTION');

              // Crear transacción
              db.getDb().run(
                `INSERT INTO transactions 
                 (description, amount, type, account_id, category_id, to_account_id, date, user_id, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [description, amount, type, account_id, finalCategoryId || null, to_account_id || null, date, req.user.id, notes || ''],
                function(err) {
                  if (err) {
                    db.getDb().run('ROLLBACK');
                    return res.status(500).json({ message: 'Error al crear transacción' });
                  }

                  const transactionId = this.lastID;

                  // Actualizar balance de cuenta origen
                  let balanceChange = 0;
                  if (type === 'income') {
                    balanceChange = amount;
                  } else if (type === 'expense' || type === 'transfer') {
                    balanceChange = -amount;
                  }

                  db.getDb().run(
                    'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
                    [balanceChange, new Date().toISOString(), account_id],
                    (err) => {
                      if (err) {
                        db.getDb().run('ROLLBACK');
                        return res.status(500).json({ message: 'Error al actualizar balance' });
                      }

                      // Si es transferencia, actualizar cuenta destino
                      if (type === 'transfer' && to_account_id) {
                        db.getDb().run(
                          'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
                          [amount, new Date().toISOString(), to_account_id],
                          (err) => {
                            if (err) {
                              db.getDb().run('ROLLBACK');
                              return res.status(500).json({ message: 'Error al actualizar balance destino' });
                            }

                            finishTransaction();
                          }
                        );
                      } else {
                        finishTransaction();
                      }

                      function finishTransaction() {
                        db.getDb().run('COMMIT');

                        // Obtener transacción creada con detalles
                        db.getDb().get(
                          `SELECT 
                            t.*,
                            a.name as account_name,
                            c.name as category_name,
                            c.color as category_color,
                            c.icon as category_icon,
                            ta.name as to_account_name
                           FROM transactions t
                           LEFT JOIN accounts a ON t.account_id = a.id
                           LEFT JOIN categories c ON t.category_id = c.id
                           LEFT JOIN accounts ta ON t.to_account_id = ta.id
                           WHERE t.id = ?`,
                          [transactionId],
                          (err, transaction) => {
                            if (err) {
                              return res.status(500).json({ message: 'Error al obtener transacción' });
                            }
                            res.status(201).json(transaction);
                          }
                        );
                      }
                    }
                  );
                }
              );
            });
          }
        }
      );
    }

    // Si se proporciona category_name y no category_id, crear nueva categoría
    if (category_name && !category_id) {
      // Verificar si la categoría ya existe para el usuario
      db.getDb().get(
        'SELECT id FROM categories WHERE name = ? AND user_id = ?',
        [category_name, req.user.id],
        (err, existingCategory) => {
          if (err) {
            return res.status(500).json({ message: 'Error del servidor' });
          }

          if (existingCategory) {
            // La categoría ya existe, usar su ID
            createTransactionWithCategory(existingCategory.id);
          } else {
            // Crear nueva categoría
            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
            const icons = ['💰', '🏠', '🍔', '🚗', '🎬', '👕', '📱', '🎯'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomIcon = icons[Math.floor(Math.random() * icons.length)];

            db.getDb().run(
              'INSERT INTO categories (name, user_id, color, icon) VALUES (?, ?, ?, ?)',
              [category_name, req.user.id, randomColor, randomIcon],
              function(err) {
                if (err) {
                  return res.status(500).json({ message: 'Error al crear categoría' });
                }

                const newCategoryId = this.lastID;
                createTransactionWithCategory(newCategoryId);
              }
            );
          }
        }
      );
    } else {
      // Usar category_id existente o null si no se proporciona
      createTransactionWithCategory(category_id);
    }
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener resumen de transacciones
router.get('/summary', auth, async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    let dateCondition = '';
    let params = [req.user.id];

    if (start_date && end_date) {
      dateCondition = 'AND date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (period === 'month') {
      dateCondition = "AND date >= date('now', 'start of month')";
    } else if (period === 'year') {
      dateCondition = "AND date >= date('now', 'start of year')";
    }

    const query = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        COUNT(*) as total_transactions,
        (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) as net_income
      FROM transactions 
      WHERE user_id = ? ${dateCondition}
    `;

    db.getDb().get(query, params, (err, summary) => {
      if (err) {
        return res.status(500).json({ message: 'Error del servidor' });
      }
      res.json(summary);
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar transacción
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const dbInstance = db.getDb();
    if (!dbInstance) {
      await db.init();
    }

    // Obtener transacción para revertir cambios en balance
    db.getDb().get(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, transaction) => {
        if (err) {
          return res.status(500).json({ message: 'Error del servidor' });
        }

        if (!transaction) {
          return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        db.getDb().serialize(() => {
          db.getDb().run('BEGIN TRANSACTION');

          // Revertir cambio en cuenta origen
          let balanceChange = 0;
          if (transaction.type === 'income') {
            balanceChange = -transaction.amount;
          } else if (transaction.type === 'expense' || transaction.type === 'transfer') {
            balanceChange = transaction.amount;
          }

          db.getDb().run(
            'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
            [balanceChange, new Date().toISOString(), transaction.account_id],
            (err) => {
              if (err) {
                db.getDb().run('ROLLBACK');
                return res.status(500).json({ message: 'Error al actualizar balance' });
              }

              // Si es transferencia, revertir cuenta destino
              if (transaction.type === 'transfer' && transaction.to_account_id) {
                db.getDb().run(
                  'UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?',
                  [transaction.amount, new Date().toISOString(), transaction.to_account_id],
                  (err) => {
                    if (err) {
                      db.getDb().run('ROLLBACK');
                      return res.status(500).json({ message: 'Error al actualizar balance destino' });
                    }

                    deleteTransaction();
                  }
                );
              } else {
                deleteTransaction();
              }

              function deleteTransaction() {
                // Eliminar transacción
                db.getDb().run(
                  'DELETE FROM transactions WHERE id = ?',
                  [id],
                  (err) => {
                    if (err) {
                      db.getDb().run('ROLLBACK');
                      return res.status(500).json({ message: 'Error al eliminar transacción' });
                    }

                    db.getDb().run('COMMIT');
                    res.json({ message: 'Transacción eliminada exitosamente' });
                  }
                );
              }
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
