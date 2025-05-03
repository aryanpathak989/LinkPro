const { where } = require("sequelize")
const Url = require("../models/TableUrl")
const tracking = require('../models/Tracking')
// const redis = require('../lib/redis')

const UAParser = require('ua-parser-js');
const fetch = require('node-fetch'); // adjust path if needed
const Tracking = require("../models/Tracking");
const chMap = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

exports.urlShortner = async (req, res) => {
    try {
        const { url } = req.body;

        // Generate short URL
        let num = await Url.max("id") + 1;
        let temp = "";
        while (num > 0) {
            let ind = parseInt(num % 62);
            num = Math.floor(num / 62);
            temp += chMap[ind];
        }

        // User Agent Info
        const parser = new UAParser(req.headers['user-agent']);
        console.log()
        const uaResult = parser.getResult();

        const browser = uaResult.browser.name + ' ' + uaResult.browser.version;
        const os = uaResult.os.name + ' ' + uaResult.os.version;
        const deviceType = uaResult.device.type || 'desktop';
        const deviceModel = uaResult.device.model || 'unknown';
        const deviceVendor = uaResult.device.vendor || 'unknown';
        const emailClient = 'Not detectable in server request';

        // Get client IP (supports proxy environments)
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
        console.log(ip)
        // Get location using IP
        let location = ip
        try {
            const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
            location = await geoRes.json();
        } catch (err) {
            console.warn('Location fetch failed:', err.message);
        }

        // Optional: store or log tracking info
        console.log({
            browser,
            os,
            deviceType,
            deviceModel,
            deviceVendor,
            ip,
            location,
            emailClient
        });

        // Save short URL
        await Url.create({
            urlId: temp,
            actualUrl: url
        });

        res.status(200).json({ success: true, data: 'http://localhost:4000/' + temp });
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
};
 // Adjust as per your redis setup

exports.getActualUrl = async (req, res) => {
    try {
        const actualUrl = req.params.url;

        // 1. Check Redis cache
        const cached = await redis.get(actualUrl);
        if (cached) {
            console.log("Getting url from cached server");
            res.redirect(cached);

            // Run tracking in background
            trackUser(req, actualUrl);
            return;
        }

        // 2. Fallback to DB
        const url = await Url.findOne({ where: { urlId: actualUrl } });
        if (!url) return res.status(200).send("Url not found");

        // 3. Cache result
        await redis.set(actualUrl, url.actualUrl, 'EX', 3600);

        // 4. Redirect
        res.redirect(url.actualUrl);

        // 5. Background tracking (non-blocking)
        const result  =await  trackUser(req, "testing");
        res.status(200).send(result)

    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
};

// Async background tracking function
async function trackUser(req, urlId) {
    try {
        const parser = new UAParser(req.headers['user-agent']);
        const uaResult = parser.getResult();

        const browser = uaResult.browser.name + ' ' + uaResult.browser.version;
        const os = uaResult.os.name + ' ' + uaResult.os.version;
        const deviceType = uaResult.device.type || 'desktop';
        const deviceModel = uaResult.device.model || 'unknown';
        const deviceVendor = uaResult.device.vendor || 'unknown';
        const emailClient = 'Not detectable in server';

        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
        console.log(ip)
        console.log(browser,os,deviceType,deviceModel,emailClient)
        let location = ip;
        try {
            const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
            location = await geoRes.json();
        } catch (err) {
            console.warn('Location fetch failed:', err.message);
        }

        await Tracking.create();
        return {
            urlId,
            ip,
            browser,
            os,
            deviceType,
            deviceModel,
            deviceVendor,
            city: location.city || null,
            region: location.region || null,
            country: location.country_name || null,
            emailClient
        }

    } catch (err) {
        console.error("Tracking error:", err.message);
    }
}

exports.updateUrlDetails = async(req,res)=>{
    
}


