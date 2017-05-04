// Global NVMC Client
// ID 4.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.myPos = function () {
	return this.game.state.players.me.dynamicState.position;
}
NVMCClient.myOri = function () {
	return this.game.state.players.me.dynamicState.orientation;
}

NVMCClient.myFrame = function () {
	return this.game.state.players.me.dynamicState.frame;
}

NVMCClient.leftTurn = false;
NVMCClient.rightTurn = false;
NVMCClient.totalTime = 0;
NVMCClient.totalPoints = 0;
NVMCClient.win = false;

// NVMC Client Internals
/***********************************************************************/
NVMCClient.createObjectBuffers = function (gl, obj) {
	obj.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	obj.indexBufferTriangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	// create edges
	var edges = new Uint16Array(obj.numTriangles * 3 * 2);
	for (var i = 0; i < obj.numTriangles; ++i) {
		edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
		edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
		edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
		edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
		edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
		edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
	}

	obj.indexBufferEdges = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

NVMCClient.drawObject = function (gl, obj, fillColor, lineColor) {
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.enableVertexAttribArray(this.uniformShader.aPositionIndex);
	gl.vertexAttribPointer(this.uniformShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

	gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(1.0, 1.0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.uniform4fv(this.uniformShader.uColorLocation, fillColor);
	gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

	gl.disable(gl.POLYGON_OFFSET_FILL);

	gl.uniform4fv(this.uniformShader.uColorLocation, lineColor);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
	gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	gl.disableVertexAttribArray(this.uniformShader.aPositionIndex);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

NVMCClient.createObjects = function () {
	this.cube = new Cube(10);
	this.cylinder = new Cylinder(10);
	this.cone = new Cone(10);
	this.torus = new Torus(10, 10);
	this.sphere = new Sphere_subd(3);

	this.track = new Track(this.game.race.track);
	var bbox = this.game.race.bbox;
	var quad = [bbox[0], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[5],
		bbox[0], bbox[1] - 0.01, bbox[5]
	];

	this.ground = new Quadrilateral(quad);

	var gameBuildings = this.game.race.buildings;
	this.buildings = new Array(gameBuildings.length);
	for (var i = 0; i < gameBuildings.length; ++i) {
		this.buildings[i] = new Building(gameBuildings[i]);
	}

	var gameTunnels = this.game.race.tunnels;
	this.tunnels = new Array(gameTunnels.length);
	for (var i = 0; i < gameTunnels.length; ++i) {
		this.tunnels[i] = new Tunnel(gameTunnels[i]);
	}
};

NVMCClient.createBuffers = function (gl) {
	this.createObjectBuffers(gl, this.cube);
	this.createObjectBuffers(gl, this.cylinder);
	this.createObjectBuffers(gl, this.cone);
	this.createObjectBuffers(gl, this.sphere);
	this.createObjectBuffers(gl, this.torus);
	this.createObjectBuffers(gl, this.track);
	this.createObjectBuffers(gl, this.ground);

	for (var i = 0; i < this.buildings.length; ++i) {
		this.createObjectBuffers(gl, this.buildings[i]);
	}

	for (var i = 0; i < this.tunnels.length; ++i) {
		this.createObjectBuffers(gl, this.tunnels[i]);
	}
};

NVMCClient.initializeObjects = function (gl) {
	this.createObjects();
	this.createBuffers(gl);
};

NVMCClient.drawHead = function (gl) {
	var stack = this.stack;

	// draw head
	stack.push();
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	// draw right eye
	stack.push();
	var M_2_tra = SglMat4.translation([0.36, 0.12, -0.9]);
	stack.multiply(M_2_tra);
	var M_2_sca = SglMat4.scaling([0.12, 0.12, 0.12]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0, 0, 0, 1.0], [0, 0, 0, 1.0]);
	stack.pop();

	// draw left eye
	stack.push();
	var M_2_tra = SglMat4.translation([-0.36, 0.12, -0.9]);
	stack.multiply(M_2_tra);
	var M_2_sca = SglMat4.scaling([0.12, 0.12, 0.12]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0, 0, 0, 1.0], [0, 0, 0, 1.0]);
	stack.pop();

	// draw right ear
	stack.push();
	var M_2_tra = SglMat4.translation([0.4, 0.75, -0.3]);
	stack.multiply(M_2_tra);
	var M_2_sca = SglMat4.scaling([0.25, 0.25, 0.5]);
	stack.multiply(M_2_sca);
	var M_3_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [0, 0, 1]);
	stack.multiply(M_3_rot);
	var M_3_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [1, 0, 0]);
	stack.multiply(M_3_rot);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.torus, [0.5, 0.2, 0.2, 1.0], [0.5, 0.2, 0.2, 1.0]);
	stack.pop();

	// draw left ear
	stack.push();
	var M_2_tra = SglMat4.translation([-0.4, 0.75, -0.3]);
	stack.multiply(M_2_tra);
	var M_2_sca = SglMat4.scaling([0.25, 0.25, 0.5]);
	stack.multiply(M_2_sca);
	var M_3_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [0, 0, 1]);
	stack.multiply(M_3_rot);
	var M_3_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [1, 0, 0]);
	stack.multiply(M_3_rot);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.torus, [0.5, 0.2, 0.2, 1.0], [0.5, 0.2, 0.2, 1.0]);
	stack.pop();

	// draw nose
	stack.push();
	var M_2_tra = SglMat4.translation([0, 0, -1]);
	stack.multiply(M_2_tra);
	var M_2_sca = SglMat4.scaling([0.1, 0.1, 0.1]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.5, 0.2, 0.2, 1.0], [0.5, 0.2, 0.2, 1.0]);
	stack.pop();
}

