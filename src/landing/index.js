let yo = require('yo-yo');

//NOS RETORNA EL ELEMENTO DEL DOM QUE NOS PROCESA yo
module.exports = function landing(box){
  return yo`<div class="container">
      <div class="row">
        <div class="col s10 push-s1">
          <div class="row">
            <div class="col m5 hide-on-small-only">
              <img class="iphone" src="telefonogram.png" />
            </div>
            ${box}
          </div>
        </div>
      </div>
    </div>`;
};
