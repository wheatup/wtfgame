package cc.cafebabe.testserver.entity;

public class GameData {
	private int posX;
	private int posY;
	private int score;
	private boolean scored;
	private Player player;
	public boolean isPhone;
	public GameData(Player player){
		this.player = player;
	}

	public boolean isScored() {
		return scored;
	}
	public void setScored(boolean scored) {
		this.scored = scored;
	}
	public int getScore() {
		return score;
	}
	public void setScore(int score) {
		this.score = score;
//		player.saveExtdata();
	}
	public void addScore(int score) {
		this.score += score;
		if(this.score >= 1000 && (player.title == null || player.title.length() <= 0)){
			player.addTitle("咸鱼王");
		}else if(this.score >= 10000 && (player.title == null || player.title.length() <= 0 || "咸鱼王".equals(player.title))){
			player.addTitle("传说");
		}
//		player.saveExtdata();
	}
	public int getPosX() {
		return posX;
	}
	public void setPosX(int posX) {
		this.posX = posX;
	}
	public int getPosY() {
		return posY;
	}
	public void setPosY(int posY) {
		this.posY = posY;
	}
}
