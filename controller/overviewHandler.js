const { Op, fn, col,literal } = require('sequelize');
const Url = require('../models/TableUrl');
const Tracking = require('../models/Tracking');

exports.getOverview = async (req, res) => {
  try {
    req.user.id = 1
    const filter = req.query.filter || '7days';

    const now = new Date();
    const currentEnd = new Date();
    let currentStart = new Date();
    let previousStart = new Date();
    let previousEnd = new Date();
    let weekEndDate = new Date()
    weekEndDate.setDate(now.getDate()-7)

    switch (filter) {
      case '7days':
        currentStart.setDate(now.getDate() - 7);
        previousEnd.setDate(now.getDate() - 7);
        previousStart.setDate(now.getDate() - 14);
        break;
      case '14days':
        currentStart.setDate(now.getDate() - 14);
        previousEnd.setDate(now.getDate() - 14);
        previousStart.setDate(now.getDate() - 28);
        break;
      case '1month':
        currentStart.setMonth(now.getMonth() - 1);
        previousEnd.setMonth(now.getMonth() - 1);
        previousStart.setMonth(now.getMonth() - 2);
        break;
      case '3months':
        currentStart.setMonth(now.getMonth() - 3);
        previousEnd.setMonth(now.getMonth() - 3);
        previousStart.setMonth(now.getMonth() - 6);
        break;
      case '6months':
        currentStart.setMonth(now.getMonth() - 6);
        previousEnd.setMonth(now.getMonth() - 6);
        previousStart.setMonth(now.getMonth() - 12);
        break;
      default:
        currentStart.setFullYear(now.getFullYear() - 1);
        previousEnd.setFullYear(now.getFullYear() - 1);
        previousStart.setFullYear(now.getFullYear() - 2);
    }


    // DB Call 1: Get all URLs (with trackings) from previousStart to now
    const allUrls = await Url.findAll({
      where: {
        user_id: req.user.id,
        createdAt: {
          [Op.gte]: previousStart,
          [Op.lt]: currentEnd
        }
      },
      order: [['createdAt', 'DESC']],
      include: [{ model: Tracking, attributes: ['id', 'createdAt', 'ip'] }]
    });

    // DB Call 2: All tracking entries for both periods
    const allTrackings = await Tracking.findAll({
      attributes: ['ip', 'createdAt', 'deviceType'],
      where: {
        createdAt: {
          [Op.gte]: previousStart,
          [Op.lt]: currentEnd
        }
      },
      raw: true
    });

    const formattedUrls = [];
    let totalClicks = 0;
    let totalLinks = 0;
    let prevClicks = 0;
    let prevLinks = 0;

    allUrls.forEach((url) => {
      const created = new Date(url.createdAt);
      const isCurrent = created >= currentStart && created < currentEnd;

      const trackingCount = url.tbltrackings?.filter(t => {
        const tDate = new Date(t.createdAt);
        return tDate >= currentStart && tDate < currentEnd;
      }).length || 0;


      if (isCurrent) {
        totalLinks++;
        totalClicks += trackingCount;

const chartStart = new Date(currentStart);
chartStart.setHours(0, 0, 0, 0);

const dateWiseClicks = [];
let currentDate = new Date(currentStart);

while (currentDate <= currentEnd) {
  const dateStr = currentDate.toISOString().split('T')[0];
  dateWiseClicks.push({ date: dateStr, clicks: 0 });

  currentDate.setDate(currentDate.getDate() + 1);
  currentDate.setHours(0, 0, 0, 0); // normalize after date increment
}

url.tbltrackings?.forEach(t => {
  const tDate = new Date(t.createdAt);
  tDate.setHours(0, 0, 0, 0);
  if (tDate >= currentStart && tDate < currentEnd) {
    const daysDiff = Math.floor((tDate - chartStart) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff < dateWiseClicks.length) {
      dateWiseClicks[daysDiff].clicks++;
    }
  }
});

formattedUrls.push({
  id: url.id,
  name: url.name,
  shortUrl: url.shortUrl,
  actualUrl: url.actualUrl,
  createdAt: url.createdAt,
  expiryDate: url.expiryDate,
  clicks: trackingCount,
  isExpired: url.expiryDate ? new Date(url.expiryDate) < new Date() : false,
  chartData: dateWiseClicks
});
      } else {
        prevLinks++;
        const prevClickCount = url.tbltrackings?.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= previousStart && tDate < previousEnd;
        }).length || 0;
        prevClicks += prevClickCount;
      }
    });

    const currentIps = new Set();
    const previousIps = new Set();

    allTrackings.forEach(t => {
      const ts = new Date(t.createdAt);
      if (ts >= currentStart && ts < currentEnd) currentIps.add(t.ip);
      else if (ts >= previousStart && ts < previousEnd) previousIps.add(t.ip);
    });

    const getPercentChange = (current, previous) => {
      if (previous === 0 && current === 0) return 0;
      if (previous === 0) return null;
      return (((current - previous) / previous) * 100).toFixed(2);
    };

        const clickThroughRate = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : 0;

    // Calculate weekly clicks for last 7 days
    const weeklyClicks = Array(7).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allTrackings.forEach(tracking => {
      const trackingDate = new Date(tracking.createdAt);
      trackingDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - trackingDate) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        weeklyClicks[6 - daysDiff]++;
      }
    });

    // Calculate device breakdown for the selected period
    const deviceBreakdown = {};
    allTrackings.forEach(tracking => {
      const trackingDate = new Date(tracking.createdAt);
      if (trackingDate >= currentStart && trackingDate < currentEnd) {
        const deviceType = tracking.deviceType || 'Unknown';
        deviceBreakdown[deviceType] = (deviceBreakdown[deviceType] || 0) + 1;
      }
    });

    // Convert device breakdown to array format
    const deviceBreakdownArray = Object.entries(deviceBreakdown).map(([device, count]) => ({
      device,
      count
    }));

    res.status(200).json({
      success: true,
      data: {
        totalLinks,
        totalClicks,
        ctr: clickThroughRate,
          ctrLabel: clickThroughRate < 1.0 ? "Bad" : (clickThroughRate < 2.5) ? "Average" : (clickThroughRate < 4.0 ? "Good" : "Excellent"),
        activeUser: currentIps.size,
        urls: formattedUrls.slice(0, 4),
        weeklyClicks: weeklyClicks.map((clicks, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - index));
          return {
            date: date.toISOString().split('T')[0],
            clicks
          };
        }),
        deviceBreakdown: deviceBreakdownArray,
        change: {
          totalLinks: getPercentChange(totalLinks, prevLinks),
          totalClicks: getPercentChange(totalClicks, prevClicks),
          activeUser: getPercentChange(currentIps.size, previousIps.size)
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
        const limit = parseInt(req.query.limit) || 9;
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
            distinct: true,
            include: [{
                model: Tracking,
                attributes: ['id']
            }]
        });

        console.log(urls)

        // Calculate total pages
        const totalPages = Math.ceil(count / limit);

        // Format the response
        const formattedUrls = urls.map(url => ({
            id: url.id,
            name:url.name,
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



exports.getUrlAnalyticsById = async (req, res) => {
  try {
    const { urlId,filter } = req.query;
    console.log(urlId)
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday of this week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7); // Sunday of last week

const url = await Url.findOne({
  where: { id: urlId },
  attributes: { exclude: ['updatedAt'] }, // Correct use of exclude
  include: [
    {
      model: Tracking,
      required: true,
      attributes: ['id'], // Only fetch the 'id' field from Tracking
    },
  ],
});

    if (!url) {
      return res.status(404).json({ success: false, message: "URL not found" });
    }

    // const thisWeek = parseInt(url.thisWeekClicks || 0);
    // const lastWeek = parseInt(url.lastWeekClicks || 0);
    // let weeklyChange = 0;

    // if (lastWeek > 0) {
    //   weeklyChange = ((thisWeek - lastWeek) / lastWeek) * 100;
    // } else if (thisWeek > 0) {
    //   weeklyChange = 100;
    // }

    res.json({
      success: true,
      data: url,
    });
  } catch (err) {
    console.error("Error in getUrlAnalyticsById:", err);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};