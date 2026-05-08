# Password Reset System - Complete API Documentation

## Overview

A production-ready, secure forgot password and password reset system for KTM Bites. The system prevents user enumeration, uses cryptographically secure tokens with 15-minute expiry, sends emails via Gmail SMTP, and applies rate limiting to prevent abuse.

---

## System Architecture

### Key Features

- **Secure Token Generation**: Uses `secrets.token_urlsafe(32)` for cryptographically secure, unguessable tokens
- **15-Minute Expiry**: Tokens are automatically invalidated after 15 minutes
- **User Enumeration Prevention**: Forgot password endpoint returns identical success response regardless of whether user exists
- **Single-Use Tokens**: Tokens are deleted immediately after successful password reset
- **Email Notifications**: HTML and plain-text emails sent via Gmail SMTP
- **Rate Limiting**: 5 requests per minute per IP/user on forgot-password endpoint
- **Token Invalidation**: All existing auth tokens are invalidated when password is reset (forces re-login)

### Database Model

```python
class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # created_at + 15 minutes
```

---

## API Endpoints

### 1. Forgot Password

**Endpoint**: `POST /api/auth/forgot-password/`

**Purpose**: Initiates password reset by sending a reset link to the user's registered email.

**Authentication**: Not required (AllowAny)

**Rate Limiting**: 5 requests per minute (per IP for anonymous users, per user for authenticated)

#### Request

```json
{
  "email": "user@example.com"
}
```

#### Response (200 - Success)

**Returns identical response regardless of whether user exists (prevents enumeration)**

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### Response (400 - Validation Error)

Invalid email format:

```json
{
  "email": ["Enter a valid email address."]
}
```

#### Response (429 - Rate Limited)

Exceeded 5 requests per minute:

```json
{
  "detail": "Request was throttled. Expected available in 60 seconds."
}
```

#### Background Processing

When a valid user email is found:

1. Generates secure token: `token = secrets.token_urlsafe(32)`
2. Creates PasswordResetToken record with 15-minute expiry
3. Sends HTML email with reset link: `http://localhost:3000/reset-password?token={token}`
4. Email includes expiry notice, support contact, and user-friendly formatting

#### Example Using cURL

```bash
curl -X POST http://localhost:8000/api/auth/forgot-password/ \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

#### Example Using Python Requests

```python
import requests

