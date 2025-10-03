# Deployment Guide for Rainwater Harvesting Assessment System

This guide will help you deploy the complete application to Render.com so that running `python backend.py` loads the entire application.

## 🚀 Quick Deployment to Render

### Option 1: Automatic Deployment (Recommended)

1. **Push your code to GitHub** (if not already done)
2. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Sign up/Login with your GitHub account
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service:**
   - **Name:** `rainwater-harvesting-app`
   - **Environment:** `Python 3`
   - **Build Command:** 
     ```bash
     pip install -r requirements-prod.txt && python build_frontend.py
     ```
   - **Start Command:** `python backend.py`
   - **Plan:** Free (or upgrade as needed)

4. **Environment Variables:**
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: Generate a random secret key
   - `PORT`: Will be automatically set by Render

5. **Deploy:** Click "Create Web Service"

### Option 2: Using render.yaml (Alternative)

If you prefer configuration as code:

1. The `render.yaml` file is already configured
2. In Render dashboard, choose "Infrastructure as Code"
3. Connect your repository
4. Render will automatically detect and use the `render.yaml` configuration

## 🏗️ Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 16+ (for frontend development)
- Git

### Setup Steps

1. **Clone and navigate to the project:**
   ```bash
   git clone <your-repo-url>
   cd 2046Integrated
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements-prod.txt
   ```

3. **Build the frontend:**
   ```bash
   python build_frontend.py
   ```

4. **Run the complete application:**
   ```bash
   python backend.py
   ```

5. **Access the application:**
   - Open your browser to `http://localhost:5000`
   - The complete application (frontend + backend) will be available

## 📁 Project Structure After Build

```
2046Integrated/
├── backend.py                 # Main Flask application
├── build_frontend.py         # Frontend build script
├── requirements-prod.txt     # Production dependencies
├── render.yaml              # Render deployment config
├── Procfile                 # Process file for deployment
├── runtime.txt              # Python version specification
├── static/                  # Built frontend files (created by build)
│   ├── assets/
│   │   ├── index-BoJlrlTC.js
│   │   └── index-o--FnrZN.css
│   └── index.html
├── templates/               # Flask templates (created by build)
│   └── index.html
├── dataset/                 # Rainfall data
│   └── districts_rainfall.csv
└── frontend/project/        # React source code
    ├── src/
    ├── package.json
    └── dist/               # Built files (copied to static/)
```

## 🔧 Configuration Details

### Flask Application
- **Static Files:** Served from `/static/` directory
- **Templates:** Served from `/templates/` directory
- **API Endpoints:** All under `/api/` prefix
- **CORS:** Configured for localhost and Render domains

### Frontend Build Process
1. Installs npm dependencies
2. Builds React app with Vite
3. Copies built files to Flask static directory
4. Creates Flask template for serving

### Environment Variables
- `FLASK_ENV`: Set to `production` for deployment
- `SECRET_KEY`: Random secret for session management
- `PORT`: Automatically set by Render (defaults to 5000 locally)

## 🚀 Deployment Commands

### Build Commands (Run automatically on Render)
```bash
# Install Python dependencies
pip install -r requirements-prod.txt

# Build frontend and prepare static files
python build_frontend.py
```

### Start Command
```bash
python backend.py
```

## 🔍 Testing the Deployment

### Local Testing
1. Run `python backend.py`
2. Visit `http://localhost:5000`
3. Test all features:
   - Location selection
   - Roof area input
   - CAD file upload
   - Assessment generation
   - PDF download

### Production Testing
1. Deploy to Render
2. Visit your Render URL
3. Test all functionality
4. Check API endpoints: `https://your-app.onrender.com/api/meta`

## 📊 API Endpoints

- `GET /` - Main application (serves React frontend)
- `GET /api/meta` - Get districts and system information
- `GET /api/rainfall` - Get rainfall data
- `POST /api/predict` - Generate assessment
- `POST /api/calculate_system` - Calculate system costs
- `POST /api/detect_areas` - CAD area detection
- `POST /api/download_pdf` - Download assessment report

## 🛠️ Troubleshooting

### Common Issues

1. **Build fails on Render:**
   - Check Python version (3.11+ required)
   - Verify all dependencies in requirements-prod.txt
   - Check build logs for specific errors

2. **Frontend not loading:**
   - Ensure `build_frontend.py` ran successfully
   - Check that static files are in `/static/` directory
   - Verify Flask template exists in `/templates/`

3. **API endpoints not working:**
   - Check CORS configuration
   - Verify Flask routes are properly defined
   - Check server logs for errors

4. **PDF generation fails:**
   - Ensure reportlab is installed
   - Check file permissions
   - Verify session data is available

### Debug Mode
To run in debug mode locally:
```bash
export FLASK_ENV=development
python backend.py
```

## 📈 Scaling Considerations

### Free Tier Limitations
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- Cold start delay (~30 seconds)

### Upgrade Options
- **Starter Plan:** $7/month - Always on, custom domains
- **Standard Plan:** $25/month - Better performance, more resources

## 🔒 Security Notes

- Secret key is auto-generated on Render
- CORS is configured for production domains
- File uploads are handled securely
- Session data is properly managed

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Test locally first
3. Verify all dependencies are installed
4. Check environment variables are set correctly

---

**Ready to deploy!** 🚀

Your application will be available at `https://your-app-name.onrender.com` once deployed.
