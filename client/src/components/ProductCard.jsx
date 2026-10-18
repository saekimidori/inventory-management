import { currency, getReorderLevel, getStockLabel, isLowStock } from "../utils"

export default function ProductCard({ product }) {
  const label = getStockLabel(product)

  return (
    <article className={isLowStock(product) ? "low-stock" : undefined} data-id={product.id}>
      <h3>{product.name}</h3>
      <p>Category: {product.category}</p>
      <p>Price: {currency.format(product.price)}</p>
      <p>
        Quantity: {product.quantity}
        {label && <strong> ({label})</strong>}
      </p>
      <p>Reorder level: {getReorderLevel(product)}</p>
    </article>
  )
}
