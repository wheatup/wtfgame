/**
 * 用户自定义脚本.
 */
(function(window, Object, undefined) {

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 保持横版或者竖版的组件
 * 在本节点下面的对象都会进行旋转
 * @class qc.Plugins.LockOrientation
 */
var LockOrientation = qc.defineBehaviour('qc.Plugins.LockOrientation', qc.Behaviour, function() {
    var self = this;

    /**
     * @property {int} orientation - 当前是限定为横版还是竖版，有如下取值：
     * Device.AUTO = 0;
     * Device.PORTRAIT = 1;
     * Device.LANDSCAPE = 2;
     */
    self.orientation = self.game.device.orientation;

    // 在PC上默认不启用
    self.desktop = false;

    // 本组件可以在编辑器模式下运行
    self.runInEditor = true;

    self.manualType = 0;
}, {
    orientation: qc.Serializer.INT,
    desktop: qc.Serializer.BOOLEAN,
    manualType: qc.Serializer.INT
});
LockOrientation.__menu = 'Plugins/LockOrientation';

Object.defineProperties(LockOrientation.prototype, {
    orientation: {
        get: function() {
            return this._orientation;
        },
        set: function(v) {
            if (v === this._orientation) return;
            this._orientation = v;
            this._doOrientation(this.game.device.orientation);
        }
    }
});

// 初始化处理，关注横竖版事件并做处理
LockOrientation.prototype.awake = function() {
    var self = this, o = self.gameObject;

    self.addListener(self.game.world.onSizeChange, self._doOrientation, self);
    self.addListener(o.parent.onRelayout, self.assureSize, self);

    // 确保目标节点大小、pivot与世界一致
    self._doOrientation();
    self.assureSize();

    var adapter = o.parent.getScript('qc.ScaleAdapter');

    if (adapter) {
        // 本插件需要重载掉ScaleAdapter，在屏幕宽高缩放时，需要按照旋转后的长宽来获取
        var oldScaleAdapter_getReferenceResolution = adapter.getReferenceResolution;
        adapter.getReferenceResolution = function() {
            var p = oldScaleAdapter_getReferenceResolution.call(this);
            if (self.rotate90) {
                return new qc.Point(p.y, p.x);
            }
            return p;        
        };
    }
};

// 确保和父亲节点的大小保持一致
LockOrientation.prototype.assureSize = function() {
    var self = this, o = self.gameObject;

    var rect = o.parent.rect;
    if (self.rotate90 === true) {
        // 旋转时，对调下长宽，确保和父亲节点重合
        o.width = rect.height;
        o.height = rect.width;
    }
    else {
        o.width = rect.width;
        o.height = rect.height;
    }
    o.setAnchor(new qc.Point(0.5, 0.5), new qc.Point(0.5, 0.5));
    o.anchoredX = 0;
    o.anchoredY = 0;
    o.pivotX = 0.5;
    o.pivotY = 0.5;
};

// 横竖屏发生变化的处理
LockOrientation.prototype._doOrientation = function() {
    var self = this, o = self.gameObject, v = self.game.device.orientation;

    if (!self.desktop && !self.game.editor && self.game.device.desktop) {
        o.rotation = 0;
        self.rotate90 = false;
        return;
    }

    switch (self.orientation) {
    case qc.Device.AUTO:
    default:
        o.rotation = 0;
        self.rotate90 = false;
        return;

    case qc.Device.PORTRAIT:
    case qc.Device.LANDSCAPE:
        if (v === self.orientation) {
            // 一致，就不需要旋转了
            o.rotation = 0;
            self.rotate90 = false;
        }
        else {
            // 不一致，旋转90度
            o.rotation = -Math.PI / 2;
            self.rotate90 = true;
        }
        self.assureSize();
        break;
    }
    var adapter = o.parent.getScript('qc.ScaleAdapter');
    if (adapter) {
        if (self.rotate90) {
            if (self.manualType === qc.ScaleAdapter.MANUAL_WIDTH) {
                adapter.manualType = qc.ScaleAdapter.MANUAL_HEIGHT;
            }
            else if (self.manualType === qc.ScaleAdapter.MANUAL_HEIGHT) {
                adapter.manualType = qc.ScaleAdapter.MANUAL_WIDTH;
            }
            else {
                adapter.manualType = self.manualType;
            }
        }
        else {
            adapter.manualType = self.manualType;
        }
    }
};


/**
 * The Arcade Physics world. Contains Arcade Physics related collision, overlap and motion methods.
 *
 * @class Phaser.Physics.Arcade
 * @constructor
 * @param {Phaser.Game} game - reference to the current game instance.
 */
var Arcade = Phaser.Physics.Arcade = function(game) {
    /**
     * @property {Phaser.Game} game - Local reference to game.
     */
    this.game = game;

    /**
     * @property {Phaser.Point} gravity - The World gravity setting. Defaults to x: 0, y: 0, or no gravity.
     */
    this.gravity = new Phaser.Point();

    /**
     * @property {Phaser.Rectangle} bounds - The bounds inside of which the physics world exists. Defaults to match the world bounds.
     */
    this.bounds = new Phaser.Rectangle(0, 0, game.world.width, game.world.height);

    /**
     * Set the checkCollision properties to control for which bounds collision is processed.
     * For example checkCollision.down = false means Bodies cannot collide with the World.bounds.bottom.
     * @property {object} checkCollision - An object containing allowed collision flags.
     */
    this.checkCollision = { up: true, down: true, left: true, right: true };

    /**
     * @property {number} maxObjects - Used by the QuadTree to set the maximum number of objects per quad.
     */
    this.maxObjects = 10;

    /**
     * @property {number} maxLevels - Used by the QuadTree to set the maximum number of iteration levels.
     */
    this.maxLevels = 4;

    /**
     * @property {number} OVERLAP_BIAS - A value added to the delta values during collision checks.
     */
    this.OVERLAP_BIAS = 10;

    /**
     * @property {boolean} forceX - If true World.separate will always separate on the X axis before Y. Otherwise it will check gravity totals first.
     */
    this.forceX = false;

    /**
     * @property {number} sortDirection - Used when colliding a Sprite vs. a Group, or a Group vs. a Group, this defines the direction the sort is based on. Default is Phaser.Physics.Arcade.LEFT_RIGHT.
     * @default
     */
    this.sortDirection = Phaser.Physics.Arcade.LEFT_RIGHT;

    /**
     * @property {boolean} skipQuadTree - If true the QuadTree will not be used for any collision. QuadTrees are great if objects are well spread out in your game, otherwise they are a performance hit. If you enable this you can disable on a per body basis via `Body.skipQuadTree`.
     */
    this.skipQuadTree = true;

    /**
     * @property {boolean} isPaused - If `true` the `Body.preUpdate` method will be skipped, halting all motion for all bodies. Note that other methods such as `collide` will still work, so be careful not to call them on paused bodies.
     */
    this.isPaused = false;

    /**
     * @property {Phaser.QuadTree} quadTree - The world QuadTree.
     */
    this.quadTree = new Phaser.QuadTree(this.game.world.bounds.x, this.game.world.bounds.y, this.game.world.bounds.width, this.game.world.bounds.height, this.maxObjects, this.maxLevels);

    /**
     * @property {number} _total - Internal cache var.
     * @private
     */
    this._total = 0;

    // By default we want the bounds the same size as the world bounds
    this.setBoundsToWorld();
};
Arcade.prototype = {};
Arcade.prototype.constructor = Arcade;

/**
 * A constant used for the sortDirection value.
 * Use this if you don't wish to perform any pre-collision sorting at all, or will manually sort your Groups.
 * @constant
 * @type {number}
 */
Arcade.SORT_NONE = 0;

/**
 * A constant used for the sortDirection value.
 * Use this if your game world is wide but short and scrolls from the left to the right (i.e. Mario)
 * @constant
 * @type {number}
 */
Arcade.LEFT_RIGHT = 1;

/**
 * A constant used for the sortDirection value.
 * Use this if your game world is wide but short and scrolls from the right to the left (i.e. Mario backwards)
 * @constant
 * @type {number}
 */
Arcade.RIGHT_LEFT = 2;

/**
 * A constant used for the sortDirection value.
 * Use this if your game world is narrow but tall and scrolls from the top to the bottom (i.e. Dig Dug)
 * @constant
 * @type {number}
 */
Arcade.TOP_BOTTOM = 3;

/**
 * A constant used for the sortDirection value.
 * Use this if your game world is narrow but tall and scrolls from the bottom to the top (i.e. Commando or a vertically scrolling shoot-em-up)
 * @constant
 * @type {number}
 */
Arcade.BOTTOM_TOP = 4;

/**
 * 收集所有的 body 元素
 */
Arcade.prototype.gatherBody = function(node, bodies) {
    if (node.body) bodies.push(node.body);
    var children = node.children;
    if (children) {
        for (var i = 0, len = children.length; i < len; i++)
            this.gatherBody(children[i], bodies);
    }
};

/**
 * arcade 物理调度
 */
Arcade.prototype.preUpdate = function() {
    var game = this.game;

    // 这里我们认为具有 body 属性的对象相对世界节点而言是少的，所以记录下来
    // 后续就不要再进行遍历
    var bodies = [];
    this.gatherBody(this.game.world, bodies);

    var i, len = bodies.length;
    var controller;
    var qc;

    // 先进行 body 的 preUpdate
    for (i = 0; i < len; i++)
        bodies[i].preUpdate();

    // 再进行 body 的 update（主要检测相交）
    for (i = 0; i < len; i++) {
        qc = bodies[i].qc;
        if (!qc) continue;

        controller = bodies[i].qc.getScript('qc.arcade.RigidBody');
        if (controller)
            controller.updateRigidbody();
    }

    // 最后进行 body 的 postUpdate
    for (i = 0; i < len; i++)
        bodies[i].postUpdate();
};

/**
 * Updates the size of this physics world.
 *
 * @method Phaser.Physics.Arcade#setBounds
 * @param {number} x - Top left most corner of the world.
 * @param {number} y - Top left most corner of the world.
 * @param {number} width - New width of the world. Can never be smaller than the Game.width.
 * @param {number} height - New height of the world. Can never be smaller than the Game.height.
 */
Arcade.prototype.setBounds = function (x, y, width, height) {
    this.bounds.setTo(x, y, width, height);
};

/**
 * Updates the size of this physics world to match the size of the game world.
 *
 * @method Phaser.Physics.Arcade#setBoundsToWorld
 */
Arcade.prototype.setBoundsToWorld = function() {
    this.bounds.setTo(this.game.world.bounds.x, this.game.world.bounds.y,
        this.game.world.bounds.width, this.game.world.bounds.height);
};

/**
 * This will create an Arcade Physics body on the given game object or array of game objects.
 * A game object can only have 1 physics body active at any one time, and it can't be changed until the object is destroyed.
 *
 * @method Phaser.Physics.Arcade#enable
 * @param {object|array|Phaser.Group} object - The game object to create the physics body on. Can also be an array or Group of objects, a body will be created on every child that has a `body` property.
 * @param {boolean} [children=true] - Should a body be created on all children of this object? If true it will recurse down the display list as far as it can go.
 */
Arcade.prototype.enable = function(object, children) {
    if (typeof children === 'undefined') { children = true; }

    var i = 1;

    if (Array.isArray(object))
    {
        i = object.length;
        while (i--)
        {
            if (object[i] instanceof Phaser.Group)
            {
                //  If it's a Group then we do it on the children regardless
                this.enable(object[i].children, children);
            }
            else
            {
                this.enableBody(object[i]);

                if (children && object[i].hasOwnProperty('children') && object[i].children.length > 0)
                {
                    this.enable(object[i], true);
                }
            }
        }
    }
    else
    {
        if (object instanceof Phaser.Group)
        {
            //  If it's a Group then we do it on the children regardless
            this.enable(object.children, children);
        }
        else
        {
            this.enableBody(object);

            if (children && object.hasOwnProperty('children') && object.children.length > 0)
            {
                this.enable(object.children, true);
            }
        }
    }
};

/**
 * Creates an Arcade Physics body on the given game object.
 * A game object can only have 1 physics body active at any one time, and it can't be changed until the body is nulled.
 *
 * @method Phaser.Physics.Arcade#enableBody
 * @param {object} object - The game object to create the physics body on. A body will only be created if this object has a null `body` property.
 */
Arcade.prototype.enableBody = function (object) {
    if (object.hasOwnProperty('body') && object.body === null)
    {
        object.body = new Phaser.Physics.Arcade.Body(object);
    }
};

/**
 * Called automatically by a Physics body, it updates all motion related values on the Body unless `World.isPaused` is `true`.
 *
 * @method Phaser.Physics.Arcade#updateMotion
 * @param {Phaser.Physics.Arcade.Body} The Body object to be updated.
 */
Arcade.prototype.updateMotion = function(body) {
    var velocityDelta = this.computeVelocity(0, body, body.angularVelocity, body.angularAcceleration, body.angularDrag, body.maxAngular) - body.angularVelocity;
    body.angularVelocity += velocityDelta;
    body.rotation += (body.angularVelocity * this.game.time.physicsElapsed);

    body.velocity.x = this.computeVelocity(1, body, body.velocity.x, body.acceleration.x, body.drag.x, body.maxVelocity.x);
    body.velocity.y = this.computeVelocity(2, body, body.velocity.y, body.acceleration.y, body.drag.y, body.maxVelocity.y);

};

/**
 * A tween-like function that takes a starting velocity and some other factors and returns an altered velocity.
 * Based on a function in Flixel by @ADAMATOMIC
 *
 * @method Phaser.Physics.Arcade#computeVelocity
 * @param {number} axis - 0 for nothing, 1 for horizontal, 2 for vertical.
 * @param {Phaser.Physics.Arcade.Body} body - The Body object to be updated.
 * @param {number} velocity - Any component of velocity (e.g. 20).
 * @param {number} acceleration - Rate at which the velocity is changing.
 * @param {number} drag - Really kind of a deceleration, this is how much the velocity changes if Acceleration is not set.
 * @param {number} [max=10000] - An absolute value cap for the velocity.
 * @return {number} The altered Velocity value.
 */
Arcade.prototype.computeVelocity = function(axis, body, velocity, acceleration, drag, max) {
    if (typeof max === 'undefined') { max = 10000; }

    if (axis === 1 && body.allowGravity)
    {
        velocity += (this.gravity.x + body.gravity.x) * this.game.time.physicsElapsed;
    }
    else if (axis === 2 && body.allowGravity)
    {
        velocity += (this.gravity.y + body.gravity.y) * this.game.time.physicsElapsed;
    }

    if (acceleration)
    {
        velocity += acceleration * this.game.time.physicsElapsed;
    }
    else if (drag)
    {
        // var _drag = drag * this.game.time.physicsElapsed;
        drag *= this.game.time.physicsElapsed;

        if (velocity - drag > 0)
        {
            velocity -= drag;
        }
        else if (velocity + drag < 0)
        {
            velocity += drag;
        }
        else
        {
            velocity = 0;
        }
    }

    if (velocity > max)
    {
        velocity = max;
    }
    else if (velocity < -max)
    {
        velocity = -max;
    }

    return velocity;
};

/**
 * Checks for overlaps between two game objects. The objects can be Sprites, Groups or Emitters.
 * You can perform Sprite vs. Sprite, Sprite vs. Group and Group vs. Group overlap checks.
 * Unlike collide the objects are NOT automatically separated or have any physics applied, they merely test for overlap results.
 * Both the first and second parameter can be arrays of objects, of differing types.
 * If two arrays are passed, the contents of the first parameter will be tested against all contents of the 2nd parameter.
 * NOTE: This function is not recursive, and will not test against children of objects passed (i.e. Groups within Groups).
 *
 * @method Phaser.Physics.Arcade#overlap
 * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|array} object1 - The first object or array of objects to check. Can be Phaser.Sprite, Phaser.Group or Phaser.Particles.Emitter.
 * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|array} object2 - The second object or array of objects to check. Can be Phaser.Sprite, Phaser.Group or Phaser.Particles.Emitter.
 * @param {function} [overlapCallback=null] - An optional callback function that is called if the objects overlap. The two objects will be passed to this function in the same order in which you specified them.  The two objects will be passed to this function in the same order in which you specified them, unless you are checking Group vs. Sprite, in which case Sprite will always be the first parameter.
 * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then overlapCallback will only be called if processCallback returns true.
 * @param {object} [callbackContext] - The context in which to run the callbacks.
 * @return {boolean} True if an overlap occurred otherwise false.
 */
Arcade.prototype.overlap = function (object1, object2, overlapCallback, processCallback, callbackContext) {
    overlapCallback = overlapCallback || null;
    processCallback = processCallback || null;
    callbackContext = callbackContext || overlapCallback;

    this._total = 0;
    if (!Array.isArray(object1) && Array.isArray(object2))
    {
        for (var i = 0; i < object2.length; i++)
        {
            this.collideHandler(object1, object2[i], overlapCallback, processCallback, callbackContext, true);
        }
    }
    else if (Array.isArray(object1) && !Array.isArray(object2))
    {
        for (var i = 0; i < object1.length; i++)
        {
            this.collideHandler(object1[i], object2, overlapCallback, processCallback, callbackContext, true);
        }
    }
    else if (Array.isArray(object1) && Array.isArray(object2))
    {
        for (var i = 0; i < object1.length; i++)
        {
            for (var j = 0; j < object2.length; j++)
            {
                this.collideHandler(object1[i], object2[j], overlapCallback, processCallback, callbackContext, true);
            }
        }
    }
    else
    {
        this.collideHandler(object1, object2, overlapCallback, processCallback, callbackContext, true);
    }

    return (this._total > 0);
};

/**
 * Checks for collision between two game objects. You can perform Sprite vs. Sprite, Sprite vs. Group, Group vs. Group, Sprite vs. Tilemap Layer or Group vs. Tilemap Layer collisions.
 * Both the first and second parameter can be arrays of objects, of differing types.
 * If two arrays are passed, the contents of the first parameter will be tested against all contents of the 2nd parameter.
 * The objects are also automatically separated. If you don't require separation then use ArcadePhysics.overlap instead.
 * An optional processCallback can be provided. If given this function will be called when two sprites are found to be colliding. It is called before any separation takes place,
 * giving you the chance to perform additional checks. If the function returns true then the collision and separation is carried out. If it returns false it is skipped.
 * The collideCallback is an optional function that is only called if two sprites collide. If a processCallback has been set then it needs to return true for collideCallback to be called.
 * NOTE: This function is not recursive, and will not test against children of objects passed (i.e. Groups or Tilemaps within other Groups).
 *
 * @method Phaser.Physics.Arcade#collide
 * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer|array} object1 - The first object or array of objects to check. Can be Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter, or Phaser.TilemapLayer.
 * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer|array} object2 - The second object or array of objects to check. Can be Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter or Phaser.TilemapLayer.
 * @param {function} [collideCallback=null] - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them, unless you are colliding Group vs. Sprite, in which case Sprite will always be the first parameter.
 * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
 * @param {object} [callbackContext] - The context in which to run the callbacks.
 * @return {boolean} True if a collision occurred otherwise false.
 */
Arcade.prototype.collide = function(object1, object2, collideCallback, processCallback, callbackContext) {
    collideCallback = collideCallback || null;
    processCallback = processCallback || null;
    callbackContext = callbackContext || collideCallback;

    this._total = 0;
    if (!Array.isArray(object1) && Array.isArray(object2))
    {
        for (var i = 0; i < object2.length; i++)
        {
            this.collideHandler(object1, object2[i], collideCallback, processCallback, callbackContext, false);
        }
    }
    else if (Array.isArray(object1) && !Array.isArray(object2))
    {
        for (var i = 0; i < object1.length; i++)
        {
            this.collideHandler(object1[i], object2, collideCallback, processCallback, callbackContext, false);
        }
    }
    else if (Array.isArray(object1) && Array.isArray(object2))
    {
        for (var i = 0; i < object1.length; i++)
        {
            for (var j = 0; j < object2.length; j++)
            {
                this.collideHandler(object1[i], object2[j], collideCallback, processCallback, callbackContext, false);
            }
        }
    }
    else
    {
        this.collideHandler(object1, object2, collideCallback, processCallback, callbackContext, false);
    }

    return (this._total > 0);
};

/**
 * This method will sort a Groups _hash array based on the sortDirection property.
 *
 * Each function should return -1 if `a > b`, 1 if `a < b` or 0 if `a === b`.
 *
 * @method sort
 * @protected
 * @param {Phaser.Group} group - The Group to sort.
 */
Arcade.prototype.sort = function(group) {
    if (this.sortDirection === Phaser.Physics.Arcade.LEFT_RIGHT)
    {
        //  Game world is say 2000x600 and you start at 0
        group._hash.sort(function(a, b) {
            if (!a.body || !b.body)
            {
                return -1;
            }
            return a.body.x - b.body.x;
        });
    }
    else if (this.sortDirection === Phaser.Physics.Arcade.RIGHT_LEFT)
    {
        //  Game world is say 2000x600 and you start at 2000
        group._hash.sort(function(a, b) {
            if (!a.body || !b.body)
            {
                return -1;
            }
            return b.body.x - a.body.x;
        });
    }
    else if (this.sortDirection === Phaser.Physics.Arcade.TOP_BOTTOM)
    {
        //  Game world is say 800x2000 and you start at 0
        group._hash.sort(function(a, b) {
            if (!a.body || !b.body)
            {
                return -1;
            }
            return a.body.y - b.body.y;
        });
    }
    else if (this.sortDirection === Phaser.Physics.Arcade.BOTTOM_TOP)
    {
        //  Game world is say 800x2000 and you start at 2000
        group._hash.sort(function(a, b) {
            if (!a.body || !b.body)
            {
                return -1;
            }
            return b.body.y - a.body.y;
        });
    }
};

/**
 * Internal collision handler.
 *
 * @method Phaser.Physics.Arcade#collideHandler
 * @private
 * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer} object1 - The first object to check. Can be an instance of Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter, or Phaser.TilemapLayer.
 * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer} object2 - The second object to check. Can be an instance of Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter or Phaser.TilemapLayer. Can also be an array of objects to check.
 * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
 * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
 * @param {object} callbackContext - The context in which to run the callbacks.
 * @param {boolean} overlapOnly - Just run an overlap or a full collision.
 */
Arcade.prototype.collideHandler = function(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly) {
    //  If neither of the objects are set or exist then bail out
    if (!object1 || !object2 || !object1.exists || !object2.exists)
    {
        return;
    }

    //  Groups? Sort them
    if (this.sortDirection !== Phaser.Physics.Arcade.SORT_NONE)
    {
        if (object1.physicsType === Phaser.GROUP)
        {
            this.sort(object1);
        }

        if (object2.physicsType === Phaser.GROUP)
        {
            this.sort(object2);
        }
    }

    //  SPRITES
    this.collideSpriteVsSprite(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
};

/**
 * An internal function. Use Phaser.Physics.Arcade.collide instead.
 *
 * @method Phaser.Physics.Arcade#collideSpriteVsSprite
 * @private
 * @param {Phaser.Sprite} sprite1 - The first sprite to check.
 * @param {Phaser.Sprite} sprite2 - The second sprite to check.
 * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
 * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
 * @param {object} callbackContext - The context in which to run the callbacks.
 * @param {boolean} overlapOnly - Just run an overlap or a full collision.
 * @return {boolean} True if there was a collision, otherwise false.
 */
Arcade.prototype.collideSpriteVsSprite = function(sprite1, sprite2, collideCallback, processCallback, callbackContext, overlapOnly) {

    if (!sprite1.body || !sprite2.body)
    {
        return false;
    }

    if (this.separate(sprite1.body, sprite2.body, processCallback, callbackContext, overlapOnly))
    {
        if (collideCallback)
        {
            collideCallback.call(callbackContext, sprite1, sprite2);
        }

        this._total++;
    }
    return true;
};

/**
 * The core separation function to separate two physics bodies.
 *
 * @private
 * @method Phaser.Physics.Arcade#separate
 * @param {Phaser.Physics.Arcade.Body} body1 - The first Body object to separate.
 * @param {Phaser.Physics.Arcade.Body} body2 - The second Body object to separate.
 * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this function is set then the sprites will only be collided if it returns true.
 * @param {object} [callbackContext] - The context in which to run the process callback.
 * @param {boolean} overlapOnly - Just run an overlap or a full collision.
 * @return {boolean} Returns true if the bodies collided, otherwise false.
 */
Arcade.prototype.separate = function(body1, body2, processCallback, callbackContext, overlapOnly) {
    if (!body1.enable || !body2.enable || !this.intersects(body1, body2))
    {
        return false;
    }

    //  They overlap. Is there a custom process callback? If it returns true then we can carry on, otherwise we should abort.
    if (processCallback && processCallback.call(callbackContext, body1.sprite, body2.sprite) === false)
    {
        return false;
    }

    //  Do we separate on x or y first?

    var result = false;

    //  If we weren't having to carry around so much legacy baggage with us, we could do this properly. But alas ...
    if (this.forceX || Math.abs(this.gravity.y + body1.gravity.y) < Math.abs(this.gravity.x + body1.gravity.x))
    {
        result = (this.separateX(body1, body2, overlapOnly) || this.separateY(body1, body2, overlapOnly));
    }
    else
    {
        result = (this.separateY(body1, body2, overlapOnly) || this.separateX(body1, body2, overlapOnly));
    }

    return overlapOnly ? true : result;
};

/**
 * 相交检查
 */
Arcade.prototype.intersects = function(body1, body2) {
    // 需要判定几个离散点
    var count = Math.max(body1.ccdIterations, body2.ccdIterations);
    if (count <= 0) {
        // 不需要离散点，直接判定
        return !(body1.right <= body2.x || body1.bottom <= body2.y ||
                 body1.x >= body2.right || body1.y >= body2.bottom);
    }

    // 做线性插值
    var deltaX1 = body1._dx / (count + 2),
        deltaX2 = body2._dx / (count + 2),
        deltaY1 = body1._dy / (count + 2),
        deltaY2 = body2._dy / (count + 2);
    var pt1 = Array(count + 1),
        pt2 = Array(count + 1);
    pt1[count] = [body1.x, body1.right, body1.y, body1.bottom];
    pt2[count] = [body2.x, body2.right, body2.y, body2.bottom];
    for (var i = count - 1; i >= 0; i--) {
        pt1[i] = [pt1[i + 1][0] - deltaX1, pt1[i + 1][1] - deltaX1, pt1[i + 1][2] - deltaY1, pt1[i + 1][3] - deltaY1];
    }
    for (i = count - 1; i >= 0; i--) {
        pt2[i] = [pt2[i + 1][0] - deltaX2, pt2[i + 1][1] - deltaX2, pt2[i + 1][2] - deltaY2, pt2[i + 1][3] - deltaY2];
    }

    // 逐个点比较
    for (i = 0; i <= count; i++) {
        if (pt1[i][1] <= pt2[i][0] || pt1[i][3] <= pt2[i][2] ||
            pt1[i][0] >= pt2[i][1] || pt1[i][2] >= pt2[i][3]) {
            // 这个点没有碰撞，继续检测
            continue;
        }

        // 在这个点碰撞了，修正位置
        body1.x = pt1[i][0];
        body1.y = pt1[i][2];
        body2.x = pt2[i][0];
        body2.y = pt2[i][2];
        return true;
    }
    return false;
};

/**
 * The core separation function to separate two physics bodies on the x axis.
 *
 * @private
 * @method Phaser.Physics.Arcade#separateX
 * @param {Phaser.Physics.Arcade.Body} body1 - The Body object to separate.
 * @param {Phaser.Physics.Arcade.Body} body2 - The Body object to separate.
 * @param {boolean} overlapOnly - If true the bodies will only have their overlap data set, no separation or exchange of velocity will take place.
 * @return {boolean} Returns true if the bodies were separated, otherwise false.
 */
Arcade.prototype.separateX = function(body1, body2, overlapOnly) {
    //  Can't separate two immovable bodies
    if (body1.immovable && body2.immovable)
    {
        return false;
    }

    var overlap = 0;

    //  Check if the hulls actually overlap
    if (this.intersects(body1, body2))
    {
        var maxOverlap = body1.deltaAbsX() + body2.deltaAbsX() + this.OVERLAP_BIAS;

        if (body1.deltaX() === 0 && body2.deltaX() === 0)
        {
            //  They overlap but neither of them are moving
            body1.embedded = true;
            body2.embedded = true;
        }
        else if (body1.deltaX() > body2.deltaX())
        {
            //  Body1 is moving right and/or Body2 is moving left
            overlap = body1.right - body2.x;

            if ((overlap > maxOverlap) || body1.checkCollision.right === false || body2.checkCollision.left === false)
            {
                overlap = 0;
            }
            else
            {
                body1.touching.none = false;
                body1.touching.right = true;
                body2.touching.none = false;
                body2.touching.left = true;
            }
        }
        else if (body1.deltaX() < body2.deltaX())
        {
            //  Body1 is moving left and/or Body2 is moving right
            overlap = body1.x - body2.width - body2.x;

            if ((-overlap > maxOverlap) || body1.checkCollision.left === false || body2.checkCollision.right === false)
            {
                overlap = 0;
            }
            else
            {
                body1.touching.none = false;
                body1.touching.left = true;
                body2.touching.none = false;
                body2.touching.right = true;
            }
        }

        //  Resets the overlapX to zero if there is no overlap, or to the actual pixel value if there is
        body1.overlapX = overlap;
        body2.overlapX = overlap;

        //  Then adjust their positions and velocities accordingly (if there was any overlap)
        if (overlap !== 0)
        {
            if (overlapOnly || body1.customSeparateX || body2.customSeparateX)
            {
                return true;
            }

            var v1 = body1.velocity.x;
            var v2 = body2.velocity.x;

            if (!body1.immovable && !body2.immovable)
            {
                overlap *= 0.5;

                body1.x -= overlap;
                body2.x += overlap;

                var nv1 = Math.sqrt((v2 * v2 * body2.mass) / body1.mass) * ((v2 > 0) ? 1 : -1);
                var nv2 = Math.sqrt((v1 * v1 * body1.mass) / body2.mass) * ((v1 > 0) ? 1 : -1);
                var avg = (nv1 + nv2) * 0.5;

                nv1 -= avg;
                nv2 -= avg;

                body1.velocity.x = avg + nv1 * body1.bounce.x;
                body2.velocity.x = avg + nv2 * body2.bounce.x;
            }
            else if (!body1.immovable)
            {
                body1.x -= overlap;
                body1.velocity.x = v2 - v1 * body1.bounce.x;

                //  This is special case code that handles things like vertically moving platforms you can ride
                if (body2.moves)
                {
                    body1.y += (body2.y - body2.prevY) * body2.friction.y;
                }
            }
            else if (!body2.immovable)
            {
                body2.x += overlap;
                body2.velocity.x = v1 - v2 * body2.bounce.x;

                //  This is special case code that handles things like vertically moving platforms you can ride
                if (body1.moves)
                {
                    body2.y += (body1.y - body1.prevY) * body1.friction.y;
                }
            }

            return true;
        }
    }

    return false;
};

/**
 * The core separation function to separate two physics bodies on the y axis.
 *
 * @private
 * @method Phaser.Physics.Arcade#separateY
 * @param {Phaser.Physics.Arcade.Body} body1 - The Body object to separate.
 * @param {Phaser.Physics.Arcade.Body} body2 - The Body object to separate.
 * @param {boolean} overlapOnly - If true the bodies will only have their overlap data set, no separation or exchange of velocity will take place.
 * @return {boolean} Returns true if the bodies were separated, otherwise false.
 */
Arcade.prototype.separateY = function(body1, body2, overlapOnly) {
    //  Can't separate two immovable or non-existing bodies
    if (body1.immovable && body2.immovable)
    {
        return false;
    }

    var overlap = 0;

    //  Check if the hulls actually overlap
    if (this.intersects(body1, body2))
    {
        var maxOverlap = body1.deltaAbsY() + body2.deltaAbsY() + this.OVERLAP_BIAS;

        if (body1.deltaY() === 0 && body2.deltaY() === 0)
        {
            //  They overlap but neither of them are moving
            body1.embedded = true;
            body2.embedded = true;
        }
        else if (body1.deltaY() > body2.deltaY())
        {
            //  Body1 is moving down and/or Body2 is moving up
            overlap = body1.bottom - body2.y;

            if ((overlap > maxOverlap) || body1.checkCollision.down === false || body2.checkCollision.up === false)
            {
                overlap = 0;
            }
            else
            {
                body1.touching.none = false;
                body1.touching.down = true;
                body2.touching.none = false;
                body2.touching.up = true;
            }
        }
        else if (body1.deltaY() < body2.deltaY())
        {
            //  Body1 is moving up and/or Body2 is moving down
            overlap = body1.y - body2.bottom;

            if ((-overlap > maxOverlap) || body1.checkCollision.up === false || body2.checkCollision.down === false)
            {
                overlap = 0;
            }
            else
            {
                body1.touching.none = false;
                body1.touching.up = true;
                body2.touching.none = false;
                body2.touching.down = true;
            }
        }

        //  Resets the overlapY to zero if there is no overlap, or to the actual pixel value if there is
        body1.overlapY = overlap;
        body2.overlapY = overlap;

        //  Then adjust their positions and velocities accordingly (if there was any overlap)
        if (overlap !== 0)
        {
            if (overlapOnly || body1.customSeparateY || body2.customSeparateY)
            {
                return true;
            }

            var v1 = body1.velocity.y;
            var v2 = body2.velocity.y;

            if (!body1.immovable && !body2.immovable)
            {
                overlap *= 0.5;

                body1.y -= overlap;
                body2.y += overlap;

                var nv1 = Math.sqrt((v2 * v2 * body2.mass) / body1.mass) * ((v2 > 0) ? 1 : -1);
                var nv2 = Math.sqrt((v1 * v1 * body1.mass) / body2.mass) * ((v1 > 0) ? 1 : -1);
                var avg = (nv1 + nv2) * 0.5;

                nv1 -= avg;
                nv2 -= avg;

                body1.velocity.y = avg + nv1 * body1.bounce.y;
                body2.velocity.y = avg + nv2 * body2.bounce.y;
            }
            else if (!body1.immovable)
            {
                body1.y -= overlap;
                body1.velocity.y = v2 - v1 * body1.bounce.y;

                //  This is special case code that handles things like horizontal moving platforms you can ride
                if (body2.moves)
                {
                    body1.x += (body2.x - body2.prevX) * body2.friction.x;
                }
            }
            else if (!body2.immovable)
            {
                body2.y += overlap;
                body2.velocity.y = v1 - v2 * body2.bounce.y;

                //  This is special case code that handles things like horizontal moving platforms you can ride
                if (body1.moves)
                {
                    body2.x += (body1.x - body1.prevX) * body1.friction.x;
                }
            }

            return true;
        }
    }

    return false;
};

/**
 * Move the given display object towards the destination object at a steady velocity.
 * If you specify a maxTime then it will adjust the speed (overwriting what you set) so it arrives at the destination in that number of seconds.
 * Timings are approximate due to the way browser timers work. Allow for a variance of +- 50ms.
 * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
 * Note: The display object doesn't stop moving once it reaches the destination coordinates.
 * Note: Doesn't take into account acceleration, maxVelocity or drag (if you've set drag or acceleration too high this object may not move at all)
 *
 * @method Phaser.Physics.Arcade#moveToObject
 * @param {any} displayObject - The display object to move.
 * @param {any} destination - The display object to move towards. Can be any object but must have visible x/y properties.
 * @param {number} [speed=60] - The speed it will move, in pixels per second (default is 60 pixels/sec)
 * @param {number} [maxTime=0] - Time given in milliseconds (1000 = 1 sec). If set the speed is adjusted so the object will arrive at destination in the given number of ms.
 * @return {number} The angle (in radians) that the object should be visually set to in order to match its new velocity.
 */
Arcade.prototype.moveToObject = function(displayObject, destination, speed, maxTime) {
    if (typeof speed === 'undefined') { speed = 60; }
    if (typeof maxTime === 'undefined') { maxTime = 0; }

    var angle = Math.atan2(destination.y - displayObject.y, destination.x - displayObject.x);

    if (maxTime > 0)
    {
        //  We know how many pixels we need to move, but how fast?
        speed = this.distanceBetween(displayObject, destination) / (maxTime / 1000);
    }

    displayObject.body.velocity.x = Math.cos(angle) * speed;
    displayObject.body.velocity.y = Math.sin(angle) * speed;
    return angle;
};

/**
 * Given the angle (in degrees) and speed calculate the velocity and return it as a Point object, or set it to the given point object.
 * One way to use this is: velocityFromAngle(angle, 200, sprite.velocity) which will set the values directly to the sprites velocity and not create a new Point object.
 *
 * @method Phaser.Physics.Arcade#velocityFromAngle
 * @param {number} angle - The angle in degrees calculated in clockwise positive direction (down = 90 degrees positive, right = 0 degrees positive, up = 90 degrees negative)
 * @param {number} [speed=60] - The speed it will move, in pixels per second sq.
 * @param {Phaser.Point|object} [point] - The Point object in which the x and y properties will be set to the calculated velocity.
 * @return {Phaser.Point} - A Point where point.x contains the velocity x value and point.y contains the velocity y value.
 */
Arcade.prototype.velocityFromAngle = function(angle, speed, point) {
    if (typeof speed === 'undefined') { speed = 60; }
    point = point || new Phaser.Point();

    return point.setTo((Math.cos(this.game.math.degToRad(angle)) * speed), (Math.sin(this.game.math.degToRad(angle)) * speed));
};

/**
 * Given the rotation (in radians) and speed calculate the velocity and return it as a Point object, or set it to the given point object.
 * One way to use this is: velocityFromRotation(rotation, 200, sprite.velocity) which will set the values directly to the sprites velocity and not create a new Point object.
 *
 * @method Phaser.Physics.Arcade#velocityFromRotation
 * @param {number} rotation - The angle in radians.
 * @param {number} [speed=60] - The speed it will move, in pixels per second sq.
 * @param {Phaser.Point|object} [point] - The Point object in which the x and y properties will be set to the calculated velocity.
 * @return {Phaser.Point} - A Point where point.x contains the velocity x value and point.y contains the velocity y value.
 */
Arcade.prototype.velocityFromRotation = function(rotation, speed, point) {
    if (typeof speed === 'undefined') { speed = 60; }
    point = point || new Phaser.Point();

    return point.setTo((Math.cos(rotation) * speed), (Math.sin(rotation) * speed));
};

/**
 * Sets the acceleration.x/y property on the display object so it will move towards the target at the given speed (in pixels per second sq.)
 * You must give a maximum speed value, beyond which the display object won't go any faster.
 * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
 * Note: The display object doesn't stop moving once it reaches the destination coordinates.
 *
 * @method Phaser.Physics.Arcade#accelerateToObject
 * @param {any} displayObject - The display object to move.
 * @param {any} destination - The display object to move towards. Can be any object but must have visible x/y properties.
 * @param {number} [speed=60] - The speed it will accelerate in pixels per second.
 * @param {number} [xSpeedMax=500] - The maximum x velocity the display object can reach.
 * @param {number} [ySpeedMax=500] - The maximum y velocity the display object can reach.
 * @return {number} The angle (in radians) that the object should be visually set to in order to match its new trajectory.
 */
Arcade.prototype.accelerateToObject = function(displayObject, destination, speed, xSpeedMax, ySpeedMax) {
    if (typeof speed === 'undefined') { speed = 60; }
    if (typeof xSpeedMax === 'undefined') { xSpeedMax = 1000; }
    if (typeof ySpeedMax === 'undefined') { ySpeedMax = 1000; }

    var angle = this.angleBetween(displayObject, destination);

    displayObject.body.acceleration.setTo(Math.cos(angle) * speed, Math.sin(angle) * speed);
    displayObject.body.maxVelocity.setTo(xSpeedMax, ySpeedMax);

    return angle;
};

/**
 * Find the distance between two display objects (like Sprites).
 *
 * @method Phaser.Physics.Arcade#distanceBetween
 * @param {any} source - The Display Object to test from.
 * @param {any} target - The Display Object to test to.
 * @return {number} The distance between the source and target objects.
 */
Arcade.prototype.distanceBetween = function(source, target) {
    var dx = source.x - target.x;
    var dy = source.y - target.y;

    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Find the angle in radians between two display objects (like Sprites).
 *
 * @method Phaser.Physics.Arcade#angleBetween
 * @param {any} source - The Display Object to test from.
 * @param {any} target - The Display Object to test to.
 * @return {number} The angle in radians between the source and target display objects.
 */
Arcade.prototype.angleBetween = function(source, target) {
    var dx = target.x - source.x;
    var dy = target.y - source.y;

    return Math.atan2(dy, dx);
};

Phaser.Physics.Arcade.Body = function(sprite) {
    /**
     * @property {qc.Sprite} sprite - Reference to the parent Sprite.
     */
    this.sprite = sprite;
    this.qc = sprite._qc;

    /**
     * @property {qc.Game} game - Local reference to game.
     */
    this.game = sprite.game;

    /**
     * @property {number} type - The type of physics system this body belongs to.
     */
    this.type = Phaser.Physics.ARCADE;

    /**
     * @property {boolean} enable - A disabled body won't be checked for any form of collision or overlap or have its pre/post updates run.
     * @default true
     */
    this.enable = true;

    /**
     * @property {number} x - 刚体左上角的屏幕X坐标
     */
    this.x = sprite.world.x;
    this.prevX = this.x;

    /**
     * @property {number} y - 刚体左上角的屏幕Y坐标
     */
    this.y = sprite.world.y;
    this.prevY = this.y;

    /**
     * @property {number} width - 刚体在屏幕中的宽度
     * @readonly
     */
    this.width = sprite.width;

    /**
     * @property {number} height - 刚体在屏幕中的高度
     * @readonly
     */
    this.height = sprite.height;

    /**
     * @property {boolean} allowRotation - Allow this Body to be rotated? (via angularVelocity, etc)
     * @default
     */
    this.allowRotation = true;

    /**
     * An Arcade Physics Body can have angularVelocity and angularAcceleration. Please understand that the collision Body
     * itself never rotates, it is always axis-aligned. However these values are passed up to the parent Sprite and updates its rotation.
     * @property {number} rotation
     */
    this.rotation = sprite.rotation;

    /**
     * @property {number} preRotation - The previous rotation of the physics body.
     * @readonly
     */
    this.preRotation = sprite.rotation;

    /**
     * @property {qc.Point} gravity
     */
    this.gravity = new Phaser.Point(0, 0);

    /**
     * @property {number} ccdIterations - 连续碰撞的散列值
     * @default 0
     */
    this.ccdIterations = 0;

    /**
     * @property {qc.Point} velocity - 运动速度（基于父亲节点）
     */
    this.velocity = new Phaser.Point();
    this.newVelocity = new Phaser.Point(0, 0);

    /**
     * @property {qc.Point} deltaMax - 单次移动的最大距离限制
     */
    this.deltaMax = new Phaser.Point(0, 0);

    /**
     * @property {qc.Point} acceleration - 加速度
     */
    this.acceleration = new Phaser.Point();

    /**
     * @property {qc.Point} drag - The drag applied to the motion of the Body.
     */
    this.drag = new Phaser.Point();

    /**
     * @property {boolean} allowGravity - Allow this Body to be influenced by gravity? Either world or local.
     * @default
     */
    this.allowGravity = true;

    /**
     * @property {Phaser.Point} bounce - The elasticity of the Body when colliding. bounce.x/y = 1 means full rebound, bounce.x/y = 0.5 means 50% rebound velocity.
     */
    this.bounce = new Phaser.Point();

    /**
     * @property {Phaser.Point} maxVelocity - The maximum velocity in pixels per second sq. that the Body can reach.
     * @default
     */
    this.maxVelocity = new Phaser.Point(10000, 10000);

    /**
     * @property {Phaser.Point} friction - The amount of movement that will occur if another object 'rides' this one.
     */
    this.friction = new Phaser.Point(1, 0);

    /**
     * @property {number} angularVelocity - The angular velocity controls the rotation speed of the Body. It is measured in radians per second.
     * @default
     */
    this.angularVelocity = 0;

    /**
     * @property {number} angularAcceleration - The angular acceleration is the rate of change of the angular velocity. Measured in radians per second squared.
     * @default
     */
    this.angularAcceleration = 0;

    /**
     * @property {number} angularDrag - The drag applied during the rotation of the Body.
     * @default
     */
    this.angularDrag = 0;

    /**
     * @property {number} maxAngular - The maximum angular velocity in radians per second that the Body can reach.
     * @default
     */
    this.maxAngular = 1000;

    /**
     * @property {number} mass - The mass of the Body. When two bodies collide their mass is used in the calculation to determine the exchange of velocity.
     * @default
     */
    this.mass = 1;

    /**
     * @property {number} angle - The angle of the Body in radians, as calculated by its angularVelocity.
     * @readonly
     */
    this.angle = 0;

    /**
     * @property {number} speed - The speed of the Body as calculated by its velocity.
     * @readonly
     */
    this.speed = 0;

    /**
     * @property {number} facing - A const reference to the direction the Body is traveling or facing.
     * @default
     */
    this.facing = Phaser.NONE;

    /**
     * @property {boolean} immovable - An immovable Body will not receive any impacts from other bodies.
     * @default
     */
    this.immovable = false;

    /**
     * If you have a Body that is being moved around the world via a tween or a Group motion, but its local x/y position never
     * actually changes, then you should set Body.moves = false. Otherwise it will most likely fly off the screen.
     * If you want the physics system to move the body around, then set moves to true.
     * @property {boolean} moves - Set to true to allow the Physics system to move this Body, otherwise false to move it manually.
     * @default
     */
    this.moves = true;

    /**
     * This flag allows you to disable the custom x separation that takes place by Physics.Arcade.separate.
     * Used in combination with your own collision processHandler you can create whatever type of collision response you need.
     * @property {boolean} customSeparateX - Use a custom separation system or the built-in one?
     * @default
     */
    this.customSeparateX = false;

    /**
     * This flag allows you to disable the custom y separation that takes place by Physics.Arcade.separate.
     * Used in combination with your own collision processHandler you can create whatever type of collision response you need.
     * @property {boolean} customSeparateY - Use a custom separation system or the built-in one?
     * @default
     */
    this.customSeparateY = false;

    /**
     * When this body collides with another, the amount of overlap is stored here.
     * @property {number} overlapX - The amount of horizontal overlap during the collision.
     */
    this.overlapX = 0;

    /**
     * When this body collides with another, the amount of overlap is stored here.
     * @property {number} overlapY - The amount of vertical overlap during the collision.
     */
    this.overlapY = 0;

    /**
     * If a body is overlapping with another body, but neither of them are moving (maybe they spawned on-top of each other?) this is set to true.
     * @property {boolean} embedded - Body embed value.
     */
    this.embedded = false;

    /**
     * A Body can be set to collide against the World bounds automatically and rebound back into the World if this is set to true. Otherwise it will leave the World.
     * @property {boolean} collideWorldBounds - Should the Body collide with the World bounds?
     */
    this.collideWorldBounds = false;

    /**
     * Set the checkCollision properties to control which directions collision is processed for this Body.
     * For example checkCollision.up = false means it won't collide when the collision happened while moving up.
     * @property {object} checkCollision - An object containing allowed collision.
     */
    this.checkCollision = { none: false, any: true, up: true, down: true, left: true, right: true };

    /**
     * This object is populated with boolean values when the Body collides with another.
     * touching.up = true means the collision happened to the top of this Body for example.
     * @property {object} touching - An object containing touching results.
     */
    this.touching = { none: true, up: false, down: false, left: false, right: false };

    /**
     * This object is populated with previous touching values from the bodies previous collision.
     * @property {object} wasTouching - An object containing previous touching results.
     */
    this.wasTouching = { none: true, up: false, down: false, left: false, right: false };

    /**
     * This object is populated with boolean values when the Body collides with the World bounds or a Tile.
     * For example if blocked.up is true then the Body cannot move up.
     * @property {object} blocked - An object containing on which faces this Body is blocked from moving, if any.
     */
    this.blocked = { up: false, down: false, left: false, right: false };

    /**
     * @property {boolean} dirty - If this Body in a preUpdate (true) or postUpdate (false) state?
     */
    this.dirty = false;

    /**
     * @property {boolean} _reset - Internal cache var.
     * @private
     */
    this._reset = true;

    /**
     * @property {number} _sx - Internal cache var.
     * @private
     */
    this._sx = sprite.scale.x;
    this._spx = this._sx;

    /**
     * @property {number} _sy - Internal cache var.
     * @private
     */
    this._sy = sprite.scale.y;
    this._spy = this._sy;

    /**
     * @property {number} _dx - Internal cache var.
     * @private
     */
    this._dx = 0;

    /**
     * @property {number} _dy - Internal cache var.
     * @private
     */
    this._dy = 0;
};
var Body = Phaser.Physics.Arcade.Body;
Body.prototype = {};
Body.prototype.constructor = Body;

Object.defineProperties(Body.prototype, {
    right: {
        get: function() { return this.x + this.width; }
    },
    bottom: {
        get: function() { return this.y + this.height; }
    }
});

/**
 * 当节点缩放变化时，需要重新计算下
 */
Body.prototype.updateBounds = function(force) {
    var wt = this.qc.worldTransform;
    var asx = wt.a, asy = wt.d;

    var pwt = this.qc.parent.worldTransform;
    this._spx = pwt.a;
    this._spy = pwt.d;

    if (force ||
        (asx !== this._sx || asy !== this._sy)) {
        // 缓存scale的数据
        this._sx = asx;
        this._sy = asy;

        // 计算节点的世界宽和高
        // Note: get/set比较耗，这里直接访问内部变量了
        this.width = Math.abs(asx * this.qc._width);
        this.height = Math.abs(asy * this.qc._height);

        // 标记下
        this._reset = true;
    }
};

/**
 * 帧调度
 */
Body.prototype.preUpdate = function() {
    if (!this.enable || this.game.physics.arcade.isPaused) return;

    this.dirty = true;

    //  Store and reset collision flags
    this.wasTouching.none = this.touching.none;
    this.wasTouching.up = this.touching.up;
    this.wasTouching.down = this.touching.down;
    this.wasTouching.left = this.touching.left;
    this.wasTouching.right = this.touching.right;
    this.touching.none = true;
    this.touching.up = false;
    this.touching.down = false;
    this.touching.left = false;
    this.touching.right = false;
    this.blocked.up = false;
    this.blocked.down = false;
    this.blocked.left = false;
    this.blocked.right = false;
    this.embedded = false;

    // 计算当前的位置
    this.updateBounds();
    if (this._sx >= 0) {
        this.x = this.sprite.world.x - (this.sprite.anchor.x * this.width);
    }
    else {
        this.x = this.sprite.world.x - ((1 - this.sprite.anchor.x) * this.width);
    }
    if (this._sy >= 0) {
        this.y = this.sprite.world.y - (this.sprite.anchor.y * this.height);
    }
    else {
        this.y = this.sprite.world.y - ((1 - this.sprite.anchor.y) * this.height);
    }
    this.rotation = this.sprite.angle;
    this.preRotation = this.rotation;

    if (this._reset || this.sprite.fresh)
    {
        this.prevX = this.x;
        this.prevY = this.y;
    }

    if (this.moves)
    {
        this.game.physics.arcade.updateMotion(this);

        this.newVelocity.set(this.velocity.x * this.game.time.physicsElapsed,
            this.velocity.y * this.game.time.physicsElapsed);
        this.x += this.newVelocity.x * this._spx;
        this.y += this.newVelocity.y * this._spy;

        if (this.x !== this.prevX || this.y !== this.prevY)
        {
            this.speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            this.angle = Math.atan2(this.velocity.y, this.velocity.x);
        }

        //  Now the State update will throw collision checks at the Body
        //  And finally we'll integrate the new position back to the Sprite in postUpdate
        if (this.collideWorldBounds)
        {
            this.checkWorldBounds();
        }
    }

    // 计算期望的位移差
    this._dx = this.x - this.prevX;
    this._dy = this.y - this.prevY;

    this._reset = false;
};

Body.prototype.postUpdate = function() {
    if (!this.enable || !this.dirty) return;

    this.dirty = false;

    // 计算调整后的位移（可能因为碰撞等原因进行了调整）
    var dx = this.x - this.prevX,
        dy = this.y - this.prevY;
    if (dx < 0)
    {
        this.facing = Phaser.LEFT;
    }
    else if (dx > 0)
    {
        this.facing = Phaser.RIGHT;
    }
    if (dy < 0)
    {
        this.facing = Phaser.UP;
    }
    else if (dy > 0)
    {
        this.facing = Phaser.DOWN;
    }

    if (this.moves)
    {
        this._dx = dx;
        this._dy = dy;

        if (this.deltaMax.x !== 0 && this._dx !== 0)
        {
            if (this._dx < 0 && this._dx < -this.deltaMax.x)
            {
                this._dx = -this.deltaMax.x;
                this.x = this._dx + this.prevX;
            }
            else if (this._dx > 0 && this._dx > this.deltaMax.x)
            {
                this._dx = this.deltaMax.x;
                this.x = this._dx + this.prevX;
            }
        }

        if (this.deltaMax.y !== 0 && this._dy !== 0)
        {
            if (this._dy < 0 && this._dy < -this.deltaMax.y)
            {
                this._dy = -this.deltaMax.y;
                this.y = this._dy + this.prevY;
            }
            else if (this._dy > 0 && this._dy > this.deltaMax.y)
            {
                this._dy = this.deltaMax.y;
                this.y = this._dy + this.prevY;
            }
        }

        // 根据left和right，计算目标的原点位置
        if (this._dx !== 0) this.qc.x += this._dx / this._spx;
        if (this._dy !== 0) this.qc.y += this._dy / this._spy;
        this._reset = true;
    }

    if (this.allowRotation)
    {
        this.sprite.angle += this.deltaZ();
    }
    this.prevX = this.x;
    this.prevY = this.y;
};

Body.prototype.destroy = function() {
    this.sprite.body = null;
    this.sprite = null;
    this.qc = null;
};

Body.prototype.checkWorldBounds = function() {
    if (this.x < this.game.physics.arcade.bounds.x && this.game.physics.arcade.checkCollision.left &&
        this._dx < 0)
    {
        // 碰到左边界了，需要拉回来
        var qc = this.sprite._qc;
        this.x = this.game.physics.arcade.bounds.x;

        this.velocity.x *= -this.bounce.x;
        this.blocked.left = true;
    }
    else if (this.right > this.game.physics.arcade.bounds.right && this.game.physics.arcade.checkCollision.right &&
        this._dx > 0)
    {
        // 碰到右边界了，需要拉回来
        var qc = this.sprite._qc;
        this.x = this.game.physics.arcade.bounds.right - this.width;

        this.velocity.x *= -this.bounce.x;
        this.blocked.right = true;
    }

    if (this.y < this.game.physics.arcade.bounds.y && this.game.physics.arcade.checkCollision.up &&
        this._dy < 0)
    {
        // 碰到上边界了，需要拉回来
        var qc = this.sprite._qc;
        this.y = this.game.physics.arcade.bounds.y;

        this.velocity.y *= -this.bounce.y;
        this.blocked.up = true;
    }
    else if (this.bottom > this.game.physics.arcade.bounds.bottom && this.game.physics.arcade.checkCollision.down &&
        this._dy > 0)
    {
        // 碰到下边界了，需要拉回来
        var qc = this.sprite._qc;
        this.y = this.game.physics.arcade.bounds.bottom - this.height;

        this.velocity.y *= -this.bounce.y;
        this.blocked.down = true;
    }
};

Body.prototype.reset = function(x, y) {
    this.velocity.set(0);
    this.acceleration.set(0);

    this.speed = 0;
    this.angularVelocity = 0;
    this.angularAcceleration = 0;

    this._reset = true;
};

/**
 * Returns true if the bottom of this Body is in contact with either the world bounds or a tile.
 *
 * @method Phaser.Physics.Arcade.Body#onFloor
 * @return {boolean} True if in contact with either the world bounds or a tile.
 */
Body.prototype.onFloor = function() {
    return this.blocked.down;
};

/**
 * Returns true if either side of this Body is in contact with either the world bounds or a tile.
 *
 * @method Phaser.Physics.Arcade.Body#onWall
 * @return {boolean} True if in contact with either the world bounds or a tile.
 */
Body.prototype.onWall = function() {
    return (this.blocked.left || this.blocked.right);
};

/**
 * Returns the absolute delta x value.
 *
 * @method Phaser.Physics.Arcade.Body#deltaAbsX
 * @return {number} The absolute delta value.
 */
Body.prototype.deltaAbsX = function() {
    return (this.deltaX() > 0 ? this.deltaX() : -this.deltaX());
};

/**
 * Returns the absolute delta y value.
 *
 * @method Phaser.Physics.Arcade.Body#deltaAbsY
 * @return {number} The absolute delta value.
 */
Body.prototype.deltaAbsY = function() {
    return (this.deltaY() > 0 ? this.deltaY() : -this.deltaY());
};

/**
 * Returns the delta x value. The difference between Body.x now and in the previous step.
 *
 * @method Phaser.Physics.Arcade.Body#deltaX
 * @return {number} The delta value. Positive if the motion was to the right, negative if to the left.
 */
Body.prototype.deltaX = function (){
    return this.x - this.prevX;
};

/**
 * Returns the delta y value. The difference between Body.y now and in the previous step.
 *
 * @method Phaser.Physics.Arcade.Body#deltaY
 * @return {number} The delta value. Positive if the motion was downwards, negative if upwards.
 */
Body.prototype.deltaY = function() {
    return this.y - this.prevY;
};

/**
 * Returns the delta z value. The difference between Body.rotation now and in the previous step.
 *
 * @method Phaser.Physics.Arcade.Body#deltaZ
 * @return {number} The delta value. Positive if the motion was clockwise, negative if anti-clockwise.
 */
Body.prototype.deltaZ = function() {
    return this.rotation - this.preRotation;
};

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 负责处理游戏的物理（使用arcade physics），刚体
 * @class qc.arcade.RigidBody
 */
var RigidBody = qc.defineBehaviour('qc.arcade.RigidBody', qc.Behaviour, function() {
        var self = this;
        self.arcade = self.game.phaser.physics.arcade;
        self.phaser = self.gameObject.phaser;

        // 检测碰撞的节点
        self._collide = [];

        // 检测重合的节点
        self._overlap = [];

        // 只有精灵和UIImage才能挂载刚体
        if (!(self.gameObject instanceof qc.Sprite) && !(self.gameObject instanceof qc.UIImage))
            throw new Error('Only Sprite or UIImage can attack RigidBody!');
        self.phaser.enableBody = false;
        self.phaser.physicsBodyType = Phaser.Physics.ARCADE;
        self.arcade.enable(self.phaser, false);
        self.phaser.body.enable = false;
        self.phaser.body._qc = self;
    }, function() {
        return {
            // 需要序列化的字段列表
            mass: qc.Serializer.NUMBER,
            collideWorldBounds: qc.Serializer.BOOLEAN,
            allowRotation: qc.Serializer.BOOLEAN,
            allowGravity: qc.Serializer.BOOLEAN,
            velocity: qc.Serializer.POINT,
            maxVelocity: qc.Serializer.POINT,
            acceleration: qc.Serializer.POINT,
            drag: qc.Serializer.POINT,
            gravity: qc.Serializer.POINT,
            friction: qc.Serializer.POINT,
            angularVelocity: qc.Serializer.NUMBER,
            maxAngular: qc.Serializer.NUMBER,
            angularAcceleration: qc.Serializer.NUMBER,
            angularDrag: qc.Serializer.NUMBER,
            bounce: qc.Serializer.POINT,
            immovable: qc.Serializer.BOOLEAN,
            moves: qc.Serializer.BOOLEAN,
            checkCollision: qc.Serializer.MAPPING,
            tilePadding: qc.Serializer.POINT,
            collides: qc.Serializer.NODES,
            overlaps: qc.Serializer.NODES,
            ccdIterations: qc.Serializer.INT
        }
    }
);

// 菜单上的显示
RigidBody.__menu = 'Plugins/Arcade/RigidBody';

Object.defineProperties(RigidBody.prototype, {
    /**
     * @property {number} mass - 物体的质量
     * @default 1
     */
    mass: {
        get: function()  { return this.phaser.body.mass; },
        set: function(v) { this.phaser.body.mass = v;    }
    },

    /**
     * @property {boolean} collideWorldBounds - 碰到游戏世界的边界是否反弹
     * @default false
     */
    collideWorldBounds: {
        get: function()  { return this.phaser.body.collideWorldBounds; },
        set: function(v) { this.phaser.body.collideWorldBounds = v;    }
    },

    /**
     * @property {boolean} allowRotation - 是否允许刚体旋转
     * @default true
     */
    allowRotation: {
        get: function()  { return this.phaser.body.allowRotation; },
        set: function(v) { this.phaser.body.allowRotation = v;    }
    },

    /**
     * @property {boolean} allowGravity - 是否受重力影响
     * @default true
     */
    allowGravity: {
        get: function()  { return this.phaser.body.allowGravity; },
        set: function(v) { this.phaser.body.allowGravity = v;    }
    },

    /**
     * @property {qc.Point} velocity - 速度
     * @default {x:0, y:0}
     */
    velocity: {
        get: function()  { return this.phaser.body.velocity; },
        set: function(v) { this.phaser.body.velocity = v;    }
    },

    /**
     * @property {qc.Point} maxVelocity - 最大移动速度
     * @default {x:10000, y:10000}
     */
    maxVelocity: {
        get: function()  { return this.phaser.body.maxVelocity; },
        set: function(v) { this.phaser.body.maxVelocity = v;    }
    },

    /**
     * @property {number} angularAcceleration - 角移动加速度
     * @default
     */
    angularAcceleration: {
        get: function()  { return this.phaser.body.angularAcceleration; },
        set: function(v) { this.phaser.body.angularAcceleration = v;
                           this.gameObject._isTransformDirty = true;    }
    },

    /**
     * @property {qc.Point} acceleration - 加速度
     * @default {x:0, y:0}
     */
    acceleration: {
        get: function()  { return this.phaser.body.acceleration; },
        set: function(v) { this.phaser.body.acceleration = v;    }
    },

    /**
     * @property {qc.Point} drag - 空气阻力
     * @default {x:0, y:0}
     */
    drag: {
        get: function()  { return this.phaser.body.drag; },
        set: function(v) { this.phaser.body.drag = v;    }
    },

    /**
     * @property {qc.Point} gravity - 重力
     * @default {x:0, y:0}
     */
    gravity: {
        get: function()  { return this.phaser.body.gravity; },
        set: function(v) { this.phaser.body.gravity = v;
                           this.gameObject._isTransformDirty = true; }
    },

    /**
     * @property {qc.Point} bounce - 反弹力
     * @default {x:0, y:0}
     */
    bounce: {
        get: function()  { return this.phaser.body.bounce; },
        set: function(v) { this.phaser.body.bounce = v;
                           this.gameObject._isTransformDirty = true; }
    },

    /**
     * @property {qc.Point} friction - 摩擦力
     * @default {x:1, y:0}
     */
    friction: {
        get: function()  { return this.phaser.body.friction; },
        set: function(v) { this.phaser.body.friction = v;
                           this.gameObject._isTransformDirty = true; }
    },

    /**
     * @property {number} angularVelocity - 角速度（弧度）
     * @default 0
     */
    angularVelocity: {
        get: function()  { return this.phaser.body.angularVelocity; },
        set: function(v) { this.phaser.body.angularVelocity = v;
                           this.gameObject._isTransformDirty = true; }
    },

    /**
     * @property {number} angularDrag - 角阻力
     * @default 0
     */
    angularDrag: {
        get: function()  { return this.phaser.body.angularDrag; },
        set: function(v) { this.phaser.body.angularDrag = v;
                           this.gameObject._isTransformDirty = true; }
    },

    /**
     * @property {number} maxAngular - 最大角速度（弧度）
     * @default 1000
     */
    maxAngular: {
        get: function()  { return this.phaser.body.maxAngular; },
        set: function(v) { this.phaser.body.maxAngular = v;    }
    },

    /**
     * @property {number} angle - 当前物体的角度（弧度）
     * @readonly
     */
    angle: {
        get: function() { return this.phaser.body.angle; }
    },

    /**
     * @property {number} speed - 当前物体的移动速度
     * @readonly
     */
    speed: {
        get: function() { return this.phaser.body.speed; }
    },

    /**
     * @property {boolean} immovable - 物理固定不动，不受其他刚体的影响
     * @default false
     */
    immovable: {
        get: function()  { return this.phaser.body.immovable; },
        set: function(v) { this.phaser.body.immovable = v;    }
    },

    /**
     * @property {boolean} moves - 当前是否由物理来决定其位置信息
     * @default true
     */
    moves: {
        get: function()  { return this.phaser.body.moves; },
        set: function(v) { this.phaser.body.moves = v;
                           this.gameObject._isTransformDirty = true; }
    },

    /**
     * @property {number} overlapX - 物理重叠后X方向的重叠范围
     * @readonly
     */
    overlapX: {
        get: function() { return this.phaser.body.overlapX; }
    },

    /**
     * @property {number} overlapY - 物理重叠后Y方向的重叠范围
     * @readonly
     */
    overlapY: {
        get: function() { return this.phaser.body.overlapY; }
    },

    /**
     * @property {boolean} embedded - 两个物体重叠但都没运动时，设置为true
     * @readonly
     */
    embedded: {
        get: function()  { return this.phaser.body.embedded; },
        set: function(v) { this.phaser.body.embedded = v;    }
    },

    /**
     * @property {object} checkCollision - 当物体向某方向移动时，是否检查碰撞
     * @default { none: false, any: true, up: true, down: true, left: true, right: true }
     */
    checkCollision: {
        get: function()  { return this.phaser.body.checkCollision; },
        set: function(v) { this.phaser.body.checkCollision = v;    }
    },

    /**
     * @property {object} touching - 物体碰撞后指明是从什么方向进入碰撞的
     * 例如：touching.up = true - 表示碰撞发生在顶部
     * @readonly
     */
    touching: {
        get: function() { return this.phaser.body.touching; }
    },

    /**
     * @property {object} wasTouching - This object is populated with previous touching values from the bodies previous collision.
     * @readonly
     */
    wasTouching: {
        get: function() { return this.phaser.body.wasTouching; }
    },

    /**
     * @property {object} blocked - 物体不能向某个方向移动
     * @readonly
     */
    blocked: {
        get: function()  { return this.phaser.body.blocked; },
        set: function(v) { this.phaser.body.blocked = v;    }
    },

    /**
     * @property {qc.Point} tilePadding -
     * 物体高速运动时，可能会穿过其他物体。
     * 设置这个值可以额外按照步长检测，防止这种情况的发生
     */
    tilePadding: {
        get: function()  { return this.phaser.body.tilePadding; },
        set: function(v) { this.phaser.body.tilePadding = v;    }
    },

    /**
     * @property {boolean} onFloor - 物体是不是在世界（地图）的底部
     * @readonly
     */
    onFloor: {
        get: function() { return this.phaser.body.onFloor(); }
    },

    /**
     * @property {boolean} onWall - 物体是不是某一边靠在世界边界
     * @readonly
     */
    onWall: {
        get: function() { return this.phaser.body.onWall(); }
    },

    /**
     * @property {number} deltaX - 两帧之间，物体在X方向移动的距离
     * @readonly
     */
    deltaX: {
        get: function() { return this.phaser.body.deltaX(); }
    },

    /**
     * @property {number} deltaY - 两帧之间，物体在Y方向移动的距离
     * @readonly
     */
    deltaY: {
        get: function() { return this.phaser.body.deltaY(); }
    },

    /**
     * @property {number} deltaZ - 两帧之间，物体旋转的弧度
     * @readonly
     */
    deltaZ: {
        get: function() { return this.phaser.body.deltaZ(); }
    },

    /**
     * @property {array} collides - 需要进行碰撞检测的元素
     */
    collides: {
        get: function()  { return this._collide; },
        set: function(v) { this._collide = v;    }
    },

    /**
     * @property {array} collides - 需要进行重叠检测的元素
     */
    overlaps: {
        get: function()  { return this._overlap; },
        set: function(v) { this._overlap = v;    }
    },

    /**
     * @property {number} ccdIterations
     *  碰撞检测时的离散点数量（0或-1表示不检测离散点）
     *  注意：值越大性能越差，但碰撞检测的效果越好
     * @default 0
     */
    ccdIterations: {
        get: function()  { return this.phaser.body.ccdIterations; },
        set: function(v) { this.phaser.body.ccdIterations = v;    }
    }
});

/**
 * 组件初始化
 */
RigidBody.prototype.awake = function() {
    // 强制重更新包围盒
    var body = this.phaser.body;
    body.updateBounds(true);
};

/**
 * 组件启用的处理
 */
RigidBody.prototype.onEnable = function() {
    var self = this;
    self.phaser.enableBody = true;
    self.phaser.body.enable = true;
};

/**
 * 组件禁用的处理
 */
RigidBody.prototype.onDisable = function() {
    var self = this;
    self.phaser.enableBody = false;
    self.phaser.body.enable = false;
};

/**
 * 帧调度
 */
RigidBody.prototype.updateRigidbody = function() {
    var self = this;
    for (var i = 0; i < self._collide.length; i++) {
        var node = self._collide[i];
        if (!node || node._destroy) continue;
        self.arcade.collide(self.phaser, node.phaser, self._collideCallback, undefined, self);
    }
    for (var i = 0; i < self._overlap.length; i++) {
        var node = self._overlap[i];
        if (!node || node._destroy) continue;
        self.arcade.overlap(self.phaser, node.phaser, self._overlapCallback, undefined, self);
    }
};

/**
 * 重置刚体的数据
 * @method qc.arcade.RigidBody#reset
 */
RigidBody.prototype.reset = function() {
    this._collide = [];
    this._overlap = [];
    this.phaser.body.reset(this.gameObject.x, this.gameObject.y);
};

/**
 * 添加一个碰撞检测节点
 * @method qc.arcade.RigidBody#addCollide
 */
RigidBody.prototype.addCollide = function(node) {
    if (this._collide.indexOf(node) === -1) {
        this._collide.push(node);
    }
};

/**
 * 删除一个碰撞检测节点
 * @method qc.arcade.RigidBody#removeCollide
 */
RigidBody.prototype.removeCollide = function(node) {
    var index = this._collide.indexOf(node);
    if (index !== -1) {
        this._collide.splice(index, 1);
    }
};

/**
 * 添加一个重叠检测节点
 * @method qc.arcade.RigidBody#addOverlap
 */
RigidBody.prototype.addOverlap = function(node) {
    if (this._overlap.indexOf(node) === -1) {
        this._overlap.push(node);
    }
};

/**
 * 删除一个重叠检测节点
 * @method qc.arcade.RigidBody#removeOverlap
 */
RigidBody.prototype.removeOverlap = function(node) {
    var index = this._overlap.indexOf(node);
    if (index !== -1) {
        this._overlap.splice(index, 1);
    }
};

/**
 * 按照一定的速度移动到目标位置
 * 如果指定了maxTime，会自动调整移动速度（确保按照指定的时间到达目标点）
 * 注意：移动时不会跟踪目标
 * 注意：当移动到目标位置时才会停止
 * @method qc.arcade.RigidBody#moveToObject
 * @param {any} destination - 目标位置（包含有xy属性即可）
 * @param {number} [speed=60] - 移动速度，每秒移动多少像素
 * @param {number} [maxTime=0] - 最大的耗时时间，单位毫秒
 * @return {number} 当前物体的旋转弧度
 */
RigidBody.prototype.moveToObject = function(destination, speed, maxTime) {
    return this.arcade.moveToObject(this.phaser, destination, speed, maxTime);
};

/**
 * 根据角度和速度，得到水平和垂直方向的速度
 * @param angle
 * @param speed
 * @param point
 * @returns {qc.Point}
 */
RigidBody.prototype.velocityFromAngle = function(angle, speed, point) {
    return this.arcade.velocityFromAngle(angle, speed, point);
};

/**
 * 根据弧度和速度，得到水平和垂直方向的速度
 * @param rotation
 * @param speed
 * @param point
 */
RigidBody.prototype.velocityFromRotation = function(rotation, speed, point) {
    return this.arcade.velocityFromRotation(rotation, speed, point);
};

/**
 * 以加速度移动到目标位置
 * @method qc.arcade.RigidBody#accelerateToObject
 * @param destination
 * @param speed
 * @param xSpeedMax
 * @param ySpeedMax
 */
RigidBody.prototype.accelerateToObject = function(destination, speed, xSpeedMax, ySpeedMax) {
    return this.arcade.accelerateToObject(this.phaser, destination, speed, xSpeedMax, ySpeedMax);
};

/**
 * 计算距离
 * @method qc.arcade.RigidBody#distanceBetween
 * @param target
 * @returns {number}
 */
RigidBody.prototype.distanceBetween = function(target) {
    return this.arcade.distanceBetween(this.phaser, target);
};

/**
 * 计算夹角（弧度）
 * @method qc.arcade.RigidBody#angleBetween
 * @param target
 * @returns {number}
 */
RigidBody.prototype.angleBetween = function(target) {
    return this.arcade.angleBetween(this.phaser, target);
};

/**
 * 碰撞的回调
 * @private
 */
RigidBody.prototype._collideCallback = function(o1, o2) {
    this.gameObject._sendMessage('onCollide', false, o1._qc, o2._qc);
};

/**
 * 重叠的回调
 * @private
 */
RigidBody.prototype._overlapCallback = function(o1, o2) {
    this.gameObject._sendMessage('onOverlap', false, o1._qc, o2._qc);
};

if(!wh){
	var wh = {};
}
wh.Server = {
	address: "ws://localhost:8010/TestServer/server",
	socket: null,

	connect: function(){
		if(window['address']){
			wh.Server.address = window['address'];
		}
		wh.Server.socket = new WebSocket(wh.Server.address);
		console.log("正在连接至服务器...");
		wh.Server.socket.onopen = function(event){
			wh.Server.socket.onmessage = wh.Server.onMessage;
			wh.Server.socket.onclose = wh.Server.onClose;
			wh.Server.socket.onerror = wh.Server.onError;
			wh.Server.onOpen(event);
		};
	},

	onOpen: function(event){
		console.log("成功连接到服务器。");
		wh.Event.call('ON_OPEN');
	},

	onMessage: function(event){
		//console.log("收到消息:\n" + event.data);
		wh.Event.call('ON_MESSAGE', event.data);
	},

	onError: function(event){
		//console.log("收到消息:\n" + event.data);
		wh.Event.call('ON_ERROR', event.data);
	},

	onClose: function(event){
		console.log("从服务器断开:" + event.data);
		wh.Event.call('ON_CLOSE', event.data);
	},

	send: function(msg){
		wh.Server.socket.send(msg);
	}
};

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

// define a user behaviour
var ClickPanelManager = qc.defineBehaviour('qc.engine.ClickPanelManager', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    // fields need to be serialized
});

// Called when the script instance is being loaded.
//ClickPanelManager.prototype.awake = function() {
//
//};

// Called every frame, if the behaviour is enabled.
ClickPanelManager.prototype.onClick = function(data) {
	if(!GameManager.instance.god) return;

	var x = data.source.x;
	var y = data.source.y;

	var camX = GameManager.instance.camera.anchoredX;
	var camY = GameManager.instance.camera.anchoredY;

	var calcX = x - camX;
	var calcY = -(640 - y) - camY;

	GameManager.instance.me.gameObject.anchoredX = calcX;
	GameManager.instance.me.gameObject.anchoredY = calcY;
	if(GameManager.instance.me.rigidbody){
		GameManager.instance.me.rigidbody.velocity.x = 0;
		GameManager.instance.me.rigidbody.velocity.y = 0;
	}


	GameManager.instance.me.sendMovePack('warp');
};

var DialogBubble = qc.defineBehaviour('qc.wtf.DialogBubble', qc.Behaviour, function() {
    this.maxWidth = 160;
}, {
    dialog: qc.Serializer.NODE
});

DialogBubble.prototype.awake = function() {
	this.gameObject.visible = false;
};

DialogBubble.prototype.show = function(dialog, uuid) {
	this.gameObject.visible = false;
	this.gameObject.width = this.maxWidth + 10;
	this.dialog.text = dialog;
	var self = this;

    if(!SoundManager.instance.mute){
    	var audio = document.getElementById("audio");
       audio.src = 'http://tts.baidu.com/text2audio?lan=zh&pid=101&ie=UTF-8&idx=1&tex=' + encodeURI(dialog) + '&per=' + (uuid % 4) + '&ctp=1&cuid=1&pdt=1';
    //audio.src = 'http://tts.baidu.com/text2audio?lan=zh&pid=101&ie=UTF-8&text=' + encodeURI(dialog) + '&spd=5';
        audio.play();
    }
	self.gameObject.visible = true;
	self.gameObject.alpha = 0;
	this.game.timer.add(100, function(){
		if(self.dialog.nativeSize.width < self.maxWidth){
			self.gameObject.width = self.dialog.nativeSize.width + 10;
		}else{
			self.gameObject.width = self.maxWidth + 10;
		}
		self.gameObject.height = self.dialog.nativeSize.height + 10;

		wh.Tween.remove(self.gameObject);
		wh.Tween.get(self.gameObject)
			.to({alpha:1}, 500)
			.wait(5000)
			.to({alpha:0}, 500);
	});
};

var Elevator = qc.defineBehaviour('qc.wtf.Elevator', qc.Behaviour, function() {
	this.isOn = false;
	this.eval = 0;
	this.rigidbody = null;

	this.onSp = new qc.Point(0, 0);
	this.offSp = new qc.Point(0, 0);
}, {
	startPos: qc.Serializer.POINT,
	endPos: qc.Serializer.POINT,
	startSpeed: qc.Serializer.NUMBER,
	endSpeed: qc.Serializer.NUMBER
});

Elevator.prototype.awake = function() {
	this.rigidbody = this.gameObject.getScript('qc.arcade.RigidBody');
	this.onSp.x = (this.endPos.x - this.startPos.x) * this.startSpeed;
	this.onSp.y = (this.endPos.y - this.startPos.y) * this.startSpeed;
	this.offSp.x = (this.startPos.x - this.endPos.x) * this.endSpeed;
	this.offSp.y = (this.startPos.y - this.endPos.y) * this.endSpeed;
};

Elevator.prototype.turnOn = function() {
	this.isOn = true;
};

Elevator.prototype.turnOff = function() {
	this.isOn = false;
};

Elevator.prototype.update = function() {
	if(this.isOn){
		if(!this.checkReach(this.onSp, this.startPos, this.endPos)){
			this.rigidbody.velocity.x = this.onSp.x;
			this.rigidbody.velocity.y = this.onSp.y;
		}else{
			this.rigidbody.velocity.x = 0;
			this.rigidbody.velocity.y = 0;
		}
	}else{
		if(!this.checkReach(this.offSp, this.endPos, this.startPos)){
			this.rigidbody.velocity.x = this.offSp.x;
			this.rigidbody.velocity.y = this.offSp.y;
		}else{
			this.rigidbody.velocity.x = 0;
			this.rigidbody.velocity.y = 0;
		}
	}
};

Elevator.prototype.checkReach = function(vec, startPos, endPos) {
	if(vec.x != 0){
		if(vec.x < 0){
			if(this.gameObject.anchoredX <= endPos.x){
				this.gameObject.anchoredX = endPos.x;
				this.gameObject.anchoredY = endPos.y;
				return true;
			}
		}else{
			if(this.gameObject.anchoredX >= endPos.x){
				this.gameObject.anchoredX = endPos.x;
				this.gameObject.anchoredY = endPos.y;
				return true;
			}
		}
	}else{
		if(vec.y < 0){
			if(this.gameObject.anchoredY <= endPos.y){
				this.gameObject.anchoredX = endPos.x;
				this.gameObject.anchoredY = endPos.y;
				return true;
			}
		}else{
			if(this.gameObject.anchoredY >= endPos.y){
				this.gameObject.anchoredX = endPos.x;
				this.gameObject.anchoredY = endPos.y;
				return true;
			}
		}
	}
	return false;
};

// define a user behaviour
var FlashController = qc.defineBehaviour('qc.wtf.FlashController', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    // fields need to be serialized
});

// Called when the script instance is being loaded.
FlashController.prototype.awake = function() {
	this.gameObject.visible = true;
	this.gameObject.alpha = 0;
	wh.Event.bind('$flash', this.onFlash, this);
};

// Called every frame, if the behaviour is enabled.
FlashController.prototype.onFlash = function() {
	SoundManager.instance.play('flash');
	wh.Tween.remove(this.gameObject);
	wh.Tween.get(this.gameObject)
		.to({alpha:0.5})
		.to({alpha:0}, 200);
};

var GameManager = qc.defineBehaviour('qc.wtf.GameManager', qc.Behaviour, function() {
	GameManager.instance = this;
	this.sceneStuff = [];
	this.players = [];
	this.me = null;
	this.playerMap = {};
	this.tick = 0;
	this.flashTick = 0;

	this.currentLevel = null;
	this.num = 1;
	this.myName = 'Player';
	this.myUUID = -1;
    this.myScore = 0;
	this.myTitle = "";
	this.channel = 0;
	this.lastChannel = -1;
	this.mapData = null;
	this.ignoreList = [];
	this.isAdmin = false;
	this.god = false;
	this.mode = "unknown";
}, {
	map: qc.Serializer.NODE,
	flash: qc.Serializer.NODE,
	camera: qc.Serializer.NODE,
	playerPrefab: qc.Serializer.PREFAB,
	plankPrefab: qc.Serializer.PREFAB,
	levels: qc.Serializer.NODES,
	pLevels: qc.Serializer.NODES,
	pyLevel: qc.Serializer.NODE,
    sceneStuff: qc.Serializer.NODES,
	players: qc.Serializer.NODES,
	version: qc.Serializer.STRING
});

GameManager.prototype.awake = function() {
	//wh.Tween.init(this.game);
	this.game.input.onKeyDown.add(this.onKeyDown, this);
	this.game.input.onKeyUp.add(this.onKeyUp, this);
	wh.Event.bind('$room', this.onGetRoom, this);
	wh.Event.bind('$newmap', this.onSwitchMap, this);
	wh.Event.bind('$newplayer', this.onNewPlayer, this);
	wh.Event.bind('$playerdata', this.onGetPlayerData, this);
	this.gameObject.visible = false;

	wh.Event.bind('$move', this.onReceiveMove, this);
	wh.Event.bind('$leave', this.onLeave, this);
	wh.Event.bind('$score', this.onScore, this);
	wh.Event.bind('$msg', this.onMsg, this);
	wh.Event.bind('$flash', this.onFlash, this);
	wh.Event.bind('$infect', this.onInfect, this);
	wh.Event.bind('$source', this.onSource, this);
	wh.Event.bind('$alert', this.onAlert, this);
	wh.Event.bind('$afkkick', this.onAFKKick, this);
	wh.Event.bind('$kick', this.onKick, this);

	wh.Event.bind('$fullsur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			var p = this.playerMap["p" + uuid];
			if(p && p.Player){
				if(p.Player.isMe){
					GameManager.instance.myScore += 5;
				}
				p.Player.showLabel("+5");
			}
		}

	}, this);

	wh.Event.bind('$halfsur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			var p = this.playerMap["p" + uuid];
			if(p && p.Player){
				if(p.Player.isMe){
					GameManager.instance.myScore += 1;
				}
				p.Player.showLabel("+1");
			}
		}
	}, this);

	wh.Event.bind('$sur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			var p = this.playerMap["p" + uuid];
			if(p && p.Player){
				if(p.Player.isMe){
					GameManager.instance.myScore += 3;
				}
				p.Player.showLabel("+3");
			}
		}
	}, this);

	wh.Event.bind('$key', function(data){
		if(window.localStorage){
			window.localStorage.setItem("key", data.key);
		}
	}, this);

	wh.Event.bind('$title', function(data){
		var p = this.playerMap["p" + data.uuid];
		if(p && p.Player){
			p.Player.setTitle(data.title);
			if(p.Player == this.me){
				this.myTitle = data.title;
			}
		}
	}, this);

	wh.Event.bind('$god', function(){
		this.god = !this.god;
		this.me.showLabel(this.god ? "开启上帝模式" : "关闭上帝模式");
	}, this);

	wh.Event.bind('$admin', function(){
		this.isAdmin = true;
		this.me.showLabel("已获取管理员权限");
	}, this);

	this.game.input.onKeyDown.add(this.onKeyDown, this);
};

