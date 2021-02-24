const page = require('page');
const template = require('./template');
const empty = require('empty-element');
const title = require('title');
const header = require('../header');
const utils = require('../utils');

// DE ESTA FORMA SE OBTIENEN PARÁMETROS EN PAGE "/:"
page('/:username', utils.loadAuth, loadUser, header, function (ctx, next){
  let main = document.getElementById('main-container');
  title(`Portafolio - ${ctx.user.username}`);
  empty(main).appendChild(template(ctx.user));
  $('.materialboxed').materialbox();
})

page('/:username/:id', utils.loadAuth, loadUser, header, function (ctx, next){
  title(`Portafolio - ${ctx.params.username}`);
  let main = document.getElementById('main-container');
  empty(main).appendChild(template(ctx.user));
  $('.materialboxed').materialbox();
})

async function loadUser (ctx, next){
  try{
    ctx.user = await fetch(`/api/user/${ctx.params.username}`).then(res => res.json());
    next();
  } catch (err){
    console.log(err);
  }
}