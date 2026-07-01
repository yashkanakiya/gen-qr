# 🎯 gen-qr

<div align="center">

**The Ultimate QR Code Generation & Analytics Platform**

A modern, full-featured application for generating, managing, and tracking QR codes with advanced analytics, user authentication, and beautiful UI.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-gen--qr--rust.vercel.app-blue?style=for-the-badge)](https://gen-qr-rust.vercel.app)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org)

</div>

---

## ✨ Features

### 🔧 Core Functionality
- **QR Code Generation**: Create QR codes for URLs, emails, phone numbers, WiFi, vCards, and more
- **Smart URL Shortening**: Generate custom short links with slug support
- **Dynamic QR Codes**: Update QR code content without changing the code itself
- **PDF Upload & Convert**: Upload PDF files and convert them into QR codes
- **Batch Operations**: Generate multiple QR codes at once

### 📊 Advanced Analytics
- **Real-time Tracking**: Monitor QR code scans with detailed metrics
- **Geolocation Data**: Track scan origins by country and region
- **Device Analytics**: Get insights on device types (mobile, tablet, desktop)
- **Browser Detection**: Understand which browsers scan your codes
- **Operating System Data**: Identify OS distribution (Windows, macOS, iOS, Android, etc.)
- **Referrer Tracking**: See where traffic originates from
- **Visual Dashboard**: Beautiful charts and statistics with Chart.js

### 🔐 Security & Authentication
- **User Authentication**: Secure login and registration with JWT tokens
- **Password Encryption**: Bcrypt-based password hashing
- **Protected API**: Role-based access control for QR codes
- **Secure File Upload**: Validated PDF uploads with size limits (5MB max)
- **CORS Protection**: Configured cross-origin request handling

### 🎨 User Experience
- **Modern UI**: Built with Vue 3 and TailwindCSS
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Dark/Light Mode Support**: Theme switching capability
- **PrimeVue Components**: Professional UI components library
- **Real-time Notifications**: Toast notifications for user feedback
- **Interactive Charts**: Beautiful data visualizations

---

## 🏗️ Architecture

### Tech Stack

```
Frontend                          Backend
├── Vue 3                         ├── Node.js + Express
├── TypeScript                    ├── PostgreSQL
├── TailwindCSS                   ├── JWT Authentication
├── PrimeVue                      ├── Multer (File Upload)
├── Pinia (State Management)      ├── QR Code Library
├── Vue Router                    └── bcrypt (Password Hashing)
├── Chart.js
└── Vite (Build Tool)
```

### Project Structure

```
gen-qr/
├── frontend/                    # Vue 3 + TypeScript Frontend
│   ├── src/
│   │   ├── components/          # Reusable Vue components
│   │   ├── views/               # Page components
│   │   ├── stores/              # Pinia state management
│   │   ├── router/              # Vue Router configuration
│   │   ├── services/            # API calls & utilities
│   │   └── App.vue              # Root component
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js + Express Backend
│   ├── routes/                  # API route handlers
│   ├── database/                # PostgreSQL setup & operations
│   ├── middleware/              # Express middleware
│   ├── utils/                   # Helper utilities
│   ├── uploads/                 # File storage directory
│   ├── server.js                # Express app setup
│   └── package.json
│
└── package.json                 # Root package with scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.19.0 or >=22.12.0
- **PostgreSQL**: Database server running
- **npm** or **yarn**: Package manager

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yashkanakiya/gen-qr.git
   cd gen-qr
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   
   Create `.env` file in the root directory:
   ```env
   # Backend
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/gen_qr
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   
   # Frontend
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Initialize Database**
   
   The database will auto-initialize on first server run. Ensure PostgreSQL is running.

### Running the Application

#### Development Mode (Concurrent Frontend & Backend)

```bash
npm run dev
```

This command runs both frontend and backend simultaneously:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

#### Frontend Only

```bash
npm run frontend
# or
cd frontend && npm run dev
```

#### Backend Only

```bash
npm run backend
# or
cd backend && npm run dev
```

### Building for Production

```bash
npm run build
```

This builds the frontend for production with optimizations.

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### QR Codes
- `POST /api/qrcodes` - Create new QR code
- `GET /api/qrcodes` - Get user's QR codes
- `GET /api/qrcodes/:id` - Get specific QR code
- `PUT /api/qrcodes/:id` - Update QR code
- `DELETE /api/qrcodes/:id` - Delete QR code
- `GET /api/qrcodes/:id/analytics` - Get scan analytics

### Analytics
- `GET /api/track/:slug` - Track QR code scan
- `GET /api/debug/scan/:slug` - Debug scan information

### File Upload
- `POST /api/upload` - Upload PDF file

---

## 🎯 Usage Examples

### Generate a QR Code

```javascript
// Create QR code from frontend
const qrCode = {
  name: "My Website",
  type: "url",
  value: "https://example.com",
  slug: "example-link"
};

await createQRCode(qrCode);
```

### Track QR Scans

View real-time analytics:
- Total scan count
- Geographic distribution
- Device type breakdown
- Browser statistics
- OS distribution
- Referrer sources

### Upload & Convert

Upload a PDF file and convert it to a QR code for easy distribution.

---

## 🎨 Customization

### Styling

The application uses TailwindCSS for styling. Customize by editing:
- `frontend/src/App.vue` - Global styles
- `frontend/tailwind.config.js` - TailwindCSS configuration
- `frontend/src/components/*` - Component-specific styles

### Theme

PrimeVue theme can be configured in `frontend/src/main.ts`:
```typescript
import { definePreset } from '@primevue/themes';

const preset = definePreset({
  // your theme configuration
});
```

---

## 📊 Database Schema

### QR Codes Table
```sql
qr_codes {
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users,
  name: VARCHAR,
  type: ENUM (url, email, phone, wifi, vcard),
  value: TEXT,
  slug: VARCHAR UNIQUE,
  scan_count: INTEGER,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Scan Analytics Table
```sql
scan_analytics {
  id: UUID PRIMARY KEY,
  qr_id: UUID REFERENCES qr_codes,
  ip: VARCHAR,
  country: VARCHAR,
  device_type: VARCHAR,
  browser: VARCHAR,
  os: VARCHAR,
  referer: TEXT,
  scanned_at: TIMESTAMP
}
```

---

## 🔒 Security Features

- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: Bcrypt for secure password storage
- ✅ **CORS Protection**: Restricted cross-origin requests
- ✅ **File Validation**: Only PDFs allowed, 5MB size limit
- ✅ **Rate Limiting**: Prevents abuse of API endpoints
- ✅ **SQL Injection Prevention**: Parameterized queries with PostgreSQL
- ✅ **XSS Protection**: Vue's built-in XSS prevention
- ✅ **Environment Variables**: Sensitive data in .env files

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Frontend Setup**
   ```bash
   vercel --prod
   ```

2. **Backend Setup**
   - Use Vercel Serverless Functions or Heroku
   - Configure environment variables in deployment platform
   - Update database connection in production

### Docker Support (Optional)

Create a `Dockerfile` for containerization:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "backend/server.js"]
```

---

## 📈 Performance Optimizations

- **Lazy Loading**: Vue Router lazy-loads route components
- **Code Splitting**: Vite automatically splits code bundles
- **Asset Optimization**: Minified and compressed assets
- **Database Indexing**: Optimized database queries
- **CDN Support**: Static assets served via CDN
- **Caching**: Browser and server-side caching

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: ECONNREFUSED
```
**Solution**: Ensure PostgreSQL is running and `.env` credentials are correct.

### Port Already in Use
```
Error: Port 3000/5173 already in use
```
**Solution**: Change PORT in `.env` or kill process on that port.

### CORS Error
**Solution**: Update `FRONTEND_URL` in backend `.env` to match your frontend URL.

### File Upload Error
**Solution**: Check file size (max 5MB) and ensure it's a PDF file.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 💬 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yashkanakiya/gen-qr/issues)
- **Email**: yashkanakiya@example.com
- **Website**: [gen-qr-rust.vercel.app](https://gen-qr-rust.vercel.app)

---

## 🙏 Acknowledgments

- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [Express.js](https://expressjs.com/) - Node.js web framework
- [PostgreSQL](https://www.postgresql.org/) - Powerful database
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [PrimeVue](https://primevue.org/) - UI component library
- [QR Code Library](https://www.npmjs.com/package/qrcode) - QR code generation

---

## 📊 Stats

- **Total Lines of Code**: 5000+
- **Frontend**: 72.6% Vue, 17.2% JavaScript, 8.5% TypeScript, 1.3% HTML, 0.4% CSS
- **Architecture**: Full-stack MEVN (MongoDB/PostgreSQL, Express, Vue, Node)
- **Components**: 20+ reusable Vue components
- **API Endpoints**: 15+ RESTful endpoints

---

<div align="center">

### ⭐ If you found this helpful, please star the repository!

[⬆ Back to top](#-gen-qr)

</div>
