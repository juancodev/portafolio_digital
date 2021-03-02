const yo = require('yo-yo');
//NO ES IMPORTANTE COLOCAR EL ARCHIVOS INDEX, YA QUE SI TUVIERA OTRO NOMBRE SÍ FUERA NECESARIO.
const landing = require('../landing/index');

let signinForm = yo `<div class="col s12 m7">
              <div class="row">
                <div class="signup-box">
                  <h1 class="portafolio">Portafolio Digital</h1>
                  <form class="signup-form" action="/login" method="POST">
                    <div class="section">
                      <a href="/auth/facebook" rel="external" class="btn btn-fb disabled hide-on-small-only">Iniciar sesión con Facebook</a>
                      <a href="/auth/facebook" rel="external" class="btn btn-fb hide-on-med-and-up"><i class="fab fa-facebook-square"></i> Iniciar sesión</a>
                    </div>
                    <div class="divider"></div>
                    <div class="section">
                      <input type="text" name="username" placeholder="Nombre de usuario" />
                      <input type="password" name="password" placeholder="Contraseña" />
                      <button class="btn waves-effect waves-light btn-signup" type="submit">Inicia Sesión</button>
                    </div>
                  </form>
                </div>
              </div>
              <div class="row">
                <div class="login-box">
                  ¿No tienes una cuenta? <a href="/signup">Regístrate</a>
                </div>
              </div>
            </div>`;

module.exports = landing(signinForm);