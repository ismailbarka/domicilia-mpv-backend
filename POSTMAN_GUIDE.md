# Postman API Guide

This guide describes how to interact with the Domicilia Backend API using Postman.

**Base URL:** `http://localhost:3000`

---

## 1. Categories Management

### Create Category
- **Method:** `POST`
- **URL:** `/categories`
- **Body:** `raw (JSON)`
```json
{
  "nameFr": "Ménage",
  "nameAr": "تنظيف"
}
```

### Get All Categories
- **Method:** `GET`
- **URL:** `/categories`

### Delete Category
- **Method:** `DELETE`
- **URL:** `/categories/:id`

---

## 2. Providers Management

### Create Provider (with Photo)
- **Method:** `POST`
- **URL:** `/providers`
- **Body:** `form-data`
  - `firstnameFr`: (Text) "John"
  - `lastnameFr`: (Text) "Doe"
  - `firstnameAr`: (Text) "جون"
  - `lastnameAr`: (Text) "دو"
  - `phone`: (Text) "+212600000000"
  - `descriptionFr`: (Text) "Expert cleaner"
  - `descriptionAr`: (Text) "خبير تنظيف"
  - `latitude`: (Text/Number) 33.5731
  - `longitude`: (Text/Number) -7.5898
  - `categoryId`: (Text/Number) 1
  - `rating`: (Text/Number) 5
  - `age`: (Text/Number) 30 (optional)
  - `photo`: (File) Select an image

### Update Provider (Partial)
- **Method:** `PATCH`
- **URL:** `/providers/:id`
- **Body:** `form-data` or `raw (JSON)`
- **Example JSON (no photo update):**
```json
{
  "firstnameFr": "Jonathan",
  "rating": 4
}
```

### Get All Providers (with Filters)
- **Method:** `GET`
- **URL:** `/providers`
- **Query Params (Optional):**
  - `categoryId`: 1
  - `lat`: 33.5731
  - `lng`: -7.5898
  - `distance`: 10 (in km)

### Delete Provider
- **Method:** `DELETE`
- **URL:** `/providers/:id`

---

## 3. Utilities

### Seed Dummy Data
- **Method:** `POST`
- **URL:** `/providers/seed`
- *Note: Requires at least one category to exist first.*

### Delete All Providers
- **Method:** `DELETE`
- **URL:** `/providers`
