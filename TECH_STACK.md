# Tech Stack Architecture - Secure & Cost-Effective

## Core Philosophy
"Build secure, scale cheap, grow fast" - Maximum security with minimum costs for Ghanaian market.

## Backend Architecture

### **Core Stack**
- **Node.js + Express.js** - Lightweight, fast, low memory usage
- **MongoDB Atlas** - Free tier up to 512MB, pay-as-you-grow
- **Redis (Upstash)** - Free Redis for caching/sessions
- **JWT + bcrypt** - Stateless authentication, secure password hashing

### **Why This Stack for Security & Cost**

#### **Node.js Benefits**
- **Low server requirements** - 1GB RAM sufficient for start
- **Fast I/O** - Handles many concurrent connections
- **Huge ecosystem** - Security libraries readily available
- **JavaScript everywhere** - One language for frontend/backend

#### **MongoDB Atlas Free Tier**
- **512MB storage** - Enough for 10,000+ users initially
- **Automatic backups** - Built-in security
- **Global CDN** - Fast access across Ghana
- **Pay-as-you-grow** - Only pay when you exceed limits

#### **Redis (Upstash Free)**
- **10,000 requests/day** - Perfect for caching
- **Secure connections** - TLS encryption
- **Session storage** - Reduces database load
- **Rate limiting** - Prevents abuse

## Security Architecture

### **Authentication & Authorization**
```javascript
// JWT Structure
{
  "userId": "string",
  "role": "student|manager|admin",
  "permissions": ["array"],
  "iat": 1234567890,
  "exp": 1234567890
}

// Role-Based Access Control
const permissions = {
  student: ['browse', 'book', 'review'],
  manager: ['manage_hostel', 'approve_bookings', 'view_analytics'],
  admin: ['manage_platform', 'view_all_data', 'moderate']
}
```

### **Security Middleware Stack**
- **Helmet.js** - Sets security headers automatically
- **express-rate-limit** - Prevents DDoS attacks
- **express-validator** - Input sanitization
- **cors** - Cross-origin protection
- **morgan** - Request logging for security monitoring

### **Payment Security**
- **Paystack/Flutterwave SDK** - PCI compliant payment processing
- **Webhook signatures** - Verify payment notifications
- **Transaction tokens** - One-time use payment tokens
- **Audit logging** - Every transaction logged

## Cloud Infrastructure (Cost-Optimized)

### **Server Options (Cheapest to Most Expensive)**

#### **1. DigitalOcean Droplet ($5/month)**
- **1 vCPU, 1GB RAM, 25GB SSD**
- **Perfect for MVP stage**
- **Ubuntu 22.04 LTS**
- **Easy to scale vertically**

#### **2. AWS EC2 t3.micro ($8.52/month)**
- **2 vCPU, 1GB RAM, 8GB SSD**
- **Free tier for first 12 months**
- **Better reliability**
- **Easy integration with other AWS services**

#### **3. Heroku Dyno ($7/month)**
- **1x Dyno, 512MB RAM**
- **Zero deployment complexity**
- **Built-in SSL**
- **Easy scaling**

### **Recommended: DigitalOcean + Free Services**
**Monthly Cost Breakdown:**
- **Server:** $5 (DigitalOcean Droplet)
- **Database:** $0 (MongoDB Atlas Free)
- **Cache:** $0 (Upstash Redis Free)
- **File Storage:** $0 (Cloudinary Free tier)
- **Monitoring:** $0 (UptimeRobot Free)
- **Total:** $5/month

## Database Design (Security & Performance)

### **MongoDB Collections**
```javascript
// Users Collection
{
  _id: ObjectId,
  email: "encrypted",
  phone: "encrypted",
  password: "bcrypt_hash",
  role: "student|manager|admin",
  profile: {
    name: "string",
    university: "string",
    verified: false,
    verificationDocs: ["array"]
  },
  subscription: {
    tier: "explorer|seeker|booker",
    expires: Date,
    paymentHistory: ["array"]
  },
  security: {
    lastLogin: Date,
    loginAttempts: Number,
    lockedUntil: Date,
    twoFactorEnabled: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}

// Hostels Collection
{
  _id: ObjectId,
  managerId: ObjectId,
  name: "string",
  description: "string",
  address: {
    street: "encrypted",
    area: "string",
    city: "string",
    coordinates: [lat, lng]
  },
  contact: {
    phone: "encrypted",
    email: "encrypted",
    whatsapp: "encrypted"
  },
  verification: {
    documents: ["array"],
    verified: false,
    verifiedBy: ObjectId,
    verifiedAt: Date
  },
  pricing: {
    range: "GHS 4900-9000",
    paymentTerms: "yearly|semester"
  },
  images: ["cloudinary_urls"],
  qrCode: "unique_string",
  status: "active|inactive|suspended",
  createdAt: Date
}

// Bookings Collection
{
  _id: ObjectId,
  studentId: ObjectId,
  hostelId: ObjectId,
  roomId: ObjectId,
  dates: {
    checkIn: Date,
    checkOut: Date,
    duration: "yearly|semester"
  },
  payment: {
    amount: 7500,
    method: "mobile_money|direct",
    status: "pending|confirmed|failed",
    transactionId: "string",
    receiptUrl: "string",
    commissionPaid: false
  },
  status: "pending|confirmed|cancelled|completed",
  createdAt: Date
}
```

