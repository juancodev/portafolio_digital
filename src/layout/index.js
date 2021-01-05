const yo = require('yo-yo');

//EN ESTE CASO NECESITAMOS CREAR UNA FUNCIÓN CON UN CONTENIDO QUE SEA EXPORTADA Y REQUERIDA EN LA HOME, SIGNUP Y SIGNIN
module.exports = function layout(content) {
  return yo `<div class="content">
  ${content}
  </div>`;
}

