const { Op } = require('sequelize');
const Url = require('../models/TableUrl');
const Tracking = require('../models/Tracking');

exports.getOverview = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const filter = req.query.filter || 'all';

        // Calculate date range based on filter
        let dateRange;
        const now = new Date();
        switch (filter) {
            case '7days':
                dateRange = new Date(now.setDate(now.getDate() - 7));
                break;
            case '14days':
                dateRange = new Date(now.setDate(now.getDate() - 14));
                break;
            case '1month':
                dateRange = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case '3months':
                dateRange = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case '6months':
                dateRange = new Date(now.setMonth(now.getMonth() - 6));
                break;
            case '1year':
                dateRange = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                dateRange = new Date(0); // Beginning of time
        }

        // Get URLs with pagination and filter
        const { count, rows: urls } = await Url.findAndCountAll({
            where: {
                user_id: req.user.id,
                createdAt: {
                    [Op.gte]: dateRange
                }
            },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [{
                model: Tracking,
                attributes: ['id']
            }]
        });

        // Calculate total pages
        const totalPages = Math.ceil(count / limit);

        // Format the response
        const formattedUrls = urls.map(url => ({
            id: url.id,
            shortUrl: url.shortUrl,
            actualUrl: url.actualUrl,
            createdAt: url.createdAt,
            expiryDate: url.expiryDate,
            clicks: url.tbltrackings.length,
            isExpired: url.expiryDate ? new Date(url.expiryDate) < new Date() : false
        }));

        res.status(200).json({
            success: true,
            data: {
                urls: formattedUrls,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });

    } catch (err) {
        console.error('Overview error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.listUrls = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        // Build the where clause
        const whereClause = {
            user_id: req.user.id
        };

        // Add search condition if search term is provided
        if (search) {
            whereClause[Op.or] = [
                { shortUrl: { [Op.like]: `%${search}%` } },
                { actualUrl: { [Op.like]: `%${search}%` } }
            ];
        }

        // Get URLs with pagination
        const { count, rows: urls } = await Url.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [{
                model: Tracking,
                attributes: ['id']
            }]
        });

        // Calculate total pages
        const totalPages = Math.ceil(count / limit);

        // Format the response
        const formattedUrls = urls.map(url => ({
            id: url.id,
            shortUrl: url.shortUrl,
            actualUrl: url.actualUrl,
            createdAt: url.createdAt,
            expiryDate: url.expiryDate,
            clicks: url.tbltrackings.length,
            isExpired: url.expiryDate ? new Date(url.expiryDate) < new Date() : false,
            shortUrlFull: `${process.env.BASE_URL}${url.shortUrl}`
        }));

        res.status(200).json({
            success: true,
            data: {
                urls: formattedUrls,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });

    } catch (err) {
        console.error('List URLs error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}; 