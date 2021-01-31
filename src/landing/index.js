let yo = require('yo-yo');

//NOS RETORNA EL ELEMENTO DEL DOM QUE NOS PROCESA yo
module.exports = function landing(box){
  return yo`<div class="container landing">
      <div class="row">
        <div class="col s10 push-s1">
          <div class="row">
            <div class="col m5 hide-on-small-only">
              <img class="portada" src="portafolio.png" />
              <img class="portagaleria" src="portadaHome.jpg" />
            </div>
            ${box}
          </div>
        </div>
      </div>
    </div>`;
};
