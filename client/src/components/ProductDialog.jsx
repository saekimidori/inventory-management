import { useEffect, useRef, useState } from "react"
import { CATEGORIES, DEFAULT_REORDER_LEVEL } from "../utils"

function ProductForm({ product, onClose, onSave }) {
  const [name, setName] = useState(product?.name ?? "")
  const [category, setCategory] = useState(product?.category ?? "")
  const [price, setPrice] = useState(product ? String(product.price) : "")
  const [quantity, setQuantity] = useState(product ? String(product.quantity) : "")
  const [reorderLevel, setReorderLevel] = useState(
    String(product?.reorderLevel ?? DEFAULT_REORDER_LEVEL)
  )
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const edit = (setter) => (event) => {
    setter(event.target.value)
    setError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const data = {
      name: name.trim(),
      category,
      price: Number(price),
      quantity: Number(quantity),
      reorderLevel: Number(reorderLevel)
    }

    if (data.name === "") {
      setError("Please enter a product name.")
      return
    }

    setSaving(true)
    try {
      await onSave(data) 
    } catch (saveError) {
      setError(saveError.message)
      setSaving(false)
    }
  }

  return (
    <form id="product-form" onSubmit={handleSubmit}>
      <label htmlFor="product-name">Product Name</label>
      <input type="text" id="product-name" value={name} onChange={edit(setName)} required />

      <label htmlFor="product-category">Category</label>
      <select id="product-category" value={category} onChange={edit(setCategory)} required>
        <option value="">Select a category</option>
        {CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <label htmlFor="product-price">Price</label>
      <input
        type="number"
        id="product-price"
        min="0"
        step="0.01"
        value={price}
        onChange={edit(setPrice)}
        required
      />

      <label htmlFor="product-quantity">Quantity</label>
      <input
        type="number"
        id="product-quantity"
        min="0"
        step="1"
        value={quantity}
        onChange={edit(setQuantity)}
        required
      />

      <label htmlFor="product-reorder-level">Reorder Level</label>
      <input
        type="number"
        id="product-reorder-level"
        min="0"
        step="1"
        value={reorderLevel}
        onChange={edit(setReorderLevel)}
        required
      />

      {error && (
        <p role="alert" className="form-error">
          Error: {error}
        </p>
      )}

      <button type="submit" disabled={saving}>
        {product ? "Save Changes" : "Add Product"}
      </button>
      <button type="button" id="cancel-product" onClick={onClose}>
        Cancel
      </button>
    </form>
  )
}

export default function ProductDialog({ open, product, onClose, onSave }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      id="product-form-container"
      ref={dialogRef}
      aria-labelledby="product-form-title"
      onClose={onClose} 
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <h2 id="product-form-title">{product ? "Edit Product" : "Add Product"}</h2>
      {open && <ProductForm product={product} onClose={onClose} onSave={onSave} />}
    </dialog>
  )
}
