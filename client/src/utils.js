export const CATEGORIES = ["Tops", "Bottoms", "Outerwear", "Footwear"]

// Used for products that don't have their own reorder level
export const DEFAULT_REORDER_LEVEL = 5

// Formats numbers as money with thousands separators: 12345.6 -> $12,345.60
export const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function getReorderLevel(product) {
  return product.reorderLevel ?? DEFAULT_REORDER_LEVEL
}

export function isLowStock(product) {
  return product.quantity <= getReorderLevel(product)
}

// Zero is a different situation from "running low", so label it separately
export function getStockLabel(product) {
  if (product.quantity === 0) return "Out of stock"
  if (isLowStock(product)) return "Low stock"
  return null
}

// One lookup object instead of a long chain of if / else
const comparators = {
  name: (a, b) => a.name.localeCompare(b.name),
  "price-low": (a, b) => a.price - b.price,
  "price-high": (a, b) => b.price - a.price,
  "quantity-low": (a, b) => a.quantity - b.quantity,
  "quantity-high": (a, b) => b.quantity - a.quantity
}

// Search -> filter -> sort. A pure function: same inputs always give the same list,
// and it never changes the products array it's given.
export function getVisibleProducts(products, { search, category, sort }) {
  const query = search.trim().toLowerCase()

  const result = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    const matchesCategory = category === "all" || product.category === category
    return matchesSearch && matchesCategory
  })

  const compare = comparators[sort] // undefined for "default": keep the original order
  if (compare) result.sort(compare)

  return result
}