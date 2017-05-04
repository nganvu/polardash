var NVMC = NVMC || { };

NVMC.__defineGetter__("_ticks", function () {
	var d = new Date();
	return Math.floor(d.getTime());
});

NVMC._RunningAverage = function () {
	this.reset();
};

NVMC._RunningAverage.prototype = {
	reset : function () {
		this._value = 0;
		this._count = 0;
	},

	addSample : function (x) {
		this._value = ((this._value * this._count) + x) / (this._count + 1);
		this._count++;
	},

	get value() {
		return this._value;
	},

	get count() {
		return this._count;
	}
};

NVMC._Message = {
	SC : {
		NONE   :  0,
		LOGIN  :  1,
		LOGOUT :  2,
		PING   :  3,
		PONG   :  4,
		JOIN   :  5,
		LEAVE  :  6,
		STATE  :  7
	},

	CS : {
		NONE   :  0,
		LOGIN  :  1,
		LOGOUT :  2,
		PING   :  3,
		PONG   :  4,
		RESET  :  5,
		INPUT  :  6
	},

	create : function (code, msg) {
		var timeStamp = NVMC._ticks;
		var m = "{\"c\":" + code + ",\"t\":" + timeStamp + ",\"m\":" + msg + "}";
		return m;
	}
};

NVMC.PhysicsStaticState = function () {
	this._reset();
};

NVMC.PhysicsStaticState.Default = { };

NVMC.PhysicsStaticState.Default.MASS               = 1.0;
NVMC.PhysicsStaticState.Default.FORWARD_FORCE      = 20.0;
NVMC.PhysicsStaticState.Default.BACKWARD_FORCE     = 35.0;
NVMC.PhysicsStaticState.Default.LINEAR_FRICTION    = 1.0;
NVMC.PhysicsStaticState.Default.STEER_ACCELERATION = 1.0;

NVMC.PhysicsStaticState.prototype = {
	_reset : function () {
		this._mass              = NVMC.PhysicsStaticState.Default.MASS;
		this._forwardForce      = NVMC.PhysicsStaticState.Default.FORWARD_FORCE;
		this._backwardForce     = NVMC.PhysicsStaticState.Default.BACKWARD_FORCE;
		this._linearFriction    = NVMC.PhysicsStaticState.Default.LINEAR_FRICTION;
		this._steerAcceleration = NVMC.PhysicsStaticState.Default.STEER_ACCELERATION;
	},

	_parseMessage : function (msg) {
		this._mass              = msg.m;
		this._forwardForce      = msg.f;
		this._backwardForce     = msg.b;
		this._linearFriction    = msg.l;
		this._steerAcceleration = msg.s;
		return true;
	},

	get mass()              { return this._mass;              },
	get forwardForce()      { return this._forwardForce;      },
	get backwardForce()     { return this._backwardForce;     },
	get linearFriction()    { return this._linearFriction;    },
	get steerAcceleration() { return this._steerAcceleration; }
};

NVMC.PhysicsDynamicState = function () {
	this._reset();
};

NVMC.PhysicsDynamicState.prototype = {
	_reset : function () {
		this._position        = SpiderGL.Math.Vec3.zero();
		this._linearVelocity  = SpiderGL.Math.Vec3.zero();
		//this._orientation     = SpiderGL.Math.Quat.identity();
		//this._angularVelocity = SpiderGL.Math.Vec3.zero();
		this._orientation     = 4.17;
		this._angularVelocity = 0.0;
		this._frame = [];
	},

	_parseMessage : function (msg) {
		this._position        = msg.p;
		this._linearVelocity  = msg.l;
		this._orientation     = msg.o;
		this._angularVelocity = msg.a;
		return true;
	},

	_clone : function () {
		var r = new NVMC.PhysicsDynamicState();
		r._position        = this._position.slice();
		r._linearVelocity  = this._linearVelocity.slice();
		r._orientation     = this._orientation;
		r._angularVelocity = this._angularVelocity;
		r._frame	   = this._frame;
		return r;
	},

	_copyFrom : function (s) {
		this._position        = s._position.slice();
		this._linearVelocity  = s._linearVelocity.slice();
		this._orientation     = s._orientation;
		this._angularVelocity = s._angularVelocity;
		this._frame = s._frame;
	},

	_wrapAngle : function (x) {
		var twoPi = 2.0 * Math.PI;
		while (x > 0.0) { x -= twoPi; }
		while (x < 0.0) { x += twoPi; }
		return x;
	},

	_lerp : function (a, b, t) {
		if (t == 0.0) {
			this._copyFrom(b);
			return;
		}

		if (t == 1.0) {
			this._copyFrom(a);
			return;
		}

		var s = 1.0 - t;

		this._position       = SpiderGL.Math.Vec3.add(SpiderGL.Math.Vec3.muls(a._position,       t), SpiderGL.Math.Vec3.muls(b._position,       s));
		this._linearVelocity = SpiderGL.Math.Vec3.add(SpiderGL.Math.Vec3.muls(a._linearVelocity, t), SpiderGL.Math.Vec3.muls(b._linearVelocity, s));

		var oa = this._wrapAngle(a._orientation);
		var ob = this._wrapAngle(b._orientation);
	
		if (oa < ob) {
			if ((ob - oa) > Math.PI) {
				oa += 2.0 * Math.PI;
			}
		}
		else {
			if ((oa - ob) > Math.PI) {
				ob += 2.0 * Math.PI;
			}
		}
		var ot = ((oa * t) + (ob * s));
		this._orientation = this._wrapAngle(ot);
		this._angularVelocity = ((a._angularVelocity * t) + (b._angularVelocity * s));
	},

	get position()        	{ return this._position;        },
	get linearVelocity()  	{ return this._linearVelocity;  },
	get orientation()     	{ return this._orientation;     },
	get angularVelocity() 	{ return this._angularVelocity; },
	get frame() 						{ return this._frame; },

};

