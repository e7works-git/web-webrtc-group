var ttt;
$(function() {
    // 이모지콘 넣기위해 기능이 있는지 확인
    if (!String.fromCodePoint)(function(stringFromCharCode) {
        var fromCodePoint = function(_) {
            var codeUnits = [],
                codeLen = 0,
                result = "";
            for (var index = 0, len = arguments.length; index !== len; ++index) {
                var codePoint = +arguments[index];
                // correctly handles all cases including `NaN`, `-Infinity`, `+Infinity`
                // The surrounding `!(...)` is required to correctly handle `NaN` cases
                // The (codePoint>>>0) === codePoint clause handles decimals and negatives
                if (!(codePoint < 0x10FFFF && (codePoint >>> 0) === codePoint))
                    throw RangeError("Invalid code point: " + codePoint);
                if (codePoint <= 0xFFFF) { // BMP code point
                    codeLen = codeUnits.push(codePoint);
                } else { // Astral code point; split in surrogate halves
                    // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                    codePoint -= 0x10000;
                    codeLen = codeUnits.push(
                        (codePoint >> 10) + 0xD800, // highSurrogate
                        (codePoint % 0x400) + 0xDC00 // lowSurrogate
                    );
                }
                if (codeLen >= 0x3fff) {
                    result += stringFromCharCode.apply(null, codeUnits);
                    codeUnits.length = 0;
                }
            }
            return result + stringFromCharCode.apply(null, codeUnits);
        };
        try { // IE 8 only supports `Object.defineProperty` on DOM elements
            Object.defineProperty(String, "fromCodePoint", {
                "value": fromCodePoint,
                "configurable": true,
                "writable": true
            });
        } catch (e) {
            String.fromCodePoint = fromCodePoint;
        }
    }(String.fromCharCode));
    // 이모지콘 div를 밀어넣는 부분
    for (var i = 0; i < 18; i++) {
        var code = 0x1F600 + i;
        $('div.chat_input div.emoji_contents').append($('<a>', { href: '#none' }).css({ 'font-size': '20px'}).html(String.fromCodePoint(code)));
    }
    // 이모지콘 / 키보드 아이콘 토글
    $(".ico_emoji").click(function() {
        $("div.emoji_contents").show();
        $("a.ico_emoji").removeClass("show");
        $("a.ico_keyboard").addClass("show");
        $(".middle").addClass("height01");
    })
    $(".ico_keyboard").click(function() {
        $("div.emoji_contents").hide();
        $("a.ico_emoji").addClass("show");
        $("a.ico_keyboard").removeClass("show");
        $(".middle").removeClass("height01");
    })
});

$(function() {
    // 이모지 버튼 
    $('div.chat_input div.emoji_contents a').click(function() {
        channel.sendMessage({
            message: $(this).text(),
            mimeType: 'emoji'
        });
    });

    // 클릭 버튼
    $('li.btn_send').click(function(e) {
        channel.sendMessage({
            message: $('#content').text(),
            mimeType: "text"
        })
        $('#content').text('');
        $('#content').focus();
    })

    // 입력창 엔터
    $('#content').keydown(function(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            channel.sendMessage({
                message: $(this).text(),
                mimeType: "text"
            })
            $(this).text('');
        }
    })

    // 특정 유저로 메시지 전송
    let popupLayer = $('div.popupLayer');
    let whisperLayer = $('ul.popup_content li:nth-child(1)', popupLayer);
    popupLayer.close = function() {
        $('#whisper input[type=text][name=message]', whisperLayer).val('');
        $("#whisper", this).hide();
        $(this).hide();
    }
    $('button', whisperLayer).click(function(e) {
        channel.sendWhisper({
            message: $('input[type=text][name=message]', whisperLayer).val(),
            receivedClientKey: popupLayer.data()['clientKey']
        }, function(err, msg) {
            if (err)
                return openError(err.code);
            write(msg, 'whisperto')
        })
        e.preventDefault();
        popupLayer.close();
    });
    // 신고하기
    $('ul.popup_content li:nth-child(2)', popupLayer).click(function(e) {
        // API 콜한다
        let url = `${BASE_URL}/api/openapi/insertChatBanUser`;

        let param = {
            "room_id": popupLayer.data()['roomId'],
            "buser_nick": popupLayer.data()['nickName'],
            "buser_msg": popupLayer.data()['message'],
            "buser_chat_id": popupLayer.data()['clientKey']
        };
        console.log(param);
        $.post(url, param, function(data) {
            if (data.result_cd != 1) {
                console.log("추방 실패")
            }
        }, "json");
        popupLayer.close();
    });
})

