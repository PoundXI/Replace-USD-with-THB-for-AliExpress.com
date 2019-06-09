function saveOptions() {
	var value = parseFloat($("#thb2usdExchangeRate").val());
	value = $.isNumeric(value) ? value : 0;

	// display error message
	if (value < 20) { // should not less than 20
		$("#updateMessage").css('color', 'red');
		$("#updateMessage").html("ข้อมูลรับเข้าไม่ถูกต้อง");
		return false;
	}

	// save
	chrome.storage.local.set({
		thb2usdExchangeRate: float2decimalpoints( parseFloat( $("#thb2usdExchangeRate").val() ) )
	});

	// display success message
	$("#update-button").attr("disabled", "true");
	$("#updateMessage").css('color', 'green');
	$("#updateMessage").html("บันทึกการเปลี่ยนแปลงสำเร็จ");
}

function restoreOptions() {
	function onGot(storageConfig) {
		if (storageConfig.thb2usdExchangeRate != undefined) {
			$("#currentExchangeRate").text(formatNumber(storageConfig.thb2usdExchangeRate));
		} else {
			$("#currentExchangeRate").text(formatNumber(33.0));
		}
	}

	chrome.storage.local.get("thb2usdExchangeRate", onGot);
}

$(document).ready(function(){
	restoreOptions();

	$("#api_url").text(_exchangeRateAPI);
	$("#api_url").attr("href", _exchangeRateAPI);

	// get current USD to THB rate
	$.getJSON(_exchangeRateAPI, function(data) {
		var bankFeeRate = 1.03;
		var exchangeRate = float2decimalpoints(data.rates.THB);

		if (exchangeRate > 0) {
			$("#thb2usdExchangeRate").val(formatNumber(exchangeRate * bankFeeRate));
			// should stamp fecthing date, fetch only once a day
		}
	});

});

$("#update-button").click(function() {
	saveOptions();
});
