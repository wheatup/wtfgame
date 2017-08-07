package cc.cafebabe.testserver.entity;

import java.util.ArrayList;
import java.util.HashMap;

import cc.cafebabe.testserver.serverendpoint.Pack;
import cc.cafebabe.testserver.util.Util;

public class Level {
	public static Level level1;
	static{
		level1 = new Level();
		level1.spawnPointX = 480;
		level1.spawnPointY = -500;
		level1.addGameObject("plank", 0, -50, 960, 50);
		level1.addGameObject("plank", 640, -200, 320, 50);
		level1.addGameObject("plank", 0, -400, 320, 50);
	}
	
	public ArrayList<GameObject> gameObjects;
	public int spawnPointX;
	public int spawnPointY;
	
	public Level(){
		this.gameObjects = new ArrayList<GameObject>();
	}
	
	public void addGameObject(String type, int x, int y, int width, int height){
		gameObjects.add(new GameObject(type, x, y, width, height));
	}
	
	public Pack getLevelInfo(){
		
		HashMap<String, Object> map = new HashMap<String, Object>();
		
		ArrayList<HashMap<String, Object>> list = new ArrayList<HashMap<String, Object>>();
		
		for(GameObject object : gameObjects){
			HashMap<String, Object> m = new HashMap<String, Object>();
			m.put("type", object.type);
			m.put("x", object.x);
			m.put("y", object.y);
			m.put("width", object.width);
			m.put("height", object.height);
			list.add(m);
		}
		
		map.put("spawnPointX", this.spawnPointX);
		map.put("spawnPointY", this.spawnPointY);
		map.put("items", list);
		
		return Pack.buildKVPack("$level", map);
	}
}

class GameObject{
	public String type;
	public int x;
	public int y;
	public int width;
	public int height;
	
	public GameObject(String type, int x, int y, int width, int height) {
		this.type = type;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}