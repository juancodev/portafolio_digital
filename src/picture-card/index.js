const yo = require('yo-yo');

//CONTINUAMOS CREANDO UN ARCHIVO INDEX EN DONDE COLOCAREMOS LA LÓGICA DE NUESTRO PROYECTO CON REFERENCIA A LAS IMÁGENES SUBIDAS

module.exports = function (pic) { 
  return yo`<div class="card">
    <div class="card-image waves-effect waves-block waves-light">
      <img class="activator" src="${pic.url}">
    </div>
    <div class="card-content">
      <a href="/user/${pic.user.username}" class="card-title">
        <img src="${pic.user.avatar}" class="avatar" />
        <span class="username">${pic.user.username}</span>
      </a>
      <small class="rigth time">Hace un día</small>
      <p>
        <a class="left" href="#"><i class="far fa-star"></i></a>
        <span class="left likes">${pic.likes} favoritos</span>
      </p>
    </div>
  </div>`;};