function chatInit() {
    // 신규 메시지 이벤트
    channel.onNotifyMessage = function(event) {
        if (event.grade == 'userManager'){
            write(event, 'userManager')
        }else { 
            write(event)
        }
    }

    // 개인 귓속말 메시지 이벤트
    channel.onPersonalWhisper = function(event) {
        write(event, 'whisper')
    }
}

function personalInit() {

    // 글쓰기 제한 이벤트
    channel.onPersonalMuteUser = function(event) {
        openError("글쓰기가 제한되었습니다.")
    }

    // 글쓰기 제한 해제 이벤트
    channel.onPersonalUnmuteUser = function(event) {
        openError("글쓰기 제한이 해제되었습니다.")
    }
}

function msgInit() {
    // 공지사항 메시지
    channel.onNotifyNotice = function(event) {
        write(event, 'notice')
    }

    // 유저 입장
    channel.onNotifyJoinUser = function(event) {
        if (channel.clientKey != event.clientKey) {
            write(event, 'join')
        }
    }

    // 유저 나감
    channel.onNotifyLeaveUser = function(event) {
        write(event, 'leave')
    }

    // 유저 추방
    channel.onNotifyKickUser = function(event) {
        write("'<font color='blue'><b>" + event.nickName + "</b></font>' 님이 채팅방에서 추방되었습니다.");
    }

    // 유저 추방 해제
    channel.onNotifyUnkickUser = function(event) {
        write("'<font color='blue'><b>" + event.nickName + "</b></font>' 님이 채팅방에서 추방 해제되었습니다.");
    }

    // 글쓰기 제한
    channel.onNotifyMuteUser = function(event) {
        write("'<font color='blue'><b>" + event.nickName + "</b></font>' 님의 글쓰기가 제한되었습니다.");
    }

    // 글쓰기 제한 해제
    channel.onNotifyUnmuteUser = function(event) {
        write("'<font color='blue'><b>" + event.nickName + "</b></font>' 님의 글쓰기가 제한 해제되었습니다.");
    }

    // 커스텀 메시지
    channel.onNotifyCustom = function(event) {
        // {"roomId":"QljHXvApdB-hSKvfNLD2y-20200902153935","message":"{\"msg\":\"이벤트에 응모하시겠습니까?\",\"msgType\":\"event\",\"type\":\"popup\"}","nickName":"운영자","clientKey":"","mimeType":"text","messageDt":"20200904162501","messageCount":17}
        var custom = JSON.parse(event.message)    
        if (custom.type == "allExit") {
            vChatCloud.disconnect() // 클라이언트에서 채팅방을 나갈수 있도록 한다.
            //alert('채팅방이 종료되었습니다.')
            write(event, 'allExit')
            return;
        }

        try {
            if(event.type =="profile"){
                return;
            }
            if (custom.type == "popup") {
                openPopup(custom.msg, function(val) {
                }, false);
            } else if (custom.type == "notice") {
                write(custom.msg, 'notice')
            } else {
                openPopup(JSON.stringify(custom), function(val) {
                }, true);
            }
        } catch (e) {
            openPopup(JSON.stringify(event.message), function(val) {
            }, true);
        }
    };
}
// $('a:nth-child(1)', $('div.custompopup')) 
function openPopup(msg, callback, option) {
    var p = $('div.custompopup').hide();
    $('p:nth-child(1)', p).text(msg);
    $('a:nth-child(2)', p).off().click(function() { p.hide(); if (typeof callback == 'function') { callback("확인") } });
    if (option) {
        $('a:nth-child(3)', p).hide();
    } else {
        $('a:nth-child(3)', p).show();
        $('a:nth-child(3)', p).off().click(function() { p.hide(); if (typeof callback == 'function') { callback("취소") } });
    }
    p.show();
}

// 도움말 팝업 열기
$(function(){
	$(".help").click(function () {
        $(".use_help").show();
    })
});

// 도움말 팝업 닫기
$(function(){
	$(".btn_help_close").click(function () {
        $(".use_help").hide();
    })
});

// 채팅창 숨기기
$(function(){
	$(".btn_hide").click(function () {
        $(".chat_field").hide();
        $(".btn_show").addClass("show");
        $(".btn_hide").removeClass("show");
    })
});

// 채팅창 보이기
$(function(){
	$(".btn_show").click(function () {
        $(".chat_field").show();
        $(".btn_hide").addClass("show");
        $(".btn_show").removeClass("show");
    })
});

$(function() {
    // 귓속말 팝업
    $(".ico_whisper").click(function() {
        $("#whisper").show();
    })

    // 팝업 외 마우스 클릭 시 팝업 닫힘
    $(document).mouseup(function(e) {
        let container = $('.popupLayer');
        if (container.has(e.target).length === 0) {
            container.hide();
            $("#whisper").hide();
        }
    });
});

