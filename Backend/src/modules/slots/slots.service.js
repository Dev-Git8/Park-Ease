const prisma = require('../../config/prisma');
const { redisClient, isRedisConnected } = require('../../config/redis');
const { emitSlotsUpdated, invalidateSlotsCache } = require('../../utils/realtime.utils');

const createSlots = async (businessId, slots) => {
    // slots is an array of slot numbers e.g. ['A1', 'A2']
    const createdSlots = [];

    await prisma.$transaction(async (tx) => {
        for (const slotNumber of slots) {
            try {
                const slot = await tx.slot.create({
                    data: {
                        businessId: parseInt(businessId),
                        slotNumber,
                        status: 'available',
                    },
                });
                createdSlots.push(slot);
            } catch (err) {
                // Ignore duplicates (P2002 is Prisma's unique constraint error code)
                if (err.code !== 'P2002') throw err;
            }
        }
    });

    if (createdSlots.length > 0) {
        await invalidateSlotsCache(businessId);
        emitSlotsUpdated(businessId);
    }

    return createdSlots;
};

const getSlotsByBusiness = async (businessId) => {
    if (isRedisConnected()) {
        try {
            const cachedSlots = await redisClient.get(`slots:${businessId}`);
            if (cachedSlots) {
                return JSON.parse(cachedSlots);
            }
        } catch (err) {
            console.error('Redis GET Error:', err);
        }
    }

    const rows = await prisma.slot.findMany({
        where: { businessId: parseInt(businessId) },
        orderBy: [
            { slotNumber: 'asc' } // Prisma sorting is slightly different than SQL LENGTH, but 'asc' is a good start
        ],
    });

    // Custom sort to match SQL "ORDER BY LENGTH(slot_number), slot_number"
    const sortedRows = rows.sort((a, b) => 
        a.slotNumber.length - b.slotNumber.length || a.slotNumber.localeCompare(b.slotNumber)
    );

    if (isRedisConnected()) {
        try {
            await redisClient.setEx(`slots:${businessId}`, 3600, JSON.stringify(sortedRows));
        } catch (err) {
            console.error('Redis SET Error:', err);
        }
    }

    return sortedRows;
};

const updateSlotStatus = async (slotId, status) => {
    const updatedSlot = await prisma.slot.update({
        where: { id: parseInt(slotId) },
        data: { status },
    });
    
    if (updatedSlot) {
        await invalidateSlotsCache(updatedSlot.businessId);
        emitSlotsUpdated(updatedSlot.businessId);
    }

    return updatedSlot;
};

const deleteSlot = async (slotId, ownerId) => {
    const slot = await prisma.slot.findUnique({
        where: { id: parseInt(slotId) },
        include: {
            business: true,
            bookings: {
                where: {
                    status: { in: ['pending_payment', 'booked', 'overdue'] }
                }
            }
        }
    });

    if (!slot) {
        throw new Error('Slot not found');
    }

    if (slot.business.ownerId !== parseInt(ownerId)) {
        throw new Error('Unauthorized to delete this slot');
    }

    if (slot.status === 'occupied' || slot.status === 'held') {
        throw new Error('Cannot delete an occupied slot');
    }

    if (slot.bookings.length > 0) {
        throw new Error('Slot has an active booking and cannot be deleted');
    }

    const deletedSlot = await prisma.slot.delete({
        where: { id: parseInt(slotId) },
    });

    if (deletedSlot) {
        await invalidateSlotsCache(deletedSlot.businessId);
        emitSlotsUpdated(deletedSlot.businessId);
    }

    return true;
};

module.exports = {
    createSlots,
    getSlotsByBusiness,
    updateSlotStatus,
    deleteSlot
};
