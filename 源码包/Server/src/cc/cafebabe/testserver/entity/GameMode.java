package cc.cafebabe.testserver.entity;

import java.util.Map;

public abstract class GameMode extends Thread {
	public abstract String getModeCode();
	protected Channel channel;
	public GameMode(Channel channel){
		this.channel = channel;
	}
	
	public boolean running = false;
	public abstract void run();
	public abstract void stopPlay();
	public abstract void onJoin(Player player);
	public abstract void onLeave(Player player);
	public abstract int getTime();
	public abstract int getMap();
	public abstract Object getMapData();
	
	public abstract void handleMovePack(Player player, Map<String, Object> map);
}
