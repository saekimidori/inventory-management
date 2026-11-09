import { getReorderLevel, getStockLabel } from "./utils"

const COLUMNS = ["Name", "Category", "Price", "Quantity", "Reorder Level", "Stock Status", "Value"]

function cell(value, isText = false) {
  let text = String(value)

  if (isText && /^[=+\-@\t\r]/.test(text)) text = `'${text}`

  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`

  return text
}

export function productsToCsv(products) {
  const rows = products.map((product) => [
    cell(product.name, true),
    cell(product.category, true),
    cell(product.price.toFixed(2)),
    cell(product.quantity),
    cell(getReorderLevel(product)),
    cell(getStockLabel(product) ?? "In stock"),
    cell((product.price * product.quantity).toFixed(2))
  ])

  const lines = [COLUMNS, ...rows].map((row) => row.join(","))

  return "\uFEFF" + lines.join("\r\n") + "\r\n"
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}