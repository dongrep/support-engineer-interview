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

### Ticket PERF-403: Session Expiry

- **Reporter**: Security Team
- **Priority**: High
- **Description**: "Expiring sessions still considered valid until exact expiry time"
- **Impact**: Security risk near session expiration

**RCA**: The server currently only sends a warning when less than a minute remains on a session. This allows near-expired sessions to be treated as valid up until the exact expiry instant, creating a narrow window where a session may still be accepted when it should be considered invalid.

**Solution**:

1. Update session validation in `server/trpc.ts` so sessions with 30 seconds or less remaining are treated as expired: delete the session from the store and set the request `user` to `null`.
2. Ensure context creation deletes sessions immediately when they are expired or considered near-expired so protected routes will receive an `UNAUTHORIZED` error.
3. Return an error for protected routes when session invalidation fails instead of silently reporting success.
4. Add unit/integration tests to:
  - Simulate sessions with >30s remaining (should be valid).
  - Simulate sessions with <=30s remaining (should be deleted and the user treated as unauthenticated).
  - Simulate DB delete failures and verify error handling/logging.

---


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
