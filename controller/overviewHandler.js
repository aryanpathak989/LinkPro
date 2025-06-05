const { Op, fn, col,literal } = require('sequelize');
const Url = require('../models/TableUrl');
const Tracking = require('../models/Tracking');

exports.getOverview = async (req, res) => {
  try {
    req.user.id = 1
    const filter = req.query.filter || '14days';

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
    const urlIds = allUrls.map(url => url.id);

    const allTrackings = await Tracking.findAll({
      attributes: ['ip', 'createdAt', 'deviceType'],
      where: {
        urlId: {
          [Op.in]: urlIds
        },
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

exports.getOverview2 = async (req,res)=>{
  const {filter = "7days"} = req.query
  const user_id = req.user.id
  console.log(user_id)
  
  const now = new Date()
  let currentEndDate = new Date()
  let currentStartDate = new Date()
  let previousStartDate = new Date()
  let weeklyStartDate = new Date()
  weeklyStartDate.setDate(now.getDate()-7)

  switch(filter){
    case "14days":
      currentStartDate.setDate(now.getDate()-14);
      previousStartDate.setDate(now.getDate()-28);
      break;
    case "1month":
      currentStartDate.setMonth(now.getMonth()-1);
      previousStartDate.setMonth(now.getMonth()-2);
      break;  
    case "3months":
      currentStartDate.setMonth(now.getMonth()-3);
      previousStartDate.setMonth(now.getMonth()-6);
      break;
    case "6months":
      currentStartDate.setMonth(now.getMonth()-6);
      previousStartDate.setMonth(now.getMonth()-12);
      break;
    case "1year":
      currentStartDate.setFullYear(now.getFullYear()-1);
      previousStartDate.setFullYear(now.getFullYear()-2);  
      break;
    default:
      currentStartDate.setDate(now.getDate()-7);
      previousStartDate.setDate(now.getDate()-14)   
  }


  // console.log(currentEndDate,previousStartDate)
  const urlData = await Url.findAll({
    where:{
        user_id,
        createdAt:{
          [Op.between]:[previousStartDate,currentEndDate]
        }
    },
    attributes:{exclude:['updatedAt','createdAt','expiryDate','actualUrl',,'user_id']},
    include:{
      model:Tracking,
      required:false,
      attributes:{exclude:['deviceVendor','reference','os','browser','deviceVendor','city','region','country','updatedAt']},
      where:{
        createdAt:{
          [Op.between]:[previousStartDate,currentEndDate]
        }
      },
      order: [['createdAt', 'DESC']]
    },
    order: [['createdAt', 'DESC']]
  })

  const currentUrlCreated = urlData.flatMap((item)=>{
    return item.id
  })

  const previousUrlCreated = urlData.flatMap((item)=>{
    return item.id
  })

  const previousTrack = urlData.flatMap((item)=>{
    return item.tbltrackings.filter((e)=>e.createdAt<currentStartDate)
  })

  const currentTrack = urlData.flatMap((item)=>{
    return item.tbltrackings.filter((e)=>e.createdAt>=currentStartDate)
  })

  const currentIptracking = currentTrack.flatMap((item)=> item.ip)

  const currentGroupByIp = new Set(currentIptracking.map((e)=>e))

  const previousIptracking = previousTrack.flatMap((item)=> item.ip)
  const previousGroupByIp = new Set(previousIptracking.map((e)=>e))
  
  
  //recentlink

  const urls = urlData.map((item)=>{
    const {tbltrackings,...urlInfo} = item.get({plain:true})
    const mp ={};
      if(tbltrackings && tbltrackings.length>0){
          tbltrackings.map((e)=>{
            const date = e.createdAt
            if(date<currentStartDate) return
            if(mp[date]){
              mp[date]++;
            }
            else{
              mp[date]=1
            }
          })
      }

      const dateArray = []
      let indiviualUrlClicks = 0
      
      for(const [key,value] of Object.entries(mp)){
        indiviualUrlClicks += value || 0
          dateArray.push(
            {
              data: new Date(key),
              clicks:value
            }
          )
      }
    return {...urlInfo,clicks:indiviualUrlClicks,chartData:dateArray}
  }).slice(0,4)

  //devicebreakdown
  const deviceBreakdown = {
    mobile:0,
    desktop:0,
    tablet:0  
  }

  const weekStartDte = weeklyStartDate

  //weeksly
  const weeklyMap={}

  currentTrack.map((item)=>{

    if(item.createdAt>=weekStartDte){
      const date = item.createdAt.toISOString().split('T')[0];
      console.log(date)
      if(weeklyMap[date]){
        weeklyMap[date]++
      }
      else{
        weeklyMap[date] = 1
      }
    }

    switch(item.deviceType){
      case "desktop":
        deviceBreakdown['desktop']++
        break;
      case 'mobile':
        deviceBreakdown['mobile']++
        break;
      case 'tablet':
        deviceBreakdown['tablet']++
        break;
      default:
        deviceBreakdown['other']++  
    }
  })

  const deviceBreakDownArray = [{device:'desktop',count:deviceBreakdown.desktop},{device:'mobile',count:deviceBreakdown.mobile},{device:'tablet',count:deviceBreakdown.tablet}]
  // weeklyclicks

  const weekData = []

  console.log("-------------------------")

  while (weekStartDte < currentEndDate) {
  const dateStr = weekStartDte.toISOString().split('T')[0];
  const clicks = weeklyMap[dateStr] || 0;
  console.log(dateStr,weeklyMap[dateStr])

  weekData.push({
    date: new Date(weekStartDte), // clone the date to preserve current value
    clicks,
  });

  weekStartDte.setDate(weekStartDte.getDate() + 1);
}



  //totallinks,totalclicks,activeuser,averageClicks.
  const totalLinks = currentUrlCreated?.length ?? 0
  const totalCicks = currentTrack?.length ?? 0
  const activeUsers = currentGroupByIp.size
  const previousTotalLinks = previousUrlCreated?.length ?? null
  const previousTotalClicks = previousTrack?.length ?? null
  const previousActiveUser = previousGroupByIp.size === 0? null:previousGroupByIp.size
  const averageClicks = isNaN(totalCicks/totalLinks)?0:(totalCicks/totalLinks)
  const averageClicksLabel = isNaN(averageClicks)?'Bad':(averageClicks < 100 ? "Bad" : (averageClicks < 250) ? "Average" : (averageClicks < 400 ? "Good" : "Excellent"))
  const totalLinkCutoff = previousTotalClicks?(((totalLinks-previousTotalLinks)/previousTotalLinks)*100).toFixed(2):null
  const totalClickCutoff = previousTotalClicks?(((totalCicks-previousTotalClicks)/previousTotalClicks)*100).toFixed(2):null
  const activeUserCutOff = previousActiveUser?(((activeUsers-previousActiveUser)/previousActiveUser)*100).toFixed(2):null

  // const activeUser


  res.status(200).send({success:true,data:{totalLinks,totalClicks:totalCicks,activeUser:activeUsers,ctr:averageClicks,ctrLabel:averageClicksLabel,totalLinkCutoff,totalClickCutoff,activeUserCutOff,urls,deviceBreakdown:deviceBreakDownArray,weeklyClicks:weekData,    change: {
      totalLinks: totalLinkCutoff, // as string percentage e.g., "300.00"
      totalClicks: totalClickCutoff,
      activeUser: activeUserCutOff
    }}})
}


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
    const { urlId } = req.query;
    console.log(urlId)
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday of this week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7); // Sunday of last week
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

   const url = await Url.findOne({
        where: { id: urlId },
        attributes: [
          'id', 'user_id', 'name', 'shortUrl', 'actualUrl', 'expiryDate', 'createdAt', 'updatedAt',
          [fn('COUNT', col('tbltrackings.id')), 'trackingCount']
        ],
        include: [
          {
            model: Tracking,
            required: false,
            attributes: []
          }
        ],
        group: ['tblurl.id']
      });


    if (!url) {
      return res.status(404).json({ success: false, message: "URL not found" });
    }

    const thisMonthTracking = await Tracking.findAll({
      attributes:['createdAt'],
      where: {
        urlId: urlId,
        createdAt: {
          [Op.gte]: startOfMonth,
        },
      },
    });

const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

const thisWeekValue = thisMonthTracking.filter(
  (item) => item.createdAt >= sevenDaysAgo
);

const lastWeekValue = thisMonthTracking.filter(
  (item) => item.createdAt < sevenDaysAgo && item.createdAt >= fourteenDaysAgo
);

    let percentageChange ;
    if(lastWeekValue.length == 0){ percentageChange  = null}
    else{
     percentageChange =  ((thisWeekValue.length - lastWeekValue.length) / lastWeekValue.length) * 100
    }

    const urlData = url.toJSON()
const todayClick = thisMonthTracking.filter(
  (item) => item.createdAt >= new Date(now - 24 * 60 * 60 * 1000)
);

    res.json({
      success: true,
      data:{
        ...urlData, 
        cutoff:percentageChange,
        monthClicks:thisMonthTracking.length,
        weeklyClick:thisWeekValue.length,
        todayClick:todayClick.length
      }
    });
  } catch (err) {
    console.error("Error in getUrlAnalyticsById:", err);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};  