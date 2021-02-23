const page = require('page');
const template = require('./template');
const empty = require('empty-element');
const title = require('title');
const header = require('../header');
const picture = require('../picture-card');
const utils = require('../utils');
const io = require('socket.io-client');
const axios = require('axios');

//nos conectamos al servidor de socket.io
/* let socket = io.connect('http://portafoliodigital.test:10443'); */

page('/', utils.loadAuth, header, loading, asyncLoad, function (ctx, next){
  title('Portafolio');
  let main = document.getElementById('main-container');

  empty(main).appendChild(template(ctx.pictures));
});

/* socket.on('image', function (image) {
  let picturesEl = document.getElementById('pictures-container');
  let first = picturesEl.firstChild;
  let img = picture(image);
  picturesEl.insertBefore(img, first);
}) */

/* 1: primero creamos una variable que almacena un elemento que crearemos con el método createElement(y adentro se le pasa la etiqueta html) dentro del DOM (document)

2: utilizamos el atributo ya creado (el) y le asignamos una nueva clase con la propiedad classList.add(nombre de la clase)

3: debemos indicarle en dónde será agregado o inyectado el nuevo elemento con la nueva clase, en este caso, será en el main-container

4: por último, llamamos al método next() para que pueda obtener el request de las imagenes, ya que si no es agregada, se puede quedar el bucle y nunca llamar al siguiente middleware*/

function loading (ctx, next) {
  // 1
  let container = document.createElement('div');
  let loadingEl = document.createElement('div');
  // 2
  container.classList.add('loader-container');
  loadingEl.classList.add('loader');
  // 3
  container.appendChild(loadingEl);
  let main = document.getElementById('main-container');
  empty(main).appendChild(container);
  // 4
  next();
}

/* function loadPicturesAxios (ctx, next) {
  axios
    .get('/api/pictures')
    .then(function (res) {
      ctx.pictures = res.data;
      next();
    })
    .catch(function (err) {
      console.log(err);
    })
} */

async function asyncLoad(ctx, next) {
  try {
    ctx.pictures = await fetch('api/pictures').then(res => res.json());
    next();
  } catch (err) {
    return console.log(err);
  }
}

//await nos permite esperar hasta que las 2 promesas se cumplan como lo es fetch y then
    /* function loadPicturesFetch (ctx, next){
      request
        .get('/api/pictures')
        .end(function (err, res){
        if (err) return console.log(err);

        ctx.pictures = res.body;
        next();
        })

    } */

    /* function loadPicturesFetch (ctx, next){
      fetch('/api/pictures')
        .then(function (res) {
          return res.json();
        })
        .then(function (pictures){
          ctx.pictures = pictures;
          next();
        })
        .catch(function (err) {
          console.log(err)
        })
    } */