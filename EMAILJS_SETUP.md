# EmailJS Setup Instructions - Send OTP to Gmail

Follow these steps to enable real email sending for OTP password resets.

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **Sign Up** (free account allows 200 emails/month)
3. Create your account with email and password
4. Verify your email if required

## Step 2: Connect Gmail Service

1. After logging in, go to **Email Services** in the left sidebar
2. Click **Add New Service** button
3. Select **Gmail** from the list
4. Click **Connect Account**
5. You'll be asked to sign in to your Google account
6. Grant permissions to EmailJS
7. Once connected, you'll see a **Service ID** (looks like: `service_xxxxxxx`)
8. **Copy this Service ID** - you'll need it later

## Step 3: Create Email Template

1. Go to **Email Templates** in the left sidebar
2. Click **Create New Template** button
3. Fill in the template:

   **Template Name:** `EcoVest Password Reset`
   
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
   
   **Content (Plain Text):**
   ```
   Password Reset Request
   
   Hello {{to_name}},
   
   You requested a password reset for your EcoVest+ account.
   
   Your OTP code is: {{otp_code}}
   
   This code will expire in 10 minutes.
   
   If you didn't request this, please ignore this email.
   
   Best regards,
   EcoVest+ Team
   ```

4. **Important:** Make sure these variables are in your template:
   - `{{to_name}}` - User's username
   - `{{otp_code}}` - The 6-digit OTP code
   - `{{to_email}}` - Recipient email (optional)

5. Click **Save** button
6. You'll see a **Template ID** (looks like: `template_xxxxxxx`)
7. **Copy this Template ID** - you'll need it later

## Step 4: Get Public Key

1. Click on **Account** in the left sidebar
2. Go to **General** tab
3. Find **Public Key** section
4. You'll see your Public Key (looks like: `xxxxxxxxxxxxxxxxxxxx`)
5. **Copy this Public Key** - you'll need it later

## Step 5: Update Your Code

1. Open `scripts/config.js` in your project
2. Find the `EMAILJS` section (around line 34-38)
3. Replace the placeholder values with your actual values:

```javascript
EMAILJS: {
  SERVICE_ID: 'service_abc123',        // Your Service ID from Step 2
  TEMPLATE_ID: 'template_xyz789',      // Your Template ID from Step 3
  PUBLIC_KEY: 'abcdefghijklmnopqrst'   // Your Public Key from Step 4
}
```

**Example:**
```javascript
EMAILJS: {
  SERVICE_ID: 'service_gmail123',
  TEMPLATE_ID: 'template_otp456',
  PUBLIC_KEY: 'user_abc123def456ghi789'
}
```

4. **Save the file**

## Step 6: Test It!

1. Open your website in a browser
2. Click **Log In** button
3. Click **Forgot password?** link
4. Enter your email address (the one you connected to EmailJS)
5. Click **Send OTP to Email**
6. **Check your Gmail inbox** - you should receive an email with the OTP!
7. Enter the OTP code to reset your password

## Troubleshooting

**If emails don't arrive:**
- Check your Gmail spam folder
- Verify your EmailJS service is connected (go to Email Services → check status)
- Check browser console (F12) for any error messages
- Make sure all three IDs in config.js are correct
- Verify the email template variables match: `{{to_name}}`, `{{otp_code}}`

**If you see "EmailJS not configured" message:**
- Make sure you've updated all three values in `config.js`
- Check that the EmailJS script is loaded (should be in index.html)
- Refresh the page after updating config.js

## Quick Checklist

- [ ] EmailJS account created
- [ ] Gmail service connected and Service ID copied
- [ ] Email template created with correct variables and Template ID copied
- [ ] Public Key copied from Account settings
- [ ] All three values updated in `scripts/config.js`
- [ ] Tested and received OTP email in Gmail

## Alternative: Backend Solution

If you prefer a backend solution, you can:

1. Create a backend API endpoint (Node.js, Python, etc.)
2. Use services like:
   - SendGrid
   - Mailgun
   - AWS SES
   - Nodemailer (Node.js)
3. Update `auth.requestPasswordReset()` to call your API instead

Example backend endpoint:
```javascript
POST /api/send-otp
Body: { email: "user@example.com", otp: "123456" }
```

Then update the frontend to call this endpoint instead of EmailJS.

