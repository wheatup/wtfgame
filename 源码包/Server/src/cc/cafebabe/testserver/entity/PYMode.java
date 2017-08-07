package cc.cafebabe.testserver.entity;

import java.util.Map;

import cc.cafebabe.testserver.serverendpoint.Pack;

public class PYMode extends GameMode{

	public PYMode(Channel channel) {
		super(channel);
	}

	@Override
	public String getModeCode() {
		return "py";
	}

	@Override
	public void run() {
		
	}

	@Override
	public void stopPlay() {
		
	}

	@Override
	public void onJoin(Player player) {
		
	}

	@Override
	public void onLeave(Player player) {
		
	}

	@Override
	public int getTime() {
		return 0;
	}

	@Override
	public int getMap() {
		return 0;
	}

	@Override
	public Object getMapData() {
		return null;
	}

	@Override
	public void handleMovePack(Player player, Map<String, Object> map) {
		player.getGameData().setPosX((int)map.get("x"));
		player.getGameData().setPosY((int)map.get("y"));
		player.getChannel().broadcast(Pack.buildKVPack("$move", map));
	}

}