GameManager.prototype.onInfect = function(data) {
	if(this.mode != "plague") return;
	var s = data.s;
	var m = data.m;

	if(s){
		var sp = this.playerMap["p" + s];
		if(sp && sp.Player){
			sp.Player.infectOther();
			if(sp.Player.isMe){
				GameManager.instance.myScore += 1;
			}
		}
	}

	if(m){
		var mp = this.playerMap["p" + m];
		if(mp && mp.Player){
			mp.Player.infect(false, false);
		}
	}
};

GameManager.prototype.onSource = function(data) {
	if(this.mode != "plague") return;
	var mp = this.playerMap["p" + data.uuid];
	if(mp && mp.Player){
		mp.Player.infect(true, true);
	}
};

GameManager.prototype.onAFKKick = function(data) {
	alert("您AFK太久，被移出游戏了！");
	location.reload();
};

GameManager.prototype.onKick = function(data) {
	alert("您被管理员请出游戏了！");
	location.reload();
};

GameManager.prototype.onReceiveMove = function(data) {
	var p = this.playerMap["p" + data.uuid];
	if(p && p.Player){
		p.Player.onReceiveMove(data);
	}
};

GameManager.prototype.onLeave = function(data) {
	var p = this.playerMap["p" + data.uuid];
	if(p && p.Player){
		p.Player.onLeave(data);
	}
};