response = requests.post(
    'http://localhost:8000/api/auth/forgot-password/',
    json={'email': 'john@example.com'}
)
print(response.json())  # {"message": "If an account with that email exists..."}
```

#### Example Using JavaScript Fetch

```javascript
fetch("http://localhost:8000/api/auth/forgot-password/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "john@example.com" }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

### 2. Reset Password

**Endpoint**: `POST /api/auth/reset-password/`

**Purpose**: Validates reset token and updates user password.

**Authentication**: Not required (AllowAny)

**Rate Limiting**: Default throttle (100 requests per hour for anonymous)

#### Request

```json
{
  "token": "PeK1_HJxJz9VmK_7lN0-uVaKbQp5Q_rZ_T8uW9xYz1234567",
  "new_password": "SecureNewPass123!"
}
```

#### Response (200 - Success)

```json
{
  "message": "Password reset successfully. You can now log in."
}
```

#### Response (400 - Invalid/Expired Token)

Token not found or expired:

```json
{
  "detail": "Invalid or expired link."
}
```

#### Response (400 - Validation Error)

Password validation failed (must be 8+ chars, contain letters and digits):

```json
{
  "new_password": [
    "Password must contain at least one letter.",
    "Password must contain at least one digit."
  ]
}
```

#### Response (400 - Missing Fields)

```json
{
  "token": ["This field is required."],
  "new_password": ["This field is required."]
}
```

#### Background Processing

When valid token and password are provided:

1. Queries PasswordResetToken by token value
2. Checks if `expires_at > current_time`
3. If valid:
   - Calls `user.set_password(new_password)` (uses Django's secure hashing)
   - Saves updated user
   - Deletes all auth tokens for user (forces re-login)
   - Deletes the PasswordResetToken (single-use, prevents replay)
4. If invalid/expired:
   - Returns generic 400 error (no details leaked)

#### Example Using cURL

```bash
curl -X POST http://localhost:8000/api/auth/reset-password/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "PeK1_HJxJz9VmK_7lN0-uVaKbQp5Q_rZ_T8uW9xYz1234567",
    "new_password": "SecureNewPass123!"
  }'
```

#### Example Using Python Requests

```python
import requests

response = requests.post(
    'http://localhost:8000/api/auth/reset-password/',
    json={
        'token': 'PeK1_HJxJz9VmK_7lN0-uVaKbQp5Q_rZ_T8uW9xYz1234567',
        'new_password': 'SecureNewPass123!'
    }
)
print(response.json())  # {"message": "Password reset successfully..."}
```

#### Example Using JavaScript Fetch

```javascript
const token = new URLSearchParams(window.location.search).get("token");

fetch("http://localhost:8000/api/auth/reset-password/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: token,
    new_password: "SecureNewPass123!",
  }),
})
  .then((res) => res.json())
  .then((data) => {
    if (data.message) {
      console.log("Password reset successful!");
      // Redirect to login
    } else {
      console.error("Reset failed:", data);
    }
  });
```

---

## Email Format

### Plain Text Email

```
Hello John,

We received a request to reset your password for your KTM Bites account.

To reset your password, click the link below:
http://localhost:3000/reset-password?token=PeK1_HJxJz9VmK_7lN0-uVaKbQp5Q_rZ_T8uW9xYz1234567

This link will expire in 15 minutes.

If you did not request a password reset, please ignore this email or contact our support team.

Best regards,
KTM Bites Team
support@ktmbites.com
```

### HTML Email

Professional HTML email with:

- Clear heading and greeting
- Prominent reset button
- Expiry warning (yellow box with icon)
- Support contact information
- Responsive design for mobile

---

## Configuration

### Settings File (ktmbites/settings.py)

```python
# Gmail SMTP Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'np03cs4a240042@gmail.com'
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = 'np03cs4a240042@gmail.com'

# DRF Throttling
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'forgot_password': '5/minute',
    }
}
```

### Environment Variables (.env)

Required:

```env
EMAIL_HOST_PASSWORD=your_gmail_app_password_here
```

**Important**: Use Gmail App Password, NOT your regular Gmail password.

**To generate Gmail App Password**:

1. Enable 2-Factor Authentication on Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Google will generate a 16-character password
5. Add this to `.env` as `EMAIL_HOST_PASSWORD`

---

## Complete User Flow

### Forgot Password Flow

```
User clicks "Forgot Password" button
    ↓
Frontend: User enters email → POST /api/auth/forgot-password/
    ↓
Backend: Look up user by email (silently if not found)
    ↓
If user found:
  - Generate token using secrets.token_urlsafe(32)
  - Save token to PasswordResetToken with expires_at = now + 15 min
  - Send email with reset link
    ↓
Return generic success message to frontend (identical for all cases)
    ↓
Frontend: Show "Check your email" message
    ↓
User receives email with reset link
    ↓
User clicks link in email
    ↓
Frontend: Extract token from URL, redirect to /reset-password?token=XXX
```

### Password Reset Flow

```
User on /reset-password?token=XXX page
    ↓
User enters new password → POST /api/auth/reset-password/
    ↓
Backend: Validate token exists and hasn't expired
    ↓
If valid:
  - Hash new password with Django's secure algorithm
  - Save user with new password
  - Delete all auth tokens for user (force re-login)
  - Delete the PasswordResetToken (single-use)
    ↓
Return success message
    ↓
Frontend: Show "Password reset successful" and redirect to login
    ↓
User logs in with new password
```

---

## Security Considerations

### ✅ Implemented Best Practices

1. **Cryptographically Secure Tokens**
   - Uses `secrets.token_urlsafe(32)` (256-bit entropy)
   - Tokens are URL-safe and unguessable
   - Unique constraint prevents duplicates

2. **User Enumeration Prevention**
   - Forgot password endpoint returns identical 200 response
   - No error message reveals whether email exists
   - Attacker cannot enumerate valid user emails

3. **Token Expiry**
   - Tokens expire after exactly 15 minutes
   - Expired tokens cannot be used for reset
   - Tokens are checked before processing

4. **Single-Use Tokens**
   - Tokens deleted immediately after successful reset
   - Prevents replay attacks
   - Each reset request generates new token

5. **Session Invalidation**
   - All auth tokens deleted when password changes
   - Forces user to re-login with new password
   - Existing sessions become invalid

6. **Password Hashing**
   - Django's `user.set_password()` uses PBKDF2
   - Passwords salted and hashed automatically
   - Never stored in plain text

7. **Rate Limiting**
   - 5 requests per minute on forgot-password endpoint
   - Prevents token enumeration/brute-force
   - Per-IP for anonymous, per-user for authenticated

8. **Environment Variable Security**
   - Gmail App Password stored in `.env` (not in code)
   - `.env` should be in `.gitignore`
   - Never commit sensitive credentials

### ⚠️ Additional Recommendations for Production

- Use HTTPS only (enforce in frontend)
- Consider adding CSRF tokens for state-changing operations
- Monitor failed reset attempts for suspicious patterns
- Add logging/auditing for password changes
- Consider temporary email verification on account takeover
- Use reCAPTCHA on forgot-password form
- Consider temporary account lockout after multiple failed attempts
- Set up email delivery monitoring

---

## Testing the System

### Test Case 1: Valid Forgot Password Request

```bash
# Request
curl -X POST http://localhost:8000/api/auth/forgot-password/ \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# Expected Response (200)
{"message": "If an account with that email exists, a password reset link has been sent."}

# Verify in database
python manage.py shell
>>> from api.models import PasswordResetToken
>>> PasswordResetToken.objects.latest('created_at').token  # See token
>>> PasswordResetToken.objects.latest('created_at').expires_at  # Should be ~15 min from now
```

### Test Case 2: Non-Existent Email (Enumeration Prevention)

```bash
# Request with non-existent email
curl -X POST http://localhost:8000/api/auth/forgot-password/ \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'

# Response is IDENTICAL to Case 1 (200 with generic message)
# No token created in database for non-existent user
```

### Test Case 3: Valid Password Reset

```bash
# Step 1: Get token from database or email
token="PeK1_HJxJz9VmK_7lN0-uVaKbQp5Q_rZ_T8uW9xYz1234567"

# Step 2: Reset password with valid token
curl -X POST http://localhost:8000/api/auth/reset-password/ \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$token\", \"new_password\": \"NewSecurePass123\"}"

# Expected Response (200)
{"message": "Password reset successfully. You can now log in."}

# Step 3: Verify token is deleted
python manage.py shell
>>> from api.models import PasswordResetToken
>>> PasswordResetToken.objects.filter(token=token).exists()  # Should be False
```

### Test Case 4: Expired Token

```bash
# Wait 16 minutes (or manually edit expires_at in database to past time)

# Attempt to reset with expired token
curl -X POST http://localhost:8000/api/auth/reset-password/ \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$old_token\", \"new_password\": \"AnyPassword123\"}"

# Expected Response (400)
{"detail": "Invalid or expired link."}
```

### Test Case 5: Rate Limiting

```bash
# Make 6 requests in quick succession
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/forgot-password/ \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}'
done

# First 5: Success (200)
# 6th: Rate limited (429)
# Response: {"detail": "Request was throttled. Expected available in 60 seconds."}
```

### Test Case 6: Invalid Password Validation

```bash
# Password too short (< 8 chars)
curl -X POST http://localhost:8000/api/auth/reset-password/ \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"valid_token\", \"new_password\": \"Short1\"}"

# Response (400)
{"new_password": ["Ensure this field has at least 8 characters."]}

# Password without letters
curl -X POST http://localhost:8000/api/auth/reset-password/ \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"valid_token\", \"new_password\": \"12345678\"}"

# Response (400)
{"new_password": ["Password must contain at least one letter."]}
```

---

## Frontend Integration

### React Example

```jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token");

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/reset-password/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: password }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Success - show message and redirect
        alert(
          "Password reset successful! Please log in with your new password.",
        );
        navigate("/login");
      } else {
        setError(data.detail || "Reset failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={handleReset}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          required
          minLength="8"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: "Throttled" Error on Forgot Password

**Cause**: Exceeded 5 requests per minute

**Solution**: Wait 60 seconds before trying again

### Issue: Email Not Sending

**Causes & Solutions**:

1. Gmail App Password not set in `.env`
   - Generate App Password at https://myaccount.google.com/apppasswords
   - Add to `.env`: `EMAIL_HOST_PASSWORD=your_app_password`

2. 2-Factor Authentication not enabled
   - Enable 2FA on Google Account first

3. Django DEBUG mode interferes
   - Ensure `.env` variables are loaded: `source .env` (Unix) or `python -m dotenv run python manage.py` (Windows)

4. Firewall blocking SMTP port 587
   - Check if port 587 is open
   - Contact network administrator

### Issue: Token Always Expires Immediately

**Cause**: Server time not synchronized with database server

**Solution**: Check server time: `python -c "from django.utils import timezone; print(timezone.now())"`

### Issue: Password Reset Returns "Invalid or expired link" But Token Just Sent

**Cause**: Token was already used/deleted

**Solution**: Request new forgot-password email, don't reuse same token

---

## API Status Codes Summary

| Status | Meaning           | Scenario                                              |
| ------ | ----------------- | ----------------------------------------------------- |
| 200    | Success           | Forgot password or reset successful                   |
| 400    | Bad Request       | Invalid email/token, validation failed, expired token |
| 429    | Too Many Requests | Rate limit exceeded (5/min on forgot-password)        |
| 500    | Server Error      | Email sending failed, database error                  |

---

## Files Modified

- `backend/api/models.py` - Added PasswordResetToken model
- `backend/api/serializers.py` - Added ForgotPasswordSerializer, ResetPasswordSerializer
- `backend/api/views.py` - Added ForgotPasswordView, ResetPasswordView, ForgotPasswordThrottle, send_password_reset_email()
- `backend/api/urls.py` - Added URL patterns for new endpoints
- `backend/ktmbites/settings.py` - Added Gmail SMTP config and throttling config
- `backend/api/migrations/0005_passwordresettoken.py` - Database migration

---

## Summary

This production-ready password reset system provides:

✅ Secure token generation and expiry  
✅ User enumeration prevention  
✅ Rate limiting against abuse  
✅ HTML + plain-text email support  
✅ Single-use tokens with immediate deletion  
✅ Session invalidation on password change  
✅ Django's built-in password hashing  
✅ Environment variable security  
✅ Comprehensive error handling  
✅ DRF throttling integration

The system is ready for production use with minimal configuration (just Gmail App Password in `.env`).
