# Quick Fix: Use EmailJS Built-in Service (No Gmail API Needed)

The Gmail API requires special permissions. Instead, use EmailJS's own email service which is simpler and doesn't need Gmail OAuth.

## Step 1: Add EmailJS Email Service

1. Go to [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/)
2. Click **Email Services** in left sidebar
3. Click **Add New Service**
4. **Choose "EmailJS"** (NOT Gmail) - this is EmailJS's own email service
5. Click **Create Service**
6. You'll get a **Service ID** (like `service_xxxxx`)
7. **Copy this Service ID**

## Step 2: Create Email Template (if you haven't already)

1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template** (or edit existing one)
3. Use this template:

**Subject:**
```
EcoVest+ Password Reset OTP
```

**Content (HTML):**
```html
<h2>Password Reset Request</h2>
<p>Hello {{to_name}},</p>
<p>You requested a password reset for your EcoVest+ account.</p>
<p><strong>Your OTP code is: <span style="font-size: 24px; color: #27AE60;">{{otp_code}}</span></strong></p>
<p>This code will expire in 10 minutes.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>EcoVest+ Team</p>
```

**Important:** Make sure these variables are in your template:
- `{{to_name}}` - User's username
- `{{otp_code}}` - The 6-digit OTP code
- `{{to_email}}` - Recipient email (optional but recommended)

4. Save and copy the **Template ID**

## Step 3: Get Public Key

1. Go to **Account** → **General**
2. Copy your **Public Key**

## Step 4: Update config.js

Open `scripts/config.js` and update:

```javascript
EMAILJS: {
  SERVICE_ID: 'service_xxxxx',        // Your EmailJS service ID (NOT Gmail)
  TEMPLATE_ID: 'template_xxxxx',     // Your template ID
  PUBLIC_KEY: 'your_public_key'      // Your public key
}
```

## Step 5: Test

1. Refresh your website
2. Try "Forgot Password"
3. Check your email inbox - it should work now!

## Why This Works

- EmailJS's own service doesn't need Gmail API permissions
- It's simpler and more reliable
- Still sends emails to Gmail addresses, just uses EmailJS's servers
- No OAuth scope issues

