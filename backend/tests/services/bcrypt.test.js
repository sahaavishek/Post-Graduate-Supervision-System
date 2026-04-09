/**
 * Bcrypt Utility Tests
 * Tests for password hashing functionality
 */

const bcrypt = require('bcryptjs');

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(50);
  });

  it('should verify a correct password', async () => {
    const password = 'testPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const password = 'testPassword123';
    const wrongPassword = 'wrongPassword';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
    expect(isValid).toBe(false);
  });

  it('should produce different hashes for the same password', async () => {
    const password = 'testPassword123';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    
    // Bcrypt includes a salt, so same password should produce different hashes
    expect(hash1).not.toBe(hash2);
    
    // But both should verify correctly
    const isValid1 = await bcrypt.compare(password, hash1);
    const isValid2 = await bcrypt.compare(password, hash2);
    expect(isValid1).toBe(true);
    expect(isValid2).toBe(true);
  });
});

