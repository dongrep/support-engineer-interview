## UI Issues

### Ticket UI-101: Dark Mode Text Visibility

- **Reporter**: Sarah Chen
- **Priority**: Medium
- **Description**: When using dark mode, the text typed into forms appears white on a white background, making it impossible to see.
- **Steps to Reproduce**:
  1. Enable dark mode
  2. Navigate to any input form
  3. Start typing
- **Expected**: Text should be clearly visible against the background.
- **Actual**: Text is white on a white background.

**Solution**: Update global.css to include input styles to use the correct background and foreground colors.

### Ticket VAL-201: Email Validation Problems

- **Reporter**: James Wilson
- **Priority**: High
- **Description**: The system accepts invalid email formats and doesn't handle special cases properly.
- **Examples**:
  - Accepts "TEST@example.com" but converts to lowercase without notifying the user.
  - No validation for common typos like ".con" instead of ".com".

**Solution**: Implement regex-based validation for email formats, introduce a state variable to track changes, and add suggestions for common TLD errors.

---

### Ticket VAL-202: Date of Birth Validation

- **Reporter**: Maria Garcia
- **Priority**: Critical
- **Description**: The system accepts future dates for the date of birth, such as 2025.
- **Impact**: This could lead to compliance issues with accepting minors.
- **Solution**: Add validation to ensure the date of birth is not in the future and meets the required age criteria.

**Solution**: Fixed using age validator helper function to check if the user is at least 18 years or older

### Ticket VAL-205: Zero amount funding (15 min)

- **Priority**: HIGH
- **Impact**: Noise in ledger and misleading transaction history

**RCA**: No minimum amount validation was enforced on funding requests, allowing 0 amounts to be accepted and recorded.

### Ticket VAL-207: Routing number required

- **Priority**: HIGH
- **Impact**: Failed or delayed transfers due to missing routing information

**RCA**: The routing number field was marked optional in validation/schema, allowing records to be created without it.

**Solution**:

1. Add client-side form validation to prevent submission without a routing number.
2. Add a short unit test to assert validation fails when the routing number is missing.

**Solution**:

1. Add client-side guard to prevent submitting zero or negative amounts.
2. Add unit tests to ensure zero and negative amounts are rejected.

### Ticket VAL-208: Weak Password Requirements

- **Reporter**: Security Team
- **Priority**: Critical
- **Description**: "Password validation only checks length, not complexity"
- **Impact**: Account security risks

**RCA**: The password validation enforced only a minimum length, allowing weak passwords that lacked complexity (uppercase, lowercase, numeric, special characters).

**Solution**:

1. Enforce password complexity in the validation/schema: require at least 1 uppercase, 1 lowercase, 1 numeric, 1 special character, and minimum 8 characters.
2. Add client-side feedback to show which complexity requirements are unmet as the user types.
3. Add unit tests validating both accepted and rejected password inputs.

---

### Ticket SEC-301: SSN Storage

- **Reporter**: Security Audit Team
- **Priority**: Critical
- **Description**: SSNs are stored in plaintext in the database.
- **Impact**: Severe privacy and compliance risk.

**Solution**:

1. Create a random key for encryption using `crypto` and save it to environment variables.
2. Add two helper functions to encrypt and decrypt SSNs using an initialization vector (IV) and the key.
3. Use the helper functions to store the SSN in the database after validation from the form.
4. Write tests to ensure the helper functions work as expected.

---

### Ticket SEC-302: Insecure Random Numbers

- **Reporter**: Security Team
- **Priority**: High
- **Description**: Account numbers generated using `Math.random()`
- **Impact**: Potentially predictable account numbers

**RCA**: Random numbers as Acccount Number could be predicted

**Solution**:

1. Have a BIN for identification.
2. Use the `crypto` library to generate a 10-digit number.
3. Use Luhn's Algorithm to calculate the check digit.
4. Test the function to produce 10,000 accounts and ensure each account starts with the BIN.

---

### Ticket SEC-303: XSS Vulnerability

- **Reporter**: Security Audit

- **Priority**: Critical

- **Description**: Unescaped HTML rendering in transaction descriptions.

- **Impact**: Potential for cross-site scripting attacks.

**RCA**: Using `dangerouslySetHTML` for `description` while rendering `transaction.description`. This is unnecessary, or if required, a safer approach must be implemented.

**Solution**: Render `transaction.description` as plain text; React will handle escaping automatically.

**Ticket SEC-304: Session Management**

- **Reporter**: DevOps Team
- **Priority**: High
- **Description**: "Multiple valid sessions per user, no invalidation"

- **RCA**: No deletion of existing sessions before creating a new session, allowing multiple active sessions for the same user.

- **Solution**: delete any existing sessions for the user and then insert the new session atomically so only one active session exists at a time. Apply this change to `login` flow in `server/routers/auth.ts`. Ensure `logout` continues to remove the session token and clear the cookie.

---

### Ticket PERF-401: Account Creation Error

- **Reporter**: Support Team
- **Priority**: Critical
- **Description**: New accounts show $100 balance when DB operations fail.
- **Impact**: Incorrect balance displays.

**RCA**: The fallback for account creation was returning a default object with `balance = 100`.

