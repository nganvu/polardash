function Tunnel( t ) {
	this.name = "Tunnel";

	var nv = t.pointsCount;
	 
	this.vertices = new Float32Array(nv * 7 * 3);

	var vertexOffset = 0;


	for(var strip = 0 ; strip < 7; ++strip)
		for (var i=0; i<nv; ++i) {
			var alpha = strip / 6.0*3.14;
			var lambda = (Math.cos (alpha)+1)/2.0;
			var r = SglVec3.sub( t.rightSideAt(i),t.leftSideAt(i));			
			var v = SglVec3.add( SglVec3.muls(t.rightSideAt(i),1-lambda),SglVec3.muls(t.leftSideAt(i),lambda));			
			this.vertices[vertexOffset + 0] = v[0];
			this.vertices[vertexOffset + 1] =  	t.height *Math.sin(alpha);
			this.vertices[vertexOffset + 2] = v[2];
			vertexOffset += 3;
		}

	this.triangleIndices = new Uint16Array(( nv-1)*3 * 12);

	var triangleoffset = 0;
	for(var strip = 0 ; strip < 7; ++strip)
		for (var i=0; i< nv-1; ++i) {
			this.triangleIndices[triangleoffset + 0] = strip*nv + i
			this.triangleIndices[triangleoffset + 1] = strip*nv + (i+1)% nv;
			this.triangleIndices[triangleoffset + 2] = (strip+1)*nv + (i+1)%nv;
			triangleoffset += 3;

			this.triangleIndices[triangleoffset + 0] = strip * nv +  i
			this.triangleIndices[triangleoffset + 1] = (strip+1) * nv+ (i+1)%nv;
			this.triangleIndices[triangleoffset + 2] = (strip+1) * nv+ i;
			triangleoffset += 3;
		}
	
	this.numVertices  = this.vertices.length/3;;
	this.numTriangles = this.triangleIndices.length / 3;
};
