  Governly Product Vision Summary

  **Internal Positioning (do not use in public marketing):**
  Governly is Terraform-like control for Microsoft 365 identity, with guardrails for humans.

  **Public Positioning:**
  Governly is a Desired State Configuration (DSC) platform for Microsoft 365 identity and access.
  You define what "secure" looks like once. Governly continuously checks your tenant against that desired state, shows where it deviates, and helps you bring it back into alignment.

  **What Governly is NOT:**
  - SIEM
  - Posture management
  - Audit automation
  - Compliance tooling

  Core Philosophy:
  - Opinionated + Fast UX as the moat vs Microsoft native features
  - Risk-proportionate security - match strictness to data sensitivity, not one-size-fits-all
  - Self-service detection - implementation is customer's problem
  - Zero-knowledge architecture - never store credentials, only delegated auth
  - DSC control loop: Define → Detect → Enforce → Maintain

  Key Technical Decisions:
  | Area                   | Decision                                                |
  |------------------------|---------------------------------------------------------|
  | Policy conflicts       | Recommend merge + human review                          |
  | Auto-remediation scope | Customer-configurable thresholds                        |
  | Intent detection       | Pattern-based suppression with severity floor + decay   |
  | License gating         | Hide unavailable controls entirely                      |
  | Multi-tenant           | Config export/import (not automated pipelines)          |
  | Audit granularity      | All remediation actions (not just posture changes)      |
  | Race conditions        | Queue serialization (lock during preview→execute)       |
  | API deprecation        | Version-pinned deployments                              |
  | Policy ownership       | Co-managed with tracking                                |
  | Credential security    | Zero-knowledge with short-lived in-memory token cache   |
  | Policy graduation      | Suggest but don't act (human enables)                   |
  | M365 expansion         | Unified policy engine, but native configs only (no DSL) |

  Safety Guardrails:
  - Hard limits on dangerous auto-remediation actions
  - Approval required for risky configs
  - Severity floor - critical issues never auto-suppressed
  - Suppression rules decay over time

  Biggest Risk: Security breach of Governly itself - trust is everything.



  Here's the full technical architecture based on your answers:

  Security & Credentials

  | Decision             | Implementation                                     |
  |----------------------|----------------------------------------------------|
  | Token storage        | Supabase Vault with TTL                            |
  | Token access         | Cache decrypted token per Edge Function invocation |
  | Heartbeat monitoring | Cross-check via Azure Monitor audit logs           |
  | Log Analytics access | Customer choice with "reduced protection" warning  |

  Concurrency & Locking

  | Decision                | Implementation                             |
  |-------------------------|--------------------------------------------|
  | Resource locking        | Lease-based with 2-minute timeout          |
  | Bulk operation failures | Keep successes, report failures separately |
  | Change detection        | Periodic polling during scans              |

  ML & Suppression

  | Decision     | Implementation                                                 |
  |--------------|----------------------------------------------------------------|
  | ML signals   | Dismiss action + context metadata (time, admin, resource type) |
  | ML runtime   | Dedicated ML service (not Edge Functions)                      |
  | Rule decay   | 30 days                                                        |
  | Safety rails | Severity floor + decay + audit trail                           |

  Data & Aggregation

  | Decision       | Implementation                                       |
  |----------------|------------------------------------------------------|
  | MSP dashboard  | Materialized views in database                       |
  | Config export  | Raw JSON snapshot                                    |
  | Orphan marking | Add note to policy description field (preserve name) |

  Safety Guardrails

  | Decision               | Implementation                                      |
  |------------------------|-----------------------------------------------------|
  | Hard limits            | Target-based (GA/break-glass never auto-remediated) |
  | Approval integrity     | Role-based separation (different org roles)         |
  | Permission degradation | Block affected features (not just banner)           |

  Testing & Versioning

  | Decision            | Implementation                             |
  |---------------------|--------------------------------------------|
  | API version testing | Mock responses per version                 |
  | Recovery scans      | Customer-triggered (avoid thundering herd) |

  Key Tradeoffs Accepted

  1. Security over performance: Decrypt per invocation, accept latency
  2. Simplicity over automation: Customer-triggered recovery, manual policy graduation
  3. Opinionated over flexible: Immutable severity, Governly-defined controls
  4. Reliability over features: Polling over webhooks, mock testing over real tenants