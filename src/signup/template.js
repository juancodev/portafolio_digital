const yo = require('yo-yo');
//NO ES IMPORTANTE COLOCAR EL ARCHIVOS INDEX, YA QUE SI TUVIERA OTRO NOMBRE SÍ FUERA NECESARIO.
const landing = require('../landing/index');

let signupForm = yo `<div class="col s12 m7">
              <div class="row">
                <div class="signup-box">
                  <h1 class="portafolio">Portafolio Digital</h1>
                  <form class="signup-form" action="/signup" method="POST">
                    <h2>¡Regístrate para subir tus proyectos personales y poder demostrar tus habilidades!</h2>
                    <div class="section">
                      <a class="btn btn-fb disabled hide-on-small-only">Iniciar sesión con Facebook</a>
                      <a class="btn btn-fb disabled hide-on-med-and-up"><i class="fab fa-facebook-square"></i> Iniciar sesión</a>
                    </div>
                    <div class="divider"></div>
                    <div class="section">
                      <input type="email" name="email" placeholder="Correo electrónico" />
                      <input type="text" name="name" onkeypress="${onlyWord}" placeholder="Nombre completo" />
                      <input type="text" name="username" placeholder="Nombre de usuario" />
                      <input type="password" name="password" placeholder="Contraseña" />
                      <button class="btn waves-effect waves-light btn-signup" type="submit">Regístrate</button>
                    </div>
                  </form>
                </div>
              </div>
              <div class="row">
                <div class="login-box">
                  ¿Tienes una cuenta? <a href="/signin">Entrar</a>
                </div>
              </div>
            </div>`;

  function onlyWord (ev) {
    //capturar la entrada del teclado
    let key = ev.keyCode || ev.which;
    let teclado = String.fromCharCode(key);
    let letra = " abcdefghijklmnñopqrstuvwxyz";
    let especiales = "8-164";
    let teclado_especial = false;

    for (let i in especiales) {
      if (key == especiales[i]) {
        teclado_especial = true;
        break
      }
    }
    if (letra.indexOf(teclado) === -1 && !teclado_especial) {
      return false;
    }
  }


module.exports = landing(signupForm);