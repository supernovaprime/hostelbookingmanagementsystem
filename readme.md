# Dwellix - Smart Hostel Booking Platform for Ghana

<div align="center">

![Dwellix Logo](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=Dwellix)

**The Future of Student Accommodation in Ghana**

[![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[Live Demo](https://dwellix.app) • [App Store](https://apps.apple.com) • [Google Play](https://play.google.com) • [Documentation](./docs)

</div>

## 🎯 Project Overview

**Dwellix** is a revolutionary mobile-first hostel booking platform designed specifically for the Ghanaian student accommodation market. Built with React Native and Expo, Dwellix connects students with their perfect hostels while providing hostel managers with powerful tools to grow their business.

### 🚀 Why Dwellix?

- **🇬🇭 Ghana-First Design**: Tailored for local universities, mobile money, and connectivity challenges
- **📱 Mobile-First**: Native iOS and Android apps built with Expo for seamless user experience
- **💰 Smart Pricing**: Fixed GHS 75 per new student model - no percentage commissions
- **🔒 Bank-Level Security**: Enterprise-grade security for all transactions and data
- **📈 Real-Time Analytics**: Data-driven insights for hostel managers and platform admins

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Node.js API   │    │   MongoDB       │
│   Mobile App    │◄──►│   Express.js    │◄──►│   Atlas DB      │
│   (Expo)        │    │   Backend       │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Redis Cache   │              │
         └──────────────►│   (Upstash)     │◄─────────────┘
                        └─────────────────┘
```

## 📱 Mobile Application (React Native + Expo)

### **Tech Stack**
- **React Native** with **TypeScript** for type safety
- **Expo** for seamless development and deployment
- **React Navigation** for smooth app navigation
- **React Query** for data fetching and offline support
- **React Hook Form** for efficient form management
- **Expo SecureStore** for secure credential storage

### **Key Features**
- **🔍 Smart Search**: Advanced filters for location, price, amenities
- **📸 QR Code Scanner**: Instant hostel discovery and booking
- **💳 Mobile Money Integration**: MTN, Vodafone, AirtelTigo support
- **📱 Offline Mode**: Works seamlessly with poor internet connectivity
- **🔔 Real-Time Notifications**: Booking updates and payment confirmations

## 🎯 Core Objectives

### 1. **Student-Centric Booking Experience**
- **Intuitive Search**: Find hostels by university, location, price, and amenities
- **Real-Time Availability**: Live updates on room availability and pricing
- **Secure Booking**: Safe payment processing with mobile money integration
- **Verified Reviews**: Authentic student reviews and ratings
- **Roommate Matching**: Connect with compatible roommates

### 2. **Manager Empowerment Tools**
- **Easy Listing**: Simple hostel and room management interface
- **Booking Management**: Approve/reject bookings with one tap
- **Payment Tracking**: Monitor payments and generate receipts
- **Analytics Dashboard**: Track occupancy, revenue, and performance
- **Marketing Tools**: Featured listings and promotional features

### 3. **Platform Administration**
- **User Management**: Oversee students, managers, and platform health
- **Dispute Resolution**: Handle conflicts and ensure fair practices
- **Revenue Analytics**: Monitor platform growth and financial performance
- **Quality Control**: Verify hostels and maintain platform standards

## 💰 Business Model

### **Student Subscription Tiers (Monthly)**
| Tier | Price | Features |
|------|-------|----------|
| **Explorer** | GHS 10 | Browse hostels, basic info, reviews |
| **Seeker** | GHS 25 | Photos, contact info, advanced search |
| **Booker** | GHS 45 | Priority booking, direct messaging, verified badge |

### **Manager Commission**
- **Fixed GHS 75** per new student (first 10 students/month)
- **GHS 50** per additional student (volume discount)
- **0% commission** on existing students
- **3-month free trial** period

## 🛠️ Technology Stack

### **Mobile App**
```
React Native + Expo
├── TypeScript (Type Safety)
├── React Navigation (Routing)
├── React Query (Data Fetching)
├── React Hook Form (Forms)
├── Expo SecureStore (Security)
└── React Native Camera (QR Scanner)
```

### **Backend API**
```
Node.js + Express.js
├── JWT + bcrypt (Authentication)
├── MongoDB + Mongoose (Database)
├── Redis (Caching)
├── Socket.io (Real-time)
├── Paystack/Flutterwave (Payments)
└── Cloudinary (Image Storage)
```

### **Infrastructure**
```
Cost-Optimized Stack ($5/month)
├── DigitalOcean Droplet (Server)
├── MongoDB Atlas Free Tier (Database)
├── Upstash Redis Free (Caching)
├── Cloudinary Free (Images)
└── Let's Encrypt (SSL)
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- MongoDB Atlas account
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/dwellix.git
cd dwellix
```

2. **Install backend dependencies**
```bash
cd server
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

3. **Install mobile app dependencies**
```bash
cd mobile
npm install
cp .env.example .env
# Configure your environment variables
expo start
```

4. **Setup MongoDB**
- Create a free MongoDB Atlas cluster
- Copy connection string to `.env` file
- Run `npm run seed` to populate sample data

### **Environment Variables**
```env
# Backend (.env)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
PAYSTACK_SECRET=your_paystack_key
CLOUDINARY_CLOUD_NAME=your_cloud_name

# Mobile (.env)
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## 📱 App Screenshots

<div align="center">
  <img src="https://via.placeholder.com/300x600/4A90E2/FFFFFF?text=Home+Screen" width="180" />
  <img src="https://via.placeholder.com/300x600/47A248/FFFFFF?text=Search+Screen" width="180" />
  <img src="https://via.placeholder.com/300x600/FF6B6B/FFFFFF?text=Booking+Screen" width="180" />
  <img src="https://via.placeholder.com/300x600/FFA500/FFFFFF?text=Profile+Screen" width="180" />
</div>

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team** - Amazing React Native framework
- **Paystack** - Payment processing for Africa
- **MongoDB Atlas** - Generous free tier
- **Ghanaian Universities** - Early feedback and testing

## 📞 Contact

- **Website**: [dwellix.app](https://dwellix.app)
- **Email**: hello@dwellix.app
- **Twitter**: [@dwellixgh](https://twitter.com/dwellixgh)
- **LinkedIn**: [Dwellix Ghana](https://linkedin.com/company/dwellix)

---

<div align="center">

**⭐ Star this repository if it inspired you!**

Made with ❤️ for Ghanaian Students

</div>
