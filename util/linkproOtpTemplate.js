
exports.buildLinkProOtpHtml= ({ code, ttl = 5, brand = 'LinkPro' })=> {
    // Basic HTML-escape for &, <, >
  
    return (
  `🔒 ${brand} secure code\n` +
  `Your one-time password (OTP): <code>${code}</code>\n\n` +
  `<i>This code expires in ${ttl} minutes. Never share it with anyone.</i>\n\n` +
  `Need help? <i>Ask your question in chat</i>`
    );
  }
  