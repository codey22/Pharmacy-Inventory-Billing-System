# PharmaManage - Pharmacy Inventory & Billing System

PharmaManage is a comprehensive web-based application designed to streamline pharmacy operations. It integrates robust inventory management, a point-of-sale (POS) billing system, and detailed reporting analytics into a single, modern interface. Built with performance and scalability in mind using Next.js 16 and MongoDB.

## 🚀 Key Features

### 📦 Inventory Management
- **Real-time Stock Tracking**: Monitor medicine quantities, batch numbers, and expiry dates.
- **Smart Search**: Instantly find medicines by name, brand, or category.
- **Low Stock Alerts**: Automatic indicators for items running low on stock.
- **Expiry Management**: Dedicated monitoring for expired or soon-to-expire medicines.

### 💳 POS & Billing System
- **Fast Billing**: Quick-add cart system for efficient over-the-counter sales.
- **Dynamic Pricing**: Support for GST calculation, global discounts, and threshold-based bulk discounts.
- **Cash Payments**: Streamlined cash transaction recording.
- **Professional Invoices**: Auto-generate and print thermal-ready PDF invoices.

### 📊 Reports & Analytics
- **Financial Dashboard**: Visualize total revenue, profit margins, and sales growth.
- **Data Export**: Export comprehensive sales reports to CSV for external analysis.
- **Sales History**: Searchable digital archive of all past transactions.
- **Inventory Insights**: Reports on expired stock and inventory valuation.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Authentication**: Custom JWT Auth (Secure, Lightweight)
- **Styling**: CSS Modules (Modern, Responsive Design)
- **Utilities**: 
  - `jspdf` & `jspdf-autotable` (Invoice Generation)
  - `date-fns` (Date Formatting)
  - `lucide-react` (Icons)

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB installed locally or a MongoDB Atlas connection string

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pharmacy-inventory-billing.git
   cd pharmacy-inventory-billing
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Rename `.env.example` to `.env.local` and add your credentials:
   ```env
   MONGODB_URI=mongodb+srv://...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   ALLOWED_EMAILS=admin@account.com
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📄 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## 🔒 Security

- **Authentication**: Secure JWT-based sessions with HTTP-only cookies.
- **Data Safety**: Server-side validation for all inventory and billing transactions.
- **Access Control**: Protected routes and API endpoints.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.
