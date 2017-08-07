/*
 * Tween 插件
 * by wheatup
 * v1.2
 *
 * 使用方法：
 * 首先使用 wh.Tween.get(对象) 来获取需要添加动画的对象
 * 之后在其后追加以下方法：
 *
 * .to(参数列表, 时间, 缓动, 设置)
 *		参数列表使用{参数1: 值1, 参数2: 值2}的形式
 * 		时间的单位为毫秒
 * 		缓动参数使用下方的Easing库(例: wh.Easing.Quad.easeIn)，不填写则为线性
 * 		支持的设置:{string: true, int: true}: string则结果以string表示，int则结果只取整数
 *
 * .wait(时间)
 * 		等待多少毫秒后继续执行
 *
 * .call(方法, 数据, 调用者)
 * 		调用一个方法
 *
 * .loop(次数)
 * 		重复执行所有动画链，如果次数不填写或为0则无限循环
 *
 *
 *
 * wh.Tween的其他方法：
 *
 * .remove( 对象 )
 * 		停止并移除对象身上的tween
 *
 * .removeAll()
 * 		移除所有对象身上的tween
 *
 *
 * 案例：跳跃的方块
 * wh.Tween.get(this.gameObject)
 * 	.to({scaleX: 1.2, scaleY: 0.6}, 200, wh.Easing.Quad.easeIn)
 * 	.to({scaleX: 0.8, scaleY: 1.2}, 20, wh.Easing.Quad.easeIn)
 * 	.to({y: this.gameObject.y - 500, scaleX: 0.8, scaleY: 1.2}, 500, wh.Easing.Quad.easeOut)
 * 	.wait(1000)
 * 	.call(function(){alert('播放到一半了！');})
 * 	.to({y: this.gameObject.y}, 500, wh.Easing.Quad.easeIn)
 * 	.to({scaleX: 1.2, scaleY: 0.6}, 50, wh.Easing.Quad.easeOut)
 * 	.to({scaleX: 1, scaleY: 1}, 100, wh.Easing.Quad.easeIn).loop();
 *
 *
 */
