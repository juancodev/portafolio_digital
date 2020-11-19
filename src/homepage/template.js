const yo = require('yo-yo');
//EN ESTE CASO NO VAMOS A REQUERIR LA FUNCIÓN landing SINO LA FUNCIÓN layaout.
const layaout = require('../layout');
const picture = require('../picture-card');
//UNA VEZ REQUERIDA EL INDEX DE PICTURE, LA INVOCAMOS CON UNA FUNCIÓN

module.exports = function pictureCard (pictures) {
  let el = yo `<div class="container timeline">
    <div class="row">
      <div class="col s12 m10 offset-m1 l6 offset-l3">
        ${pictures.map(function (pic) {
        return picture(pic);
        })}
      </div>
    </div>
  </div>`;
  return layaout(el);
}; 
