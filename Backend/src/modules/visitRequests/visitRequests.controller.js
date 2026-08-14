const visitRequestsService = require('./visitRequests.service');

const createVisitRequest = async (req, res, next) => {
    try {
        const { name, email, message } = req.body;
        const visitRequest = await visitRequestsService.createVisitRequest(name, email, message);
        res.status(201).json({ success: true, message: 'Visit request received', data: visitRequest });
    } catch (error) {
        next(error);
    }
};

const listVisitRequests = async (req, res, next) => {
    try {
        const requests = await visitRequestsService.getAllVisitRequests();
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const { visitRequest, emailDelivered } = await visitRequestsService.updateVisitRequestStatus(id, status);
        res.status(200).json({
            success: true,
            message: `Visit request ${status}`,
            data: visitRequest,
            emailDelivered,
        });
    } catch (error) {
        if (error.isOperational) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = { createVisitRequest, listVisitRequests, updateStatus };
