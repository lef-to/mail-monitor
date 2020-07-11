
$(function(){
    var socketio = io();

    $('#breadcrumb').show();
    $('#breadcrumb .mbox_name a')
        .attr('href', '/mailbox/' + MAILBOX_ID)
        .text(MAILBOX_ID);

    socketio.emit('set_mailbox', MAILBOX_ID);

    socketio.on('message',function(msg){
        if (msg) {
            let mail = JSON.parse(msg);
            console.log(mail);
            let $li = $('.maillist li.template').clone();
            $li.removeClass('template');
            $li.data('data', msg);
            $li.find('.subject').text(mail.subject);
            $li.find('.email').text(mail.to.text);
            $li.find('.time').text(mail.datetime.split(' ')[1]);

            $li.click(function(){
                $('.maillist li').removeClass('active');
                $(this).addClass('active').removeClass('unread');

                let mail = JSON.parse($(this).data('data'));

                $('main .head .subject').text(mail.subject);
                $('main .head .from').text(mail.from.text);
                $('main .head .to').html(htmlEscape(mail.to.text).replace(/, /g, '<br />'));

                if (mail.cc) {
                    $('main .head .cc').parent().find('> :nth-child(n+5)').show();
                    $('main .head .cc').html(htmlEscape(mail.cc.text).replace(/, /g, '<br />'));
                } else {
                    $('main .head .cc').parent().find('> :nth-child(n+5)').hide();
                }

                if (mail.bcc) {
                    $('main .head .bcc').parent().find('> :nth-child(n+5)').show();
                    $('main .head .bcc').html(htmlEscape(mail.bcc.text).replace(/, /g, '<br />'));
                } else {
                    $('main .head .bcc').parent().find('> :nth-child(n+5)').hide();
                }

                $('main .head .date').text(mail.datetime);
                $('main .head .time').text(mail.time);
                $('main .head .size').text(mail.size);

                if (mail.attachments.length) {
                    $('main .head .attachement').show();
                    $('main .head .attachement').text('attachements (' + mail.attachments.length + ')');
                    $('main .head .attachement + .dropdown-menu :not(.template)').remove();
                    mail.attachments.forEach((obj, i) => {
                        const $row = $('main .head .attachement + .dropdown-menu .template').clone();
                        $row.removeClass('template');
                        $row.text(obj.filename);
                        $('main .head .attachement + .dropdown-menu').append($row);
                    });
                } else {
                    $('main .head .attachement').hide();
                }

                if (mail.text) {
                    $('main .body .nav-tabs [href="#text"]').removeClass('disabled').click();
                    $('main .body #text pre').html(mail.text);
                } else {
                    $('main .body .nav-tabs [href="#text"]').addClass('disabled');
                }

                if (mail.html) {
                    $('main .body .nav-tabs [href="#html"]').removeClass('disabled').click();
                    $('main .body #html div').html(mail.html);
                } else {
                    $('main .body .nav-tabs [href="#html"]').addClass('disabled');
                }

                let headers = $.map(mail.headerLines, function(v){ return v.line; }).join("\n");
                $('main .body #raw pre').text(headers +"\n\n"+ mail.text);

                $('main > div').show();

                $('#breadcrumb .subject').text(mail.subject).removeClass('text-hide');
            });
            $('.maillist').prepend($li);
        }
    });

    const htmlEscape = (str) => {
        if (!str) return;
        return str.replace(/[<>&"'`]/g, (match) => {
            const escape = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#39;',
                '`': '&#x60;'
            };
            return escape[match];
        });
    }
});
