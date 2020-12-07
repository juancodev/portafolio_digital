const page = require('page');
const template = require('./template');
const empty = require('empty-element');
const title = require('title');


page('/', function (ctx, next){
  title('Portafolio');
  let main = document.getElementById('main-container');
/* EN ESTE CASO PONDREMOS UN OBJETO CON LOS DATOS, ICONOS Y USUARIO QUIEN SUBIÓ LA FOTO
 EN LA LÍNEA 21 CREAMOS UNA NUEVA INSTANCIA DE LA CLASE Date, EN DONDE SIGNIFICA 'new Date()' Hoy*/  
  const pictures = [
  {
    user: {
      username: 'jmontilla',
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 10,
    liked: false,
    createAt: new Date()
  },


  /* EN LA LÍNEA 34, PRIMERO CREAMOS UNA NUEVA INSTANCIA DE LA CLASE "Date()", ENVIÁNDOLE COMO MÉTODO LA FUNCIÓN QUE NOS PERMITE MODIFICAR O CAMBIAR LA HORA ".setDate(new Date().getDate() - 10)" Y DENTRO COMO PARÁMETRO SE LE ENVIA LA FECHA ACTUAL CON "new Date()" Y DESPUÉS DE OBTENER EL DÍA DE HOY CON LA FUNCIÓN "getDate()" LE RESTAMOS LOS DÍAS QUE QUEREMOS.  */
  {
    user: {
      username: 'jmontilla',
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 1,
    liked: true,
    createAt: new Date().setDate(new Date().getDate()- 10)
  },
  ];
  //PASAMOS EN LA LINEA 33 EL ARRAY A EL TEMPLATE DE LA HOMEPAGE
  empty(main).appendChild(template(pictures));
});