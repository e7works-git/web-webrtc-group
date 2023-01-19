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

