const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'inventory.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    category      TEXT    NOT NULL,
    price         REAL    NOT NULL CHECK (price >= 0),
    quantity      INTEGER NOT NULL CHECK (quantity >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0)
  );

  -- Same name + category can't exist twice (name comparison ignores capitalization)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name_category
    ON products (name COLLATE NOCASE, category);
`)

const starterProducts = [
  ['Denim Jacket', 'Outerwear', 59.99, 12, 5],
  ['Basic T-Shirt', 'Tops', 24.99, 3, 5],
  ['Slim Jeans', 'Bottoms', 49.99, 18, 5],
  ['Running Sneakers', 'Footwear', 79.99, 7, 5]
]

const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get()
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, category, price, quantity, reorder_level) VALUES (?, ?, ?, ?, ?)'
  )
  starterProducts.forEach(function(row) { insert.run(...row) })
}

function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    quantity: row.quantity,
    reorderLevel: row.reorder_level
  }
}

function getAllProducts() {
  return db.prepare('SELECT * FROM products ORDER BY id').all().map(toProduct)
}

function getProduct(id) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  return row ? toProduct(row) : null
}

function createProduct(data) {
  const result = db.prepare(
    'INSERT INTO products (name, category, price, quantity, reorder_level) VALUES (?, ?, ?, ?, ?)'
  ).run(data.name, data.category, data.price, data.quantity, data.reorderLevel)

  return getProduct(Number(result.lastInsertRowid))
}

function updateProduct(id, data) {
  const result = db.prepare(
    'UPDATE products SET name = ?, category = ?, price = ?, quantity = ?, reorder_level = ? WHERE id = ?'
  ).run(data.name, data.category, data.price, data.quantity, data.reorderLevel, id)

  return result.changes === 0 ? null : getProduct(id)
}

function deleteProduct(id) {
  return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0
}

function isDuplicateError(error) {
  return Boolean(error && error.message && error.message.includes('UNIQUE constraint failed'))
}

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  isDuplicateError
}