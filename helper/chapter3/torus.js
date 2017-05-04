function Torus (torus_resolution, tube_resolution) {

	this.name = "torus";

	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array(3*(torus_resolution*tube_resolution));
	
	var torus_radius = 1;
	var tube_radius = 0.5;
	var torus_angle
	var tube_angle

	var torus_step = 2 * Math.PI / torus_resolution;
	var tube_step = 2 * Math.PI / tube_resolution;

	var vertexoffset = 0;

	// torus
	for (var j = 0; j < torus_resolution; j++) {
		torus_angle = j * torus_step;
		for (var i = 0; i < tube_resolution; i++) {
			tube_angle = i * tube_step;

			this.vertices[vertexoffset]   =
				(torus_radius + tube_radius * Math.cos(tube_angle)) * Math.sin(torus_angle);

			this.vertices[vertexoffset+1] = tube_radius * Math.sin(tube_angle);

			this.vertices[vertexoffset+2] =
				(torus_radius + tube_radius * Math.cos(tube_angle)) * Math.cos(torus_angle);

			vertexoffset += 3;
		}
	}
	
	// triangles defition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array(3*(2*torus_resolution*tube_resolution));
	
	var triangleoffset = 0;

	for (var j = 0; j < torus_resolution; j++) {

		var layer = j * tube_resolution;
		var next_layer = ((j+1) % torus_resolution) * tube_resolution;

		for (var i = 0; i < tube_resolution; i++) {
			this.triangleIndices[triangleoffset]   = next_layer + (i % tube_resolution);
			this.triangleIndices[triangleoffset+1] = layer      + (i % tube_resolution);
			this.triangleIndices[triangleoffset+2] = layer      + ((i+1) % tube_resolution);
			this.triangleIndices[triangleoffset+3] = next_layer + (i % tube_resolution);
			this.triangleIndices[triangleoffset+4] = next_layer + ((i+1) % tube_resolution);
			this.triangleIndices[triangleoffset+5] = layer      + ((i+1) % tube_resolution);

			triangleoffset += 6;
		}
	}
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}
