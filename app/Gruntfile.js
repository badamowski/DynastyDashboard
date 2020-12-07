module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        mangle: false
      },
      build: {
        files: {
          'build/app.min.js': ['src/js/**/*.js']
        }
      }
    },
    processhtml: {
      options: {},
      dist: {
        files: {
          'build/index.html': ['src/index.html']
        }
      }
    },
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'src/css', src: '**', dest: 'build/css/'},
          {expand: true, cwd: 'src/img', src: '**', dest: 'build/img/'},
          {expand: true, cwd: 'src/pages', src: '**', dest: 'build/pages/'},
          {expand: true, cwd: 'src/lib', src: '**', dest: 'build/lib/'}
        ],
      },
    },
    clean: ['build']
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'uglify', 'processhtml', 'copy']);

};