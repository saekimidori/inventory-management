import { useEffect, useRef, useState } from "react"
import { deleteProduct, getProducts, resetProducts, updateProduct } from "./api"
import { getVisibleProducts } from "./utils"
import SummaryCards from "./components/SummaryCards"
import Controls from "./components/Controls"
import ProductCard from "./components/ProductCard"

export default function App() {
  // The data from the server
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState("loading") // "loading" | "ready" | "error"
  const [errorMessage, setErrorMessage] = useState("")

  // What the person has typed or picked in the controls
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState("default")

  const [frozenOrder, setFrozenOrder] = useState(null)

  const busyIds = useRef(new Set())
  // Runs once, after the first render: load the products from the server
  useEffect(() => {
    let ignore = false // if the component goes away before the reply arrives, don't update it

    getProducts()
      .then((data) => {
        if (ignore) return
        setProducts(data)
        setStatus("ready")
      })
      .catch((error) => {
        if (ignore) return
        setErrorMessage(error.message)
        setStatus("error")
      })

    return () => {
      ignore = true
    }
  }, [])

  // Worked out fresh on every render. It's not state, because it can always be
  // recalculated from products + search + category + sort.
  const visibleProducts = getVisibleProducts(products, { search, category, sort, frozenOrder })

  function changeControl(setter) {
    return (value) => {
      setter(value)
      setFrozenOrder(null)
    }
  }

  function clearFilters() {
    setSearch("")
    setCategory("all")
    setSort("default")
    setFrozenOrder(null)
  }

  async function runOnce (id, action) {
    if (busyIds.current.has(id)) return
    busyIds.current.add(id)
    try {
      await action()
    } catch (error) {
      alert(error.message)
    } finally {
      busyIds.current.delete(id)
    }
  }

  function handleAdjust(product, change) {
    const quantity = Math.max(0, product.quantity + change)
    if (quantity === product.quantity) return

    const orderBeforeChange = visibleProducts.map((item) => item.id)

    runOnce(product.id, async () => {
      const updated = await updateProduct(product.id, { ...product, quantity })
      setFrozenOrder((current) => current ?? orderBeforeChange)
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    })
  }

  function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"?`)) return
    
    runOnce(product.id, async () => {
      await deleteProduct(product.id)
      setFrozenOrder(null)
      setProducts((current) => current.filter((item) => item.id !== product.id))
    })
  }

  function handleReset() {
    if (!confirm("Reset all products to the starter data? Your changes will be lost.")) return

    runOnce("reset", async() => {
      setProducts(await resetProducts())
      setFrozenOrder(null)
    })
  }

  return (
    <>
      <header>
        <h1>Inventory Management</h1>
        <p>Track and manage your store inventory.</p>
      </header>

      <main>
        <SummaryCards products={products} />

        <section id="inventory">
          <h2>Inventory</h2>

          <Controls
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            onClear={clearFilters}
            onReset={handleReset}
          />

          {status === "ready" && (
            <p id="results-count">
              Showing {visibleProducts.length} of {products.length}{" "}
              {products.length === 1 ? "product" : "products"}
            </p>
          )}

          {status === "loading" && <p id="status-message">Loading products...</p>}
          {status === "error" && (
            <p id="status-message" role="alert">
              Couldn't load products: {errorMessage}
            </p>
          )}
          {status === "ready" && products.length === 0 && (
            <p id="status-message">No products yet.</p>
          )}
          {status === "ready" && products.length > 0 && visibleProducts.length === 0 && (
            <p id="status-message">No products match your search.</p>
          )}

          <div id="inventory-list">
            {visibleProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAdjust={handleAdjust}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