NVMC.InputState = function () {
	this._reset();
};

NVMC.InputState._NONE        = (     0);
NVMC.InputState._ACCELERATE  = (1 << 0);
NVMC.InputState._BRAKE       = (1 << 1);
NVMC.InputState._STEER_LEFT  = (1 << 2);
NVMC.InputState._STEER_RIGHT = (1 << 3);

NVMC.InputState.prototype = {
	_reset : function () {
		this._s = NVMC.InputState._NONE;
	},

	_parseMessage : function (msg) {
		this._s = msg.s;
		return true;
	},

	get _state()        { return this._s; },
	set _state(s)       { this._s = s;    },

	get _accelerate()   { return ((this._s & NVMC.InputState._ACCELERATE) != 0); },
	set _accelerate(on) { if (on) { this._s |= NVMC.InputState._ACCELERATE; } else { this._s &= ~(NVMC.InputState._ACCELERATE); } },

	get _brake()        { return ((this._s & NVMC.InputState._BRAKE) != 0); },
	set _brake(on)      { if (on) { this._s |= NVMC.InputState._BRAKE; } else { this._s &= ~(NVMC.InputState._BRAKE); } },

	get _steerLeft()    { return ((this._s & NVMC.InputState._STEER_LEFT) != 0); },
	set _steerLeft(on)  { if (on) { this._s |= NVMC.InputState._STEER_LEFT; } else { this._s &= ~(NVMC.InputState._STEER_LEFT); } },

	get _steerRight()   { return ((this._s & NVMC.InputState._STEER_RIGHT) != 0); },
	set _steerRight(on) { if (on) { this._s |= NVMC.InputState._STEER_RIGHT; } else { this._s &= ~(NVMC.InputState._STEER_RIGHT); } },

	get accelerate()   { return this._accelerate; },
	get brake()        { return this._brake;      },
	get steerLeft()    { return this._steerLeft;  },
	get steerRight()   { return this._steerRight; }
};

NVMC.Player = function (id) {
	this._id = id;
	this._reset();
};

NVMC.Player.prototype = {
	_reset : function () {
		this._statics = new NVMC.PhysicsStaticState();
		var dynState = new NVMC.PhysicsDynamicState();
		this._dynamics = {
			_remote  : dynState,
			_local   : dynState._clone(),
			_display : dynState._clone(),
		};
		this._input = new NVMC.InputState();
		this._currentSmoothing = 0.0;
	},

	_updateState : function (state, dt) {
		var m = this._statics._mass;
		var f = this._statics._forwardForce;
		var b = this._statics._backwardForce;
		var l = this._statics._linearFriction;
		var s = this._statics._steerAcceleration;

		var linearForceAmount = 0.0;
		if (this._input._accelerate)
            linearForceAmount += f;
		if (this._input._brake)      linearForceAmount -= b;

		var linearFriction = SpiderGL.Math.Vec3.muls(state._linearVelocity, -l);
		var linearForce    = SpiderGL.Math.Vec3.muls([SpiderGL.Math.sin(state._orientation), 0.0, SpiderGL.Math.cos(state._orientation)], linearForceAmount);
		var resLinearForce = SpiderGL.Math.Vec3.add(linearFriction, linearForce);

		var linearAcceleration = SpiderGL.Math.Vec3.muls(resLinearForce, 1.0/m);
		state._linearVelocity  = SpiderGL.Math.Vec3.add(state._linearVelocity, SpiderGL.Math.Vec3.muls(linearAcceleration,    dt));
		state._position        = SpiderGL.Math.Vec3.add(state._position,       SpiderGL.Math.Vec3.muls(state._linearVelocity, dt));

		var angularAcceleration = 0.0;
		if (this._input._steerLeft)  angularAcceleration += s;
		if (this._input._steerRight) angularAcceleration -= s;

		state._orientation = state._orientation + angularAcceleration * dt;

		var z_axis = SpiderGL.Math.Mat4.mul4(SpiderGL.Math.Mat4.rotationAngleAxis(state._orientation, [0, 1, 0,0]),[0,0,1,0]);
		z_axis = [ z_axis[0], z_axis[1],z_axis[2]];
		var x_axis = SpiderGL.Math.Vec3.cross([0, 1, 0], z_axis);
		state._frame = [	-x_axis[0],		-x_axis[1],			-x_axis[2]		,0.0,
											0.0,		1.0,			0.0		,0.0,
											-z_axis[0],	-z_axis[1],			-z_axis[2]		,0.0,
											state._position[0],	state._position[1],	state._position[2]	,1.0];

	},

	_rewindState : function (dt, timeStep) {
		var ts = 0.0;
		while (dt > 0.0) {
			ts = (timeStep < dt) ? (timeStep) : (dt);
			dt -= timeStep;
			this._updateState(this._dynamics._remote, -ts);
		}
	},

	_forwardState : function (dt, timeStep) {
		var ts = 0.0;
		while (dt > 0.0) {
			ts = (timeStep < dt) ? (timeStep) : (dt);
			dt -= timeStep;
			this._updateState(this._dynamics._remote, ts);
		}
	},

	_applySmoothing : function () {
		this._dynamics._display._lerp(this._dynamics._local, this._dynamics._remote, this._currentSmoothing);
	},

	_parseLogInMessage : function (msg) {
		this._reset();

		this._id = msg.p;

		this._statics._parseMessage(msg.s);

		var dynState = new NVMC.PhysicsDynamicState();
		dynState._parseMessage(msg.d);

		this._dynamics._remote = dynState;
		this._dynamics._local._copyFrom(this._dynamics._remote);
		this._dynamics._display._copyFrom(this._dynamics._remote);

		this._input._parseMessage(msg.i);

		return true;
	},

	_parseLogOutMessage : function (msg) {
		this._reset();
		return true;
	},

	_parseJoinMessage : function (msg) {
		return this._parseLogInMessage(msg);
	},

	_parseLeaveMessage : function (msg) {
		this._reset();
		return true;
	},

	_parseStateMessage : function (msg, dt, timeStep) {
		this._dynamics._local._copyFrom(this._dynamics._display);
		this._currentSmoothing = 1.0;

		this._rewindState(dt, timeStep);

		this._dynamics._remote._parseMessage(msg.d);

		if (msg.i) {
			this._input._parseMessage(msg.i);
		}

		this._forwardState(dt, timeStep);
	},

	_createLogInMessage : function () {
		return NVMC._Message.create(NVMC._Message.CS.LOGIN, "{}");
	},

	_createLogOutMessage : function (code, msg) {
		return NVMC._Message.create(NVMC._Message.CS.LOGOUT, "{}");
	},

	_createResetMessage : function () {
		return NVMC._Message.create(NVMC._Message.CS.RESET, "{}");
	},

	_createInputMessage : function (serverTicks) {
		return NVMC._Message.create(NVMC._Message.CS.INPUT, "{\"s\":" + this._input._state + ",\"r\":" + serverTicks + "}");
	},

	_update : function (dt, smoothingDecay) {
		this._currentSmoothing -= smoothingDecay;
		if (this._currentSmoothing < 0.0) {
			this._currentSmoothing = 0.0;
		}

		this._updateState(this._dynamics._remote, dt);
		this._updateState(this._dynamics._local,  dt);

		this._applySmoothing();
	},

	get id()           { return this._id;                },
	get staticState()  { return this._statics;           },
	get dynamicState() { return this._dynamics._display; },
	get inputState()   { return this._input;             }
};

