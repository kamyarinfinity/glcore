/*
 * a 3D raytracer
 * currently supports intersecting with planes
 *
 * @author Kamyar Allahverdi, 2015
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */


(function(namespace) {
  "use strict";

  var glview = namespace.get("glview");
  var V = namespace.get("glview.vector");

  var raytrace = {
    version: "1.0.0"
  };

  raytrace.Raytracer = function(world_props) {
    this.world_props=world_props; // we keep a reference
  };

  raytrace.Raytracer.prototype.intersect_plane = function(pt,p0,normal) {
    var eye = this.world_props.eye;
    var dist=V.sub(p0,eye);

    var hpt=pt.slice(0);
    hpt[3]=1;
    var ray=V.sub(hpt,eye);

    var pdist=V.dot(normal,dist);
    var pray=V.dot(normal,ray);

    // parallel, do nothing.
    if(pray==0)
        return p0;

    var r=pdist/pray;

    return [eye[0]+r*ray[0],
        eye[1]+r*ray[1],
        eye[2]+r*ray[2]];
  };

  /* projects pt to viewing plane */
  raytrace.Raytracer.prototype.project_to_viewing_plane = function(pt,p0) {
    var eye = this.world_props.eye;
    var normal=V.sub(p0,eye);
    normal=V.normalize(normal);

    return this.intersect_plane(pt,p0,normal);
  };

  /* projects pt to near plane */
  raytrace.Raytracer.prototype.project_to_near_plane = function(pt) {
    var model=this.world_props.model;
    var near=this.world_props.near;
    var near=this.world_props.near;

    var p1=glview.apply(model,[0,0,near,1]);
    var p2=glview.apply(model,[0,1,near,1]);
    var p3=glview.apply(model,[1,0,near,1]);
    p1=V.normalize4d(p1);
    p2=V.normalize4d(p2);
    p3=V.normalize4d(p3);

    return this.project_to_plane(pt,p1,p2,p3);
  };

  /* projects pt to screen plane */
  raytrace.Raytracer.prototype.project_to_screen = function(pt) {
    var p1=[0,0,1,1];
    var p2=[0,1,1,1];
    var p3=[1,0,1,1];
    return this.project_to_plane(pt,p1,p2,p3);
  };

  /* projects pt to plane */
  raytrace.Raytracer.prototype.project_to_plane = function(pt,p1,p2,p3) {
    var eye=this.world_props.eye;

    var v1=V.sub(p2,p1);
    var v2=V.sub(p3,p1);

    var n=V.cross(v1,v2);
    n=V.normalize(n);

    return this.intersect_plane(pt,p1,n);
  };

  namespace.add("raytrace",raytrace);

})(__);
