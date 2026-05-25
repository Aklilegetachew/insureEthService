# Insurance Platform Backend

Initial Node.js, Express, TypeScript, PostgreSQL, Prisma, JWT, and Zod backend foundation for the insurance digital platform.

## Prerequisites

- Node.js 20 or later
- PostgreSQL
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your PostgreSQL connection string and a secure JWT secret.

4. Generate the Prisma client after adding a Prisma schema:

   ```bash
   npm run db:generate
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` starts the TypeScript development server with watch mode.
- `npm run build` compiles TypeScript into `dist`.
- `npm run start` runs the compiled server.
- `npm run typecheck` checks TypeScript without emitting files.
- `npm run db:generate` generates Prisma client types.
- `npm run db:migrate` runs Prisma migrations in development.

## API

- `GET /api/health` returns service health information.
- `GET /api/v1/health` returns API v1 health information.
- `POST /api/v1/auth/register-customer` registers a customer account.
- `POST /api/v1/auth/login` logs in with email or phone and password.
- `GET /api/v1/auth/me` returns the current authenticated user using a Bearer token.
- `POST /api/v1/auth/logout` returns a logout placeholder response.
- `GET /api/v1/products` lists insurance products.
- `GET /api/v1/products/:id` returns one insurance product.
- `POST /api/v1/products` creates an insurance product. Requires `SUPER_ADMIN` or `ADMIN`.
- `PUT /api/v1/products/:id` updates an insurance product. Requires `SUPER_ADMIN` or `ADMIN`.
- `DELETE /api/v1/products/:id` deletes an insurance product. Requires `SUPER_ADMIN` or `ADMIN`.

## Auth Examples

Register a customer:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register-customer \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Customer",
    "email": "customer@example.com",
    "phone": "+251911111111",
    "password": "Password123!",
    "nationalId": "NID-001",
    "address": "Addis Ababa",
    "dateOfBirth": "1990-01-01"
  }'
```

Login:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "customer@example.com",
    "password": "Password123!"
  }'
```

Get current user:

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Product API Contract

Product object:

```json
{
  "id": "uuid",
  "name": "Motor Comprehensive",
  "code": "MOTOR-COMP",
  "description": "Full motor protection",
  "category": "Motor",
  "status": "ACTIVE",
  "basePremium": "1500",
  "premiumRate": "0.075",
  "coverageDescription": "Own damage, theft, fire, and third party coverage",
  "requiredDocuments": ["Vehicle registration", "Driver license"],
  "termsAndConditions": "Standard policy terms apply.",
  "createdAt": "2026-05-23T10:00:00.000Z",
  "updatedAt": "2026-05-23T10:00:00.000Z"
}
```

List products:

```bash
curl "http://localhost:5000/api/v1/products?category=Motor&search=motor&status=ACTIVE" \
  -H "Authorization: Bearer OPTIONAL_ACCESS_TOKEN"
```

Customers and unauthenticated users only receive `ACTIVE` products. Admin and staff roles receive all products, and can optionally filter by `status`.

Get product by ID:

```bash
curl http://localhost:5000/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer OPTIONAL_ACCESS_TOKEN"
```

Create product:

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "name": "Motor Comprehensive",
    "code": "MOTOR-COMP",
    "description": "Full motor protection",
    "category": "Motor",
    "status": "ACTIVE",
    "basePremium": 1500,
    "premiumRate": 0.075,
    "coverageDescription": "Own damage, theft, fire, and third party coverage",
    "requiredDocuments": ["Vehicle registration", "Driver license", "Inspection report"],
    "termsAndConditions": "Standard policy terms apply."
  }'
```

Update product:

```bash
curl -X PUT http://localhost:5000/api/v1/products/PRODUCT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "name": "Motor Comprehensive Plus",
    "status": "INACTIVE",
    "premiumRate": 0.08
  }'
```

Delete product:

```bash
curl -X DELETE http://localhost:5000/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

Product validation notes:

- `name`, `code`, and `category` are required when creating.
- `code` must be unique and is normalized to uppercase.
- `status` must be `ACTIVE` or `INACTIVE`.
- `basePremium` and `premiumRate` must be positive numbers when provided.
- `requiredDocuments` can be an array of strings or a JSON object.
- Only `SUPER_ADMIN` and `ADMIN` can create, update, or delete products.

## Project Structure

```text
src/
  app.ts
  server.ts
  config/
    env.ts
    prisma.ts
  middlewares/
    auth.middleware.ts
    error.middleware.ts
    not-found.middleware.ts
    request-logger.middleware.ts
    role.middleware.ts
    validate.middleware.ts
  modules/
    auth/
    products/
  utils/
    api-response.ts
    app-error.ts
    async-handler.ts
  types/
```
