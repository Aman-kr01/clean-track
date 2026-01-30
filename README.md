# Virasaat Cleanliness - Environment & Cleanliness Reporting System

A full-stack web application for reporting garbage and environmental issues with GPS location and image uploads.

## Features

- 🗑️ Report garbage with image upload and GPS location
- 📍 Interactive map showing all reports with Leaflet.js
- 👥 Admin panel to manage and resolve reports
- 🔐 Secure admin authentication
- 📱 Fully responsive design
- 🌍 Real-time location capture

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript
- **Database**: JSON file storage (easily upgradeable to MongoDB/PostgreSQL)
- **File Upload**: Multer
- **Maps**: Leaflet.js
- **Authentication**: Cookie-based sessions

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd virasaat
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server
```bash
npm start
```

5. Open your browser
```
http://localhost:3000
```

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123

⚠️ **Important**: Change these credentials in production by setting environment variables `ADMIN_USER` and `ADMIN_PASS`.

## Project Structure

```
virasaat/
├── public/                 # Static frontend files
│   ├── index.html         # Home page
│   ├── report.html        # Report submission page
│   ├── map.html           # Interactive map page
│   ├── admin.html         # Admin panel
│   ├── styles.css         # Application styles
│   ├── *.js              # Frontend JavaScript files
│   └── uploads/          # Uploaded images (development only)
├── data/                  # JSON data storage (development only)
│   └── reports.json       # Reports database
├── server.js              # Express server
├── package.json           # Node.js dependencies
├── Procfile              # Heroku deployment
├── .env.example          # Environment variables template
└── README.md             # This file
```

## API Endpoints

### Public APIs
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Submit a new report (with image)

### Admin APIs (Protected)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Check authentication status
- `PUT /api/reports/:id/resolve` - Mark report as resolved
- `DELETE /api/reports/:id` - Delete a report

## Deployment Options

### 1. Heroku (Recommended)

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set ADMIN_USER=your-admin-user
heroku config:set ADMIN_PASS=your-secure-password
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### 2. Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### 3. Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 4. DigitalOcean App Platform

1. Create a new app in DigitalOcean control panel
2. Connect your GitHub repository
3. Set environment variables
4. Deploy automatically

### 5. Traditional VPS (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup
git clone <repository-url>
cd virasaat
npm install

# Configure environment
cp .env.example .env
# Edit .env file

# Start with PM2
pm2 start server.js --name "virasaat"
pm2 startup
pm2 save
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `ADMIN_USER` | Admin username | admin |
| `ADMIN_PASS` | Admin password | admin123 |
| `NODE_ENV` | Environment | development |
| `SESSION_SECRET` | Session secret key | auto-generated |

## Production Considerations

### Security
- Change default admin credentials
- Use HTTPS in production
- Set secure cookies
- Implement rate limiting
- Add input validation

### Storage
- Replace JSON file storage with a proper database (MongoDB/PostgreSQL)
- Use cloud storage for uploaded images (AWS S3, Cloudinary)
- Implement backup strategy

### Performance
- Add caching (Redis)
- Implement CDN for static assets
- Use compression middleware
- Add monitoring and logging

## Development

### Running in Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The server will restart automatically on file changes
```

### Project Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact:
- Email: cleantrack@gmail.com
- Helpline: 1800-XXX-XXXX

---

**Built with ❤️ for a cleaner India**