NVMC.GamePlayers = function () {
	this._me = new NVMC.Player(1);
	this._reset();
};

NVMC.GamePlayers.prototype = {
	_reset : function () {
		this._me._reset();
		this._me._id = 1;
		this._all = { };
		this._all[this._me._id] = this._me;
		this._opponents = { };
		this._count = 1;
	},

	_login : function (msg) {
		this._reset();
		delete this._all[this._me._id];
		this._me._parseLogInMessage(msg);
		this._all[this._me._id] = this._me;
	},

	_logout : function (msg) {
		delete this._all[this._me._id];
		this._me._parseLogOutMessage(msg);
		this._reset();
	},

	_addOpponents : function (msg) {
		var ids = [ ];
		for (var p in msg.p) {
			ids.push(p);
			var opponent = msg.p[p];
			var player   = new NVMC.Player(p);
			player._parseJoinMessage(opponent);
			this._all[p] = player;
			this._opponents[p] = player;
			this._count++;
		}
		return ids;
	},

	_removeOpponents : function (msg) {
		var ids = [ ];
		for (var p in msg.p) {
			ids.push(p);
			var opponent = msg.p[p];
			var player   = this._opponents[p];
			if (player) {
				player._parseLeaveMessage(opponent);
			}
			delete this._all[p];
			delete this._opponents[p];
			this._count--;
		}
		return ids;
	},

	get count() {
		return this._count;
	},

	get opponentsCount() {
		return (this._count - 1);
	},

	get all() {
		return this._all;
	},

	get me() {
		return this._me;
	},

	get opponents() {
		return this._opponents;
	}
};

NVMC.GameState = function () {
	this._players = new NVMC.GamePlayers();
};

NVMC.GameState.prototype = {
	_update : function (dt, smoothingDecay) {
		for (var p in this._players.all) {
			var player = this._players.all[p];
			player._update(dt, smoothingDecay);
		}
	},

	_updateFromMessage : function (msg, dt, updateMe, timeStep) {
		for (var p in msg.s.p) {
			var player = this._players.opponents[p];
			if (player) {
				player._parseStateMessage(msg.s.p[p], dt, timeStep);
			}
		}

		if (updateMe) {
			var me = this._players._me;
			var meMsg = msg.s.p[me._id];
			if (meMsg) {
				meMsg.i = null;
				me._parseStateMessage(meMsg, dt, timeStep);
			}
		}
	},

	get players() {
		return this._players;
	}
};

NVMC.Tunnel = function (obj) {
	this._parse(obj);
};

NVMC.Tunnel.prototype = {
	_reset : function () {
		this._height = null;
		this._leftCurb      = null;
		this._rightCurb     = null;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			height : 0,
			leftCurb      : [ ],
			rightCurb     : [ ]
		}, obj);


		this._height      = obj.height;
		this._leftCurb      = obj.leftCurb.slice();
		this._rightCurb     = obj.rightCurb.slice();
	},

	get pointsCount() {
		return this._leftCurb.length / 3;
	},
	
	get height(){
		return this._height;
	},

	leftSideAt : function (index) {
		var idx = index * 3;
		return this._leftCurb.slice(idx, idx + 3);
	},

	rightSideAt : function (index) {
		var idx = index * 3;
		return this._rightCurb.slice(idx, idx + 3);
	},
};


NVMC.Track = function (obj) {
	this._parse(obj);
};

NVMC.Track.prototype = {
	_reset : function () {
		this._leftCurb      = null;
		this._rightCurb     = null;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			leftCurb      : [ ],
			rightCurb     : [ ]
		}, obj);


		this._leftCurb      = obj.leftCurb.slice();
		this._rightCurb     = obj.rightCurb.slice();
	},

	get pointsCount() {
		return this._leftCurb.length / 3;
	},

	leftSideAt : function (index) {
		var idx = index * 3;
		return this._leftCurb.slice(idx, idx + 3);
	},

	rightSideAt : function (index) {
		var idx = index * 3;
		return this._rightCurb.slice(idx, idx + 3);
	},
};

