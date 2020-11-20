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
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 10,
    liked: true
  },

  {
    user: {
      username: 'jmontilla',
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 1,
    liked: true
  },
  ];
  //PASAMOS EN LA LINEA 33 EL ARRAY A EL TEMPLATE DE LA HOMEPAGE
  empty(main).appendChild(template(pictures));
});