NVMCClient.drawArm = function (gl) {
	// draw arm
	var stack = this.stack;
	stack.push();
	var M_2_sca = SglMat4.scaling([0.3, 1, 0.3]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	// draw hand
	var stack = this.stack;
	stack.push();
	var M_2_sca = SglMat4.scaling([0.28, 0.28, 0.28]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.9, 0.9, 1, 1.0], [0.9, 0.9, 1, 1.0]);
	stack.pop();
}

NVMCClient.drawLeg = function (gl) {
	// draw leg
	var stack = this.stack;
	stack.push();
	var M_2_sca = SglMat4.scaling([0.4, 1.2, 0.4]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	// draw boot
	var stack = this.stack;
	stack.push();
	var M_2_sca = SglMat4.scaling([0.28, 0.4, 0.28]);
	stack.multiply(M_2_sca);
	var M_2_tra_0 = SglMat4.translation([0, 0.4, -1.8]);
	stack.multiply(M_2_tra_0);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.torus, [0.2, 0.5, 1, 1.0], [0.2, 0.5, 1, 1.0]);
	stack.pop();

	var stack = this.stack;
	stack.push();
	var M_2_sca = SglMat4.scaling([0.36, 0.6, 0.36]);
	stack.multiply(M_2_sca);
	var M_2_tra_0 = SglMat4.translation([0, 0.4, 0]);
	stack.multiply(M_2_tra_0);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.torus, [0.3, 0.6, 1, 1.0], [0.3, 0.6, 1, 1.0]);
	stack.pop();

	var stack = this.stack;
	stack.push();
	var M_2_sca = SglMat4.scaling([0.03, 0.3, 0.55]);
	stack.multiply(M_2_sca);
	var M_2_tra_0 = SglMat4.translation([0, 0, -0.2]);
	stack.multiply(M_2_tra_0);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [0.2, 0.3, 0.9, 1.0], [0.2, 0.3, 0.9, 1.0]);
	stack.pop();
}

NVMCClient.drawBear = function (gl) {
	var stack = this.stack;

	// draw body
	stack.push();
	var M_2_tra_0 = SglMat4.translation([0, 0.3, 0]);
	stack.multiply(M_2_tra_0);
	var M_2_sca = SglMat4.scaling([1.5, 1.5, 1.5]);
	stack.multiply(M_2_sca);
	var M_2_tra_1 = SglMat4.translation([0, 1.5, 0]);
	stack.multiply(M_2_tra_1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.95, 0.95, 1, 1.0], [0.95, 0.95, 1, 1.0]);
	stack.pop();

	// draw head
	stack.push();
	var M_2_tra = SglMat4.translation([0, 4.8, 0]);
	stack.multiply(M_2_tra);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawHead(gl);
	stack.pop();

	// draw right arm
	stack.push();
	if (this.rightTurn) {
		var M_2_tra = SglMat4.translation([1.8, 4, 0]);
		stack.multiply(M_2_tra);
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(120), [0, 0, 1]);
		stack.multiply(M_6_rot);
	}
	else {
		var M_2_tra = SglMat4.translation([2, 2.6, 0]);
		stack.multiply(M_2_tra);
		var M_3_rot = SglMat4.rotationAngleAxis(sglDegToRad(60), [0, 0, 1]);
		stack.multiply(M_3_rot);
	}
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawArm(gl);
	stack.pop();

	// draw left arm
	stack.push();
	if (this.leftTurn) {
		var M_2_tra = SglMat4.translation([-1.8, 4, 0]);
		stack.multiply(M_2_tra);
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(-120), [0, 0, 1]);
		stack.multiply(M_6_rot);
	}
	else {
		var M_2_tra = SglMat4.translation([-2, 2.6, 0]);
		stack.multiply(M_2_tra);
		var M_3_rot = SglMat4.rotationAngleAxis(sglDegToRad(-60), [0, 0, 1]);
		stack.multiply(M_3_rot);
	}
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawArm(gl);
	stack.pop();

	// draw right leg
	stack.push();
	var M_2_tra = SglMat4.translation([0.6, 0.3, 0]);
	stack.multiply(M_2_tra);
	if (this.leftTurn) {
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(-45), [1, 0, 0]);
		stack.multiply(M_6_rot);
		var M_2_tra = SglMat4.translation([0, -0.5, 1]);
		stack.multiply(M_2_tra);
	}
	if (this.rightTurn) {
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(-15), [0, 1, 0]);
		stack.multiply(M_6_rot);
	}
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawLeg(gl);
	stack.pop();

	// draw left leg
	stack.push();
	var M_2_tra = SglMat4.translation([-0.6, 0.3, 0]);
	stack.multiply(M_2_tra);
	if (this.leftTurn) {
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(15), [0, 1, 0]);
		stack.multiply(M_6_rot);
	}
	if (this.rightTurn) {
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(-45), [1, 0, 0]);
		stack.multiply(M_6_rot);
		var M_2_tra = SglMat4.translation([0, -0.5, 1]);
		stack.multiply(M_2_tra);
	}
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawLeg(gl);
	stack.pop();
}

