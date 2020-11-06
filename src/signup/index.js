const page = require('page');
const empty = require('empty-element');
const template = require('./template');


page('/signup', function (ctx, next){
  let main = document.getElementById('main-container');
  empty(main).appendChild(template);
});