NVMC.AreaLigth = function (obj) {
	this._parse(obj);
};

NVMC.AreaLigth.prototype = {
	_reset : function () {
		this._frame = [ 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,  0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 ],
		this._size = [1,1],
		this._color = [0.8,0.8,0.8]
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			frame : [ 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,  0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 ],
			size : [1,1],
			color : [0.8,0.8,0.8]
		}, obj);

		this._frame = obj.frame;
		this._size   = obj.size;
		this._color   = obj.color;
	},

	get frame() {
		return this._frame;
	},

	get size() {
		return this._size;
	},

	get color() {
		return this._color;
	}
	
};
NVMC.Lamp = function (obj) {
	this._parse(obj);
};

NVMC.Lamp.prototype = {
	_reset : function () {
		this._position = [ 0.0, 0.0, 0.0 ];
		this._height   = 0.0;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			position : [ 0.0, 0.0, 0.0 ],
			height   : 0.0
		}, obj);

		this._position = obj.position.slice();
		this._height   = obj.height;
	},

	get position() {
		return this._position.slice();
	},

	get height() {
		return this._height;
	}
};

NVMC.Gift = function (obj) {
	this._parse(obj);
};

NVMC.Gift.prototype = {
	_reset : function () {
		this._position = [ 0.0, 0.0, 0.0 ];
		this._taken = false;
	},

	_take : function () {
		this._taken = true;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			position : [ 0.0, 0.0, 0.0 ],
			taken: false
		}, obj);

		this._position = obj.position.slice();
		this._taken = obj.taken;
	},

	get position() {
		return this._position.slice();
	},

	get taken() {
		return this._taken;
	}
};

NVMC.Penguin = function (obj) {
	this._parse(obj);
};

NVMC.Penguin.prototype = {
	_reset : function () {
		this._position = [ 0.0, 0.0, 0.0 ];
		this._angle   = 0.0;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			position : [ 0.0, 0.0, 0.0 ],
			angle   : 0.0
		}, obj);

		this._position = obj.position.slice();
		this._angle   = obj.angle;
	},

	get position() {
		return this._position.slice();
	},

	get angle() {
		return this._angle;
	}
};

NVMC.Arrow = function (obj) {
	this._parse(obj);
};

NVMC.Arrow.prototype = {
	_reset : function () {
		this._position = [ 0.0, 0.0, 0.0 ];
		this._angle   = 0.0;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			position : [ 0.0, 0.0, 0.0 ],
			angle   : 0.0
		}, obj);

		this._position = obj.position.slice();
		this._angle   = obj.angle;
	},

	get position() {
		return this._position.slice();
	},

	get angle() {
		return this._angle;
	}
};

NVMC.Snowflake = function (obj) {
	this._parse(obj);
};

NVMC.Snowflake.prototype = {
	_reset : function () {
		this._position = [ 0.0, 0.0, 0.0 ];
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			position : [ 0.0, 0.0, 0.0 ],
		}, obj);

		this._position = obj.position.slice();
	},

	get position() {
		return this._position.slice();
	}
};

NVMC.Tree = function (obj) {
	this._parse(obj);
};

NVMC.Tree.prototype = {
	_reset : function () {
		this._position = [ 0.0, 0.0, 0.0 ];
		this._height   = 0.0;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			position : [ 0.0, 0.0, 0.0 ],
			height   : 0.0
		}, obj);

		this._position = obj.position.slice();
		this._height   = obj.height;
	},

	get position() {
		return this._position.slice();
	},

	get height() {
		return this._height;
	}
};

NVMC.Mountain = function (obj) {
	this._parse(obj);
};

NVMC.Mountain.prototype = {
	_reset : function () {
		this._position = [ 0.0, 0.0, 0.0 ];
		this._height   = 0.0;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			position : [ 0.0, 0.0, 0.0 ],
			height   : 0.0
		}, obj);

		this._position = obj.position.slice();
		this._height   = obj.height;
	},

	get position() {
		return this._position.slice();
	},

	get height() {
		return this._height;
	}
};

NVMC.Building = function (obj) {
	this._parse(obj);
};

NVMC.Building.prototype = {
	_reset : function () {
		this._outline = null;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			outline : [ ],
		}, obj);

		this._outline = obj.outline.slice();
	},

	get pointsCount() {
		return this._outline.length / 4;
	},

	positionAt : function (index) {
		var idx = index * 4;
		return this._outline.slice(idx, idx + 3);
	},

	heightAt : function (index) {
		var idx = index * 4;
		return this._outline[idx + 3];
	}
};

NVMC.Weather = function (obj) {
	this._parse(obj);
};

NVMC.Weather.prototype = {
	_reset : function () {
		this._sunDir       = null
		this._cloudDensity = 0;
		this._rainStrength = 0;
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			sunLightDirection : [ 0.0, -1.0, 0.0 ],
			cloudDensity      : 0.0,
			rainStrength      : 0.0
		}, obj);

		this._sunDir       = obj.sunLightDirection.slice();
		this._cloudDensity = obj.cloudDensity;
		this._rainStrength = obj.rainStrength;
	},

	get sunLightDirection() {
		return this._sunDir.slice();
	},

	get cloudDenstity() {
		return this._cloudDenstity;
	},

	get rainStrength() {
		return this._rainStrength;
	}
};

NVMC.Race = function (obj) {
	this._parse(obj);
};