NVMCClient.drawTree = function (gl) {
	var stack = this.stack;

	stack.push();
	var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
	stack.multiply(M_0_tra1);
	var M_0_sca = SglMat4.scaling([2.5, 2, 2.5]);
	stack.multiply(M_0_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [0.13, 0.62, 0.39, 1.0], [0.13, 0.62, 0.39, 1.0]);
	stack.pop();

	stack.push();
	var M_0_tra1 = SglMat4.translation([0, 2.8, 0]);
	stack.multiply(M_0_tra1);
	var M_0_sca = SglMat4.scaling([1.8, 1.5, 1.8]);
	stack.multiply(M_0_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [0.13, 0.52, 0.34, 1.0], [0.13, 0.52, 0.34, 1.0]);
	stack.pop();

	stack.push();
	var M_0_tra1 = SglMat4.translation([0, 4.5, 0]);
	stack.multiply(M_0_tra1);
	var M_0_sca = SglMat4.scaling([1.2, 1, 1.2]);
	stack.multiply(M_0_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [0.13, 0.42, 0.29, 1.0], [0.13, 0.42, 0.29, 1.0]);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([0.35, 0.4, 0.35]);
	stack.multiply(M_1_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0.70, 0.56, 0.35, 1.0], [0.70, 0.56, 0.35, 1.0]);
	stack.pop();

	stack.push();
	var M_0_tra1 = SglMat4.translation([0, 6.5, 0]);
	stack.multiply(M_0_tra1);
	var M_1_sca = SglMat4.scaling([0.3, 0.3, 0.3]);
	stack.multiply(M_1_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1, 0.8, 0, 1.0], [1, 0.8, 0, 1.0]);
	stack.pop();
};

NVMCClient.drawMountain = function (gl) {
	var stack = this.stack;

	stack.push();
	var M_1_sca = SglMat4.scaling([5, 3, 5]);
	stack.multiply(M_1_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [0.3, 0.2, 0.1, 1.0], [0.3, 0.2, 0.1, 1.0]);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([2.5, 1.5, 2.5]);
	stack.multiply(M_1_sca);
	var M_0_tra1 = SglMat4.translation([0, 2.02, 0]);
	stack.multiply(M_0_tra1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [0.4, 0.3, 0.2, 1.0], [0.4, 0.3, 0.2, 1.0]);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([1.5, 0.9, 1.5]);
	stack.multiply(M_1_sca);
	var M_0_tra1 = SglMat4.translation([0, 4.8, 0]);
	stack.multiply(M_0_tra1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();
}

NVMCClient.drawGift = function (gl) {
	var stack = this.stack;

	// box
	stack.push();
	var M = SglMat4.translation([0, 2, 0]);
	stack.multiply(M);
	var M1 = SglMat4.scaling([0.5, 0.5, 0.5]);
	stack.multiply(M1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [0.9, 0, 0.3, 1.0], [0.9, 0, 0.3, 1.0]);
	stack.pop();

	// stripes
	stack.push();
	var M = SglMat4.translation([0, 2.05, 0]);
	stack.multiply(M);
	var M1 = SglMat4.scaling([0.1, 0.48, 0.55]);
	stack.multiply(M1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [1, 0.7, 0, 1.0], [1, 0.7, 0, 1.0]);
	stack.pop();

	stack.push();
	var M = SglMat4.translation([0, 2.05, 0]);
	stack.multiply(M);
	var M1 = SglMat4.scaling([0.55, 0.48, 0.1]);
	stack.multiply(M1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [1, 0.8, 0, 1.0], [1, 0.8, 0, 1.0]);
	stack.pop();

	// pom poms
	stack.push();
	var M = SglMat4.translation([0.1, 2.65, -0.1]);
	stack.multiply(M);
	var M1 = SglMat4.scaling([0.2, 0.2, 0.2]);
	stack.multiply(M1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1, 0.7, 0, 1.0], [1, 0.7, 0, 1.0]);
	stack.pop();

	stack.push();
	var M = SglMat4.translation([-0.1, 2.65, 0.1]);
	stack.multiply(M);
	var M1 = SglMat4.scaling([0.2, 0.2, 0.2]);
	stack.multiply(M1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1, 0.8, 0, 1.0], [1, 0.8, 0, 1.0]);
	stack.pop();
};

