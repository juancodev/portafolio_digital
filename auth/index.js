const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const portafolio = require('portafolio_digital-client');
const jwt = require('jsonwebtoken');
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

//Creamos una estrategia para facebook
exports.facebookStrategy = new FacebookStrategy({
  clientID: config.auth.facebook.clientID,
  clientSecret: config.auth.facebook.clientSecret,
  callbackURL: config.auth.facebook.callbackURL,
  profileFields: ['id', 'displayname', 'email']
}, function (accessToken, refrehToken, profile, done) {
  let userProfile = {
    // estos campos son los que vienen directamente de facebook
    username: profile._json.id,
    name: profile._json.name,
    email: profile._json.email,
    facebook: true
  }

  findOrCreate(userProfile, (err, user) => {
    if (err) return done(err);

    //para crear un nuevo token
    jwt.sign({ userId: user.username }, config.secret, {}, (e, token) => {
      if (e) return done(e);

      //si todo sale bien
      user.token = token;
      return done(null, user);
    })
  })

  function findOrCreate(user, callback) {
    client.getUser(user.username, (err, usr) => {
      if (err) {
        return client.saveUser(user, callback)
      }

      callback(null, usr)
    })
  }
})

//con la propiedad facebook podemos verificar en nuestra base de datos si el usuario logeó con facebook o no


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
