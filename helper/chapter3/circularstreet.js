///// STREET DEFINITION
/////
///// A street which follows a circular path.
///// Resolution is the number of faces used to create the street.
///// The size of the street is conventionally assumed to be 2000 meters of diameter.
///// The width of the street (in meters) is given.
function CircularStreet(resolution, width) {

	this.name = "circular street";

	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array(3*2*resolution);
	
	var radius = 1000.0;
	var angle;
	var step = 6.283185307179586476925286766559 / resolution;
	
	// inner circle
	var vertexoffset = 0;
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius-width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = 0.0;
		this.vertices[vertexoffset+2] = (radius-width/2.0) * Math.sin(angle);
		vertexoffset += 3;
	}
	
	// outer circle
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius+width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = 0.0;
		this.vertices[vertexoffset+2] = (radius+width/2.0) * Math.sin(angle);
		vertexoffset += 3;
	}
	
	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array(3*2*resolution);
	
	var triangleoffset = 0;
	for (var i = 0; i < resolution; i++)
	{
		this.triangleIndices[triangleoffset] = i;
		this.triangleIndices[triangleoffset+1] = i + resolution;
		this.triangleIndices[triangleoffset+2] = (i+1) % resolution;
		triangleoffset += 3;
		
		this.triangleIndices[triangleoffset] = (i+1) % resolution;
		this.triangleIndices[triangleoffset+1] = i + resolution;
		this.triangleIndices[triangleoffset+2] = ((i+1) % resolution) + resolution;
		triangleoffset += 3;
	}
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}