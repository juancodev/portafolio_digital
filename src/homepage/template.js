const yo = require('yo-yo');
//EN ESTE CASO NO VAMOS A REQUERIR LA FUNCIÓN landing SINO LA FUNCIÓN layaout.
const layaout = require('../layout');

let template = yo `<div class="container timeline">
  <div class="row">
    <div class="col s12 m10 offset-m1 l6 offset-l3">
    content
    </div>
  </div>
</div>`;

module.exports = layaout(template);