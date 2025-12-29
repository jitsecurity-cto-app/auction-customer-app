# Security Vulnerabilities - Customer App

This app intentionally contains security vulnerabilities for educational purposes.

## Vulnerabilities

1. **XSS (Cross-Site Scripting)** - User input rendered without sanitization
2. **Weak Authentication** - Tokens stored in localStorage
3. **Missing CSRF Protection** - No CSRF tokens
4. **Insecure Storage** - Sensitive data in localStorage
5. **No Input Validation** - Client-side only validation

See main `SECURITY.md` for details.

**⚠️ Never deploy to production without fixing these vulnerabilities.**

