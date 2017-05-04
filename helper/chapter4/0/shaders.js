uniformShader = function (gl) {//line 1, Listing 4.3{
	var vertexShaderSource = "\
		uniform   mat4 uModelViewMatrix;	\n\
		uniform   mat4 uProjectionMatrix;	\n\
		attribute vec3 aPosition;					\n\
		void main(void)										\n\
		{																	\n\
		gl_Position = uProjectionMatrix * uModelViewMatrix	\n\
			* vec4(aPosition, 1.0);  				\n\
		}";

	var fragmentShaderSource = "\
		precision highp float;					\n\
		uniform vec4 uColor;						\n\
		void main(void)									\n\
		{																\n\
			gl_FragColor = vec4(uColor);	\n\
		}	";

	// create the vertex shader
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSource);
	gl.compileShader(vertexShader);

	// create the fragment shader
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSource);
	gl.compileShader(fragmentShader);

	// Create the shader program
	var aPositionIndex = 0;
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
	gl.linkProgram(shaderProgram);
  
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		var str = "Unable to initialize the shader program.\n\n";
		str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
		str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
		str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
		alert(str);
	}

	shaderProgram.aPositionIndex = aPositionIndex;
	shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
	
	shaderProgram.vertex_shader = vertexShaderSource;
	shaderProgram.fragment_shader = fragmentShaderSource;

	return shaderProgram;
};