NVMCClient.drawPenguin = function (gl) {
	// body
	var stack = this.stack;
	stack.push();
	var M1 = SglMat4.scaling([1, 1.2, 1]);
	stack.multiply(M1);
	var M = SglMat4.translation([0, 0.5, 0]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0, 0.6, 1, 1.0], [0, 0.6, 1, 1.0]);
	stack.pop();

	var stack = this.stack;
	stack.push();
	var M1 = SglMat4.scaling([0.9, 1, 0.9]);
	stack.multiply(M1);
	var M = SglMat4.translation([0, 0.52, -0.2]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [1, 1, 0.7, 1.0], [1, 1, 0.7, 1.0]);
	stack.pop();

	// head
	stack.push();
	var M = SglMat4.translation([0, 3, 0]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0, 0.5, 1, 1.0], [0, 0.5, 1, 1.0]);
	stack.pop();

	// beak
	stack.push();
	var M1 = SglMat4.scaling([0.5, 0.5, 0.8]);
	stack.multiply(M1);
	var M = SglMat4.translation([0, 5, 0]);
	stack.multiply(M);
	var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(-60), [1, 0, 0]);
	stack.multiply(M_6_rot);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [1, 0.6, 0, 1.0], [1, 0.6, 0, 1.0]);
	stack.pop();

	// arms
	stack.push();
	var M1 = SglMat4.scaling([0.5, 0.2, 0.2]);
	stack.multiply(M1);
	var M = SglMat4.translation([1, 10, 0]);
	stack.multiply(M);
	if (Math.floor(this.totalTime / 30) % 2 == 0) {
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(-60), [0, 0, 1]);
		stack.multiply(M_6_rot);
	}
	else {
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(-90), [0, 0, 1]);
		stack.multiply(M_6_rot);
	}
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0, 0.6, 1, 1.0], [0, 0.6, 1, 1.0]);
	stack.pop();

	stack.push();
	var M1 = SglMat4.scaling([0.5, 0.2, 0.2]);
	stack.multiply(M1);
	var M = SglMat4.translation([-1, 10, 0]);
	stack.multiply(M);
	if (Math.floor(this.totalTime / 30) % 2 == 0) {
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [0, 0, 1]);
		stack.multiply(M_6_rot);
	}
	else {
		var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(60), [0, 0, 1]);
		stack.multiply(M_6_rot);
	}
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0, 0.6, 1, 1.0], [0, 0.6, 1, 1.0]);
	stack.pop();

	// eyes
	stack.push();
	if (Math.floor(this.totalTime / 30) % 2 == 0) {
		var M = SglMat4.translation([0.5, 3.1, -1]);
		stack.multiply(M);
	}
	else {
		var M = SglMat4.translation([0.5, 3, -1]);
		stack.multiply(M);
	}
	var M1 = SglMat4.scaling([0.1, 0.2, 0.1]);
	stack.multiply(M1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	stack.push();
	if (Math.floor(this.totalTime / 30) % 2 == 0) {
		var M = SglMat4.translation([-0.5, 3, -1]);
		stack.multiply(M);
	}
	else {
		var M = SglMat4.translation([-0.5, 3.1, -1]);
		stack.multiply(M);
	}
	var M1 = SglMat4.scaling([0.1, 0.2, 0.1]);
	stack.multiply(M1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	// legs
	stack.push();
	var M1 = SglMat4.scaling([0.15, 0.5, 0.15]);
	stack.multiply(M1);
	var M = SglMat4.translation([-2, 0, 0]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [1, 0.6, 0, 1.0], [1, 0.6, 0, 1.0]);
	stack.pop();

	stack.push();
	var M1 = SglMat4.scaling([0.15, 0.5, 0.15]);
	stack.multiply(M1);
	var M = SglMat4.translation([2, 0, 0]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [1, 0.6, 0, 1.0], [1, 0.6, 0, 1.0]);
	stack.pop();

	stack.push();
	var M1 = SglMat4.scaling([0.2, 0.02, 0.5]);
	stack.multiply(M1);
	var M = SglMat4.translation([-1.8, 0, -0.8]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0.9, 0.5, 0, 1.0], [0.9, 0.5, 0, 1.0]);
	stack.pop();

	stack.push();
	var M1 = SglMat4.scaling([0.2, 0.02, 0.5]);
	stack.multiply(M1);
	var M = SglMat4.translation([1.8, 0, -0.8]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0.9, 0.5, 0, 1.0], [0.9, 0.5, 0, 1.0]);
	stack.pop();
}

