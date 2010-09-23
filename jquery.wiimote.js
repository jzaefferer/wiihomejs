var wiiusej = Packages.wiiusej,
	System = java.lang.System,
	Thread = java.lang.Thread,
	Math = java.lang.Math,
	Runnable = java.lang.Runnable,
	Date = java.util.Date;

var console = {
	log: function(message) {
		println(message)
	}
}

var timeouts = {},
	timeoutId;
function setTimeout(callback, delay) {
	if (!delay)
		throw new Error("can't setTimeout without delay");
	var id = timeoutId++;
	timeouts[id] = {
		callback: callback,
		duetime: new Date().getTime() + delay,
		due: function() {
			return new Date().getTime() >= this.duetime;
		}
	}
	return id;
}
function clearTimeout(id) {
	delete timeouts(id);
}
function loop() {
	while (System['in'].available() == 0) {
		Thread.sleep(15);
		for (id in timeouts) {
			var timeout = timeouts[id];
			if (timeout.due()) {
				clearTimeout(id);
				timeout.callback();
			}
		}
	}
	wiiusej.WiiUseApiManager.definitiveShutdown();
}

function $(selector) {
	function empty() {
		return {
			bind: function() {}
		}
	}
	var mote;
	if (selector == "wiimote") {
		var wiimotes = wiiusej.WiiUseApiManager.getWiimotes(1, true);
		if (!wiimotes.length) {
			return empty();
		}
		mote = wiimotes[0];
	} else if (selector instanceof wiiusej.Wiimote) {
		mote = selector;
	} else {
		return empty();
	}
	return {
		bind: function(type, callback) {
			if (type == "motion") {
				var lastLevel = 
				mote.activateMotionSensing();
				mote.addWiiMoteEventListeners(new wiiusej.wiiusejevents.utils.WiimoteListener() {
					onStatusEvent: function(e) {
						var level = Math.round(e.getBatteryLevel() * 100);
						if (level != lastLevel) {
							console.log("Battery left: " + level + "%");
						}
						lastLevel = level;
					},
					onButtonsEvent: function(e) {
						if (e.isButtonHomeJustReleased()) {
							wiiusej.WiiUseApiManager.definitiveShutdown();
							System.exit(0);
						}
					},
					onMotionSensingEvent: function(event) {
						callback.call(mote, {
							rawAcceleration: {
								x: event.getRawAcceleration().getX(),
								y: event.getRawAcceleration().getY(),
								z: event.getRawAcceleration().getZ(),
							}
						});
					}
				});
				mote.getStatus();
			}
		},
		led: function(one, two, three, four) {
			mote.setLeds(!!one, !!two, !!three, !!four);
		}
	};
};

$("wiimote").bind("motion", function(event) {
	var mote = $(this);
	if (event.rawAcceleration.x > 200) {
		mote.led(1, 1, 1, 1);
		setTimeout(function() {
			mote.led(1, 1, 1, 0);
			setTimeout(function() {
				mote.led(1, 1, 0, 0);
				setTimeout(function() {
					mote.led(1, 0, 0, 0);
					setTimeout(function() {
						mote.led(0, 0, 0, 0);
					}, 150);
				}, 150);
			}, 150);
		}, 150);
	}
});

loop();