NVMC.Race.prototype = {
	_reset : function () {
		this._startPosition = null;
		this._observerPosition = null;
		this._photoPosition = null;

		this._bbox 	= null;
		this._track     = null;
		this._tunnels     = null;
		this._arealigths     = null;
		this._lamps     = null;
		this._gifts     = null;
		this._penguins  = null;
		this._arrows  = null;
		this._snowflakes     = null;
		this._trees     = null;
		this._mountains = null;
		this._buildings = null;
		this._weather   = null;
	},
	_parseStartPosition:function (obj){
		if(!obj) return;
		this._startPosition =  obj;
	},
	_parsePhotoPosition:function (obj){
		if(!obj) return;
		this._photoPosition =  obj;
	},
	_parseObserverPosition:function (obj){
		if(!obj) return;
		this._observerPosition =  obj;
	},
	_parseBBox : function (obj) {
		if(!obj) return;
		this._bbox = [obj[0],obj[1],obj[2],obj[3],obj[4],obj[5]];
	},

	_parseTrack : function (obj) {
		this._track = new NVMC.Track(obj);
	},

	_parseTunnels : function (obj) {
		if (!obj) return;
		this._tunnels = new Array(obj.length);
		for (var i=0, n=this._tunnels.length; i<n; ++i) {
			this._tunnels[i] = new NVMC.Tunnel(obj[i]);
		}
	},

	_parseAreaLigths : function (obj) {
		if (!obj) return;
		this._arealigths = new Array(obj.length);
		for (var i=0, n=this._arealigths.length; i<n; ++i) {
			this._arealigths[i] = new NVMC.AreaLigth(obj[i]);
		}
	},

	_parseLamps : function (obj) {
		if (!obj) return;
		this._lamps = new Array(obj.length);
		for (var i=0, n=this._lamps.length; i<n; ++i) {
			this._lamps[i] = new NVMC.Lamp(obj[i]);
		}
	},

	_parseGifts : function (obj) {
		if (!obj) return;
		this._gifts = new Array(obj.length);
		for (var i=0, n=this._gifts.length; i<n; ++i) {
			this._gifts[i] = new NVMC.Gift(obj[i]);
		}
	},

	_parsePenguins : function (obj) {
		if (!obj) return;
		this._penguins = new Array(obj.length);
		for (var i=0, n=this._penguins.length; i<n; ++i) {
			this._penguins[i] = new NVMC.Penguin(obj[i]);
		}
	},

	_parseArrows : function (obj) {
		if (!obj) return;
		this._arrows = new Array(obj.length);
		for (var i=0, n=this._arrows.length; i<n; ++i) {
			this._arrows[i] = new NVMC.Arrow(obj[i]);
		}
	},

	_parseSnowflakes : function (obj) {
		if (!obj) return;
		this._snowflakes = new Array(obj.length);
		for (var i=0, n=this._snowflakes.length; i<n; ++i) {
			this._snowflakes[i] = new NVMC.Snowflake(obj[i]);
		}
	},

	_parseTrees : function (obj) {
		if (!obj) return;
		this._trees = new Array(obj.length);
		for (var i=0, n=this._trees.length; i<n; ++i) {
			this._trees[i] = new NVMC.Tree(obj[i]);
		}
	},

	_parseMountains : function (obj) {
		if (!obj) return;
		this._mountains = new Array(obj.length);
		for (var i=0, n=this._mountains.length; i<n; ++i) {
			this._mountains[i] = new NVMC.Mountain(obj[i]);
		}
	},

	_parseBuildings : function (obj) {
		if (!obj) return;
		this._buildings = new Array(obj.length);
		for (var i=0, n=this._buildings.length; i<n; ++i) {
			this._buildings[i] = new NVMC.Building(obj[i]);
		}
	},

	_parseWeather : function (obj) {
		this._weather = new NVMC.Weather(obj);
	},

	_parse : function (obj) {
		this._reset();

		obj = SpiderGL.Utility.getDefaultObject({
			startPosition		:[ ],
			photoPosition		:[ ],
			observerPosition	:[ ],
			bbox	    : {},
			track     : { },
			tunnels     : [ ],
			arealigths: [ ],
			lamps     : [ ],
			gifts     : [ ],
			penguins  : [ ],
			arrows  : [ ],
			snowflakes: [ ],
			trees     : [ ],
			mountains : [ ],
			buildings : [ ],
			weather   : { }
		}, obj);
		
		this._parseStartPosition  (obj.startPosition);
		this._parsePhotoPosition   (obj.photoPosition);
		this._parseObserverPosition   (obj.observerPosition);
		this._parseBBox     (obj.bbox);
		this._parseTrack     (obj.track);
		this._parseTunnels     (obj.tunnels);
		this._parseAreaLigths     (obj.arealigths);
		this._parseLamps     (obj.lamps);
		this._parseGifts     (obj.gifts);
		this._parsePenguins     (obj.penguins);
		this._parseArrows     (obj.arrows);
		this._parseSnowflakes     (obj.snowflakes);
		this._parseTrees     (obj.trees);
		this._parseMountains (obj.mountains);
		this._parseBuildings (obj.buildings);
		this._parseWeather   (obj.weather);
	},

	get startPosition(){
		return this._startPosition;
	},
	get photoPosition(){
		return this._photoPosition;
	},
	get observerPosition(){
		return this._observerPosition;
	},
	get bbox(){
		return this._bbox;
	},
	get track() {
		return this._track;
	},

	get tunnels() {
		return this._tunnels;
	},

	get arealigths() {
		return this._arealigths;
	},

	get lamps() {
		return this._lamps;
	},

	get gifts () {
		return this._gifts;
	},

	get penguins () {
		return this._penguins;
	},

	get arrows () {
		return this._arrows;
	},

	get snowflakes () {
		return this._snowflakes;
	},

	get trees() {
		return this._trees;
	},

	get mountains() {
		return this._mountains;
	},

	get buildings() {
		return this._buildings;
	},

	get weather() {
		return this._weather;
	}
};

