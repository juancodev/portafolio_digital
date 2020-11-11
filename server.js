const express = require('express');
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
})

/* CON ESA CONDICIÓN ESTAMOS INDICANDO QUE SI ERROR ES DIFERENTE A NULL ENTONCES LA APLICACIÓN ME RETORNE NADA DE LO CONTRARIO ME MUESTRE UN MENSAJE EN CONSOLA DICIENDO QUE HUBO UN ERROR, "process.exit(1)" NOS SIRVE PARA INDICAR QUE SI HAY UN ERROR DETENGA LA APLICACIÓN DE NO HABER SIEMPRE DEBE SER DISTINTO QUE "0". */

aplication.listen(8080, (err)=>{
    if (err != null)
    return console.log('Hubo un error con el servidor'), process.exit(1);
    else 
    console.log('Servidor arriba');
});

/*LAS FUNCIONES PUEDEN O NO TENER UN NOMBRE, ES POR ESO QUE VEMOS QUE EN LOS ARROW FUNCTION NO SE LE COLOCA UN NOMBRE. ()=>*/ 
