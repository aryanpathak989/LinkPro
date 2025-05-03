// services/otpService.js
const { Op }          = require('sequelize');
const TableOtps       = require('../models/TableOtps');
const TelegramService = require('../lib/TelegramServices');

const OTP_TTL_MIN = 10;   // 10-minute validity

function generateCode() {
  // Math.random → 0000-9999, always 4 digits (e.g. "0347")
  return Math.floor(Math.random() * 10_000).toString().padStart(4, '0');
}


async function requestOtp(loginId, firstName, lastName ='') {
  const code = generateCode();

  const existing = await TableOtps.findOne({ where: { loginId } });
  if (existing) {
    await existing.update({ code });               // updatedAt auto-updates
  } else {
    await TableOtps.create({ loginId, code });
  }

  await TelegramService.sendOtpMessage(loginId, code, firstName, lastName);
  return { code };                                 
}

async function validateOtp(loginId, code) {
  const cutoff = new Date(Date.now() - OTP_TTL_MIN * 60 * 1000);

  const row = await TableOtps.findOne({
    where: { loginId, updatedAt: { [Op.gt]: cutoff } }
  });
  if (!row)         return { ok: false, reason: 'expired' };
  if (row.code != code) return { ok: false, reason: 'mismatch' };

  await row.destroy();
  return { ok: true };
}

module.exports = { requestOtp, validateOtp };
