A scalable, modular, and production-ready backend for managing cooperative society operations — including member accounts, contributions, loans, withdrawals, and financial ledger tracking.
Built using NestJS, Mongoose, and follows clean architecture principles.

## 📌 Features

### 👥 Member Management

- Create and manage members
- Unique memberId for public reference
- Secure internal \_id for database relations
- Authentication & role-based access (Member / Admin)

### 💰 Accounts & Balances

- Each member has financial accounts
- Auto-opened on member creation
- Real-time balance updates
- Ledger-backed transactions

### 🧾 Contributions

- Cash or transfer contributions
- Admin can record cash payments
- Auto-updates: Accounts, Ledger
- Contributions Collection

### 🧾 Ledger System

- A single source of truth for all financial operations
- Debits & credits
- Tracks reference entities: Contribution, Loan, Repayment, Withdrawal
- Indexed for fast financial reporting
- Immutable entries

### 💸 Loans

- Loan application, approval, and repayment

Stores:

principal

interest rate

term

start date

status lifecycle (PENDING → APPROVED → ACTIVE → PAID)

- Only approved loans create a ledger entry
- Admin-only approval workflow
- Linked to member & loan liability account

### 🏧 Withdrawals

Member requests withdrawal → Admin approval workflow → Balance validations → Ledger + Account updates on approval

## 🏛 Architecture Overview

### 🗂 Tech Stack

- NestJS – Modules, services, controllers
- MongoDB + Mongoose – Schemas, modeling, indexing
- JWT Authentication – With roles (Admin/Member)
- Class validators + DTOs
- Environment-driven configuration

### 📁 Folder Structure

```folder
src/
  modules/
    members/
    accounts/
    contributions/
    loans/
    withdrawals/
    ledger/
    admin/
  common/
    guards/
    decorators/
    interceptors/
  config/
  main.ts
```

## 🚀 Setup & Installation

1️⃣ Clone Repository

```bash
git clone https://github.com/<your-repo>/coop-management-backend.git
cd coop-management-backend
```

2️⃣ Install Dependencies

```bash
npm install
```

3️⃣ Configure Environment Variables
Create .env:

```bash

MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
PORT=4000

```

4️⃣ Start Application

```bash
npm run start:dev
```

## 🧪 Testing

Commands:

```bash
npm run test
npm run test:e2e
```
