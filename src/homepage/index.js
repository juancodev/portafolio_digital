const page = require('page');

page('/', function (ctx, next) {
let main = document.getElementById('main-container');
main.innerHTML = '<h1 Prueba para navegar en el ><a href="/signup">Signup</a></h1>'
});