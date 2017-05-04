// Global NVMC Client
// ID 4.2
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function ObserverCamera() {
	//this.modes=		{wasd=0,trackball=1};
	this.currentMode = 0;
	this.V = SglMat4.identity();
	SglMat4.col$(this.V,3,[ 0.0, 20.0, 100.0, 1]);
	this.position =[];
	// variables for the wasd mode
	this.t_V = [0, 0, 0,0.0];
	this.alpha = 0;
	this.beta = 0;

	// variables for the trackball mode
	this.height = 0;
	this.width = 0;
	this.start_x = 0;
	this.start_y = 0;
	this.currX = 0;
	this.currY = 0;
	this.rad = 5;
	this.orbiting = false,
	this.projectionMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	this.rotMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	this.tbMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

	this.computeVector = function (x, y) {
		// in this implementation the trackball is supposed
		// to be centered 2*rad along -z
		D = 2 * this.rad;

		//find the intersection with the trackball surface
		// 1. find the vector leaving from the point of view and passing through the pixel x,y
		// 1.1 convert x and y in view coordinates
		xf = (x - this.width / 2) / this.width * 2.0;
		yf = (y - this.height / 2) / this.height * 2.0;

		invProjection = SglMat4.inverse(this.projectionMatrix);
		v = SglMat4.mul4(invProjection, [xf, yf, -1, 1]);
		v = SglVec3.muls(v, 1 / v[3]);

		h = Math.sqrt(v[0] * v[0] + v[1] * v[1]);

		// compute the intersection with the sphere
		a = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
		b = 2 * D * v[2];
		c = D * D - this.rad * this.rad;

		discriminant = b * b - 4 * a * c;
		if (discriminant > 0) {
			t = (-b - Math.sqrt(discriminant)) / (2 * a);
			t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
			if (t < 0) t = 100 * this.rad;
			if (t1 < 0) t1 = 100 * this.rad;
			if (t1 < t) t = t1;

			//check if th sphere must be used
			if (t * v[0] * t * v[0] + t * v[1] * t * v[1] < this.rad * this.rad / 2)
				return [t * v[0], t * v[1], t * v[2] + D];
		}

		// compute the intersection with the hyperboloid
		a = 2 * v[2] * h;
		b = 2 * D * h;
		c = -this.rad * this.rad;

		discriminant = b * b - 4 * a * c;
		t = (-b - Math.sqrt(discriminant)) / (2 * a);
		t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
		if (t < 0) t = 0;
		if (t1 < 0) t1 = 0;
		if (t < t1) t = t1;

		return [t * v[0], t * v[1], t * v[2] + D];

	};

	this.updateCamera = function () {
		if (this.currentMode == 1)
			return;

		var dir_world = SglMat4.mul4(this.V, this.t_V);
		var newPosition = [];
		newPosition = SglMat4.col(this.V,3);
		newPosition = SglVec4.add(newPosition, dir_world);

		SglMat4.col$(this.V,3,[0.0,0.0,0.0,1.0]);
		var R_alpha = SglMat4.rotationAngleAxis(sglDegToRad(this.alpha/10), [0, 1, 0]);
		var R_beta = SglMat4.rotationAngleAxis(sglDegToRad(this.beta/10), [1, 0, 0]);
		this.V = SglMat4.mul(SglMat4.mul(R_alpha, this.V), R_beta);
		SglMat4.col$(this.V,3,newPosition);
		this.position = newPosition;
		this.alpha = 0;
		this.beta = 0;
	};

	this.forward 		= function (on) {this.t_V = [0, 0, -on / 1.0,0.0]	;};
	this.backward 	    = function (on) {this.t_V = [0, 0, on / 1.0,0.0]	;};
	this.left 			= function (on) {this.t_V = [-on / 1.0, 0, 0,0.0]	;};
	this.right 			= function (on) {this.t_V = [on / 1.0, 0, 0,0.0]	;};
	this.up 			= function (on) {this.t_V = [ 0.0, on/3.0, 0,0.0]	;};
	this.down 			= function (on) {this.t_V = [0.0, -on/3.0, 0,0.0]	;};

	me = this;
	this.handleKeyObserver = {};
	this.handleKeyObserver["W"] = function (on) {me.forward(on)	;	};
	this.handleKeyObserver["S"] = function (on) {me.backward(on);	};
	this.handleKeyObserver["A"] = function (on) {me.left(on);		};
	this.handleKeyObserver["D"] = function (on) {me.right(on);		};
	this.handleKeyObserver["Q"] = function (on) {me.up(on);			};
	this.handleKeyObserver["E"] = function (on) {me.down(on);		};

	this.handleKeyObserver["M"] = function (on) {
		me.currentMode = 1;
	};
	this.handleKeyObserver["N"] = function (on) {
		me.currentMode = 0;
	};

	this.keyDown = function (keyCode) {
		this.handleKeyObserver[keyCode] && this.handleKeyObserver[keyCode](true);
	};
	this.keyUp = function (keyCode) {
		this.handleKeyObserver[keyCode] && this.handleKeyObserver[keyCode](false);
	};

	this.mouseButtonDown = function (x,y) {


		if (this.currentMode == 0) {
			this.aiming = true;
			this.start_x = x;
			this.start_y = y;
		} else {
			this.currX = x;
			this.currY = y;
			this.orbiting = true;
		}
	};
	this.mouseButtonUp = function (event) {//line 144,Listing pag 137{
		if (this.orbiting) {
			var invTbMatrix = SglMat4.inverse(this.tbMatrix);
			this.V	= SglMat4.mul(invTbMatrix, this.V);
			this.tbMatrix = SglMat4.identity();
			this.rotMatrix = SglMat4.identity();
			this.orbiting = false;
		}else
		this.aiming = false;
	};
	this.mouseMove = function (x,y) {



		if (this.currentMode == 0) {
			if (this.aiming) {
				this.alpha = x - this.start_x;
				this.beta = -(y - this.start_y);
				this.start_x = x;
				this.start_y = y;
				this.updateCamera();
			}
			return;
		}

		if (!this.orbiting) return;

		var newX = x;
		var newY = y;

		var p0_prime = this.computeVector(this.currX, this.currY);
		var p1_prime = this.computeVector(newX, newY);

		var axis = SglVec3.cross(p0_prime, p1_prime);
		var axis_length = SglVec3.length(SglVec3.sub(p0_prime, p1_prime));
		var angle = axis_length / this.rad;
        angle= Math.acos(SglVec3.dot(p0_prime,p1_prime)/(SglVec3.length(p0_prime)*SglVec3.length(p1_prime)));
		if (angle > 0.00001) {
			this.rotMatrix = SglMat4.mul(SglMat4.rotationAngleAxis(angle, SglMat4.mul3(this.V, axis,0.0)), this.rotMatrix);
		}

		var cz = SglVec3.length(SglMat4.col(this.V, 2));
		var dir_world = SglVec3.muls(SglMat4.col(this.V, 2), -2 * this.rad);
		var tbCenter = SglVec3.add(SglMat4.col(this.V,3), dir_world);

		var tMatrixInv = SglMat4.translation(tbCenter);
		var tMatrix = SglMat4.translation(SglVec3.neg(tbCenter));

		this.tbMatrix = SglMat4.mul(tMatrixInv, SglMat4.mul(this.rotMatrix, tMatrix));

		this.currX = newX;
		this.currY = newY;
	}
	this.setView = function (stack) {
		this.updateCamera();
		var invV = SglMat4.inverse(this.V);
		stack.multiply(invV);
		stack.multiply(this.tbMatrix);
	}
};

