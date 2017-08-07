package cc.cafebabe.testserver.serverendpoint;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Queue;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import cc.cafebabe.testserver.entity.Channel;
import cc.cafebabe.testserver.entity.Player;
import cc.cafebabe.testserver.util.Util;

public class TaskHandler extends Thread {
	private Channel channel;
	private boolean running = false;
	private Queue<Task> tasks;
	private static final int QUEUE_SIZE = 2048;
	
	private String regex = "([您你妳昵拟倪擬鉨猊尼泥伱])(.{0,2})([妈母马馬玛瑪媽麻]+)";
	private Pattern pattern = Pattern.compile(regex);
	
//	private String regex2 = "(you)";
//	private Pattern pattern2 = Pattern.compile(regex2);
	
	public static String pyCode = "py";
	
	
	public Channel getChannel() {
		return channel;
	}

	public TaskHandler(int id){
		this.channel = Channel.getChannel(id);
		this.tasks = new ArrayBlockingQueue<Task>(QUEUE_SIZE);
	}
	
	@Override
	public void run() {
		this.running = true;
		while(running){
			while(!tasks.isEmpty()){
				try{
					handleTask(tasks.poll());
				}catch(Exception e){e.printStackTrace();}
			}
			try {
				Thread.sleep(1);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}
	
	public void shutdown(){
		running = false;
	}
	
	private void handleTask(Task task){
		try{
			switch(task.getTaskType()){
				case OPEN:
					break;
				case CLOSE:
					task.getPlayer().logout();
					break;
				case MESSAGE:
					Player player = task.getPlayer();
					
					if(!Server.running){
						player.send(Pack.buildKeyPack("$shutdown"));
						return;
					}
					
					
					Map<String, Object> m = Util.parseJSON2Map(task.getMessage());
					String type = (String) m.get("k");
					String value = String.valueOf(m.get("v"));
					Map<String, Object> map = null;
					if(value != null && value.length() > 0){
						map = Util.parseJSON2Map(value);
					}
					
					
					switch(type){
						case "login":
							Properties pps = System.getProperties();
							String ver1 = pps.getProperty("WTFGAME_VERSION");
							if(ver1 != null){
								Server.version = ver1;
							}
							
							HashMap<String, Object> echo = new HashMap<String, Object>();
							if(!Server.version.equals(map.get("ver"))){
								player.send(Pack.buildKeyPack("$outdate"));
								return;
							}
							
							int mode = 0;
							try{
								mode = Integer.parseInt(String.valueOf(map.get("mode")));
							}catch(Exception e){}
							
							String name = String.valueOf(map.get("name"));
							if(Player.getPlayer(name) != null){
								player.send(Pack.buildKVPack("$alert", "t", "已有相同名字的玩家在线了，换个名字试试！"));
								return;
							}
							
							boolean getIn = false;
							if(mode == 0){
								for(int i = 1; i <= Channel.MAX_ROOM_COUNT; i++){
									if(Channel.getChannel(i).getPlayers().size() < 16){
										
										player.setName(String.valueOf(map.get("name")));
										echo.put("uuid", player.getUUID());
										echo.put("name", player.getName());
										echo.put("title", player.title);
										echo.put("score", player.getGameData().getScore());
										player.send(Pack.buildKVPack("$login", echo));
										
										
										player.setChannel(i);
										getIn = true;
										break;
									}
								}
							}else if(mode == 1){
								for(int i = 1; i <= Channel.MAX_ROOM_COUNT; i+=2){
									if(Channel.getChannel(i).getPlayers().size() < 16){
										player.setName(String.valueOf(map.get("name")));
										echo.put("uuid", player.getUUID());
										echo.put("name", player.getName());
										echo.put("title", player.title);
										echo.put("score", player.getGameData().getScore());
										player.send(Pack.buildKVPack("$login", echo));
										
										
										player.setChannel(i);
										getIn = true;
										break;
									}
								}
							}else if(mode == 2){
								for(int i = 2; i <= Channel.MAX_ROOM_COUNT; i+=2){
									if(Channel.getChannel(i).getPlayers().size() < 16){
										player.setName(String.valueOf(map.get("name")));
										echo.put("uuid", player.getUUID());
										echo.put("name", player.getName());
										echo.put("title", player.title);
										echo.put("score", player.getGameData().getScore());
										player.send(Pack.buildKVPack("$login", echo));
										
										
										player.setChannel(i);
										getIn = true;
										break;
									}
								}
							}
							
							if(!getIn){
								player.send(Pack.buildKeyPack("$full"));
								player.logout();
								return;
							}
							
							Player.playerNameMap.put(name, player);
							
							break;
						case "move":
							if("warp".equals(String.valueOf(map.get("t"))) && !player.isAdmin){
								player.send(Pack.buildKeyPack("$kick"));
								player.logout();
								return;
							}
							player.getChannel().mode.handleMovePack(player, map);
							
							break;
							
							
						case "msg":
							String msg = String.valueOf(map.get("msg"));
							if(msg == null || msg.length() == 0) return;
							
							if("/oipoiadmin".equals(msg)){
								player.isAdmin = true;
								player.send(Pack.buildKeyPack("$admin"));
								return;
							}
							
							if(player.isAdmin){
								if("/shutdown".equals(msg)){
									Server.shutdown();
									return;
								}else if("/god".equals(msg)){
									player.send(Pack.buildKeyPack("$god"));
									return;
								}else if(msg.startsWith("/broad ")){
									String text = msg.substring(7).trim();
									Channel.broadcastToAll(Pack.buildKVPack("$broad", "text", text));
									return;
								}else if(msg.startsWith("/py ")){
									String text = msg.substring(4).trim();
									pyCode = text;
									return;
									
								}else if(msg.startsWith("/max ")){
									String text = msg.substring(5).trim();
									int num = Integer.parseInt(text);
									Channel.MAX_ROOM_COUNT = num;
									return;
									
								}
							}
							
							if(msg.startsWith("/room ")){
								
								
								String roomRaw = msg.substring(6).trim();
								
								int room = 0;
								
								
								
								if(pyCode.trim().length() > 1 && roomRaw.equals(pyCode)){
									room = -1;
									player.setChannel(room);
									return;
								}
								
								
								
								if(roomRaw != null && roomRaw.length() > 0){
									try{
										room = Integer.parseInt(roomRaw);
									}catch(Exception e){}
								}
								
								if(room <= 0 || room > Channel.MAX_ROOM_COUNT){
									player.send(Pack.buildKVPack("$alert", "t", "未知房间"));
									return;
								}
								
								Channel c = Channel.getChannel(room);
								if(!player.isAdmin && c.getPlayers().size() >= 16){
									player.send(Pack.buildKVPack("$alert", "t", "该房间已满"));
									return;
								}
								
								player.setChannel(room);
								return;
							}
							HashMap<String, Object> echo1 = new HashMap<String, Object>();
							echo1.put("uuid", player.getUUID());
							echo1.put("name", player.getName());
							
//							Matcher matcher = p.matcher(speech);
							
							String org = String.valueOf(map.get("msg"));
							pattern = Pattern.compile(regex);
							Matcher matcher = null;
							String censored = org;
							matcher = pattern.matcher(org);
							while(matcher.find()){
								censored = matcher.replaceAll("我" + matcher.group(2) + matcher.group(3));
								matcher = pattern.matcher(censored);
							}
							echo1.put("msg", censored);
							player.getChannel().broadcast(Pack.buildKVPack("$msg", echo1));
							break;
						case "title":
							if(!player.isAdmin){
								return;
							}
							
							try{
								String uuidraw = String.valueOf(map.get("uuid"));
								String title = String.valueOf(map.get("title"));
								Long uuid = 0L;
								uuid = Long.parseLong(uuidraw);
								Player p = Player.getPlayer(uuid);
								if(p != null){
									p.addTitle(title);
								}
							}catch(Exception e){
								e.printStackTrace();
							}
							break;
							
						case "kick":
							if(!player.isAdmin){
								return;
							}
							
							try{
								String uuidraw = String.valueOf(map.get("uuid"));
								Long uuid = 0L;
								uuid = Long.parseLong(uuidraw);
								Player p = Player.getPlayer(uuid);
								if(p != null){
									p.send(Pack.buildKeyPack("$kick"));
									p.logout();
								}
							}catch(Exception e){
								e.printStackTrace();
							}
							break;
					}
					break;
			   
				default:
					break;
			}
		}catch(Exception e){
			e.printStackTrace();
		}
	}

	public void addTask(Task task) {
		this.tasks.add(task);
	}
}