const express = require('express')
const path = require('path')
const db = require('./db')

const app = express()
const PORT = 3000

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Footwear']

app.use(express.json())

app.use(express.static(path.join(__dirname, 'public')))

function validateProduct(body) {
  if (!body || typeof body !== 'object') return { error: 'Request body must be JSON.' }
 
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name === '') return { error: 'Name is required.' }
 
  if (!CATEGORIES.includes(body.category)) {
    return { error: `Category must be one of: ${CATEGORIES.join(", ")}.` }
  }
 
  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0) {
    return { error: 'Price must be a number, 0 or more.' }
  }
 
  if (!Number.isInteger(body.quantity) || body.quantity < 0) {
    return { error: 'Quantity must be a whole number, 0 or more.' }
  }
 
  const reorderLevel = body.reorderLevel === undefined ? 5 : body.reorderLevel
  if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
    return { error: 'Reorder level must be a whole number, 0 or more.' }
  }
 
  return { data: { name, category: body.category, price: body.price, quantity: body.quantity, reorderLevel } }
}
 
function parseId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

app.get('/api/health', function(req, res) {
  res.json({ status: 'ok' })
})

app.get('/api/products', function(req, res) {
  res.json(db.getAllProducts())
})
 
app.post('/api/products', function(req, res) {
  const result = validateProduct(req.body)
  if (result.error) return res.status(400).json({ error: result.error })
 
  try {
    res.status(201).json(db.createProduct(result.data))
  } catch (error) {
    if (db.isDuplicateError(error)) {
      return res.status(409).json({ error: 'This product already exists in this category.' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong on the server.' })
  }
})
 
app.put('/api/products/:id', function(req, res) {
  const id = parseId(req.params.id)
  if (id === null) return res.status(400).json({ error: 'Invalid product id.' })
 
  const result = validateProduct(req.body)
  if (result.error) return res.status(400).json({ error: result.error })
 
  try {
    const product = db.updateProduct(id, result.data)
    if (!product) return res.status(404).json({ error: 'Product not found.' })
    res.json(product)
  } catch (error) {
    if (db.isDuplicateError(error)) {
      return res.status(409).json({ error: 'This product already exists in this category.' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong on the server.' })
  }
})
 
app.delete('/api/products/:id', function(req, res) {
  const id = parseId(req.params.id)
  if (id === null) return res.status(400).json({ error: 'Invalid product id.' })
 
  if (!db.deleteProduct(id)) return res.status(404).json({ error: 'Product not found.' })
  res.status(204).end()
})

app.listen(PORT, function() {
  console.log(`Server running at http://localhost:${PORT}`)
})