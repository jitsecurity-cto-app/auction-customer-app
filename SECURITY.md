# Security Vulnerabilities - Customer App

This app intentionally contains security vulnerabilities for educational purposes.

## Vulnerabilities

1. **XSS (Cross-Site Scripting)** - User input rendered without sanitization
   - Shipping addresses in OrderForm not sanitized
   - Order details rendered without sanitization
2. **Weak Authentication** - Tokens stored in localStorage
3. **Missing CSRF Protection** - No CSRF tokens
4. **Insecure Storage** - Sensitive data in localStorage
5. **No Input Validation** - Client-side only validation
   - Shipping addresses accepted without validation
   - Tracking numbers not validated
6. **IDOR (Insecure Direct Object Reference)** - Order access without authorization
   - Can access any order by ID
   - Can view orders for any user via query parameters
7. **Missing Authorization** - No ownership checks
   - Anyone can update shipping status on any order

See main `SECURITY.md` for details.

**⚠️ Never deploy to production without fixing these vulnerabilities.**

