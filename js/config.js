

(function(namespace) {
  "use strict";

  var _wnd = namespace.get_window();
  var V = namespace.get("glview.vector");

  var world = {
    center: [0,-1,10,1],
    eye: [2,-1,0,1],
    alpha: 0,
    beta: 0,
    start_alpha: 0, // reset to this angle
    start_beta: 0, // reset to this angle
    rotate_mode: false,
    light_pos: [0,3,0,1],
    near: 0.5,
    far: 100,
    up: [0,1,0],
  };

  namespace.add("world",world);

})(__);
