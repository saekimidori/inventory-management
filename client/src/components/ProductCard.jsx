import { currency, getReorderLevel, getStockLabel, isLowStock } from "../utils"

export default function ProductCard({ product, onAdjust, onDelete }) {
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

      <div className="quantity-controls">
        <button
          type="button"
          className="adjust-quantity"
          aria-label={`Decrease quantity of ${product.name}`}
          disabled={product.quantity === 0}
          onClick={() => onAdjust(product, -1)}
        >
          &minus;
        </button>
        <button
          type="button"
          className="adjust-quantity"
          aria-label={`Increase quantity of ${product.name}`}
          onClick={() => onAdjust(product, 1)}
        >
          +
        </button>
      </div>

      <button type="button" className="delete-product" onClick={() => onDelete(product)}>
        Delete
      </button>
    </article>
  )
}
