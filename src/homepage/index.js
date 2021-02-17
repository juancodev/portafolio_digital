const page = require('page');
const template = require('./template');
const empty = require('empty-element');
const title = require('title');
const header = require('../header');
const utils = require('../utils');
const axios = require('axios');

page('/', utils.loadAuth, header, loading, loadPicturesAxios, function (ctx, next){
  title('Portafolio');
  let main = document.getElementById('main-container');

  empty(main).appendChild(template(ctx.pictures));
});

/* 1: primero creamos una variable que almacena un elemento que crearemos con el método createElement(y adentro se le pasa la etiqueta html) dentro del DOM (document)

2: utilizamos el atributo ya creado (el) y le asignamos una nueva clase con la propiedad classList.add(nombre de la clase)

3: debemos indicarle en dónde será agregado o inyectado el nuevo elemento con la nueva clase, en este caso, será en el main-container

4: por último, llamamos al método next() para que pueda obtener el request de las imagenes, ya que si no es agregada, se puede quedar el bucle y nunca llamar al siguiente middleware*/

function loading (ctx, next) {
  // 1
  let el = document.createElement('div');
  // 2
  el.classList.add('loader');
  // 3
  document.getElementById('main-container').appendChild(el);
  // 4
  next();
}

function loadPicturesAxios (ctx, next) {
  axios
    .get('/api/pictures')
    .then(function (res) {
      ctx.pictures = res.data;
      next();
    })
    .catch(function (err) {
      console.log(err);
    })
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