const log4js = require('log4js');
const express = require('express');
const router = express.Router();
const db = require('./models/index');
const crypto = require('crypto');

const PAGE_VIEW = process.env.PAGE_VIEW;

log4js.configure('./config/log.json');
const systemLogger = log4js.getLogger('system');
const httpLogger = log4js.getLogger('http');
const accessLogger = log4js.getLogger('access');


/******************************************************************************
 * フロント
 ******************************************************************************/

router.get('/' , async(req, res) => {

    if (is_login(req)) {

        const user = await db.users.findOne({
            where: {id: req.session.user_id},
            include: [
                { model: db.mailboxes, as: 'userboxes' }
            ]
        });

        res.render(__dirname + '/views/index.ejs', {
            menu: 'dashboard',
            list: user.userboxes,
        });
    } else {
        res.redirect('/login');
    }
});

router.get('/login' , async (req, res) => {

    if (is_login(req)) {
        res.redirect('/');
    } else {
        res.render(__dirname + '/views/login.ejs', {});
    }
});

router.post('/login' , async (req, res) => {

    const user = await db.users.findOne({
        where:{
            email: req.body.email,
            pass: pass2hash(req.body.pass),
        }
    });

    if (user == undefined) {
        req.flash('error', 'メールアドレス、またはパスワードが違います');
        res.render(__dirname + '/views/login.ejs', {input: req.body});
    } else {
        systemLogger.debug("Login ID: " + user.id);

        req.session.user_id = user.id;
        req.session.user_name = user.name;
        res.redirect('/');
    }

});

router.get('/logout' , function(req, res){
    req.session.user_id = null;
    res.redirect('/');
});

router.get('/mailbox/:mailbox_id' , async(req, res) => {

    if (!is_login(req)) res.redirect('/login');

    const mailbox = await db.mailboxes.findOne({where: {id: req.params.mailbox_id}});

    if (mailbox == undefined) res.redirect('/404');

    res.render(__dirname + '/views/mailbox.ejs', {
        mailbox: mailbox,
    });
});

router.get('/setting' , async(req, res) => {

    if (!is_login(req)) res.redirect('/login');

    const user = await db.users.findOne({where: {id: req.session.user_id}});

    if (user == undefined) res.redirect('/404');

    res.render(__dirname + '/views/setting.ejs', {
        item: user,
        errors: {}
    });
});

router.post('/setting' , async(req, res) => {

    if (!is_login(req)) res.redirect('/login');

    const user = await db.users.findOne({where: {id: req.session.user_id}});

    if (user == undefined) res.redirect('/404');

    var errors = {};

    if(req.body.name == '') {
        errors.name = '名前は必須です。';
    }
    if(req.body.email == '') {
        errors.email = 'メールアドレスは必須です。';
    } else if (!checkMail(req.body.email)) {
        errors.email = '正しいメールアドレスではありません。';
    } else if(await db.users.findOne({where:{ id:{ [db.Sequelize.Op.ne]:req.body.id }, name:req.body.email }})) {
        errors.email = 'すでに存在するメールアドレスです。';
    }
    if(req.body.pass == '') {
        errors.pass = 'パスワードは必須です。';
    }

    if (Object.keys(errors).length == 0) {
        user.name = req.body.name;
        user.email = req.body.email;
        if (user.pass != req.body.pass) {
            user.pass = pass2hash(req.body.pass);
        }
        user.save();

        req.session.user_name = user.name;

        req.flash('success', '変更しました。');

        res.render(__dirname + '/views/setting.ejs', {
            item: user,
            errors: errors
        });

    } else {
        res.render(__dirname + '/views/setting.ejs', {
            item: req.body,
            errors: errors
        });
    }

});

/******************************************************************************
 * 管理画面
 ******************************************************************************/

router.get('/admin' , async (req, res) => {

    if (is_admin(req)) {
        res.render(__dirname + '/views/admin/index.ejs', {});
    } else {
        res.redirect('/admin/login');
    }
});

router.get('/admin/login' , async (req, res) => {

    if (is_admin(req)) {
        res.redirect('/admin');
    } else {
        res.render(__dirname + '/views/admin/login.ejs', {});
    }
});

router.post('/admin/login' , async (req, res) => {

    const admin = await db.admins.findOne({
        where:{
            email: req.body.email,
            pass: pass2hash(req.body.pass),
        }
    });

    console.log(admin);

    if (admin == undefined) {
        req.flash('error', 'メールアドレス、またはパスワードが違います');
        res.render(__dirname + '/views/admin/login.ejs', {input: req.body});
    } else {
        systemLogger.debug("Admin Login ID: " + admin.id);

        req.session.admin_id = admin.id;
        res.redirect('/admin');
    }

});

router.get('/admin/logout' , async (req, res) => {
    req.session.admin_id = null;
    res.redirect('/admin');
});


