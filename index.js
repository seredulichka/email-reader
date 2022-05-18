const Imap = require("node-imap");
const express = require("express");
const app = express();
const port = process.env.RDS_PORT || 5000;

app.get("/confirmation", function (req, res) {
    const email = req.query.email;
    const password = req.query.password;

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

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
            f.on("message", function (msg, seqno) {
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
                res.json(err);
            });
            f.once("end", function () {
                imap.end();
            });
        });
    });

    imap.once("error", function (err) {
        res.json(err);
    });

    imap.connect();
});

app.listen(port)
