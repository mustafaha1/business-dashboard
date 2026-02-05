# 🚀 API Quick Reference Guide

This guide provides quick reference to all API endpoints in your Business Dashboard Backend.

## Base URL
```
http://localhost:3000
```

## Authentication
Currently no authentication required. All endpoints are open.

---

## 👥 Staff Management

### Get All Staff
```http
GET /api/staff
```
**Response:**
```json
[
  { "id": 1, "name": "John", "created_at": "2024-01-15 10:00:00" },
  { "id": 2, "name": "Sarah", "created_at": "2024-01-15 10:00:00" }
]
```

### Add Staff Member
```http
POST /api/staff
Content-Type: application/json

{
  "name": "Alice"
}
```
**Response:**
```json
{ "id": 3, "name": "Alice", "created_at": "2024-01-15 10:30:00" }
```

### Delete Staff Member
```http
DELETE /api/staff/3
```
**Response:**
```json
{ "message": "Staff member deleted successfully" }
```

---

## 🏢 Supplier Management

### Get All Suppliers
```http
GET /api/suppliers
```
**Response:**
```json
[
  { "id": 1, "name": "Supplier A", "created_at": "2024-01-15 10:00:00" },
  { "id": 2, "name": "Supplier B", "created_at": "2024-01-15 10:00:00" }
]
```

### Add Supplier
```http
POST /api/suppliers
Content-Type: application/json

{
  "name": "New Supplier"
}
```

### Delete Supplier
```http
DELETE /api/suppliers/2
```

---

## 🤝 Partner Management

### Get All Partners
```http
GET /api/partners
```
**Response:**
```json
[
  { "id": 1, "email": "partner@example.com", "created_at": "2024-01-15 10:00:00" }
]
```

### Add Partner
```http
POST /api/partners
Content-Type: application/json

{
  "email": "new@partner.com"
}
```

### Delete Partner
```http
DELETE /api/partners/1
```

---

## 💰 Sales Data

### Get Sales for Specific Date
```http
GET /api/sales/2024-01-15
```
**Response:**
```json
{
  "id": 1,
  "date": "2024-01-15",
  "shop_sales": 1200.00,
  "delivery_sales": 800.00,
  "online_sales": 600.00,
  "card_payment": 500.00,
  "created_at": "2024-01-15 10:00:00",
  "updated_at": "2024-01-15 10:00:00"
}
```

### Get Sales for Date Range
```http
GET /api/sales?startDate=2024-01-15&endDate=2024-01-22
```
**Response:**
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "shop_sales": 1200.00,
    "delivery_sales": 800.00,
    "online_sales": 600.00,
    "card_payment": 500.00
  },
  {
    "id": 2,
    "date": "2024-01-16",
    "shop_sales": 900.00,
    "delivery_sales": 700.00,
    "online_sales": 400.00,
    "card_payment": 600.00
  }
]
```

### Save Sales Data
```http
POST /api/sales
Content-Type: application/json

{
  "date": "2024-01-15",
  "shop_sales": 1200,
  "delivery_sales": 800,
  "online_sales": 600,
  "card_payment": 500
}
```
**Response:**
```json
{ "message": "Sales data updated successfully" }
```

---

## 👷 Staff Assignments

### Get Assignments for Date Range
```http
GET /api/staff-assignments?startDate=2024-01-15&endDate=2024-01-22
```
**Response:**
```json
[
  {
    "id": 1,
    "staff_id": 1,
    "staff_name": "John",
    "date": "2024-01-15",
    "hours": 8.0,
    "rate": 15.50,
    "cost": 124.00,
    "source": "manual",
    "created_at": "2024-01-15 10:00:00"
  }
]
```

### Add Staff Assignment
```http
POST /api/staff-assignments
Content-Type: application/json

{
  "staff_id": 1,
  "date": "2024-01-15",
  "hours": 8.0,
  "rate": 15.50
}
```

### Delete Staff Assignment
```http
DELETE /api/staff-assignments/1
```

---

## 📦 Supplier Orders

### Get Orders for Date Range
```http
GET /api/supplier-orders?startDate=2024-01-15&endDate=2024-01-22
```
**Response:**
```json
[
  {
    "id": 1,
    "supplier_id": 1,
    "supplier_name": "Supplier A",
    "date": "2024-01-15",
    "amount": 250.00,
    "created_at": "2024-01-15 10:00:00"
  }
]
```

### Add Supplier Order
```http
POST /api/supplier-orders
Content-Type: application/json