GameManager.prototype.onScore = function(data) {
	if(this.mode != "race") return;
	var p = this.playerMap["p" + data.uuid];
	if(p && p.Player){
		p.Player.onScore(data);
		if(p.Player.isMe){
			GameManager.instance.myScore += data.score;
		}
	}

};

GameManager.prototype.onMsg = function(data) {
	var p = this.playerMap["p" + data.uuid];
	if(p && p.Player){
		if(this.ignoreList.indexOf(data.uuid) >= 0){
			return;
		}
		p.Player.onMsg(data);
	}
};

GameManager.prototype.onFlash = function(data) {
	if(this.mode != "race") return;
	this.flashTick = this.tick;
	// if(this.me){
	// 	this.me.onFlash(data);
	// }
};

GameManager.prototype.onAlert = function(data) {
	alert(data.t);
};

GameManager.prototype.update = function() {
	this.tick++;
	this.workCamera();
};

GameManager.prototype.workCamera = function() {
	if(!this.camera || !this.currentLevel){
		return;
	}

	if(this.currentLevel.levelWidth > 960){
		if(this.me){
			var targetX = -Math.min(Math.max(0, this.me.gameObject.anchoredX - 480), this.currentLevel.levelWidth - 960);
			this.camera.anchoredX = this.camera.anchoredX + (targetX - this.camera.anchoredX) * 0.08;
		}
	}else if(this.camera.anchoredX != 0){
		this.camera.anchoredX = 0;
	}

	if(this.currentLevel.levelHeight > 640){
		if(this.me){
			var targetY = Math.min(Math.max(0, -(this.me.gameObject.anchoredY) - 320), this.currentLevel.levelHeight - 640);
			this.camera.anchoredY = this.camera.anchoredY + (targetY - this.camera.anchoredY) * 0.08;
		}
	}else if(this.camera.anchoredY != 0){
		this.camera.anchoredY = 0;
	}
};

