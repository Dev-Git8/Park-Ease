// Single source of truth for every dollar figure in the app: booking
// price, the Razorpay order amount, and the overdue penalty. Keeping this
// in one file means the manual-terminate and auto-terminate paths can
// never compute a penalty differently.

const OVERDUE_PENALTY_MULTIPLIER = parseFloat(process.env.OVERDUE_PENALTY_MULTIPLIER || '1.5');

const round2 = (n) => Math.round(n * 100) / 100;

const computeBookingPrice = (pricePerHour, startTime, endTime) => {
    const hourlyRate = parseFloat(pricePerHour);
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return round2(hourlyRate * durationHours);
};

const toPaise = (amount) => Math.round(parseFloat(amount) * 100);

const computeOverduePenalty = (pricePerHour, endTime, now = new Date()) => {
    const end = new Date(endTime);
    if (now <= end) return 0;

    const diffMs = now - end;
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    const penaltyHourlyRate = parseFloat(pricePerHour) * OVERDUE_PENALTY_MULTIPLIER;
    return round2((diffMins / 60) * penaltyHourlyRate);
};

module.exports = {
    computeBookingPrice,
    toPaise,
    computeOverduePenalty,
};
