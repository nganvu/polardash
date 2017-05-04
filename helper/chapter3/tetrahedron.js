function Tetrahedron () {

	this.name = "tetrahedron";
	
	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array([
		 1.0,  1.0,  1.0,
		 1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		-1.0, -1.0,  1.0
	]);

	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array([
		0, 1, 2,
		0, 1, 3,
		0, 2, 3,
		1, 2, 3
	]);
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
	
}