router.get('/admin/user' , async(req, res) =>{

    if (!is_admin(req)) res.redirect('/admin/login');

    await db.users.findAndCountAll({
        include: [{ model: db.mailboxes, as: 'userboxes' }],
        distinct:true,
        ...paginate(req.query.page || 1, PAGE_VIEW),
    }).then(result => {
        console.log(result.rows);
        res.render(__dirname + '/views/admin/user.ejs', {
            list: result.rows ? result.rows : [],
            count: result.count,
            page: req.query.page || 1,
            view: PAGE_VIEW
        });
    });

});

router.get('/admin/user/:user_id' , async (req, res) => {

    if (!is_admin(req)) res.redirect('/admin/login');

    const user = await db.users.findOne({
        where: {id: req.params.user_id},
        include: [
            { model: db.mailboxes, as: 'userboxes' }
        ]
    });

    const mailboxes = await db.mailboxes.findAll();

    res.render(__dirname + '/views/admin/user_detail.ejs', {
        item: user ? user : {},
        mailboxes: mailboxes,
        errors: {}
    });

});

router.post('/admin/user' , async (req, res) => {

    if (!is_admin(req)) res.redirect('/admin/login');

    var errors = {};

    if(req.body.name == '') {
        errors.name = '名前は必須です。';
    }
    if(req.body.email == '') {
        errors.email = 'メールアドレスは必須です。';
    } else if (!checkMail(req.body.email)) {
        errors.email = '正しいメールアドレスではありません。';
    } else if(await db.users.findOne({where:{ id:{ [db.Sequelize.Op.ne]:req.body.id }, name:req.body.email }})) {
        errors.email = 'すでに存在するメールアドレスです。';
    }
    if(req.body.pass == '') {
        errors.pass = 'パスワードは必須です。';
    }
    if(!req.body.mailbox_id) {
        errors.mailbox_id = '受信箱を設定してください。';
    }


    if (Object.keys(errors).length == 0) {

        const user = await db.users.findOne({
            where: {id: req.body.id},
            include: [
                { model: db.mailboxes, as: 'userboxes' }
            ]
        });

        if (user) {

            user.name = req.body.name;
            user.email = req.body.email;
            if (user.pass != pass2hash(req.body.pass)) {
                user.pass = pass2hash(req.body.pass);
            }

            user.save();

            await db.rel_user_boxes.destroy({
                where: { user_id: req.body.id }
            });

            for(let i = 0; i < req.body.mailbox_id.length; i++) {
                await db.rel_user_boxes.create({
                    user_id: req.body.id,
                    mailbox_id: req.body.mailbox_id[i],
                });
            }


            const item = await db.users.findOne({
                where: {id: req.body.id},
                include: [{ model: db.mailboxes, as: 'userboxes' }]
            });

            req.flash('success', '更新しました');
            res.render(__dirname + '/views/admin/user_detail.ejs', {
                item: item,
                mailboxes: await db.mailboxes.findAll(),
                errors: {}
            });

        } else {
            const user = await db.users.create({
                name: req.body.name,
                email: req.body.email,
                pass: pass2hash(req.body.pass),
            });

            await Promise.all(req.body.mailbox_id.map(async (id) => {
                await db.rel_user_boxes.create({
                    user_id: user.id,
                    mailbox_id: id,
                });
            }));

            req.flash('success', '登録しました');
            res.redirect('/admin/user');
        }

    } else {
        res.render(__dirname + '/views/admin/user_detail.ejs', {
            item: req.body,
            mailboxes: await db.mailboxes.findAll(),
            errors: errors
        });
    }

});

router.get('/admin/user/delete/:user_id' , async (req, res) => {

    await db.users.destroy({
        where: {
            id: req.params.user_id
        }
    });

    req.flash('success', '削除しました');
    res.redirect('/admin/user');
});

router.get('/admin/mailbox' , async (req, res) => {

    if (!is_admin(req)) res.redirect('/admin/login');

    await db.mailboxes.findAndCountAll({
        distinct:true,
        ...paginate(req.query.page || 1, PAGE_VIEW),
    }).then(result => {
        res.render(__dirname + '/views/admin/mailbox.ejs', {
            list: result.rows ? result.rows : [],
            count: result.count,
            page: req.query.page || 1,
            view: PAGE_VIEW
        });
    });

});

router.get('/admin/mailbox/:mailbox_id' , async(req, res) => {

    if (!is_admin(req)) res.redirect('/admin/login');

    const mailbox = await db.mailboxes.findByPk(req.params.mailbox_id);

    res.render(__dirname + '/views/admin/mailbox_detail.ejs', {
        item: mailbox ? mailbox : {},
        errors: {}
    });
});

