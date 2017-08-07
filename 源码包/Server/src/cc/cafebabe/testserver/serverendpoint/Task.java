package cc.cafebabe.testserver.serverendpoint;

import javax.websocket.Session;

import cc.cafebabe.testserver.entity.Player;

public class Task {
	private Player player;
    private TaskType taskType;
    private String message;
    public Player getPlayer(){
    	return player;
    }
    public TaskType getTaskType() {
        return taskType;
    }
    public void setTaskType(TaskType taskType) {
        this.taskType = taskType;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public int getChannel(){
    	return player.getChannel().getId();
    }
    
    public Task(Session session, TaskType taskType, String message) {
        super();
        this.player = Player.getPlayer(session);
        if(this.player == null){
        	this.player = new Player(session);
        }
        
        this.taskType = taskType;
        this.message = message;
    }
}