if(!wh){
	var wh = {};
}
wh._TweenChain = function($target){
	this.target = $target;
	this.curIndex = -1;
	this.args = [];
	this.settings = [];
	this.durations = [];
	this.adds = [];
	this.hasRunned = false;
	this.stopped = false;

	this.loops = [];
	this.addIndex = 0;
	this.lastLoopIndex = 0;
	this.curLoopIndex = 0;

	//tween到某值
	this.to = function($arg, $duration, $easing, $add){
		this.args.push($arg);
		this.durations.push((isNaN($duration) || $duration < 1) ? 1 : $duration);
		this.settings.push($easing ? {ease: $easing} : {ease: wh.Easing.Linear});
		this.adds.push($add ? $add : {});

		if(!wh.Tween._inited){
			console.log('Tween服务尚未启动，请传入gameObject对象或者先wh.Tween.init(game)!');
		}
		this.addIndex++;
		return this;
	};

	//等待一段时间
	this.wait = function($duration){
		this.args.push({});
		this.durations.push((isNaN($duration) || $duration < 1) ? 1 : $duration);
		this.settings.push({});
		this.adds.push({});
		this.addIndex++;
		return this;
	};

	//执行函数
	this.call = function($func, $data, $self){
		this.args.push({});
		this.durations.push(0);
		this.settings.push({func: $func, data: $data, caller: $self});
		this.adds.push({});
		this.addIndex++;
		return this;
	};

	//循环之前所有操作
	this.loop = function(count){
		this.loops.push({from:this.lastLoopIndex, to:this.addIndex, count: count});
		this.lastLoopIndex = this.addIndex;

		return this;
	};

	this._run = function(){
		if(this.hasRunned) return;
		this.hasRunned = true;

		this._activate();
	};

	this._stop = function(){
		this.stopped = true;
	};

	this.passingTime = 0;
	this.speed = 0;
	this.attrArr = [];
	this.curArr = [];
	this.initArr = [];
	this.attrs = [];
	this.sets = [];
	this.addss = [];
	this.curEase = null;
	this.ifstop = false;

	//每帧更新，由游戏的update自动调用
	this.update = function(dt){
		if(this.stopped || !this.target) return;

		this.passingTime += dt;
		this.passingTime = Math.min(this.passingTime, this.speed);
		this.passingTime = Math.min(this.passingTime, this.speed);

		for(var attr in this.attrs){
			for(var i=0; i<this.attrArr.length; i++){
				var easeVars = this.curEase(this.passingTime, this.initArr[i], this.curArr[i] - this.initArr[i], this.speed);
				if(this.addss && this.addss.string){
					if(this.addss.int){
						this.target[this.attrArr[i]] = parseFloat(easeVars).toFixed(0);
					}else{
						this.target[this.attrArr[i]] = parseFloat(easeVars);
					}
				}else{
					if(this.addss && this.addss.int){
						this.target[this.attrArr[i]] = parseInt(easeVars);
					}else{
						this.target[this.attrArr[i]] = parseFloat(easeVars);
					}
				}
			}
		}

		if(this.passingTime >= this.speed){
			if(!this.ifstop){
				this.ifstop = true;
				this._activate();
			}
		}
	};

	//进行下一段动画链
	this._activate = function(){
		if(this.stopped || !this.target) return;

		this.curIndex ++;

		var top = this.args.length;
		if(this.curLoopIndex < this.loops.length){
			top = this.loops[this.curLoopIndex].to;
		}

		if(this.curLoopIndex != 0 && this.curLoopIndex >= this.loops.length){
			//播放结束
			wh.Tween._removeTween(this);
			return;
		}

		if(this.curIndex >= top){
			if(this.loops[this.curLoopIndex]){
				this.loops[this.curLoopIndex].count--;
				if(this.loops[this.curLoopIndex].count != 0){
					this.curIndex = this.loops[this.curLoopIndex].from;
				}else{
					this.curLoopIndex++;
				}
			}
		}

		if(this.curIndex >= this.args.length){
			//播放结束
			wh.Tween._removeTween(this);
			return;
		}

		var self = this;
		this.attrArr = [];
		this.curArr = [];
		this.initArr = [];
		this.attrs = this.args[this.curIndex];
		this.sets = this.settings[this.curIndex];
		this.addss = this.adds[this.curIndex];
		this.speed = this.durations[this.curIndex];
		this.ifstop = false;
		this.curEase = this.sets.ease ? this.sets.ease : wh.Easing.Linear;
		this.passingTime = 0;

		for(var at in this.attrs){
			this.attrArr.push(at);
			this.curArr.push(this.attrs[at]);
			var atObj = parseFloat(this.target[at]);
			if(isNaN(atObj))atObj = 0;
			this.initArr.push(atObj);
		}

		var rolled = false;
		for(var attr in this.attrs){
			rolled = true;
			break;
		}

		if(!rolled){
			if(this.sets.func){
				if(this.sets.caller){
					this.sets.func.call(this.sets.caller, this.sets.data);
				}else{
					this.sets.func(this.sets.data);
				}
			}
		}
	};
};


/**
 * Tween类
 */
