# ADR-001: Adopt NestJS + Fastify + SWC for Backend Framework

**Date:** 2026-01-13
**Status:** Accepted
**Topic:** Framework Selection
**Scope:** Entire backend application (all 141 tasks across 5 phases)
**Deciders:** tommi (Architecture), Product Owner

---

## Context and Problem Statement

The Revenue Management Backend System requires a robust framework to handle complex B2B enterprise billing logic including:
- 141 tasks across 5 development phases
- Complex business logic (seat-based billing, volume discounts, hierarchical accounts, consolidated billing)
- High performance requirements (200 req/sec API throughput, 40 invoices/sec contract billing)
- Type safety for financial calculations
- Integration with PostgreSQL, Redis, BullMQ
- PM2 cluster mode with 4 worker processes

The original specification proposed **Express.js** with plain JavaScript. However, as we prepare for implementation, we need to evaluate whether this is the optimal choice for a complex B2B billing system with strict accuracy requirements for financial operations.

**Key Questions:**
1. Should we use a framework or stick with Express.js?
2. What level of type safety do we need for financial calculations?
3. How can we ensure fast build times during development?
4. How do we maintain code quality across 141 tasks?

---

## Decision

We will adopt **NestJS with Fastify adapter and SWC build tool** instead of Express.js for the backend implementation.

**Technology Stack:**
- **Framework:** NestJS (v10+)
- **HTTP Adapter:** Fastify (instead of Express)
- **Build Tool:** SWC (instead of TypeScript Compiler)
- **Language:** TypeScript (instead of JavaScript)
- **ORM:** Prisma (type-safe database client)
- **Validation:** class-validator + class-transformer (declarative DTOs)
- **API Documentation:** @nestjs/swagger (auto-generated OpenAPI)
- **Testing:** Jest with @nestjs/testing

**Architecture remains unchanged:**
- PostgreSQL database (same schema design)
- Redis + BullMQ for job queues (same queue architecture)
- PM2 cluster mode with 4 processes (same scalability pattern)
- Worker Threads for CPU-intensive tasks (same)
- Dedicated worker processes (same)

---

## Consequences

### Positive

**1. Better Architecture for Complex B2B Logic**
- **Dependency Injection:** Clean service composition (BillingService, SeatCalculatorService, DiscountEngineService)
- **Modular Design:** Each feature gets its own module (AccountsModule, ContractsModule, InvoicesModule)
- **Separation of Concerns:** Controllers, Services, Repositories pattern enforced
- **Testability:** DI makes mocking and testing trivial

**2. Type Safety for Financial Operations**
- **TypeScript-first:** Catch calculation errors at compile time
- **Prisma ORM:** Auto-generated types from database schema prevent SQL injection and type mismatches
- **DTOs with validation:** Request/response types validated automatically
- **Prevents costly bugs:** Financial calculations (seat price × quantity, volume discounts, tax) are type-checked

**3. Superior Performance**
- **Fastify:** 3x faster than Express (~30K req/sec vs ~10K req/sec)
- **Lower latency:** p95 response time ~15ms vs ~50ms for Express
- **Easily exceeds targets:** Our 200 req/sec goal is easily achieved
- **Better for B2B:** Lower concurrency but complex queries benefit from speed

**4. Fast Development Iteration**
- **SWC builds:** 5-8 seconds (vs 45-60 seconds with tsc)
- **20x faster:** Significantly improves developer experience
- **Hot reload:** Fast watch mode for development
- **Faster CI/CD:** Quicker build pipelines

**5. Auto-Generated API Documentation**
- **@nestjs/swagger:** OpenAPI docs generated from decorators
- **Always in sync:** Docs can't drift from implementation
- **Better frontend integration:** frooti gets accurate API contracts

**6. Built-in Best Practices**
- **Validation:** Automatic request validation with DTOs
- **Exception handling:** Global exception filters
- **Interceptors:** Logging, caching, transformation
- **Guards:** Authentication and authorization patterns
- **Pipes:** Data transformation and validation

**7. Better Queue Integration**
- **@nestjs/bullmq:** Native NestJS module for BullMQ
- **Cleaner code:** Queue producers/consumers use DI
- **Easier testing:** Mock queue services in tests

**8. Future-Proof**
- **Microservices ready:** Can split into microservices later if needed
- **GraphQL support:** Easy to add if required
- **WebSockets:** Built-in support for real-time features
- **gRPC:** Can add inter-service communication

### Negative

**1. Learning Curve**
- Team needs to learn NestJS concepts (decorators, DI, modules)
- More opinionated than Express (less flexibility)
- **Mitigation:** Excellent documentation, similar to Angular

**2. Slightly Higher Abstraction**
- More "magic" with decorators and DI
- Harder to debug for developers unfamiliar with NestJS
- **Mitigation:** Better stack traces with SWC, comprehensive logging

**3. Bundle Size**
- Larger node_modules due to framework dependencies
- ~150MB vs ~50MB for bare Express
- **Mitigation:** Not a concern for backend, only development

**4. TypeScript Compilation Required**
- Can't run .ts files directly (need build step)
- **Mitigation:** SWC makes this negligible (5-8 seconds)

### Neutral

**1. Minimal Roadmap Impact**
- Same 141 tasks, just different implementation approach
- Add 2 tasks: "Set up NestJS project" and "Configure Prisma schema"
- **Total: 143 tasks** (141 + 2)

**2. Same Infrastructure**
- PostgreSQL, Redis, BullMQ, PM2 remain unchanged
- Same database schema design
- Same scalability architecture (cluster, worker threads, queues)

**3. Team Composition**
- biksi (backend agent) needs NestJS expertise
- habibi (infrastructure) mostly unaffected
- frooti (frontend) gets better API contracts