### **Security Indexes**
```javascript
// Performance + Security Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })
db.hostels.createIndex({ managerId: 1 })
db.bookings.createIndex({ studentId: 1, status: 1 })
db.bookings.createIndex({ hostelId: 1, createdAt: -1 })
```

## API Security Architecture

### **Rate Limiting Strategy**
```javascript
// Different limits per role
const rateLimits = {
  student: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  manager: {
    windowMs: 15 * 60 * 1000,
    max: 200
  },
  admin: {
    windowMs: 15 * 60 * 1000,
    max: 500
  }
}
```

### **Input Validation**
```javascript
// Example validation middleware
const bookingValidation = [
  body('hostelId').isMongoId().withMessage('Invalid hostel ID'),
  body('studentId').isMongoId().withMessage('Invalid student ID'),
  body('dates.checkIn').isISO8601().withMessage('Invalid check-in date'),
  body('payment.amount').isNumeric().withMessage('Invalid amount'),
  body('payment.method').isIn(['mobile_money', 'direct'])
]
```

## Mobile App Security

### **React Native Security Stack**
- **React Native Keychain** - Secure credential storage
- **React Native SSL Pinning** - Prevent man-in-the-middle attacks
- **React Native Biometrics** - Fingerprint/Face ID
- **React Native Device Info** - Device verification
- **Expo SecureStore** - Alternative secure storage

### **Data Security**
- **Local encryption** - Sensitive data encrypted on device
- **Secure HTTP only** - All API calls over HTTPS
- **Certificate pinning** - Prevent network interception
- **Root detection** - Block rooted/jailbroken devices

## Payment Integration Security

### **Mobile Money Integration**
```javascript
// Paystack Integration
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

// Secure payment initialization
const initializePayment = async (email, amount, callback_url) => {
  try {
    const response = await paystack.transaction.initialize({
      email,
      amount: amount * 100, // Convert to kobo
      callback_url,
      metadata: {
        custom_fields: [
          {
            display_name: "Student ID",
            variable_name: "student_id",
            value: studentId
          }
        ]
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error('Payment initialization failed');
  }
};
```

### **Webhook Security**
```javascript
// Verify Paystack webhook
const verifyWebhook = (req, res, next) => {
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  next();
};
```

## Monitoring & Logging

### **Free Monitoring Stack**
- **UptimeRobot** - Free uptime monitoring
- **Logtail** - Free log management
- **MongoDB Atlas** - Built-in performance monitoring
- **Node.js metrics** - Custom monitoring dashboard

### **Security Monitoring**
```javascript
// Security event logging
const securityLogger = {
  loginAttempt: (userId, ip, success) => {
    console.log(`LOGIN: ${userId} from ${ip} - ${success ? 'SUCCESS' : 'FAILED'}`);
  },
  paymentEvent: (transactionId, event) => {
    console.log(`PAYMENT: ${transactionId} - ${event}`);
  },
  suspiciousActivity: (userId, activity) => {
    console.log(`SUSPICIOUS: ${userId} - ${activity}`);
    // Send alert to admin
  }
};
```

## Cost Optimization Strategies

### **Database Optimization**
- **Connection pooling** - Reduce database connections
- **Query optimization** - Efficient MongoDB queries
- **Index usage** - Proper indexing for fast queries
- **Caching** - Redis for frequently accessed data

### **Server Optimization**
- **Nginx reverse proxy** - Load balancing, static file serving
- **PM2 process manager** - Auto-restart, clustering
- **Compression** - Gzip for API responses
- **CDN** - Cloudinary for images, CloudFlare for static assets

### **Scaling Strategy**
1. **Month 1-3:** Single $5 DigitalOcean droplet
2. **Month 4-6:** Add Redis cache, optimize database
3. **Month 7-12:** Upgrade to $10 droplet, add load balancer
4. **Year 2:** Multiple droplets, database clustering

## Development Workflow

### **Security Best Practices**
- **Environment variables** - Never commit secrets
- **Code scanning** - ESLint security rules
- **Dependency updates** - Regular security patches
- **Code reviews** - Security-focused PR reviews

### **Deployment Security**
- **Docker containers** - Isolated environments
- **SSL certificates** - Let's Encrypt free SSL
- **Firewall rules** - Only necessary ports open
- **Regular backups** - Automated database backups

## Total Monthly Cost (MVP Stage)

| Service | Cost | Purpose |
|---------|------|---------|
| DigitalOcean Droplet | $5 | Backend server |
| MongoDB Atlas | $0 | Database (free tier) |
| Upstash Redis | $0 | Caching (free tier) |
| Cloudinary | $0 | Image storage (free tier) |
| Let's Encrypt | $0 | SSL certificates |
| UptimeRobot | $0 | Monitoring |
| **Total** | **$5/month** | **Complete secure infrastructure** |

This stack provides enterprise-level security at startup costs, perfect for the Ghanaian market.
