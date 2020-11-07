const page = require('page');

page('/', function () {
let main = document.getElementById('main-container');
main.innerHTML = '<a href="/signup">Signup</a>'
});