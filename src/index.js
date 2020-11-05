//EN ESTE CASO, REQUERIMOS EL MÓDULO PAGE PARA INICIALIZARLO.
const page = require('page');

//DESPUÉS REQUERIMOS LOS MÓDULOS DE LA HOMEPAGE Y SIGNUP, RESPETANDO EL ORDEN DE LA MISMA.
require('./homepage');
require('./signup');

page();