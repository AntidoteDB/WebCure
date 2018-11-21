/*jshint esversion: 6 */

$(document).ready(function(){
	let $spans = $('#close-1, #close-2');	
	
	$spans.each(function (i, elem){
		$(elem).on('click', function(){
			let $popups = $('#modelPop-1, #modelPop-2');	
			
			$popups.each(function (i, elem) {		
				$(elem).css('display','none');
		});
    });
		});
});

function openModel(calendarId)
{
	    if (typeof calendarId === "object"){
        calendarId = parseInt(calendarId.id.match(/\d/)[0]);
    }
		model = document.getElementById('modelPop-'+calendarId);
		model.style.display = "block";
}
