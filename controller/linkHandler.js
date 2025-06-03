const { where, DATE, Op, fn, col } = require("sequelize")
const Url = require("../models/TableUrl")
const tracking = require('../models/Tracking')
const redis = require('../lib/redis');
const Tracking = require("../models/Tracking");


exports.getLinkClickPerformance = async (req, res) => {
    let { urlId, period } = req.query;

    if (!urlId) return res.status(400).json({ msg: "Url id is required" });

    let filterValue = period || "7days";

    // Get current date
    const now = new Date();
    let startDate;

    switch (filterValue) {
        case "1year":
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        case "6months":
            startDate = new Date(now.setMonth(now.getMonth() - 6));
            break;
        case "3months":
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case "1month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case "14days":
            startDate = new Date(now.setDate(now.getDate() - 14));
            break;
        default: // "7days"
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
    }

    // Fetch clicks grouped by date
    const urltracking = await Tracking.findAll({
        attributes: [
            [fn('DATE', col('createdAt')), 'date'],
            [fn('COUNT', '*'), 'count']
        ],
        where: {
            urlId,
            createdAt: {
                [Op.gte]: startDate
            }
        },
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']]
    });

    const performance = urltracking.map(entry => ({
        date: entry.getDataValue('date'),
        count: parseInt(entry.getDataValue('count'), 10)
    }));

    // Calculate average and peak clicks
    const totalClicks = performance.reduce((sum, day) => sum + day.count, 0);
    const daysCount = performance.length || 1; // avoid division by zero
    const averageClicks = totalClicks / daysCount;
    const peakClicks = performance.length ? Math.max(...performance.map(d => d.count)) : 0;

    res.status(200).json({
        performance,
        averageClicks: Number(averageClicks.toFixed(2)),
        peakClicks
    });
};

exports.getLinkDeviceBreakDown = async (req, res) => {

    let { urlId, period } = req.query;

    if (!urlId) return res.status(400).json({ msg: "Url id is required" });

    const filter = period || "7days";

    // Get current date
    let now = new Date();
    let startDate;

    switch (filter) {
        case "1year":
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        case "6months":
            startDate = new Date(now.setMonth(now.getMonth() - 6));
            break;
        case "3months":
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case "1month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case "14days":
            startDate = new Date(now.setDate(now.getDate() - 14));
            break;
        default: // "7days"
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
    }


    const deviceData = await Tracking.findAll({
        attributes: [
            'deviceType',
            [fn('COUNT', '*'), 'count']
        ],
        where: {
            urlId,
            createdAt: {
                [Op.gte]: startDate
            }
        },
        group: ['deviceType']
    });

    // Create a result map with default 0s
    const result = {
        mobile: { count: 0, percentage: 0 },
        desktop: { count: 0, percentage: 0 },
        tablet: { count: 0, percentage: 0 }
    };

    let totalCount = 0;

    deviceData.forEach(entry => {
        const type = entry.getDataValue('deviceType');
        const count = parseInt(entry.getDataValue('count'));
        if (result[type] !== undefined) {
            result[type].count = count;
            totalCount += count;
        }
    });

    // Calculate percentage
    for (const type in result) {
        if (totalCount > 0) {
            result[type].percentage = parseFloat(((result[type].count / totalCount) * 100).toFixed(2));
        }
    }

    res.status(200).json(result);

}


exports.getLinkReferencePerformance = async (req, res) => {
    let { urlId, period } = req.query;

    if (!urlId) return res.status(400).json({ msg: "Url id is required" });

    const filterValue = period || "7days";
    const now = new Date();
    let startDate;

    switch (filterValue) {
        case "1year":
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        case "6months":
            startDate = new Date(now.setMonth(now.getMonth() - 6));
            break;
        case "3months":
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case "1month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case "14days":
            startDate = new Date(now.setDate(now.getDate() - 14));
            break;
        default: // "7days"
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
    }

    // Get counts grouped by reference
    const rawStats = await Tracking.findAll({
        attributes: [
            'reference',
            [fn('COUNT', '*'), 'clicks']
        ],
        where: {
            urlId,
            createdAt: { [Op.gte]: startDate }
        },
        group: ['reference']
    });

    const knownReferences = ['facebook', 'youtube', 'google', 'snapchat', 'others'];
    const statsMap = {};
    let totalClicks = 0;

    // Fill stats from DB
    rawStats.forEach(entry => {
        const ref = entry.getDataValue('reference') || 'others';
        const clicks = parseInt(entry.getDataValue('clicks'), 10);
        statsMap[ref] = clicks;
        totalClicks += clicks;
    });

    // Build the final list with 0-fill for missing references
    const referenceStats = knownReferences.map(ref => {
        const clicks = statsMap[ref] || 0;
        const percentage = totalClicks === 0 ? 0 : ((clicks / totalClicks) * 100);
        return {
            reference: ref,
            clicks,
            percentage: parseFloat(percentage.toFixed(2))
        };
    });

    res.status(200).json({
        totalClicks,
        referenceStats
    });
}


exports.getLinkClicksByCountry = async (req, res) => {
    let { urlId, period } = req.query;

    if (!urlId) return res.status(400).json({ msg: "Url id is required" });

    const filter = period || "7days";

    let startDate;
    const now = new Date();
    switch (filter) {
        case "1year":
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        case "6months":
            startDate = new Date(now.setMonth(now.getMonth() - 6));
            break;
        case "3months":
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case "1month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case "14days":
            startDate = new Date(now.setDate(now.getDate() - 14));
            break;
        default:
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
    }

    try {
        // Group by country
        const trackingData = await Tracking.findAll({
            attributes: [
                'country',
                [fn('COUNT', '*'), 'clicks']
            ],
            where: {
                urlId,
                createdAt: { [Op.gte]: startDate }
            },
            group: ['country'],
            order: [[fn('COUNT', '*'), 'DESC']]
        });

        // Calculate total clicks
        const totalClicks = trackingData.reduce((sum, entry) => sum + parseInt(entry.getDataValue('clicks')), 0);

        // Prepare response
        const result = trackingData.map(entry => {
            const clicks = parseInt(entry.getDataValue('clicks'));
            const country = entry.getDataValue('country') || 'Unknown';
            const percentage = totalClicks ? ((clicks / totalClicks) * 100).toFixed(2) : "0.00";

            return { country, clicks, percentage: parseFloat(percentage) };
        });

        res.status(200).json({
            totalClicks,
            countries: result
        });

    } catch (err) {
        console.error("Error in country clicks endpoint:", err);
        res.status(500).json({ msg: "Internal server error" });
    }
};;



