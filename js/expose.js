/*
 * expose.js, exposed as __ (double underscore),
 * into the wild, is a utility for namespace management
 *
 * @author Kamyar Allahverdi, 2015
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */


(function(_window) {
  "use strict";

  function Namespace(import_expose) {
    this.ctx = {};
    if(import_expose)
      _window.expose=this.expose.bind(this);
  }

  Namespace.prototype.get_context = function() {
    return this.ctx;
  };

  Namespace.prototype.get_window = function() {
    return _window;
  };

  // just tunneling
  Namespace.prototype.attach_to_window = function(name,obj) {
    _window[name]=obj;
  };

  Namespace.prototype.add = function(name,lib) {
    if(name in this.ctx)
      throw("Collision for library name: "+name+". Please choose a different name.");
    else
      this.ctx[name]=lib;
  };

  Namespace.prototype.get = function(name) {
    var obj;
    // if qualified name
    if(name && name.indexOf(".")>0) // first dot is not valid
    {
      var parts = name.split(".");
      if(parts[0] in this.ctx)
      {
        parts[0]=this.ctx[parts[0]];
        obj = parts.reduce(function(c,next) {
          if(c) return c[next];
          else return null;
        });
      }
    }
    else {
      obj=this.ctx[name];
    }
    if(typeof obj !== "object")
      throw("Cannot retrieve "+name+": Library not found.");
    else
      return obj;
  };

  Namespace.prototype.expose = function (name,alias,_current_ctx) {
    var obj;
    // if qualified name
    if(name && name.indexOf(".")>0) // first dot is not valid
    {
      var parts = name.split(".");
      if(parts[0] in this.ctx)
      {
        parts[0]=this.ctx[parts[0]];
        obj = parts.reduce(function(c,next) {
          if(c) return c[next];
          else return null;
        });
      }
    }
    else {
      obj=this.ctx[name];
    }


    if(typeof obj !== "object")
      throw("Cannot import "+name+": Library not found.");
    else
    {
      var _ctx = _current_ctx || _window;
      var expose_name = alias || name;
      _ctx[expose_name] = obj;
    }
  };

  _window.__ = new Namespace(true);

})(window);
