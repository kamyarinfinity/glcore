

(function(namespace) {
  "use strict";
  var editor = {};

  var V=namespace.get("glview.vector");
  var _window=namespace.get_window();

  function getworldpt(x,y,pt_dest) {
    if(pt_dest===undefined)
    {
      if(spring_world.mode=="spring")
          pt_dest=mass_spring.end;
      else if(spring_world.mode=="chain")
          pt_dest=chain.joints[0].pos;
      else if(spring_world.mode=="cloth")
          pt_dest=cloth.joints[cloth.joints.length-1][cloth.joints[cloth.joints.length-1].length-1].pos;
      else if(spring_world.mode=="jelly")
      {
        // for God's sake
        // who drags jellies?
        var l=Math.floor((jelly.joints.length-1)/2);
        pt_dest=jelly.joint_at([l,0,0]).pos;
      }
    }

    var up=spring_world.up;
    var center=spring_world.center;
    var eye=spring_world.eye;
    var near=spring_world.near;

    /* Left-Handed */
    var camera_ray=V.sub(center,eye).slice(0,3);
    var camera_ray=V.normalize(camera_ray);
    var h=V.normalize(V.cross(up,camera_ray));
    var v=V.normalize(V.cross(camera_ray,h));

    var hx=V.scale(h,x);
    var vy=V.scale(v,y);

    var p=V.scale(camera_ray,near);
    p=V.add(p,hx);
    p=V.add(p,vy);
    p=V.add(p,eye);

    return spring_raytracer.project_to_viewing_plane(p,pt_dest);
  }

  editor.mousemove = function(e) {
      var w=window.innerWidth;
      var h=window.innerHeight;
      var x_e = e.clientX - e.target.offsetLeft;
      var y_e = e.clientY - e.target.offsetTop;
      var x = (x_e-w/2)/h;
      var y = -(y_e-h/2)/h;

      var pt = getworldpt(x,y);

      if(spring_world.rotate_mode) {
          spring_world.alpha = spring_world.start_alpha+(x_e - spring_world.start_x) / 100;
          spring_world.beta = spring_world.start_beta+(y_e - spring_world.start_y) / 100;
          glworld.update();
      }
      else if(spring_world.drag) {
        if(spring_world.mode=="spring")
        {
          mass_spring.end=pt;
          mass_spring.update_buffer();
        }
        else if(spring_world.mode=="chain")
        {
          chain.joints[chain.joints.length-1].pos=pt;
          chain.update_buffer();
        }
        else if(spring_world.mode=="cloth")
        {
          cloth.joints[cloth.joints.length-1][cloth.joints[cloth.joints.length-1].length-1].pos=pt;
          cloth.update_buffer();
        }
        else if(spring_world.mode=="jelly")
        {
          var l=Math.floor((jelly.joints.length-1)/2);
          var jt=jelly.joint_at([l,0,0]);
          jt.pos=pt;
          jelly.update_buffer();
        }
      }
  }

  editor.mousedown = function(e) {
    var w=_window.innerWidth;
    var h=_window.innerHeight;
    var x_e = e.clientX - e.target.offsetLeft;
    var y_e = e.clientY - e.target.offsetTop;
    var x = (x_e-w/2)/h;
    var y = -(y_e-h/2)/h;

    var pt = getworldpt(x,y);

      if(e.button===0 && !e.shiftKey  && !e.ctrlKey) // left-click
      {
        if(spring_world.mode=="spring")
        {
            mass_spring.end=pt;
            mass_spring.update_buffer();
        }
        else if(spring_world.mode=="chain")
        {
          chain.joints[chain.joints.length-1].pos=pt;
          chain.joints[chain.joints.length-1].fixed=true;
          chain.update_buffer();
        }
        else if(spring_world.mode=="cloth")
        {
          cloth.joints[cloth.joints.length-1][cloth.joints[cloth.joints.length-1].length-1].pos=pt;
          cloth.joints[cloth.joints.length-1][cloth.joints[cloth.joints.length-1].length-1].fixed=true;
          chain.update_buffer();
        }
        else if(spring_world.mode=="jelly")
        {
          var l=Math.floor((jelly.joints.length-1)/2);
          var jt=jelly.joint_at([l,0,0]);
          jt.pos=pt;
          jt.fixed=true;
          jelly.update_buffer();
        }
        spring_world.drag=true;
      }
      else if(e.button===1 || (e.button===0 && e.shiftKey)) // middle-click or ctrl-click
      {
          spring_world.rotate_mode=true;
          spring_world.start_x=x_e;
          spring_world.start_y=y_e;
          spring_world.start_alpha=spring_world.alpha;
          spring_world.start_beta=spring_world.beta;
      }
  }
  editor.mouseup = function(e) {
      if(e.button===0 && !e.shiftKey)
      {
          spring_world.drag=false;
        if(spring_world.mode=="chain")
          chain.joints[chain.joints.length-1].fixed=false;
        if(spring_world.mode=="cloth")
          cloth.joints[cloth.joints.length-1][cloth.joints[cloth.joints.length-1].length-1].fixed=false;
        if(spring_world.mode=="jelly")
        {
          var l=Math.floor((jelly.joints.length-1)/2);
          var jt=jelly.joint_at([l,0,0]);
          jt.fixed=false;
        }
      }
      else if(e.button===1 || (e.shiftKey && e.button===0))
          spring_world.rotate_mode=false;
  }

  namespace.add("editor",editor);

})(__);
