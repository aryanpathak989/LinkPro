const Users = require('../models/User')
const bcrypt =require('bcrypt')
const jwt = require('jsonwebtoken')
const TableOtps = require('../models/TableOtps')
const TelegramService = require('../lib/TelegramServices')
const { Op } = require('sequelize')

//login,singup,logout,update details,send Otp,verify otp
exports.signup = async (req,res)=>{

    const {first_name,last_name,phone_number,password} = req.body
    if(!first_name || !last_name ||!phone_number ||!password){
        return res.status(403).json({msg:"All the required field is necessary"})
    }

   try{
        const cpassword = await bcrypt.hash(password,process.env.BCRYPT_SLAT_ROUND)

        const userLoad = {
            first_name,
            last_name,
            phone_number,
            password:cpassword,
            isEmailVerfied:false
        }
        const user = await Users.create(userLoad)

        const {password:nPassword,userDetails} = user
        const token = await jwt.sign(userDetails,process.env.AUTH_TOKEN)
    
        res.cookie('token',token,{
            maxAge: 7 * 24 * 60 * 60 * 1000,       
            httpOnly: true,            
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax'
        })
        res.status(200).json({msg:"Login Successfull!"})

        res.status(201).json({success:true,msg:"User signup completed successfully!"})
   }
   catch(err){
        console.log(err)
        res.status(500).json({msg:"Internal Server Errro"})
   }
}

exports.login = async (req,res)=>{

try{
    const {phone_number,password} = req.body

    const user = await Users.findOne({where:{
        phone_number
    }})

    if(!user) return res.status(403).json({msg:"User not exist please signup"})

    const isMatch = await bcrypt.verify(password,user.password)
    
    if(!isMatch){
        return res.status(401).json({msg:"Invalid credentials!"})
    }

    const {password:cpassword,userDetails} = user
    const token = await jwt.sign(userDetails,process.env.AUTH_TOKEN)

    res.cookie('token',token,{
        maxAge: sevenDays,       
        httpOnly: true,            
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax'
    })
    res.status(200).json({msg:"Login Successfull!"})
}
catch(err){
    console.log(err)
    res.status(500).json({msg:"Internal Server Error"})
}

}

exports.updateValue = async(req,res)=>{
    try{
        const {email,first_name,last_name} = req.body
        const {id} = req.user
        if(!email || !first_name || !last_name) return res.status(200).json({msg:"Required fields are missing"})
        await Users.update({email,first_name,last_name},{where:{id}})
        res.status(201).json({msg:"Successfully updated"})
    }
    catch(err){
        res.status(500).json({msg:"Internal server error"})
    }

}

// controller/otpController.js
exports.verifyOtp = async (req, res) => {
    try {
      const { loginId, code } = req.body;
  
      if (!loginId || !code) {
        return res.status(400).json({ msg: 'loginId and code are required' });
      }
  
      /* 1️⃣  Only fetch rows that are still within the 10-minute window */
      const cutoff = new Date(Date.now() - 10 * 60 * 1000); // now − 10 min
  
      const otpRow = await TableOtps.findOne({
        where: {
          loginId,
          updatedAt: { [Op.gt]: cutoff }      // updated within the last 10 min
        }
      });
  
      if (!otpRow) {
        return res.status(410).json({ msg: 'OTP expired or not found' });
      }
  
      /* 2️⃣  Compare codes */
      if (otpRow.code != code) {
        return res.status(403).json({ msg: 'OTP not matched' });
      }
  
      /* 3️⃣  Verification succeeded → delete the OTP so it can’t be reused */
      await otpRow.destroy();
  
      return res.status(200).json({ msg: 'Verification done' });
    } catch (err) {
      console.error('[verifyOtp] error:', err);
      return res.status(500).json({ msg: 'Internal Server Error!' });
    }
};
  

exports.sendOtp = async(req,res)=>{
try{
    const {phone_number,first_name,last_name} = req.body
    const code = parseInt(Math.random()*10000)
    
    const otpExists = await TableOtps.findOne({where:{loginId:phone_number}})

    if(otpExists){
        await otpExists.update({loginId:phone_number,code})
    }
    else{
        TableOtps.create({loginId:phone_number,code})
    }

    //Send Otp to telegram,
    TelegramService.sendOtpMessage(phone_number,code,first_name,last_name)
    res.status(201).json({msg:"Successfully created!"})
}
catch(err){
    console.log(err)
    res.status(500).json({msg:"Internal Server Error!"})
}
}

