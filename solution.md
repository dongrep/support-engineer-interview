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
  - 
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

**Solution**: [Proposed solution or fix]
