/* 팝업창 노출 위치*/
$(function(){

	/* 클릭 클릭시 클릭을 클릭한 위치 근처에 레이어가 나타난다. */
	$('.name').click(function(e)
	{
		var sWidth = window.innerWidth;
		var sHeight = window.innerHeight;

		var oWidth = $('.popupLayer').width();
		var oHeight = $('.popupLayer').height();

		var fWidth = $("#chat").offset().left;
    	var fHeight = $("#chat").offset().top;
    	
    	var cHeight = $("#content1").height();

     	console.log("cHeight :"+cHeight)

		// 레이어가 나타날 위치를 셋팅한다.
		var divLeft = e.clientX - fWidth;
		var divTop = e.clientY - fHeight;

		// 레이어가 화면 크기를 벗어나면 위치를 바꾸어 배치한다.
		if( divLeft + oWidth > sWidth ) divLeft -= oWidth;
		if( divTop + oHeight > sHeight ) divTop -= oHeight;

		if(divTop > (cHeight-oHeight)){
			divTop = divTop -oHeight;
		}

		// 레이어 위치를 바꾸었더니 상단기준점(0,0) 밖으로 벗어난다면 상단기준점(0,0)에 배치하자.
		if( divLeft < 0 ) divLeft = 0;
		if( divTop < 0 ) divTop = 0;

		$('.popupLayer').css({
			"top": divTop,
			"left": divLeft,
			"position": "absolute"
		}).show();
	});

});

/* 팝업 외 마우스 클릭 시 팝업 닫힘 */
$(function(){

	$(document).mouseup(function (e){
		var container = $('.popupLayer');
	    	if( container.has(e.target).length === 0){
	    container.hide();
	    $("#whisper").hide();
	    }
	});

});

/* 귓속말 input box 노출*/
$(function(){
	$(".ico_whisper").click(function () {
        $("#whisper").show();
    })
});