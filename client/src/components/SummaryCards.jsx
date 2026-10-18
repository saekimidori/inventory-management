import { currency, isLowStock } from "../utils"

// Nothing is stored here: every number is worked out from the products it receives
export default function SummaryCards({ products }) {
  const totalUnits = products.reduce((total, product) => total + product.quantity, 0)
  const inventoryValue = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  )
  const lowStockCount = products.filter(isLowStock).length

  return (
    <section id="inventory-summary">
      <h2>Inventory Summary</h2>

      <div id="summary-cards">
        <article>
          <h3>Total Products</h3>
          <p id="total-products">{products.length}</p>
        </article>

        <article>
          <h3>Total Units</h3>
          <p id="total-units">{totalUnits}</p>
        </article>

        <article>
          <h3>Inventory Value</h3>
          <p id="inventory-value">{currency.format(inventoryValue)}</p>
        </article>

        <article>
          <h3>Low Stock</h3>
          <p id="low-stock">{lowStockCount}</p>
        </article>
      </div>
    </section>
  )
}
