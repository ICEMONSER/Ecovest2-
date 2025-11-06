# Fix: "Gmail_API: Request had insufficient authentication scopes"

## What This Error Means

The error "Gmail_API: Request had insufficient authentication scopes" means your Gmail service in EmailJS doesn't have the right permissions to send emails.

## Solution: Reconnect Gmail with Proper Permissions

### Step 1: Go to EmailJS Dashboard

1. Go to [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/)
2. Log in to your account

### Step 2: Reconnect Gmail Service

1. Click on **Email Services** in the left sidebar
2. Find your **Gmail** service
3. Click the **Edit** icon (pencil) next to your Gmail service
4. Click **Disconnect** or **Remove** the current connection
5. Click **Add New Service** again
6. Select **Gmail**
7. Click **Connect Account**
8. **IMPORTANT:** When Google asks for permissions, make sure to:
   - Grant **"Send email on your behalf"** permission
   - Grant **"View and manage your email"** permission (if asked)
   - Click **Allow** or **Continue** to grant all permissions
9. Complete the connection process
10. Copy the new **Service ID** (it might be the same or different)

### Step 3: Verify Service Status

1. After reconnecting, check that your Gmail service shows as **"Connected"** or **"Active"**
2. The status should be green/active, not red/error

### Step 4: Update Your Config (if Service ID changed)

If you got a new Service ID:
1. Open `scripts/config.js`
2. Update the `SERVICE_ID` with the new value
3. Save the file
4. Refresh your website

### Step 5: Test Again

1. Refresh your website
2. Try "Forgot Password" again
3. Check if the email is sent successfully

## Alternative: Use a Different Email Service

If Gmail continues to have issues, you can use EmailJS's built-in email service:

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **EmailJS** (not Gmail)
4. This uses EmailJS's own email servers (no Gmail API needed)
5. Copy the new Service ID
6. Update `scripts/config.js` with the new Service ID

## Still Not Working?

1. **Check EmailJS Dashboard → Email History**
   - See if emails are being sent but failing
   - Check error messages there

2. **Verify Template Variables**
   - Make sure your email template uses: `{{to_name}}` and `{{otp_code}}`
   - These must match exactly (case-sensitive)

3. **Check Browser Console**
   - Press F12 → Console tab
   - Look for detailed error messages
   - Share any errors you see

4. **Try Test Email in EmailJS Dashboard**
   - Go to Email Templates
   - Click "Test" on your template
   - See if it sends successfully from there