GameManager.prototype.start = function() {
	if(this.players.length > 0){
		for(var i = 0; i < this.players.length; i++){
			this.players[i].destroy();
		}
	}
	this.players = [];
	this.me = null;
	this.playerMap = {};
	TopUIManager.instance.setRoomNum(this.channel);

	this.generatePlayer(this.myName, this.myUUID, this.myScore, true, this.currentLevel.spawnPointX, this.currentLevel.spawnPointY, this.myTitle, {scored: false, infected: false});
	ScorePanelManager.instance.start(this.myName, this.myUUID, this.myScore);
};

GameManager.prototype.onKeyDown = function(keycode) {
	if(keycode == qc.Keyboard.Q){
		ScorePanelManager.instance.show();
	}else if(keycode == qc.Keyboard.F4){
		SoundManager.instance.mute = !SoundManager.instance.mute;
		if(GameManager.instance.me){
			GameManager.instance.me.showLabel(SoundManager.instance.mute ? "已关闭声音" : "已开启声音");
		}
	}
};

GameManager.prototype.onKeyUp = function(keycode) {
	if(keycode == qc.Keyboard.Q){
		ScorePanelManager.instance.hide();
	}
};

GameManager.prototype.generatePlayer = function(name, uuid, score, isMe, posX, posY, title, data) {
	if((isMe && this.me != null) || this.playerMap["p" + uuid] || uuid <= 0){
		return;
	}

	var player = this.game.add.clone(this.playerPrefab, this.map);
	player.Player.gen(name, uuid, score, isMe, posX, posY, title, data);

	for(var i = 0; i < this.currentLevel.items.length; i++){
		var stuff = this.currentLevel.items[i];
		if(stuff){
			stuff.getScript('qc.arcade.RigidBody').addCollide(player);
		}
		player.getScript('qc.arcade.RigidBody').addCollide(stuff);
	}

	for(var i = 0; i < this.players.length; i++){
		var p = this.players[i];
		if(p){
			p.getScript('qc.arcade.RigidBody').addCollide(player);
		}
	}

	this.players.push(player);
	TopUIManager.instance.setPlayerCount(this.players.length, (this.mode == "py" ? "-" : 16));
};

