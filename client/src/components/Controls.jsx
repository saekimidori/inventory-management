import { CATEGORIES } from "../utils"

// Controls owns no state. It shows the values it's given and reports changes upward.
export default function Controls({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  onClear
}) {
  return (
    <div id="inventory-controls">
      <div className="control-group">
        <label htmlFor="search-input">Search</label>
        <input
          type="search"
          id="search-input"
          placeholder="Search products..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="control-group">
        <label htmlFor="category-select">Category</label>
        <select
          id="category-select"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="sort-select">Sort By</label>
        <select
          id="sort-select"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="default">Default order</option>
          <option value="name">Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="quantity-low">Quantity: Low to High</option>
          <option value="quantity-high">Quantity: High to Low</option>
        </select>
      </div>

      <button type="button" id="clear-filters" onClick={onClear}>
        Clear filters
      </button>
    </div>
  )
}
