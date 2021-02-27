const yo = require('yo-yo');
const html2pdf = require('html2pdf.js');
//NO ES IMPORTANTE COLOCAR EL ARCHIVOS INDEX, YA QUE SI TUVIERA OTRO NOMBRE SÍ FUERA NECESARIO.
const layout = require('../layout');

module.exports = function userPageTemplate(user){
  let el = yo`<div class="cointainer profile">
    <div class="row">
      <div class="col s12 m10 offset m1-l8 offset-l2 center-align heading">
        <div class="row">
          <div class="col s12 m10 offset-m1 l3 offset-l3 center">
            <img src="${user.avatar}" alt="${user.name}" class="responsive-img circle" />
          </div>
          <div class="col s12 m10 offset-m1 l6 left-align">
            <h2 class="hide-on-large-only center-align">${user.name}</h2>
            <h2 class="hide-on-med-and-down left-align">${user.name}</h2>
            <div class="fixed-action-btn horizontal">
              <a class="btn-floating btn-large red accent-4">
                <i class="large material-icons">mode_edit</i>
              </a>
              <ul>
                <li id="savePdf" class="btn-floating blue" onclick="${viewPdf}"><i class="fas fa-file-pdf"></i>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        ${user.pictures.map(function (picture){
          return yo` <div class="col s12 m6 l4">
           <div class="picture-container">
              <img src="${picture.src}" class="picture materialboxed" data-caption=" ${picture.likes || 0} ME GUSTA" />
            </div>
          </div>`
        })}
      </div>
    </div>
  </div>`;

  function viewPdf () {
    document.getElementById('savePdf');
    let elementoParaConvertir = document.body;
    const opts = {
    margin: 1,
    filename: 'mi-perfil.pdf',
    image: {
      type: 'jpeg',
      quality: 0.98
    },
    html2canvas: {
      scale: 3,
      letterRendering: true
    },
    jsPDF: {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait'
    }
  }
    html2pdf()
      .set(opts)
      .from(elementoParaConvertir)
      .save()
      .catch(err => console.log(err))
      .then(() => {
        console.log('Guardado');
      })
  }


  return layout(el);
}