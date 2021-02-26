const yo = require('yo-yo');
const empty = require('empty-element');

let authCard = function (ctx) {
  let authenticated = yo`
    <div class="col s2 m6 push-s10 push-m10">
      <a href="#" class="btn btn-large btn-flat dropdown-button" data-activates="drop-user">
        <i class="fas fa-user-circle" aria-hidden="true"></i>
        ${ctx.auth.name}
      </a>
      <ul id="drop-user" class="dropdown-content">
        <li><a href="/logout" rel="external">Salir</a></li>
      </ul>
    </div>`

  let signin = yo`
    <div class="col s2 m6 push-s10 push-m10">
      <a href="/signin" class="btn btn-large btn-flat entrar">
        Entrar <i class="fas fa-sign-in-alt"></i>
      </a>
    </div>`

    if (ctx.auth) {
      return authenticated
    } else {
      return signin
    }
}

let renderHeader = function (ctx) {
  return  yo`<nav class="header">
      <div class="nav-wrapper">
        <div class="container">
          <div class="row">
            <div class="col s12 m6 offset-m1">
              <a href="/" class="brand-logo portafolio">Portafolio Digital</a>
            </div>
              ${authCard(ctx)}
            </div>
          </div>
        </div>
      </div>
    </nav>`;
}


module.exports = function header(ctx, next){
  var container = document.getElementById('header-container')
  empty(container).appendChild(renderHeader(ctx));
  $('.dropdown-button').dropdown({
    inDuration: 700,
    outDuration: 700,
    hover: true
  });
  next();
}