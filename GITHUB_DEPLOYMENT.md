# 🚀 FlavorVerse - Free GitHub Deployment Guide

This guide will help you deploy FlavorVerse **100% FREE** using GitHub and various free hosting platforms.

## 📋 Prerequisites

- GitHub account (free)
- Git installed on your computer
- Your FlavorVerse project ready

---

## 🎯 Step-by-Step Deployment

### Step 1: Push to GitHub

#### 1.1 Initialize Git Repository
```powershell
# Navigate to your project directory
cd "c:\flavorverse 3.0"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - FlavorVerse application"
```

#### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `flavorverse`
3. Description: "Food delivery platform with admin, customer, and delivery partner portals"
4. Choose **Public** (required for free tier)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

#### 1.3 Push to GitHub
```powershell
# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/flavorverse.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🆓 Free Hosting Options

### ⭐ Option 1: Railway.app (RECOMMENDED - Easiest)

**Free Tier:** 500 hours/month, $5 credit

#### Setup Steps:
1. **Sign up**: Go to https://railway.app
2. **Login with GitHub**: Click "Login with GitHub"
3. **Deploy**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `flavorverse` repository
   - Railway auto-detects Spring Boot
4. **Add Database**:
   - Click "+ New" → "Database" → "Add MySQL"
   - Railway automatically creates and links database
5. **Configure Environment Variables**:
   ```
   SPRING_PROFILES_ACTIVE=prod
   SPRING_DATASOURCE_URL=<Auto-provided by Railway>
   SPRING_DATASOURCE_USERNAME=<Auto-provided by Railway>
   SPRING_DATASOURCE_PASSWORD=<Auto-provided by Railway>
   ```
6. **Deploy**: Railway automatically builds and deploys!
7. **Get URL**: Click "Settings" → "Domains" → "Generate Domain"

**Access your app**: `https://flavorverse-production.up.railway.app`

---

### 🔷 Option 2: Render.com

**Free Tier:** 750 hours/month

#### Setup Steps:
1. **Sign up**: Go to https://render.com
2. **Login with GitHub**: Click "Get Started" → "GitHub"
3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose `flavorverse` repo
4. **Configure**:
   - **Name**: flavorverse
   - **Environment**: Java
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/flavorverse-0.0.1-SNAPSHOT.jar`
   - **Instance Type**: Free
5. **Add Database**:
   - Click "New +" → "PostgreSQL" (free tier)
   - Or use external MySQL service
6. **Environment Variables**:
   ```
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=<Provided by Render>
   JAVA_TOOL_OPTIONS=-Xmx512m
   ```
7. **Create Web Service**: Render builds and deploys automatically!

**Access your app**: `https://flavorverse.onrender.com`

⚠️ **Note**: Free tier spins down after 15 minutes of inactivity (takes ~30s to wake up)

---

### 🟣 Option 3: Fly.io

**Free Tier:** 3 shared VMs, 3GB storage

#### Setup Steps:
1. **Install Fly CLI**:
   ```powershell
   # Install using PowerShell
   iwr https://fly.io/install.ps1 -useb | iex
   ```
2. **Login**:
   ```powershell
   fly auth login
   ```
3. **Initialize App**:
   ```powershell
   fly launch --name flavorverse
   ```
4. **Configure Database**:
   ```powershell
   fly postgres create --name flavorverse-db
   fly postgres attach flavorverse-db
   ```
5. **Deploy**:
   ```powershell
   fly deploy
   ```

**Access your app**: `https://flavorverse.fly.dev`

---

### 🟢 Option 4: Koyeb

**Free Tier:** 1 web service, 1 database

#### Setup Steps:
1. **Sign up**: Go to https://koyeb.com
2. **Login with GitHub**: Click "Deploy with GitHub"
3. **Create App**:
   - Select your `flavorverse` repository
   - **Builder**: Buildpack
   - **Build command**: `mvn clean package -DskipTests`
   - **Run command**: `java -jar target/flavorverse-0.0.1-SNAPSHOT.jar`
4. **Add Database**: Create free PostgreSQL instance
5. **Set Environment Variables**
6. **Deploy**: Automatic deployment

**Access your app**: `https://flavorverse-yourname.koyeb.app`

---

### 🔶 Option 5: Heroku (Limited Free)

**Note**: Heroku discontinued free tier but offers student credits

