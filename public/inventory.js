const DEFAULT_REORDER_LEVEL = 5

let inventory = []

async function api(url, options) {
  let response
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
  } catch (error) {
    throw new Error('Can\'t reach the server. Is it running?')
  }
 
  if (response.status === 204) return null // success with nothing to send back (delete)
 
  const body = await response.json().catch(function() { return null })
  if (!response.ok) {
    throw new Error(body && body.error ? body.error : 'Request failed.')
  }
  return body
}

const inventoryList = document.querySelector('#inventory-list')
const totalProducts = document.querySelector('#total-products')
const totalUnits = document.querySelector('#total-units')
const inventoryValue = document.querySelector('#inventory-value')
const lowStock = document.querySelector('#low-stock')

const searchInput = document.querySelector('#search-input')
const categorySelect = document.querySelector('#category-select')
const sortSelect = document.querySelector('#sort-select')
const clearFiltersButton = document.querySelector('#clear-filters')
const resultsCount = document.querySelector('#results-count')

const addProductButton = document.querySelector('#add-product')
const productFormContainer = document.querySelector('#product-form-container')
const productForm = document.querySelector('#product-form')
const productReorderInput = document.querySelector('#product-reorder-level')

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

let statusMessage = document.querySelector('#status-message')
if (!statusMessage) {
  statusMessage = document.createElement('p')
  statusMessage.id = 'status-message'
}
statusMessage.hidden = true
inventoryList.before(statusMessage)

// Function to escape HTML special characters to prevent errors
function escapeHTML(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function getReorderLevel(product) {
  return product.reorderLevel ?? DEFAULT_REORDER_LEVEL
}

function isLowStock(product) {
  return product.quantity <= getReorderLevel(product)
}

function stockLabel(product) {
  if (product.quantity === 0) return ' <strong>(Out of stock)</strong>'
  if (isLowStock(product)) return ' <strong>(Low stock)</strong>'
  return ''
}

function getVisibleProducts() {
  const query = searchInput.value.trim().toLowerCase()
  const category = categorySelect.value
  const sort = sortSelect.value
 
  let products = inventory.filter(function(product) {
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
 
    const matchesCategory =
      category === 'all' || product.category.toLowerCase() === category
 
    return matchesSearch && matchesCategory
  })
 
  const compare =
    sort === "name" ? function(a, b) { return a.name.localeCompare(b.name) } :
    sort === "price-low" ? function(a, b) { return a.price - b.price } :
    sort === "price-high" ? function(a, b) { return b.price - a.price } :
    sort === "quantity-low" ? function(a, b) { return a.quantity - b.quantity } :
    sort === "quantity-high" ? function(a, b) { return b.quantity - a.quantity } :
    null
 
  if (compare) products.sort(compare)
 
  return products
}

let lastShownOrder = []

function renderInventory(options) {
  const keepOrder = Boolean(options && options.keepOrder)
  
  const products = keepOrder
    ? lastShownOrder
        .map(function(id) {
          return inventory.find(function(product) { return product.id === id })
        })
        .filter(Boolean)
    : getVisibleProducts()
 
  lastShownOrder = products.map(function(product) { return product.id })
  inventoryList.innerHTML = ''

  resultsCount.textContent =
  `Showing ${products.length} of ${inventory.length} ${inventory.length === 1 ? 'product' : 'products'}`

  statusMessage.hidden = products.length > 0
 
  if (products.length === 0) {
    statusMessage.textContent = inventory.length === 0
      ? 'No products yet.'
      : 'No products match your search.'
    return
  }
 
  products.forEach(function(product) {
    const productElement = document.createElement('article')
    productElement.dataset.id = product.id
 
    if (isLowStock(product)) {
      productElement.classList.add('low-stock')
    }
 
    productElement.innerHTML = `
      <h3>${escapeHTML(product.name)}</h3>
      <p>Category: ${escapeHTML(product.category)}</p>
      <p>Price: ${currency.format(product.price)}</p>
      <p>Quantity: ${product.quantity}${stockLabel(product)}</p>
        <div class='quantity-controls'>
          <button type='button' class='adjust-quantity' data-change='-1'
            aria-label='Decrease quantity of ${escapeHTML(product.name)}'
            ${product.quantity === 0 ? 'disabled' : ''}>&minus;</button>
          <button type='button' class='adjust-quantity' data-change='1'
            aria-label='Increase quantity of ${escapeHTML(product.name)}'>+</button>
        </div>
      <p>Reorder level: ${getReorderLevel(product)}</p>
      <button type='button' class='edit-product'>Edit</button>
      <button type='button' class='delete-product'>Delete</button>
    `
 
    inventoryList.appendChild(productElement)
  })
}

function updateSummary() {
  // Total products
  totalProducts.textContent = inventory.length

  // Total units
  const units = inventory.reduce(function(total, product) {
    return total + product.quantity
    }, 0)
  totalUnits.textContent = units

  // Inventory value
  const value = inventory.reduce(function(total, product) {
    return total + (product.price * product.quantity)
  }, 0)
  inventoryValue.textContent = currency.format(value)

  // Low-stock products
  lowStock.textContent = inventory.filter(isLowStock).length
}

function refresh(options) {
  renderInventory(options)
  updateSummary()
}

searchInput.addEventListener('input', renderInventory)
categorySelect.addEventListener('change', renderInventory)
sortSelect.addEventListener('change', renderInventory)

clearFiltersButton.addEventListener('click', function() {
  searchInput.value = ''
  categorySelect.value = 'all'
  sortSelect.value = 'default'
  renderInventory()
})

let requestInFlight = false

inventoryList.addEventListener('click', async function(event) {
  const adjustButton = event.target.closest('.adjust-quantity')
  if (!adjustButton || requestInFlight) return
 
  const id = Number(adjustButton.closest('article').dataset.id)
  const change = Number(adjustButton.dataset.change)
  const product = inventory.find(function(item) {
    return item.id === id
  })
  if (!product) return
 
  const newQuantity = Math.max(0, product.quantity + change)
  if (newQuantity === product.quantity) return

  requestInFlight = true
  try {
    const updated = await api(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify ({ ...product, quantity: newQuantity })
    })
    Object.assign(product, updated)
  } catch (error) {
    alert(error.message)
    return
  } finally {
    requestInFlight = false
  }
  
  refresh({ keepOrder: true })

  const sameButton = inventoryList.querySelector(
    `article[data-id="${id}"] .adjust-quantity[data-change="${change}"]`
  )
  if (sameButton) sameButton.focus()
})