function openLayer(e) {
    let sWidth = window.innerWidth;
    let sHeight = window.innerHeight;
    let oWidth = $('.popupLayer').width();
    let oHeight = $('.popupLayer').height();
    let fWidth = $("#chat").offset().left;
    let fHeight = $("#chat").offset().top;
    let cHeight = $("#content1").height();
    // 레이어가 나타날 위치를 셋팅한다.
    var divLeft = e.clientX - fWidth + $('html').scrollLeft();
        var divTop = e.clientY - fHeight + $('html').scrollTop();
    // 레이어가 화면 크기를 벗어나면 위치를 바꾸어 배치한다.
    if (divLeft + oWidth > sWidth) divLeft -= oWidth;
    if (divTop + oHeight > sHeight) divTop -= oHeight;
    if (divTop > (cHeight - oHeight)) {
        divTop = divTop - oHeight;
    }
    $('.popupLayer').data($(this).data()).css({
        "top": Math.max(0, divTop),
        "left": Math.max(0, divLeft),
        "position": "absolute",
        "z-index": 1
    }).show();
    $("#whisper").show();
}

// 접속, 퇴장, 귓속말, 공지사항 문구 html ADD
function write(msg, tp, pre) {
    let cl = $('div.chat div#content1');
    let cc = $('<div>', { class: 'chat-content' });
    switch (tp) {
        case 'join':
            cc = $('<div>', { class: 'entery' });
            cc.append($('<span>').html('<b>' + msg.nickName + '</b>님이 입장하셨습니다.'));
            break;
        case 'leave':
            cc = $('<div>', { class: 'chatout' });
            cc.append($('<span>').html('<b>' + msg.nickName + '</b>님이 나가셨습니다.'));
            break;
        case 'notice':                                
            cc = $('<div>', { class: 'notice' });
            cc.append($('<span><i class="fas fa-flag"></i></span>'));
            cc.append($('<span>').html(typeof msg == 'string' ? msg : msg.message));
            break;
        case 'whisper':
            cc = $('<div>', { class: 'whisper' });
            cc.append($('<span><i class="fas fa-comment-alt"></i></span>'));
            cc.append(
                $('<ul>')
                .append($('<li>').append($('<a href="#!" class="name">').html(msg.nickName).data(msg).on({ click: openLayer })).append(document.createTextNode('님의 귓속말')))
                .append($('<li class="comment">').text(msg.message))
            );
            break;
        case 'whisperto':
            cc = $('<div>', { class: 'whisper' });
            cc.append($('<span><i class="fas fa-comment-alt"></i></span>'));
            cc.append(
                $('<ul>')
                .append($('<li>').append($('<a href="#!" class="name">').html(msg.receivedNickName)).append(document.createTextNode('님에게 귓속말')))
                .append($('<li class="comment">').text(msg.message))
            );
            break;
        case 'allExit':
            $('div.login').show();
            $('div.chat_field1').hide();
            cc = $('<div>', { class: 'entery' });
            cc.append($('<span>').html('<b>채팅방을 종료합니다..</b>'));
            break;
        case 'userManager':
            cc = $('<div>', { class: 'content admin' });
            if (typeof msg == 'string') {
                cc.append($('<a class="name" href="#!">').text(''));
                cc.append($('<span class="">').html(msg));
            } else if (typeof msg == 'object' && msg.message) {
                if (channel.clientKey != msg.clientKey) {
                    cc.append($('<a class="name" href="#!">').text(msg.nickName).data(msg).on({ click: openLayer }));
                } else {
                    cc.append($('<a class="name" href="#!">').text(msg.nickName));
                }
                cc.append($('<span class="">').html(msg.message));
            }
            break;
        default:
            cc = $('<div>', { class: 'content' });
            if (typeof msg == 'string') {
                cc.append($('<a class="name" href="#!">').text(''));
                cc.append($('<span class="comment">').html(msg));
            } else if (typeof msg == 'object' && msg.message) {
                if (channel.clientKey != msg.clientKey) {
                    cc.append($('<a class="name" href="#!">').text(msg.nickName).data(msg).on({ click: openLayer }));
                } else {
                    cc.append($('<a class="name" href="#!">').text(msg.nickName));
                }
                cc.append($('<span class="comment">').html(msg.message));
            }
    };
    if(pre){
        cl.prepend(cc);
    } else {
        cl.append(cc);
    }
    $('div.chat div.chat_contents').scrollTop(cl.height());
}