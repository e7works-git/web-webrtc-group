let res, camWrap;

window.addEventListener('load', function() {
    // 리소스 로드
    if (res === undefined) {
        res = new resources('.toast', 400, 1000, 400);
    }
    camWrap = $('#wrap > section > div > article.contents > div.webcam > div.cam-area > div.cam-wrap');
});

function mic_on_off(item) {
    if (channel) {
        var chk = $(item).attr('class');
        var img = $(item).children('img')[0];
        var cam_mic = $('div[name=my_cam]').children('img')[0];
        if (chk == 'mic btn_on') {
            $(item).attr('class', 'mic btn_off');
            $(img).attr('src', 'img/webRTC/off_mic.png');
            $(cam_mic).show();
            res.toastPopup("마이크 꺼짐.");
        } else {
            $(item).attr('class', 'mic btn_on');
            $(img).attr('src', 'img/webRTC/on_mic.png');
            $(cam_mic).hide();
            res.toastPopup("마이크 켜짐.");
        }
    } else {
        res.toastPopup("로그인을 해주세요");
    }
}

function cam_on_off(item) {
    if (channel) {
        var chk = $(item).attr('class');
        var img = $(item).children('img')[0];
        var video = $('div[name=my_cam]').children('div.camvideo')[0];

        if (chk == 'cam btn_on') {
            $(item).attr('class', 'cam btn_off');
            $(img).attr('src', 'img/webRTC/off_cam.png');
            res.toastPopup("카메라 꺼짐.");
        } else {
            $(item).attr('class', 'cam btn_on');
            $(img).attr('src', 'img/webRTC/on_cam.png');
            res.toastPopup("카메라 켜짐.");
        }
    } else {
        res.toastPopup("로그인을 해주세요");
    }
}

function videoInit() {
    let myVideoTag
        // 채널에 local video or audio 추가시
    channel.on('rtcLocalStreamAppend', function(event) {
        let stream = event.target;
        let html = $('div[name=my_cam]', camWrap);
        if (!html.length) {
            html = $(res.myVideo);
            camWrap.append(html);
        }
        let video = $('video', html)[0];
        video.srcObject = stream;
    });
    // 채널에 local video or audio 삭제시 ( 종료시 정리 )
    channel.on('rtcLocalStreamRemove', function(event) {
        let html = $('div[name=my_cam]', camWrap);
        if (html.length) {
            html.remove();
        }
    });
    // 채널에 remote video or audio 추가시
    channel.on('rtcRemoteStreamAppend', function(event) {
        let stream = event.target;
        let html = $(`div[name=${event.clientKey}]`, camWrap);
        if (!html.length) {
            html = $(res.remoteVideo).attr({ name: event.clientKey });
            camWrap.append(html);
            $('.cam-name p', html).html(event.client.nickName);
        }
        let video = $('video', html)[0];
        video.srcObject = stream;

        $('.nocam', html).toggleClass('active', (stream.getVideoTracks().length == 0));
        $('.nomic', html).toggleClass('active', (stream.getAudioTracks().length == 0));
    });
    // 채널에 remote video or audio 삭제시 ( 영상채널 나감 )
    channel.on('rtcRemoteStreamRemove', function(event) {
        let html = $(`div.camvideo-wrap[name=${event.clientKey}]`, camWrap);
        if (html.length) {
            html.remove();
        }
    });
    // 채널에 local audio 변경시
    channel.on('rtcLocalAudioChanged', function(event) {
        let is_mic = event.enable;
        let html = $('div[name=my_cam]', camWrap);
        $('.nomic', html).toggleClass('active', !is_mic);
        $('.cam-footer .cam-btn .mic').off('.rtc').on('click.rtc', function() {
            channel.toggleRTCAudioControl(!is_mic);
        });
        // $('.cam-footer .cam-btn .mic').toggleClass('btn_on', is_mic).toggleClass('btn_off', !is_mic);
        // $('.cam-footer .cam-btn .mic img').attr('src',is_mic?'img/webRTC/on_mic.png':'img/webRTC/off_mic.png');
    });
    // 채널에 local video 변경시
    channel.on('rtcLocalVideoChanged', function(event) {
        let is_cam = event.enable;
        let html = $('div[name=my_cam]', camWrap);
        $('.nocam', html).toggleClass('active', !is_cam);
        $('.camvideo video', html).css('display', is_cam ? '' : 'none');
        $('.cam-footer .cam-btn .cam').off('.rtc').on('click.rtc', function() {
            channel.toggleRTCVideoControl(!is_cam);
        });
        // $('.cam-footer .cam-btn .cam').toggleClass('btn_on', is_cam).toggleClass('btn_off', !is_cam);
        // $('.cam-footer .cam-btn .cam img').attr('src',is_cam?'img/webRTC/on_cam.png':'img/webRTC/off_cam.png');
    });
    // 채널에 remote audio 변경시
    channel.on('rtcRemoteAudioChanged', function(event) {
        let is_mic = event.enable;
        let html = $(`div.camvideo-wrap[name=${event.clientKey}]`, camWrap);
        $('.nomic', html).toggleClass('active', !is_mic);
    });
    // 채널에 remote video 변경시
    channel.on('rtcRemoteVideoChanged', function(event) {
        let is_cam = event.enable;
        let html = $(`div.camvideo-wrap[name=${event.clientKey}]`, camWrap);
        $('.nocam', html).toggleClass('active', !is_cam);
        $('.camvideo video', html).css({ 'display': is_cam ? '' : 'none' });
    });
}

// video 태그 리소스
class resources {
    constructor(target, in_fi, in_de, in_fo) {
        this.toastLayer = $(target);
        this.fi = in_fi;
        this.de = in_de;
        this.fo = in_fo;
    }
    get myVideo() {
        return '<!-- 내 비디오 --><div class="camvideo-wrap" name="my_cam"><div class="camvideo"><video autoplay playsinline mute style="position: absolute;left: 0;top: 0;width: 100%;height: 100%;"></video><img src="img/webRTC/user.png" class="nocam" alt="영상없음"></div><img src="img/webRTC/nosound.png" class="nomic" alt="소리없음"><div class="cam-name"><p>나</p></div></div>';
    }
    get remoteVideo() {
        return '<div class="camvideo-wrap"><div class="camvideo"><video autoplay playsinline style="position: absolute;left: 0;top: 0;width: 100%;height: 100%;"></video><img src="img/webRTC/user.png" class="nocam" alt="영상없음"></div><img src="img/webRTC/nosound.png" class="nomic" alt="소리없음"><div class="cam-name"><p>사용자 이름 노출 영역입니다.</p></div></div>';
    }
    toastPopup(msg) {
        this.toastLayer.finish().fadeIn(this.fi).delay(this.de).fadeOut(this.fo).text(msg);
    }
}