// One helper for every request. On any failure it throws an Error with a readable message.
async function request(url, options) {
  let response
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options
    })
  } catch {
    throw new Error("Can't reach the server. Is it running?")
  }

  if (response.status === 204) return null // success with nothing to send back (delete)

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed.")
  }
  return body
}

export const getProducts = () => request("/api/products")

export const createProduct = (data) =>
  request("/api/products", { method: "POST", body: JSON.stringify(data) })

export const updateProduct = (id, data) =>
  request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) })

export const deleteProduct = (id) =>
  request(`/api/products/${id}`, { method: "DELETE" })

export const resetProducts = () => request("/api/reset", { method: "POST" })