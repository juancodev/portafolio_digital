const page = require('page');
const template = require('./template');
const empty = require('empty-element');
const title = require('title');
const request = require('superagent');
const header = require('../header')

page('/', header, asyncLoad, function (ctx, next){
  title('Portafolio');
  let main = document.getElementById('main-container');

  empty(main).appendChild(template(ctx.pictures));
});

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

async function asyncLoad(ctx, next){
  try {
    ctx.pictures = await fetch('/api/pictures').then(res => res.json());
    next();
  } catch (err){
    return console.log(err);
  }
}
//await nos permite esperar hasta que las 2 promesas se cumplan como lo es fetch y then