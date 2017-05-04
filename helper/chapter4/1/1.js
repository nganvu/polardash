// Global NVMC Client
// ID 4.1
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function findDistance(a, b) {
	return Math.pow(a[0] - b[0], 2) + Math.pow(a[2] - b[2], 2);
};

function PhotographerCamera() {//line 7, Listing 4.6
	this.position = [0, 0, 0];
	this.orientation = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	this.t_V = [0, 0, 0];
	this.orienting_view = false;
	this.lockToCar = false;
	this.start_x = 0;
	this.start_y = 0;

	var me = this;
	this.handleKey = {};
	this.handleKey["Q"] = function () {me.t_V = [0, 0.1, 0];};
	this.handleKey["E"] = function () {me.t_V = [0, -0.1, 0];};
	this.handleKey["L"] = function () {me.lockToCar= true;};
	this.handleKey["U"] = function () {me.lockToCar= false;};

	this.keyDown = function (keyCode) {
		if (this.handleKey[keyCode])
			this.handleKey[keyCode](true);
	}

	this.keyUp = function (keyCode) {
		this.delta = [0, 0, 0];
	}

	this.mouseMove = function (x,y) {
		if (!this.orienting_view) return;

		var alpha	= (x - this.start_x)/10.0;
		var beta	= -(y - this.start_y)/10.0;
		this.start_x = x;
		this.start_y = y;

		var R_alpha = SglMat4.rotationAngleAxis(sglDegToRad( alpha  ), [0, 1, 0]);
		var R_beta = SglMat4.rotationAngleAxis(sglDegToRad (beta  ), [1, 0, 0]);
		this.orientation = SglMat4.mul(SglMat4.mul(R_alpha, this.orientation), R_beta);
	};

	this.mouseButtonDown = function (x,y) {
		if (!this.lock_to_car) {
			this.orienting_view = true;
			this.start_x = x;
			this.start_y = y;
		}
	};

	this.mouseButtonUp = function () {
		this.orienting_view = false;
	}

	this.updatePosition = function ( t_V ){
		this.position = SglVec3.add(this.position, SglMat4.mul3(this.orientation,  t_V));
		if (this.position[1] > 1.8) this.position[1] = 1.8;
		if (this.position[1] < 0.5) this.position[1] = 0.5;
	}

	this.setView = function (stack, carFrame) {
		this.updatePosition (this.t_V )
		var car_position = SglMat4.col(carFrame,3);
		if (this.lockToCar)
			var invV = SglMat4.lookAt(this.position, car_position, [0, 1, 0]);
		else
			var invV = SglMat4.lookAt(this.position, SglVec3.sub(this.position, SglMat4.col(this.orientation, 2)), SglMat4.col(this.orientation, 1));
		stack.multiply(invV);
	};
};

function ChaseCamera() {
	this.position 				= [0.0,0.0,0.0];
	this.keyDown 					= function (keyCode) {}
	this.keyUp						= function (keyCode) {}
	this.mouseMove				= function (event) {};
	this.mouseButtonDown	= function (event) {};
	this.mouseButtonUp 		= function () {}
	this.setView 					= function ( stack, F_0) {
		var Rx = SglMat4.rotationAngleAxis(sglDegToRad(-20), [1.0, 0.0, 0.0]);
		var T = SglMat4.translation([0.0, 10, 12]);
		var Vc_0 = SglMat4.mul(T, Rx);
		var V_0 = SglMat4.mul(F_0, Vc_0);
		this.position = SglMat4.col(V_0,3);
		var invV = SglMat4.inverse(V_0);
		stack.multiply(invV);
	};
};//line 90}

NVMCClient.cameras = [];
NVMCClient.cameras[0] = new ChaseCamera();
NVMCClient.cameras[1] = new PhotographerCamera();
NVMCClient.n_cameras = 2;
NVMCClient.currentCamera = 0;

NVMCClient.nextCamera = function () {
	if (this.n_cameras - 1 > this.currentCamera)
		this.currentCamera++;
};
NVMCClient.prevCamera = function () {
	if (0 < this.currentCamera)
		this.currentCamera--;
};