NVMCClient.drawArrow = function (gl) {
	var stack = this.stack;

	stack.push();
	var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [0, 0, 1]);
	stack.multiply(M_6_rot);
	var M1 = SglMat4.scaling([0.5, 1.5, 0.5]);
	stack.multiply(M1);
	var M = SglMat4.translation([2, 10, 0]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	if (Math.floor(this.totalTime / 15) % 2 == 0) {
		this.drawObject(gl, this.cylinder, [0.9, 0, 0.3, 1.0], [0.9, 0, 0.3, 1.0]);
	} else {
		this.drawObject(gl, this.cylinder, [1, 0.7, 0, 1.0], [1, 0.7, 0, 1.0]);
	}
	stack.pop();

	stack.push();
	var M_6_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [0, 0, 1]);
	stack.multiply(M_6_rot);
	var M1 = SglMat4.scaling([1, 0.5, 1]);
	stack.multiply(M1);
	var M = SglMat4.translation([1, 36, 0]);
	stack.multiply(M);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	if (Math.floor(this.totalTime / 15) % 2 == 0) {
		this.drawObject(gl, this.cone, [1, 0.7, 0, 1.0], [1, 0.7, 0, 1.0]);
	}
	else {
		this.drawObject(gl, this.cone, [0.9, 0, 0.3, 1.0], [0.9, 0, 0.3, 1.0]);
	}
	stack.pop();
}

NVMCClient.drawSnow = function (gl) {
	var stack = this.stack;

	stack.push();
	var M1 = SglMat4.scaling([0.15, 0.15, 0.15]);
	stack.multiply(M1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();
}

NVMCClient.drawSantaBoot = function (gl) {
	var stack = this.stack;

	// top of the boot
	stack.push();
	var M_5 = SglMat4.translation([0, 0.5, 0]);
	stack.multiply(M_5);
	var M_3_sca = SglMat4.scaling([0.25, 0.25, 0.25]);
	stack.multiply(M_3_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.torus, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	// body of the boot
	stack.push();
	var M_3_sca = SglMat4.scaling([0.25, 0.35, 0.25]);
	stack.multiply(M_3_sca);
	var M_3_tra = SglMat4.translation([0, -0.8, 0]);
	stack.multiply(M_3_tra);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0.2, 0.2, 0.2, 1.0], [0.2, 0.2, 0.2, 1.0]);
	stack.pop();

	// bottom of the boot
	stack.push();
	var M_3_sca = SglMat4.scaling([0.25, 0.15, 0.4]);
	stack.multiply(M_3_sca);
	var M_3_tra = SglMat4.translation([0, -0.94, 1]);
	stack.multiply(M_3_tra);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [0.2, 0.2, 0.2, 1.0], [0.2, 0.2, 0.2, 1.0]);
	stack.pop();

	// tip of the boot
	stack.push();
	var M_3_sca = SglMat4.scaling([0.175, 0.28, 0.2]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([0, -0.48, 4]);
	stack.multiply(M_5);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.torus, [0.2, 0.2, 0.2, 1.0], [0.2, 0.2, 0.2, 1.0]);
	stack.pop();
};

NVMCClient.drawSantaLeg = function (gl) {
	var stack = this.stack;

	// draw boot
	stack.push();
	var M_2_sca = SglMat4.scaling([1.25, 1, 1.25]);
	stack.multiply(M_2_sca);
	this.drawSantaBoot(gl);
	stack.pop();
	
	// draw leg
	stack.push();
	var M_2_tra_0 = SglMat4.translation([0, 0.9, 0]);
	stack.multiply(M_2_tra_0);
	var M_2_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [0.8, 0.2, 0.2, 1.0], [0.8, 0.2, 0.2, 1.0]);
	stack.pop();
}

