import { useEffect, useRef, useState } from "react"
import { createProduct, deleteProduct, getProducts, resetProducts, updateProduct } from "./api"
import { getVisibleProducts } from "./utils"
import { downloadCsv, productsToCsv } from "./csv"
import SummaryCards from "./components/SummaryCards"
import Controls from "./components/Controls"
import ProductCard from "./components/ProductCard"
import ProductDialog from "./components/ProductDialog"
import UndoToast from "./components/UndoToast"

const RESORT_DELAY_MS = 1500

const UNDO_WINDOW_MS = 6000

export default function App() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState("loading")
  const [errorMessage, setErrorMessage] = useState("")

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState("default")

  const [frozenOrder, setFrozenOrder] = useState(null)

  const [dialog, setDialog] = useState({ open: false, product: null })

  const [pendingDelete, setPendingDelete] = useState(null)
  const deleteTimer = useRef(null)

  const busyIds = useRef(new Set())

  const resortTimer = useRef(null)
  useEffect(() => () => clearTimeout(resortTimer.current), [])
  useEffect(() => () => clearTimeout(deleteTimer.current), [])

  useEffect(() => {
    let ignore = false 

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

  const shownProducts = pendingDelete
    ? products.filter((item) => item.id !== pendingDelete.id)
    : products

  const visibleProducts = getVisibleProducts(shownProducts, { search, category, sort, frozenOrder })

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

      clearTimeout(resortTimer.current)
      resortTimer.current = setTimeout(() => setFrozenOrder(null), RESORT_DELAY_MS)
    })
  }

  function openAddDialog() {
    setDialog({ open: true, product: null })
  }

  function openEditDialog(product) {
    setDialog({ open: true, product })
  }

  function closeDialog() {
    setDialog((current) => ({ ...current, open: false }))
  }

  async function handleSave(data) {
    if (dialog.product) {
      const updated = await updateProduct(dialog.product.id, data)
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } else {
      const created = await createProduct(data)
      setProducts((current) => [...current, created])
    }
    setFrozenOrder(null)
    closeDialog()
  }

  async function commitDelete(product) {
    try {
      await deleteProduct(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
    } catch (error) {
      alert(error.message)
    } finally {
      setPendingDelete((current) => (current?.id === product.id ? null : current))
    }
  }

  function handleDelete(product) {
    if (pendingDelete) {
      clearTimeout(deleteTimer.current)
      commitDelete(pendingDelete)
    }

    setFrozenOrder(null)
    setPendingDelete(product)
    deleteTimer.current = setTimeout(() => commitDelete(product), UNDO_WINDOW_MS)
  }

  function cancelPendingDelete() {
    clearTimeout(deleteTimer.current)
    setPendingDelete(null)
  }

  const filtersActive = search.trim() !== "" || category !== "all"

  function handleExport(scope) {
    const exportAll = scope === "all"
    const list = exportAll
      ? getVisibleProducts(shownProducts, { search: "", category: "all", sort, frozenOrder })
      : visibleProducts

    const today = new Date().toLocaleDateString("en-CA") // 2026-10-27 style
    const prefix = filtersActive && !exportAll ? "inventory-filtered" : "inventory"
    downloadCsv(`${prefix}-${today}.csv`, productsToCsv(list))
  }

  function handleReset() {
    if (!confirm("Reset all products to the starter data? Your changes will be lost.")) return

    cancelPendingDelete()

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
            onExport={handleExport}
            exportCount={visibleProducts.length}
            totalCount={shownProducts.length}
            filtersActive={filtersActive}
            onAdd={openAddDialog}
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
                onEdit={openEditDialog}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      </main>

      <ProductDialog
        open={dialog.open}
        product={dialog.product}
        products={products}
        onClose={closeDialog}
        onSave={handleSave}
      />

      <UndoToast product={pendingDelete} onUndo={cancelPendingDelete} />
    </>
  )
}
