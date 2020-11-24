const yo = require('yo-yo');

//CONTINUAMOS CREANDO UN ARCHIVO INDEX EN DONDE COLOCAREMOS LA LÓGICA DE NUESTRO PROYECTO CON REFERENCIA A LAS IMÁGENES SUBIDAS

//LUEGO CREAMOS UNA FUNCION QUE NOS PERMITA RENDERIZAR LA IMAGEN CADA VEZ HAYA CAMBIOS
module.exports = function pictureCards(pic) { 
  let el;
  function render(picture) {
    return yo`<div class="card ${picture.liked ? 'liked' : ''}">
    <div class="card-image waves-effect waves-block waves-light">
      <img class="activator" src="${picture.url}">
    </div>
    <div class="card-content">
      <a href="/user/${picture.user.username}" class="card-title">
        <img src="${picture.user.avatar}" class="avatar" />
        <span class="username">${picture.user.username}</span>
      </a>
      <small class="rigth time">Hace un día</small>
      <p>
        <a class="left" href="#" onclick=${like}><i class="far fa-star"></i></a>
        <a class="left" href="#" onclick=${disLike}><i class="fas fa-star"></i></a>
        <span class="left likes">${picture.likes} favoritos</span>
      </p>
    </div>
  </div>`;
  };

  function like() {
    //SE TOMA EL ARRAYS Y SE LE AGREGA LA PROPIEDAD.
    pic.liked = true;
    //SE LE INDICA A EL OBJETO CON SU PROPIEDAD pic.likes LA SUMA O LA RESTA
    pic.likes++;
    //SE CREA LA NUEVA VARIABLE QUE SE VA A ENCARGAR DE GUARDAR LOS NUEVOS CAMBIOS
    let newEl= render(pic);
    //Y SE UTILIZA EL MÉTODO DE "yo.update()" COLOCANDO COMO PARÁMETRO EL ELEMENTO VIEJO Y EL NUEVO ELEMENTO ACTUALIZADO.
    yo.update(el, newEl);
    //ESTE RETURN ME PERMITE EVITAR QUE SE VUELVA A REPETIR LA MISMA SENTECIA
    return false
  };

  function disLike() {
    pic.liked = false;
    pic.likes--;
    let newEl = render(pic);
    yo.update(el, newEl);
    return false
  }

  el = render(pic);
  return el;

};