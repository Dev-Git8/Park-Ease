const { hashToken } = require('../src/utils/token.utils');

describe('hashToken', () => {
    it('produces the same hash for the same input', () => {
        expect(hashToken('abc123')).toBe(hashToken('abc123'));
    });

    it('produces different hashes for different inputs', () => {
        expect(hashToken('abc123')).not.toBe(hashToken('abc124'));
    });

    it('produces a 64-character hex string (sha256)', () => {
        expect(hashToken('anything')).toMatch(/^[0-9a-f]{64}$/);
    });
});
