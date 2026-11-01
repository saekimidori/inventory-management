# Inventory Management

A web app for tracking a clothing store's inventory. View products, add, edit and delete them, search and filter, and see at a glance what's running low.

## Live Demo

[See live demo](https://inventory-management-mddm.onrender.com/)

The first load after a quiet period can take up to a minute, and the data resets to the starter products whenever the service restarts.

Use **Reset demo data** to restore the starter products.

## Features

- View products with category, price, quantity and reorder level
- Add, edit and delete products
- Search by name or category, filter by category, and sort by name, price or quantity
- Quick `+` / `−` buttons to adjust a product's stock by one
- Reset demo data button to restore the starter products.
- 'Low stock' and 'out of stock' labels, based on each product's own reorder level
- Inventory summary: total products, total units, inventory value and low stock count
- Duplicate protection: the same name can't exist twice in one category
- Data is stored in a SQLite database, so it persists between sessions

## Tech stack

- **Frontend:** React, built with Vite
- **Backend:** Node.js with Express
- **Database:** SQLite, using Node's built-in `node:sqlite` module

A plain JavaScript version of the frontend, from before the React rewrite, is on the [`vanilla-js` branch](https://github.com/saekimidori/inventory-management/tree/vanilla-js).

## Run locally

You need [Node.js](https://nodejs.org) 24.

```bash
git clone https://github.com/saekimidori/inventory-management.git
cd inventory-management
npm install
```

**Production-style (one server):**

```bash
npm run build
npm start
```

Open **http://localhost:3000**.

**Development (with live reload):**

```bash
# terminal 1, in the project root
node --watch server.js

# terminal 2
npm install --prefix client
npm run dev --prefix client
```

Open **http://localhost:5173**. The dev server forwards `/api` requests to the Express server on port 3000.

The first run creates `inventory.db` and fills it with four starter products. To reset the data, stop the server, delete `inventory.db`, and start it again.

## Project structure

```
.
├── server.js           Express server and API routes
├── db.js               SQLite setup and database functions
├── package.json
└── client/             React frontend (Vite)
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js      Requests to the API
        ├── utils.js    Filtering, sorting and stock helpers
        ├── index.css
        └── components/
            ├── Controls.jsx
            ├── ProductCard.jsx
            ├── ProductDialog.jsx
            └── SummaryCards.jsx
```

## Future Improvements

- Add a login, since anyone who can reach the server can currently change stock
- Add automated tests for the API
- Export the inventory to CSV