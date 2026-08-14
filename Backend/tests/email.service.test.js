jest.mock('../src/config/mailer', () => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
}));

const mailer = require('../src/config/mailer');
const emailService = require('../src/services/email.service');

describe('email.service', () => {
    beforeEach(() => jest.clearAllMocks());

    it('sends a rejection email addressed to the requester with their name in the body', async () => {
        await emailService.sendVisitRejectedEmail('jamie@example.com', 'Jamie Fox');

        expect(mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'jamie@example.com',
            subject: expect.stringContaining('listing request'),
            html: expect.stringContaining('Jamie Fox'),
        }));
    });

    it('sends an "existing account" approval email without a token link', async () => {
        await emailService.sendVisitApprovedExistingAccountEmail('jamie@example.com', 'Jamie Fox');

        expect(mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'jamie@example.com',
            html: expect.stringContaining('log in'),
        }));
    });

    it('sends a "new account" approval email containing the set-password link', async () => {
        const url = 'http://localhost:5173/set-password?token=rawtoken123';
        await emailService.sendVisitApprovedNewAccountEmail('jamie@example.com', 'Jamie Fox', url);

        expect(mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'jamie@example.com',
            html: expect.stringContaining(url),
        }));
    });
});
