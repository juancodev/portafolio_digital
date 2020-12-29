const yo = require('yo-yo');
//EN ESTE CASO NO VAMOS A REQUERIR LA FUNCIÓN landing SINO LA FUNCIÓN layaout.
const layaout = require('../layout');
const picture = require('../picture-card');
//UNA VEZ REQUERIDA EL INDEX DE PICTURE, LA INVOCAMOS CON UNA FUNCIÓN

module.exports = function pictureCard (pictures) {
  let el = yo `<div class="container timeline">
    <div class="row">
      <div class="col s12 m10 offset-m1 l8 offset-l2 center-align">
        <form enctype="multipar/form-data" class="form-upload" id="formUpload">
          <div id="fileName" class="fileUpload btn btn-flat cyan">
            <span><i class="fas fa-camera-retro"></i> Subir una foto</span>
            <input name="picture" id="file" type="file" class="upload" onchange=${onchange}/>
          </div>
          <button id="btnUpload" type="submit" class="btn btn-flat cyan hide">SUBIR</button>
          <button id="btnCancel" type="button" class="btn btn-flat red hide" onclick="${cancel}"><i class="fas fa-times-circle"></i></button>
        </form>
      </div>
    </div>
    <div class="row">
      <div class="col s12 m10 offset-m1 l6 offset-l3">
        ${pictures.map(function (pic) {
        return picture(pic);
        })}
      </div>
    </div>
  </div>`;

  function toggleButtons(){
    document.getElementById('fileName').classList.toggle('hide');
    document.getElementById('btnUpload').classList.toggle('hide');
    document.getElementById('btnCancel').classList.toggle('hide');
  }

  function cancel () {
    toggleButtons();
    document.getElementById('formUpload').reset();
  }

  function onchange() {
    toggleButtons();
  }

  return layaout(el);
}; 
