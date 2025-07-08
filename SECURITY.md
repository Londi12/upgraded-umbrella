# Security Guidelines

## Environment Variables
- Never commit `.env.local` or `.env` files
- Use `.env.example` as template
- Rotate Supabase keys regularly
- Use different keys for development/production

## Authentication
- All authentication handled by Supabase
- JWT tokens stored securely in httpOnly cookies
- Row Level Security (RLS) enabled on all tables
- User data isolated by user ID

## Data Protection
- All user data encrypted at rest (Supabase)
- HTTPS enforced in production
- No sensitive data in localStorage
- CV data sanitized before storage

## API Security
- Rate limiting on all API endpoints
- Input validation and sanitization
- CORS properly configured
- No sensitive operations in client-side code

## File Upload Security
- File type validation (PDF, DOCX, TXT only)
- File size limits enforced
- Virus scanning recommended for production
- Temporary file cleanup

## Production Checklist
- [ ] Environment variables configured
- [ ] HTTPS certificate installed
- [ ] Supabase RLS policies active
- [ ] Error logging configured
- [ ] Rate limiting enabled
- [ ] File upload limits set
- [ ] CORS headers configured
- [ ] Security headers added

## Reporting Security Issues
Contact: security@cvkonnekt.com