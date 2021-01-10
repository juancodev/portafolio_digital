const yo = require('yo-yo');

let el = yo`<footer class="site-footer">
  <div class="container">
    <div class="row">
      <div class="col s12 l3 center-align"><a href="#" data-activates="dropdown1" class="dropdown-button btn btn-flat">Idioma</a>
        <ul id="dropdown1" class="dropdown-content">
          <li><a href="#!"></a>Español</li>
        </ul>
      </div>
      <div class="col s12 l3 push-l6 center-align">
        © 2020 Portafolio Digital IUTAJS
      </div>
    </div>
  </div>
</footer>`

document.body.appendChild(el);