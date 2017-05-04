var axisVertexBuffer = null;
//// Initialize the buffers
////
function initBuffers(gl, primitive) {
	
	primitive.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, primitive.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, primitive.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	primitive.indexBufferTriangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBufferTriangles);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitive.triangleIndices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	// create edges
	var edges = new Uint16Array(primitive.numTriangles*3*2);
	
	for (var i = 0; i < primitive.numTriangles; i++) {
		edges[i*6+0] = primitive.triangleIndices[i*3+0];
		edges[i*6+1] = primitive.triangleIndices[i*3+1];
		edges[i*6+2] = primitive.triangleIndices[i*3+0];
		edges[i*6+3] = primitive.triangleIndices[i*3+2];
		edges[i*6+4] = primitive.triangleIndices[i*3+1];
		edges[i*6+5] = primitive.triangleIndices[i*3+2];
	}
	
	primitive.indexBufferEdges = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBufferEdges);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function initAxisBuffers(){
	
	axisVertices = new Float32Array([
		0.0, 0.0,  0.0, 
		5.0, 0.0,  0.0,
		0.0, 0.0,  0.0,
		0.0, 5.0,  0.0,
		0.0, 0.0, 0.0,
		0.0, 0.0, 5.0
	]);
	
	axisVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axisVertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	
}

function initialize(gl) {
	
	initBuffers(gl, cube);
//	initBuffers(gl, cylinder);
//	initBuffers(gl, cone);
	initAxisBuffers();
}

function drawAxis(){
	
	gl.bindBuffer(gl.ARRAY_BUFFER, axisVertexBuffer);
	gl.enableVertexAttribArray(aPositionIndex);
	gl.vertexAttribPointer(aPositionIndex, 3, gl.FLOAT, false, 0, 0);
	gl.uniform3f(uColorLocation, 1.0, 0.0, 0.0);
	gl.drawArrays(gl.LINES,0,2);
	gl.uniform3f(uColorLocation, 0.0, 1.0, 0.0);
	gl.drawArrays(gl.LINES,2,2);
	gl.uniform3f(uColorLocation, 0.0, 0.0, 1.0);
	gl.drawArrays(gl.LINES,4,2);
	
}
function send(gl,primitive){
	// Draw the primitive
	gl.bindBuffer(gl.ARRAY_BUFFER, primitive.vertexBuffer);
	gl.enableVertexAttribArray(aPositionIndex);
	gl.vertexAttribPointer(aPositionIndex, 3, gl.FLOAT, false, 0, 0);
	
	gl.enable(gl.POLYGON_OFFSET_FILL);
	
	gl.polygonOffset(1.0, 1.0);
		
	gl.uniform3f(uColorLocation, 0.82, 0.82, 0.82);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBufferTriangles);
        gl.drawElements(gl.TRIANGLES, primitive.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
	
	gl.disable(gl.POLYGON_OFFSET_FILL);
	
	gl.uniform3f(uColorLocation, 0.0, 0.0, 0.0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBufferEdges);	
	gl.drawElements(gl.LINES, primitive.numTriangles*3*2, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	gl.disableVertexAttribArray(aPositionIndex);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

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

function init(gl) {
	initShaders(gl);
}

