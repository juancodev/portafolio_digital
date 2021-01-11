const express = require('express');
const multer = require('multer');
const ext = require('file-extension');

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, +Date.now() + '.' + ext(file.originalname))
  }
})

let upload = multer({ storage: storage }).single('picture');

const aplication = express();
//PARA INDICARLE AL SERVIDOR QUE UTILIZAREMOS UN MOTOR DE PLANTILLA.
aplication.set('view engine', 'pug');

//DEFINIRLE UN NUEVO MILDDWILE Y SIRVE PARA UTILIZAR UN ARCHIVO ESTATICO EN ESTE CASO SERÍA COMO UNA CARPETA VIRTUAL "PUBLIC".
aplication.use(express.static('public'))

//EN ESTE CASO SE DEFINEN LAS RUTAS QUE HACER PARTE DE NUESTRO PROYECTO E INDICANDO EL OBJETO PARA EL TÍTULO DE NUESTRA PÁGINA.
aplication.get('/', (req, res)=>{
    res.render('index', { title: 'Portafolio'});
});

aplication.get('/signup', (req, res)=>{
    res.render('index', { title : 'Portafolio - Signup'});
});

aplication.get('/signin', (req, res)=>{
    res.render('index', { title : 'Portafolio - Signin'});
}) ;

//(FIXEAR EL PROBLEMA DE SINCRONIZACIÓN DE PAGE CON LA LIBRERIA TITLE)
aplication.get('/api/pictures', function (req, res){
  /* EN ESTE CASO PONDREMOS UN OBJETO CON LOS DATOS, ICONOS Y USUARIO QUIEN SUBIÓ LA FOTO
 EN LA PROPIEDAD "creatAt" CREAMOS UNA NUEVA INSTANCIA DE LA CLASE Date, EN DONDE SIGNIFICA 'new Date()' Hoy*/  
  const pictures = [
  {
    user: {
      username: 'jmontilla',
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 0,
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
    likes: 0,
    liked: false,
    createAt: new Date()
  },
  ];

  setTimeout(function () {
  res.send(pictures);
  }, 2000);
});

aplication.post('/api/pictures', function (req, res) {
  upload(req, res, function (err){
    if (err) {
      return res.send(500, "Error al subir archivo");
    }
    res.send('Archivo subido correctamente');
  })
});

aplication.get('/api/user/:username', function (req, res){
  const user = {
    username: 'jmontilla',
    avatar: 'https://i.pinimg.com/originals/d4/c1/e8/d4c1e8bbc2624a0ff0172e819dbf8c6b.jpg',
    pictures: [
      {
        id: 1,
        src: 'https://i.pinimg.com/originals/d4/c1/e8/d4c1e8bbc2624a0ff0172e819dbf8c6b.jpg',
        likes: 12
      },
      {
        id:2,
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/White_Pitbull.jpg/1200px-White_Pitbull.jpg',
        likes: 11
      },
       {
        id:3,
        src: 'https://live.hsmob.io/storage/images/wakyma.com/wakyma.com_5-cosas-que-no-sabias-sobre-los-perros-pitbull.jpg',
        likes: 10
      },
       {
        id:4,
        src: 'https://c.files.bbci.co.uk/48DD/production/_107435681_perro1.jpg',
        likes: 13
      },
       {
        id:5,
        src: 'https://image.freepik.com/foto-gratis/lindo-perro-pequeno-sentado-comiendo-su-plato-comida-perros_139317-1570.jpg',
        likes: 14
      },
       {
        id:6,
        src: 'https://www.caracteristicas.co/wp-content/uploads/2017/02/perro-3-e1561679226953.jpg',
        likes: 15
      },
    ]
  }
  res.send(user);
});

//RUTA PARA EL USUARIO
aplication.get('/:username', (req, res)=>{
    res.render('index', { title : `Portafolio - ${req.params.username}`});
});

//RUTA PARA LAS FOTOS DE LOS USUARIOS
aplication.get('/:username/:id', (req, res)=>{
    res.render('index', { title : `Portafolio - ${req.params.username}`});
});


/* CON ESA CONDICIÓN ESTAMOS INDICANDO QUE SI ERROR ES DIFERENTE A NULL ENTONCES LA APLICACIÓN ME RETORNE NADA DE LO CONTRARIO ME MUESTRE UN MENSAJE EN CONSOLA DICIENDO QUE HUBO UN ERROR, "process.exit(1)" NOS SIRVE PARA INDICAR QUE SI HAY UN ERROR DETENGA LA APLICACIÓN DE NO HABER SIEMPRE DEBE SER DISTINTO QUE "0". */

aplication.listen(8080, (err)=>{
    if (err != null)
    return console.log('Hubo un error con el servidor'), process.exit(1);
    else 
    console.log('Servidor arriba');
});

/*LAS FUNCIONES PUEDEN O NO TENER UN NOMBRE, ES POR ESO QUE VEMOS QUE EN LOS ARROW FUNCTION NO SE LE COLOCA UN NOMBRE. ()=>*/ 

//PASAMOS EL ARRAY A EL TEMPLATE DE LA HOMEPAGE
