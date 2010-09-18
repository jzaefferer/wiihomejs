var wiiusej = Packages.wiiusej,
	System = java.lang.System,
	Thread = java.lang.Thread
	Runnable = java.lang.Runnable,
	ScheduledThreadPoolExecutor = java.util.concurrent.ScheduledThreadPoolExecutor,
	MS = java.util.concurrent.TimeUnit.MILLISECONDS;

var executor;
function setTimeout(callback, delay) {
	if (!executor) {
		executor = new ScheduledThreadPoolExecutor(1);
	}
	executor.schedule(new Runnable() {
		run: function() {
			callback();
		}
	}, delay, MS);
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
				mote.activateMotionSensing();
				mote.addWiiMoteEventListeners(new wiiusej.wiiusejevents.utils.WiimoteListener() {
					onStatusEvent: function(e) {
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
			}
		},
		led: function(one, two, three, four) {
			mote.setLeds(!!one, !!two, !!three, !!four);
		}
	};
};

$("wiimote").bind("motion", function(e) {
	var mote = $(this);
	if (e.rawAcceleration.x > 200) {
		mote.led(0, 1, 1, 0);
		setTimeout(function() {
			mote.led(0, 0, 0, 0);
		}, 500);
	}
});

while (System['in'].available() == 0) {
	Thread.sleep(500);
}
wiiusej.WiiUseApiManager.definitiveShutdown();