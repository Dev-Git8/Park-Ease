const paymentsService = require('./payments.service');

// No auth middleware on this route - the Razorpay signature check IS the auth.
const handleWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];

    if (!paymentsService.verifyWebhookSignature(req.body, signature)) {
        console.error('[Payments] Webhook signature verification failed');
        return res.status(400).json({ received: false });
    }

    let event;
    try {
        event = JSON.parse(req.body.toString('utf8'));
    } catch (err) {
        return res.status(400).json({ received: false });
    }

    try {
        switch (event.event) {
            case 'payment.captured': {
                const payment = event.payload.payment.entity;
                await paymentsService.confirmPayment(payment.order_id, payment.id);
                break;
            }
            case 'payment.failed': {
                const payment = event.payload.payment.entity;
                await paymentsService.failPayment(payment.order_id, payment.error_description || 'Payment failed');
                break;
            }
            case 'refund.processed': {
                await paymentsService.handleRefundProcessed(event.payload.refund.entity);
                break;
            }
            default:
                break;
        }
        res.status(200).json({ received: true });
    } catch (err) {
        console.error('[Payments] Webhook handler error:', err.message);
        res.status(500).json({ received: false });
    }
};

// Fast-path confirmation called by the frontend right after Razorpay's
// checkout succeeds. The webhook above is the durable fallback if this
// never fires (closed tab, dropped network).
const verifyPayment = async (req, res, next) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        if (!paymentsService.verifySignature(orderId, paymentId, signature)) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const owns = await paymentsService.userOwnsOrder(orderId, req.user.id);
        if (!owns) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await paymentsService.confirmPayment(orderId, paymentId);
        res.status(200).json({ success: true, message: 'Payment verified' });
    } catch (err) {
        next(err);
    }
};

// Lets the frontend open Razorpay Checkout when resuming a payment without
// a fresh order-creation response to read the key off of.
const getConfig = (req, res) => {
    res.status(200).json({ success: true, data: { keyId: process.env.RAZORPAY_KEY_ID } });
};

module.exports = { handleWebhook, verifyPayment, getConfig };
