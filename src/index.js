//EN ESTE CASO, REQUERIMOS EL MÓDULO PAGE PARA INICIALIZARLO.
const page = require('page');



/* const moment = require('moment');
const { locale } = require('moment');

//DE ESTA FORMA REQUERIMOS EL LENGUAJE EN ESPAÑOL DEL FORMATO DE LA HORA
require('moment/locale/es');

moment.locale('es'); */
//DESPUÉS REQUERIMOS LOS MÓDULOS DE LA HOMEPAGE Y SIGNUP, RESPETANDO EL ORDEN DE LA MISMA.
require('./homepage');
require('./signup');
require('./signin');
require('./profile');

page();