NVMC.Game = function () {
	this._started   = false;
	this._loggedIn  = false;
	this._state     = new NVMC.GameState();
	this._socket    = null;
	this._listeners = [ ];

	this._latency   = new NVMC._RunningAverage();

	this._lastUpdateMessageTicks = -1;
	this._updateMessageInterval  = new NVMC._RunningAverage();

	this._pingRate     = 1.0;
	this._pingInterval = null;

	this._updateRate      = 60.0;
	this._lastUpdateTicks = -1;
	this._updateInterval  = null;

	this._timeSamples = [ ];
	this._minStdDev   = Number.MAX_VALUE;
	this._serverTicksDelta = 0;

	this._lastInputServerTicks = -1;

	this._race = new NVMC.Race();
};

NVMC.Game.prototype = {
	_dispatch : function () {
		var funcName = arguments[0];
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i=0,n=this._listeners.length; i<n; ++i) {
			var listener = this._listeners[i];
			var func = listener[funcName];
			if (func) {
				func.apply(listener, args);
			}
		}
	},

	_logIn : function () {
		if (this._loggedIn) return;
		var msg = NVMC._Message.create(NVMC._Message.CS.LOGIN, "{}");
		this._socket.send(msg);
	},

	_logOut : function () {
		if (!this._loggedIn) return;
		var msg = NVMC._Message.create(NVMC._Message.CS.LOGOUT, "{}");
		this._socket.send(msg);
	},

	_startNetworking : function () {
		this._stopNetworking();
		var that = this;
		var pingFunction = function () {
			that._ping();
		};
		this._pingInterval = setInterval(pingFunction, 1000.0 / this._pingRate);
	},

	_stopNetworking : function () {
		if (this._pingInterval) {
			clearInterval(this._pingInterval);
		}
		this._pingInterval = null;
		this._latency.reset();
		this._updateMessageInterval.reset();
	},

	_localLogIn : function () {
		var id           = 0;
		var dynamicState = new NVMC.PhysicsDynamicState();
		var staticState  = new NVMC.PhysicsStaticState();
		var inputState   = new NVMC.InputState();

		dynamicState._position = this._race.startPosition;

		var msg = {
			p : id,
			s : {
				m : staticState._mass,
				f : staticState._forwardForce,
				b : staticState._backwardForce,
				l : staticState._linearFriction,
				s : staticState._steerAcceleration
			},
			d : {
				p : dynamicState._position,
				l : dynamicState._linearVelocity,
				o : dynamicState._orientation,
				a : dynamicState._angularVelocity
			},
			i : {
				s : inputState._state
			}
		};

		this._state._players._login(msg);

		this._dispatch("onLogIn");

	},

	_onOpen : function () {
		this._dispatch("onConnectionOpen");
		this._logIn();
	},

	_onClose : function () {
		if (this._loggedIn) {
			var timeStamp = NVMC._ticks;

			var leaveMsg = { p : { } };
			for (var p in this._state._players._opponents) {
				leaveMsg.p[p] = { };
			}
			this._onLeaveMessage(timeStamp, leaveMsg);

			var logOutMsg = { };
			this._onLogOutMessage(timeStamp, logOutMsg);
		}

		this._socket = null;

		this._dispatch("onConnectionClosed");
	},

	_onError : function (evt) {
		this._dispatch("onConnectionError", evt.data);
	},

	_onMessage : function (evt) {
		var msgStr = evt.data;

		var msg = JSON.parse(msgStr);
		if (!msg) return;

		var code      = msg.c;
		var timeStamp = msg.t;
		var message   = msg.m;

		if (code == NVMC._Message.SC.LOGIN) {
			if (!this._loggedIn) {
				this._onLogInMessage(timeStamp, message);
			}
			return;
		}

		if (!this._loggedIn) return;

		switch (code) {
			case NVMC._Message.SC.LOGOUT:
				this._onLogOutMessage(timeStamp, message);
			break;

			case NVMC._Message.SC.PING:
				this._onPingMessage(timeStamp, message);
			break;

			case NVMC._Message.SC.PONG:
				this._onPongMessage(timeStamp, message);
			break;

			case NVMC._Message.SC.JOIN:
				this._onJoinMessage(timeStamp, message);
			break;

			case NVMC._Message.SC.LEAVE:
				this._onLeaveMessage(timeStamp, message);
			break;

			case NVMC._Message.SC.STATE:
				this._onStateMessage(timeStamp, message);
			break;

			default:
				this._onUnknownMessage(timeStamp, message, code);
			break;
		}
	},

	_onLogInMessage : function (timeStamp, msg) {
		if (this._loggedIn) return;

		this._state._players._login(msg);

		this._loggedIn = true;
		this._startNetworking();
		this._dispatch("onLogIn");
	},

	_onLogOutMessage : function (timeStamp, msg) {
		if (!this._loggedIn) return;

		this._state._players._logout(msg);

		this._loggedIn = false;
		this._stopNetworking();
		this._dispatch("onLogOut");

		this._socket.close();
	},

	_onPingMessage : function (timeStamp, msg) {
		var msg = NVMC._Message.create(NVMC._Message.CS.PONG, "{\"r\":" + timeStamp + "}");
		this._socket.send(msg);
	},

	_onPongMessage : function (timeStamp, msg) {
		var now = NVMC._ticks;
		var dt  = now - msg.r;
		var latency = dt / 2.0;
		this._latency.addSample(latency);

		var serverSendTime = timeStamp + latency;
		var cs = {
			lat   : latency,
			delta : serverSendTime - now
		};
		this._timeSamples.push(cs);

		var maxSamples = 10;
		var toErase = this._timeSamples.length - maxSamples;
		if (toErase > 0) {
			this._timeSamples.splice(0, toErase);
		}

		var samples = this._timeSamples.slice();

		var stdDev = 0.0;
		var mean   = 0.0;
		var value  = 0.0;
		var n      = samples.length;
		for (var i=0; i<n; ++i) {
			value   = samples[i].lat;
			mean   += value;
			stdDev += value * value;
		}
		mean   /= n;
		stdDev /= n;
		stdDev = Math.sqrt(stdDev - (mean * mean));

		samples.sort(function (a, b) {
			return (a.lat - b.lat);
		});

		var idx = Math.floor((n - 1) / 2);
		var median = samples[idx].lat;

		var count = 0;
		var accum = 0.0;
		var valS  = 0.0;
		for (var i=0; i<n; ++i) {
			value = Math.abs(samples[i].lat - median);
			if (value <= stdDev) {
				accum += samples[i].delta;
				count++;
			}
		}

		this._serverTicksDelta = ((count > 0) ? (accum / count) : (0));
	},

	_onJoinMessage: function (timeStamp, msg) {
		var ids = this._state._players._addOpponents(msg);
		for (var i=0,n=ids.length; i<n; ++i) {
			this._dispatch("onPlayerJoin", ids[i])
		}
	},

	_onLeaveMessage: function (timeStamp, msg) {
		var ids = this._state._players._removeOpponents(msg);
		for (var i=0,n=ids.length; i<n; ++i) {
			this._dispatch("onPlayerLeave", ids[i])
		}
	},

	_onStateMessage: function (timeStamp, msg) {
		if (!this._loggedIn) return;

		var now = NVMC._ticks;
		if (this._lastUpdateMessageTicks >= 0) {
			var updateDelta = now - this._lastUpdateMessageTicks;
			this._updateMessageInterval.addSample(updateDelta);
		}
		this._lastUpdateMessageTicks = now;

		var dt = Math.max((this.serverTicks - timeStamp), 0.0) / 1000.0;
        dt = 0.1;
		//var updateMe = ((this._lastInputServerTicks - timeStamp) < (this._latency.value * 2.0));
		var updateMe = (timeStamp > this._lastInputServerTicks);
		this._state._updateFromMessage(msg, dt, updateMe, 1.0 / this._updateRate);
	},

	_onUnknownMessage: function (timeStamp, msg, code) {
	},

	_ping : function () {
		var msg = NVMC._Message.create(NVMC._Message.CS.PING, "{}");
		this._socket.send(msg);
	},

	_update : function () {
		var now = NVMC._ticks;
		var dt  = (now - this._lastUpdateTicks) / 1000.0;
		this._lastUpdateTicks = now;
		var updateInterval = this._updateMessageInterval.value / 1000.0;
		var smoothingDecay = 1.0;
		if (updateInterval > 0.0) {
			smoothingDecay = dt / updateInterval;
		}
		this._state._update(dt, smoothingDecay);
	},

	_listenerPos : function (listener) {
		for (var i=0,n=this._listeners.length; i<n; ++i) {
			if (listener == this._listeners[i]) {
				return i;
			}
		}
		return -1;
	},

	_updateInput : function (name, value) {
		var me = this._state._players._me;
		var st = this.serverTicks;
		this._lastInputServerTicks = st;
		me._input[name] = value;
		if (this.isConnected) {
			var inputMsg = me._createInputMessage(st);
			this._socket.send(inputMsg);
		}
	},

	start : function () {
		this.stop();
		var that = this;
		var updateFunction = function () {
			that._update();
		};
		this._lastUpdateTicks = NVMC._ticks;
		this._updateInterval  = setInterval(updateFunction, 1000.0 / this._updateRate);
		this._started = true;
		this._localLogIn();
		this._dispatch("onNewRace", this._race);
		return true;
	},

	stop : function () {
		if (!this.isStarted) return false;
		this.disconnect();
		if (this._updateInterval) {
			clearInterval(this._updateInterval);
		}
		this._lastUpdateTicks = -1;
		this._updateInterval  = null;
		this._started = false;
		return true;
	},

	get isStarted () {
		return this._started;
	},

	addListener : function (listener) {
		if (this._listenerPos(listener) >= 0) return false;
		this._listeners.push(listener);
		return true;
	},

	removeListener : function (listener) {
		var p = this._listenerPos(listener);
		if (p < 0) return false;
		this._listeners.splice(p, 1);
		return true;
	},

	connect : function (url) {
		if (!this.isStarted) return false;

		this.disconnect();

		var socket = new WebSocket(url);
		this._socket = socket;

		var that = this;

		socket.onopen    = function ()    { that._onOpen();       };
		socket.onclose   = function ()    { that._onClose();      };
		socket.onerror   = function (evt) { that._onError(evt);   };
		socket.onmessage = function (evt) { that._onMessage(evt); };

		return true;
	},

	disconnect : function (url) {
		if (!this._socket) return false;
		if (this._loggedIn) {
			this._logOut();
		}
		else {
			this._socket.close();
		}
		return true;
	},

	get isConnected() {
		if (this._socket) {
			return (this._socket.readyState == WebSocket.OPEN);
		}
		else {
			return false;
		}
	},

	get isLoggedIn() {
		return this._loggedIn;
	},

	get url() {
		if (this._socket) {
			return this._socket.url;
		}
		else {
			return null;
		}
	},

	get latency() {
		return this._latency.value;
	},

	get roundTripTime() {
		return (this._latency.value * 2);
	},

	get ticks() {
		return NVMC._ticks;
	},

	get serverTicksDelta() {
		return this._serverTicksDelta;
	},

	get serverTicks() {
		var now = NVMC._ticks;
		var st  = Math.floor(now + this._serverTicksDelta);
		return st;
	},

	get serverTime() {
		var d = new Date(this.serverTicks);
		return d;
	},

	get updateRate() {
		return this._updateRate;
	},

	set updateRate(x) {
		if (this._updateRate == x) return;

		this._updateRate = x;

		if (this._updateInterval) {
			clearInterval(this._updateInterval);
		}
		this._lastUpdateTicks = -1;
		this._updateInterval  = null;

		var that = this;
		var updateFunction = function () {
			that._update();
		};
		this._lastUpdateTicks = NVMC._ticks;
		this._updateInterval  = setInterval(updateFunction, 1000.0 / this._updateRate);
	},

	get state() { return this._state; },

	get playerID() { return this._state._players._me._id; },

	set playerAccelerate(x) { this._updateInput("_accelerate", x); },
	get playerAccelerate()  { return this._state._players._me._input._accelerate; },
	set playerBrake(x)      { this._updateInput("_brake", x); },
	get playerBrake()       { return this._state._players._me._input.brake; },
	set playerSteerLeft(x)  { this._updateInput("_steerLeft", x); },
	get playerSteerLeft()   { return this._state._players._me._input._steerLeft; },
	set playerSteerRight(x) { this._updateInput("_steerRight", x); },
	get playerSteerRight()  { return this._state._players._me._input._steerRight; },

	playerReset : function () {
		var me = this._state._players._me;
		me._reset();
		if (this.isLoggedIn) {
			var resetMsg = me._createResetMessage();
			this._socket.send(resetMsg);
		}
	},

	setRace : function (obj) {
		this._race = new NVMC.Race(obj);
	},

	get players() {
		return this._state._players.all;
	},

	get playersCount() {
		return this._state._players.count;
	},

	get opponents() {
		return this._state._players.opponents;
	},

	get opponentsCount() {
		return this._state._players.opponentsCount;
	},

	get me() {
		return this._state._players._me;
	},

	get player() {
		return this.me;
	},

	get race() {
		return this._race;
	}
};

