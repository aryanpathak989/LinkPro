require('dotenv').config();
const { TelegramClient, Api } = require('telegram');
const { StringSession }      = require('telegram/sessions');
const  {buildLinkProOtpHtml} =require('../util/linkproOtpTemplate');

const {
  TG_API_ID,        // numeric, e.g. 123456
  TG_API_HASH,      // 32-char hex
  TG_SESSION        // long base64 string you pasted in .env
} = process.env;

if (!TG_API_ID || !TG_API_HASH || !TG_SESSION) {
  throw new Error('TG_API_ID, TG_API_HASH and TG_SESSION must all be set');
}

class TelegramService {
  static #client;
  static #connected = false;

  /* establishes MTProto connection only on first use */
  static async #ensureConnection() {
    if (this.#connected) return;

    this.#client = new TelegramClient(
      new StringSession(TG_SESSION),
      Number(TG_API_ID),
      TG_API_HASH,
      { connectionRetries: 5 }
    );
    await this.#client.connect();      // silent — uses stored session
    this.#connected = true;
    console.log('✅ Telegram client connected');
  }

  /* public helper: just call and await it whenever you need to DM a phone */
  static async sendOtpMessage(phoneE164,code,first_name,last_name) {
    await this.#ensureConnection();

    /* 1. import / refresh the phone as a contact (required to DM) */
    const { users } = await this.#client.invoke(
      new Api.contacts.ImportContacts({
        contacts: [
          new Api.InputPhoneContact({
            clientId : Date.now(),   // any unique int64
            phone    : phoneE164,
            firstName: first_name,       // label is irrelevant
            lastName : last_name
          })
        ],
        replace: false
      })
    );

    if (!users.length) throw new Error('User not on Telegram');

    /* 2. send the actual message */
    const msg = buildLinkProOtpHtml({ code: code, ttl: 5 });
    await this.#client.sendMessage(phoneE164,  { message: msg, parseMode: 'html' }  );
  }
}

module.exports = TelegramService;
