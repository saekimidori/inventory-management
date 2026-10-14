# Inventory Management

A web app for tracking a clothing store's inventory. View products, add, edit and delete them, search and filter, and see at a glance what's running low.

[See live demo](https://inventory-management-mddm.onrender.com/)

The first load after a quiet period can take up to a minute, and the data resets to the starter products whenever the service restarts.

## Features

- View products with category, price, quantity and reorder level
- Add, edit and delete products
- Search by name or category, filter by category, and sort by name, price or quantity
- Quick `+` / `−` buttons to adjust a product's stock by one
- 'Low stock' and 'out of stock' labels, based on each product's own reorder level
- Inventory summary: total products, total units, inventory value and low stock count
- Duplicate protection: the same name can't exist twice in one category
- Data is stored in a SQLite database, so it persists between sessions

## Tech stack

- **Frontend:** HTML, CSS and JavaScript
- **Backend:** Node.js with Express
- **Database:** SQLite, using Node's built-in `node:sqlite` module

## Run locally

You need [Node.js](https://nodejs.org) 24 (built and tested with v24.13.1).

```bash
git clone https://github.com/saekimidori/inventory-management.git
cd inventory-management
npm install
node server.js
```

Then open **http://localhost:3000**.

The first run creates `inventory.db` and fills it with four starter products. Node may print an `ExperimentalWarning` about SQLite, which is expected. To reset the data, stop the server, delete `inventory.db`, and start it again.

To restart the server automatically when files change while you're developing, run `node --watch server.js` instead.

## Future Improvements

- Deploy it so it can be used from more than one device
- Add a login, since anyone who can reach the server can currently change stock
- Add automated tests for the API
- Export the inventory to CSV