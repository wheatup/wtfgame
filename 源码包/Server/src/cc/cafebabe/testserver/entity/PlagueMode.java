package cc.cafebabe.testserver.entity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import cc.cafebabe.testserver.serverendpoint.Pack;

public class PlagueMode extends GameMode{
	private int totalTime = 100;
	private int hangTime = 5;
	private int time = 0;
	private int currentMap = 0;
	private int totalMap = 4;
	private int tick = 0;
	private List<Integer> maps;
	private Object mapData = null;
	public int multi = 1;
	
	public List<Player> zombiePlayers;
	public List<Player> healthyPlayers;
	public List<Player> orgPlayers;
	public Player source;
	
	public PlagueMode(Channel channel) {
		super(channel);
		this.currentMap = 0;
		this.zombiePlayers = new ArrayList<Player>();
		this.healthyPlayers = new ArrayList<Player>();
		this.orgPlayers = new ArrayList<Player>();
		this.maps = new ArrayList<Integer>();
		for(int i = 0; i < this.totalMap; i++){
			maps.add(i+1);
		}
		Collections.shuffle(maps);
		setTime();
	}
	
	public void setTime(){
		this.time = this.totalTime;
	}

	@Override
	public void run(){
		this.running = true;
		int tempMap = 0;
		this.orgPlayers.addAll(channel.getPlayers());
		this.healthyPlayers.addAll(channel.getPlayers());
		long delta = 0;
		while(this.running){
			tempMap = this.currentMap;
			long lastTickTime = System.currentTimeMillis();
			
			try {
				Thread.sleep(100);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			
			
			delta += System.currentTimeMillis() - lastTickTime;
			while(delta >= 1000){
			
				this.time--;
				delta-=1000;
				
				if(this.time == totalTime - 5){
					channel.broadcast(Pack.buildKVPack("$broad", "text", "即将释放瘟疫感染源"));
				}
				
				
				if(this.time == totalTime - 10){
					setInfectSource();
				}
				
				
				if(tempMap == this.currentMap && this.time <= 0){
					
					if(this.time == 0){
						this.survive();
					}
					
					this.hangTime--;
					if(this.hangTime <= 0){
						this.hangTime = 5;
						this.switchMap();
					}
					
				}
				this.tick();
			}
		}
	}
	
	private void survive() {
		try{
			List<Player> fullScorePlayers = new ArrayList<Player>();
			List<Player> survivePlayers = new ArrayList<Player>();
			for(int i = 0; i < this.healthyPlayers.size(); i++){
				Player player = this.healthyPlayers.get(i);
				if(player != null){
					if(orgPlayers.contains(player)){
						if(this.channel.getPlayers().size() > 2){
							player.getGameData().addScore(5);
						}
						//player.checkTitle();
						fullScorePlayers.add(player);
					}else{
						if(this.channel.getPlayers().size() > 2){
							player.getGameData().addScore(3);
						}
						//player.checkTitle();
						survivePlayers.add(player);
					}
				}
			}
			
			List<Map<String, Object>> fullDatas = new ArrayList<Map<String, Object>>();
			for(Player p : fullScorePlayers){
				Map<String, Object> b = new HashMap<String, Object>();
				b.put("uuid", p.getUUID());
				fullDatas.add(b);
			}
			if(this.channel.getPlayers().size() > 2){
				channel.broadcast(Pack.buildKVPack("$fullsur", fullDatas));
			}
			
			List<Map<String, Object>> surDatas = new ArrayList<Map<String, Object>>();
			for(Player p : survivePlayers){
				Map<String, Object> b = new HashMap<String, Object>();
				b.put("uuid", p.getUUID());
				surDatas.add(b);
			}
			if(this.channel.getPlayers().size() > 2){
				channel.broadcast(Pack.buildKVPack("$sur", surDatas));
			}
			
			
		}catch(Exception e){
			e.printStackTrace();
		}
	}
	
	public void setInfectSource() {
		if(channel.getPlayers().size() >= 2){
			try{
				Player p = channel.getPlayers().get((int)(Math.random() * channel.getPlayers().size()));
				if(p != null){
					if(!this.zombiePlayers.contains(p)){
						this.zombiePlayers.add(p);
					}
					
					if(this.healthyPlayers.contains(p)){
						this.healthyPlayers.remove(p);
					}
					source = p;
					channel.broadcast(Pack.buildKVPack("$source", "uuid", p.getUUID()));
				}
			}catch(Exception e){
				e.printStackTrace();
			}
		}
	}

	@Override
	public void stopPlay() {
		this.running = false;
	}

	@Override
	public int getTime() {
		return time;
	}
	
	@Override
	public int getMap(){
//		return 4;
		return maps.get(this.currentMap);
	}
	
	private void tick() {
		this.tick++;
		if(this.time < this.totalTime - 15 && this.tick % 5 == 0){
			if(this.zombiePlayers.size() <= 0){
				this.setInfectSource();
			}
		}
		
		if(this.time == 50){
			List<Map<String, Object>> surDatas = new ArrayList<Map<String, Object>>();
			for(Player p : healthyPlayers){
				Map<String, Object> b = new HashMap<String, Object>();
				b.put("uuid", p.getUUID());
				surDatas.add(b);
			}
			channel.broadcast(Pack.buildKVPack("$halfsur", surDatas));
			
			
			if(this.zombiePlayers.size() == 1 && channel.getPlayers().size() > 2 && source != null && this.zombiePlayers.contains(source)){
				this.setInfectSource();
			}
		}
	}
	
	private void switchMap() {
		this.source = null;
		this.orgPlayers.clear();
		this.healthyPlayers.clear();
		this.zombiePlayers.clear();
		this.orgPlayers.addAll(channel.getPlayers());
		this.healthyPlayers.addAll(channel.getPlayers());
		this.currentMap = (this.currentMap + 1) % this.totalMap;
		setTime();
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("map", this.getMap());
		map.put("time", this.getTime());
		map.put("data", this.getMapData());
		channel.broadcast(Pack.buildKVPack("$newmap", map));
		checkAFK();
	}
	
	private void checkAFK() {
		List<Player> afkPlayers = new ArrayList<Player>();
		for(int i = 0; i < this.channel.getPlayers().size(); i++){
			Player p = this.channel.getPlayers().get(i);
			if(p != null){
				long afkTime = System.currentTimeMillis() - p.lastMoveTime;
				if(!p.getGameData().isScored() && afkTime > 120000){
					afkPlayers.add(p);
				}
			}
		}
		
		for(int i = 0; i < afkPlayers.size(); i++){
			Player p = afkPlayers.get(i);
			if(p != null && !p.isAdmin){
				p.send(Pack.buildKeyPack("$afkkick"));
				p.logout();
			}
		}
	}
	
	private boolean isAllInfected(){
		boolean flag = false;
		if(healthyPlayers.size() <= 0 || zombiePlayers.size() == channel.getPlayers().size()){
			flag = true;
		}
		return flag;
	}

	public void onInfect() {
		if(isAllInfected()){
			this.switchMap();
		}
	}
	
	@Override
	public void onLeave(Player player) {
		
		if(this.zombiePlayers.contains(player)){
			this.zombiePlayers.remove(player);
			if(this.zombiePlayers.size() <= 0){
				setInfectSource();
			}
		}
		
		if(this.healthyPlayers.contains(player)){
			this.healthyPlayers.remove(player);
			if(isAllInfected()){
				this.switchMap();
			}
		}
		
		if(this.orgPlayers.contains(player)){
			this.orgPlayers.remove(player);
		}
	}
	

	@Override
	public void onJoin(Player player) {
		player.invincibleTime = System.currentTimeMillis() + 3000;
		this.healthyPlayers.add(player);
	}

	@Override
	public Object getMapData() {
		if(this.getMap() == 14 && this.mapData == null){
			this.mapData = (int)(Math.random() * 10);
		}else{
			this.mapData = null;
		}
		
		
		return mapData;
	}

	@Override
	public void handleMovePack(Player player, Map<String, Object> map) {
		player.getGameData().setPosX((int)map.get("x"));
		player.getGameData().setPosY((int)map.get("y"));
		player.getChannel().broadcast(Pack.buildKVPack("$move", map));
		
		if(this.time > 0 && "throw".equals(map.get("t"))){
			if(zombiePlayers.contains(player)){
				try{
					String targetRaw = String.valueOf(map.get("target"));
					long uuid = Long.parseLong(targetRaw);
					Player p = Player.getPlayer(uuid);
					if(p != null && p.getChannel() == player.getChannel() && healthyPlayers.contains(p) && p.invincibleTime <= System.currentTimeMillis()){
						player.getGameData().addScore(1);
//						player.checkTitle();
						channel.broadcast(Pack.buildKVPack("$infect", "s", player.getUUID(), "m", p.getUUID()));
						healthyPlayers.remove(p);
						if(!zombiePlayers.contains(p)){
							zombiePlayers.add(p);
						}
						onInfect();
						
						
					}
				}catch(Exception e){
					e.printStackTrace();
				}
			}
		}else if("moveLeft".equals(map.get("t")) || "moveRight".equals(map.get("t"))){
			player.lastMoveTime = System.currentTimeMillis();
		}
	}

	@Override
	public String getModeCode() {
		return "plague";
	}


}
