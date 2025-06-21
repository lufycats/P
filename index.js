
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const sender = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text;

        console.log("New message:", body);

        if (body === "!ping") {
            await sock.sendMessage(sender, { text: "pong!" });
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed. Reconnecting:", shouldReconnect);
            if (shouldReconnect) {
                startSock();
            }
        } else if (connection === "open") {
            console.log("Connected to WhatsApp!");
        }
    });
}

startSock();
