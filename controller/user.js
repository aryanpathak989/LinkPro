const Users = require('../models/User')
const bcrypt =require('bcrypt')
const jwt = require('jsonwebtoken')
const { validateOtp, requestOtp } = require('../util/otpServices')

//login,singup,logout,update details,send Otp,verify otp
exports.signup = async (req, res) => {
    try {
      const { first_name, last_name, phone_number, password,phone_code,preferences=true } = req.body;
  
      if (!first_name || !last_name || !phone_number || !password) {
        return res.status(400).json({ msg: 'All fields are required' });
      }
  
      /* 1️⃣  Check if the user already exists */
      let user = await Users.findOne({ where: { phone_number } });
  
      if (user?.is_Phone_verified) {
        return res.status(409).json({ msg: 'Phone number already exists' });
      }
  
      /* 2️⃣  Hash the password */
      const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
      const hashed = await bcrypt.hash(password, rounds);
  
      /* 3️⃣  Upsert logic */
      if (user) {
        // MySQL doesn't support 'returning: true', so update then reload
        await user.update({
          first_name,
          last_name,
          password: hashed,
          is_Phone_verified: false,
          preferences,
          phone_code
        });
        await user.reload();   // get fresh values
      } else {
        user = await Users.create({
          first_name,
          last_name,
          phone_number,
          password: hashed,
          is_Phone_verified: false,
          preferences,
          phone_code
        });
      }
  
      /* 4️⃣  Build JWT payload */
      const payload = { id: user.id, phone_number: user.phone_number };
      const token   = jwt.sign(payload, process.env.AUTH_TOKEN, { expiresIn: '7d' });
  
      /* 5️⃣  Set cookie */
      res.cookie('token', token, {
        maxAge  : 7 * 24 * 60 * 60 * 1000,        // 7 days
        httpOnly: true,
        secure  : process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      const loginId = `+${phone_code}${phone_number}`
      await requestOtp(loginId,first_name,last_name)
  
      /* 6️⃣  Single success response */
      return res.status(201).json({
        success: true,
        msg    : 'User signup completed successfully!',
        token
      });
    } catch (err) {
      console.error('[signup] error:', err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
};

exports.login = async (req,res)=>{

try{
    const {phone_number,password} = req.body

    const user = await Users.findOne({where:{
        phone_number
    }})

    if(!user) return res.status(403).json({msg:"User not exist please signup"})

    const isMatch = await bcrypt.compare(password,user.password)
    
    if(!isMatch){
        return res.status(401).json({msg:"Invalid credentials!"})
    }

    const payload = { id: user.id, phone_number: user.phone_number };
    const token   = jwt.sign(payload, process.env.AUTH_TOKEN, { expiresIn: '7d' });

    res.cookie('token',token,{
        maxAge: 7 * 24 * 60 * 60 * 1000,       
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

exports.updateUserDetails = async(req,res)=>{
    try{
        const {first_name,last_name} = req.body
        const {id} = req.user
        if( !first_name || !last_name) return res.status(200).json({msg:"Required fields are missing"})
        await Users.update({first_name,last_name},{where:{id}})
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

      await validateOtp(loginId,code)

      await Users.update(
        { is_Phone_verified: true },
        { where: { phone_number: loginId } }
      );
  
      return res.status(200).json({ msg: 'Verification done' });
    } catch (err) {
      console.error('[verifyOtp] error:', err);
      return res.status(500).json({ msg: 'Internal Server Error!' });
    }
};
  

exports.sendOtp = async(req,res)=>{
try{
    const {phone_number,first_name,last_name,phone_code} = req.body
    const loginId = `+${phone_code}${phone_number}`
    await requestOtp(loginId,first_name,last_name)
    res.status(201).json({msg:"OTP Send Successfully"})
}
catch(err){
    console.log(err)
    res.status(500).json({msg:"Internal Server Error!"})
}
}


exports.resetPassword = async (req, res) => {
  try {
    const { phone_number, code, password } = req.body;

    /* 1️⃣  Validate */
    if (!phone_number || !code || !password) {
      return res.status(400).json({ msg: 'phone_number, code and password are required' });
    }

    /* 2️⃣  Verify the OTP (10-min TTL handled inside the service) */
    const { ok, reason } = await validateOtp(phone_number, code);
    if (!ok) {
      const status = reason === 'expired' ? 410 : 403;
      return res.status(status).json({ msg: `OTP ${reason}` });
    }

    /* 3️⃣  Check the user exists */
    const user = await Users.findOne({ where: { phone_number } });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    /* 4️⃣  Hash & save the new password */
    const rounds  = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const hashed  = await bcrypt.hash(password, rounds);

    await user.update({ password: hashed });

    return res.status(200).json({ msg: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('[resetPassword] error:', err);
    return res.status(500).json({ msg: 'Internal Server Error' });
  }
};

exports.updatePreference = async (req,res)=>{

  try{
    const {id} = req.user
    const {preferences} = req.body

    await Users.update({preferences},{where:{
      id
    }})

    res.status(201).json({msg:"Preference updated"})

  }
  catch(err){
    console.log(err)
    res.status(201).json({msg:"Internal Server Error"})

  }
}

