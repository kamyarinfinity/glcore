function glinit() {
	var gl = glcore.gl;

	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.viewport(0, 0, canvas.width, canvas.height);
	// if available, we can load indexed meshes with more than 65535 indices
	glcore.uint_support = gl.getExtension('OES_element_index_uint');
	// cubemaps are not supported with depth textures extensions
	// so this isn't needed anymore
	glcore.depth_texture_support = gl.getExtension('WEBGL_depth_texture') ||
									gl.getExtension('WEBKIT_WEBGL_depth_texture') ||
									gl.getExtension('MOZ_WEBGL_depth_texture');

	var packed_vertex_layout = {
		name: "pt",
		start: 0,
		count: 3
	};
	var packed_normal_layout = {
		name: "n",
		start: 3,
		count: 3
	};
	var vertex_layout = {
		type: "vertex",
		name: "pt",
		count: 3
	};
	var normal_layout = {
		type: "normal",
		name: "n",
		count: 3
	};
	var distance_layout = {
		name: "uv",
		start: 3,
		count: 2
	};
	glcore.createProgram("diffuse", ["mesh-shader-vs", "mesh-shader-fs"]);
	glcore.setMapping("diffuse", [packed_vertex_layout,packed_normal_layout]);

	glcore.createProgram("diffuse-mesh", ["mesh-shader-vs", "mesh-shader-fs"]);
	glcore.setNamedMapping("diffuse-mesh", [vertex_layout,normal_layout]);

	glcore.createProgram("point", ["point-shader-vs", "point-shader-fs"]);
	glcore.setMapping("point", [vertex_layout, distance_layout]);
	// we'll fill them later
	////////
	glcore.createBuffer("plane-mesh");
	glcore.createBuffer("point");

	var h=-2;
	var plane_mesh=[-100,h,-5,0,1,0,
								  100,h,-5,0,1,0,
								  100,h,100,0,1,0,
								  100,h,100,0,1,0,
								  -100,h,100,0,1,0,
								  -100,h,-5,0,1,0]

	glcore.updateBuffer("plane-mesh", plane_mesh);

	glcore.run([
	{
			buffer: "plane-mesh",
			program: "diffuse",
			draw: draw_plane,
			uniform: setPlaneUniforms
	}
	]);

}
