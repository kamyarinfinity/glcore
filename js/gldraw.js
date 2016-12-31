
(function(namespace) {
  "use strict";

  var glview = namespace.get("glview");
  var world = namespace.get("world");
  namespace.attach_to_window("setPlaneUniforms",setPlaneUniforms);
  namespace.attach_to_window("setPointUniforms",setPointUniforms);
  namespace.attach_to_window("setMeshUniforms",setMeshUniforms);
  namespace.attach_to_window("draw_point",draw_point);
  namespace.attach_to_window("draw_plane",draw_plane);


  function setPlaneUniforms() {
      return {
          "modelv": world.modelview,
          "proj": world.projection,
          "normalmatrix": world.normalmatrix,
          "color": [1.0,0.8,.0],
          "light_color": [1.,1.,1.],
          "light_pos": glview.apply(world.modelview,world.light_pos).slice(0,3)
        };
  }

  function setMeshUniforms() {
      return {
          "modelv": world.modelview,
          "proj": world.projection,
          "normalmatrix": world.normalmatrix,
          "color": [1.0,0.4,.4],
          "light_color": [1.,1.,1.],
          "light_pos": glview.apply(world.modelview,world.light_pos).slice(0,3)
        };
  }
  function setPointUniforms() {
      return {
          "modelv": world.modelview,
          "proj": world.projection,
          "color": [231/255,76/255,60/255,1],
          "sizerate": 0.7
        };
  }


  /////////////////////

  function draw_plane() {
    var gl = glcore.gl;
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function draw_point() {
      if(world.control_point!==null)
      {
          var gl = glcore.gl;
          gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);
      }
  }

})(__);
