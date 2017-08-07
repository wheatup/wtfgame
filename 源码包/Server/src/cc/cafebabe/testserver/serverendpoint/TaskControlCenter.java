package cc.cafebabe.testserver.serverendpoint;

import java.util.HashMap;
import java.util.Map;

public class TaskControlCenter {
	private static Map<Integer, TaskHandler> handlers = new HashMap<Integer, TaskHandler>();
	
	public static void addTask(Task task){
		int channel = task.getChannel();
		if(handlers.containsKey(channel)){
			handlers.get(channel).addTask(task);
		}else{
			TaskHandler handler = new TaskHandler(channel);
			handlers.put(channel, handler);
			handler.start();
			handler.addTask(task);
		}
	}
}
