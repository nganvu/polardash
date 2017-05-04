///// CONE DEFINITION
/////
///// Resolution is the number of faces used to tesselate the cone.
///// Cone is defined to be centered at the origin of the coordinate reference system, and lying on the XZ plane.
///// Cone height is assumed to be 2.0. Cone radius is assumed to be 1.0 .
function Cone (resolution) {

	this.name = "cone";

	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array(3*(resolution+2));
	
	// apex of the cone
	this.vertices[0] = 0.0;
	this.vertices[1] = 2.0;
	this.vertices[2] = 0.0;
	
	// base of the cone
	var radius = 1.0;
	var angle;
	var step = 6.283185307179586476925286766559 / resolution;

	var vertexoffset = 3;
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = radius * Math.cos(angle);
		this.vertices[vertexoffset+1] = 0.0;
		this.vertices[vertexoffset+2] = radius * Math.sin(angle);
		vertexoffset += 3;
	}
	
	this.vertices[vertexoffset] = 0.0;
	this.vertices[vertexoffset+1] = 0.0;
	this.vertices[vertexoffset+2] = 0.0;
	
	// triangles defition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array(3*2*resolution);
	
	// lateral surface
	var triangleoffset = 0;
	for (var i = 0; i < resolution; i++) {
	
		this.triangleIndices[triangleoffset] = 0;
		this.triangleIndices[triangleoffset+1] = 1 + (i % resolution);
		this.triangleIndices[triangleoffset+2] = 1 + ((i+1) % resolution);
		triangleoffset += 3;
	}
	
	// bottom part of the cone
	for (var i = 0; i < resolution; i++) {
	
		this.triangleIndices[triangleoffset] = resolution+1;
		this.triangleIndices[triangleoffset+1] = 1 + (i % resolution);
		this.triangleIndices[triangleoffset+2] = 1 + ((i+1) % resolution);
		triangleoffset += 3;
	}
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}
