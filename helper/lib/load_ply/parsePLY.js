var parsePly = (function(){
	var canonicTypes = {
		"char"    : "int8",
		"int8"    : "int8",
		"uchar"   : "uint8",
		"uint8"   : "uint8",
		"short"   : "int16",
		"int16"   : "int16",
		"ushort"  : "uint16",
		"uint16"  : "uint16",
		"int"     : "int32",
		"int32"   : "int32",
		"uint"    : "uint32",
		"uint32"  : "uint32",
		"float"   : "float32",
		"float32" : "float32",
		"double"  : "float64",
		"float64" : "float64"
	};

	function trim(s) {
		var r = s;
		var n = r.length;
		var i = 0;
		var blanks = " \n\r\t";
		while ((i < n) && (blanks.indexOf(r.charAt(i)) >= 0)) { i++; }
		r = r.substring(i, r.length);
		i = r.length - 1;
		while ((i > 0) && (blanks.indexOf(r.charAt(i)) >= 0)) { i--; }
		r = r.substring(0, i+1);
		return r;
	}

	function extractHeader(data) {
		if (!data || !data.view || !data.view.buffer) return null;

		var u8 = new Uint8Array(data.view.buffer);
		var endHeaderToken = "end_header";
		var header = "";
		var found  = false;
		var currC  = null;
		var prevC  = null;
		var pos    = data.pos;
		var p      = 0;
		var n      = 0;

		for (pos=0, n=u8.byteLength; pos<n; ++pos) {
			currC = String.fromCharCode(u8[pos]);
			header += currC;
			if (currC === "\n") {
				if (pos >= endHeaderToken.length) {
					p = pos - endHeaderToken.length;
					if (prevC == "\r") p--;
					if (header.substring(p, p + endHeaderToken.length) == endHeaderToken) {
						found = true;
						break;
					}
				}
			}
			prevC = currC;
		}

		data.pos = pos;

		if (!found) {
			return null;
		}

		data.pos++;
		return header;
	}

	function splitHeader(header) {
		var lines  = header.split("\n");
		var trimmed = [ ];
		var tokens  = null;
		var s = null;
		for (var i=0, n=lines.length; i<n; ++i) {
			s = trim(lines[i]);
			if (s) {
				tokens = s.split(" ");
				if (tokens.length > 0) {
					for (var j=0, m=tokens.length; j<m; ++j) {
						tokens[j] = trim(tokens[j]);
					}
					trimmed.push(tokens);
				}
			}
		}
		return trimmed;
	}

	function parseHeader(header) {
		if (!header || header.length <= 0) return null;
		if (header[0][0] != "ply") return null;

		var elem   = null;
		var prop   = null;
		var tokens = null;
		var token  = null;
		var tn     = 0;

		var info = {
			format     : null,
			elements   : [ ],
			elementMap : { },
			comments   : [ ],
			others     : [ ]
		};

		for (var i=1; i<header.length-1; ++i) {
			tokens = header[i];
			tn = tokens.length;
			token  = tokens[0].toLowerCase();
			switch (token) {
				case "format":
					if (tn >= 3) {
						info.format = {
							name    : tokens[1],
							version : tokens[2],
							binary  : (tokens[1].toLowerCase().indexOf("binary") >= 0),
							littleEndian : ((tokens[1].toLowerCase()) == "binary_little_endian")
						};
					}
				break;

				case "comment":
					info.comments.push(tokens.slice(1));
				break;

				case "element":
					if (tn >= 3) {
						elem = {
							name  : tokens[1],
							count : parseInt(tokens[2]),
							properties  : [ ],
							propertyMap : { }
						};
						info.elements.push(elem);
						info.elementMap[elem.name.toLowerCase()] = elem;
					}
				break;

				case "property":
					if (elem && (tn >= 3)) {
						prop = {
							name : tokens[tn-1],
							type : tokens.slice(1, tn - 1)
						};
						elem.properties.push(prop);
						elem.propertyMap[prop.name.toLowerCase()] = prop;
					}
				break;

				default:
					info.others.push(tokens.slice());
				break;
			}
		}

		if (!info.format) {
			return false;
		}

		return info;
	}

	var tabStr = "\t";

	function setupLines(lines, tabs) {
		for (var i=0, n=lines.length; i<n; ++i) {
			lines[i] = tabs + lines[i];
		}
		return lines;
	}

	function generateReadValue(assignExpr, types, index, binary, littleEndian, tabs, level, newIdentifiers) {
		var lines = [ ];
		var type  = types[index];

		if (type.toLowerCase() == "list") {
			var nIde = "n" + level;
			var vIde = "v" + level;
			var iIde = "i" + level;

			newIdentifiers[nIde] = true;
			newIdentifiers[vIde] = true;
			newIdentifiers[iIde] = true;

			level++;
			index++;

			lines = lines.concat(lines, generateReadValue(/*"var " + */ "" + nIde, types, index, binary, littleEndian, "", level, newIdentifiers));
			index++;
	
			lines.push(/*"var " + */ vIde + " = new Array(" + nIde + ");");
			lines.push("for (" + /*"var " + */ iIde +"=0; " + iIde + "<" + nIde + "; ++" + iIde + ") {");
			lines = lines.concat(generateReadValue(vIde + "[" + iIde + "]", types, index, binary, littleEndian, tabStr, level, newIdentifiers));
			//lines.push("");
			lines.push("}");
			lines.push(assignExpr + " = " + vIde + ";");
		}
		else {
			if (binary) {
				switch (type) {
					case "char":
					case "int8":
						lines.push(assignExpr + " = view.getInt8(pos, " + littleEndian + ");");
						lines.push("pos += 1;");
					break;

					case "uchar":
					case "uint8":
						lines.push(assignExpr + " = view.getUint8(pos, " + littleEndian + ");");
						lines.push("pos += 1;");
					break;

					case "short":
					case "int16":
						lines.push(assignExpr + " = view.getInt16(pos, " + littleEndian + ");");
						lines.push("pos += 2;");
					break;

					case "ushort":
					case "uint16":
						lines.push(assignExpr + " = view.getUint16(pos, " + littleEndian + ");");
						lines.push("pos += 2;");
					break;

					case "int":
					case "int32":
						lines.push(assignExpr + " = view.getInt32(pos, " + littleEndian + ");");
						lines.push("pos += 4;");
					break;

					case "uint":
					case "uint32":
						lines.push(assignExpr + " = view.getUint32(pos, " + littleEndian + ");");
						lines.push("pos += 4;");
					break;

					case "float":
					case "float32":
						lines.push(assignExpr + " = view.getFloat32(pos, " + littleEndian + ");");
						lines.push("pos += 4;");
					break;

					case "double":
					case "float64":
						lines.push(assignExpr + " = view.getFloat64(pos, " + littleEndian + ");");
						lines.push("pos += 8;");
					break;

					default:
					break;
				}
			}
			else {
				switch (type) {
					case "char"   :
					case "int8"   :
					case "uchar"  :
					case "uint8"  :
					case "short"  :
					case "int16"  :
					case "ushort" :
					case "uint16" :
					case "int"    :
					case "int32"  :
					case "uint"   :
					case "uint32" :
						lines.push(assignExpr + " = parseInt(view[pos]);");
						lines.push("pos += 1;");
					break;

					case "float"   :
					case "float32" :
					case "double"   :
					case "float64" :
						lines.push(assignExpr + " = parseFloat(view[pos]);");
						lines.push("pos += 1;");
					break;

					default:
					break;
				}
			}
		}

		setupLines(lines, tabs);
		return lines;
	}

	function generateReadProperty(assignExpr, types, binary, littleEndian, tabs, level, newIdentifiers) {
		var lines = generateReadValue(assignExpr, types, 0, binary, littleEndian, "", level, newIdentifiers);
		return lines;
	}

	function generateReadElement(assignExpr, props, binary, littleEndian, tabs, level, newIdentifiers) {
		var p  = null;
		var lines = [ ];
		for (var i=0, n=props.length; i<n; ++i) {
			p = props[i];
			lines = lines.concat(generateReadProperty(assignExpr + "[\"" + p.name + "\"]", p.type, binary, littleEndian, "", level, newIdentifiers));
			lines.push("");
		}
		setupLines(lines, tabs);
		return lines;
	}

	function generateReadElements(elemIndex, elem, binary, littleEndian, tabs, level, newIdentifiers) {
		var lines = [ ];
		var nIde  = "n" + level;
		var iIde  = "i" + level;
		level++;

		newIdentifiers[nIde]      = true;
		newIdentifiers[iIde]      = true;
		newIdentifiers["element"] = true;
		newIdentifiers["elem"]    = true;
		newIdentifiers["args"]    = true;

		lines.push(/*"var " + */ "element = info.elements[" + elemIndex + "];");
		lines.push(/*"var " + */ nIde + " = element.count;");
		lines.push(/*"var " + */ "elem = { };");
		lines.push(/*"var " + */ "args = [ info, element, 0, elem];");

		lines.push("callbacks.onBeginElements.call(handler, info, element);");

		lines.push("for (" + /*"var " + */ iIde +"=0; " + iIde + "<" + nIde + "; ++" + iIde + ") {");
		lines = lines.concat(generateReadElement("elem", elem.properties, binary, littleEndian, tabStr, level, newIdentifiers));
		lines.push(tabStr + "args[2] = " + iIde + ";");
		lines.push(tabStr + "callbacks.onElement.apply(handler, args);");
		lines.push("}");

		lines.push("callbacks.onEndElements.call(handler, info, element);");

		setupLines(lines, tabs);
		return lines;
	}

	function generateReadMesh(elems, binary, littleEndian) {
		var lines = [ ];
		lines.push("function (data, info, callbacks, handler) {");
		lines.push(tabStr + "var view = data.view;");
		lines.push(tabStr + "var pos  = data.pos;");
		lines.push("");

		var newIdentifiers = { };

		var elementLines = [ ];
		for (var i=0, n=elems.length; i<n; ++i) {
			elementLines = elementLines.concat(generateReadElements(i, elems[i], binary, littleEndian, tabStr, 0, newIdentifiers));
			elementLines.push("");
		}

		var ides = [ ];
		for (var ide in newIdentifiers) {
			ides.push(ide);
		}
		ides.sort();
		lines.push(tabStr + "var " + ides.join(", ") + ";");
		lines.push("");

		lines.push(tabStr + "callbacks.onBeginContent.call(handler, info);");
		lines = lines.concat(elementLines);
		lines.push(tabStr + "callbacks.onEndContent.call(handler, info);");

		lines.push(tabStr + "data.pos = pos;");
		lines.push("}");

		setupLines(lines, "");
		var s = "";
		for (var i=0, n=lines.length; i<n; ++i) {
			s += lines[i] + "\n";
		}
		return s;
	}

	function getMeshInfo(data) {
		if (!data) return null;

		var header = extractHeader(data);
		if (!header) return null;

		var tokens = splitHeader(header);
		if (!tokens) return null;

		var info = parseHeader(tokens);
		if (!info) return null;

		return info;
	}

	function mainParsePly(buffer, handler) {
		if (!buffer) return null;

		function emptyFunc() { };

		handler = handler || { };
		var callbacks = {
			onBegin                 : (handler.onBegin         || emptyFunc),
				onHeader            : (handler.onHeader        || emptyFunc),
				onBeginContent      : (handler.onBeginContent  || emptyFunc),
					onBeginElements : (handler.onBeginElements || emptyFunc),
						onElement   : (handler.onElement       || emptyFunc),
					onEndElements   : (handler.onEndElements   || emptyFunc),
				onEndContent        : (handler.onEndContent    || emptyFunc),
			onEnd                   : (handler.onEnd           || emptyFunc)
		};

		var dataView = new DataView(buffer);
		var data = {
			view : dataView,
			pos  : 0
		};

		var info = getMeshInfo(data);
		if (!info) return false;

		if (!info.format.binary) {
			data.view = Array.prototype.map.call(
				new Uint8Array(buffer, data.pos),
				function (x) {
					return String.fromCharCode(x);
				}
			).join("").split(" ");
			data.pos = 0;
		}

		var readMeshStr  = generateReadMesh(info.elements, info.format.binary, info.format.littleEndian);
		var readMeshFunc = eval("(" + readMeshStr + ")");

		for (var e in info.elements) {
			for (var p in info.elements[e].propertyMap) {
				info.elements[e].propertyMap[p].canonicType = canonicTypes[info.elements[e].propertyMap[p].type];
			}
		}

		callbacks.onBegin.call(handler);
			callbacks.onHeader.call(handler, info);
			readMeshFunc(data, info, callbacks, handler);
		callbacks.onEnd.call(handler);

		return true;
	}

	return mainParsePly;
})();
