# SAFEORA — Self-Defending Document Vault

SAFEORA is a self-defending document security web application designed to protect sensitive organizational records from tampering, ransomware, and silent bit-rot.

Its central concept combines:
1. **Client-side document encryption** (Web Crypto API AES-256-GCM with unique 96-bit nonces).
2. **Authenticated, tamper-evident integrity manifests** (SHA-256 chunk hashes + Merkle root + digital signatures).
3. **Versioned and independently protected recovery copies** in segregated storage.
4. **Suspicious-activity detection & automated containment** of rogue sessions and tampered content.
5. **Safe Breach Rehearsal & Recovery Proof engine** with 5 non-destructive attack simulations.
6. **Verifiable restoration and audit reports** exportable in Markdown and structured JSON.

---

## Defensive Pipeline

$$\textbf{Protect} \rightarrow \textbf{Monitor} \rightarrow \textbf{Detect} \rightarrow \textbf{Contain} \rightarrow \textbf{Verify} \rightarrow \textbf{Recover} \rightarrow \textbf{Report}$$

1. **Protect**: Files are encrypted in browser memory prior to transmission. Decryption keys remain client-held.
2. **Monitor**: Every version generates a canonical Merkle tree manifest authenticated by an isolated signing secret.
3. **Detect**: Integrity checks recompute chunk hashes and Merkle roots to catch bit-rot or malicious modifications.
4. **Contain**: Rule-based detection revokes compromised sessions and restricts tampered documents.
5. **Verify**: Pre-restoration integrity checks ensure recovery replicas are 100% verified before restoration.
6. **Recover**: Clean snapshots are promoted into the active vault with atomic version increments.
7. **Report**: Cryptographic proof reports document simulated attack results and immutable audit chains.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript (Strict), Tailwind CSS, Lucide React, Recharts.
- **Backend**: Next.js Route Handlers, Reusable Service Layer, Zod Validation, Sliding Window Rate Limiting.
- **Database & ORM**: Prisma ORM with native PostgreSQL (`provider = "postgresql"`), configured for cloud deployment (Supabase, Neon, Railway, Vercel Postgres).
- **Cryptography**: Web Crypto API (`AES-GCM`, `SHA-256`), Scrypt password hashing with OWASP-recommended cost factors, HMAC/Ed25519 digital signatures.
- **Storage Abstraction**: Modular `StorageAdapter` supporting local filesystem segregation (Development) and AWS S3 multi-bucket separation (Production).
- **Test Suite**: Vitest (unit & integration tests).

---

## Project Structure

```
safeora-vault/
  ├── src/
  │   ├── app/
  │   │   ├── page.tsx                     # Public Landing Page
  │   │   ├── login/page.tsx               # Session Authentication & Demo Auto-fill
  │   │   ├── register/page.tsx            # Tenant Registration & Identity Provisioning
  │   │   ├── dashboard/page.tsx           # Security Overview & Real Telemetry
  │   │   ├── vault/page.tsx               # Document Vault & Client-Side Encryption
  │   │   ├── vault/[documentId]/page.tsx  # Document Manifest, Restoration, Safe Preview
  │   │   ├── versions/page.tsx            # Restoration Snapshots & Audit Trail
  │   │   ├── security/page.tsx            # Security Center & Session Containment
  │   │   ├── rehearsal/page.tsx           # Breach Rehearsal & Recovery Proof Suite
  │   │   ├── incidents/page.tsx           # Incidents & Forensic Management
  │   │   ├── settings/page.tsx            # Security Policies & Containment Config
  │   │   ├── help/page.tsx                # Technical Documentation & Architecture
  │   │   └── api/                         # Typed & Validated Route Handlers
  │   ├── components/
  │   │   ├── layout/app-shell.tsx         # Sidebar, Topbar & Navigation Shell
  │   │   └── shared/toast-context.tsx     # Toast Notification System
  │   ├── lib/
  │   │   ├── auth/                        # Password hashing (Scrypt) & Sessions
  │   │   ├── crypto/                      # Envelope encryption, Manifests, Merkle tree
  │   │   ├── database/prisma.ts           # Singleton Prisma Client
  │   │   ├── storage/                     # StorageAdapter (Local & S3)
  │   │   ├── security/threat-detector.ts  # Automated Containment Engine
  │   │   ├── audit/audit-logger.ts        # Hash-Chained Audit Ledger
  │   │   ├── rate-limit/rate-limiter.ts   # Sliding Window Rate Limiter
  │   │   └── validation/schemas.ts        # Zod Request Schemas
  │   └── services/                        # Business Logic Modules
  ├── prisma/
  │   ├── schema.prisma                    # Data Models
  │   └── seed.ts                          # Demo Account & Initial Document Seeder
  ├── storage/                             # Local Filesystem Storage Namespaces
  │   ├── uploads/                         # Primary Encrypted Ciphertext
  │   ├── recovery/                        # Segregated Recovery Snapshots
  │   └── fixtures/                        # Rehearsal Simulation Sandboxes
  └── tests/                               # Vitest Test Suite
```

---

## Quickstart & Local Setup

### 1. Prerequisites
- Node.js v18+ (tested on Node v24)
- npm or pnpm

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database & Seed Demo Data
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Test Suite
```bash
npm test
```
*Executes all 16 unit and integration tests (including the 5 Breach Rehearsal scenarios).*

### 5. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Demo Credentials

- **Email:** `demo@safeora-vault.local` (or legacy: `demo@phoenix-vault.local`)
- **Password:** `SafeoraVaultDemo2026!` (or legacy: `PhoenixVaultDemo2026!`)
*(Click the "Fill Seed Demo Credentials" button on `/login` to auto-populate)*

---

## Breach Rehearsal Scenarios

Under `/rehearsal`, users can trigger 5 isolated simulations:
1. **Scenario A (Document Tampering):** Modifies a test ciphertext byte to prove that chunk hash and Merkle root checks detect alteration.
2. **Scenario B (Manifest Tampering):** Forges manifest data without the signing key to prove signature verification rejection.
3. **Scenario C (Unauthorized Session):** Tests automated containment by revoking an unauthorized test session without impacting the operator.
4. **Scenario D (Verified Recovery):** Corrupts primary test data, proves detection, verifies isolated recovery replica, and executes clean restoration.
5. **Scenario E (Bulk Anomaly):** Fires rapid synthetic requests exceeding configured rate limits to verify anomaly detection and session containment.

---

## Honest Security Assumptions & Limitations

- **Endpoint Security:** Client-side encryption relies on browser integrity. Compromised endpoints with malware or keyloggers can intercept keys.
- **Signing Secret Isolation:** Manifest digital signatures authenticate integrity only as long as the signing secret remains isolated from attacker write authority.
- **Development Boundary:** In local development, recovery storage resides in separate filesystem directories simulating cloud boundary isolation. For production, AWS S3 with separate IAM roles and retention locks is required.
- **Client-Held Key Loss:** Because documents are encrypted with client-held keys, losing the key means the document cannot be decrypted, by design.
