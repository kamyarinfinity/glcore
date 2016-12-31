/*
 * a light-weight webgl wrapper
 *
 * @author Kamyar Allahverdi, 2015
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */

(function(namespace) {
 "use strict";

	var _window=namespace.get_window();
  var OBJ=namespace.get("obj_loader");

	var glcore = {

		buffers: {},
		frame_buffers: {},
		textures: {},
		programs: {},
		uniformfv: {},
		uniformMatrixfv: {},

		init: function(canvas) {
			var gl = null;

			try {
				gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
			} catch (e) {}

			if (!gl) {
				/* TODO I'm not a fan of alert. Change it to something more pleasant. */
				_window.alert("Unable to initialize WebGL. Your browser may not support it.");
				gl = null;
			}

			this.uniformfv = {
				2: gl.uniform2fv.bind(gl),
				3: gl.uniform3fv.bind(gl),
				4: gl.uniform4fv.bind(gl),
			};

			this.uniformMatrixfv = {
				2: gl.uniformMatrix2fv.bind(gl),
				3: gl.uniformMatrix3fv.bind(gl),
				4: gl.uniformMatrix4fv.bind(gl),
			};

			this.gl = gl;
		},
		schedule_run: function(models,worker_func,visibility_func) {
				glcore.scheduled_run = function() {
					glcore.run(models,worker_func,visibility_func);
				};
				if(this.running)
					glcore.scheduled_stop=true;
				else
					glcore.scheduled_run();// stage is empty, go up!
		},
		schedule_multipass: function(run_array) {
				glcore.scheduled_run = function() {
					glcore.multipass(run_array);
				};
				if(this.running)
					glcore.scheduled_stop=true;
				else
					glcore.scheduled_run();// stage is empty, go up!
		},
		multipass: function(run_array) {
			if(glcore.scheduled_stop) {
				glcore.scheduled_stop=false;
				// review: queue
				this.running=false;
				glcore.scheduled_run();
				return;
			}
			this.running=true;
			var multipass_func = this.multipass.bind(this);
			for (var i = 0; i < run_array.length; i++) {
				run_array[i]();
			}

			_window.requestAnimationFrame(function(){
				multipass_func(run_array);
			});
		},
		run: function(models,worker_func,visibility_func) {
			if(glcore.scheduled_stop) {
				glcore.scheduled_stop=false;
				// review: queue
				this.running=false;
				glcore.scheduled_run();
				return;
			}
			this.running=true;
			var run_func = this.run.bind(this);

			if(worker_func!==undefined) worker_func();

			this.render_scene(models,visibility_func);

			_window.requestAnimationFrame(function(){
				run_func(models,worker_func,visibility_func);
			});
		},
		render_scene: function(models,visibility_func) {
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
			for (var i = 0; i < models.length; i++) {
				if(visibility_func===undefined || visibility_func(i))
				{
					if(models[i].packed)
						this.render(models[i]);
					else
						this.simple_render(models[i].buffer,models[i].program,
								models[i].draw,models[i].uniform,models[i].customDraw);
				}
			}
		},
		sandboxed_render_scene: function(models,before_func,after_func) {
			if(before_func) before_func();

			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
			for (var i = 0; i < models.length; i++) {
				if(models[i].packed)
					this.render(models[i]);
				else
					this.simple_render(models[i].buffer,models[i].program,
							models[i].draw,models[i].uniform,models[i].customDraw);
			}

			if(after_func) after_func();
		},
		render: function(model) {
			var gl = this.gl;
			var buffer_name = model.buffer;
			var program_name = model.program;
			gl.useProgram(this.programs[program_name].id);

			this.setupPackedLayout(program_name,buffer_name);

			if(model.uniform !== undefined)
				this.setUniforms(program_name, model.uniform());

      if(this.buffers[buffer_name].type=="index")
      {
  			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers[buffer_name].index);
  			gl.drawElements(gl.TRIANGLES, this.buffers[buffer_name].count, glcore.uint_support?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT, 0);
      }
      else if(this.buffers[buffer_name].type=="vertex")
      {
        gl.drawArrays(gl.TRIANGLES, 0, this.buffers[buffer_name].count);
      }
      else {
        console.warn("Unsupported mesh type.");
      }

			this.unsetPackedLayout(program_name);
		},
		simple_render: function(buffer_name, program_name, draw_func, uniform_func, custom_draw_func) {
			var gl = this.gl;


			gl.useProgram(this.programs[program_name].id);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[buffer_name].vertex);
			this.setupLayout(program_name);
			if(custom_draw_func !== undefined)
			{
				// currying+closure
				custom_draw_func(function(uniform_dict){
					glcore.setUniforms(program_name,uniform_dict);
				});
			}
			else {
				if(uniform_func !== undefined)
					this.setUniforms(program_name, uniform_func());
				draw_func();
			}
			this.unsetLayout(program_name);
		},
		createCubemap: function(texture_name,length) {
			var gl = this.gl;
			gl.activeTexture(gl.TEXTURE0);
			this.textures[texture_name] = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textures[texture_name]);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER,
							gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER,
							gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,
							gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T,
							gl.CLAMP_TO_EDGE);

			for (var i = 0; i < 6; i++)
				gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, length, length, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

			gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		},
		createFramebuffer: function(framebuffer_name, texture_name, side) {
			var gl = this.gl;
			// Frame Buffer
			this.frame_buffers[framebuffer_name] = gl.createFramebuffer();
			gl.bindFramebuffer( gl.FRAMEBUFFER, this.frame_buffers[framebuffer_name]);

			// Depth color
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				side,
				this.textures[texture_name],
				0);

			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
			  console.error("Framebuffer creation failed.")
			}

			gl.bindFramebuffer( gl.FRAMEBUFFER, null );
		},
		setUniforms: function(program_name, uniform_dict) {
			var gl = this.gl;
			var program = this.programs[program_name].id;
			gl.useProgram(program);
			for (var uniform in uniform_dict) {
				var u = gl.getUniformLocation(program, uniform);
				var val = uniform_dict[uniform];
				if (Array.isArray(val)) {
					if (Array.isArray(val[0]))
						this.uniformMatrixfv[val.length](u, false, this.flatten(val))
					else
						this.uniformfv[val.length](u, val)
				} else if (!isNaN(parseFloat(val)))
					this.gl.uniform1f(u, val);
			}
		},
		flatten: function(list) {
			return list.reduce(function(p, c) {
				return p.concat(c);
			});
		},
    _buildBuffer: function(type, data) {
        if(data)
        {
            var gl=this.gl;
            var buffer = gl.createBuffer();
            var arrayView = type === gl.ARRAY_BUFFER ? Float32Array : glcore.uint_support?Uint32Array:Uint16Array;
            gl.bindBuffer(type, buffer);
            gl.bufferData(type, new arrayView(data), gl.STATIC_DRAW);
            return buffer;
        }
        return undefined;
    },
    getBuffers: function(mesh){
      var gl=this.gl;
      if(Array.isArray(mesh))
      {
        var vmesh=G.tri_faces_to_vertex(mesh);
        return {
          vertex: this._buildBuffer(gl.ARRAY_BUFFER, vmesh.verts),
          normal: this._buildBuffer(gl.ARRAY_BUFFER, vmesh.norms),
          texture: this._buildBuffer(gl.ARRAY_BUFFER, vmesh.textures),
          type: "vertex",
          count: mesh.length*3
        };
      }
      else if(mesh.type=="vertex")
      {
        return {
          vertex: this._buildBuffer(gl.ARRAY_BUFFER, mesh.verts),
          normal: this._buildBuffer(gl.ARRAY_BUFFER, mesh.norms),
          texture: this._buildBuffer(gl.ARRAY_BUFFER, mesh.textures),
          type: "vertex",
          count: mesh.verts.length/3
        };
      }
      else if(mesh.type=="index" || mesh.indices!==undefined)
      {
        return {
          vertex: this._buildBuffer(gl.ARRAY_BUFFER, mesh.verts),
          normal: this._buildBuffer(gl.ARRAY_BUFFER, mesh.norms),
          texture: this._buildBuffer(gl.ARRAY_BUFFER, mesh.textures),
          index: this._buildBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices),
          type: "index",
          count: mesh.indices.length
        };
      }
    },
    deleteMeshBuffers: function(buffer){
        if(buffer.vertex) this.gl.deleteBuffer(buffer.vertex);
        if(buffer.texture) this.gl.deleteBuffer(buffer.texture);
        if(buffer.normal) this.gl.deleteBuffer(buffer.normal);
        if(buffer.index) this.gl.deleteBuffer(buffer.index);
    },
		loadOBJMesh: function(obj_content,create_buffers,buffer_name) {
			var mesh=OBJ.load(obj_content);
			if(create_buffers) this.buffers[buffer_name] = this.getBuffers(mesh);
			return mesh;
		},
    updateMesh: function(buffer_name,mesh) {
      this.buffers[buffer_name] = this.getBuffers(mesh);
    },
		downloadOBJMesh: function(buffer_name,url,create_buffers,callback) {
			var gl=this.gl;
			var buffers=this.buffers;
			var mesh_info={};
			mesh_info[buffer_name]=url;
			OBJ.download(mesh_info,function(res) {
				if(create_buffers) buffers[buffer_name] = OBJ.getBuffers(gl,res[buffer_name]);
				if(callback) callback(res[buffer_name]);
			});
		},
		setupPackedLayout: function(program_name, buffer_name) {
			if (!program_name in this.programs) {
				console.error("Setting up layout failed. No such program: " + program_name);
				return;
			}
			var gl = this.gl;
			gl.useProgram(this.programs[program_name].id);

			var layout = this.programs[program_name].layout;
			var buffer = this.buffers[buffer_name];

			gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertex);
			gl.enableVertexAttribArray(layout["vertex"].id);
			gl.vertexAttribPointer(layout["vertex"].id, layout["vertex"].count, gl.FLOAT, false, 0, 0);

			if(buffer.texture && layout["texture"])
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, buffer.texture);
				gl.enableVertexAttribArray(layout["texture"].id);
				gl.vertexAttribPointer(layout["texture"].id, layout["texture"].count, gl.FLOAT, false, 0, 0);
			}

			if(buffer.normal && layout["normal"])
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normal);
				gl.enableVertexAttribArray(layout["normal"].id);
				gl.vertexAttribPointer(layout["normal"].id, layout["normal"].count, gl.FLOAT, false, 0, 0);
			}
			this.gl.useProgram(null);
		},
		setupLayout: function(program_name) {
			if (!program_name in this.programs) {
				console.error("Setting up layout failed. No such program: " + program_name);
				return;
			}
			this.gl.useProgram(this.programs[program_name].id);
			var layout = this.programs[program_name].layout;
			var stride = this.programs[program_name].stride;
			for (var i = 0; i < layout.length; i++) {
				this.gl.enableVertexAttribArray(layout[i].id);
				this.gl.vertexAttribPointer(layout[i].id, layout[i].count, this.gl.FLOAT, false, stride*4, layout[i].start*4);
			}
			this.gl.useProgram(null);
		},
		unsetPackedLayout: function(program_name) {
			if (!program_name in this.programs) {
				console.error("Setting up layout failed. No such program: " + program_name);
				return;
			}
			var gl = this.gl;

			var layout = this.programs[program_name].layout;
			gl.disableVertexAttribArray(layout["vertex"].id);

			if(layout["texture"])
				gl.disableVertexAttribArray(layout["texture"].id);

			if(layout["normal"])
				gl.disableVertexAttribArray(layout["normal"].id);
		},
		unsetLayout: function(program_name) {
			if (!program_name in this.programs) {
				console.error("Setting up layout failed. No such program: " + program_name);
				return;
			}
			var layout = this.programs[program_name].layout;
			for (var i = 0; i < layout.length; i++) {
				this.gl.disableVertexAttribArray(layout[i].id);
			}
		},
		createBuffer: function(buffer_name,vertices) {
			var buffer = this.gl.createBuffer();
			this.buffers[buffer_name] = {vertex:buffer};
			if(vertices !== undefined)
				this.updateBuffer(buffer_name,vertices);
		},
		updateBuffer: function(buffer_name, vertices) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[buffer_name].vertex);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		},
		getShader: function(id) {
			var shader_script, source, current_child, shader;
			var gl = this.gl;

			shader_script = document.getElementById(id);

			if (!shader_script) {
				return null;
			}

			source = "";
			current_child = shader_script.firstChild;

			while (current_child) {
				if (current_child.nodeType == current_child.TEXT_NODE) {
					source += current_child.textContent;
				}

				current_child = current_child.nextSibling;
			}
			if (shader_script.type == "x-shader/x-fragment") {
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			} else if (shader_script.type == "x-shader/x-vertex") {
				shader = gl.createShader(gl.VERTEX_SHADER);
			} else {
				// Unknown shader type
				return null;
			}
			gl.shaderSource(shader, source);

			// Compile the shader program
			gl.compileShader(shader);

			// See if it compiled successfully
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error("An error occurred compiling the shader "+id+": " + gl.getShaderInfoLog(shader));
				return null;
			}
			return shader;
		},

		createProgram: function(program_name, shader_ids) {
			var gl = this.gl;
			var program = gl.createProgram();
			this.programs[program_name] = {
				id: program
			};

			for (var i = 0; i < shader_ids.length; i++) {
				var shader = this.getShader(shader_ids[i]);
				gl.attachShader(program, shader);
			}
			gl.linkProgram(program);

			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				console.error("Unable to initialize " + program_name + " shader program.");
			}

		},
		setMapping: function(program_name, mapping) {
			if (!program_name in this.programs) {
				console.error("Mapping failed. No such program: " + program_name);
				return;
			}
			this.programs[program_name].layout = [];
			var gl = this.gl;
			var program = this.programs[program_name].id;

			gl.useProgram(program);
			var vpa;
			for (var i = 0; i < mapping.length; i++) {
				vpa = gl.getAttribLocation(program, mapping[i].name);
				this.programs[program_name].layout.push({
					id: vpa,
					start: mapping[i].start,
					count: mapping[i].count,
					location: vpa
				});
			}
			var last = mapping[mapping.length - 1];
			this.programs[program_name].stride = last.start + last.count;
			gl.useProgram(null);
		},
		setNamedMapping: function(program_name, mapping) {
			if (!program_name in this.programs) {
				console.error("Mapping failed. No such program: " + program_name);
				return;
			}
			this.programs[program_name].layout = {};
			var gl = this.gl;
			var program = this.programs[program_name].id;

			gl.useProgram(program);
			var vpa;
			for (var i = 0; i < mapping.length; i++) {
				vpa = gl.getAttribLocation(program, mapping[i].name);
				this.programs[program_name].layout[mapping[i].type]={
					id: vpa,
					count: mapping[i].count,
					location: vpa
				};
			}
			gl.useProgram(null);
		}
	};

	namespace.add("glcore",glcore);

})(__);
