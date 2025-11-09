# 🚀 FlavorVerse Deployment Guide

## 📦 Build Successful!

Your application has been packaged successfully as:
- **File:** `target/flavorverse-0.0.1-SNAPSHOT.jar`
- **Size:** ~50-60 MB (includes all dependencies)
- **Type:** Executable Spring Boot JAR

---

## 🎯 Deployment Options

### Option 1: Local Deployment (Windows)

#### Quick Start:
```powershell
# Navigate to project directory
cd "c:\flavorverse 3.0"

# Run the application
java -jar target/flavorverse-0.0.1-SNAPSHOT.jar
```

#### With Custom Configuration:
```powershell
java -jar target/flavorverse-0.0.1-SNAPSHOT.jar `
  --server.port=8080 `
  --spring.datasource.url=jdbc:mysql://localhost:3306/flavorverse `
  --spring.datasource.username=root `
  --spring.datasource.password=yourpassword
```

---

### Option 2: Deploy to Cloud (AWS, Azure, Google Cloud)

#### AWS Elastic Beanstalk:
```bash
# Install AWS CLI and EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk
eb init -p java-17 flavorverse-app

# Create environment and deploy
eb create flavorverse-prod
eb deploy
```

#### Azure App Service:
```bash
# Install Azure CLI
az login

# Create resource group
az group create --name flavorverse-rg --location eastus

# Create App Service plan
az appservice plan create --name flavorverse-plan --resource-group flavorverse-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group flavorverse-rg --plan flavorverse-plan --name flavorverse-app --runtime "JAVA:17-java17"

# Deploy JAR
az webapp deploy --resource-group flavorverse-rg --name flavorverse-app --src-path target/flavorverse-0.0.1-SNAPSHOT.jar --type jar
```

#### Google Cloud Platform:
```bash
# Install Google Cloud SDK
gcloud init

# Deploy to App Engine
gcloud app deploy

# Or deploy to Cloud Run
gcloud run deploy flavorverse --source . --platform managed --region us-central1 --allow-unauthenticated
```

---

### Option 3: Docker Deployment

#### Build Docker Image:
```bash
docker build -t flavorverse:latest .
```

#### Run Docker Container:
```bash
docker run -d \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/flavorverse \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=yourpassword \
  --name flavorverse-app \
  flavorverse:latest
```

#### Docker Compose (with MySQL):
```bash
docker-compose up -d
```

---

### Option 4: Deploy to Heroku

```bash
# Install Heroku CLI
heroku login

# Create Heroku app
heroku create flavorverse-app

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Deploy
git push heroku main

# Open app
heroku open
```

---

### Option 5: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Spring Boot and deploy
5. Add MySQL database from Railway dashboard

---

## 🔧 Production Configuration

### Create `application-prod.properties`:
```properties
# Server Configuration
server.port=8080
server.compression.enabled=true

# Database Configuration (Update with your production DB)
spring.datasource.url=jdbc:mysql://your-db-host:3306/flavorverse
spring.datasource.username=your-db-user
spring.datasource.password=your-db-password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Logging
logging.level.root=INFO
logging.level.Prassath.example.flavorverse=INFO
logging.file.name=logs/flavorverse.log

# Security
spring.security.user.name=admin
spring.security.user.password=ChangeMeInProduction!

# Connection Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

### Run with Production Profile:
```bash
java -jar target/flavorverse-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

---

## 🗄️ Database Setup for Production

### 1. Create Production Database:
```sql
CREATE DATABASE IF NOT EXISTS flavorverse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flavorverse;
```

### 2. Update Connection String:
- **AWS RDS:** `jdbc:mysql://your-rds-endpoint.rds.amazonaws.com:3306/flavorverse`
- **Azure MySQL:** `jdbc:mysql://your-mysql-server.mysql.database.azure.com:3306/flavorverse`
- **Google Cloud SQL:** `jdbc:mysql://your-cloud-sql-ip:3306/flavorverse`

