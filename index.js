const util = require('./common/util')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'eu-west-1' })
const Lambda = new AWS.Lambda()
const Imap = require("node-imap");

const generateResponse = (statusCode, result) => {
    return {
      statusCode: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(util.convertFromUuid(result)),
      isBase64Encoded: false,
    }
  }

exports.handler = async (request, context, callback) => {
  const response = {}
  try {
    const data = (process.env.env === 'local') ? JSON.parse(request) : request
    const args = util.convertToUuid(data.arguments)
    const { email, password } = args

    const imap = new Imap({
        user: email,
        password: password,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
    });

    function openInbox(cb) {
        imap.openBox("INBOX", true, cb);
    }

    imap.once("ready", function () {
        openInbox(function (err, box) {
            if (err) throw err;
            var f = imap.seq.fetch(box.messages.total + ":*", {
                bodies: ["HEADER.FIELDS (FROM)", "TEXT"],
            });
            f.on("message", function (msg) {
                msg.on("body", function (stream, info) {
                    if (info.which === "TEXT") {
                        stream.on("data", function (chunk) {
                            let textMessage = chunk.toString("utf8");
                            const i = textMessage.indexOf("code: ");
                            if (i > 0) {
                                res.json(textMessage.slice(i + 6, i + 12));
                            }
                        });
                    }
                });
            });
            f.once("error", function (err) {
                throw err
            });
            f.once("end", function () {
                imap.end();
            });
        });
    });

    imap.once("error", function (err) {
        throw err
    });

    response.code = imap.connect();

    callback(null, generateResponse(200, response.code))
  } catch (error) {
    console.log(error)
    await util.invoke(Lambda, 'error', {
      userId: 'userId',
      type: 'invokeLambda',
      functionName: 'TEAM_MEMBERS_GET',
      errorMessage: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      request,
    })
    callback(error, generateResponse(500))
  }
}