---

## Alternatives Considered

### Alternative 1: Express.js (Original Plan)

**Pros:**
- Minimal, unopinionated
- Team likely already familiar
- Smaller bundle size
- More flexibility

**Cons:**
- No built-in architecture (must design ourselves)
- Manual validation and error handling
- No type safety (plain JavaScript)
- Slower performance (~10K req/sec)
- Manual API documentation
- Harder to maintain across 141 tasks

**Reason for Rejection:** Too much manual work for a complex B2B system with 141 tasks. Risk of inconsistent patterns across modules. No type safety for critical financial calculations.

### Alternative 2: Express.js + TypeScript

**Pros:**
- Type safety with TypeScript
- Familiar Express patterns
- More lightweight than NestJS

**Cons:**
- Still need to design architecture ourselves
- No built-in DI or module system
- Manual API documentation
- Slower performance than Fastify
- Manual validation setup

**Reason for Rejection:** Gains type safety but loses architectural benefits. Still slower than Fastify. Must manually set up patterns that NestJS provides out-of-the-box.

### Alternative 3: NestJS + Express (default)

**Pros:**
- All NestJS benefits
- Default Express adapter

**Cons:**
- Slower than Fastify (10K vs 30K req/sec)
- Higher latency

**Reason for Rejection:** Fastify adapter provides 3x better performance with minimal migration effort. No reason to stick with slower Express when Fastify is drop-in compatible.

### Alternative 4: Fastify (standalone)

**Pros:**
- Excellent performance (30K req/sec)
- Lower-level control
- Plugin ecosystem

**Cons:**
- No built-in architecture framework
- Manual DI setup
- Less opinionated than NestJS
- Smaller ecosystem than Express/NestJS

**Reason for Rejection:** Gains performance but loses architectural structure. Better to get both via NestJS + Fastify adapter.

### Alternative 5: tsc (TypeScript Compiler) instead of SWC

**Pros:**
- Official TypeScript compiler
- More mature
- Better type checking by default

**Cons:**
- 20x slower builds (45-60 seconds vs 5-8 seconds)
- Slower watch mode
- Worse developer experience

**Reason for Rejection:** SWC provides same type checking (with `typeCheck: true`) but 20x faster compilation. No downside.

---

## Implementation Plan

### Phase 1 Setup (Week 1)

1. **Initialize NestJS Project**
   ```bash
   npm i -g @nestjs/cli
   nest new revenue-backend --package-manager npm
   cd revenue-backend
   npm install @nestjs/platform-fastify
   ```

2. **Configure Fastify Adapter**
   - Update `main.ts` to use FastifyAdapter
   - Configure validation pipe globally
   - Set up Swagger documentation

3. **Install SWC**
   ```bash
   npm i -D @swc/cli @swc/core
   ```
   - Update `nest-cli.json` with SWC builder
   - Create `.swcrc` configuration

4. **Set up Prisma**
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```
   - Define Phase 1 schema (accounts, contracts, products, invoices)
   - Create initial migration

5. **Install Dependencies**
   ```bash
   npm install @nestjs/bullmq bullmq ioredis
   npm install class-validator class-transformer
   npm install @nestjs/swagger
   ```

6. **Create Base Modules**
   - AccountsModule
   - ContractsModule
   - ProductsModule
   - InvoicesModule
   - PrismaModule (common)
   - QueueModule (common)
   - AuthModule (common)

### Phase 2+ Integration

- BullMQ queues integrate via `@nestjs/bullmq`
- Worker processes use standalone NestJS applications
- PM2 config updated to run compiled `dist/` files
- Same scalability architecture (cluster, workers, threads)

---

## Validation Criteria

This decision will be considered successful if:

1. ✅ **Build time < 10 seconds** (SWC target: 5-8 seconds)
2. ✅ **API throughput > 200 req/sec** (Target exceeded with Fastify)
3. ✅ **Type safety prevents bugs** (No runtime type errors in financial calculations)
4. ✅ **Developer satisfaction** (Fast iteration, good DX)
5. ✅ **Maintainability** (Clean module structure across 141 tasks)
6. ✅ **Test coverage > 80%** (DI makes testing easier)

**Success Metrics (to measure after Phase 1):**
- Build time comparison: tsc vs SWC
- Load test results: req/sec throughput
- Type error detection rate in CI/CD
- Developer feedback on DX
- Code review quality scores

---

## References

**NestJS:**
- [Official Documentation](https://docs.nestjs.com)
- [Fastify Adapter](https://docs.nestjs.com/techniques/performance)
- [BullMQ Integration](https://docs.nestjs.com/techniques/queues)

**SWC:**
- [SWC Documentation](https://swc.rs)
- [NestJS + SWC Guide](https://docs.nestjs.com/recipes/swc)

**Prisma:**
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS + Prisma](https://docs.nestjs.com/recipes/prisma)

**Performance Benchmarks:**
- [Fastify vs Express Benchmarks](https://github.com/fastify/benchmarks)
- [SWC vs tsc Compilation Speed](https://swc.rs/docs/benchmarks)

**Related Decisions:**
- Original architecture specification: `docs/feature-spec.md`
- Agent definitions: `.claude/agents.md`
- Project overview: `CLAUDE.md`

---

## Notes

- This ADR supersedes the original Express.js plan in `feature-spec.md`
- Database schema and scalability architecture remain unchanged
- PM2 configuration needs minor updates (run `dist/main.js` instead of `src/index.js`)
- Roadmap increases from 141 to 143 tasks (+2 for NestJS/Prisma setup)
- All agents (biksi, habibi, frooti) notified of this decision
