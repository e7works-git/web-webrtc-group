const { RoomInit, Trans, FileUtil, OpenGraph, Util } = e7lib;
const BASE_URL = location.host == "dev.vchatcloud.com" ? "https://dev.vchatcloud.com" : "https://vchatcloud.com";
let vChatCloud;

// const dhd = new VChatCloud();
let channel, userNick, userKey, channelKey;
let pw, email;
const lock = { pw: false, email: false };

var getParameters = (paramName) => {
  // 리턴값을 위한 변수 선언
  let returnValue;
  // 현재 URL 가져오기
  let url = location.search;
  // get 파라미터 값을 가져올 수 있는 ? 를 기점으로 slice 한 후 split 으로 나눔
  let parameters = url.slice(1).split("&");
  console.log("parameters", parameters);
  // 나누어진 값의 비교를 통해 paramName 으로 요청된 데이터의 값만 return
  for (let i = 0; i < parameters.length; i++) {
    let varName = parameters[i].split("=")[0];
    if (varName.toUpperCase() == paramName.toUpperCase()) {
      returnValue = parameters[i].split("=")[1];
      return decodeURIComponent(returnValue);
    }
  }
};

$(function () {
  channelKey = getParameters("channelKey");
  try {
    email = Util.dataEmailPaser(getParameters("data"));
  } catch(e) {
    email = "";
  }
  let p = $("div.login").show(),
    c = $("div.chat_field1").hide();

  new RoomInit(channelKey, function (roomData) {
    if (roomData.lock() === "Y") {
      switch (roomData.lockType()) {
        case "PW":
          lock.pw = true;
          break;
        case "EM":
          lock.email = true;
          break;
        case "ALL":
          lock.pw = true;
          lock.email = true;
          break;
      }
    }
    const CONSTRAINTS = {
      video: {
        width: { ideal: roomData.resolution() ? roomData.resolution() *4 /3 : 320 },
        height: { ideal: roomData.resolution() ? roomData.resolution() : 240 },
      },
      audio: { echoCancellation: true, noiseSuppression: true },
    };
    vChatCloud = new VChatCloud({ url: Util.Config.chatUrl }, CONSTRAINTS);
  });

  $("button.popupbtn", p).click(async function () {
    let r = { nick: $("input#name", p).val() };
    if (r.nick) {
      $("div.chat_input div.name").text(r.nick);
      let joined = false;
      const entryDiv = $("#entry");
      while (!joined) {
        await new Promise((resolve, reject) => {
          if (lock.pw || lock.email) {
            entryDiv.css("display", "flex");
            $(".entry_form").hide();
            if (lock.pw) {
              $(".entry_form.pw").show();
            }
            if (lock.email && !email) {
              $(".entry_form.id").show();
            } else {
              resolve(true);
            }

            $(".entry_btnwrap .submit", entryDiv).on("click", () => {
              pw = $(".entry_form.pw input").val();
              if (!email) {
                email = $(".entry_form.id input").val();
              }
              resolve(true);
            });
            $(".entry_btnwrap .cancel", entryDiv).on("click", () => {
              entryDiv.css("display", "none");
              $(".entry_form.pw input").val("");
              $(".entry_form.id input").val("");
              reject(false);
            });
            $(".entry_form input").on("keypress", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                $(".entry_btnwrap .submit", entryDiv).trigger("click");
              }
            });
          } else {
            resolve(true);
          }
        }).then(
          () =>
            new Promise((resolve) => {
              const clientKey = "xxxxxxxxxxxx".replace(/[xy]/g, function (a, b) {
                return (b = Math.random() * 16), (a == "y" ? (b & 3) | 8 : b | 0).toString(16);
              });
              joinRoom(
                {
                  roomId: channelKey,
                  clientKey: email ?? clientKey,
                  nickName: r.nick,
                  ...(lock.pw && pw ? { password: pw } : {}),
                },
                function (err, history) {
                  if (err) {
                    if ((err.code === 10114) | (err.code === 10115)) {
                      pw = "";
                      if (err.code === 10114) {
                        email = "";
                        $(".entry_form.id").show();
                      }
                      $(".entry_contents_subtitle").show();
                      p.show();
                      c.hide();
                      vChatCloud.disconnect();
                    } else {
                      openError(err.code, function () {
                        p.show();
                        c.hide();
                        vChatCloud.disconnect();
                      });
                    }
                  } else {
                    // 채팅영역에 글쓰기가 활성화될시 활성화
                    let noticeMsgCnt = 0;
                    if (typeof write == "function")
                      history &&
                        history.forEach(function (m) {
                          if (m.messageType == "notice") {
                            if (noticeMsgCnt == 0) {
                              noticeMsgCnt++;
                              write(m, "notice", true);
                            }
                          } else {
                            write(m, "", true);
                          }
                        });
                    p.hide();
                    c.show();
                    $(".entry_contents_subtitle").hide();

                    // 이벤트 바인딩 시작
                    chatInit();
                    personalInit();
                    msgInit();
                    likeInif();
                    videoInit();

                    entryDiv.css("display", "none");
                    joined = true;

                    // 방 이름
                    $("#wrap > section > div > article.contents > div.webcam > div.cam-footer > p.roomtitle").text(
                      channel.roomName
                    );
                  }
                  resolve();
                }
              );
            })
        );
      }
    } else {
      res.toastPopup("대화명을 입력해 주세요");
    }
  });
  $("div.chat_name a.closebtn").click(function () {
    exit(p, c);
  });

  $(".exit.btn_on").click(function () {
    exit(p, c);
  });

  $("div.webcam div.cam-footer li.screen").click(function () {
    if (channel) {
      channel.toggleRTCMedia("display");
    } else {
      console.log("채널 객체가 없음.");
    }
  });
});