GameManager.prototype.removePlayer = function(player) {
	for(var i = 0; i < this.currentLevel.items.length; i++){
		var stuff = this.currentLevel.items[i];
		if(stuff){
			stuff.getScript('qc.arcade.RigidBody').removeCollide(player);
		}
	}

	for(var i = 0; i < this.players.length; i++){
		var p = this.players[i];
		if(p){
			p.getScript('qc.arcade.RigidBody').removeCollide(player);
		}
	}

	if(this.players.indexOf(player) >= 0){
		this.players.splice(this.players.indexOf(player), 1);
	}
	player.destroy();
	TopUIManager.instance.setPlayerCount(this.players.length, (this.mode == "py" ? "-" : 16));
};

GameManager.prototype.onNewPlayer = function(data){
	var name = data.name;
	var uuid = data.uuid;
	var score = data.score;
	var title = data.title;
	this.generatePlayer(name, uuid, score, false, this.currentLevel.spawnPointX, this.currentLevel.spawnPointY, title, {scored: false, infected: false});
};

GameManager.prototype.onGetPlayerData = function(data){
	for(var i = 0; i < data.length; i++){
		var d = data[i];
		var name = d.name;
		var uuid = d.uuid;
		var x = d.x;
		var y = d.y;
		var score = d.score;
		var scored = d.scored ? true : false;
		var infected = d.infected;
		var title = d.title;
		this.generatePlayer(name, uuid, score, false, x, y, title, {scored: scored, infected: infected});
	}
};

GameManager.prototype.onGetRoom = function(data){
	this.channel = data.id;
	this.mode = data.mode;
	var l = data.map;
	var t = data.time;
	this.mapData = data.data;
	GameManager.instance.myScore = 0;

	var modeName = (this.mode == "race" ? "竞速模式" : (this.mode == "plague" ? "瘟疫模式" : (this.mode == "py" ? "PY模式" : "未知模式")));
	TopUIManager.instance.setModeName(modeName);
	if(this.mode == "race"){
		if(this.levels[l-1]){
			this.currentLevel = this.levels[l-1].LevelManager;

			for(var i = 0; i < this.levels.length; i++){
				if(l-1 == i){
					this.levels[i].visible = true;
				}else{
					this.levels[i].visible = false;
				}
			}
			for(var i = 0; i < this.pLevels.length; i++){
				this.pLevels[i].visible = false;
			}
			this.pyLevel.visible = false;
		}else{
			alert("找不到地图文件，请刷新后再试！若依旧出现此提示，请尝试清空浏览器缓存！");
			location.reload(true);
			return;
		}
	}else if(this.mode == "plague"){
		if(this.pLevels[l-1]){
			this.currentLevel = this.pLevels[l-1].PlagueLevelManager;
			for(var i = 0; i < this.pLevels.length; i++){
				if(l-1 == i){
					this.pLevels[i].visible = true;
				}else{
					this.pLevels[i].visible = false;
				}
			}
			for(var i = 0; i < this.levels.length; i++){
				this.levels[i].visible = false;
			}
			this.pyLevel.visible = false;
		}else{
			alert("找不到地图文件，请刷新后再试！若依旧出现此提示，请尝试清空浏览器缓存！");
			location.reload(true);
			return;
		}
	}else if(this.mode == "py"){
		if(this.pyLevel){
			this.currentLevel = this.pyLevel.PYLevelManager;
			for(var i = 0; i < this.pLevels.length; i++){
				if(l-1 == i){
					this.pLevels[i].visible = false;
				}else{
					this.pLevels[i].visible = false;
				}
			}
			for(var i = 0; i < this.levels.length; i++){
				this.levels[i].visible = false;
			}
		}else{
			alert("找不到地图文件，请刷新后再试！若依旧出现此提示，请尝试清空浏览器缓存！");
			location.reload(true);
			return;
		}
	}

	this.currentLevel.init();
	TopUIManager.instance.setTime(t);
	if(this.channel != this.lastChannel){
		this.start();
	}
	this.lastChannel = this.channel;
};

GameManager.prototype.onSwitchMap = function(data){
	this.mapData = data.data;
	for(var i = 0; i < this.currentLevel.items.length; i++){
		var item = this.currentLevel.items[i];
		if(item){
			this.resetPhysics(item, false);
		}
	}

	data.id = this.channel;
	data.mode = this.mode;
	this.onGetRoom(data);

	for(var i = 0; i < this.players.length; i++){
		var p = this.players[i];
		if(p){
			this.resetPhysics(p, true);
		}
	}

	for(var i = 0; i < this.currentLevel.items.length; i++){
		var item = this.currentLevel.items[i];
		if(item){
			this.resetPhysics(item, false);
		}
	}

	for(var i = 0; i < this.players.length; i++){
		var p = this.players[i];
		if(p){
			p.Player.init();

			for(var j = 0; j < this.currentLevel.items.length; j++){
				var stuff = this.currentLevel.items[j];
				if(stuff){
					stuff.getScript('qc.arcade.RigidBody').addCollide(p);
				}
				p.getScript('qc.arcade.RigidBody').addCollide(stuff);
			}

			for(var k = 0; k < this.players.length; k++){
				var pp = this.players[k];
				if(pp && p != pp){
					p.getScript('qc.arcade.RigidBody').addCollide(pp);
				}
			}

			p.anchoredX = this.currentLevel.spawnPointX;
			p.anchoredY = this.currentLevel.spawnPointY;
		}
	}
};

GameManager.prototype.resetPhysics = function(stuff, isPlayer){
	stuff.getScript('qc.arcade.RigidBody').collides.length = 0;
	// for(var j = 0; j < this.currentLevel.items.length; j++){
	// 	var item = this.currentLevel.items[j];
	// 	if(stuff != item){
	// 		stuff.getScript('qc.arcade.RigidBody').addCollide(item);
	// 	}
	// }
	//
	// for(var k = 0; k < this.players.length; k++){
	// 	var pp = this.players[k];
	// 	if(stuff != pp){
	// 		stuff.getScript('qc.arcade.RigidBody').addCollide(pp);
	// 	}
	// }
};

GameManager.prototype.getLenth = function(txt) {
    var len = 0;
    for (var i = 0; i < txt.length; i++) {
        var a = txt.charAt(i);
        if (a.match(/[^\x00-\xff]/ig) != null) {
            len += 2;
        }
        else {
            len += 1;
        }
    }
    return len;
};

// define a user behaviour
var HelpPanelManager = qc.defineBehaviour('qc.engine.HelpPanelManager', qc.Behaviour, function() {
    HelpPanelManager.instance = this;
}, {
    dom: qc.Serializer.NODE,
	btnOK: qc.Serializer.NODE
});

HelpPanelManager.prototype.awake = function() {
	this.btnOK.onClick.add(this.onClickOK, this);
	this.gameObject.visible = false;
};


HelpPanelManager.prototype.showHelp = function(message) {
	this.dom.innerHTML = '<textarea style="width:100%; height:100%; background-color:#346; color:#fff; text-align:center; padding:20px;font-size:16px;">' + message + '</textarea>'
	this.gameObject.visible = true;
};

// Called every frame, if the behaviour is enabled.
HelpPanelManager.prototype.onClickOK = function() {
	this.gameObject.visible = false;
};

var InputAreaManager = qc.defineBehaviour('qc.wtf.InputAreaManager', qc.Behaviour, function() {
	InputAreaManager.instance = this;
	this.showing = false;
	this.nextSendTick = 0;
}, {
    inputField: qc.Serializer.NODE,
	sendButton: qc.Serializer.NODE
});

InputAreaManager.prototype.awake = function() {
	this.gameObject.visible = false;
	this.game.input.onKeyDown.add(function(keycode){
		if(keycode == qc.Keyboard.ENTER){
			this.onPressEnter();
		}
	}, this);
	this.sendButton.onClick.add(this.onPressEnter, this);
};

InputAreaManager.prototype.onPressEnter = function() {
	if(this.showing){
		if(this.inputField.text.trim().length > 0){
			this.sendMessage();
		}
		this.gameObject.visible = false;
		this.showing = false;
	}else{
		this.gameObject.visible = true;
		this.showing = true;
		this.inputField.isFocused = true;
	}
};

InputAreaManager.prototype.sendMessage = function() {
	if(GameManager.instance.tick >= this.nextSendTick){
		var msg = this.inputField.text.trim();
		msg = msg.replace(new RegExp(/(")/g),'\\"')
		ServerManager.instance.sendMessage("msg", {"msg": msg});
		this.inputField.text = "";
		this.nextSendTick = GameManager.instance.tick + 300;
	}else{
		GameManager.instance.me.showLabel("发言太快了");
	}
};

// define a user behaviour
var KeyPad = qc.defineBehaviour('qc.engine.KeyPad', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    btnLeft: qc.Serializer.NODE,
	btnRight: qc.Serializer.NODE,
	btnDown: qc.Serializer.NODE,
	btnJump: qc.Serializer.NODE,
	btnAct: qc.Serializer.NODE,
	btnChat: qc.Serializer.NODE,
	btnRank: qc.Serializer.NODE
});

// Called when the script instance is being loaded.
KeyPad.prototype.awake = function() {
	if(!this.game.device.desktop){
		this.gameObject.visible = true;
		this.btnLeft.onDown.add(this.onLeftDown, this);
		this.btnLeft.onUp.add(this.onLeftUp, this);
		this.btnRight.onDown.add(this.onRightDown, this);
		this.btnRight.onUp.add(this.onRightUp, this);
		this.btnDown.onDown.add(this.onDownDown, this);
		this.btnDown.onUp.add(this.onDownUp, this);
		this.btnJump.onDown.add(this.onJumpDown, this);
		this.btnJump.onUp.add(this.onJumpUp, this);
		this.btnAct.onDown.add(this.onActDown, this);
		this.btnAct.onUp.add(this.onActUp, this);
		this.btnChat.onClick.add(this.onChatClick, this);
		this.btnRank.onDown.add(this.onRankDown, this);
		this.btnRank.onUp.add(this.onRankUp, this);
	}else{
		this.gameObject.visible = false;
	}
};

KeyPad.prototype.onLeftDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isLeftDown = true;
	GameManager.instance.me.isLeftJustDown = true;
};

KeyPad.prototype.onLeftUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isLeftDown = false;
	GameManager.instance.me.isLeftJustUp = true;
};

KeyPad.prototype.onRightDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isRightDown = true;
	GameManager.instance.me.isRightJustDown = true;
};

KeyPad.prototype.onRightUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isRightDown = false;
	GameManager.instance.me.isRightJustUp = true;
};

KeyPad.prototype.onDownDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isDownDown = true;
	GameManager.instance.me.isDownJustDown = true;
};

KeyPad.prototype.onDownUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isDownDown = false;
	GameManager.instance.me.isDownJustUp = true;
};

KeyPad.prototype.onJumpDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isUpDown = true;
	GameManager.instance.me.isUpJustDown = true;
};

KeyPad.prototype.onJumpUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isUpDown = false;
	GameManager.instance.me.isUpJustUp = true;
};

KeyPad.prototype.onActDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isSpaceDown = true;
	GameManager.instance.me.isSpaceJustDown = true;
};

KeyPad.prototype.onActUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isSpaceDown = false;
	GameManager.instance.me.isSpaceJustUp = true;
};

KeyPad.prototype.onChatClick = function() {
	InputAreaManager.instance.onPressEnter();
};

KeyPad.prototype.onRankDown = function() {
	ScorePanelManager.instance.show();
};

