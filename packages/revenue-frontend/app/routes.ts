import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Dashboard
  index("routes/_index.tsx"),

  // Accounts
  route("accounts", "routes/accounts._index.tsx"),
  route("accounts/new", "routes/accounts.new.tsx"),
  route("accounts/:id", "routes/accounts.$id.tsx"),
  route("accounts/:id/edit", "routes/accounts.$id.edit.tsx"),

  // Contracts
  route("contracts", "routes/contracts._index.tsx"),
  route("contracts/new", "routes/contracts.new.tsx"),
  route("contracts/:id", "routes/contracts.$id.tsx"),
  route("contracts/:id/edit", "routes/contracts.$id.edit.tsx"),

  // Products
  route("products", "routes/products._index.tsx"),
  route("products/new", "routes/products.new.tsx"),
  route("products/:id", "routes/products.$id.tsx"),
  route("products/:id/edit", "routes/products.$id.edit.tsx"),

  // Invoices
  route("invoices", "routes/invoices._index.tsx"),
  route("invoices/new", "routes/invoices.new.tsx"),
  route("invoices/:id", "routes/invoices.$id.tsx"),
  route("invoices/:id/edit", "routes/invoices.$id.edit.tsx"),

  // Billing
  route("billing", "routes/billing._index.tsx"),
  route("billing/generate", "routes/billing.generate.tsx"),
  route("billing/batch", "routes/billing.batch.tsx"),
  route("billing/consolidated", "routes/billing.consolidated.tsx"),
  route("billing/jobs/:jobId", "routes/billing.jobs.$jobId.tsx"),
] satisfies RouteConfig;
