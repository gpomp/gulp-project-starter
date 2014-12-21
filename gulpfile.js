var gulp = require('gulp'),
	gutil = require('gulp-util'),
	connect = require('gulp-connect'),
	watch = require('gulp-watch'),
	plumber = require('gulp-plumber'),
	less = require('gulp-less'),
	minifycss = require('gulp-minify-css'),
	ts = require('gulp-typescript'),
	concat = require('gulp-concat-sourcemap'),
	sourcemaps = require('gulp-sourcemaps'),
	eventStream = require('event-stream'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	notify = require('gulp-notify'),
	iconfont = require('gulp-iconfont'),
	iconfontCss = require('gulp-iconfont-css'),
	imagemin = require('gulp-imagemin'),
	del = require('del'), 
	debug = require('gulp-debug');


var config = {
	'env': 'prod',
	'app': 'app/',
	'dist': 'dist/',
	'bower' : 'app/js/vendor/'
};

config.base = config.app;


gulp.task('connect', function() {
  connect.server({
    root: 'app',
    livereload: true
  });
});

gulp.task('clean:dist', function (cb) {
  del([config.dist+'**'], cb);
});

gulp.task('copyfiles', function() {
	gulp.src(config.app+'*.html')
	.pipe(gulp.dest(config.dist));

	gulp.src(config.app+'fonts/*.*')
	.pipe(gulp.dest(config.dist+"fonts"));
});

gulp.task('less', function () {
	var src = config.app+"less/main.less";
	
	if (config.env == 'dev') {
		dest = config.app+"css";
		gulp.src(src)
			.pipe(plumber())
			.pipe(connect.reload())
			.pipe(less().on('error', gutil.log))
			.pipe(gulp.dest(dest));
	} else {
		dest = config.dist+"css";
		gulp.src(src)
			.pipe(less().on('error', gutil.log))
			.pipe(minifycss())
			.pipe(gulp.dest(dest));
	}
});

gulp.task('images-opt', function () {
    gulp.src(config.app + 'img/*.*')
        .pipe(imagemin())
        .pipe(gulp.dest(config.dist+'img'));
});

gulp.task('modernizr', function () {
	var src = [config.bower+'modernizr/modernizr.js'];
		
		
	if (config.env == 'dev') {
		dest = config.app+'js';
		gulp.src(src, {base: config.base})
			.pipe(plumber())
			.pipe(concat("modernizr.js"))
			.pipe(gulp.dest(dest));
	} else {
		dest = config.dist+'js';
		gulp.src(src, {base: config.base})
			.pipe(concat("modernizr.js"))
			.pipe(uglify({mangle: true}).on('error', gutil.log))
			.pipe(gulp.dest(dest));
	}

});



gulp.task('libscripts', function () {
	//JS lib list (from bower)
	/*
		config.app+"assets/vendor/jquery/dist/jquery.js",
		config.app+"assets/vendor/velocity/velocity.js",
		config.app+"assets/vendor/jquery-pjax/jquery.pjax.js",
		config.app+"assets/vendor/nprogress/nprogress.js",
		config.app+"assets/vendor/jquery.unorphan/jquery.unorphan.js",
		config.app+"assets/vendor/picturefill/dist/picturefill.js"
	*/
	var src = [];

	if (config.env == 'dev') {
		//Libs
		dest = config.app+'js';
		gulp.src(src, {base: config.base})
			.pipe(plumber())
			.pipe(concat("vendor.js"))
			.pipe(gulp.dest(dest));
	} else {
		dest = config.dist+'js';
		gulp.src(src, {base: config.base})
			.pipe(concat("vendor.js"))
			.pipe(uglify({mangle: true}).on('error', gutil.log))
			.pipe(gulp.dest(dest));
	}

});

var tsProject = ts.createProject({
    declarationFiles: true,
    noExternalResolve: true
});

gulp.task('scripts', function() {
    var tsResult = gulp.src('typescript/*.ts')
                       .pipe(ts(tsProject));

    return eventStream.merge(
        tsResult.dts.pipe(gulp.dest('app/definitions')),
        tsResult.js.pipe(gulp.dest('app/js'))
        .pipe(concat('app.js'))
    	.pipe(sourcemaps.write())
    	.pipe(gulp.dest(config.app+'js/'))
    );
});

gulp.task('minscripts', function () {
	
	if(config.env === 'dev') return;

	var src = [config.app+'js/app.js'], dest = config.dist+'js';
	gulp.src(src)
		.pipe(uglify({mangle: true, compress : {drop_console:true}}).on('error', gutil.log))
		.pipe(gulp.dest(dest));
});

var fontName = 'Glyph';

gulp.task('font', function () {
	gulp.src([config.app + 'glyph/*.svg'])
    .pipe(iconfontCss({
      fontName: fontName,
      path: config.app + 'fonts/templates/_icons.less',
      targetPath: '../less/generated/_icons.less',
      fontPath: '../fonts/'
    }))
    .pipe(iconfont({
      fontName: fontName
     }))
    .pipe(gulp.dest(config.app + 'fonts/'));
});

gulp.task('html', function () {
  gulp.src(config.app + '*.html')
    .pipe(connect.reload());
});

gulp.task('watch', function () {
	gulp.watch(config.app + "less/*.less", ['less']);
    gulp.watch(['typescript/**/*.ts', 'typescript/*.ts'], ['scripts']);
    gulp.watch([config.app + '*.html'], ['html']);
});

gulp.task('devconfig', function () {
    console.log('set env as dev...');
    config.env = 'dev';
});

gulp.task('dev', ['devconfig','common', 'connect', 'watch']);

gulp.task('prod', ['clean:dist', 'copyfiles', 'images-opt', 'common', 'minscripts']);

gulp.task('common', ['font', 'less', 'modernizr', 'libscripts', 'scripts'])

gulp.task('default',['prod']);