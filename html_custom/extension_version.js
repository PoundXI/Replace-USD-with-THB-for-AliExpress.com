$(document).ready(function() {
	var url = new URL(window.location.href);
	var version = url.searchParams.get("version");
	$('#version').text(version);
});