function exit(p, c) {
  if (channel) {
    var exit_chk = confirm("종료 하시겠습니까?");
    if (!exit_chk) return;

    $("#wrap > section > div > article.contents > div.webcam > div.cam-footer > p.roomtitle").text("");
    p.show();
    c.hide();
    $(".cam-footer .cam-btn .mic").off("click.rtc");
    $(".cam-footer .cam-btn .cam").off("click.rtc");
    vChatCloud.disconnect();
    $("#likeCounter").text("0");
    channel = undefined;
  } else {
    res.toastPopup("로그인을 해주세요");
  }
}

function joinRoom({ roomId, clientKey, nickName, password }, callback) {
  // vchatcloud 객체
  channel = vChatCloud.joinChannel(
    {
      roomId: roomId,
      clientKey: clientKey,
      nickName: nickName,
      ...(lock.pw && pw ? { password } : {}),
    },
    function (error, history) {
      $("div.entery, div.chatout, div.notice, div.whisper, div.content").remove();
      if (error) {
        if (callback) return callback(error, null);
        return error;
      }
      if (callback) callback(null, history);
      // 채팅영역에 글쓰기가 활성화될시 활성화
      if (typeof write == "function")
        write(
          "실시간 채팅에 오신 것을 환영합니다. 개인정보를 보호하고 커뮤니티 가이드를 준수하는 것을 잊지 마세요!",
          "notice"
        );
    }
  );
}

function getRoomInfo() {
  const api_url = `${BASE_URL}/api/openapi/getChatRoomInfo`;
  let param = {
    room_id: channelKey,
  };
  $.post(
    api_url,
    param,
    function (data) {
      if (data.result_cd == 1) {
        console.log(data);
        // $("#roomNm").append(data.param.room_nm);
      } else {
        console.log("조회 실패");
        res.toastPopup("조회 실패");
      }
    },
    "json"
  );
}

function openError(code, callback) {
  let p = $("div.errorpopup").hide();
  if (errMsg[code] == undefined) {
    $("p:nth-child(2)", p).text(code);
  } else {
    $("p:nth-child(2)", p).text(errMsg[code].kor);
  }
  $("a", p)
    .off()
    .click(function () {
      p.hide();
      if (typeof callback == "function") {
        callback();
      }
    });
  p.show();
}
