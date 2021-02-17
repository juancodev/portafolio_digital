const axios = require('axios');

async function loadAuth (ctx, next) {
  try {
    let whoami = await axios.get('/whoami').then(res => res.data)
    //Si whoami tiene un nombre de usuario es porque es un usuario logeado
    if (whoami.username) {
      ctx.auth = whoami;
    } else {
      ctx.auth = false
    }
    next();
  } catch (err) {
    return console.log(err);
  }
}

exports.loadAuth = loadAuth;