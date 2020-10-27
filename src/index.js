const page = require('page');
const main = document.getElementById('main-container');

page('/', function (ctx, next) {
main.innerHTML = 'Home, pulsa para navegar <a href="/signup">signup</a>';
});

page('/signup', function (){
main.innerHTML = 'signup, pulsa para navegar <a href="/">Home</a>';  
});

page();