wh.Tween = {
	_targets: [],
	_tweens: [],
	_inited: false,
	_timer: null,
	_game: null,

	//获取对象
	get: function(target){
		if(!this._inited && target.game){
			this._inited = true;
			this._game = target.game;
			this._timer = this._game.timer.loop(0, function(){this._update(this._game.time.deltaTime);}, this);
		}

		if(!target._tweenChain){
			target._tweenChain = [];
		}

		var chain = new wh._TweenChain(target);
		target._tweenChain.push(chain);
		this._tweens.push(chain);
		this._targets.push(target);
		return chain;
	},

	//初始化Tween，调用一次即可，如果传入的对象是GameObject则不需要调用
	init: function(game){
		if(!this._inited && game){
			this._inited = true;
			this._game = game;
			this._timer = this._game.timer.loop(0, function(){this._update(this._game.time.deltaTime);}, this);
		}
	},

	//每帧调用，由游戏update自动调用
	_update: function(dt){
		for(var i = 0; i < wh.Tween._tweens.length; i++){
			wh.Tween._tweens[i].update(dt);
		}
	},

	_removeTween: function(tween) {
		var index = wh.Tween._tweens.indexOf(tween);
		if(index >= 0){
			wh.Tween._tweens.splice(index, 1);
		}

		if(tween.target && tween.target._tweenChain){
			index = tween.target._tweenChain.indexOf(tween);
			if(index >= 0){
				tween.target._tweenChain.splice(index, 1);
			}
			if(tween.target._tweenChain.length <= 0){
				this.remove(tween.target);
			}
		}
	},

	//移除并终止对象身上的tween
	remove: function(target){
		if(target._tweenChain){
			for(var i = 0; i < target._tweenChain.length; i++){
				target._tweenChain[i]._stop();
				var index = wh.Tween._tweens.indexOf(target._tweenChain[i]);
				if(index >= 0){
					wh.Tween._tweens.splice(index, 1);
				}
			}
			target._tweenChain = [];
		}
	},

	//终止并移除所有tween
	removeAll: function(){
		for(var i = 0; i < this._targets.length; i++){
			this.remove(this._targets[i]);
		}
		wh.Tween.tweens = [];
	},

	//停止Tween服务
	stop: function(){
		if(this._timer){
			this._game.timer.remove(this._timer);
			this._inited = false;
		}
	}
};



/**
 * 缓动算法
 */
wh.Easing = {
	Linear: function(t,b,c,d){ return c*t/d + b; },
	Quad: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t + b;
		},
		easeOut: function(t,b,c,d){
			return -c *(t/=d)*(t-2) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 * ((--t)*(t-2) - 1) + b;
		}
	},
	Cubic: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return c*((t=t/d-1)*t*t + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		}
	},
	Quart: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return -c * ((t=t/d-1)*t*t*t - 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
			return -c/2 * ((t-=2)*t*t*t - 2) + b;
		}
	},
	Quint: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return c*((t=t/d-1)*t*t*t*t + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
			return c/2*((t-=2)*t*t*t*t + 2) + b;
		}
	},
	Sine: {
		easeIn: function(t,b,c,d){
			return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
		},
		easeOut: function(t,b,c,d){
			return c * Math.sin(t/d * (Math.PI/2)) + b;
		},
		easeInOut: function(t,b,c,d){
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		}
	},
	Expo: {
		easeIn: function(t,b,c,d){
			return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
		},
		easeOut: function(t,b,c,d){
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if (t==0) return b;
			if (t==d) return b+c;
			if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
			return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
		}
	},
	Circ: {
		easeIn: function(t,b,c,d){
			return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
		},
		easeOut: function(t,b,c,d){
			return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
		}
	},
	Elastic: {
		easeIn: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		},
		easeOut: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
		},
		easeInOut: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
			return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
		}
	},
	Back: {
		easeIn: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158;
			return c*(t/=d)*t*((s+1)*t - s) + b;
		},
		easeOut: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158;
			return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		},
		easeInOut: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158;
			if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
			return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
		}
	},
	Bounce: {
		easeIn: function(t,b,c,d){
			return c - Easing.Bounce.easeOut(d-t, 0, c, d) + b;
		},
		easeOut: function(t,b,c,d){
			if ((t/=d) < (1/2.75)) {
				return c*(7.5625*t*t) + b;
			} else if (t < (2/2.75)) {
				return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
			} else if (t < (2.5/2.75)) {
				return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
			} else {
				return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
			}
		},
		easeInOut: function(t,b,c,d){
			if (t < d/2) return Easing.Bounce.easeIn(t*2, 0, c, d) * .5 + b;
			else return Easing.Bounce.easeOut(t*2-d, 0, c, d) * .5 + c*.5 + b;
		}
	}
};
