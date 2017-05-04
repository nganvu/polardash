function Sphere_subd (subdivision) {

	this.name = "sphere_subd";

	var radius = 1.0;

	// vertices and indices definition
	////////////////////////////////////////////////////////////

	var v_array = [
		 0.0,  1.0,  0.0,
		 1.0,  0.0,  0.0,
		 0.0,  0.0,  1.0,
		-1.0,  0.0,  0.0,
		 0.0,  0.0, -1.0,
		 0.0, -1.0, 0.0
	];

	var i_array = [
		0, 1, 2,
		0, 2, 3,
		0, 3, 4,
		0, 4, 1,
		1, 2, 5,
		2, 3, 5,
		3, 4, 5,
		4, 1, 5
	];

	v_offset = 6;

	for (var r = 0; r < subdivision; r++) {
		var i_length = i_array.length;
		for (var i = 0; i < i_length; i += 3) {

			// temp triangle abc
			var a = i_array[i];
			var b = i_array[i+1];
			var c = i_array[i+2];

			ax = v_array[a*3];
			ay = v_array[a*3+1];
			az = v_array[a*3+2];

			bx = v_array[b*3];
			by = v_array[b*3+1];
			bz = v_array[b*3+2];

			cx = v_array[c*3];
			cy = v_array[c*3+1];
			cz = v_array[c*3+2];

			var dist;
			var scale;

			// calculate and rescale d = mid ab
			d = v_offset;
			dx = (ax + bx) / 2;
			dy = (ay + by) / 2;
			dz = (az + bz) / 2;
			dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2))
			scale = radius / dist;
			dx *= scale;
			dy *= scale;
			dz *= scale;

			// calculate and rescale e = mid ac
			e = v_offset + 1;
			ex = (ax + cx) / 2;
			ey = (ay + cy) / 2;
			ez = (az + cz) / 2;
			dist = Math.sqrt(Math.pow(ex, 2) + Math.pow(ey, 2) + Math.pow(ez, 2))
			scale = radius / dist;
			ex *= scale;
			ey *= scale;
			ez *= scale;

			// calculate and rescale f = mid bc
			f = v_offset + 2;
			fx = (bx + cx) / 2;
			fy = (by + cy) / 2;
			fz = (bz + cz) / 2;
			dist = Math.sqrt(Math.pow(fx, 2) + Math.pow(fy, 2) + Math.pow(fz, 2))
			scale = radius / dist;
			fx *= scale;
			fy *= scale;
			fz *= scale;

			// add new vertices
			v_array.push.apply(v_array, [dx, dy, dz, ex, ey, ez, fx, fy, fz]);

			// replace abc with def
			i_array[i] = d;
			i_array[i+1] = e;
			i_array[i+2] = f;

			// add the remaining triangles
			i_array.push.apply(i_array, [a, d, e, b, d, f, c, e, f]);

			v_offset += 3;
		}
	}

	this.vertices = new Float32Array(v_array);
	this.triangleIndices = new Uint16Array(i_array);

	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}
