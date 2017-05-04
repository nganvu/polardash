function Sphere_latlong (resolution_xy, resolution_z) {

	this.name = "sphere_latlong";

	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array(3*(resolution_xy*(resolution_z-1)+2));
	
	var radius = 1.0;
	var angle_xy;
	var angle_z;

	var step_xy = Math.PI * 2 / resolution_xy;
	var step_z = Math.PI / resolution_z;

	var vertexoffset = 0;

	// top of the cone
	this.vertices[0] = 0.0;
	this.vertices[1] = 1.0;
	this.vertices[2] = 0.0;
	vertexoffset += 3;

	// elevation angle; exclude top and bottom of the cone
	for (var j = 1; j < resolution_z; j++) {
		angle_z = (Math.PI / 2) - (step_z * j);

		elevation = radius * Math.sin(angle_z);
		radius_xy = radius * Math.cos(angle_z);
		// azimuth angle
		for (var i = 0; i < resolution_xy; i++) {

			angle_xy = step_xy * i;
			this.vertices[vertexoffset] = radius_xy * Math.cos(angle_xy);
			this.vertices[vertexoffset+1] = elevation;
			this.vertices[vertexoffset+2] = radius_xy * Math.sin(angle_xy);
			vertexoffset += 3;
		}
	}
	
	// bottom of the cone
	this.vertices[vertexoffset]   =  0.0;
	this.vertices[vertexoffset+1] = -1.0;
	this.vertices[vertexoffset+2] =  0.0;
	
	// triangles defition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array(3*(2*resolution_xy)*(resolution_z-1));
	
	var triangleoffset = 0;

	// top layer of the sphere
	for (var i = 0; i < resolution_xy; i++) {
		this.triangleIndices[triangleoffset] = 0;
		this.triangleIndices[triangleoffset+1] = 1 + (i % resolution_xy);
		this.triangleIndices[triangleoffset+2] = 1 + ((i+1) % resolution_xy);
		triangleoffset += 3;
	}

	// middle layers of the sphere
	for (var j = 1; j < (resolution_z-1); j++) {
		var layer = (j-1) * resolution_xy + 1;
		var next_layer = layer + resolution_xy;
		for (var i = 0; i < resolution_xy; i++) {
			this.triangleIndices[triangleoffset]   = next_layer + (i % resolution_xy);
			this.triangleIndices[triangleoffset+1] = layer      + (i % resolution_xy);
			this.triangleIndices[triangleoffset+2] = layer      + ((i+1) % resolution_xy);
			this.triangleIndices[triangleoffset+3] = next_layer + (i % resolution_xy);
			this.triangleIndices[triangleoffset+4] = next_layer + ((i+1) % resolution_xy);
			this.triangleIndices[triangleoffset+5] = layer      + ((i+1) % resolution_xy);
			triangleoffset += 6;
		}
	}
	
	// bottom layer of the sphere
	var bottom = resolution_xy*(resolution_z-1)+1;
	var layer = bottom - resolution_xy;
	for (var i = 0; i < resolution_xy; i++) {
		this.triangleIndices[triangleoffset] = bottom;
		this.triangleIndices[triangleoffset+1] = layer + (i % resolution_xy);
		this.triangleIndices[triangleoffset+2] = layer + ((i+1) % resolution_xy);
		triangleoffset += 3;
	}
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}