NVMCClient.drawCountdown = function (gl) {
	var pos = this.myPos();

	var width = this.ui.width;
	var height = this.ui.height

	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	gl.clearColor(0.5, 0.1, 0.4, 0.8);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

NVMCClient.drawScene = function (gl) {
	var game = this.game;
	var width = this.ui.width;
	var height = this.ui.height
	var ratio = width / height;

	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	if (this.totalTime > 240 && this.totalTime <= 2940) {
		var t = (this.totalTime - 240) / 2700;
		gl.clearColor(1 - 0.3*t, 0.9 + 0.1*t, 0.4 + 0.6*t, 1.0);
	}
	else if (this.totalTime > 2040) {
		var t = (this.totalTime - 2040) / 2700;
		gl.clearColor(0.7 - 0.7*t, 1 - t, 1 - 0.5*t, 1.0);
	}
	else {
		gl.clearColor(0, 0, 0.5, 1.0);
	}
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(this.uniformShader);

	var stack = this.stack;
	stack.loadIdentity();

	// Setup projection matrix
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, SglMat4.perspective(3.14 / 4, ratio, 1, 200));

	var pos = this.myPos();
	this.cameras[this.currentCamera].setView(this.stack, this.myFrame());

	var tra = SglMat4.translation([20, 0, 0]);
	stack.multiply(tra);

	tra = SglMat4.translation([-20, 0, 0]);
	stack.multiply(tra);

	stack.push();
	var M_9 = this.myFrame();
	stack.multiply(M_9);
	this.drawBear(gl);
	stack.pop();

	var trees = this.game.race.trees;
	for (var t in trees) {
		var tree = trees[t];
		stack.push();
		var M_8 = SglMat4.translation(tree.position);
		stack.multiply(M_8);
		this.drawTree(gl);
		stack.pop();
		var dis = findDistance(this.myPos(), tree.position);
		if (dis < 15) {
			this.hitPoint = this.totalTime;
			game.playerAccelerate = false;
			game.playerSteerLeft = false;
			game.playerSteerRight = false;
			game.playerBrake = true;
		}
		else if (this.totalTime - this.hitPoint > 10) {
			game.playerBrake = false;
		}
	}

	var mountains = this.game.race.mountains;
	for (var t in mountains) {
		stack.push();
		var M_8 = SglMat4.translation(mountains[t].position);
		stack.multiply(M_8);
		var factor = mountains[t].height;
		var M_1_sca = SglMat4.scaling([factor, factor, factor]);
		stack.multiply(M_1_sca);
		this.drawMountain(gl);
		stack.pop();
	}

	var gifts = this.game.race.gifts;
	var y_bounce = this.totalTime % 120;
	if (y_bounce < 60) {
		y_bounce = y_bounce / 60;
	} else {
		y_bounce = (120 - y_bounce) / 60;
	}
	for (var t in gifts) {
		var gift = gifts[t];
		if (gift.taken == false) {
			var dis = findDistance(this.myPos(), gift.position);
			if (dis < 5) {
				gift._take();
				this.totalPoints++;
				NVMC.logPoint(this.totalPoints);
				break;
			}
			stack.push();
			var M_8 = SglMat4.translation(gift.position);
			stack.multiply(M_8);
			var M_8 = SglMat4.translation([0, y_bounce, 0]);
			stack.multiply(M_8);
			this.drawGift(gl);
			stack.pop();
		}	
	}

	var penguins = this.game.race.penguins;
	var x_bounce = this.totalTime % 360;
	if (x_bounce < 180) {
		x_bounce = x_bounce / 15;
	} else {
		x_bounce = (360 - x_bounce) / 15;
	}
	for (var t in penguins) {
		var penguin = penguins[t];
		var rad_angle = penguin.angle * (Math.PI / 180);
		if (findDistance(this.myPos(),
										[penguin.position[0] + Math.cos(rad_angle)*(x_bounce - 6),
										 penguin.position[1],
										 penguin.position[2] - Math.sin(rad_angle)*(x_bounce - 6)]) <= 10) {
				this.hitPoint = this.totalTime;
				game.playerAccelerate = false;
				game.playerSteerLeft = false;
				game.playerSteerRight = false;
				game.playerBrake = true;
		}
		else if (this.totalTime - this.hitPoint > 10) {
			game.playerBrake = false;
		}
		stack.push();
		var M_8 = SglMat4.translation(penguin.position);
		stack.multiply(M_8);
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(penguin.angle), [0, 1, 0]);
		stack.multiply(M_6_rot);
		var M_9 = SglMat4.translation([x_bounce - 6, 0, 0]);
		stack.multiply(M_9);
		this.drawPenguin(gl);
		stack.pop();
	}

	if (this.totalPoints == 16) {
		var arrows = this.game.race.arrows;
		for (var t in arrows) {
			var arrow = arrows[t];
			stack.push();
			var M_8 = SglMat4.translation(arrow.position);
			stack.multiply(M_8);
			var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(arrow.angle), [0, 1, 0]);
			stack.multiply(M_6_rot);
			this.drawArrow(gl);
			stack.pop();
		}
	}
	

	var snowflakes = this.game.race.snowflakes;
	for (var t in snowflakes) {
		stack.push();
		var y_bounce = (30 + snowflakes[t].position[1] - (this.totalTime % 300 / 10)) % 30;
		var M_8 = SglMat4.translation([snowflakes[t].position[0],
																	 y_bounce,
																	 snowflakes[t].position[2]]);
		stack.multiply(M_8);
		this.drawSnow(gl);
		stack.pop();
	}

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.track, [0.5, 1, 0.9, 1.0], [0.5, 1, 0.9, 1.0]);
	this.drawObject(gl, this.ground, [0.3, 0.7, 0.2, 1.0], [0.3, 0.7, 0.2, 1.0]);
	var gameTunnels = this.game.race.tunnels;
	for (var i = 0; i < this.tunnels.length; ++i) {
		if (i % 3 != 0) {
			this.drawObject(gl, this.tunnels[i], [0.7, 0.5, 0, 1.0], [0.7, 0.5, 0, 1.0]);
		}
		else {
			this.drawObject(gl, this.tunnels[i], [0.9, 0.6, 0, 1.0], [0.9, 0.6, 0, 1.0]);
		}
		tunnel = gameTunnels[i];
		for (var j = 0; j < tunnel.pointsCount; j++) {
			var index = j*3;
			var xl = tunnel._leftCurb[index];
			var yl = 0;
			var zl = tunnel._leftCurb[index + 2];
			var xr = tunnel._rightCurb[index];
			var yr = 0;
			var zr = tunnel._rightCurb[index + 2];
			var disl = findDistance(this.myPos(), [xl, yl, zl]);
			var disr = findDistance(this.myPos(), [xr, yr, zr]);
			if (disl < 5 || disr < 5) {
				this.hitPoint = this.totalTime;
				game.playerAccelerate = false;
				game.playerSteerLeft = false;
				game.playerSteerRight = false;
				game.playerBrake = true;
			}
			else if (this.totalTime - this.hitPoint > 10) {
				game.playerBrake = false;
			}
		}
	}

	if (this.totalPoints == 16) {
		stack.push();
		var M = SglMat4.scaling([2, 2, 2])
		stack.multiply(M);
		this.drawSanta(gl);
		stack.pop();
		if (findDistance(this.myPos(), [0, 0, 2.7]) < 10) {
			this.win = true;
		}
	}

	gl.useProgram(null);
	gl.disable(gl.DEPTH_TEST);
};
/***********************************************************************/
NVMCClient.initializeCameras = function () {
	this.cameras[1].position = this.game.race.photoPosition;
};

// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {
	var gl = this.ui.gl;

	/*************************************************************/
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	/*************************************************************/

	/*************************************************************/
	this.game.player.color = [1.0, 0.0, 0.0, 1.0];
	/*************************************************************/

	/*************************************************************/
	this.initMotionKeyHandlers();
	/*************************************************************/

	/*************************************************************/
	this.stack = new SglMatrixStack();

	this.initializeObjects(gl);
	this.initializeCameras();
	this.uniformShader = new uniformShader(gl);
	/*************************************************************/
};

NVMCClient.onKeyUp = function (keyCode, event) {
	if (keyCode == "2") {
		this.nextCamera();
		return;
	}
	if (keyCode == "1") {
		this.prevCamera();
		return;
	}

	if (keyCode == "A") {
		this.leftTurn = false;
	}

	if (keyCode == "D") {
		this.rightTurn = false;
	}

	if (this.carMotionKey[keyCode])
		this.carMotionKey[keyCode](false);

	this.cameras[this.currentCamera].keyUp(keyCode);
};
NVMCClient.onKeyDown = function (keyCode, event) {

	if (this.carMotionKey[keyCode])
		this.carMotionKey[keyCode](true);

	this.cameras[this.currentCamera].keyDown(keyCode);

	if (keyCode == "A") {
		this.leftTurn = true;
		this.rightTurn = false;
	}

	if (keyCode == "D") {
		this.rightTurn = true;
		this.leftTurn = false;
	}
};

NVMCClient.onMouseButtonDown = function (button, x, y, event) {
	this.cameras[this.currentCamera].mouseButtonDown(x,y);
};

NVMCClient.onMouseButtonUp = function (button, x, y, event) {
	this.cameras[this.currentCamera].mouseButtonUp();
};

NVMCClient.onMouseMove = function (x, y, event) {
	this.cameras[this.currentCamera].mouseMove(x,y);
};
