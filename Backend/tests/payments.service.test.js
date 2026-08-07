process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';

const crypto = require('crypto');
const prisma = require('../src/config/prisma');
const paymentsService = require('../src/modules/payments/payments.service');

afterAll(async () => {
    await prisma.$disconnect();
});

describe('verifySignature - Razorpay checkout callback verification', () => {
    it('accepts a signature computed the same way Razorpay computes it', () => {
        const orderId = 'order_abc123';
        const paymentId = 'pay_xyz789';
        const signature = crypto
            .createHmac('sha256', 'test_key_secret')
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        expect(paymentsService.verifySignature(orderId, paymentId, signature)).toBe(true);
    });

    it('rejects a signature computed with the wrong secret', () => {
        const orderId = 'order_abc123';
        const paymentId = 'pay_xyz789';
        const signature = crypto
            .createHmac('sha256', 'wrong_secret')
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        expect(paymentsService.verifySignature(orderId, paymentId, signature)).toBe(false);
    });

    it('rejects a missing signature without throwing', () => {
        expect(paymentsService.verifySignature('order_abc123', 'pay_xyz789', undefined)).toBe(false);
    });
});

describe('verifyWebhookSignature - Razorpay webhook verification', () => {
    it('accepts a signature computed over the exact raw body', () => {
        const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
        const signature = crypto
            .createHmac('sha256', 'test_webhook_secret')
            .update(rawBody)
            .digest('hex');

        expect(paymentsService.verifyWebhookSignature(rawBody, signature)).toBe(true);
    });

    it('rejects a body that does not match the signature', () => {
        const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
        const tamperedBody = Buffer.from(JSON.stringify({ event: 'payment.failed' }));
        const signature = crypto
            .createHmac('sha256', 'test_webhook_secret')
            .update(rawBody)
            .digest('hex');

        expect(paymentsService.verifyWebhookSignature(tamperedBody, signature)).toBe(false);
    });
});
