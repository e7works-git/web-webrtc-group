$(function() {
    $('#content').keyup(function(e) {
        if ($(this).text().length > 200) {
            openError("글자수는 200자로 이내로 제한됩니다.");
            $(this).text(($(this).text()).substring(0, 200));
        }
        $('#counter').html(($(this).text()).length + '/200');
    });
    $('#content').keyup();

    $('#sendLike').click(function(e) {
        var url = `${BASE_URL}/api/openapi/like`;
        var param = {
            "room_id": channelKey,
            "log_cnt": 1
        };
        $.post(url, param, function(data) {
            if (data.result_cd == 1) {
                $('#likeCounter').html(data.like_cnt);
            } else {
                console.log("조회 실패")
            }
        }, "json");
    })
});

function likeInif() {
    var url = `${BASE_URL}/api/openapi/getLike`;
    var param = {
        "room_id": channelKey
    };
    $.post(url, param, function(data) {
        if (data.result_cd == 1) {
            $('#likeCounter').html(data.like_cnt);
        } else {
            console.log("조회 실패")
        }
    }, "json");

    
}