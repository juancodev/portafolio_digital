const yo = require('yo-yo');
//NO ES IMPORTANTE COLOCAR EL ARCHIVOS INDEX, YA QUE SI TUVIERA OTRO NOMBRE SÍ FUERA NECESARIO.
const layout = require('../layout');

module.exports = function userPageTemplate(user){
  let el = yo `<div class="cointainer profile">
    <div class="row">
      <div class="col s12 m10 offset m1-l8 offset-l2 center-align heading">
        <div class="row">
          <div class="col s12 m10 offset-m1 l3 offset-l3 center">
            <img src="${user.avatar}" class="responsive-img circle" />
          </div>
          <div class="col s12 m10 offset-m1 l6 left-align">
            <h2 class="hide-on-large-only center-align">${user.name}</h2>
            <h2 class="hide-on-med-and-down left-align">${user.name}</h2>
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
  return layout(el);
}


/*<a href="/${user.username}/${picture.id}" class="picture-container">
    <img src="${picture.src}" class="picture" />
    <div class="likes"><a href="#!"><i class="material-icons green200">star</i>${picture.likes}</a>
    </div>
  </a>


  <div class="modal-footer">
    <div class="btn btn-flat likes">
      <i class="fas fa-star"></i> ${picture.likes} ME GUSTA
    </div>
    <div class="btn btn-flat">
    </div>
  </div>



  <div class="media">
  <img src="${picture.src}" class="materialboxed" data-caption=" ${picture.likes} ME GUSTA"/>
  </div>*/