var wiiusej = Packages.wiiusej,
	System = java.lang.System,
	Thread = java.lang.Thread;

var wiimotes = wiiusej.WiiUseApiManager.getWiimotes(1, true);
if (wiimotes.length == 0) {
	println("No Wiimote connected");
} else {
	var mote = wiimotes[0];
	var bPressed = false;
	mote.addWiiMoteEventListeners(new wiiusej.wiiusejevents.utils.WiimoteListener() {
		onButtonsEvent: function(e) {
			bPressed = e.isButtonBHeld()
			if (e.isButtonAHeld()) {
				mote.setLeds(true, true, true, true);
			} else {
				mote.setLeds(false, false, false, false);
			}
			if (e.isButtonHomeJustReleased()) {
				wiiusej.WiiUseApiManager.definitiveShutdown();
				System.exit(0);
			}
		},
		onMotionSensingEvent: function(e) {
			if (!bPressed) {
				return;
			}
			if (e.getRawAcceleration().getX() > 200) {
				println("woosh!");
			}
			if (e.getRawAcceleration().getY() > 200) {
				println("bam!");
			}
			if (e.getRawAcceleration().getY() > 200) {
				println("yoink");
			}
		}
	});
	mote.activateMotionSensing();
	while (System['in'].available() == 0) {
		Thread.sleep(500);
	}
	wiiusej.WiiUseApiManager.definitiveShutdown();
}
		
