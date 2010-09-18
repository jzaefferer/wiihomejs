import java.io.FileReader;
import java.io.IOException;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

public class ScriptingLauncher {

	public static void main(String[] args) {
		try {
			ScriptEngine engine = new ScriptEngineManager().getEngineByName("javascript");
			FileReader fr = new FileReader("main.js");
			engine.eval(fr);
		} catch (IOException ioEx) {
			ioEx.printStackTrace();
		} catch (ScriptException scrEx) {
			scrEx.printStackTrace();
		}
	}

}
