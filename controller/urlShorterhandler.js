const { where } = require("sequelize")
const Url = require("../models/TableUrl")
const redis = require('../lib/redis')

const chMap = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
]


exports.urlShortner = async (req,res)=>{

    try{
        const {url} = req.body
        let num = await Url.max("id")+1
        let temp = ""
        while(num>0){
            let ind  =  parseInt(num%62)
            num = Math.floor(num / 62)
            temp+=chMap[ind]
        }
        await Url.create({
            urlId:temp,
            actualUrl:url
        })
        res.status(200).json({success:true,data:'http://localhost:4000/'+temp})
    }
    catch(err){
        console.log(err)
        res.status(500).send("Internal Server Error")
    }
}

exports.getActualUrl = async (req,res)=>{
    try{
        const actualUrl = req.params.url
        const cached = await redis.get(actualUrl)
        if(cached){
            console.log("Getting url from cached server")
            return res.redirect(cached)
        }
        const url = await Url.findOne({where:{
            urlId:actualUrl
        }})
        if(!url){
            res.status(200).send("Url not found")
        }
        await redis.set(actualUrl,url.actualUrl,'EX',3600)
        res.redirect(url.actualUrl)
    }
    catch(err){
        console.log(err)
    }
}