NVMCClient.drawSantaEye = function (gl) {
	var stack = this.stack;

	stack.push();
	var M_2_sca = SglMat4.scaling([0.08, 0.08, 0.08]);
	stack.multiply(M_2_sca);
	var M_2_sca = SglMat4.translation([0, -2.5, 7]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0, 0, 0, 1.0], [0, 0, 0, 1.0]);
	stack.pop();
}

NVMCClient.drawSantaBeard = function (gl) {
	var stack = this.stack;
	
	stack.push();
	var M_2_sca = SglMat4.scaling([0.3, 0.1, 0.3]);
	stack.multiply(M_2_sca);
	var M_2_sca = SglMat4.translation([0, -4.8, 0.85]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	stack.push();
	var M_2_sca = SglMat4.scaling([0.25, 0.35, 0.25]);
	stack.multiply(M_2_sca);
	var M_2_sca = SglMat4.translation([0, -1.2, 1.3]);
	stack.multiply(M_2_sca);
	var M_10 = SglMat4.rotationAngleAxis(sglDegToRad(135), [1.0, 0.0, 0.0]);
	stack.multiply(M_10);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();
}

NVMCClient.drawSantaHat = function (gl) {
	var stack = this.stack;

	stack.push();
	var M_2_sca = SglMat4.scaling([0.6, 0.65, 0.6]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [0.8, 0.2, 0.2, 1.0], [0.8, 0.2, 0.2, 1.0]);
	stack.pop();

	stack.push();
	var M_2_sca = SglMat4.scaling([0.2, 0.2, 0.2]);
	stack.multiply(M_2_sca);
	var M_2_sca = SglMat4.translation([0, 6, 0]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	stack.push();
	var M_2_sca = SglMat4.scaling([0.5, 0.5, 0.5]);
	stack.multiply(M_2_sca);
	var M_2_sca = SglMat4.translation([0, 0.25, 0]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.torus, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();
}

NVMCClient.drawSantaHead = function (gl) {
	var stack = this.stack;

	// draw head
	stack.push();
	var M_2_sca = SglMat4.scaling([0.6, 0.6, 0.6]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.95, 0.85, 0.85, 1.0], [0.95, 0.85, 0.85, 1.0]);
	stack.pop();

	// draw eyes
	stack.push();
	var M_2_sca = SglMat4.translation([0.25, 0.1, 0]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawSantaEye(gl);
	stack.pop();

	stack.push();
	var M_2_sca = SglMat4.translation([-0.25, 0.1, 0]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawSantaEye(gl);
	stack.pop();

	// draw neck
	stack.push();
	var M_2_sca = SglMat4.scaling([0.25, 0.2, 0.25]);
	stack.multiply(M_2_sca);
	var M_2_sca = SglMat4.translation([0, -4.5, 0]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0.95, 0.85, 0.85, 1.0], [0.95, 0.85, 0.85, 1.0]);
	stack.pop();

	// draw hat
	stack.push();
	var M_2_sca = SglMat4.translation([0, 0.2, 0]);
	stack.multiply(M_2_sca);
	this.drawSantaHat(gl);
	stack.pop();

	// draw beard
	this.drawSantaBeard(gl);
}

NVMCClient.drawSantaArm = function (gl) {
	var stack = this.stack;

	// draw arm
	stack.push();
	var M_2_sca = SglMat4.scaling([0.3, 0.5, 0.3]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0.8, 0.2, 0.2, 1.0], [0.8, 0.2, 0.2, 1.0]);
	stack.pop();

	// draw hand
	stack.push();
	var M_2_sca = SglMat4.scaling([0.25, 0.25, 0.25]);
	stack.multiply(M_2_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.95, 0.85, 0.85, 1.0], [0.95, 0.85, 0.85, 1.0]);
	stack.pop();
}

NVMCClient.drawSantaBody = function (gl) {

	var stack = this.stack;

	// two parts of the body
	stack.push();
	var M_2_tra_0 = SglMat4.translation([0, 1, 0]);
	stack.multiply(M_2_tra_0);
	var M_2_sca = SglMat4.scaling([1.2, 0.4, 0.6]);
	stack.multiply(M_2_sca);
	var M_2_tra_1 = SglMat4.translation([0, 4, 2.5]);
	stack.multiply(M_2_tra_1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [0.8, 0.2, 0.2, 1.0], [0.8, 0.2, 0.2, 1.0]);
	stack.pop();

	stack.push();
	var M_2_tra_0 = SglMat4.translation([0, 1, 0]);
	stack.multiply(M_2_tra_0);
	var M_2_sca = SglMat4.scaling([0.8, 0.5, 0.5]);
	stack.multiply(M_2_sca);
	var M_2_tra_1 = SglMat4.translation([0, 1.5, 3]);
	stack.multiply(M_2_tra_1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [0.8, 0.2, 0.2, 1.0], [0.8, 0.2, 0.2, 1.0]);
	stack.pop();

	// the buttons
	stack.push();
	var M_5 = SglMat4.translation([0, 2.2, 1.45]);
	stack.multiply(M_5);
	this.drawSantaEye(gl);
	stack.pop();

	stack.push();
	var M_5 = SglMat4.translation([0, 1.85, 1.45]);
	stack.multiply(M_5);
	this.drawSantaEye(gl);
	stack.pop();

	// the belt
	stack.push();
	var M_2_tra_0 = SglMat4.translation([0, 1, 0]);
	stack.multiply(M_2_tra_0);
	var M_2_sca = SglMat4.scaling([0.82, 0.1, 0.52]);
	stack.multiply(M_2_sca);
	var M_2_tra_1 = SglMat4.translation([0, 4.2, 2.9]);
	stack.multiply(M_2_tra_1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [0.2, 0.2, 0.2, 1.0], [0.2, 0.2, 0.2, 1.0]);
	stack.pop();

	// the golden thing on the belt
	stack.push();
	var M_2_tra_0 = SglMat4.translation([0, 1, 0]);
	stack.multiply(M_2_tra_0);
	var M_2_sca = SglMat4.scaling([0.2, 0.1, 0.5]);
	stack.multiply(M_2_sca);
	var M_2_tra_1 = SglMat4.translation([0, 4.2, 3.1]);
	stack.multiply(M_2_tra_1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [1, 1, 0, 1.0], [1, 1, 0, 1.0]);
	stack.pop();

	// the white stripe
	stack.push();
	var M_2_tra_0 = SglMat4.translation([0, 1, 0]);
	stack.multiply(M_2_tra_0);
	var M_2_sca = SglMat4.scaling([0.2, 0.6, 0.5]);
	stack.multiply(M_2_sca);
	var M_2_tra_1 = SglMat4.translation([0, 1.6, 3.05]);
	stack.multiply(M_2_tra_1);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();

	// the white triangle
	stack.push();
	var M_2_sca = SglMat4.scaling([1.2, 0.36, 0.1]);
	stack.multiply(M_2_sca);
	var M_2_sca = SglMat4.translation([0, 8.3, 21]);
	stack.multiply(M_2_sca);
	var M_10 = SglMat4.rotationAngleAxis(sglDegToRad(180), [1.0, 0.0, 0.0]);
	stack.multiply(M_10);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [1, 1, 1, 1.0], [1, 1, 1, 1.0]);
	stack.pop();
}

