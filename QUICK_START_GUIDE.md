# 🚀 Quick Start Guide - Home Pages

## 📍 Access URLs

Once your Spring Boot application is running, access the home pages at:

### 🚚 Delivery Partner Dashboard
```
http://localhost:8080/delivery_home.html
```
**Login Required:** ROLE_DELIVERY_PARTNER

---

### 👑 Admin Dashboard
```
http://localhost:8080/admin_home.html
```
**Login Required:** ROLE_ADMIN

---

### 🍽️ Customer Home Page
```
http://localhost:8080/customer_home.html
```
**Login Required:** Optional (guest browsing available)

---

## 🔐 Test Credentials

Use these credentials to test each role:

### Admin Account
```
Username: admin@flavorverse.com
Password: admin123
Role: ROLE_ADMIN
```

### Delivery Partner Account
```
Username: delivery@flavorverse.com
Password: delivery123
Role: ROLE_DELIVERY_PARTNER
```

### Customer Account
```
Username: customer@flavorverse.com
Password: customer123
Role: ROLE_CUSTOMER
```

---

## 🎨 Design Features

### ✨ Visual Elements
- **Animations:** Smooth transitions and loading screens
- **Colors:** Primary green (#2ecc71) with gradient accents
- **Typography:** Poppins font family (300-800 weights)
- **Icons:** Font Awesome 6.4.0
- **Shadows:** Layered box-shadows for depth
- **Borders:** Rounded corners (10-25px radius)

### 📱 Responsive Breakpoints
- **Desktop:** 1200px and above
- **Tablet:** 768px - 1199px
- **Mobile:** Below 768px

---

## 🛠️ API Endpoints Required

### Delivery Partner APIs
```
GET  /api/delivery/orders        # Get assigned orders
POST /api/delivery/accept/{id}   # Accept an order
POST /api/delivery/complete/{id} # Complete delivery
GET  /api/delivery/earnings      # Get earnings stats
POST /api/delivery/status        # Toggle online/offline
```

### Admin APIs
```
GET  /api/admin/dashboard        # Get dashboard metrics
GET  /api/admin/orders           # Get all orders
GET  /api/admin/restaurants      # Get all restaurants
GET  /api/admin/users            # Get all users
GET  /api/admin/analytics        # Get analytics data
```

### Customer APIs
```
GET  /api/restaurants            # Get all restaurants
GET  /api/restaurants/{id}/menu  # Get restaurant menu
POST /api/cart                   # Manage cart
POST /api/orders                 # Place order
GET  /api/orders/user/{id}       # Get user orders
```

---

## 📂 File Organization

```
src/main/resources/static/
│
├── 📄 HTML Files
│   ├── delivery_home.html    (12.1 KB)
│   ├── admin_home.html       (21.7 KB)
│   └── customer_home.html    (16.8 KB)
│
├── 📜 JavaScript Files
│   ├── delivery_home.js      (17.0 KB)
│   ├── admin_home.js         (13.4 KB)
│   └── customer_home.js      (20.9 KB)
│
└── 🎨 CSS Files
    ├── home_pages.css        (38.9 KB) ← New!
    └── style_theme.css       (Original theme)
```

---

## ✅ Features Checklist

### Delivery Partner Home
- [x] Real-time order notifications
- [x] Accept/Reject orders
- [x] Mark orders as delivered
- [x] Online/Offline status toggle
- [x] Earnings dashboard
- [x] Order history
- [x] Profile management

### Admin Dashboard
- [x] Revenue metrics
- [x] Order management
- [x] User management
- [x] Restaurant management
- [x] Menu item management
- [x] Reviews monitoring
- [x] Analytics dashboard
- [x] Quick actions

### Customer Home
- [x] Browse restaurants
- [x] Filter by cuisine
- [x] Sort by rating/price
- [x] Search functionality
- [x] Shopping cart
- [x] Location selector
- [x] User authentication
- [x] Featured restaurants

---

## 🔧 Configuration

### 1. Enable CORS (if needed)
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
```

### 2. Security Configuration
Ensure these URLs are accessible:
```java
.antMatchers("/delivery_home.html", "/admin_home.html", "/customer_home.html").permitAll()
.antMatchers("/home_pages.css", "/*.js").permitAll()
```

### 3. Session Management
Configure session timeout in `application.properties`:
```properties
server.servlet.session.timeout=30m
```

---

## 🧪 Testing Steps

### 1. Start Backend
```bash
mvn spring-boot:run
```

### 2. Test Each Page
1. Open browser to `http://localhost:8080/delivery_home.html`
2. Check loading screen appears
3. Test authentication redirect
4. Verify responsive design (resize browser)
5. Test all interactive elements

### 3. Browser Console
Open DevTools (F12) and check for:
- ✅ No JavaScript errors
- ✅ API calls returning data
- ✅ No CSS conflicts
- ✅ Proper authentication

---

## 🐛 Troubleshooting

### Issue: Page styles not loading
**Solution:** Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: JavaScript errors
**Solution:** Check browser console, ensure all API endpoints exist

### Issue: Authentication not working
**Solution:** Verify sessionStorage has user data, check backend security config

### Issue: Responsive layout broken
**Solution:** Check viewport meta tag in HTML head

### Issue: Icons not showing
**Solution:** Verify Font Awesome CDN link is loading (check Network tab)

---

## 📊 Performance Tips

1. **Image Optimization:** Compress restaurant images to <200KB
2. **Lazy Loading:** Consider lazy loading for restaurant cards
3. **CDN Usage:** Font Awesome and Google Fonts are CDN-hosted
4. **Caching:** Enable browser caching for static assets
5. **Minification:** Consider minifying CSS/JS for production

---

## 🎯 Browser Compatibility

### ✅ Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### ⚠️ Partial Support
- IE11 (CSS Grid may need polyfills)

---

## 📝 Quick Commands

### Build Project
```bash
mvn clean package
```

### Run Application
```bash
java -jar target/flavorverse-0.0.1-SNAPSHOT.jar
```

### Access Application
```
http://localhost:8080
```

---

## 🎨 Customization

### Change Primary Color
In `home_pages.css`, find and replace:
```css
--primary-green: #2ecc71;  /* Change this */
```

### Change Font
In HTML files, update Google Fonts link:
```html
<link href="https://fonts.googleapis.com/css2?family=YourFont&display=swap" rel="stylesheet">
```

### Modify Animations
In `home_pages.css`, edit `@keyframes` rules:
```css
@keyframes yourAnimation {
    from { /* start state */ }
    to { /* end state */ }
}
```

---

## 🆘 Support

For issues or questions:
1. Check `HOME_PAGES_SUMMARY.md` for detailed documentation
2. Review browser console for errors
3. Verify backend API endpoints are working
4. Test with different user roles

---

**Happy Coding! 🚀**

*Last Updated: January 8, 2025*