KeyPad.prototype.onRankUp = function() {
	ScorePanelManager.instance.hide();
};

// define a user behaviour
var LevelManager = qc.defineBehaviour('qc.wtf.LevelManager', qc.Behaviour, function() {
	this.spawnPointX = 0;
	this.spawnPointY = 0;
	this.modeName = "race";

	this.levelName = '默认地图';
	this.levelWidth = 960;
	this.levelHeight = 640;
}, {
    spawnPoint: qc.Serializer.NODE,
	items: qc.Serializer.NODES,
	portals: qc.Serializer.NODES,
	safeZones: qc.Serializer.NODES,
	flag: qc.Serializer.NODE,
	levelName: qc.Serializer.STRING,
	levelWidth: qc.Serializer.NUMBER,
	levelHeight: qc.Serializer.NUMBER
});

LevelManager.prototype.awake = function() {
	this.gameObject.visible = false;
	this.spawnPointX = this.spawnPoint.anchoredX;
	this.spawnPointY = this.spawnPoint.anchoredY;
};

LevelManager.prototype.init = function() {
	this.gameObject.visible = true;
	TopUIManager.instance.setMapName(this.levelName);
	if(this.levelName == "竞速14"){
		var num = GameManager.instance.mapData;
		//console.log("第" + (num+1) + "个传送门好像有点不一样，去看一看！");
		console.log("F12也帮不了你了");
		if(this.portals[num + 1]){
			this.portals[num + 1].Portal.dest = new qc.Point(480, -360);
		}
	}
};

//LevelManager.prototype.update = function() {
//
//};

/**
*
*  Base64 encode / decode
*
*  @author haitao.tu
*  @date   2010-04-26
*  @email  tuhaitao@foxmail.com
*
*/

if(!wh){
	var wh = {};
}

wh.Base64 = {
   	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

   	encode: function (input) {
   		var output = "";
   		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
   		var i = 0;
   		input = wh.Base64._utf8_encode(input);
   		while (i < input.length) {
   			chr1 = input.charCodeAt(i++);
   			chr2 = input.charCodeAt(i++);
   			chr3 = input.charCodeAt(i++);
   			enc1 = chr1 >> 2;
   			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
   			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
   			enc4 = chr3 & 63;
   			if (isNaN(chr2)) {
   				enc3 = enc4 = 64;
   			} else if (isNaN(chr3)) {
   				enc4 = 64;
   			}
   			output = output +
   			wh.Base64._keyStr.charAt(enc1) + wh.Base64._keyStr.charAt(enc2) +
   			wh.Base64._keyStr.charAt(enc3) + wh.Base64._keyStr.charAt(enc4);
   		}
   		return output;
   	},

   	decode: function (input) {
   		var output = "";
   		var chr1, chr2, chr3;
   		var enc1, enc2, enc3, enc4;
   		var i = 0;
   		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
   		while (i < input.length) {
   			enc1 = wh.Base64._keyStr.indexOf(input.charAt(i++));
   			enc2 = wh.Base64._keyStr.indexOf(input.charAt(i++));
   			enc3 = wh.Base64._keyStr.indexOf(input.charAt(i++));
   			enc4 = wh.Base64._keyStr.indexOf(input.charAt(i++));
   			chr1 = (enc1 << 2) | (enc2 >> 4);
   			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
   			chr3 = ((enc3 & 3) << 6) | enc4;
   			output = output + String.fromCharCode(chr1);
   			if (enc3 != 64) {
   				output = output + String.fromCharCode(chr2);
   			}
   			if (enc4 != 64) {
   				output = output + String.fromCharCode(chr3);
   			}
   		}
   		output = wh.Base64._utf8_decode(output);
   		return output;
   	},

   	_utf8_encode: function (string) {
   		string = string.replace(/\r\n/g,"\n");
   		var utftext = "";
   		for (var n = 0; n < string.length; n++) {
   			var c = string.charCodeAt(n);
   			if (c < 128) {
   				utftext += String.fromCharCode(c);
   			} else if((c > 127) && (c < 2048)) {
   				utftext += String.fromCharCode((c >> 6) | 192);
   				utftext += String.fromCharCode((c & 63) | 128);
   			} else {
   				utftext += String.fromCharCode((c >> 12) | 224);
   				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
   				utftext += String.fromCharCode((c & 63) | 128);
   			}

   		}
   		return utftext;
   	},

   	_utf8_decode: function (utftext) {
   		var string = "";
   		var i = 0;
   		var c = c1 = c2 = 0;
   		while ( i < utftext.length ) {
   			c = utftext.charCodeAt(i);
   			if (c < 128) {
   				string += String.fromCharCode(c);
   				i++;
   			} else if((c > 191) && (c < 224)) {
   				c2 = utftext.charCodeAt(i+1);
   				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
   				i += 2;
   			} else {
   				c2 = utftext.charCodeAt(i+1);
   				c3 = utftext.charCodeAt(i+2);
   				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
   				i += 3;
   			}
   		}
   		return string;
   	}
   };

// define a user behaviour
var Broadcast = qc.defineBehaviour('qc.wtf.Broadcast', qc.Behaviour, function() {
	Broadcast.instance = this;
    this.lbl = null;
}, {
    lbl: qc.Serializer.NODE
});

Broadcast.prototype.awake = function() {
	this.lbl.alpha = 0;
	wh.Event.bind('$broad', this.onBroadcast, this);
};

Broadcast.prototype.showBroadcast = function(text) {
	this.lbl.visible = true;
	wh.Tween.remove(this.lbl);
	this.lbl.alpha = 0;
	this.lbl.text = text;
	wh.Tween.get(this.lbl)
		.to({alpha:1}, 200)
		.wait(5000)
		.to({alpha:0}, 1000);
};

Broadcast.prototype.onBroadcast = function(data) {
	this.showBroadcast(data.text);
};

// define a user behaviour
var Button = qc.defineBehaviour('qc.wtf.Button', qc.Behaviour, function() {
    this.isOn = false;
	this.rigidbody = null;
}, {
    machines: qc.Serializer.NODES,
	machineClass: qc.Serializer.STRING
});

Button.prototype.awake = function() {
	this.rigidbody = this.gameObject.getScript('qc.arcade.RigidBody');
};

Button.prototype.isOn = function() {
	return this.isOn;
};

Button.prototype.update = function() {
	if(this.rigidbody.touching.up && !this.isOn){
		this.turnOn();
	}else if(!this.rigidbody.touching.up && this.isOn){
		this.turnOff();
	}
	this.isOn = this.rigidbody.touching.up;
};

Button.prototype.turnOn = function() {
    SoundManager.instance.play('on');
	this.gameObject.frame = 'btn2.png';
	for(var i = 0; i < this.machines.length; i++){
		if(this.machines[i]){
			var sc = this.machines[i].getScript(this.machineClass);
			if(sc){
				sc.turnOn();
			}
		}
	}
};

Button.prototype.turnOff = function() {
    SoundManager.instance.play('off');
	this.gameObject.frame = 'btn1.png';
	for(var i = 0; i < this.machines.length; i++){
		if(this.machines[i]){
			var sc = this.machines[i].getScript(this.machineClass);
			if(sc){
				sc.turnOff();
			}
		}
	}
};

// define a user behaviour
var Bullet = qc.defineBehaviour('qc.wtf.Bullet', qc.Behaviour, function() {
    this.speed = null;
	this.destroyDistance = 100;
	this.startPos = null;
}, {

});

Bullet.prototype.gen = function(position, speed, destroyDistance) {
	this.destroyDistance = destroyDistance;
	this.gameObject.anchoredX = position.x;
	this.gameObject.anchoredY = position.y;
	this.startPos = new qc.Point(position.x, position.y);
	this.speed = speed;
	wh.Event.bindOnce('$newmap', this.onSwitchMap, this);
};

Bullet.prototype.update = function() {
	if(!this.gameObject) return;

	if(this.speed){
		this.gameObject.anchoredX += this.speed.x;
		this.gameObject.anchoredY += this.speed.y;
		var dist = Math.sqrt(Math.pow(this.gameObject.anchoredX - this.startPos.x, 2) + Math.pow(this.gameObject.anchoredY - this.startPos.y, 2));
		if(dist >= this.destroyDistance){
			this.gameObject.destroy();
		}
	}

	if(GameManager.instance.me){
		var dist = Math.sqrt(Math.pow(this.gameObject.anchoredX - GameManager.instance.me.gameObject.anchoredX, 2) + Math.pow(this.gameObject.anchoredY - (GameManager.instance.me.gameObject.anchoredY - 16), 2));
		if(dist < 20){
			GameManager.instance.me.kill();
		}
	}


};

Bullet.prototype.onSwitchMap = function() {
	if(this.gameObject){
		this.gameObject.destroy();
	}
};

// define a user behaviour
var LoginManager = qc.defineBehaviour('qc.wtf.LoginManager', qc.Behaviour, function() {
    LoginManager.instance = this;
    this.username = 'Player';
    this.connected = false;
}, {
    inpUsername: qc.Serializer.NODE,
	btnStart: qc.Serializer.NODE,
	tip: qc.Serializer.NODE,
	dropdown: qc.Serializer.NODE
});

LoginManager.prototype.awake = function() {
	this.gameObject.visible = true;
	this.hideTip();
	this.btnStart.onClick.add(this.onClickStart, this);

    this.showTip('正在连接服务器...');
    wh.Event.bind('ON_OPEN', this.onOpen, this);
    wh.Event.bind('$outdate', this.onOutDate, this);
    wh.Event.bind('$login', this.onLogin, this);
    wh.Event.bind('$full', this.onFull, this);
    wh.Event.bind('$occupy', this.onOccupy, this);
    wh.Event.bind('$shutdown', this.onShutdown, this);
    ServerManager.instance.connect();
    if(this.dropdown.value < 0 || this.dropdown.value > 2){
		this.dropdown.value = 0;
	}
};

LoginManager.prototype.hide = function() {
	this.gameObject.visible = false;
};

LoginManager.prototype.onClickRegister = function() {
    if(!this.connected) return;
    this.gameObject.visible = false;
    RegisterPageManager.instance.start();
};

LoginManager.prototype.onClickStart = function() {
    if(!this.connected) return;

	var username = this.inpUsername.text.trim();
	if(GameManager.instance.getLenth(username.trim()) == 0){
		this.showTip('请输入用户名！');
		return;
	}
    if(GameManager.instance.getLenth(username.trim()) > 20){
		this.showTip('用户名太长！');
		return;
	}
	if(this.dropdown.value < 0 || this.dropdown.value > 2){
		this.dropdown.value = 0;
	}

	this.username = username;

    var pack = {
		name: this.username,
		ver: GameManager.instance.version,
		mode: this.dropdown.value
	};

    this.game.storage.set('username', username);

	ServerManager.instance.sendMessage('login', pack);
};

LoginManager.prototype.onOpen = function() {
    this.connected = true;
    this.showTip('');

    var storedName = this.game.storage.get('username');
    if(storedName != null && storedName != ''){
        this.inpUsername.text = storedName;
        this.inpUsername.placeholder.text = "";
    }
};

LoginManager.prototype.onLogin = function(data) {
	this.hide();
	GameManager.instance.myName = data.name;
	GameManager.instance.myUUID = data.uuid;
	GameManager.instance.myTitle = data.title;
    GameManager.instance.myScore = data.score;
	GameManager.instance.gameObject.visible = true;

    this.game.storage.save();
	var text = "**如游戏出错请清空浏览器缓存**\n\n====== 操作说明 ======\n\n方向键移动，空格键互动，Q键查看得分榜与聊天日志，F4键静音/取消静音。\n\n\n====== 竞速模式 ======\n\n• 玩家的目标是从出生点走到终点旗帜。\n\n• 每隔3-5秒屏幕会闪一次红光，在闪红光之前按方向键下键（趴下）即可存活。\n\n\n====== 瘟疫模式 ======\n\n• 游戏会随机选择一名玩家为感染源。\n\n• 瘟疫玩家投掷健康玩家可以感染玩家，每感染一个玩家获得1分，被感染的玩家需要继续感染健康玩家。\n\n• 非感染源瘟疫玩家将获得减速和投掷CD加长的debuff。\n\n• 存活到最后的玩家将获得大量分数。\n\n\n====== 更新日志 ======\n\nver0.5.0\n\n去除注册用户功能。\n\n\n====== 玩家反馈 ======\n\n如有建议或意见，请加QQ群224883545。";
	HelpPanelManager.instance.showHelp(text);
};

LoginManager.prototype.onOutDate = function(data) {
	alert("您的游戏版本过旧，请刷新后重试！如果还出现此提示请清空浏览器缓存后再试！");
	ServerManager.instance.close();
};

LoginManager.prototype.onOccupy = function(data) {
	alert("已经有相同名字的玩家在线了，换个名字试试！");
	ServerManager.instance.close();
};

LoginManager.prototype.onFull = function(data) {
	alert("服务器已满，请稍候再试！");
	ServerManager.instance.close();
};

LoginManager.prototype.onShutdown = function(data) {
	alert("服务器已关闭！");
	ServerManager.instance.close();
};

LoginManager.prototype.showTip = function(tip) {
	this.tip.visible = true;
	this.tip.text = tip;
};

LoginManager.prototype.hideTip = function() {
	this.tip.visible = false;
};

// define a user behaviour
var PlagueLevelManager = qc.defineBehaviour('qc.wtf.PlagueLevelManager', qc.Behaviour, function() {
	this.spawnPointX = 0;
	this.spawnPointY = 0;
	this.modeName = "plague";

	this.levelName = '默认地图';
	this.levelWidth = 960;
	this.levelHeight = 640;
}, {
    spawnPoint: qc.Serializer.NODE,
	zombieSpawnPoint: qc.Serializer.NODE,
	items: qc.Serializer.NODES,
	portals: qc.Serializer.NODES,
	levelName: qc.Serializer.STRING,
	levelWidth: qc.Serializer.NUMBER,
	levelHeight: qc.Serializer.NUMBER
});

PlagueLevelManager.prototype.awake = function() {
	this.gameObject.visible = false;
	this.spawnPointX = this.spawnPoint.anchoredX;
	this.spawnPointY = this.spawnPoint.anchoredY;
};

PlagueLevelManager.prototype.init = function() {
	this.gameObject.visible = true;
	TopUIManager.instance.setMapName(this.levelName);
};

var Player = qc.defineBehaviour('qc.wtf.Player', qc.Behaviour, function() {
    this.isMe = true;
	this.controlable = true;
	this.jumping = false;
	this.moveSpeed = 200;
	this.jumpSpeed = 500;
	this.throwHeight = 360;
	this.throwSpeed = 240;
	this.playerName = 'Player';
	this.friction = 100;
	this.uuid = -1;
	this.isFacingLeft = true;
	this.touchedFlag = false;
	this.score = 0;

	this.tick = 0;


	this.state = 0;
	this.initPickTimer = 10;
	this.initThrowTimer = 180;

	this.pickCoolDown = 30;

	this.pickTimer = 0;
	this.nextPickTime = 0;

	this.throwTimer = 0;
	this.speedMagnifer = 1;

	this.curAnimation = '';
	this.rigidbody = null;
	this.lastTouchGround = false;
	this.targetSpeedX = 0;
	this.targetSpeedY = 0;
	this.isLeftDown = false;
	this.isLeftJustDown = false;
	this.isLeftJustUp = false;
	this.isRightDown = false;
	this.isRightJustDown = false;
	this.isRightJustUp = false;
	this.isUpDown = false;
	this.isUpJustDown = false;
	this.isUpJustUp = false;
	this.isDownDown = false;
	this.isDownJustDown = false;
	this.isDownJustUp = false;
	this.isSpaceJustDown = false;
	this.isSpaceDown = false;
	this.isSpaceJustUp = false;
	this.isControlJustBack = false;
}, {
	isMe: qc.Serializer.BOOLEAN,
	moveSpeed: qc.Serializer.NUMBER,
	jumpSpeed: qc.Serializer.NUMBER,
	friction: qc.Serializer.NUMBER,
	playerName: qc.Serializer.STRING,

	playerImage: qc.Serializer.NODE,
	nameTag: qc.Serializer.NODE,
	bubble: qc.Serializer.NODE,
	title: qc.Serializer.NODE,
	scoreLabel: qc.Serializer.PREFAB
});

Player.prototype.preUpdate = function() {
	this.isLeftJustDown = false;
	this.isLeftJustUp = false;
	this.isRightJustDown = false;
	this.isRightJustUp = false;
	this.isUpJustDown = false;
	this.isUpJustUp = false;
	this.isDownJustDown = false;
	this.isDownJustUp = false;
	this.isSpaceJustDown = false;
	this.isSpaceJustUp = false;
	this.isControlJustBack = false;
};

Player.prototype.awake = function() {
	this.rigidbody = this.gameObject.getScript('qc.arcade.RigidBody');
};

Player.prototype.onClick = function() {
	PlayerContextMenu.instance.show(this.uuid, this.gameObject.anchoredX + GameManager.instance.camera.anchoredX, this.gameObject.anchoredY + GameManager.instance.camera.anchoredY);
};

Player.prototype.init = function() {
	this.touchedFlag = false;
	this.gameObject.phaser.body.enable = true;
	this.playerImage.visible = true;
	this.nameTag.visible = true;
	this.title.visible = true;
	this.playerImage.colorTint = new qc.Color("#FFFFFF");
	this.speedMagnifer = 1;
	this.pickCoolDown = 30;
	//this.gameObject.alpha = 1;
};

Player.prototype.setTitle = function(title) {
	if(title == "管理员"){
		this.title.text = "<管理员>";
		this.title.color = new qc.Color('#B300FF');
		this.title.visible = true;
	}else if(title == "作者"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#10C200');
		this.title.visible = true;
	}else if(title == "赞助者"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#00C2B5');
		this.title.visible = true;
	}else if(title == "元老"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#1947FF');
		this.title.visible = true;
	}else if(title == "咸鱼王"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#9619FF');
		this.title.visible = true;
	}else if(title == "传说"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#FF1919');
		this.title.visible = true;
	}else if(title != null && title != "null" && title != "" && title != " "){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color("#FFB663");
		this.title.visible = true;
	}else{
		this.title.text = "";
	}
};

Player.prototype.gen = function(name, uuid, score, isMe, posX, posY, title, datas) {

	GameManager.instance.playerMap["p" + uuid] = this.gameObject;

	if(isMe){
		GameManager.instance.me = this;
		this.nameTag.color = new qc.Color('#FFDC00');
		Player.me = this;
		if(title == "管理员"){
			GameManager.instance.isAdmin = true;
			GameManager.instance.me.showLabel("已获取管理员权限");
		}
	}
	this.setTitle(title);

	this.nameTag.text = name;
	this.gameObject.name = name;
	this.uuid = uuid;
	this.isMe = isMe;
	this.score = score;
	this.playerName = name;
	this.gameObject.anchoredX = posX;
	this.gameObject.anchoredY = posY;

	this.init();

	if(this.isMe){
		this.game.input.onKeyDown.add(this.onKeyDown, this);
		this.game.input.onKeyUp.add(this.onKeyUp, this);
	}

	if(GameManager.instance.mode == "race"){
		if(datas.scored){
			this.touchedFlag = true;
			this.onConfirmTouchFlag();
		}
	}else if(GameManager.instance.mode == "plague"){
		if(datas.infected == 1){
			this.infect(false, false);
		}else if(datas.infected == 2){
			this.infect(true, false);
		}
	}
};

Player.prototype.onKeyDown = function(keycode) {
	switch(keycode){
		case qc.Keyboard.LEFT:
			this.isLeftDown = true;
			this.isLeftJustDown = true;
			break;
		case qc.Keyboard.RIGHT:
			this.isRightDown = true;
			this.isRightJustDown = true;
			break;
		case qc.Keyboard.UP:
			this.isUpDown = true;
			this.isUpJustDown = true;
			break;
		case qc.Keyboard.DOWN:
			this.isDownDown = true;
			this.isDownJustDown = true;
			break;
		case qc.Keyboard.SPACEBAR:
			this.isSpaceDown = true;
			this.isSpaceJustDown = true;
            break;
	}
};