NVMC.setupGame = function (options) {
	options = options || { };

	var opts = {
		handler : options.handler,
		canvas  : options.canvas,
		race    : options.race,
		url     : options.url,
		fps     : options.fps,
		ups     : options.ups,
		onload  : options.onLoad
	};

	function onLoad() {
		opts = SpiderGL.Utility.getDefaultObject({
			handler : null,
			canvas  : "nvmc-canvas",
			race    : NVMC.DefaultRace,
			url     : "ws://146.48.84.222:80",
			fps     : 60.0,
			ups     : 60.0,
			onLoad  : null
		}, opts);

		var handler = opts.handler;
		var canvas  = opts.canvas;
		var race    = opts.race;
		var url     = opts.url;
		var fps     = opts.fps;
		var ups     = opts.ups;
		var onload  = opts.onLoad;

		var game = new NVMC.Game();
		handler.game = game;

		game.setRace(race);
		game.addListener(handler);

		SpiderGL.UserInterface.handleCanvas(canvas, handler, {animateRate: fps});

		(ups > 0) && (game.updateRate = ups);
		url && game.connect(url);

		game.start();

		onload && onload();
	};

	window.addEventListener("load", onLoad, false);

	return true;
};

NVMC.log = function (msg) {
	var textarea = document.getElementById("nvmc-log");
	textarea.innerHTML += (msg + "\n");
	textarea.scrollTop = textarea.scrollHeight;;
};

