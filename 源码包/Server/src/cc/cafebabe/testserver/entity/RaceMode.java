package cc.cafebabe.testserver.entity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import cc.cafebabe.testserver.serverendpoint.Pack;

public class RaceMode extends GameMode {
	private int time = 0;
	private int currentMap = 0;
	private int totalMap = 23;
	private int tick = 0;
	private int nextFlashTick = 0;
	private List<Integer> maps;
	private Object mapData = null;
	public int multi = 1;
	
	public RaceMode(Channel channel) {
		super(channel);
		this.currentMap = 0;
		this.maps = new ArrayList<Integer>();
		for(int i = 0; i < this.totalMap; i++){
			maps.add(i+1);
		}
		Collections.shuffle(maps);
		setTime();
	}
	
	public void setTime(){
		this.time = 120;
		this.multi = 1;
		
		switch(this.getMap()){
		case 13:
			this.multi = 2;
			break;
		case 14:
			this.multi = 2;
			break;
		case 15:
			this.time = 60;
			break;
		case 16:
			this.time = 60;
			break;
		case 17:
			this.multi = 3;
			break;
		case 18:
			this.multi = 2;
			this.time = 120;
			break;
		case 19:
			this.multi = 3;
			this.time = 150;
			break;
		case 20:
			this.time = 180;
			this.multi = 4;
			break;
		}
		//this.time *= 0.1;
	}

	@Override
	public void run(){
		this.running = true;
		setNextFlashTick();
		int tempMap = 0;
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
				delta-=1000;
				this.time--;
				if(tempMap == this.currentMap && this.time <= 0){
					this.switchMap();
				}
				this.tick();
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
//		return 23;
		
		return maps.get(this.currentMap);
	}
	
	private void tick() {
		if(this.tick == this.nextFlashTick){
			setNextFlashTick();
			channel.broadcast(Pack.buildKeyPack("$flash"));
		}
		
		if(this.getMap() == 4){
			if(tick % 7 == 0){
				channel.broadcast(Pack.buildKeyPack("$shoot"));
			}
		}else if(this.getMap() == 18){
			if(tick % 4 == 0){
				channel.broadcast(Pack.buildKeyPack("$shoot"));
			}
		}

		this.tick++;
		
	}
	
	
	private void setNextFlashTick() {
//		if(Math.random() < 0.05){
//			this.nextFlashTick += 1;
//		}else{
			this.nextFlashTick += 3 + (int)(Math.random() * 3);
//		}
	}
	
	private void switchMap() {
		
		this.currentMap = (this.currentMap + 1) % this.totalMap;
		setTime();
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("map", this.getMap());
		map.put("time", this.getTime());
		map.put("data", this.getMapData());
		channel.broadcast(Pack.buildKVPack("$newmap", map));
		checkAFK();
		for(Player p : this.channel.getPlayers()){
			p.getGameData().setScored(false);
		}
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
	
	private boolean isAllComplete(){
		boolean flag = true;
		for(Player p : channel.getPlayers()){
			if(!p.getGameData().isScored()){
				flag = false;
				break;
			}
		}
		return flag;
	}

	public void onScore() {
		if(isAllComplete()){
			this.switchMap();
		}
	}
	
	@Override
	public void onLeave(Player player) {
		if(isAllComplete()){
			this.switchMap();
		}
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
		
		if("flag".equals(map.get("t"))){
			
			int completed = 0;
			int score = 1 * ((RaceMode)(player.getChannel().mode)).multi;
			
			if(player.getChannel() != null){
				for(Player p : player.getChannel().getPlayers()){
					if(p.getGameData().isScored()){
						completed++;
					}
				}
			}
			
			if(completed == 0){
				score = 5 * multi;
			}else if(completed == 1){
				score = 3 * multi;
			}else if(completed == 2){
				score = 2 * multi;
			}
			
			player.getGameData().setScored(true);
			player.getGameData().addScore(score);
			HashMap<String, Object> pk = new HashMap<String, Object>();
			pk.put("uuid", player.getUUID());
			pk.put("score", score);
			player.getChannel().broadcast(Pack.buildKVPack("$score", pk));
			//player.checkTitle();
			
			
			onScore();
		}else if("moveLeft".equals(map.get("t")) || "moveRight".equals(map.get("t"))){
			player.lastMoveTime = System.currentTimeMillis();
		}
	}

	@Override
	public String getModeCode() {
		return "race";
	}

	@Override
	public void onJoin(Player player) {
		
	}
}
