# Revenue Management Backend System

**B2B Enterprise revenue management backend system** with contract-based billing, hierarchical accounts, and seat-based licensing.

Extracted from the [hybrid-ui](https://github.com/AkshayGuleria/hybrid-ui) project on 2026-01-12 to enable independent development.

## Overview

This repository contains the specification and implementation for a full-featured B2B Enterprise billing system designed for SaaS companies selling to large organizations with complex contracts, hierarchical account structures, and custom payment terms.

### Key Features

- 🏢 **Hierarchical Accounts** - Parent companies with multiple subsidiaries
- 📄 **Contract Management** - Multi-year commitment-based contracts
- 👥 **Seat-Based Licensing** - Per-user/license pricing with volume discounts
- 📋 **Purchase Order Workflows** - Enterprise procurement and approval workflows
- 💳 **Credit Management** - Credit limits and holds
- 🧾 **Consolidated Billing** - Roll-up invoices across subsidiaries
- 📅 **Flexible Billing** - Quarterly/Annual billing in advance
- 💰 **Custom Payment Terms** - Net 30/60/90 configurations

## Documentation

- **[Feature Specification](./docs/feature-spec.md)** - Complete technical specification (141 subtasks across 5 phases)
- **[Architecture](./docs/architecture.md)** - System architecture and design decisions (coming soon)
- **[API Documentation](./docs/api.md)** - RESTful API endpoints (coming soon)
- **[Database Schema](./docs/schema.md)** - PostgreSQL schema design (coming soon)

## Technology Stack

- **Backend:** Express.js (Node.js)
- **Database:** PostgreSQL (with recursive CTEs for hierarchies)
- **Job Queue:** BullMQ + Redis
- **Scalability:** PM2 + Node.js Cluster + Worker Threads
- **Payments:** Stripe API + ACH

## Development Phases

| Phase | Focus | Status | Tasks |
|-------|-------|--------|-------|
| **Phase 1** | Foundation - Enterprise accounts, contracts | Planned | 30 |
| **Phase 2** | Contract billing + Hybrid scalability | Planned | 44 |
| **Phase 3** | Hierarchical accounts, consolidated billing | Planned | 21 |
| **Phase 4** | Purchase orders, credit management | Planned | 23 |
| **Phase 5** | Analytics, renewal tracking, SLA adjustments | Planned | 23 |
| **Phase 6+** | B2C event-based billing (future) | Deferred | TBD |

**Total:** 141 subtasks across 5 phases

## Performance Targets

- **API throughput:** 200 req/sec (complex hierarchical queries)
- **Contract billing:** 40 invoices/sec (seat calculations + volume discounts)
- **Consolidated billing:** 15 invoices/sec (10 subsidiaries per parent)
- **Quarterly billing:** 10K accounts in 4 minutes
- **Annual billing:** 50K accounts in 21 minutes
- **Month-end processing:** Complete billing for 50K accounts in <30 minutes

## Getting Started

Currently in **planning phase**. Implementation will begin with Phase 1 (Foundation).

See [docs/feature-spec.md](./docs/feature-spec.md) for the complete specification.

## Project Structure (Planned)

```
revenue-mgmt/
├── docs/                    # Documentation
│   ├── feature-spec.md      # Complete feature specification
│   ├── architecture.md      # Architecture decisions
│   ├── api.md              # API documentation
│   └── schema.md           # Database schema
├── packages/               # Future: Monorepo packages
│   ├── revenue-backend/    # Express.js API server
│   ├── workers/           # BullMQ worker processes
│   └── migrations/        # Database migrations
└── README.md              # This file
```

## Related Projects

- **[hybrid-ui](https://github.com/AkshayGuleria/hybrid-ui)** - Frontend Revenue app that will consume this backend
- **Frontdoor Auth** - Shared authentication system (from hybrid-ui)

## License

(To be determined)

## Contact

(To be determined)