// Delete product
inventoryList.addEventListener('click', async function(event) {
  const deleteButton = event.target.closest('.delete-product')
  if (!deleteButton) return
 
  const id = Number(deleteButton.closest('article').dataset.id)
  const index = inventory.findIndex(function(product) {
    return product.id === id
  })
  if (index === -1) return
 
  if (!confirm(`Delete "${inventory[index].name}"?`)) return

  try {
    await api(`/api/products/${id}`, { method: 'DELETE' })
  } catch (error) {
    alert(error.message)
    return
  }

  inventory = inventory.filter(function(product) {
    return product.id !== id
  })
  refresh()
})

const cancelProductButton = document.querySelector('#cancel-product')
const formTitle = document.querySelector('#product-form-title')
const productNameInput = document.querySelector('#product-name')
const productCategoryInput = document.querySelector('#product-category')
const formSubmitButton = productForm.querySelector("button[type='submit']")

// Form error message
const formError = document.createElement('p')
formError.id = 'product-form-error'
formError.setAttribute('role', 'alert')
formError.style.color = '#d9534f'
formError.hidden = true
formSubmitButton.before(formError)
 
function showFormError(message) {
  formError.textContent = message
  formError.hidden = false
}
 
function clearFormError() {
  formError.textContent = ''
  formError.hidden = true
}

productNameInput.addEventListener('input', clearFormError)
productCategoryInput.addEventListener('change', clearFormError)

let editingId = null // null = adding a new product, otherwise the id being edited

function openProductForm(product) {
  if (product) {
    editingId = product.id
    document.querySelector('#product-name').value = product.name
    document.querySelector('#product-category').value = product.category
    document.querySelector('#product-price').value = product.price
    document.querySelector('#product-quantity').value = product.quantity
    productReorderInput.value = getReorderLevel(product)
    if (formTitle) formTitle.textContent = 'Edit Product'
    formSubmitButton.textContent = 'Save Changes'
  } else {
    editingId = null
    productForm.reset()
    productReorderInput.value = DEFAULT_REORDER_LEVEL
    if (formTitle) formTitle.textContent = 'Add Product'
    formSubmitButton.textContent = 'Add Product'
  }
 
  productFormContainer.showModal()
}

inventoryList.addEventListener('click', function(event) {
  // Edit product
  const editButton = event.target.closest('.edit-product')
  if (!editButton) return
 
  const id = Number(editButton.closest('article').dataset.id)
  const product = inventory.find(function(item) {
    return item.id === id
  })
  if (product) openProductForm(product)
})
 
addProductButton.addEventListener('click', function() {
  openProductForm()
})

cancelProductButton.addEventListener('click', function() {
  productFormContainer.close()
})

productFormContainer.addEventListener('click', function(event) {
  if (event.target === productFormContainer) {
    productFormContainer.close()
  }
})

// Fires however the dialog closes (submit, Cancel, Esc, backdrop): start clean next time
productFormContainer.addEventListener('close', function() {
  productForm.reset()
  clearFormError()
  editingId = null
})

productForm.addEventListener('submit', async function(event) {
  event.preventDefault()
 
  const data = {
      name: document.querySelector('#product-name').value.trim(),
      category: document.querySelector('#product-category').value,
      price: parseFloat(document.querySelector('#product-price').value),
      quantity: parseInt(document.querySelector('#product-quantity').value, 10),
      reorderLevel: parseInt(productReorderInput.value, 10)
  }

  if (data.name === '') {
    showFormError('Please enter a product name.')
    productNameInput.focus()
    return
  }

  const isDuplicate = inventory.some(function(item) {
    return (
      item.id !== editingId &&
      item.name.toLowerCase() === data.name.toLowerCase() &&
      item.category === data.category
    )
  })
 
  if (isDuplicate) {
    showFormError('This product already exists in this category.')
    productNameInput.focus()
    return
  }

  formSubmitButton.disabled = true

  try {
    if (editingId === null) {
      inventory.push(await api('/api/products', { method: 'POST', body: JSON.stringify(data) }))
    } else {
      const updated = await api(`/api/products/${editingId}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      })
      inventory = inventory.map(function(item) {
        return item.id === updated.id ? updated : item
      })
    }
  } catch (error) {
    showFormError(error.message)
    return 
  } finally {
    formSubmitButton.disabled = false
  }

  productFormContainer.close()
  refresh()
})

async function init() {
  statusMessage.textContent = 'Loading products...'
  statusMessage.hidden = false

  try {
    inventory = await api('/api/products')
  } catch (error) {
    statusMessage.textContent = `Couldn't load products: ${error.message}`
    return
  }

  refresh()
}
 
init()