NVMC.logTime = function (msg) {
	var textarea = document.getElementById("nvmc-logtime");
	textarea.innerHTML = "Time left\n";
	textarea.innerHTML += (msg + "s\n");
	textarea.scrollTop = textarea.scrollHeight;;
};

NVMC.logPoint = function (msg) {
	var textarea = document.getElementById("nvmc-logpoint");
	textarea.innerHTML = "Total score\n";
	textarea.innerHTML += (msg + "/16\n");
	textarea.scrollTop = textarea.scrollHeight;;
};

NVMC.logInstructions = function (msg) {
	var textarea = document.getElementById("nvmc-instructions");
	if (msg == true) {
		textarea.style.display = "block";
		textarea.innerHTML = "Use the [A] and [D] keys to skate.\n\n Collect the Presents and return them to Santa before Sundown.\n\n Watch out for Pesky Penguins! \n\n GET READY";
	}
	else if (msg == false) {
		textarea.style.display = "none";
	}
	else if (msg == "win") {
		textarea.style.display = "block";
		textarea.innerHTML = "YOU WON! :D"
		textarea.style.fontSize = "5em";
		textarea.style.top = "25%";
    textarea.style.left = "25%";
    textarea.style.width = "50%";
		document.getElementById("nvmc-logtime").style.display = "none";
		document.getElementById("nvmc-logpoint").style.display = "none";
	}
	else if (msg == "lose") {
		textarea.style.display = "block";
		textarea.innerHTML = "YOU LOSE! :("
		textarea.style.fontSize = "5em";
		textarea.style.top = "25%";
    textarea.style.left = "25%";
    textarea.style.width = "50%";
		document.getElementById("nvmc-logtime").style.display = "none";
		document.getElementById("nvmc-logpoint").style.display = "none";
	}
	textarea.scrollTop = textarea.scrollHeight;
}

NVMC.logCountdown = function (msg) {
	var textarea = document.getElementById("nvmc-countdown");
	if (msg == false) {
		textarea.style.display = "none";
	}
	else {
		textarea.style.display = "block";
	}
	textarea.innerHTML = msg;
	textarea.scrollTop = textarea.scrollHeight;;
}