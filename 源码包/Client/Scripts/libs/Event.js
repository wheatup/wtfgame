/**
 * 简易事件系统
 */
if(!wh){
	var wh = {};
}
wh.Event = {
	callStacks: {},

	bind: function(signal, func, self){
		if(!wh.Event.callStacks[signal]){
			wh.Event.callStacks[signal] = [];
		}
		wh.Event.callStacks[signal].push({func:func, self:self, once: false});
	},

	bindOnce: function(signal, func, self){
		if(!wh.Event.callStacks[signal]){
			wh.Event.callStacks[signal] = [];
		}
		wh.Event.callStacks[signal].push({func:func, self:self, once: true});
	},

	unbind: function(signal, func, self){
		if(!wh.Event.callStacks[signal]){return;}
		for(var i = 0; i < wh.Event.callStacks[signal].length; i++){
			if(wh.Event.callStacks[signal][i].func == func){
				wh.Event.callStacks[signal].splice(i, 1);
				return;
			}
		}

		if(wh.Event.callStacks[signal].length == 0){
			wh.Event.callStacks[signal] = null;
		}
	},

	destroy: function(signal){
		wh.Event.callStacks[signal] = null;
	},

	call: function(signal, data){
		// console.log("call: " + signal, data);

		if(!wh.Event.callStacks[signal]){return;}
		var eves = wh.Event.callStacks[signal];
		for(var i = 0; i < eves.length; i++){
			var e = eves[i];
			e.func.call(e.self, data);
			if(e.once){
				eves.splice(i, 1);
				i--;
			}
		}

		if(eves.length == 0){
			wh.Event.destroy(signal);
		}
	}
};
