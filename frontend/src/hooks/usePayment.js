import { useState } from 'react';
import api from '../api/api';
import { openRazorpayCheckout } from '../utils/razorpay';

// Shared by every payment call site (new booking, resuming an abandoned
// booking payment, paying an overstay penalty) so the checkout-then-verify
// sequence and its error handling only exist in one place.
const usePayment = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const pay = async (order, { description, prefill } = {}) => {
        setError('');
        setIsProcessing(true);
        try {
            const { orderId, paymentId, signature } = await openRazorpayCheckout({
                order,
                description,
                prefill,
                theme: { color: '#2563c9' },
            });

            await api.post('/payments/verify', { orderId, paymentId, signature });
            return true;
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Payment failed');
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    return { pay, isProcessing, error, setError };
};

export default usePayment;
