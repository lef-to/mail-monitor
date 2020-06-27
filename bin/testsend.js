"use strict";

require('dotenv').config();

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const nodemailer = require("nodemailer");
const fs = require('fs');

const optionDefinitions = [
  // {
  //   name: 'id',
  //   alias: 'i',
  //   type: Number,
  //   defaultValue: 1,
  //   description: 'mailbox ID.'
  // },
  {
    name: 'file',
    alias: 'f',
    type: String,
    description: 'json file.'
  },
  {
    name: 'tsl',
    alias: 't',
    type: Boolean,
    description: 'use tsl.'
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'show help'
  }
];
const sections = [
  {
    header: 'test mail send.',
    content: 'this is test mail send for command-line-args'
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
];
const args = commandLineArgs(optionDefinitions);
if(args.help) {
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit(0);
}

async function main() {

  console.log(args);

  const template = JSON.parse(fs.readFileSync(__dirname + '/../' + args.file, 'utf8'));

  let options = {}, defaults = {
    host: template.host || process.env.MAIL_HOST,
    auth: template.auth,
    tls: { rejectUnauthorized: false },
    debug: false
  };

  if (args.tsl) {
    options.port = 587;
    options.secure = true;
    options.requireTLS = true;
  } else {
    options.port = template.port || process.env.MAIL_PORT;
    options.secure = false;
    options.ignoreTLS = true;
  }

  let transporter = nodemailer.createTransport(options, defaults);

  if (template.mail.text) {
    template.mail.text = template.mail.text.join("\n");
  }
  if (template.mail.html) {
    template.mail.html = template.mail.html.join("\n");
  }
  if (template.mail.attachments) {
    template.mail.attachments.forEach((obj, i) => {
        //template.mail.attachments[i].content = fs.createReadStream(template.mail.attachments[i].content);
//      obj.content = fs.createReadStream('/Users/ryun/Documents/trapmail3/test/' + obj.content);
      template.mail.attachments[i].content = '/Users/ryun/Documents/trapmail3/test/image.jpg';
//      template.mail.attachments[i].content = new Buffer('hello world!','utf-8');
//         template.mail.attachments[i].content = 'aGVsbG8gd29ybGQh';
//         template.mail.attachments[i].encoding = 'base64';
    });
  }

  let info = await transporter.sendMail(template.mail);

  console.log("Message sent: %s", info.messageId);

  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

main().catch(console.error);

