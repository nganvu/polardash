var shaderProgram  = null;
var uModelViewProjectionLocation = -1;
var uColorLocation = -1;
var aPositionIndex = 0;

var currentAngle = 0;
var incAngle = 0.3;

var cube     = new Cube();
//var cylinder = new Cylinder(10);
//var cone     = new Cone(10);


var stack    = new SglMatrixStack();

///// Draw the given primitives with solid wireframe
/////
function drawScene(gl) {
	// Make sure the canvas is sized correctly.
	var canvas = document.getElementById('canvas');
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;

	gl.viewport(0, 0, width, height);

	// Clear the canvas
	gl.clearColor(1, 1, 1, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(shaderProgram);

	stack.loadIdentity();
	// Setup projection matrix
	var P = SglMat4.ortho([-2,-2,0.1], [2,2,1000.0]);
	stack.multiply(P);
	// create inverse of V
	var invV = SglMat4.lookAt([0,0,5], [0,0,0], [0,1,0]);
	stack.multiply(invV);

	stack.multiply(tb.matrix)
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, stack.matrix);
	
	 
	send(gl,cube);
	drawAxis();

	gl.useProgram(null);
	gl.disable(gl.DEPTH_TEST);
}
