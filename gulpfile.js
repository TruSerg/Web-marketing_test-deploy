const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const watch = require('gulp-watch');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const pug = require('gulp-pug');
const del = require('del');
const fs = require('fs')
const path = require('path') 
const data = {} 

gulp.task('json', (callback) => {
    try { 
        const modules = fs.readdirSync('src/data/') 
        modules.forEach(json => { 
            const name = path.basename(json, path.extname(json)) 
            const file = path.join('./src/data', json) 
            return data[name] = JSON.parse(fs.readFileSync(file)) 
        }) 
    } catch(e) {
        console.log(e)
    } 
    callback()
})

gulp.task('pug', (callback) => {
	return gulp.src('./src/pug/page/**/*.pug')
		.pipe( plumber({
			errorHandler: notify.onError(function(err){
				return {
					title: 'Pug',
					sound: false,
					message: err.message
				}
			})
		}))
		.pipe( pug({
			pretty: true,
			locals : {
				data: data
			}
		}))
		.pipe( gulp.dest('./build/'))
        .pipe(browserSync.stream())
        callback()
});

gulp.task('scss', function(callback){
    return gulp.src('./src/scss/main.scss')

        .pipe(plumber({
            errorHandler: function(err) {
            notify.onError({
                title: "Ошибка в CSS",
                message: "<%= error.message %>"
            })(err);
            }
        }))

        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 4 versions'],
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css/'))
        .pipe(browserSync.stream())
    callback(); 
})

gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./build/"
        }
    });
});

gulp.task('copy:img', function() {
    return gulp.src('./src/assets/img/**/*.*')
        .pipe(gulp.dest('./build/assets/img/'))
})

gulp.task('copy:fonts', function() {
    return gulp.src('./src/assets/fonts/**/*.*')
        .pipe(gulp.dest('./build/assets/fonts/'))
})

gulp.task('copy:js', function() {
    return gulp.src('./src/js/**/*.*')
        .pipe(gulp.dest('./build/js/'))
})

gulp.task('swiper:js', function() {
    const modules = [
        'node_modules/swiper/swiper-bundle.min.js',
        'node_modules/swiper/swiper-bundle.min.js.map',
        ];

        return gulp.src(modules)
        .pipe(gulp.dest('build/js'));
})

gulp.task('swiper:css', function() {
    const modules = [
        'node_modules/swiper/swiper-bundle.min.css',
        ];

        return gulp.src(modules)
        .pipe(gulp.dest('build/css'));
})

gulp.task('watch', function() {
    watch('./build/img', gulp.parallel( browserSync.reload))
    watch('build/**/*.css', gulp.parallel( browserSync.reload ))
    watch(['./src/scss/**/*.scss'], gulp.parallel('scss'))
    watch(['./src/pug/**/*.pug', './src/data/**/*.json'], gulp.parallel('json', 'pug'))
    watch('./src/data/**/*.json', gulp.parallel('pug'))
    watch('./src/assets/img/**/*.*', gulp.parallel('copy:img'))
    watch('./src/assets/fonts/**/*.*', gulp.parallel('copy:fonts'))
    watch('./src/js/**/*.*', gulp.parallel('copy:js'))
})

gulp.task('delet', function() {
    return del('./build')
})

gulp.task(
    'default',
    gulp.series(
        gulp.parallel('delet'),
        gulp.parallel('scss', 'json', 'copy:img', 'copy:fonts', 'pug', 'copy:js', 'swiper:css', 'swiper:js'),
        gulp.parallel('server', 'watch')
    )
)

