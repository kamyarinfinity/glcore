
(function(namespace) {
  "use strict";

  var _window = namespace.get_window();

  var controllers = {};

  function _create_ui(props) {
    var gui = new dat.GUI();
    var params = {
      loadFile : function() {
              document.querySelector('#inputobj').click();
      }
    };
    gui.add(params, 'loadFile').name('Load Mesh');
  }

  controllers.create_ui = function(props) {
    _create_ui(props);
  }

  namespace.add("interface",controllers);

})(__);
