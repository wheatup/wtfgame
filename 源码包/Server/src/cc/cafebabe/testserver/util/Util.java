package cc.cafebabe.testserver.util;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

public class Util {
		
	public static JSONObject parseMap2JSON(Map<String, Object> map){
		JSONObject jsonObject = JSONObject.fromObject(map);
		return jsonObject;
	}
	
	public static JSONArray parseList2JSON(List<Map<String, Object>> list){
		JSONArray jsonArray = JSONArray.fromObject(list);
		return jsonArray;
	}
	
	public static List<Map<String, Object>> parseJSON2List(String jsonStr){
		JSONArray jsonArr = JSONArray.fromObject(jsonStr);
		List<Map<String, Object>> list = new ArrayList<Map<String,Object>>();
		Iterator<JSONObject> it = jsonArr.iterator();
		while(it.hasNext()){
			JSONObject json2 = it.next();
			list.add(parseJSON2Map(json2.toString()));
		}
		return list;
	}
	
	
	public static Map<String, Object> parseJSON2Map(String jsonStr){
		Map<String, Object> map = new HashMap<String, Object>();
		JSONObject json = JSONObject.fromObject(jsonStr);
		for(Object k : json.keySet()){
			Object v = json.get(k); 
			if(v instanceof JSONArray){
				List<Map<String, Object>> list = new ArrayList<Map<String,Object>>();
				Iterator<JSONObject> it = ((JSONArray)v).iterator();
				while(it.hasNext()){
					JSONObject json2 = it.next();
					list.add(parseJSON2Map(json2.toString()));
				}
				map.put(k.toString(), list);
			} else {
				map.put(k.toString(), v);
			}
		}
		return map;
	}
	
	
	public static List<Map<String, Object>> getListByUrl(String url){
		try {
			InputStream in = new URL(url).openStream();
			BufferedReader reader = new BufferedReader(new InputStreamReader(in));
			StringBuilder sb = new StringBuilder();
			String line;
			while((line=reader.readLine())!=null){
				sb.append(line);
			}
			return parseJSON2List(sb.toString());
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}
	
	
	public static Map<String, Object> getMapByUrl(String url){
		try {
			InputStream in = new URL(url).openStream();
			BufferedReader reader = new BufferedReader(new InputStreamReader(in));
			StringBuilder sb = new StringBuilder();
			String line;
			while((line=reader.readLine())!=null){
				sb.append(line);
			}
			return parseJSON2Map(sb.toString());
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}
	
	public static String encode(String code){
		String asB64 = "";
		try {
			asB64 = Base64.getEncoder().encodeToString(code.getBytes("utf-8"));
		} catch (UnsupportedEncodingException e1) {
			e1.printStackTrace();
		}  
		return asB64;
		   
		
	}
	
	public static String decode(String code){
		byte[] asBytes = Base64.getDecoder().decode(code);
		String decodedString = "";
		try {
			decodedString = new String(asBytes, "utf-8");
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		return decodedString;
	}
}
