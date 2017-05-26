module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    removelogging: {
      dist: {
        src: ["routes/**/*.js","services/**/*.js","utils/**/*.js","*.js"] // Each file will be overwritten with the output!
      }
    },
    copy: {
      main: {
        files: [{
          src: ['./sql-queries.xml'],
          dest: './../nodejobs/sql-queries.xml',
        }, {
          src: ['./mail.js'],
          dest: './../nodejobs/mail.js',
        }, {
          expand: true,
          cwd: './services',
          src: ['**/*'],
          dest: './../nodejobs/services'
        }, {
          expand: true,
          cwd: './config',
          src: ['**/*.js'],
          dest: './../nodejobs/config'
        }, {
          expand: true,
          cwd: './views',
          src: ['**/*'],
          dest: './../nodejobs/views'
        }, {
          expand: true,
          cwd: './utils',
          src: ['**/*'],
          dest: './../nodejobs/utils'
        }],
      },
    }
  });

  // Load the plugin that provides the "uglify" task.
  //grunt.loadNpmTasks('grunt-shell');
  //grunt.loadNpmTasks('grunt-contrib-sass');
  // grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-sass-watch');
  // grunt.loadNpmTasks('grunt-browser-sync');
  //grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks("grunt-remove-logging");
  // Default task(s).
  grunt.registerTask('default', ['copy']);

  // grunt.registerTask('run', ['browserSync', 'watch']);
  // grunt.registerTask('build', ['sass', 'shell']);
  //grunt.registerTask('nodesass', ['sass']);


};