### 3. Enable SSL (Recommended):
```properties
spring.datasource.url=jdbc:mysql://your-db-host:3306/flavorverse?useSSL=true&requireSSL=true
```

---

## 🌐 Domain & SSL Setup

### Using Nginx as Reverse Proxy:

```nginx
server {
    listen 80;
    server_name flavorverse.com www.flavorverse.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Certificate (Let's Encrypt):
```bash
sudo certbot --nginx -d flavorverse.com -d www.flavorverse.com
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint:
```
GET http://your-domain.com/actuator/health
```

### Add Actuator Dependencies (if not present):
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### Enable Endpoints in `application.properties`:
```properties
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
```

---

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable database SSL
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Use environment variables for secrets

---

## 🚦 Testing Deployment

### 1. Test Locally:
```bash
java -jar target/flavorverse-0.0.1-SNAPSHOT.jar
```

### 2. Check Health:
```bash
curl http://localhost:8080/actuator/health
```

### 3. Test APIs:
```bash
# Get Restaurants
curl http://localhost:8080/api/restaurants

# Get Orders
curl http://localhost:8080/api/orders
```

### 4. Test Frontend:
- Customer: http://localhost:8080/customer_home.html
- Admin: http://localhost:8080/admin_home.html
- Delivery: http://localhost:8080/delivery_home.html

---

## 📝 Environment Variables

Create `.env` file (never commit to Git):
```env
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/flavorverse
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=yourpassword
SERVER_PORT=8080
```

Load in PowerShell:
```powershell
Get-Content .env | ForEach-Object {
    $name, $value = $_.split('=')
    Set-Content env:\$name $value
}
java -jar target/flavorverse-0.0.1-SNAPSHOT.jar
```

---

## 🐛 Troubleshooting

### Application Won't Start:
```bash
# Check Java version
java -version  # Should be 17+

# Check port availability
netstat -ano | findstr :8080

# Check logs
type logs\flavorverse.log
```

### Database Connection Issues:
```bash
# Test MySQL connection
mysql -h your-host -u your-user -p

# Check firewall
telnet your-db-host 3306
```

### Memory Issues:
```bash
# Increase heap size
java -Xmx512m -Xms256m -jar target/flavorverse-0.0.1-SNAPSHOT.jar
```

---

## 📱 Post-Deployment

1. **Update DNS** - Point domain to server IP
2. **Configure SSL** - Use Let's Encrypt or cloud provider
3. **Set up Monitoring** - Use CloudWatch, Azure Monitor, or Prometheus
4. **Configure Backups** - Daily database backups
5. **Test All Features** - Complete end-to-end testing
6. **Load Testing** - Use JMeter or Gatling
7. **Document API** - Use Swagger/OpenAPI

---

## 🎉 Quick Deploy Commands

### Windows (Local):
```powershell
java -jar target/flavorverse-0.0.1-SNAPSHOT.jar
```

### Windows (Background Service):
```powershell
Start-Process java -ArgumentList "-jar","target/flavorverse-0.0.1-SNAPSHOT.jar" -WindowStyle Hidden
```

### Linux (Background):
```bash
nohup java -jar target/flavorverse-0.0.1-SNAPSHOT.jar > app.log 2>&1 &
```

### Linux (Systemd Service):
Create `/etc/systemd/system/flavorverse.service`:
```ini
[Unit]
Description=FlavorVerse Application
After=network.target

[Service]
Type=simple
User=flavorverse
WorkingDirectory=/opt/flavorverse
ExecStart=/usr/bin/java -jar /opt/flavorverse/flavorverse-0.0.1-SNAPSHOT.jar
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable flavorverse
sudo systemctl start flavorverse
sudo systemctl status flavorverse
```

---

## 📞 Support

Your application is ready for deployment! Choose the option that best fits your needs.

**Recommended for beginners:** Start with Option 1 (Local) or Option 5 (Railway)
**Recommended for production:** Option 2 (AWS/Azure/GCP) with proper database and monitoring setup

Good luck with your deployment! 🚀
