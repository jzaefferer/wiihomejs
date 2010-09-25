var wiiusej = Packages.wiiusej
	WiimoteListener = wiiusej.wiiusejevents.utils.WiimoteListener,
	System = java.lang.System,
	Thread = java.lang.Thread,
	Math = java.lang.Math;

var console = {
	log: function(message) {
		println(message)
	}
}

var timeouts = {},
	timeoutId = 0;
function setTimeout(callback, delay) {
	if (!delay)
		throw new Error("can't setTimeout without delay");
	var id = timeoutId++;
	timeouts[id] = {
		callback: callback,
		duetime: System.nanoTime() * 1000 + delay,
		due: function() {
			return System.nanoTime() * 1000 >= this.duetime;
		}
	}
	return id;
}
function clearTimeout(id) {
	delete timeouts[id];
}
function checkTimeouts() {
	for (id in timeouts) {
		var timeout = timeouts[id];
		if (timeout.due()) {
			clearTimeout(id);
			timeout.callback();
		}
	}
}
var running = false;
function loop() {
	if (running)
		return;
	running = true;
	while (System['in'].available() == 0) {
		Thread.sleep(15);
		checkTimeouts();
	}
	wiiusej.WiiUseApiManager.definitiveShutdown();
}
function exit(){
	wiiusej.WiiUseApiManager.definitiveShutdown();
	System.exit(0);
}

function $(selector) {
	function empty() {
		return {
			bind: function() {}
		}
	}
	var mote;
	if (selector == "wiimote") {
		var wiimotes = wiiusej.WiiUseApiManager.getWiimotes(1, false);
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
			if (type != "motion")
				return;
			var lastLevel;
			mote.activateMotionSensing();
			mote.addWiiMoteEventListeners(new WiimoteListener() {
				onStatusEvent: function(e) {
					var level = Math.round(e.getBatteryLevel() * 100);
					if (level != lastLevel) {
						console.log("Battery left: " + level + "%");
					}
					lastLevel = level;
				},
				onButtonsEvent: function(e) {
					if (e.isButtonHomeJustReleased()) {
						exit();
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
		},
		led: function(one, two, three, four) {
			mote.setLeds(!!one, !!two, !!three, !!four);
		}
	};
};

var counter = 0,
	started = false;
	
function stagger(delay, events) {
	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		setTimeout(event, delay * (i + 1));
	}
}

$("wiimote").bind("motion", function(event) {
	var mote = $(this);
	if (started && event.rawAcceleration.x > 240) {
		counter++;
		console.log(counter);
		mote.led(1, 1, 1, 1);
		stagger(150, [
			function() { mote.led(1, 1, 1, 0); },
			function() { mote.led(1, 1, 0, 0); },
			function() { mote.led(1, 0, 0, 0); },
			function() { mote.led(0, 0, 0, 0); }
		]);
	}
});

stagger(1000, [ 
		function() { console.log("In 3...") },
		function() { console.log("In 2...") },
		function() { console.log("In 1..."); },
		function() { console.log("Go!"); started = true; }
	]
);
setTimeout(function() {
	$("wiimote").led(0, 0, 0, 0);
	console.log("And finish! Your score is " + counter);
	exit();
}, 8000);

// TODO move into code that actually needs the loop to work (bind motion/setTimeout)
loop();
