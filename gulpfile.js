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
const shell = require('gulp-shell');
const GulpSSH = require('gulp-ssh');
const moment = require('moment');

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



const config = {
    host: '192.168.0.1',
    port: 22,
    username: 'username',
    agent: process.env.SSH_AUTH_SOCK
};

const archiveName = 'deploy.tgz';
const timestamp = moment().format('YYYYMMDDHHmmssSSS');
const buildPath = './build';
const rootPath = '/home/project/root/directory/';
const releasesPath = rootPath + 'releases/';
const symlinkPath = rootPath + 'current';
const releasePath = releasesPath + timestamp;

const gulpSSH = new GulpSSH({
    ignoreErrors: false,
    sshConfig: config
});

gulp.task('deploy:compress', ['build'], shell.task("tar -czvf ./" + archiveName + " --directory=" + buildPath + " ."));

gulp.task('deploy:prepare', function() {
    return gulpSSH.exec("cd " + releasesPath + " && mkdir " + timestamp);
});

gulp.task('deploy:upload', ['deploy:prepare', 'deploy:compress'], function() {
    return gulp.src(archiveName)
        .pipe(gulpSSH.sftp('write', releasePath + '/' + archiveName))
});

gulp.task('deploy:uncompress', ['deploy:upload'], function() {
    return gulpSSH.exec("cd " + releasePath + " && tar -xzvf " + archiveName);
});

gulp.task('deploy:symlink', ['deploy:uncompress'], function() {
    return gulpSSH.exec("rm " + symlinkPath + " &&" +
        " ln -s " + releasePath + " " + symlinkPath);
});

gulp.task('deploy:clean', ['deploy:symlink'], shell.task('rm ' + archiveName, {ignoreErrors: true}));

gulp.task('clean:build', ['deploy:symlink'], function () {
    return gulp.start('clean')
});

gulp.task('deploy', ['build',
    'deploy:compress',
    'deploy:prepare',
    'deploy:upload',
    'deploy:uncompress',
    'deploy:symlink',
    'deploy:clean',
    'clean:build']);