NVMCClient.cameras[2] = new ObserverCamera();
NVMCClient.n_cameras = 3;

NVMCClient.initializeCameras = function () {
	this.cameras[1].position = this.game.race.photoPosition;
	this.cameras[2].position = this.game.race.observerPosition;
}

NVMCClient.onInitialize = function () {
	var gl = this.ui.gl;
	this.cameras[2].width = this.ui.width;
	this.cameras[2].height = this.ui.height;
    this.currentCamera = 2;

	/*************************************************************/
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	/*************************************************************/

	/*************************************************************/
	this.game.player.color = [1.0, 0.0, 0.0, 1.0];
	/*************************************************************/
	this.initMotionKeyHandlers();
	/*************************************************************/
	this.stack = new SglMatrixStack();

	this.initializeObjects(gl);
	this.initializeCameras();
	this.uniformShader = new uniformShader(gl);
	/*************************************************************/
};

NVMCClient.onKeyDown = function (keyCode, event) {
	if (this.currentCamera != 2)
		(this.carMotionKey[keyCode]) && (this.carMotionKey[keyCode])(true);
	this.cameras[this.currentCamera].keyDown(keyCode);

	if (keyCode == "A") {
		this.leftTurn = true;
	}

	if (keyCode == "D") {
		this.rightTurn = true;
	}
}
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

	if (this.currentCamera != 2)
		(this.carMotionKey[keyCode]) && (this.carMotionKey[keyCode])(false);
	this.cameras[this.currentCamera].keyUp(keyCode);
};

/***********************************************************************/
