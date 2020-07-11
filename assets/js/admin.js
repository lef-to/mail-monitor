$(function(){

    $('#admin').map(function(){
        $('.del').click(function(){
            return confirm('本当に削除しますか？');
        });
    });

    $('#mailbox').map(function(){
        $(document).on('click', '.pagination li', function(){
            var page = $(this).data('page') || 1;
            $.getJSON('/api/admin/mailbox/' + page, function(json){
                if (json.page_max <= 1) {
                    $('.pagination').hide();
                }
                for (var i = 1; i < page_max; i++) {

                    var elm, active = '', li;
                    if (page == i) {
                        elm = 'span';
                        active = 'active';
                    } else {
                        elm = 'a';
                    }

                    li = '<li class="page-item" data-page="' + i + '" ' + active + '><' + elm + ' class="page-link">' + i + '</' + elm + '></li>';

                    $('.pagination next').before(li);
                }

                $('.pagination li.prev')[page == 1 ? 'addClass' : 'removeClass']('disabled');
                $('.pagination li.next')[page == json.page_max ? 'addClass' : 'removeClass']('disabled');
            });
        });

        $('.del').click(function(){
            return confirm('本当に削除しますか？');
        });
    });

    $('#user_detail').map(function(){
        $('.del').click(function(){
            return confirm('本当に削除しますか？');
        });
    });

    $('#user_detail').map(function(){
        $('#box_add').click(function(){
            var $target = $('select[name=mailboxes] option:selected');
            if ($target.val()) {
                $target.prop('disabled', true);
                var $li = $('<li class="list-group-item"><span class="title"></span><button type="button" class="close" aria-label="閉じる"><span aria-hidden="true">&times;</span></button><input type="hidden" name="mailbox_id[]"></li>');
                $li.find('.title').text($target.text());
                $li.find('input').val($target.val());
                $('.mailboxes').append($li);
                $('select[name=mailboxes]').val('');
            }
        });

        $(document).on('click', '.mailboxes li button', function(){
            var $target = $(this).closest('li');
            $('select[name=mailboxes] [value=' + $target.find('input').val() + ']').prop('disabled', false);
            $target.remove();
        });
    });


});