#### Setup Steps:
1. **Sign up**: https://heroku.com
2. **Install Heroku CLI**:
   ```powershell
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```
3. **Login**:
   ```powershell
   heroku login
   ```
4. **Create App**:
   ```powershell
   heroku create flavorverse
   ```
5. **Add Database**:
   ```powershell
   heroku addons:create jawsdb:kitefin
   ```
6. **Deploy**:
   ```powershell
   git push heroku main
   ```

---

## 🗄️ Free Database Options

### Option A: Railway MySQL (Recommended)
- **Free**: Included with Railway web service
- **Setup**: Automatic when you add MySQL in Railway
- **Storage**: 1GB

### Option B: PlanetScale (MySQL)
- **Free**: 5GB storage, 1 billion row reads/month
- **Website**: https://planetscale.com
- **Setup**:
  1. Create account
  2. Create database: `flavorverse`
  3. Get connection string
  4. Add to environment variables

### Option C: ElephantSQL (PostgreSQL)
- **Free**: 20MB storage
- **Website**: https://www.elephantsql.com
- **Setup**:
  1. Create account
  2. Create new instance
  3. Copy connection URL
  4. Update application.properties for PostgreSQL

### Option D: Aiven (MySQL/PostgreSQL)
- **Free**: $300 credit for 30 days
- **Website**: https://aiven.io

---

## ⚙️ Configuration for Production

### Update `src/main/resources/application-prod.properties`:

```properties
# Server Configuration
server.port=${PORT:8080}
spring.application.name=flavorverse

# Database Configuration (use environment variables)
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=false

# Connection Pool
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=20000

# Actuator
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized

# Logging
logging.level.root=INFO
logging.level.Prassath.example.flavorverse=INFO
```

---

## 🔐 Environment Variables to Set

For any platform you choose, set these environment variables:

```bash
# Application
SPRING_PROFILES_ACTIVE=prod

# Database (provided by hosting platform)
DATABASE_URL=jdbc:mysql://host:port/database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Java Options (for free tier memory limits)
JAVA_TOOL_OPTIONS=-Xmx512m -Xms256m

# Server Port (usually auto-set by platform)
PORT=8080
```

---

## 📊 Comparison of Free Tiers

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Railway** | ✅ Easiest setup<br>✅ Auto MySQL<br>✅ Fast deployment | ⚠️ 500 hrs/month limit | Beginners |
| **Render** | ✅ 750 hrs/month<br>✅ No credit card | ⚠️ Sleeps after 15min | Demo projects |
| **Fly.io** | ✅ Always on<br>✅ 3 VMs free | ⚠️ Complex setup | Experienced devs |
| **Koyeb** | ✅ Simple<br>✅ Good free tier | ⚠️ Newer platform | Experimenting |

---

## 🚀 Quick Start (Railway - Fastest)

```powershell
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/flavorverse.git
git push -u origin main

# 2. Go to Railway
# Visit: https://railway.app
# Login with GitHub
# Click "New Project" → "Deploy from GitHub repo"
# Select "flavorverse"
# Add MySQL database
# Click "Deploy"

# 3. Done! Your app is live in 2-3 minutes! 🎉
```

---

## 🔄 CI/CD - Automatic Deployments

All these platforms support automatic deployments:
- Push to GitHub main branch → Automatically builds and deploys
- No manual deployment needed after initial setup!

---

## 📱 Access Your Deployed App

After deployment, you'll get URLs like:
- **Customer Portal**: `https://your-app.railway.app/index.html`
- **Admin Dashboard**: `https://your-app.railway.app/admin_home.html`
- **Delivery Partner**: `https://your-app.railway.app/delivery_home.html`

---

## 🛠️ Troubleshooting

### Issue: Application fails to start
**Solution**: Check logs in platform dashboard, ensure environment variables are set

### Issue: Database connection errors
**Solution**: Verify DATABASE_URL, username, and password are correct

### Issue: Out of memory
**Solution**: Set `JAVA_TOOL_OPTIONS=-Xmx512m` in environment variables

### Issue: Port binding error
**Solution**: Ensure app uses `${PORT:8080}` to read platform-provided port

---

## 📞 Support

- **Railway**: https://railway.app/help
- **Render**: https://render.com/docs
- **Fly.io**: https://fly.io/docs
- **GitHub Issues**: Create issue in your repository

---

## 🎉 You're Ready!

Choose your preferred platform and deploy in **under 5 minutes**! 🚀

**Recommended for beginners**: Railway (easiest setup with auto-database)
