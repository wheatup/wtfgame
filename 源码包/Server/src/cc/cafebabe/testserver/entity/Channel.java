package cc.cafebabe.testserver.entity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import cc.cafebabe.testserver.serverendpoint.Pack;

public class Channel {
	public static HashMap<Integer, Channel> channels = new HashMap<Integer, Channel>();
//	public static int MAX_ROOM_COUNT = 1;
	public static int MAX_ROOM_COUNT = 12;
	public static Channel getChannel(int id){
		if(channels.containsKey(id)){
			return channels.get(id);
		}else{
			return new Channel(id);
		}
	}
	
	public static void broadcastToAll(Pack pack){
		for(Channel c : channels.values()){
			c.broadcast(pack);
		}
	}
	
	private int id;
	private List<Player> players;
	public GameMode mode;

	private Channel(int id){
		this.id = id;
		this.players = new ArrayList<Player>();
		channels.put(id, this);
		
//		this.mode = new PlagueMode(this);
//		this.mode.start();
		if(this.id == 0){
			return;
		}
		
		if(this.id == -1){
			this.mode = new PYMode(this);
			this.mode.start();
		}else if(this.id % 2 != 0){
			this.mode = new RaceMode(this);
			this.mode.start();
		}else{
			this.mode = new PlagueMode(this);
			this.mode.start();
		}
	}

	public int getId() {
		return id;
	}

	public List<Player> getPlayers() {
		return players;
	}
	
	public void enter(Player player){
		if(this.mode != null){
			player.getGameData().setScore(0);
			player.send(Pack.buildKVPack("$room","mode", this.mode.getModeCode(), "id", this.getId(), "map", this.mode.getMap(), "time", this.mode.getTime(), "data", this.mode.getMapData()));
			this.mode.onJoin(player);
			if(players.size() > 0){
				List<Map<String, Object>> playerDatas = new ArrayList<Map<String, Object>>();
				try{
					for(Player p : players){
						HashMap<String, Object> b = new HashMap<String, Object>();
						b.put("name", p.getName());
						b.put("uuid", p.getUUID());
						b.put("title", p.title);
						if(this.mode instanceof RaceMode){
							b.put("scored", p.getGameData().isScored());
						}else if(this.mode instanceof PlagueMode){
							int inf = 0;
							
							if(((PlagueMode)(p.getChannel().mode)).zombiePlayers.contains(p)){
								inf = 1;
							}
							
							if(((PlagueMode)(p.getChannel().mode)).source == p){
								inf = 2;
							}
							
							b.put("infected", inf);
						}
						b.put("phone", p.getGameData().isPhone);
						b.put("score", p.getGameData().getScore());
						b.put("x", p.getGameData().getPosX());
						b.put("y", p.getGameData().getPosY());
						playerDatas.add(b);
					}
				}catch(Exception e){
					e.printStackTrace();
				}
				player.send(Pack.buildKVPack("$playerdata", playerDatas));
			}
		}
		
		
		
		this.players.add(player);
		
		if(this.id != 0){
			HashMap<String, Object> broad = new HashMap<String, Object>();
			broad.put("name", player.getName());
			broad.put("uuid", player.getUUID());
			broad.put("score", player.getGameData().getScore());
			broad.put("title", player.title);
			broadcastExceptSomeone(Pack.buildKVPack("$newplayer", broad), player);
		}
	}
	
	public void leave(Player player){
		this.players.remove(player);
		HashMap<String, Object> broad = new HashMap<String, Object>();
		broad.put("uuid", player.getUUID());
		broadcastExceptSomeone(Pack.buildKVPack("$leave", broad), player);
	}
	
	public void broadcast(Pack pack){
		for(int i = 0; i < this.players.size(); i++){
			Player p = this.players.get(i);
			if(p != null){
				p.send(pack);
			}
		}
	}
	
	public void broadcastExceptSomeone(Pack pack, Player thatOne){
		for(int i = 0; i < this.players.size(); i++){
			Player p = this.players.get(i);
			if(p != null && p != thatOne){
				p.send(pack);
			}
		}
	}
}