NVMCClient.drawSanta = function (gl) {
	var stack = this.stack;

	// the head
	stack.push();
	var M_5 = SglMat4.translation([0, 3.8, 1.5]);
	stack.multiply(M_5);
	this.drawSantaHead(gl);
	stack.pop();

	// the legs
	stack.push();
	var M_5 = SglMat4.translation([0.5, 0.3, 1.4]);
	stack.multiply(M_5);
	this.drawSantaLeg(gl);
	stack.pop();

	stack.push();
	var M_5 = SglMat4.translation([-0.5, 0.3, 1.4]);
	stack.multiply(M_5);
	this.drawSantaLeg(gl);
	stack.pop();

	// the arms
	stack.push();
	var M_5 = SglMat4.translation([0.9, 1.5, 1.5]);
	stack.multiply(M_5);
	this.drawSantaArm(gl);
	stack.pop();

	stack.push();
	var M_5 = SglMat4.translation([-0.9, 1.5, 1.5]);
	stack.multiply(M_5);
	this.drawSantaArm(gl);
	stack.pop();

	this.drawSantaBody(gl);

};

NVMCClient.drawScene = function (gl) {
	var pos = this.myPos();

	var width = this.ui.width;
	var height = this.ui.height

	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(this.uniformShader);

	// Setup projection matrix
	var ratio = width / height; //line 229, Listing 4.1{
	var bbox = this.game.race.bbox;
	var winW = (bbox[3] - bbox[0]);
	var winH = (bbox[5] - bbox[2]);
	winW = winW * ratio * (winH / winW);
	var P = SglMat4.ortho([-winW / 2, -winH / 2, 0.0], [winW / 2, winH / 2, 21.0]);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, P);

	var stack = this.stack;
	stack.loadIdentity(); //line 238}
	// create the inverse of V //line 239, Listing 4.2{
	var invV = SglMat4.lookAt([0, 20, 0], [0, 0, 0], [1, 0, 0]);
	stack.multiply(invV);
	stack.push();//line 242
	var M_9 = this.myFrame();
	stack.multiply(M_9);
	this.drawBear(gl);
	stack.pop();

	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		stack.multiply(M_8);
		this.drawTree(gl);
		stack.pop();
	}

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.track, [0.5, 1, 0.9, 1.0], [0.5, 1, 0.9, 1.0]);
	this.drawObject(gl, this.ground, [0.3, 0.7, 0.2, 1.0], [0.3, 0.7, 0.2, 1.0]);

	gl.useProgram(null);
	gl.disable(gl.DEPTH_TEST);
};
/***********************************************************************/

