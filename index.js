require('dotenv').config();


const datetime = require('node-datetime');
const moment = require("moment");
const crypto = require('crypto');
const fs = require('fs');
const log4js = require('log4js');
const db = require('./models/index');

var mbox_map = [];

/******************************************************************************
 * LOG
 ******************************************************************************/
log4js.configure('./config/log.json');

const systemLogger = log4js.getLogger('system');
const httpLogger = log4js.getLogger('http');
const accessLogger = log4js.getLogger('access');
const socketLogger = log4js.getLogger('socket');
const smtpLogger = log4js.getLogger('smtp');

systemLogger.info("App start");

/******************************************************************************
 * HTTP
 ******************************************************************************/
const HTTP_PORT = process.env.HTTP_PORT || 8080;
const express = require('express');
const app = express();
const http = require('http').Server(app);
const flash = require('express-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const router = require('./router');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser(process.env.SECRET_KEY));
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

app.use('/modules', express.static(__dirname + '/node_modules'));
app.use('/assets', express.static(__dirname + '/assets'));
app.set("view engine", "ejs");

app.use(log4js.connectLogger(accessLogger));

app.use( function (req, res, next) {

    global.moment = moment;
    global.session = req.session;

    if (req.method === 'GET' || req.method === 'DELETE') {
        httpLogger.info(req.query);
    } else {
        httpLogger.info(req.body);
    }

    next();
});

app.use('/', router);

app.use( function (req, res, next) {
    res.status(404);
    res.render(__dirname + '/views/404.ejs');
});

/******************************************************************************
 * SOCKET
 ******************************************************************************/
const io = require('socket.io')(http);

io.on('connection',function(socket){
    socketLogger.info('http connected');

    socket.on('set_mailbox', function(mailbox_id){
        socketLogger.log('set_mailbox: ', mailbox_id);
        //io.emit('message', msg);
        if (mbox_map[mailbox_id] == undefined) mbox_map[mailbox_id] = [];
        mbox_map[mailbox_id].push(socket.id);
    });
});

http.listen(HTTP_PORT, function(){
    httpLogger.info('HTTP SERVER: Listening on port:' + HTTP_PORT);
});

/******************************************************************************
 * SMTP
 ******************************************************************************/
const SMTP_SSL_PORT = process.env.SMTP_SSL_PORT || 465;
const SMTP_TLS_PORT = process.env.SMTP_TLS_PORT || 587;
const SMTP_INSECURE_PORT = process.env.SMTP_INSECURE_PORT || 2525;
const SMTPServer = require("smtp-server").SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const SPFValidator = require('spf-validator');
const baseSmtpOption = new SMTPServer({

    onConnect(session, callback) {

        smtpLogger.info("SMTP: onConnect()");

        console.log(session);
        // if (session.remoteAddress === "127.0.0.1") {
        //   return callback(new Error("No connections from localhost allowed"));
        // }
        return callback(); // Accept the connection
    },

    async onAuth(auth, session, callback) {

        smtpLogger.info("SMTP: onAuth()");
        smtpLogger.debug('login: ', auth.username, auth.password);

        const mailbox = await db.mailboxes.findOne({
            where: {
                name: auth.username,
                pass: pass2hash(auth.password)
            }
        });

        if (mailbox == undefined) {
            return callback(new Error("SMTP: Invalid username or password"));
        } else {
            smtpLogger.debug(mailbox);

            return callback(null, {user: mailbox.id});
        }

    },

    onData(stream, session, callback) {

        smtpLogger.info("SMTP: onData()");

        //stream.pipe(process.stdout); // print message to console
        //console.log('Session \n', session.envelope);

        var txt = "";
        stream.on("data", chunk => txt += chunk);

        stream.on("end", function(){

            smtpLogger.debug(txt);

            simpleParser(txt, {})
                .then(parsed => {
                    smtpLogger.debug("parsed:", parsed);

                    parsed.size = 'Size: ' + SizeConvert(txt);
                    parsed.datetime = datetime.create(parsed.date).format('Y-m-d H:M');

                    if (mbox_map[session.user] != undefined) {
                        mbox_map[session.user].forEach(function(socket_id){
                            io.to(socket_id).emit('message', JSON.stringify(parsed));
                        });
                    }
                })
                .catch(err => {
                    smtpLogger.error(err);
                });
        });

        return callback(); // Accept the address
    },

    onMailFrom(address, session, callback) {
        smtpLogger.info("SMTP: onMailFrom()");

        smtpLogger.debug(address);

        const validator = new SPFValidator(address.address.split('@')[1]);
        validator.hasRecords((err, hasRecords) => {

            if (hasRecords) {
                smtpLogger.info("SMTP: spf validate ok. " + address.address);
                return callback();
            } else if (err) {
                smtpLogger.error("SMTP: spf validate error. " + err);
                return callback(new Error(err));
            } else {
                smtpLogger.error("SMTP: error.");
                return callback(new Error(''));
            }
        });
    },

    onRcptTo(address, session, callback) {
        smtpLogger.info("SMTP: onRcptTo()");
        return callback();
    },

    onClose(session) {
        smtpLogger.info("SMTP: onClose()");

        // if (session.mailbox_id) {
        //     console.log("Close Mail Box ID:", session.mailbox_id);
        // }
    }

});

const sslSmtpServer = new SMTPServer(Object.assign(baseSmtpOption, {
    secure: true,
    authOptional: true,
    passphrase: 'hoge',
    key: fs.readFileSync(__dirname + "/ssl/mail-monitor.key", 'utf8'),
    cert: fs.readFileSync(__dirname + "/ssl/mail-monitor.cert", 'utf8'),
    logger: true,
}));
sslSmtpServer.listen(SMTP_SSL_PORT, function() {
    smtpLogger.info('SMTP SSL SERVER: Listening on port:' + SMTP_SSL_PORT)
});
sslSmtpServer.on("error", err => {
    smtpLogger.error("SMTP SSL Error: %s", err.message);
});

const tlsSmtpServer = new SMTPServer(Object.assign(baseSmtpOption, {
    //secure: true,
//    authOptional: true,
    //authMethods: ['PLAIN', 'LOGIN'],
//    disabledCommands: ['EHLO'],
//banner: 'Welcome to My Awesome SMTP Server',
//useXClient: true,
//useXForward: true,
    passphrase: 'hoge',
    key: fs.readFileSync(__dirname + "/ssl/mail-monitor.key", 'utf8'),
    cert: fs.readFileSync(__dirname + "/ssl/mail-monitor.cert", 'utf8'),
//    ca: fs.readFileSync(__dirname + "/ca.pem"),
    logger: true,
}));
tlsSmtpServer.listen(SMTP_TLS_PORT, function() {
    smtpLogger.info('SMTP TLS SERVER: Listening on port:' + SMTP_TLS_PORT)
});
tlsSmtpServer.on("error", err => {
    smtpLogger.error("SMTP TLS Error: %s", err.message);
});

const insecureSmtpServer = new SMTPServer(Object.assign(baseSmtpOption, {
    secure: false,
    disabledCommands: ['STARTTLS'],
}));
insecureSmtpServer.listen(SMTP_INSECURE_PORT, function() {
    smtpLogger.info('SMTP INSECURE SERVER: Listening on port:' + SMTP_INSECURE_PORT)
});
insecureSmtpServer.on("error", err => {
    smtpLogger.error("SMTP INSECURE Error: %s", err.message);
});


process.on('SIGTERM', () => {
    http.close(() => {
        httpLogger.info('HTTP stop');
    });

    tlsSmtpServer.close(() => {
        smtpLogger.info('SMTP TLS stop')
    });

    sslSmtpServer.close(() => {
        smtpLogger.info('SMTP SSL stop')
    });

    insecureSmtpServer.close(() => {
        smtpLogger.info('SMTP INSECURE stop')
    });

    systemLogger.info('App stop');
});

/******************************************************************************
 * Function
 ******************************************************************************/

const kb = 1024;
const mb = Math.pow(kb, 2);
const gb = Math.pow(kb, 3);
const tb = Math.pow(kb, 4);
function SizeConvert(txt) {

    let target = null;
    let unit = 'byte';
    let size = txt.length;

    if (size >= tb) {
        target = tb;
        unit = 'TB';
    } else if (size >= gb) {
        target = gb;
        unit = 'GB';
    } else if (size >= mb) {
        target = mb;
        unit = 'MB';
    } else if (size >= kb) {
        target = kb;
        unit = 'KB';
    }
    const res = target !== null ? Math.floor((size / target) * 100) / 100 : size;

    return res + ' ' + unit;
}

function pass2hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}
