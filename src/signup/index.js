const page = require('page');
const template = require('./template');
const empty = require('empty-element');
const title = require('title');


page('/signup', function (ctx, next){
  title('Portafolio - Signup');
  let main = document.getElementById('main-container');
  empty(main).appendChild(template);
});