router.post('/admin/mailbox' , async (req, res) => {

    var errors = {};

    if (!is_admin(req)) res.redirect('/admin/login');

    if(req.body.title == '') {
        errors.title = 'タイトルは必須です。';
    }
    if(req.body.name == '') {
        errors.name = '名前は必須です。';
    } else if(await db.mailboxes.findOne({where:{ id:{ [db.Sequelize.Op.ne]:req.body.id }, name:req.body.name }})) {
        errors.name = 'すでに存在する名前です。';
    }
    if(req.body.pass == '') {
        errors.pass = 'パスワードは必須です。';
    }

    if (Object.keys(errors).length == 0) {

        const mailbox = await db.mailboxes.findByPk(req.body.id);

        if (mailbox) {

            mailbox.title = req.body.title;
            mailbox.name = req.body.name;
            if (mailbox.pass != pass2hash(req.body.pass)) {
                mailbox.pass = pass2hash(req.body.pass);
            }
            mailbox.save();

            req.flash('success', '更新しました');
            res.render(__dirname + '/views/admin/mailbox_detail.ejs', {item: req.body, errors: {}});

        } else {
            const mailbox = await db.mailboxes.create({
                title: req.body.title,
                name: req.body.name,
                pass: pass2hash(req.body.pass)
            });

            req.flash('success', '登録しました');
            res.redirect('/admin/mailbox');
        }

    } else {
        res.render(__dirname + '/views/admin/mailbox_detail.ejs', {item: req.body, errors: errors});
    }

});

router.get('/admin/mailbox/delete/:mailbox_id' , async (req, res) => {

    await db.mailboxes.destroy({
        where: {
            id: req.params.mailbox_id
        }
    });

    await db.rel_user_boxes.destroy({
        where: {
            mailbox_id: req.params.mailbox_id
        }
    });

    req.flash('success', '削除しました');
    res.redirect('/admin/mailbox');
});


router.get('/admin/admin' , async(req, res) => {

    if (!is_admin(req)) res.redirect('/admin/login');

    await db.admins.findAndCountAll({
        distinct:true,
        ...paginate(req.query.page || 1, PAGE_VIEW),
    }).then(result => {
        res.render(__dirname + '/views/admin/admin.ejs', {
            list: result.rows ? result.rows : [],
            count: result.count,
            page: req.query.page || 1,
            view: PAGE_VIEW
        });
    });

});

router.get('/admin/admin/:admin_id' , async (req, res) => {

    if (!is_admin(req)) res.redirect('/admin/login');

    const admin = await db.admins.findByPk(req.params.admin_id);

    res.render(__dirname + '/views/admin/admin_detail.ejs', {
        item: admin ? admin : {},
        errors: {}
    });


});

router.post('/admin/admin' , async (req, res) => {
    console.log(req.body);

    var errors = {};

    if (!is_admin(req)) res.redirect('/admin/login');

    if(req.body.name == '') {
        errors.name = '名前は必須です。';
    }
    if(req.body.email == '') {
        errors.email = 'メールアドレスは必須です。';
    } else if (!checkMail(req.body.email)) {
        errors.email = '正しいメールアドレスではありません。';
    } else if(await db.admins.findOne({where:{ id:{ [db.Sequelize.Op.ne]:req.body.id }, email:req.body.email }})) {
        errors.email = 'すでに存在するメールアドレスです。';
    }
    if(req.body.pass == '') {
        errors.pass = 'パスワードは必須です。';
    }


    if (Object.keys(errors).length == 0) {

        const admin = await db.admins.findByPk(req.body.id);

        if (admin) {

            admin.name = req.body.name;
            admin.email = req.body.email;
            if (admin.pass != pass2hash(req.body.pass)) {
                admin.pass = pass2hash(req.body.pass);
            }
            admin.save();

            req.flash('success', '更新しました');
            res.render(__dirname + '/views/admin/admin_detail.ejs', {
                item: admin,
                errors: {}
            });

        } else {
            const admin = await db.admins.create({
                name: req.body.name,
                email: req.body.email,
                pass: pass2hash(req.body.pass),
            });

            req.flash('success', '登録しました');
            res.redirect('/admin/admin');
        }

    } else {
        res.render(__dirname + '/views/admin/admin_detail.ejs', {
            item: req.body,
            errors: errors
        });
    }

});

router.get('/admin/admin/delete/:admin_id' , async (req, res) => {

    if (!is_admin(req)) res.redirect('/admin/login');

    await db.admins.destroy({
        where: {
            id: req.params.admin_id
        }
    });

    req.flash('success', '削除しました');
    res.redirect('/admin/admin');
});

/******************************************************************************
 * Function
 ******************************************************************************/

function is_login(req) {
    return req.session.user_id != undefined;
}

function is_admin(req) {
    return req.session.admin_id != undefined;
}

function pass2hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function checkMail(email) {
    return email.match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
}

function paginate( page, pageSize) {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    return {
        offset,
        limit,
    };
};

module.exports = router;
