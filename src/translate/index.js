//ESTE ES PARA LAS FECHAS
const IntlRelativeFormat = require('intl-relativeformat');
//ESTE ES PARA LOS MENSAJES O TEXTOS
const IntlMessageFormat = require('intl-messageformat');
/* const IntlRelativeFormat = windown.IntlRelativeFormat = require('intl-relativeformat');
DE ESTA FORMA SE PUEDE COLOCAR EL FORMATO RELATIVO EN EL OBJETO DE WINDOWS GLOBAL */
let rf = new IntlRelativeFormat('es');
let output = rf.format();

let es = require('./es');
let en = require('./en-US');

const MESSAGES = {};
MESSAGES.es = es;
/* CON LOS CORCHETES EN PARENTESIS, SIRVEN PARA AGREGAR ESPACIOS ENTRE PROPIEDADES O CARACTERES ESPECIALES
MESSAGES['PODEMOS ESCRIBIR ESPACIOS ENTRE PROPIEDADES']
*/
MESSAGES['en-US'] = en;
//CREAMOS UNA VARIABLE QUE POR AHORA VA A ESTAR EN ESPAÑOL
let locales = 'es';

//opts = {}, NOS ENVIA UN OBJETO VACIO
module.exports = {
  message : function (text, opts = {}){
    let msg = new IntlMessageFormat(MESSAGES[locales][text], locales, null);
    return msg.format(opts)
  },
  date: new IntlRelativeFormat(locales)
}

/*  PROBLEMA CON LA INTERNACIONALIZACIÓN 4.20*/
