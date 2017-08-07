package cc.cafebabe.testserver.entity;

import java.util.HashMap;
import java.util.Map;

import javax.websocket.Session;

import cc.cafebabe.testserver.serverendpoint.Pack;
import cc.cafebabe.testserver.util.Util;

public class Player {
	public static Map<Session, Player> playerMap = new HashMap<Session, Player>();
	public static Map<Long, Player> playerUUIDMap = new HashMap<Long, Player>();
	public static Map<String, Player> playerNameMap = new HashMap<String, Player>();
	
	public static long CURRENT_UUID = 0;
	
	private long uuid;
	private Session session;
	private Channel channel;
	private String name = "Unknown";
	private GameData gameData;
	public long lastMoveTime;
	public boolean online = true;
	public boolean logined = false;
	public boolean isAdmin = false;
	public String title = "";
	public long invincibleTime = 0;

	
	public static Player getPlayer(Session session){
		if(Player.playerMap.containsKey(session)){
			return Player.playerMap.get(session);
		}else{
			return null;
		}
	}
	
	public static Player getPlayer(long uuid){
		if(Player.playerUUIDMap.containsKey(uuid)){
			return Player.playerUUIDMap.get(uuid);
		}else{
			return null;
		}
	}
	
	public static Player getPlayer(String name){
		if(Player.playerNameMap.containsKey(name)){
			return Player.playerNameMap.get(name);
		}else{
			return null;
		}
	}
	
	public static int getPlayerCount(){
		return playerMap.size();
	}

	
	public Map<String, Object> extdata;
	
	public Player(Session session){
		this.session = session;
		this.setChannel(0);
		this.gameData = new GameData(this);
		Player.playerMap.put(session, this);
		this.lastMoveTime = System.currentTimeMillis();
		CURRENT_UUID++;
		this.uuid = CURRENT_UUID;
		playerUUIDMap.put(this.uuid, this);
	}
	
	public GameData getGameData() {
		return gameData;
	}
	public Channel getChannel() {
		return channel;
	}

	public void setChannel(int channel) {
		if(this.channel != null){
			this.channel.leave(this);
		}
		
		session.getUserProperties().put("channel", channel);
		this.channel = Channel.getChannel(channel);
		this.channel.enter(this);
	}
	
	public Session getSession(){
		return session;
	}
	
	public void send(Pack pack){
		try{
			String text = pack.toJSON().toString();
			String encodeText = Util.encode(text);
			this.session.getAsyncRemote().sendText(encodeText);
		}catch(Exception e){
			
		}
	}
	
	public void addTitle(String title){
		this.title = title;
		this.getChannel().broadcast(Pack.buildKVPack("$title", "uuid", this.getUUID(), "title", title));
	}
	
	public void logout(){
		this.online = false;
		
		try{
			if(this.getChannel() != null){
				this.getChannel().leave(this);
				if(this.getChannel().mode != null){
					this.getChannel().mode.onLeave(this);
				}
			}
			playerMap.remove(this.getSession());
			playerUUIDMap.remove(this.uuid);
			if(this.name != null){
				playerNameMap.remove(this.name);
			}
		}catch(Exception e){
			
		}
		
		try{
			this.session.close();
		}catch(Exception e){
			
		}
		
	}

	
	public long getUUID(){
		return this.uuid;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
}
