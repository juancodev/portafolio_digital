const gulp = require('gulp');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const babel = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const watchify = require('watchify');

sass.compiler = require('node-sass');

// function styles(){
//     //1. DONDE SE ENCUENTRA EL ARCHIVO ("SCSS").
//     return gulp.src('./index.scss')
//     //2. QUIEN LO VA A AUTOMATIZAR.
//     .pipe(sass())
//     //3. PARA CAMBIAR EL NOMBRE DE NUESTRO ARCHIVO.
//     .pipe(rename('app.css'))
//     //4. ¿DÓNDE SE GUARDARÁ EL ARCHIVO?
//     .pipe(gulp.dest('public'));
// }

// exports.styles = styles;

// function assets(){
//     return gulp.src('assets/*')
//     .pipe(gulp.dest('public'))
// }

// exports.assets = assets;

/*ESTA ES LA FORMA DE GENERAR UNA TAREA EN GULP CON "gulp.task(DENTRO VA A OBTENER LOS ESTILOS Y UNA FUNCIÓN) Y TRABAJA POR PASO O CANALES. (VERSIÓN 3).*/

gulp.task('styles', ()=>{
    return gulp.src('./index.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(rename('app.css'))
        .pipe(gulp.dest('./public'));
});

/*EN ESTE CASO, HAREMOS QUE LA CARPETA "PUBLIC" SEA VIRTUAL, ES DECIR, QUE EL USUARIO VA A PODER NAVEGAR EN ELLA Y VA A SER  AUTOMATIZADA PARA QUE LOS ARCHIVOS CON EXTENCIONES DISTINTAS A JS O CSS SEAN AGREGADAS A LA CARPETA PUBLIC*/

gulp.task('assets', ()=>{
return gulp.src('assets/*')
    .pipe(gulp.dest('public'));
});

/*EN ESTE CASO CREAMOS OTRA TAREA QUE NOS HAGA PROCEDER AUTOMÁTICAMENTE
GULP Y NOS CONVIERTA TODO EL CÓDIGO UTILIZANDO LAS FUNCIONES DE ECMASCRIPT.
*/

function compile(watch) {
    //ESTA VARIABLE NOS PERMITE VIGILAR EL ARCHIVO A MODIFICAR
    let bundle = browserify('./src/index.js', {debug: true});

    if (watch) {
      bundle = watchify(bundle);
        bundle.on('update', ()=>{
            console.log('--> Bundling...');
            rebundle();
        });
    };
    
    //ESTA FUNCION NOS PERMITE REALIZAR LOS CAMBIOS REQUERIDOS Y CONVERTIRLO EN ALGO QUE ENTIENDA GULP
    function rebundle() {
        bundle
        .transform(babel)
        .bundle()
        .on('error', function (err) {console.log(err), this.emit('end')})
        .pipe(source('index.js'))
        .pipe(rename('app.js'))
        .pipe(gulp.dest('public'))
    };
    
    //CREAMOS UNA CONDICIÓN EN DONDE NOS VA A AVISAR SI EL CAMBIO OCURRE O NO

    rebundle();
};

gulp.task('build', ()=> {
    return compile();
});

gulp.task('watch', ()=>{
    return compile(true);
});

// gulp.task('script', ()=>{
    // return gulp.src('script'),
    // browserify('./src/index.js')
    //*EN ESTE CASO, LA LÍNEA 51 NOS SIRVE PARA UTILIZAR LA ÚLTIMA VERSIÓN DE EMCSCRIPT*
    // .transform(babel)
    //*EN LA LINEA 53 NOS VA A TRANSFORMAR EL ARCHIVO DE BROWSERIFY A BABEL PARA PODER ASÍ DISFRUTAR DE LAS ÚLTIMAS VERSIONES DEL NAVEG.*
    // .bundle()
    //*EN ESTE CASO NOS VA A DEVOLVER DEL BUNDLE ALGO QUE ENTIENDA GULP.*
    // .pipe(source('index.js'))
    //source INDICA CUÁL SERÁ EL RECURSO EN AUTOMATIZAR, EN DONDE SE ENCUENTRA.
    // .pipe(rename('app.js'))
    // .pipe(gulp.dest('public'));
// });


//ESTA LÍNEA DE COMANDO SE ENCARGA DE VIGILAR LAS TAREAS AUTOMATIZADAS PARA CADA VEZ QUE SE ACTUALICE UN CAMBIO ELLOS LO NOTEN AUTOMÁTICAMENTE SIN TENER QUE EJECUTAR NUEVAMENTE EL COMANDO GULP.

// gulp.task('watch', ()=>{
//     gulp.watch('index.scss', gulp.series('style'));
//     gulp.watch('assets/*', gulp.series('assets'));
// });

//EN ESTE CASO ME TRAERÁ UNA TAREA CON DOS PARÁMETOS, UNO POR DEFECTO (default) Y UN ARRAY QUE GENERA VARIAS TAREAS PERO EN ESTE CASO SOLO LOS ESTILOS.

gulp.task('default', gulp.parallel('styles', 'assets', 'build'));
