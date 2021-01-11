const page = require('page');
const template = require('./template');
const empty = require('empty-element');
const title = require('title');
const header = require('../header');

// DE ESTA FORMA SE OBTIENEN PARÁMETROS EN PAGE "/:"
page('/:username', header, loadUser , function (ctx, next){
  title(`Portafolio - ${ctx.params.username}`);
  let main = document.getElementById('main-container');
  empty(main).appendChild(template(ctx.user));
})

page('/:username/:id', header, loadUser , function (ctx, next){
  title(`Portafolio - ${ctx.params.username}`);
  let main = document.getElementById('main-container');
  empty(main).appendChild(template(ctx.user));
  //AGREGAR SEGUNDA SOLUCIÓN A LAS IMAGENES MINUTO 32:45
})

async function loadUser (ctx, next){
  try{
    ctx.user = await fetch(`/api/user/${ctx.params.username}`).then(res => res.json());
    next()
  } catch (err){
    console.log(err);
  }
}