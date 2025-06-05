const maxmind = require('maxmind');
const path = require('path');
const Tracking = require('./models/Tracking');
const { url } = require('inspector');


const dbPath = path.join(
  'C:',
  'Users',
  'Aryan',
  'Downloads',
  'GeoLite2-City_20250603',
  'GeoLite2-City_20250603',
  'GeoLite2-City.mmdb'
);

exports.trackUserDetails = async (userDetails) => {
  const urlId = userDetails?.urlId;
  const ip = userDetails?.ip ?? null;
  const referrence = userDetails?.referrence ?? 'others';
  const browser = userDetails?.browser ?? 'others';
  const os = userDetails?.os ?? 'others';
  const deviceType = userDetails?.deviceType ?? 'others';

  // Get IP details
  const geo = lookup.get(ip);

  const city = geo?.city?.names?.en || null;
  const region = geo?.subdivisions?.[0]?.iso_code || null;
  const country = geo?.country?.iso_code || null;

  // Log all details with their property names
  console.log({
    urlId: urlId,
    ip: ip,
    referrence: referrence,
    browser: browser,
    os: os,
    deviceType: deviceType,
    geo: {
      city: city,
      region: region,
      country: country
    }
  });
};




// (async () => {

//   try {
//     const lookup = await maxmind.open(dbPath);

//     const ipData = await Tracking.findAll({
//       where: {
//         ip: '151.86.234.148'
//       }
//     });

//     for (const item of ipData) {
//       const ip = item.ip?.trim();
//       if (!ip) continue;

//       const geo = lookup.get(ip);
//       console.log(geo)

      const city = geo?.city?.names?.en || null;
      const region = geo?.subdivisions?.[0]?.iso_code || null;
      const country = geo?.country?.iso_code || null;

//       // await Tracking.update(
//       //   { city, region, country },
//       //   { where: { id: item.id } }
//       // );
//     }

//     console.log('✅ All records updated one by one.');
//   } catch (err) {
//     console.error('❌ Error during geo update:', err);
//   }
// })();
