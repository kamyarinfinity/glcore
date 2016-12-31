/*
 * a utility object for scene management
 *
 * @author Kamyar Allahverdi, 2015
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */


(function(namespace) {
  "use strict";

  var _window = namespace.get_window();
  var glcore = namespace.get("glcore");
  var glview = namespace.get("glview");

  function World() {
    this.scenes={};
    this.__unnamed_index=0;
  }

  /* Supporting named and unnamed scenes
     A reference is saved, as the object is
     supposed to be shared among different users
     Here we just handle scene transformations
   */
  World.prototype.add = function(scene,name) {
    if(name==undefined) {
      this.scenes["__"+this.__unnamed_index]=scene;
      this.__unnamed_index++;
    }
    else
      this.scenes[name]=scene;
  };

  function update_world(world_props) {
    var _up = world_props.up || [0,1,0];
    var devicePixelRatio = _window.devicePixelRatio || 1;
    var _width = world_props.width || _window.innerWidth*devicePixelRatio || 500;
    var _height = world_props.height || _window.innerHeight*devicePixelRatio || 500;

    var aspect=(_width/_height);

    var rotx=glview.freerotate([0.5*aspect,0,1],[0,1,0],world_props.alpha);
    var roty=glview.freerotate([0,0.5,1],[1,0,0],world_props.beta);
    var rot=glview.mult(rotx,roty);
    world_props.model=rot;
    //
    // world_props.model=glview.identity();
    world_props.imodel=glview.inverse(world_props.model);
    world_props.view=glview.lookat(world_props.eye,world_props.center,_up);
    world_props.modelview=glview.mult(world_props.view,world_props.model);
    world_props.normalmatrix=glview.normalmatrix(world_props.modelview);

    if(world_props.is_screen===true)
      world_props.projection=glview.project(0.5*aspect,0.5,0.5,100);
    else
      world_props.projection=glview.project(aspect,1,world_props.near,world_props.far);

    /* TODO support multiple viewports */
    if(glcore.gl) // if opengl is loaded
      glcore.gl.viewport(0, 0, _width, _height);
  }

  World.prototype.update = function() {
    for (var i in this.scenes) {
      update_world(this.scenes[i]);
    }
  };

  World.prototype.update_scene = function(scene_name) {
    if(scene_name in this.scenes) {
      update_world(this.scenes[scene_name]);
    }
    else {
      throw("No such scene exists");
    }
  };

  World.prototype.get = function(scene_name) {
      return this.scenes[scene_name];
  };

  // a singletone
  namespace.add("glworld",new World());

})(__);
