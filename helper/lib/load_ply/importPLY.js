var importPly = (function(){
	function emptyFunction() {
	}

	function propertiesTypes() {
		var r = [ ];
		var m = { };
		var a = null;
		for (var i=0; i<arguments.length; ++i) {
			a = arguments[i];
			if (!a) return r;
			m[a.canonicType] = 1;
		}
		for (var t in m) {
			r.push(t);
		}
		return r;
	}

	function PlyHandler(buffer) {
		this._buffer           = buffer;

		this._modelDescriptor  = null;

		this._verticesCount    = 0;
		this._vertexAttributes = null;
		this._vertexStride     = 0;
		this._vertexBuffer     = null;
		this._handleVertex     = emptyFunction;

		this._facesCount       = 0;
		this._indexBuffer      = null;
		this._handleFace       = emptyFunction;

		this._view             = null;
	}

	PlyHandler.prototype = {
		get modelDescriptor() {
			return this._modelDescriptor;
		},

		onBegin : function () {
		},

		onHeader : function (header) {
			var tabStr = "\t";

			var elem   = null;
			var props  = null;
			var ptypes = null;

			var verticesCount    = 0;
			var vertexLines      = null;
			var vertexAttributes = { };
			var vertexStride     = 0;

			elem  = header.elementMap["vertex"];
			if (elem && elem.count > 0) {
				verticesCount = elem.count;
				props = elem.propertyMap;

				vertexLines = [ ];

				vertexLines.push("function (header, elementInfo, index, element) {");
				vertexLines.push(tabStr + "var littleEndian = SpiderGL.Type.LITTLE_ENDIAN;");
				vertexLines.push(tabStr + "var sf32         = SpiderGL.Type.SIZEOF_FLOAT32;");
				vertexLines.push(tabStr + "var sui8         = SpiderGL.Type.SIZEOF_UINT8;");
				vertexLines.push(tabStr + "var offset       = index * this._vertexStride;");
				vertexLines.push(tabStr + "var view         = this._view;");
				vertexLines.push("");

				ptypes = propertiesTypes(props["x"], props["y"], props["z"]);
				if (ptypes.length == 1) {
					switch (ptypes[0]) {
						case "float32":
							vertexLines.push(tabStr + "view.setFloat32(offset, element.x, littleEndian); offset += sf32;");
							vertexLines.push(tabStr + "view.setFloat32(offset, element.y, littleEndian); offset += sf32;");
							vertexLines.push(tabStr + "view.setFloat32(offset, element.z, littleEndian); offset += sf32;");
							vertexLines.push("");
							vertexAttributes["position"] = {
								size   : 3,
								type   : SpiderGL.Type.FLOAT32,
								offset : vertexStride
							};
							vertexStride += 3 * SpiderGL.Type.SIZEOF_FLOAT32;
						break;
						default: break;
					}
				}

				ptypes = propertiesTypes(props["nx"], props["ny"], props["nz"]);
				if (ptypes.length == 1) {
					switch (ptypes[0]) {
						case "float32":
							vertexLines.push(tabStr + "view.setFloat32(offset, element.nx, littleEndian); offset += sf32;");
							vertexLines.push(tabStr + "view.setFloat32(offset, element.ny, littleEndian); offset += sf32;");
							vertexLines.push(tabStr + "view.setFloat32(offset, element.nz, littleEndian); offset += sf32;");
							vertexLines.push("");
							vertexAttributes["normal"] = {
								size   : 3,
								type   : SpiderGL.Type.FLOAT32,
								offset : vertexStride
							};
							vertexStride += 3 * SpiderGL.Type.SIZEOF_FLOAT32;
						break;
						default: break;
					}
				}

				ptypes = propertiesTypes(props["red"], props["green"], props["blue"]);
				if (ptypes.length == 1) {
					switch (ptypes[0]) {
						case "uint8":
							vertexLines.push(tabStr + "view.setUint8(offset, element.red  ); offset += sui8;");
							vertexLines.push(tabStr + "view.setUint8(offset, element.green); offset += sui8;");
							vertexLines.push(tabStr + "view.setUint8(offset, element.blue ); offset += sui8;");
							vertexLines.push(tabStr + "view.setUint8(offset, 255          ); offset += sui8;");
							vertexLines.push("");
							vertexAttributes["color"] = {
								size   : 4,
								type   : SpiderGL.Type.UINT8,
								offset : vertexStride,
								normalized : true
							};
							vertexStride += 4 * SpiderGL.Type.SIZEOF_UINT8;
						break;
						case "float32":
							vertexLines.push(tabStr + "view.setFloat32(offset, element.red,   littleEndian); offset += sf32;");
							vertexLines.push(tabStr + "view.setFloat32(offset, element.green, littleEndian); offset += sf32;");
							vertexLines.push(tabStr + "view.setFloat32(offset, element.blue,  littleEndian); offset += sf32;");
							vertexLines.push(tabStr + "view.setFloat32(offset, 1.0,           littleEndian); offset += sf32;");
							vertexLines.push("");
							vertexAttributes["color"] = {
								size   : 4,
								type   : SpiderGL.Type.FLOAT32,
								offset : vertexStride
							};
							vertexStride += 4 * SpiderGL.Type.SIZEOF_FLOAT32;
						break;
						default: break;
					}
				}

				ptypes = propertiesTypes(props["texture_u"], props["texture_v"]);
				if (ptypes.length == 1) {
					switch (ptypes[0]) {
						case "float32":
							vertexLines.push(tabStr + "view.setFloat32(offset, element.texture_u, littleEndian); offset += sf32;");
							vertexLines.push(tabStr + "view.setFloat32(offset, element.texture_v, littleEndian); offset += sf32;");
							vertexLines.push("");
							vertexAttributes["texcoord"] = {
								size   : 2,
								type   : SpiderGL.Type.FLOAT32,
								offset : vertexStride
							};
							vertexStride += 2 * SpiderGL.Type.SIZEOF_FLOAT32;
						break;
						default: break;
					}
				}

				vertexLines.push("}");
			}

			var facesCount = 0;
			var faceLines  = null;

			elem  = header.elementMap["face"];
			if (elem && elem.count > 0) {
				facesCount = elem.count;
				props = elem.propertyMap;

				faceLines = [ ];

				faceLines.push("function (header, elementInfo, index, element) {");
				faceLines.push(tabStr + "var littleEndian = SpiderGL.Type.LITTLE_ENDIAN;");
				faceLines.push(tabStr + "var sui32        = SpiderGL.Type.SIZEOF_UINT32;");
				faceLines.push(tabStr + "var offset       = index * 3 * sui32;");
				faceLines.push(tabStr + "var view         = this._view;");
				faceLines.push("");

				if (props["vertex_indices"]) {
					faceLines.push(tabStr + "view.setUint32(offset, element.vertex_indices[0], littleEndian); offset += sui32;");
					faceLines.push(tabStr + "view.setUint32(offset, element.vertex_indices[1], littleEndian); offset += sui32;");
					faceLines.push(tabStr + "view.setUint32(offset, element.vertex_indices[2], littleEndian); offset += sui32;");
				}
				else {
					facesCount = 0;
				}

				faceLines.push("}");
			}

			this._mesh = null;

			this._verticesCount    = verticesCount;
			this._vertexAttributes = vertexAttributes;
			this._vertexStride     = vertexStride;
			this._vertexBuffer     = null;
			this._handleVertex     = emptyFunction;

			if (vertexStride > 0) {
				var vertexFuncStr = vertexLines.join("\n");
				this._handleVertex = eval("(" + vertexFuncStr + ")");
			}

			this._facesCount   = facesCount;
			this._indexBuffer  = null;
			this._handleFace   = emptyFunction;

			if (facesCount > 0) {
				var faceFuncStr = faceLines.join("\n");
				this._handleFace = eval("(" + faceFuncStr + ")");
			}
		},

		onBeginContent : function (header) {
		},

		onBeginElements : function (header, elementInfo) {
			switch (elementInfo.name) {
				case "vertex":
					this._vertexBuffer  = new ArrayBuffer(this._verticesCount * this._vertexStride);
					this._view          = new DataView(this._vertexBuffer);
					this._handleElement = this._handleVertex;
				break;
				case "face":
					this._indexBuffer   = new ArrayBuffer(this._facesCount * 3 * SpiderGL.Type.SIZEOF_UINT32);
					this._view          = new DataView(this._indexBuffer);
					this._handleElement = this._handleFace;
				break;
				default:
					this._view          = null;
					this._handleElement = emptyFunction;
				break;
			}
		},

		onElement : function (header, elementInfo, index, element) {
			this._handleElement(header, elementInfo, index, element);
		},

		onEndElements : function (header, elementInfo) {
			this._view          = null;
			this._handleElement = emptyFunction;
		},

		onEndContent : function () {
		},

		onEnd : function () {
			if ((this._verticesCount <= 0) && (this._facesCount <= 0)) return;

			var gl   = this._gl;
			var modelDescriptor = {
				version : "0.0.1.0 EXP",
				meta : {
				},
				data : {
					vertexBuffers : {
					},
					indexBuffers : {
					}
				},
				access : {
					vertexStreams : {
					},
					primitiveStreams : {
					}
				},
				semantic : {
					bindings : {
					},
					chunks : {
					}
				},
				logic : {
					parts : {
					}
				},
				control : {
				},
				extra : {
				}
			};

			var modelVertexBuffers    = modelDescriptor.data.vertexBuffers;
			var modelIndexBuffers     = modelDescriptor.data.indexBuffers;
			var modelVertexStreams    = modelDescriptor.access.vertexStreams;
			var modelPrimitiveStreams = modelDescriptor.access.primitiveStreams;
			var modelBindings         = modelDescriptor.semantic.bindings;
			var modelChunks           = modelDescriptor.semantic.chunks;
			var modelParts            = modelDescriptor.logic.parts;

			var maxVerticesCount = (1 << 16) - 1;

			var baseVertexBufferName = "mainVertexBuffer";
			var baseIndexBufferName  = "mainIndexBuffer";
			var baseBindingName      = "mainBinding";
			var baseChunkName        = "mainChunk";
			var basePointStreamName  = "vertices";
			var baseTriStreamName    = "triangles";
			var basePartName         = "mainPart";

			if (this._facesCount > 0) {
				var littleEndian = SpiderGL.Type.LITTLE_ENDIAN;
				var indexStride  = SpiderGL.Type.SIZEOF_UINT32;
				var wholeSize    = Float64Array.BYTES_PER_ELEMENT;

				var stride       = this._vertexStride;
				var partCount    = stride % wholeSize;
				var wholeCount   = (stride - partCount) / wholeSize;

				var vertexBufferView = new Uint8Array(this._vertexBuffer);
				var indexBufferView  = new Uint32Array(this._indexBuffer);

				var chunksCount        = 0;
				var chunkVertexBuffers = [ ];
				var chunkVerticesCount = [ ];
				var chunkIndexBuffers  = [ ];
				var chunkIndicesCount  = [ ];

				var facesLeft        = this._facesCount;
				var currFaceIndex    = 0;

				var indicesBuffer = new Uint32Array(this._facesCount * 3);

				while (facesLeft > 0) {
					var verticesMap   = new Uint32Array(this._verticesCount);
					var verticesNew   = new Uint32Array(maxVerticesCount);
					var verticesCount = 0;
					var indicesCount  = 0;
					var facesCount    = 0;

					while ((verticesCount <= (maxVerticesCount - 3)) && (facesLeft > 0)) {
						for (var k=0; k<3; ++k, ++currFaceIndex) {
							var v = indexBufferView[currFaceIndex];
							var r = verticesMap[v];
							if (!r) {
								verticesNew[verticesCount++] = v;
								verticesMap[v] = verticesCount;
							}
							indicesBuffer[indicesCount++] = v;
						}
						facesLeft--;
						facesCount++;
					}

					if (facesCount <= 0) continue;

					var chunkVertexBuffer     = new ArrayBuffer(verticesCount * stride);
					var chunkVertexBufferView = new Uint8Array(chunkVertexBuffer);
					var chunkIndexBuffer      = new Uint16Array(indicesCount);

					for (var i=0; i<indicesCount; ++i) {
						chunkIndexBuffer[i] = verticesMap[indicesBuffer[i]] - 1;
					}

					var s = 0;
					for (var i=0, d=0; i<verticesCount; ++i, d+=stride) {
						s = verticesNew[i] * stride;
						chunkVertexBufferView.set(vertexBufferView.subarray(s, s + stride), d);
					}

					chunkVertexBuffers.push(chunkVertexBuffer);
					chunkVerticesCount.push(verticesCount);
					chunkIndexBuffers.push(chunkIndexBuffer);
					chunkIndicesCount.push(indicesCount);
					chunksCount++;
				}

				var partChunks = new Array(chunksCount);

				for (var i=0; i<chunksCount; ++i) {
					var vertexBufferName = baseVertexBufferName + i;
					var indexBufferName  = baseIndexBufferName  + i;
					var bindingName      = baseBindingName      + i;
					var chunkName        = baseChunkName        + i;

					modelVertexBuffers[vertexBufferName] = {
						typedArray : chunkVertexBuffers[i]
					};

					var binding = {
						vertexStreams : {
						},
						primitiveStreams : {
						}
					};
					modelBindings[bindingName] = binding;

					for (var a in this._vertexAttributes) {
						var attr = this._vertexAttributes[a];
						var vertexStreamName = a + i;
						modelVertexStreams[vertexStreamName] = {
							buffer : vertexBufferName,
							size   : attr.size,
							type   : attr.type,
							stride : this._vertexStride,
							offset : attr.offset,
							normalized : !!attr.normalized
						};
						binding.vertexStreams[a.toUpperCase()] = [vertexStreamName];
					}

					modelIndexBuffers[indexBufferName] = {
						typedArray : chunkIndexBuffers[i]
					};

					var pointStreamName = basePointStreamName + i;
					modelPrimitiveStreams[pointStreamName] = {
						mode  : SpiderGL.Type.POINTS,
						count : chunkVerticesCount[i]
					};
					binding.primitiveStreams["POINT"] = [pointStreamName];

					var triStreamName = baseTriStreamName + i;
					modelPrimitiveStreams[triStreamName] = {
						buffer : indexBufferName,
						mode   : SpiderGL.Type.TRIANGLES,
						count  : chunkIndicesCount[i],
						type   : SpiderGL.Type.UINT16,
						offset : 0
					};
					binding.primitiveStreams["FILL"] = [triStreamName];

					var chunk = {
						techniques : {
							"common" : {
								binding : bindingName
							}
						}
					};
					modelChunks[chunkName] = chunk;

					partChunks[i] = chunkName;
				}

				modelParts[basePartName] = {
					chunks : partChunks
				};
			}
			else {
				var binding = {
					vertexStreams : {
					},
					primitiveStreams : {
					}
				};
				modelBindings[baseBindingName] = binding;

				if (this._verticesCount > 0) {
					var vertexBufferName = baseVertexBufferName;
					modelVertexBuffers[vertexBufferName] = {
						typedArray : this._vertexBuffer
					};

					for (var a in this._vertexAttributes) {
						var attr = this._vertexAttributes[a];
						modelVertexStreams[a] = {
							buffer : vertexBufferName,
							size   : attr.size,
							type   : attr.type,
							stride : this._vertexStride,
							offset : attr.offset,
							normalized : !!attr.normalized
						};
						binding.vertexStreams[a.toUpperCase()] = [a];
					}

					modelPrimitiveStreams[basePointStreamName] = {
						mode   : SpiderGL.Type.POINTS,
						count  : this._verticesCount
					};
					binding.primitiveStreams["POINT"] = [basePointStreamName];
				}

				if ((this._verticesCount > 0) || (this._facesCount > 0)) {
					modelChunks[baseChunkName] = {
						techniques : {
							"common" : {
								binding : baseBindingName
							}
						}
					};

					modelParts[basePartName] = {
						chunks : [baseChunkName]
					};
				}
			}

			this._modelDescriptor = modelDescriptor;
		}
	};

	/*
	function PlyHandler2(buffer, gl) {
	}

	PlyHandler2.prototype = {
		get modelDescriptor() {
			return { };
		},

		onBegin : function () {
		},

		onHeader : function (header) {
		},

		onBeginContent : function (header) {
		},

		onBeginElements : function (header, elementInfo) {
		},

		onElement : function (header, elementInfo, index, element) {
		},

		onEndElements : function (header, elementInfo) {
		},

		onEndContent : function () {
		},

		onEnd : function () {
		}
	};
	*/

	function mainImportPly(buffer, gl) {
		var handler = new PlyHandler(buffer, gl);
		parsePly(buffer, handler);
		var modelDescriptor = handler.modelDescriptor;
		return modelDescriptor;
	};

	return mainImportPly;
})();
