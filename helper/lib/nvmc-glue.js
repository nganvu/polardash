(function () {
	var handler        = ((typeof(NVMCClient) != "undefined") ? (NVMCClient) : ({ }));
	var drawCanvasID   = "nvmc-canvas";
	var serverURL      = "ws://146.48.84.222:80";
	var animationRate  = 60.0;
	var simulationRate = 60.0;
	var defaultRace    = NVMC.DefaultRace;

	NVMC.setupGame({
		handler : handler,
		canvas  : drawCanvasID,
		race    : defaultRace,
		url     : serverURL,
		fps     : animationRate,
		ups     : simulationRate,
		onLoad  : function () {
			setInterval(function () {
				var game = handler.game;
				if (!game) return;
				document.getElementById("nvmc-fps"               ).innerHTML = "FPS : "                + Math.floor(handler.ui.framesPerSecond);
				document.getElementById("nvmc-latency"           ).innerHTML = "Latency : "            + Math.floor(game.latency) + " ms.";
				document.getElementById("nvmc-server-clock-delta").innerHTML = "Server Clock Delta : " + Math.floor(game.serverTicksDelta) + " ms.";
				document.getElementById("nvmc-server-time"       ).innerHTML = "Server Time : "        + game.serverTime;
			}, 1000);
		}
	});
})();
