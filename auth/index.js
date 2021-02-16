const LocalStrategy = require('passport-local').Strategy;
const portafolio = require('portafolio_digital-client');
const config = require('../config');

let client = portafolio.createClient(config.client);

//en este caso, se pasa un callback llamado done que permite avisar si la función fue llamada correctamente.
exports.localStrategy = new LocalStrategy((username, password, done) => {
  client.auth(username, password, (err, token) => {
    if (err) {
      return done(null, false, { message: 'username y password no fueron encontradas' })
    }

    client.getUser(username, (err, user) => {
      if (err) {
        return done(null, false, { message: `hubo un error: ${err.message}` })
      }

      user.token = token
      return done(null, user)
    })
  })
})

//exportamos la serialización del usuario, que sería una función del usuario que vamos a exportar
exports.serializeUser = function (user, done) {
  done(null, {
    username: user.username,
    token: user.token
  });
}

//deserialización obtiene la referencia que almaceno en sesión
exports.deserializeUser = function (user, done) {
  client.getUser(user.username, (err, usr) => {
    if (err) return done(err)

    usr.token = user.token
    done(null, usr)
  });
}