NVMCClient.initMotionKeyHandlers = function () {
	var game = this.game;

	var carMotionKey = {};
	carMotionKey["W"] = function (on) {
		// game.playerAccelerate = on;
	};
	carMotionKey["S"] = function (on) {
		// game.playerBrake = on;
	};
	carMotionKey["A"] = function (on) {
		game.playerAccelerate = on;
		game.playerSteerLeft = on;
	};
	carMotionKey["D"] = function (on) {
		game.playerAccelerate = on;
		game.playerSteerRight = on;
	};
	this.carMotionKey = carMotionKey;
};

// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {// line 290, Listing 4.2{
	var gl = this.ui.gl;
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	this.game.player.color = [1.0, 0.0, 0.0, 1.0];
	this.initMotionKeyHandlers();
	this.stack = new SglMatrixStack();
	this.initializeObjects(gl);
	this.uniformShader = new uniformShader(gl);
};

NVMCClient.onTerminate = function () {};

NVMCClient.onConnectionOpen = function () {
	NVMC.log("[Connection Open]");
};

NVMCClient.onConnectionClosed = function () {
	NVMC.log("[Connection Closed]");
};

NVMCClient.onConnectionError = function (errData) {
	NVMC.log("[Connection Error] : " + errData);
};

NVMCClient.onLogIn = function () {
	NVMC.log("[Logged In]");
};

NVMCClient.onLogOut = function () {
	NVMC.log("[Logged Out]");
};

NVMCClient.onNewRace = function (race) {
	NVMC.log("[New Race]");
};

NVMCClient.onPlayerJoin = function (playerID) {
	NVMC.log("[Player Join] : " + playerID);
	this.game.opponents[playerID].color = [0.0, 1.0, 0.0, 1.0];
};

NVMCClient.onPlayerLeave = function (playerID) {
	NVMC.log("[Player Leave] : " + playerID);
};

NVMCClient.onKeyDown = function (keyCode, event) {
	this.carMotionKey[keyCode] && this.carMotionKey[keyCode](true);
};

NVMCClient.onKeyUp = function (keyCode, event) {
	this.carMotionKey[keyCode] && this.carMotionKey[keyCode](false);
};

NVMCClient.onKeyPress = function (keyCode, event) {};

NVMCClient.onMouseButtonDown = function (button, x, y, event) {};

NVMCClient.onMouseButtonUp = function (button, x, y, event) {};

NVMCClient.onMouseMove = function (x, y, event) {};

NVMCClient.onMouseWheel = function (delta, x, y, event) {};

NVMCClient.onClick = function (button, x, y, event) {};

NVMCClient.onDoubleClick = function (button, x, y, event) {};

NVMCClient.onDragStart = function (button, x, y) {};

NVMCClient.onDragEnd = function (button, x, y) {};

NVMCClient.onDrag = function (button, x, y) {};

NVMCClient.onResize = function (width, height, event) {};

NVMCClient.onAnimate = function (dt) {
	this.ui.postDrawEvent();
};

NVMCClient.onDraw = function () {
	var gl = this.ui.gl;
	if (this.totalTime < 180) {
		NVMC.logInstructions(false);
		NVMC.logCountdown(false);
	}
	else if (this.totalTime < 600) {
		this.drawCountdown(gl);
		NVMC.logInstructions(true);
		if (this.totalTime % 60 == 0) {
				NVMC.logCountdown(9 - this.totalTime / 60);
		}
		if (this.totalTime == 599) {
			NVMC.logInstructions(false);
			NVMC.logCountdown(false);
		}
	}
	else if (this.totalTime < 6000) {
		document.getElementById("restart").style.display = "inline-block";
		if (this.win) {
			this.drawCountdown(gl);
			NVMC.logInstructions("win");
		}
		else {
			this.drawScene(gl);
			if (this.totalPoints == 0) {
				NVMC.logPoint(this.totalPoints);
			}
			if (this.totalTime % 30 == 0) {
				NVMC.logTime(180 - ((this.totalTime - 600) / 30));
			}
		}
	}
	else if (!this.win) {
		this.drawCountdown(gl);
		NVMC.logInstructions("lose");
	}
	this.totalTime++;
};
/***********************************************************************/
