#トラップメール

仮想のsmtpテストサーバーです。

SMTPでメールを送信しても実際の宛先には飛ばさず確認することができる。

## システム要件

* node.js v10.8.0  
* npm 6.9.0  

## セットアップ手順
```
$ npm install

$ npm install --save sequelize sqlite3
```

### DB＆テーブル初期化
```
$ npx sequelize-cli db:migrate
```

### 初期データ投入
```
$ npx sequelize-cli db:seed:all
```

### 環境変数
```
$ mv .env_example .env
```

開発環境の場合、  
NODE_ENVをdevelopmentに変更しておく

## サーバー起動
```
$ npm start
```

### デーモン化する場合
```
$ npm install -g forever
$ forever start index.js // 起動
$ forever stop index.js // 停止
```

## テストメール送信
```
$ node bin/testsend.js --file test/sample.json
```


## 使い方

* フロント  
http://localhost:8080/ 

        email: test@test.jp  
        pass: hogehoge



* 管理画面  
http://localhost:8080/admin

        email: admin@admin.jp  
        pass: hogehoge

# その他

```
|--.env_example
|--.gitignore
|--.sequelizerc
|--README.md
|--assets
|  |--css
|  |  |--admin.css
|  |  |--common.css
|  |  |--login.css
|  |  |--main.css
|  |--img
|  |  |--login_logo.jpg
|  |  |--trapmail_logo.png
|  |--js
|  |--libs
|--bin
|  |--testsend.js
|--config
|  |--database.json
|  |--log.json
|--db
|  |--db.sqlite
|  |--migrations
|  |  |--.gitkeep
|  |  |--20200529165820-create-user.js
|  |  |--20200529165821-create-mailbox.js
|  |  |--20200529170521-create-rel-user-box.js
|  |  |--20200531030303-create-admin.js
|  |--seeders
|  |  |--.gitkeep
|  |  |--20200530052501-demo-user.js
|  |  |--20200530080502-demo-mailboxes.js
|  |  |--20200530080739-demo-rel_user_boxes.js
|  |  |--20200531030303-demo-admin.js
|  |--table.sql
|--index.js
|--logs
|  |--.gitkeep
|  |--access.log
|  |--db.log
|  |--http.log
|  |--smtp.log
|  |--socket.log
|  |--system.log
|--models
|  |--admins.js
|  |--index.js
|  |--mailboxes.js
|  |--rel_user_boxes.js
|  |--users.js
|--package-lock.json
|--package.json
|--router.js
|--ssl
|  |--mail-monitor.cert
|  |--mail-monitor.key
|--test
|  |--attachment.json
|  |--file.pdf
|  |--htmlmail.json
|  |--image.jpg
|  |--sample.json
|--views
|  |--_footer.ejs
|  |--_header.ejs
|  |--_header_nav.ejs
|  |--admin
|  |  |--_header.ejs
|  |  |--_header_nav.ejs
|  |  |--_js.ejs
|  |  |--_menu.ejs
|  |  |--_pagenate.ejs
|  |  |--admin.ejs
|  |  |--admin_detail.ejs
|  |  |--index.ejs
|  |  |--login.ejs
|  |  |--mailbox.ejs
|  |  |--mailbox_detail.ejs
|  |  |--user.ejs
|  |  |--user_detail.ejs
|  |--index.ejs
|  |--login.ejs
|  |--mailbox.ejs
|  |--setting.ejs
```
