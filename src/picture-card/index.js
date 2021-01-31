const yo = require('yo-yo');
//ESTA LIBRERÍA NOS PERMITE MODIFICAR LA HORA RELATIVA DESDE EL TIEMPO EN QUE SE PUBLICÓ
/* const moment = require('moment'); */
const IntlRelativeFormat = require('intl-relativeformat');
/* const translate = require('../translate'); */
//CONTINUAMOS CREANDO UN ARCHIVO INDEX EN DONDE COLOCAREMOS LA LÓGICA DE NUESTRO PROYECTO CON REFERENCIA A LAS IMÁGENES SUBIDAS

let rf = new IntlRelativeFormat('es');

//LUEGO CREAMOS UNA FUNCION QUE NOS PERMITA RENDERIZAR LA IMAGEN CADA VEZ HAYA CAMBIOS
module.exports = function pictureCards(pic) {
  let el;
  function render(picture) {
    return yo`<div class="card ${picture.liked ? 'liked' : ''}">
    <div class="card-image waves-effect waves-block waves-light">
      <img class="activator" src="${picture.url}" ondblclick=${like.bind(null, null, true)} />
      <i class="fas fa-award like-award ${picture.likedAward ? 'liked' : ''}"></i>
    </div>
    <div class="card-content">
      <a href="/${picture.user.username}" class="card-title">
        <img src="${picture.user.avatar}" class="avatar" />
        <span class="username">${picture.user.username}</span>
      </a>
      <small class="right time">hace un momento</small>
      <p>
        <a class="left" href="#" onclick=${like.bind(null, true)}><i class="material-icons blue100">star_border</i></a>
        <a class="left" href="#" onclick=${like.bind(null, false)}><i class="material-icons green200">star</i></a>
        <span class="left likes">${picture.likes} Favorito</span>
      </p>
    </div>
  </div>`;
  };

  function like(liked, dblclick) {
    //SE VA A EVALUAR LA CONDICION SI TIENE EL LIKE QUITARLO Y SI NO LO TIENE, AGREGARLO CON EL DBLCLICK
    //SE TIENE QUE AGREGAR UN DOBLE ASIGNACION PARA LA CONDICION Y QUE ASI LO MUESTRE SI NO LO TIENE O VICEVERSA
      if (dblclick) {
        pic.likedAward = pic.liked = !pic.liked;
        liked = pic.liked;
      } else {
        //SE TOMA EL ARRAYS Y SE LE AGREGA LA PROPIEDAD.
        pic.liked = liked;
      }
    //SE LE INDICA A EL OBJETO CON SU PROPIEDAD pic.likes LA SUMA O LA RESTA
    pic.likes += liked ? 1 : -1;

    //SE CREA UNA NUEVA FUNCION QUE SE VA A ENCARGAR DE GUARDAR LOS NUEVOS CAMBIOS
    function doRender() {
      let newEl= render(pic);
      //Y SE UTILIZA EL MÉTODO DE "yo.update()" COLOCANDO COMO PARÁMETRO EL ELEMENTO VIEJO Y EL NUEVO ELEMENTO ACTUALIZADO.
      yo.update(el, newEl);
    }
    //SE INICIALIZA LA FUNCION
    doRender()

    //LUEGO SE CREA UN TIEMPO DE INTERVALO PARA PODER QUITAR EL ESTILO DEL AWARD
    setTimeout(function (){
      pic.likedAward = false
      doRender()
    }, 1500);

    //ESTE RETURN ME PERMITE EVITAR QUE SE VUELVA A REPETIR LA MISMA SENTECIA
    return false;
  };

  el = render(pic);
  return el;

};