{
  "supplier_id": 1,
  "date": "2024-01-15",
  "amount": 250.00
}
```

### Delete Supplier Order
```http
DELETE /api/supplier-orders/1
```

---

## 🕒 Clock Sessions

### Get Active Sessions
```http
GET /api/clock-sessions/active
```
**Response:**
```json
[
  {
    "id": 1,
    "staff_id": 1,
    "staff_name": "John",
    "clock_in_time": "2024-01-15 09:00:00",
    "rate": 15.50,
    "total_seconds": 3600,
    "total_hours": 1.0
  }
]
```

### Clock In Staff
```http
POST /api/clock-sessions/clock-in
Content-Type: application/json

{
  "staff_id": 1,
  "rate": 15.50
}
```
**Response:**
```json
{ "id": 1, "message": "Clocked in successfully" }
```

### Clock Out Staff
```http
POST /api/clock-sessions/clock-out/1
```
**Response:**
```json
{
  "message": "Clocked out successfully",
  "hours_worked": "8.00",
  "cost": "124.00"
}
```

---

## ⚙️ Settings

### Get Setting
```http
GET /api/settings/partner_percentage
```
**Response:**
```json
{ "id": 1, "key": "partner_percentage", "value": "50", "updated_at": "2024-01-15 10:00:00" }
```

### Update Setting
```http
POST /api/settings
Content-Type: application/json

{
  "key": "partner_percentage",
  "value": "60"
}
```

---

## 📈 Reports

### Business Summary Report
```http
GET /api/reports/summary?startDate=2024-01-15&endDate=2024-01-22
```
**Response:**
```json
{
  "period": {
    "startDate": "2024-01-15",
    "endDate": "2024-01-22"
  },
  "sales": {
    "total": 3100.00,
    "shop": 1200.00,
    "delivery": 800.00,
    "online": 600.00,
    "cardPayment": 500.00
  },
  "expenses": {
    "total": 1374.00,
    "staff": 1124.00,
    "supplier": 250.00
  },
  "profit": {
    "net": 1726.00,
    "partnerPercentage": 50,
    "partnerShare": 863.00,
    "ownerShare": 863.00
  }
}
```

### Individual Account Statement
```http
GET /api/reports/account?type=staff&id=1&startDate=2024-01-15&endDate=2024-01-22
```
**Parameters:**
- `type`: "staff" or "supplier"
- `id`: Staff or supplier ID
- `startDate`: Start date
- `endDate`: End date

**Response:**
```json
{
  "type": "staff",
  "name": "John",
  "period": {
    "startDate": "2024-01-15",
    "endDate": "2024-01-22"
  },
  "transactions": [
    {
      "id": 1,
      "date": "2024-01-15",
      "hours": 8.0,
      "rate": 15.50,
      "cost": 124.00
    }
  ],
  "totals": {
    "hours": 40.0,
    "cost": 620.00
  }
}
```

---

## 📱 Frontend Integration

### Example: Fetch Staff Members
```javascript
const staff = await fetch('/api/staff')
  .then(res => res.json());
console.log(staff);
```

### Example: Save Sales Data
```javascript
await fetch('/api/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2024-01-15',
    shop_sales: 1200,
    delivery_sales: 800,
    online_sales: 600,
    card_payment: 500
  })
});
```

### Example: Generate Report
```javascript
const report = await fetch('/api/reports/summary?startDate=2024-01-15&endDate=2024-01-22')
  .then(res => res.json());
console.log(`Total Profit: £${report.profit.net}`);
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{ "error": "Staff name is required" }
```

### 404 Not Found
```json
{ "error": "Staff member not found" }
```

### 409 Conflict
```json
{ "error": "Staff member already exists" }
```

### 500 Server Error
```json
{ "error": "Internal server error" }
```

---

## 🔧 Testing Endpoints

### Using cURL:
```bash
# Get all staff
curl http://localhost:3000/api/staff

# Add new staff
curl -X POST http://localhost:3000/api/staff \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Staff"}'

# Get business report
curl "http://localhost:3000/api/reports/summary?startDate=2024-01-15&endDate=2024-01-22"
```

### Using Postman:
1. Import this URL: `http://localhost:3000`
2. Create requests for each endpoint
3. Use appropriate HTTP methods (GET, POST, DELETE)

---

## 📊 Rate Limiting

Currently no rate limiting. For production, consider adding:
- Request limits per IP
- Authentication requirements
- API key system

---

**Base URL:** `http://localhost:3000`
**Full Documentation:** See README.md
**Quick Setup:** See SETUP_GUIDE.md