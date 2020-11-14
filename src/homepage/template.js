const yo = require('yo-yo');
//EN ESTE CASO NO VAMOS A REQUERIR LA FUNCIÓN landing.

//REVISAR ERROR EN EL LOGO DEL FONT-AWESOME!!!!!!! CLASE 4.15

let template = yo `<nav class="header">
  <div class="nav-wrapper">
    <div class="container">
      <div class="row">
        <div class="col s12 m6 offset-m1">
          <a href="/" class="brand-logo portafolio">Portafolio Digital</a>
        </div>
        <div class="col s2 m6 push-m10">
          <a href="#" class="btn btn-large btn-flat dropdown-button" data-activates="drop-user">
          <i class="fas fa-user-circle"></i>
          </a>
          <ul id="drop-user" class="dropdown-content">
            <li><a href="#">Salir</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</nav>`;

module.exports = template;