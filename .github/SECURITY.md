# Security Policy

## Supported Versions

We currently support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Scanning

This project uses comprehensive automated security scanning:

### Continuous Monitoring
- **npm audit**: Daily scans for known vulnerabilities in dependencies
- **CodeQL**: Static code analysis for security issues (SQL injection, XSS, etc.)
- **Secrets scanning**: TruffleHog scans for leaked credentials in commits
- **Dependency review**: Automated checks for new dependency vulnerabilities in PRs
- **SBOM generation**: Software Bill of Materials for compliance and audit trail

### Coverage
- Production dependencies: Fails on moderate+ severity vulnerabilities
- Code security: Detects OWASP Top 10 vulnerabilities
- License compliance: Blocks GPL licenses, allows MIT/Apache/BSD/ISC
- Supply chain: Tracks all dependencies for transparency

## Reporting a Vulnerability

**DO NOT** open public issues for security vulnerabilities.

### For Critical Security Issues

If you discover a security vulnerability, please email:

**Security Contact:** [Your security email here]

**Response Time:**
- Critical issues: Within 24 hours
- High severity: Within 72 hours
- Medium/Low: Within 1 week

### What to Include

Please include the following in your report:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up

### What to Expect

1. **Acknowledgment**: We'll confirm receipt within 24-48 hours
2. **Investigation**: We'll investigate and provide an initial assessment
3. **Fix Development**: We'll develop and test a fix
4. **Disclosure**: We'll coordinate disclosure timing with you
5. **Credit**: We'll credit you in the security advisory (unless you prefer anonymity)

## Security Best Practices

This project follows security best practices:

### Code Security
- ✅ Input validation on all API endpoints
- ✅ SQL injection prevention via Prisma ORM
- ✅ XSS prevention through proper escaping
- ✅ CSRF protection via SameSite cookies
- ✅ Rate limiting on all endpoints
- ✅ Authentication and authorization checks
- ✅ Secure session management

### Data Protection
- ✅ Sensitive data encryption at rest (database-level)
- ✅ TLS/HTTPS for data in transit
- ✅ No storage of credit card numbers (Stripe tokenization)
- ✅ PCI DSS compliance for payment processing
- ✅ GDPR/SOC2 compliant audit logging

### Dependency Security
- ✅ Automated dependency updates via Dependabot
- ✅ Daily vulnerability scans
- ✅ Production dependencies locked to specific versions
- ✅ License compliance checks
- ✅ Software Bill of Materials (SBOM) generation

### Infrastructure Security
- ✅ Database connection pooling with limits
- ✅ Redis authentication required
- ✅ Environment variable validation
- ✅ Secrets management (never committed to git)
- ✅ Docker security scanning (planned)

## Known Security Considerations

### Financial Data Handling
This is a B2B revenue management system that handles:
- Invoice generation and billing
- Contract management
- Payment processing integration
- Financial reporting

**Special precautions:**
- All financial mutations are logged for audit trail
- Database transactions ensure ACID compliance
- Credit limit checks prevent over-billing
- Invoice number uniqueness enforced at database level

### Third-Party Integrations
- **Stripe**: Payment processing (uses tokenization, no card storage)
- **PostgreSQL**: Database (encrypted connections required)
- **Redis**: Job queue (authentication required)

## Compliance

This project aims to comply with:
- **PCI DSS**: Payment Card Industry Data Security Standard
- **SOC2**: Service Organization Control 2
- **GDPR**: General Data Protection Regulation
- **ISO 27001**: Information security management

## Security Audit History

| Date | Type | Findings | Status |
|------|------|----------|--------|
| TBD  | External Audit | - | Planned |
| Daily | Automated Scans | See GitHub Security tab | Ongoing |

## Additional Resources

- [GitHub Security Advisories](../../security/advisories)
- [CodeQL Results](../../security/code-scanning)
- [Dependency Alerts](../../security/dependabot)
- [Workflow Documentation](.github/workflows/README.md)

---

**Last Updated:** 2026-01-24
