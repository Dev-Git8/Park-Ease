let scriptPromise = null;

const loadRazorpayScript = () => {
    if (window.Razorpay) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error('Failed to load the Razorpay checkout script'));
        };
        document.body.appendChild(script);
    });

    return scriptPromise;
};

// Opens Razorpay's own hosted payment modal - there is no custom card form
// to build or maintain here. Resolves with the three values Razorpay hands
// back on success, which the caller must send to POST /payments/verify.
export const openRazorpayCheckout = async ({ order, description, prefill, theme }) => {
    await loadRazorpayScript();

    return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.orderId,
            name: 'ParkEase',
            description,
            prefill,
            theme,
            handler: (response) => {
                resolve({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                });
            },
            modal: {
                ondismiss: () => reject(new Error('Payment cancelled')),
            },
        });
        rzp.open();
    });
};
