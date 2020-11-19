const page = require('page');
const template = require('./template');
const empty = require('empty-element');
const title = require('title');


page('/', function (ctx, next){
  title('Portafolio');
  let main = document.getElementById('main-container');
  //EN ESTE CASO PONDREMOS UN OBJETO CON LOS DATOS, ICONOS Y USUARIO QUIEN SUBIÓ LA FOTO
  let pictures = [
  {
    user: {
      username: 'jmontilla',
      //EN EL AVATAR IRÁ LA IMAGEN DEL USUARIO
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 10,
    liked: true
  },

  {
    user: {
      username: 'jmontilla',
      //EN EL AVATAR IRÁ LA IMAGEN DEL USUARIO
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 1,
    liked: true
  },
  ];

  empty(main).appendChild(template(pictures));
});