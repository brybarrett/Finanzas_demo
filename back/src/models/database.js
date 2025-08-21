const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = process.env.DATABASE_PATH || './database.sqlite';
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error al conectar con la base de datos:', err);
          reject(err);
        } else {
          console.log('Conectado a la base de datos SQLite');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const tables = [
        // Tabla de usuarios
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(50),
          last_name VARCHAR(50),
          score INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabla de categorías
        `CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(50) NOT NULL,
          color VARCHAR(7) DEFAULT '#007bff',
          icon VARCHAR(50) DEFAULT 'folder',
          type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
          user_id INTEGER,
          is_default BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        
        // Tabla de cuentas
        `CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          type TEXT CHECK(type IN ('checking', 'savings', 'credit', 'cash', 'investment')) NOT NULL,
          balance DECIMAL(12,2) DEFAULT 0,
          currency VARCHAR(3) DEFAULT 'CLP',
          user_id INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        
        // Tabla de transacciones
        `CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description VARCHAR(255) NOT NULL,
          amount DECIMAL(12,2) NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense', 'transfer')) NOT NULL,
          account_id INTEGER NOT NULL,
          category_id INTEGER,
          to_account_id INTEGER,
          date DATE NOT NULL,
          user_id INTEGER NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
          FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        
        // Tabla para el ranking de usuarios
        `CREATE TABLE IF NOT EXISTS user_rankings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          period VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
          period_date DATE NOT NULL,
          score INTEGER NOT NULL,
          rank_position INTEGER,
          savings_rate DECIMAL(5,2),
          expense_ratio DECIMAL(5,2),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, period, period_date)
        )`
      ];

      let completed = 0;
      const total = tables.length;

      tables.forEach((tableSQL, index) => {
        this.db.run(tableSQL, (err) => {
          if (err) {
            console.error(`Error al crear tabla ${index + 1}:`, err);
            reject(err);
          } else {
            completed++;
            if (completed === total) {
              console.log('Todas las tablas creadas exitosamente');
              this.insertDefaultCategories().then(resolve).catch(reject);
            }
          }
        });
      });
    });
  }

  insertDefaultCategories() {
    return new Promise((resolve, reject) => {
      const defaultCategories = [
        { name: 'Salario', type: 'income', color: '#28a745', icon: 'briefcase', is_default: 1 },
        { name: 'Freelance', type: 'income', color: '#17a2b8', icon: 'laptop', is_default: 1 },
        { name: 'Inversiones', type: 'income', color: '#ffc107', icon: 'chart-line', is_default: 1 },
        { name: 'Alimentación', type: 'expense', color: '#fd7e14', icon: 'utensils', is_default: 1 },
        { name: 'Transporte', type: 'expense', color: '#6f42c1', icon: 'car', is_default: 1 },
        { name: 'Entretenimiento', type: 'expense', color: '#e83e8c', icon: 'gamepad', is_default: 1 },
        { name: 'Servicios', type: 'expense', color: '#20c997', icon: 'home', is_default: 1 },
        { name: 'Salud', type: 'expense', color: '#dc3545', icon: 'heart', is_default: 1 },
        { name: 'Educación', type: 'expense', color: '#007bff', icon: 'graduation-cap', is_default: 1 },
        { name: 'Compras', type: 'expense', color: '#6c757d', icon: 'shopping-cart', is_default: 1 }
      ];

      const checkSQL = 'SELECT COUNT(*) as count FROM categories WHERE is_default = 1';
      this.db.get(checkSQL, (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count > 0) {
          resolve();
          return;
        }

        const insertSQL = `INSERT INTO categories (name, type, color, icon, is_default) VALUES (?, ?, ?, ?, ?)`;
        let completed = 0;

        defaultCategories.forEach(category => {
          this.db.run(insertSQL, [category.name, category.type, category.color, category.icon, category.is_default], (err) => {
            if (err) {
              console.error('Error al insertar categoría por defecto:', err);
            }
            completed++;
            if (completed === defaultCategories.length) {
              console.log('Categorías por defecto insertadas');
              resolve();
            }
          });
        });
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error al cerrar la base de datos:', err);
          } else {
            console.log('Conexión a la base de datos cerrada');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getDb() {
    return this.db;
  }
}

module.exports = Database;