**Solution**:

1. Update the account creation logic to handle database operation failures explicitly.
2. Ensure no default balance is set when the database operation fails.
3. Add error handling to notify the user of the failure.
4. Write unit tests to simulate database failures and verify the correct behavior.

---

### Ticket PERF-402: Logout Issues

**RCA**: The logout endpoint was implemented as a publicProcedure, allowing it to return success even when no authenticated session was present or when session invalidation failed.

**Solution**:

1. Change the logout endpoint to use protectedProcedure so the route requires a valid session context and cannot be invoked as a no-op by unauthenticated callers.
2. On logout, explicitly invalidate the server-side session store (or revoke the token) and clear any authentication cookies or client-side tokens.
3. Return an error if session invalidation fails instead of a success message.
4. Add unit/integration tests to:

- Verify protected access to the logout route.
- Confirm session is removed from the store and client auth artifacts are cleared.
- Simulate session-store failures and ensure a failure response is returned.

---

### Ticket PERF-403: Session Expiry

**RCA**: The server currently only sends a warning when less than a minute remains on a session. This allows near-expired sessions to be treated as valid up until the exact expiry instant, creating a narrow window where a session may still be accepted when it should be considered invalid.

**Solution**:

1. Update session validation in `server/trpc.ts` so sessions with 30 seconds or less remaining are treated as expired: delete the session from the store and set the request `user` to `null`.
2. Ensure context creation deletes sessions immediately when they are expired or considered near-expired so protected routes will receive an `UNAUTHORIZED` error.
3. Return an error for protected routes when session invalidation fails instead of silently reporting success.

---

### Ticket PERF-404: Transaction Sorting

**RCA**: Transaction queries did not include an explicit `ORDER BY` clause, so the database returned rows in a non-deterministic order which made the UI appear to show transactions in random order.

**Solution**:

1. Add an explicit `orderBy` clause to the server query that retrieves transactions (for example, order by `createdAt` descending to show newest first). Include a deterministic tie-breaker (e.g., `id`) to ensure stable ordering when timestamps are identical.
2. Update any client-side sorting or rendering code to respect the server ordering and avoid additional client-side shuffling.
3. Add tests: Unit tests for the transaction retrieval query to assert returned rows are ordered as expected.

---

### Ticket PERF-405: Missing Transactions

- **Reporter**: Multiple Users
- **Priority**: Critical
- **Description**: "Not all transactions appear in history after multiple funding events"
- **Impact**: Users cannot verify all their transactions

**RCA**: Transactions were sometimes served from a (stale/invalid) cache or the transaction list for a given account was not invalidated after funding events, so new transactions were not included in subsequent reads.

**Solution**:

1. Invalidate the transactions cache for the affected account after any funding or mutation that creates transactions (for example, after funding, transfer, or withdrawal mutations).
2. Ensure transactional writes (create funding and corresponding ledger entries) are committed before cache population.

---

### Ticket PERF-406: Balance Calculation

- **Reporter**: Finance Team
- **Priority**: Critical
- **Description**: "Account balances become incorrect after many transactions"
- **Impact**: Critical financial discrepancies

**RCA**: Transfer flows: when transferring from another account, no withdrawal transaction was being created, causing the ledger and balance to become inconsistent.

**Solution**:

1. Use tRPC utilities (invalidate queries) to invalidate the transactions and balance cache for the specific account after any mutation that affects the account (funding, withdrawal, transfer). This ensures subsequent reads fetch fresh data.
2. Update the transfer implementation to perform both a withdrawal from the source account and a deposit into the destination account within a single, atomic mutation (or database transaction) so both ledger entries exist.
  
---

### Ticket PERF-407: Performance Degradation

- **Reporter**: DevOps
- **Priority**: High
- **Description**: "System slows down when processing multiple transactions"
- **Impact**: Poor user experience during peak usage

**RCA**: SQLite's single-writer limitation creates a bottleneck when multiple users try to create transactions simultaneously.
**Solution**:

- Migrate to PostgreSQL or MySQL, which support:
  - Multiple concurrent writes (not just reads)
  - Connection pooling to handle many simultaneous users
  - Row-level locking instead of database-level locking
  - Better concurrency control through MVCC

**Result**: Multiple users can process transactions in parallel → Better performance → Improved user experience during peak usage.

---

**Ticket PERF-408: Resource Leak**

- **Reporter**: System Monitoring
- **Priority**: Critical
- **Description**: "Database connections remain open"
- **Impact**: System resource exhaustion

**RCA**: A connection object was added to a connections array that is never used, and connections are not closed on cleanup, causing resource leakage.

**Solution**:
  1. Remove the unused `connections` array from `lib/db/index.ts`.
  2. Ensure database connections are closed during application shutdown/cleanup (add a `close`/`dispose` method and call it from the process exit handler or framework shutdown hook).


### Template for Future Tickets

#### Ticket [ID]: [Title]

- **Reporter**: [Name]
- **Priority**: [Low/Medium/High]
- **Description**: [Brief description of the issue]
- **Steps to Reproduce**:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected**: [What should happen]
- **Actual**: [What actually happens]

**RCA**: [root cause]
**Solution**: [Proposed solution or fix]