Player.prototype.onKeyUp = function(keycode) {
	switch(keycode){
		case qc.Keyboard.LEFT:
			this.isLeftDown = false;
			this.isLeftJustUp = true;
			break;
		case qc.Keyboard.RIGHT:
			this.isRightDown = false;
			this.isRightJustUp = true;
			break;
		case qc.Keyboard.UP:
			this.isUpDown = false;
			this.isUpJustUp = true;
			break;
		case qc.Keyboard.DOWN:
			this.isDownDown = false;
			this.isDownJustUp = true;
			break;
		case qc.Keyboard.SPACEBAR:
			this.isSpaceDown = false;
			this.isSpaceJustUp = true;
			break;
	}
};

Player.prototype.update = function(isLeft) {
	this.tick++;

	if(!this.lastTouchGround && this.rigidbody.touching.down){
		this.onTouchGround();
	}

	if(this.isMe && this.controlable && !this.touchedFlag){
		this.checkMove();
	}

	if(this.rigidbody && this.state != 0 && this.state != 2 && this.controlable){
		this.rigidbody.velocity.x = this.targetSpeedX * this.speedMagnifer;
	}

	if(this.rigidbody && this.rigidbody.touching.down){
		this.rigidbody.drag.x = this.friction;
	}else{
		this.rigidbody.drag.x = 0;
	}

	this.pickTimer--;
	this.throwTimer--;
	this.calcAnim();
	if(this.isMe){
		if(GameManager.instance.mode == "race"){
			this.checkFlag();
			this.checkFlash();
		}

		this.checkPortal();
		this.checkFall();
	}
	this.lastTouchGround = this.rigidbody.touching.down;
};

Player.prototype.infect = function(isSource, teleport){
    SoundManager.instance.play('transform');
	if(isSource){
		var text = this.isMe ? "您是感染源，快去感染其他玩家！" : this.playerName + " 是感染源，远离他！";
		Broadcast.instance.showBroadcast(text);
		if(teleport){
			this.rigidbody.velocity.x = 0;
			this.rigidbody.velocity.y = 0;
			this.gameObject.anchoredX = GameManager.instance.currentLevel.zombieSpawnPoint.anchoredX;
			this.gameObject.anchoredY = GameManager.instance.currentLevel.zombieSpawnPoint.anchoredY;
		}
		this.playerImage.colorTint = new qc.Color("#00732E");
	}else{
		this.speedMagnifer = 0.75;
		this.pickCoolDown = 60;
		this.playerImage.colorTint = new qc.Color("#00FF91");
	}

};

Player.prototype.infectOther = function(){
	this.showLabel("+1");
};

Player.prototype.checkFall = function(){
	if(this.touchedFlag) return;
	if(this.gameObject.anchoredY > 100){
		this.flashed();
	}
};

Player.prototype.checkFlag = function(){
	if(this.touchedFlag) return;
	if(this.gameObject &&
		this.gameObject.anchoredX <= GameManager.instance.currentLevel.flag.anchoredX + 16 &&
		this.gameObject.anchoredX >= GameManager.instance.currentLevel.flag.anchoredX - 16 &&
		this.gameObject.anchoredY <= GameManager.instance.currentLevel.flag.anchoredY + 32 &&
		this.gameObject.anchoredY >= GameManager.instance.currentLevel.flag.anchoredY - 72
	){
		this.touchFlag();
	}
};

Player.prototype.checkPortal = function(){
	if(GameManager.instance.currentLevel.portals){
		if(GameManager.instance.currentLevel.portals.length > 0){
			for(var i = 0; i < GameManager.instance.currentLevel.portals.length; i++){
				if(this.gameObject &&
					this.gameObject.anchoredX <= GameManager.instance.currentLevel.portals[i].anchoredX + 16 &&
					this.gameObject.anchoredX >= GameManager.instance.currentLevel.portals[i].anchoredX - 16 &&
					this.gameObject.anchoredY <= GameManager.instance.currentLevel.portals[i].anchoredY + 32 &&
					this.gameObject.anchoredY >= GameManager.instance.currentLevel.portals[i].anchoredY - 32
				){
					this.touchPortal(GameManager.instance.currentLevel.portals[i]);
					break;
				}
			}
		}
	}
};

Player.prototype.checkMove = function(){
	if(this.isControlJustBack){
		if(this.isLeftDown){
			this.move(true);
		}else if(this.isRightDown){
			this.move(false);
		}else if(this.isDownDown){
			this.dock();
		}
	}

	if(this.isDownJustUp){
		if(this.isLeftDown){
			this.move(true);
		}else if(this.isRightDown){
			this.move(false);
		}else{
			this.stop();
		}
	}

	if(this.isSpaceJustDown && this.state != 2 && this.nextPickTime <= this.tick){
		this.pick();
	}

	if(this.isLeftJustDown){
		if(!this.isDownDown && !this.isRightDown){
			this.move(true);
			return;
		}
	}

	if(this.isRightJustDown){
		if(!this.isDownDown && !this.isLeftDown){
			this.move(false);
			return;
		}
	}

	if(this.isLeftJustUp){
		if(this.isRightDown){
			this.move(false);
		}else if(!this.isDownDown){
			this.stop();
		}
		return;
	}

	if(this.isRightJustUp){
		if(this.isLeftDown){
			this.move(true);
		}else if(!this.isDownDown){
			this.stop();
		}
		return;
	}

	if(this.isDownJustDown){
		if(this.rigidbody.touching.down){
			this.dock();
		}
		return;
	}

	if(this.isUpDown && !this.isDownDown){
		if(this.rigidbody.touching.down){
			this.jump();
			return;
		}
	}

	if(this.isDownDown){
		if(this.rigidbody.touching.down && this.state != 2){
			this.dock();
			return;
		}
	}
};


Player.prototype.calcAnim = function(){
	if(this.throwTimer > 160){
		if(this.curAnimation != 'LIFT'){
			this.playerImage.playAnimation('lift');
			this.curAnimation = 'LIFT';
		}
	}else if(this.pickTimer > 0){
		if(this.curAnimation != 'PICK'){
			this.playerImage.playAnimation('pick');
			this.curAnimation = 'PICK';
		}
	}else{
		if(this.rigidbody && this.rigidbody.touching.down){
			if(this.state == 0 && this.curAnimation != 'STAND'){
				this.playerImage.playAnimation('stand');
				this.curAnimation = 'STAND';
			}else if(this.state == 1 && this.curAnimation != 'WALK'){
				this.playerImage.playAnimation('walk');
				this.curAnimation = 'WALK';
			}else if(this.state == 2 && this.curAnimation != 'DOCK'){
				this.playerImage.playAnimation('dock');
				this.curAnimation = 'DOCK';
			}
		}else if(this.curAnimation != 'SPIN'){
			this.playerImage.playAnimation('spin');
			this.curAnimation = 'SPIN';
		}
	}
};

Player.prototype.move = function(isLeft) {
	this.targetSpeedX = (isLeft ? -this.moveSpeed : this.moveSpeed);
	this.isFacingLeft = isLeft;
	this.playerImage.scaleX = (isLeft ? 1 : -1);
	this.state = 1;
	this.game.phaser.add.tween(this.gameObject.phaser.body).to({height:36}, 100, Phaser.Easing.Linear.None, true);
	if(this.isMe){
		this.sendMovePack(isLeft ? 'moveLeft' : 'moveRight');
	}
};

Player.prototype.stop = function() {
	this.targetSpeedX = 0;
	this.state = 0;
	this.game.phaser.add.tween(this.gameObject.phaser.body).to({height:36}, 100, Phaser.Easing.Linear.None, true);

	if(this.rigidbody)
		this.rigidbody.velocity.x = this.targetSpeedX;
	if(this.isMe){
		this.sendMovePack('stop');
	}
};

Player.prototype.dock = function() {
	this.targetSpeedX = 0;
	this.state = 2;
	this.game.phaser.add.tween(this.gameObject.phaser.body).to({height:20}, 100, Phaser.Easing.Linear.None, true);
	if(this.isMe){
		this.sendMovePack('dock');
	}
};

Player.prototype.kill = function() {
	this.gameObject.anchoredX = GameManager.instance.currentLevel.spawnPoint.anchoredX;
	this.gameObject.anchoredY = GameManager.instance.currentLevel.spawnPoint.anchoredY;
	if(this.isMe){
		this.sendMovePack('kill');
        SoundManager.instance.play('die');
	}
};

Player.prototype.jump = function() {
	if(this.rigidbody)
		this.rigidbody.velocity.y = -this.jumpSpeed;
	if(this.isMe){
		this.sendMovePack('jump');
        SoundManager.instance.play('jump');
	}
};

Player.prototype.pick = function() {
	this.pickTimer = this.initPickTimer;
	if(this.isMe){
		this.nextPickTime = this.tick + this.pickCoolDown;

		var hasTarget = false;

		for(var i = 0; i < GameManager.instance.players.length; i++){
			var p = GameManager.instance.players[i];
			if(p){
				if(p == this.gameObject){
					continue;
				}

				if(this.isFacingLeft){
					if(p.anchoredX >= this.gameObject.anchoredX - 60 &&
						p.anchoredX < this.gameObject.anchoredX &&
						p.anchoredY <= this.gameObject.anchoredY + 30 &&
						p.anchoredY >= this.gameObject.anchoredY - 10
					){
						hasTarget = true;
						this.throw(p);
					}
				}else{
					if(p.anchoredX <= this.gameObject.anchoredX + 60 &&
						p.anchoredX > this.gameObject.anchoredX &&
						p.anchoredY <= this.gameObject.anchoredY + 30 &&
						p.anchoredY >= this.gameObject.anchoredY - 10
					){
						hasTarget = true;
						this.throw(p);
					}
				}
			}
		}

		if(!hasTarget){
			this.sendMovePack('pick');
		}
	}
};

Player.prototype.throw = function(p){
	this.throwTimer = this.initThrowTimer;
	if(this.isMe){
		this.sendThrowPack(p);
        SoundManager.instance.play('throw');
	}
};

Player.prototype.flashed = function() {
	if(this.gameObject){
		this.gameObject.anchoredX = GameManager.instance.currentLevel.spawnPoint.anchoredX;
		this.gameObject.anchoredY = GameManager.instance.currentLevel.spawnPoint.anchoredY;
		this.rigidbody.velocity.x = 0;
		this.rigidbody.velocity.y = 0;
	}
	if(this.isMe){
		this.sendMovePack('flashed');
        SoundManager.instance.play('die');
	}
};

Player.prototype.onWarp = function() {
	if(this.gameObject){
		this.rigidbody.velocity.x = 0;
		this.rigidbody.velocity.y = 0;
	}
};

Player.prototype.touchFlag = function(){
	this.touchedFlag = true;
	if(this.isMe){
		this.sendMovePack('flag');

	}
};

Player.prototype.touchPortal = function(portal){
	if(this.isMe){
		var dest = portal.Portal.dest;
		this.gameObject.anchoredX = dest.x;
		this.gameObject.anchoredY = dest.y;
        ServerManager.instance.sendMessage("move", {t: "pos", uuid: this.uuid, x: dest.x, y: dest.y});
        SoundManager.instance.play('portal');
	}
};

Player.prototype.onConfirmTouchFlag = function(){
	if(this.gameObject){
		this.stop();
		this.gameObject.phaser.body.enable = false;
		this.playerImage.visible = false;
		this.nameTag.visible = false;
		this.title.visible = false;
		//this.gameObject.alpha = 0;
        if(this.isMe){
            SoundManager.instance.play('win');
        }
	}
};

Player.prototype.onTouchGround = function() {
	if(!this.controlable){
		this.isControlJustBack = true;
	}
	this.controlable = true;

	if(this.isMe){
		this.sendMovePack('pos');
	}
};

Player.prototype.sendMovePack = function(action) {
	var posX = Math.round(this.gameObject.anchoredX);
	var posY = Math.round(this.gameObject.anchoredY);
	ServerManager.instance.sendMessage("move", {t:action, uuid: this.uuid, x: posX, y: posY});
};

Player.prototype.sendThrowPack = function(p) {
	var ps = p.Player;
	var posX = Math.round(this.gameObject.anchoredX);
	var posY = Math.round(this.gameObject.anchoredY);
	ServerManager.instance.sendMessage("move", {t:"throw", uuid: this.uuid, dir: (this.isFacingLeft ? 0 : 1), target: ps.uuid, x: posX, y: posY});
	//ServerManager.instance.send('{"k":"move", "v": {"t":"thrower", "uuid": ' + this.uuid + ', "x":' + posX + ', "y":' + posY + '}}');
	//ServerManager.instance.send('{"k":"move", "v": {"t":"throw", "uuid": ' + ps.uuid + ', "x":' + posX + ', "y":' + posY + ', "dir":"' + (this.isFacingLeft ? 0 : 1) + '"}}');
};

Player.prototype.onThrowed = function(dir) {
	var digDir = parseInt(dir);
	this.rigidbody.velocity.y = -this.throwHeight;
	this.rigidbody.velocity.x = (dir == 0 ? -this.throwSpeed : this.throwSpeed);
	this.controlable = false;
};

Player.prototype.onScore = function(data){
	if(data.uuid != this.uuid) return;
	this.score += data.score;
	this.nameTag.text = this.playerName;
	this.showLabel("+" + data.score);
    if(this.isMe){
        GameManager.instance.myScore = this.score;
    }
};

Player.prototype.showLabel = function(text){
	var lbl = this.game.add.clone(this.scoreLabel, this.gameObject.parent);
	lbl.anchoredX = this.gameObject.anchoredX;
	lbl.anchoredY = this.gameObject.anchoredY;
	lbl.ScoreLabel.init(text);
};

Player.prototype.onReceiveMove = function(data) {
	if(data.uuid != this.uuid) return;
	if(this.isMe && !(data.t == 'flag' || data.t == 'throw')) return;

	this.gameObject.anchoredX = parseInt(data.x);
	this.gameObject.anchoredY = parseInt(data.y);
	switch(data.t){
		case 'moveLeft':
			this.move(true);
			break;
		case 'moveRight':
			this.move(false);
			break;
		case 'stop':
			this.stop();
			break;
		case 'dock':
			this.dock();
			break;
		case 'jump':
			this.jump();
			break;
		case 'pick':
			this.pick();
			break;
		case 'throw':
			if(!this.isMe){
				this.throw();
			}
			var target = data.target;
			var p = GameManager.instance.playerMap["p" + target];
			if(p && p.Player){
				p.Player.onThrowed(data.dir);
			}
			break;
		// case 'throw':
		// 	break;
		case 'flag':
			this.onConfirmTouchFlag();
			break;
		case 'kill':
			this.kill();
			break;
		case 'flashed':
			this.flashed();
			break;
		case 'warp':
			this.onWarp();
			break;
	}
};

Player.prototype.isInSaveZone = function() {
	var insafe = false;
	for(var i = 0; i < GameManager.instance.currentLevel.safeZones.length; i++){
		var zone = GameManager.instance.currentLevel.safeZones[i];
		if(this.gameObject.anchoredX <= zone.anchoredX + zone.width / 2 &&
			this.gameObject.anchoredX >= zone.anchoredX - zone.width / 2 &&
			this.gameObject.anchoredY <= zone.anchoredY + 5 &&
			this.gameObject.anchoredY >= zone.anchoredY - zone.height){
				insafe = true;
				break;
			}
	}

	return insafe;
};

Player.prototype.say = function(speech) {
	this.bubble.getScript('qc.wtf.DialogBubble').show(speech, this.uuid);
};

Player.prototype.onLeave = function(data) {
	if(data.uuid != this.uuid) return;
	GameManager.instance.playerMap["p" + data.uuid] = null;
	// wh.Event.unbind('$move', this.onReceiveMove);
	// wh.Event.unbind('$leave', this.onLeave);
	// wh.Event.unbind('$score', this.onScore);
	// wh.Event.unbind('$msg', this.onMsg);
	//
	// if(this.isMe){
	// 	wh.Event.unbind('$flash', this.onFlash);
	// }
	GameManager.instance.removePlayer(this.gameObject);
};

Player.prototype.checkFlash = function() {
	if(GameManager.instance.god){
		return;
	}

	if(GameManager.instance.tick <= GameManager.instance.flashTick + 6){
		this.onFlash();
	}
};

Player.prototype.onFlash = function() {
	if(this.touchedFlag || this.isInSaveZone() || (this.rigidbody.touching.down && this.state == 2)){

	}else{
		this.flashed();
	}
};

Player.prototype.onMsg = function(data) {
	if(data.uuid != this.uuid) return;
	this.say(data.msg);
};

// define a user behaviour
var PlayerContextMenu = qc.defineBehaviour('qc.engine.PlayerContextMenu', qc.Behaviour, function() {
	PlayerContextMenu.instance = this;
    this.uuid = 0;
	this.playerName = "Unknown";
}, {
    lblName: qc.Serializer.NODE,
	btnMute: qc.Serializer.NODE,
	btnFriend: qc.Serializer.NODE,
	btnKick: qc.Serializer.NODE,
	btnBan: qc.Serializer.NODE,
	btnTitle: qc.Serializer.NODE,
	btnClose: qc.Serializer.NODE
});

PlayerContextMenu.prototype.awake = function() {
	this.btnMute.onClick.add(this.onClickMute, this);
	this.btnFriend.onClick.add(this.onClickFriend, this);
	this.btnKick.onClick.add(this.onClickKick, this);
	this.btnBan.onClick.add(this.onClickBan, this);
	this.btnTitle.onClick.add(this.onClickTitle, this);
	this.btnClose.onClick.add(this.onClickClose, this);
	this.gameObject.visible = false;
};

PlayerContextMenu.prototype.onClickMute = function() {
	if(GameManager.instance.myUUID == this.uuid){
		GameManager.instance.me.showLabel("不能屏蔽自己");
		this.hide();
		return;
	}

	if(GameManager.instance.ignoreList.indexOf(this.uuid) >= 0){
		GameManager.instance.ignoreList.splice(GameManager.instance.ignoreList.indexOf(this.uuid), 1);
		GameManager.instance.me.showLabel("解除屏蔽了 " + this.playerName);
	}else{
		GameManager.instance.ignoreList.push(this.uuid);
		GameManager.instance.me.showLabel("屏蔽了 " + this.playerName);
	}
	this.hide();
};

PlayerContextMenu.prototype.onClickFriend = function() {
	GameManager.instance.me.showLabel("功能尚未开放");
	this.hide();
};

PlayerContextMenu.prototype.onClickKick = function() {
	if(!GameManager.instance.isAdmin){
		GameManager.instance.me.showLabel("权限不足");
	}else{
		if(confirm("是否踢出 " + this.playerName + " ？")){
			ServerManager.instance.sendMessage("kick", {"uuid": this.uuid});
		}
	}
	this.hide();
};

PlayerContextMenu.prototype.onClickBan = function() {
	if(!GameManager.instance.isAdmin){
		GameManager.instance.me.showLabel("权限不足");
	}else{
		if(confirm("是否封禁 " + this.playerName + " ？")){
			ServerManager.instance.sendMessage("ban", {"uuid": this.uuid});
		}
	}
	this.hide();
};

PlayerContextMenu.prototype.onClickTitle = function() {
	if(!GameManager.instance.isAdmin){
		GameManager.instance.me.showLabel("权限不足");
	}else{
		var title = prompt("输入称号");
		if(title){
			ServerManager.instance.sendMessage("title", {"uuid": this.uuid, "title": title});
		}
	}
	this.hide();
};

PlayerContextMenu.prototype.onClickClose = function() {
	this.hide();
};

PlayerContextMenu.prototype.show = function(uuid, posX, posY) {
	this.gameObject.visible = true;
	this.uuid = uuid;
	var name = "Unknown";
	var p = GameManager.instance.playerMap["p" + uuid];
	if(p && p.Player){
		name = p.Player.playerName;
		this.lblName.text = name;
		this.playerName = name;
	}
	this.gameObject.anchoredX = posX;
	this.gameObject.anchoredY = posY;

	if(GameManager.instance.isAdmin){
		this.btnKick.colorTint = new qc.Color("#FFFFFF");
		this.btnBan.colorTint = new qc.Color("#FFFFFF");
		this.btnTitle.colorTint = new qc.Color("#FFFFFF");
		this.btnFriend.colorTint = new qc.Color("#AAAAAA");
	}else{
		this.btnKick.colorTint = new qc.Color("#AAAAAA");
		this.btnBan.colorTint = new qc.Color("#AAAAAA");
		this.btnTitle.colorTint = new qc.Color("#AAAAAA");
		this.btnFriend.colorTint = new qc.Color("#AAAAAA");
	}

	if(GameManager.instance.myUUID == uuid){
		this.btnMute.colorTint = new qc.Color("#AAAAAA");
	}else{
		this.btnMute.colorTint = new qc.Color("#FFFFFF");
	}
};

