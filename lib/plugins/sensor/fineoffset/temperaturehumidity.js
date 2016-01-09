module.exports = function(ev) {
	if (ev.id && (ev.temp || ev.humidity)) {
		var obj = { id: ev.id }
		if (ev.temp) obj.temperature = parseFloat(ev.temp);
		if (ev.humidity) obj.humidity = parseFloat(ev.humidity);
		return obj
	}
}
