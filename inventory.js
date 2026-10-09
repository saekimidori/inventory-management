const DEFAULT_REORDER_LEVEL = 5

const STORAGE_KEY = 'inventory-products'

const defaultProducts = [
  {
    id: 1,
    name: "Denim Jacket",
    category: "Outerwear",
    price: 59.99,
    quantity: 12
  },
  {
    id: 2,
    name: "Basic T-Shirt",
    category: "Tops",
    price: 24.99,
    quantity: 3
  },
  {
    id: 3,
    name: "Slim Jeans",
    category: "Bottoms",
    price: 49.99,
    quantity: 18
  },
  {
    id: 4,
    name: "Running Sneakers",
    category: "Footwear",
    price: 79.99,
    quantity: 7
  }
]

function loadInventory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return defaultProducts.slice()
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed
  } catch (error) {
    console.error('Could not load inventory:', error)
  }
  return defaultProducts.slice()
}
 
function saveInventory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
  } catch (error) {
    console.error('Could not save inventory:', error)
  }
}
 
const inventory = loadInventory()

let nextId = Math.max(0, ...inventory.map(function(p) { return p.id })) + 1

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

function renderInventory() {
  const products = getVisibleProducts()
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
      <button type="button" class="edit-product">Edit</button>
      <button type="button" class="delete-product">Delete</button>
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

function refresh() {
  renderInventory()
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

// Delete product
inventoryList.addEventListener('click', function(event) {
  const deleteButton = event.target.closest('.delete-product')
  if (!deleteButton) return
 
  const id = Number(deleteButton.closest('article').dataset.id)
  const index = inventory.findIndex(function(product) {
    return product.id === id
  })
  if (index === -1) return
 
  if (!confirm(`Delete "${inventory[index].name}"?`)) return
 
  inventory.splice(index, 1)
  saveInventory()
  refresh()
})

const cancelProductButton = document.querySelector('#cancel-product')
const formTitle = document.querySelector('#product-form-title')
const productNameInput = document.querySelector('#product-name')
const productCategoryInput = document.querySelector('#product-category')
const formSubmitButton = productForm.querySelector('button[type="submit"]')

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
  editingId = null
})

productForm.addEventListener('submit', function(event) {
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
 
  if (editingId === null) {
    inventory.push({ id: nextId++, ...data })
  } else {
    const product = inventory.find(function(item) {
      return item.id === editingId
    })
    if (product) Object.assign(product, data)
  }

  saveInventory()
  productFormContainer.close()
  refresh()
})
 
refresh()
