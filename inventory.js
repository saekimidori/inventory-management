const LOW_STOCK_THRESHOLD = 5

const inventory = [
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

let nextId = Math.max(...inventory.map(function(p) { return p.id })) + 1

const inventoryList = document.querySelector('#inventory-list')
const totalProducts = document.querySelector('#total-products')
const totalUnits = document.querySelector('#total-units')
const inventoryValue = document.querySelector('#inventory-value')
const lowStock = document.querySelector('#low-stock')

const searchInput = document.querySelector('#search-input')
const categorySelect = document.querySelector('#category-select')
const sortSelect = document.querySelector('#sort-select')

const addProductButton = document.querySelector('#add-product')
const cancelProductButton = document.querySelector("#cancel-product")
const productFormContainer = document.querySelector('#product-form-container')
const productForm = document.querySelector('#product-form')

// Function to escape HTML special characters to prevent errors
function escapeHTML(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function isLowStock(product) {
  return product.quantity <= LOW_STOCK_THRESHOLD
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
 
  if (products.length === 0) {
    const message = document.createElement('p')
    message.id = 'status-message'
    message.textContent = inventory.length === 0
      ? 'No products yet.'
      : 'No products match your search.'
    inventoryList.appendChild(message)
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
      <p>Price: $${product.price.toFixed(2)}</p>
      <p>Quantity: ${product.quantity}${isLowStock(product) ? " <strong>(Low stock)</strong>" : ""}</p>
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
  inventoryValue.textContent = `$${value.toFixed(2)}`

  // Low-stock products
  const lowStockProducts = inventory.filter(function(product) {
    return product.quantity <= 5
  })
  lowStock.textContent = lowStockProducts.length
}

function refresh() {
  renderInventory()
  updateSummary()
}

searchInput.addEventListener('input', renderInventory)
categorySelect.addEventListener('change', renderInventory)
sortSelect.addEventListener('change', renderInventory)

addProductButton.addEventListener('click', function() {
    productFormContainer.showModal()
})

cancelProductButton.addEventListener('click', function() {
  productForm.reset()
  productFormContainer.close()
})

productFormContainer.addEventListener('click', function(event) {
  if (event.target === productFormContainer) {
    productFormContainer.close()
  }
})

productForm.addEventListener('submit', function(event) {
  event.preventDefault()
 
  inventory.push({
    id: nextId++,
    name: document.querySelector('#product-name').value.trim(),
    category: document.querySelector('#product-category').value,
    price: parseFloat(document.querySelector('#product-price').value),
    quantity: parseInt(document.querySelector('#product-quantity').value, 10)
  })
 
  productForm.reset()
  productFormContainer.hidden = true
  refresh()
})
 
refresh()