PlayerContextMenu.prototype.hide = function() {
	this.uuid = -1;
	this.gameObject.visible = false;
};

// define a user behaviour
var PlayerTag = qc.defineBehaviour('qc.engine.PlayerTag', qc.Behaviour, function() {
	this.playerName = "";
	this.score = 0;
	this.complete = false;
	this.uuid = -1;
	this.rank = 0;
}, {
	bg: qc.Serializer.NODE,
	nameTag: qc.Serializer.NODE,
    scoreTag: qc.Serializer.NODE
});

PlayerTag.prototype.awake = function() {
	this.bg.alpha = 0.3;
};

PlayerTag.prototype.setComplete = function(isComplete) {
	this.complete = isComplete;
	this.bg.alpha = isComplete ? 0.6 : 0.3;
};

PlayerTag.prototype.setName = function(name) {
	this.playerName = name;
	this.nameTag.text = name + "";
};

PlayerTag.prototype.setScore = function(score) {
	this.score = score;
	this.scoreTag.text = score + "";
};

// define a user behaviour
var Portal = qc.defineBehaviour('qc.engine.Portal', qc.Behaviour, function() {
    this.frame = 0;
	this.tick = 0;
}, {
	image: qc.Serializer.NODE,
    dest: qc.Serializer.POINT
});

Portal.prototype.update = function() {
	this.tick++;
	if(this.tick % 6 == 0){
		this.frame = (this.frame + 1) % 4;
		this.image.frame = "portal" + (this.frame + 1) + ".png";
	}
};

// define a user behaviour
var PYLevelManager = qc.defineBehaviour('qc.engine.PYLevelManager', qc.Behaviour, function() {
	this.spawnPointX = 0;
	this.spawnPointY = 0;
	this.modeName = "py";

	this.levelName = 'PY交易';
	this.levelWidth = 960;
	this.levelHeight = 640;
}, {
    spawnPoint: qc.Serializer.NODE,
	items: qc.Serializer.NODES,
	portals: qc.Serializer.NODES,
	levelName: qc.Serializer.STRING,
	levelWidth: qc.Serializer.NUMBER,
	levelHeight: qc.Serializer.NUMBER
});

PYLevelManager.prototype.awake = function() {
	this.gameObject.visible = false;
	this.spawnPointX = this.spawnPoint.anchoredX;
	this.spawnPointY = this.spawnPoint.anchoredY;
};

PYLevelManager.prototype.init = function() {
	this.gameObject.visible = true;
	TopUIManager.instance.setMapName(this.levelName);
};

// define a user behaviour
var RegisterPageManager = qc.defineBehaviour('qc.engine.RegisterPageManager', qc.Behaviour, function() {
    RegisterPageManager.instance = this;
}, {
    inpUsername: qc.Serializer.NODE,
    inpPassword: qc.Serializer.NODE,
    inpConfirmPassword: qc.Serializer.NODE,
    inpEmial: qc.Serializer.NODE,
    inpInv: qc.Serializer.NODE,
    btnBack: qc.Serializer.NODE,
    btnRegister: qc.Serializer.NODE
});

RegisterPageManager.prototype.awake = function() {
    this.gameObject.visible = false;
};

RegisterPageManager.prototype.bindEvents = function() {
    this.btnBack.onClick.add(this.onClickBack, this);
    this.btnRegister.onClick.add(this.onClickRegister, this);
    wh.Event.bind("$outdate", this.onOutDate, this);
    wh.Event.bind("$nametaken", this.onNameTaken, this);
    wh.Event.bind("$emailtaken", this.onEmailTaken, this);
    wh.Event.bind("$inhibit", this.onInhibit, this);
    wh.Event.bind("$fail", this.onFail, this);
    wh.Event.bind("$success", this.onSuccess, this);
    wh.Event.bind("$wronginv", this.onWrongInv, this);
};

RegisterPageManager.prototype.unbindEvents = function() {
    this.btnBack.onClick.remove(this.onClickBack, this);
    this.btnRegister.onClick.remove(this.onClickRegister, this);
    wh.Event.unbind("$outdate", this.onOutDate);
    wh.Event.unbind("$nametaken", this.onNameTaken);
    wh.Event.unbind("$emailtaken", this.onEmailTaken);
    wh.Event.unbind("$inhibit", this.onInhibit);
    wh.Event.unbind("$fail", this.onFail);
    wh.Event.unbind("$success", this.onSuccess);
    wh.Event.unbind("$wronginv", this.onWrongInv);
};

RegisterPageManager.prototype.onClickRegister = function() {
    var username = this.inpUsername.text.trim();
    var password1 = this.inpPassword.text;
    var password2 = this.inpConfirmPassword.text;
    var email = this.inpEmial.text.trim();
    var invCode = this.inpInv.text.trim();

    if(this.getLenth(username) <= 0){
        alert("用户名不能为空！");
        return;
    }

    if(this.getLenth(username) > 20){
        alert("用户名太长(最长20字符，汉字占2字符)！");
        return;
    }

    if(email.length == 0){
        alert("邮箱不能为空！");
        return;
    }

    var szReg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
    var bChk = szReg.test(email);
    if(!bChk){
        alert("邮箱格式错误！");
        return;
    }

    if(password1.length == 0){
        alert("密码不能为空！");
        return;
    }

    if(password1 != password2){
        alert("两次密码输入不一致！");
        return;
    }

    ServerManager.instance.sendMessage("register", {
        username: username,
        password: password1,
        email: email,
        invCode: (invCode ? invCode : ""),
        version: GameManager.instance.version
    });
};

RegisterPageManager.prototype.onWrongInv = function() {
    alert("授权码有误，请重试！");
};

RegisterPageManager.prototype.onNameTaken = function() {
    alert("用户名已被占用！");
};

RegisterPageManager.prototype.onOutDate = function() {
    alert("您的游戏版本过旧，请刷新后重试！如果还出现此提示请清空浏览器缓存后再试！");
	ServerManager.instance.close();
};

RegisterPageManager.prototype.onEmailTaken = function() {
    alert("邮箱已被占用！");
};

RegisterPageManager.prototype.onInhibit = function() {
    alert("目前无法注册新账号，很抱歉！");
};

RegisterPageManager.prototype.onFail = function() {
    alert("注册失败！");
};

RegisterPageManager.prototype.onSuccess = function() {
    alert("注册成功！");
    this.close();
    LoginManager.instance.gameObject.visible = true;
};

RegisterPageManager.prototype.onClickBack = function() {
    this.close();
    LoginManager.instance.gameObject.visible = true;
};

RegisterPageManager.prototype.start = function() {
    this.gameObject.visible = true;
    this.bindEvents();
};

RegisterPageManager.prototype.close = function() {
    this.inpUsername.txt = "";
    this.inpPassword.txt = "";
    this.inpConfirmPassword.txt = "";
    this.inpEmial.txt = "";
    this.inpInv.txt = "";
    this.gameObject.visible = false;
    this.unbindEvents();
};

RegisterPageManager.prototype.getLenth = function(txt) {
    var len = 0;
    for (var i = 0; i < txt.length; i++) {
        var a = txt.charAt(i);
        if (a.match(/[^\x00-\xff]/ig) != null) {
            len += 2;
        }
        else {
            len += 1;
        }
    }
    return len;
};

// define a user behaviour
var Runner = qc.defineBehaviour('qc.engine.Runner', qc.Behaviour, function() {
    this.startX = 0;
	this.startY = 0;
}, {
    startX: qc.Serializer.INT,
	startY: qc.Serializer.INT
});

// Called when the script instance is being loaded.
Runner.prototype.update = function() {
	this.gameObject.anchoredX = this.startX;
	this.gameObject.anchoredY = this.startY;
	// if(this.startX > this.endX){
	// 	if(this.gameObject.anchoredX <= this.endX){
	// 		this.gameObject.anchoredX = this.startX;
	// 	}
	// }else if(this.startX < this.endX){
	// 	if(this.gameObject.anchoredX >= this.endX){
	// 		this.gameObject.anchoredX = this.startX;
	// 	}
	// }
};

// Called every frame, if the behaviour is enabled.
//Runner.prototype.update = function() {
//
//};

// define a user behaviour
var ScoreLabel = qc.defineBehaviour('qc.wtf.ScoreLabel', qc.Behaviour, function() {
	this.tick = 0;
}, {
	label: qc.Serializer.NODE
});

ScoreLabel.prototype.init = function(score) {
	this.label.text = score + "";
};

ScoreLabel.prototype.update = function() {
	this.tick++;
	if(this.tick < 50){
		return;
	}

	this.gameObject.anchoredY -= 1;
	this.gameObject.alpha -= 0.05;
	if(this.gameObject.alpha < 0){
		this.gameObject.alpha = 0;
	}
	if(this.tick >= 70){
		this.gameObject.destroy();
	}
};

// define a user behaviour
var ScorePanelManager = qc.defineBehaviour('qc.engine.ScorePanelManager', qc.Behaviour, function() {
    ScorePanelManager.instance = this;
	this.playerTags = [];
	this.log = "";
}, {
    playerTagPrefab: qc.Serializer.PREFAB,
	scoreView: qc.Serializer.NODE,
	dom: qc.Serializer.NODE
});

ScorePanelManager.prototype.awake = function() {
	this.gameObject.visible = false;
	wh.Event.bind('$newplayer', this.onNewPlayer, this);
	wh.Event.bind('$playerdata', this.onGetPlayerData, this);
	wh.Event.bind('$leave', this.onLeave, this);
	wh.Event.bind('$score', this.onScore, this);
	wh.Event.bind('$newmap', this.onNewMap, this);

	wh.Event.bind('$infect', this.onInfect, this);
	wh.Event.bind('$source', this.onSource, this);
	wh.Event.bind('$fullsur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			this.onSurvive(uuid, 5);
		}

	}, this);

	wh.Event.bind('$sur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			this.onSurvive(uuid, 3);
		}
	}, this);

	wh.Event.bind('$halfsur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			this.onSurvive(uuid, 1);
		}
	}, this);

	wh.Event.bind('$msg', this.onMessage, this);
};



ScorePanelManager.prototype.show = function() {
	this.gameObject.visible = true;
};

ScorePanelManager.prototype.hide = function() {
	this.gameObject.visible = false;
};

ScorePanelManager.prototype.start = function(name, uuid, score) {
	this.playerTags = [];
	this.log = "";
	this.scoreView.removeChildren();

	var tag = this.game.add.clone(this.playerTagPrefab, this.scoreView);
	tag.PlayerTag.uuid = uuid;
	tag.PlayerTag.setScore(score);
	tag.PlayerTag.setName(name);
	tag.PlayerTag.setComplete(GameManager.instance.mode == "plague");

	this.playerTags.push(tag);

	this.updateOrder();
};

ScorePanelManager.prototype.onInfect = function(data) {
	var s = data.s;
	var m = data.m;

	if(s){
		for(var i = 0; i < this.playerTags.length; i++){
			var tag = this.playerTags[i];
			if(s == tag.PlayerTag.uuid){
				tag.PlayerTag.setScore(parseInt(tag.PlayerTag.score) + parseInt(1));
				break;
			}
		}
	}

	if(m){
		for(var i = 0; i < this.playerTags.length; i++){
			var tag = this.playerTags[i];
			if(m == tag.PlayerTag.uuid){
				tag.PlayerTag.setComplete(false);
				break;
			}
		}
	}
	this.updateOrder();
};

ScorePanelManager.prototype.onSource = function(data) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		if(data.uuid == tag.PlayerTag.uuid){
			tag.PlayerTag.setComplete(false);
			break;
		}
	}
	this.updateOrder();
};

ScorePanelManager.prototype.onNewPlayer = function(data) {
	var tag = this.game.add.clone(this.playerTagPrefab, this.scoreView);
	tag.PlayerTag.uuid = data.uuid;
	tag.PlayerTag.setScore(data.score);
	tag.PlayerTag.setName(data.name);
	tag.PlayerTag.setComplete(GameManager.instance.mode == "plague");

	this.addMessage("<系统>" + data.name + " 加入了房间。");

	this.playerTags.push(tag);

	this.updateOrder();
};

ScorePanelManager.prototype.onGetPlayerData = function(data) {
	for(var i = 0; i < data.length; i++){
		var d = data[i];
		var name = d.name;
		var uuid = d.uuid;
		var score = d.score;

		var tag = this.game.add.clone(this.playerTagPrefab, this.scoreView);
		tag.PlayerTag.uuid = uuid;
		tag.PlayerTag.setScore(score);
		tag.PlayerTag.setName(name);

		if(GameManager.instance.mode == "race" && d.scored){
			tag.PlayerTag.setComplete(true);
		}else if(GameManager.instance.mode == "plague" && (d.infected == 0 || d.infected == "0")){
			tag.PlayerTag.setComplete(true);
		}else{
			tag.PlayerTag.setComplete(false);
		}

		this.playerTags.push(tag);
	}

	this.updateOrder();
};

ScorePanelManager.prototype.onLeave = function(data) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		if(data.uuid == tag.PlayerTag.uuid){
			this.playerTags.splice(i, 1);
			tag.destroy();
			break;
		}
	}
	if(GameManager.instance.playerMap["p" + data.uuid]){
		this.addMessage("<系统>" + GameManager.instance.playerMap["p" + data.uuid].Player.playerName + " 离开了房间。");
	}
	this.updateOrder();
};

ScorePanelManager.prototype.onSurvive = function(uuid, score) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		if(uuid == tag.PlayerTag.uuid){
			tag.PlayerTag.setScore(parseInt(tag.PlayerTag.score) + parseInt(score));
			tag.PlayerTag.rank = score;
			break;
		}
	}

	this.updateOrder();
};

ScorePanelManager.prototype.onScore = function(data) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		if(data.uuid == tag.PlayerTag.uuid){
			tag.PlayerTag.setScore(parseInt(tag.PlayerTag.score) + parseInt(data.score));
			tag.PlayerTag.rank = data.score;
			tag.PlayerTag.setComplete(true);
			break;
		}
	}

	this.updateOrder();
};

ScorePanelManager.prototype.onNewMap = function(data) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		tag.PlayerTag.rank = 0;
		if(GameManager.instance.mode == "plague"){
			tag.PlayerTag.setComplete(true);
		}else{
			tag.PlayerTag.setComplete(false);
		}
	}

	this.updateOrder();
};

ScorePanelManager.prototype.onMessage = function(data) {
	var text = data.msg;

	var name = "herobrine";
	if(GameManager.instance.playerMap["p" + data.uuid]){
		name = GameManager.instance.playerMap["p" + data.uuid].Player.playerName;
	}
	var t = name + ": " + text;
	this.addMessage(t);
};

ScorePanelManager.prototype.addMessage = function(message) {
	this.log = message + "\n" + this.log;
	this.dom.innerHTML = '<textarea style="width:100%; height:100%; background-color:#346; color:#fff;">' + this.log + '</textarea>';
};

ScorePanelManager.prototype.updateOrder = function() {


	this.playerTags.sort(function(a,b){
		var result = 0;

		if(a.PlayerTag.rank > 0 && b.PlayerTag.rank > 0){
			if(a.PlayerTag.rank > b.PlayerTag.rank){
				result = -1;
			}else{
				result = 1;
			}
		}else if(a.PlayerTag.rank > 0 && b.PlayerTag.rank == 0){
			result = -1;
		}else if(a.PlayerTag.rank == 0 && b.PlayerTag.rank > 0){
			result = 1;
		}else{
			if(a.PlayerTag.score > b.PlayerTag.score){
				result = -1;
			}else if(a.PlayerTag.score < b.PlayerTag.score){
				result = 1;
			}else{
				result = 0;
			}
		}
		return result;
	});

	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		tag.anchoredY = 50 * i;
	}

	this.scoreView.height = this.playerTags.length * 50;
};

// define a user behaviour
var ServerManager = qc.defineBehaviour('qc.wtf.ServerManager', qc.Behaviour, function() {
	ServerManager.instance = this;
    this.address = "ws://192.168.16.45:8080/TestServer/server";
}, {
    address: qc.Serializer.STRING
});

ServerManager.prototype.awake = function() {
	wh.Server.address = this.address;
	if(window['address']){
		wh.Server.address = window['address'];
	}
	wh.Event.bind('ON_MESSAGE', this.onMessage, this);
};

ServerManager.prototype.connect = function() {
	wh.Server.connect();
};

ServerManager.prototype.close = function() {
	wh.Server.socket.close();
};

ServerManager.prototype._send = function(data) {
	wh.Server.send(data);
};

ServerManager.prototype.onMessage = function(data) {
	var message = wh.Base64.decode(data);
	var json = JSON.parse(message);
	//console.log(message);
	wh.Event.call(json.k, json.v);
};

ServerManager.prototype.sendMessage = function(key, pack) {
	var p = {
		k: key,
		v: pack
	};
	var text = JSON.stringify(p);
	var encodeText = wh.Base64.encode(text);
	this._send(encodeText);
};

var SoundManager = qc.defineBehaviour('qc.engine.SoundManager', qc.Behaviour, function() {
    SoundManager.instance = this;
    this.mute = false;
}, {

});

SoundManager.prototype.play = function(s) {
    if(this.mute) return;

    var self = this;
    this.game.assets.load('sound', 'Assets/audio/' + s + '.mp3.bin', function(audio) {
        var sound = self.game.add.sound();
        sound.volume = 0.5;
        if(s == 'on' || s == 'off'){
            sound.volume = 0.2;
        }
        if(s == 'shoot'){
            sound.volume = 0.1;
        }
        sound.audio = audio;
        sound.play();
    });
};

// define a user behaviour
var TopUIManager = qc.defineBehaviour('qc.wtf.TopUIManager', qc.Behaviour, function() {
	TopUIManager.instance = this;
    this.time = 0;
}, {
    lblRoomNum: qc.Serializer.NODE,
	lblPlayerCount: qc.Serializer.NODE,
	lblTimer: qc.Serializer.NODE,
	lblMapName: qc.Serializer.NODE,
	lblModeName: qc.Serializer.NODE
});

TopUIManager.prototype.awake = function() {
	this.gameObject.visible = true;
	var self = this;
	this.game.timer.loop(1000, function(){self.tick();});
};

TopUIManager.prototype.setTime = function(sec) {
	this.time = sec;
};

TopUIManager.prototype.setRoomNum = function(num) {
	this.lblRoomNum.text = ((num < 10 && num > 0) ? '0' : '') + num;
};

TopUIManager.prototype.setMapName = function(name) {
	this.lblMapName.text = name;
};

TopUIManager.prototype.setModeName = function(name) {
	this.lblModeName.text = name;
};

TopUIManager.prototype.setPlayerCount = function(count, max) {
	this.lblPlayerCount.text = '玩家:' + count + '/' + max;
};

TopUIManager.prototype.tick = function() {
	this.time--;
	if(this.time < 0) return;

	var min = Math.floor(this.time / 60);
	var sec = this.time % 60;

	this.lblTimer.text = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
};

var Turret = qc.defineBehaviour('qc.wtf.Turret', qc.Behaviour, function() {
	this.delay = 0;
	this.isAuto = false;
	this.autoFreq = 10;
	this.tick = 0;
	this.distance = 100;
}, {
	delay: qc.Serializer.NUMBER,
	dir: qc.Serializer.POINT,
    bulletPrefab: qc.Serializer.PREFAB,
	isAuto: qc.Serializer.BOOLEAN,
	autoFreq: qc.Serializer.INT,
	distance: qc.Serializer.INT
});

Turret.prototype.update = function() {
	this.tick++;
	if(this.isAuto){
		if(this.tick % this.autoFreq == 0){
			this.shoot();
		}
	}
};

Turret.prototype.shoot = function() {
	SoundManager.instance.play('shoot');
	var b = this.game.add.clone(this.bulletPrefab, this.gameObject.parent);
	b.Bullet.gen(new qc.Point(this.gameObject.anchoredX, this.gameObject.anchoredY), this.dir, this.distance);
};

Turret.prototype.awake = function() {
	if(!this.isAuto){
		wh.Event.bind('$shoot', this.onShoot, this);
	}
};

Turret.prototype.onShoot = function(data) {
	var self = this;
	this.game.timer.add(this.delay, function(){
		if(self.gameObject.isWorldVisible()){
			self.shoot();
		}
	});
};


}).call(this, this, Object);
