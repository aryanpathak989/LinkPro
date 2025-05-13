const { where } = require("sequelize")
const Url = require("../models/TableUrl")
const tracking = require('../models/Tracking')
const redis = require('../lib/redis')
// const redis = require('../lib/redis')

const UAParser = require('ua-parser-js');
const fetch = require('node-fetch'); // adjust path if needed
const Tracking = require("../models/Tracking");
const e = require("express");
const chMap = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

exports.urlShortner = async (req, res) => {
    try {
        const { url,expiryDate } = req.body;

        try {
            new URL(url);
        } catch (_) {
            return res.status(400).json({ success: false, message: "Invalid URL provided" });
        }

        // Generate short URL
        let num = await Url.max("id") + 1;
        let temp = ""
        while (num > 0) {
            let ind = parseInt(num % 62);
            num = Math.floor(num / 62);
            temp += chMap[ind];
        }

        // Save short URL
        await Url.create({
            user_id:req.user.id,
            shortUrl:temp,
            actualUrl: url,
            expiryDate
        });

        res.status(200).json({ success: true, data: process.env.BASE_URL + temp });
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
};
 // Adjust as per your redis setup

exports.getActualUrl = async (req, res) => {
    try {
        const actualUrl = req.params.url;
        console.log(actualUrl)

        // 1. Check Redis cache
        const cached = await redis.get(actualUrl);
        if (cached) {
            console.log("Getting url from cached server");
            const parsedUrl = JSON.parse(cached);
            console.log("The parsed url is ",parsedUrl)
            res.redirect(parsedUrl);

            // Run tracking in background
            trackUser(req, actualUrl);
            return;
        }

        // 2. Fallback to DB
        const url = await Url.findOne({ where: { shortUrl: actualUrl },raw:true });
        if (!url) return res.status(404).render('404');
        try{
            res.redirect(url.actualUrl);
        }
        catch(err){
            console.log(err)
        }

        try{
        // 3. Cache result
        await redis.set(actualUrl, JSON.stringify(url.actualUrl));

        // 5. Background tracking (non-blocking)
        await  trackUser(req, url.id);
        }
        catch(err){
            console.log(err)
        }

    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
};

// Async background tracking function
async function trackUser(req, shortUrl) {
    try {
        const parser = new UAParser(req.headers['user-agent']);
        const uaResult = parser.getResult();

        const browser = uaResult.browser.name + ' ' + uaResult.browser.version;
        const os = uaResult.os.name + ' ' + uaResult.os.version;
        const deviceType = uaResult.device.type || 'desktop';
        const deviceModel = uaResult.device.model || 'other';
        const deviceVendor = uaResult.device.vendor || 'other';
        const emailClient = 'Not detectable in server';

        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
        console.log(browser,os,deviceType,deviceModel,emailClient)
        let location = ip;
        try {
            const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
            location = await geoRes.json();
        } catch (err) {
            console.warn('Location fetch failed:', err.message);
        }
        const urlDetails = await Url.findOne({where:{shortUrl},raw:true})
        await Tracking.create({
            urlId:urlDetails.id,
            ip, 
            browser,
            os,
            deviceType,
            deviceModel,
            deviceVendor,
            city: location.city || null,
            region: location.region || null,
            country: location.country_name || null,
            emailClient:emailClient == "Not detectable in server" || !emailClient ? null : emailClient
        });

    } catch (err) {
        console.error("Tracking error:", err);
    }
}

exports.updateUrlDetails = async(req,res)=>{
    const {urlId,actualUrl,expiryDate} = req.body
    try{
        const urlDetails = await Url.findOne({where:{id:urlId, user_id:req.user.id},raw:true})
        if(!urlDetails) return res.status(404).json({success:false,message:"Url not found"})
        await Url.update({actualUrl,expiryDate},{where:{id:urlId}})
        res.status(200).json({success:true,message:"Url updated successfully"})
    }
    catch(err){
        console.log(err)
        res.status(500).json({success:false,message:"Internal server error"})
    }
}


