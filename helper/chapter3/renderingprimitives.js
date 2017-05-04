var shaderProgram  = null;
var uModelViewProjectionLocation = -1;
var uColorLocation = -1;
var aPositionIndex = 0;
var vertexBuffer = null;
var indexBufferTriangles = null;
var indexBufferEdges = null;
var currentAngle = 0;
var incAngle = 0.3;

//// Initialize the buffers
////
function createObjectBuffers(gl, primitive) {
	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, primitive.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	indexBufferTriangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferTriangles);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitive.triangleIndices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	var edges = new Uint16Array(primitive.numTriangles*3*2);
	
	for (var i = 0; i < primitive.numTriangles; i++) {
		edges[i*6+0] = primitive.triangleIndices[i*3+0];
		edges[i*6+1] = primitive.triangleIndices[i*3+1];
		edges[i*6+2] = primitive.triangleIndices[i*3+0];
		edges[i*6+3] = primitive.triangleIndices[i*3+2];
		edges[i*6+4] = primitive.triangleIndices[i*3+1];
		edges[i*6+5] = primitive.triangleIndices[i*3+2];
	}
	
	indexBufferEdges = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferEdges);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

///// Initialize the shaders
/////
function initShaders(gl) {

  var vertexShaderSource = "\
  	uniform   mat4 u_modelviewprojection;\n\
	attribute vec3 a_position;\n\
	void main(void)\n\
	{\n\
		gl_Position = u_modelviewprojection * vec4(a_position, 1.0);\n\
	}\n\
	";
  
  var fragmentShaderSource = "\
	precision highp float;\n\
	uniform vec3 u_color;\n\
	void main(void)\n\
	{\n\
		gl_FragColor = vec4(u_color, 1.0);\n\
	}\n\
	";
  
  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  
  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "a_position");
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
	var str = "";
	str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
	str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
	alert(str);
  }

  uColorLocation = gl.getUniformLocation(shaderProgram, "u_color");
  uModelViewProjectionLocation = gl.getUniformLocation(shaderProgram, "u_modelviewprojection");
}

function initialize(gl, primitive) {
	createObjectBuffers(gl, primitive);
	initShaders(gl);
}

///// Draw the given primitives with solid wireframe
/////
function drawThePrimitive(gl, primitive) {

	// Make sure the canvas is sized correctly.
	var canvas = document.getElementById('canvas');
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;
		
	gl.viewport(0, 0, width, height);
	
	// Clear the canvas
	gl.clearColor(0.309, 0.505, 0.74, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
	// Setup projection matrix
	var projMat = SglMat4.perspective(0.8, width/height, 0.1, 1000.0);
	
	// Setup model/view matrix
	
	var viewMat;

	if (primitive.name == "cube") {
		viewMat = SglMat4.lookAt([0,2,6], [0,0,0], [0,1,0]);
	}
	else if (primitive.name == "cone") {
		viewMat = SglMat4.lookAt([0,-1,4], [0,1,0], [0,1,1]); 
	}
	else if (primitive.name == "cylinder") {
		viewMat = SglMat4.lookAt([0,-1,4], [0,1,0], [0,1,1]); 
	}	
	else if (primitive.name == "circular street") {
		viewMat = SglMat4.lookAt([1000,2,6], [1000,0,0], [0,1,0]);
		incAngle = 0.05;
	}
	else if (primitive.name == "tetrahedron") {
		viewMat = SglMat4.lookAt([0,2.5,5], [0,0,0], [0,1,0]);
	}
	else if (primitive.name == "sphere_latlong" || primitive.name == "sphere_subd") {
		viewMat = SglMat4.lookAt([0,2,6], [0,0,0], [0,1,0]);
	}
	else if (primitive.name == "torus") {
		viewMat = SglMat4.lookAt([0,3,3], [0,0,0], [0,1,0]);
	}
	
	var modelMat = SglMat4.rotationAngleAxis(sglDegToRad(-currentAngle), [0,1,0]);
	
    // Construct the model-view * projection matrix and pass it to the vertex shader
 	var modelviewprojMat = SglMat4.mul(projMat, SglMat4.mul(viewMat, modelMat));
	
	gl.enable(gl.DEPTH_TEST);
		
	// Draw the primitive
	gl.useProgram(shaderProgram);
	
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, modelviewprojMat);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.enableVertexAttribArray(aPositionIndex);
	gl.vertexAttribPointer(aPositionIndex, 3, gl.FLOAT, false, 0, 0);
	
	gl.enable(gl.POLYGON_OFFSET_FILL);
	
	gl.polygonOffset(1.0, 1.0);
		
	gl.uniform3f(uColorLocation, 0.82, 0.82, 0.82);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferTriangles);
    gl.drawElements(gl.TRIANGLES, primitive.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
	
	gl.disable(gl.POLYGON_OFFSET_FILL);
	
	gl.uniform3f(uColorLocation, 0.0, 0.0, 0.0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferEdges);	
	gl.drawElements(gl.LINES, primitive.numTriangles*3*2, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	gl.disableVertexAttribArray(aPositionIndex);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.useProgram(null);
 
 	gl.disable(gl.DEPTH_TEST);
 
    currentAngle += incAngle;
    if (currentAngle > 360)
         currentAngle -= 360;
}
