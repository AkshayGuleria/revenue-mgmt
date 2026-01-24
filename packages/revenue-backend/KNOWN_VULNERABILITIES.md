# Known Vulnerabilities

This document tracks known security vulnerabilities in dependencies that require breaking changes to fix.

## Status: 6 vulnerabilities (4 moderate, 2 high)

Last updated: 2026-01-24

---

## High Severity Vulnerabilities

### 1. @fastify/middie - Path Bypass (GHSA-cxrg-g7r8-w69p)

**Severity:** High
**Affected versions:** <= 9.0.3
**Current version:** 8.3.3 (via @nestjs/platform-fastify@10.4.22)
**Fixed in:** 9.0.4+

**Why not fixed:**
- Fix requires Fastify 5.x
- Current project uses Fastify 4.28.1
- Upgrading to Fastify 5.x requires NestJS 11 (breaking change)

**Mitigation:**
- @fastify/middie is used internally by NestJS for middleware support
- Vulnerability is a path bypass in URL encoding
- Our API endpoints use explicit path validation
- Not directly exploitable in current architecture

**Planned fix:**
- Upgrade to NestJS 11 + Fastify 5.x in Phase 4 or later
- Tracked in: [Future Issue - Framework Upgrade]

---

## Moderate Severity Vulnerabilities

### 2. @nestjs/platform-fastify - URL Encoding Middleware Bypass (GHSA-8wpr-639p-ccrj)

**Severity:** Moderate
**Affected versions:** < 11.1.10
**Current version:** 10.4.22
**Fixed in:** 11.1.10+

**Why not fixed:**
- Fix requires NestJS 11 (breaking change)
- Current project uses NestJS 10.4.22

**Mitigation:**
- TOCTOU (Time-of-check to time-of-use) vulnerability
- Requires specific attack pattern
- Our API uses standardized routing patterns
- Input validation at controller level

**Planned fix:**
- Upgrade to NestJS 11 in Phase 4 or later

---

### 3. lodash - Prototype Pollution (GHSA-xxjr-mmjv-4gpg)

**Severity:** Moderate
**Affected versions:** 4.0.0 - 4.17.21
**Current version:** 4.17.21 (via @nestjs/config, @nestjs/swagger)
**Fixed in:** No fix available (lodash is in maintenance mode)

**Why not fixed:**
- @nestjs/config and @nestjs/swagger depend on lodash
- No version of lodash fixes this issue (package in maintenance mode)
- Would require rewriting @nestjs/config and @nestjs/swagger

**Mitigation:**
- Vulnerability in `_.unset` and `_.omit` functions
- Not directly exposed in our API surface
- Config values are loaded at startup, not user-controlled
- Swagger is dev/documentation only

**Planned fix:**
- Monitor for @nestjs/config and @nestjs/swagger updates that remove lodash
- Consider alternative configuration library if lodash becomes critical issue

---

## Security Workflow Configuration

Our CI/CD security scan is configured to:
- **Fail on:** Critical vulnerabilities
- **Warn on:** High and moderate vulnerabilities
- **Ignore:** Low vulnerabilities

This allows us to:
1. Block any critical security issues immediately
2. Track and plan fixes for high/moderate issues
3. Maintain development velocity while managing technical debt

---

## Remediation Plan

### Phase 4 - Framework Upgrade (Planned)
- Upgrade to NestJS 11.x
- Upgrade to Fastify 5.x
- This will resolve:
  - @fastify/middie path bypass (HIGH)
  - @nestjs/platform-fastify TOCTOU (MODERATE)

### Long-term
- Monitor @nestjs/config and @nestjs/swagger for lodash removal
- Evaluate alternative libraries if lodash vulnerabilities escalate

---

## Audit Trail

| Date | Action | Vulnerabilities | Notes |
|------|--------|----------------|-------|
| 2026-01-24 | Initial audit | 17 total (4 low, 4 moderate, 9 high) | Baseline |
| 2026-01-24 | Applied overrides | 6 total (4 moderate, 2 high) | Fixed 11 dev dependency vulnerabilities |
| 2026-01-24 | Accepted known issues | 6 total (4 moderate, 2 high) | Documented for Phase 4 fix |

---

## References

- [GHSA-cxrg-g7r8-w69p](https://github.com/advisories/GHSA-cxrg-g7r8-w69p) - @fastify/middie path bypass
- [GHSA-8wpr-639p-ccrj](https://github.com/advisories/GHSA-8wpr-639p-ccrj) - @nestjs/platform-fastify TOCTOU
- [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg) - lodash prototype pollution
- [Security Policy](../../.github/SECURITY.md)
