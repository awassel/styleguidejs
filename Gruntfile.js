var syncsrc = [ '**', '!**/sass/**' ];

module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({

    jshint: { options: [ 'src/js/plugins/jquery.styleguide.js' ] },

    sync: {
      dev: {
        files: [
          { cwd: 'src', src: syncsrc, dest: 'build/dev' }
        ]
      },
      release: {
        files: [
          { cwd: 'src', src: syncsrc, dest: 'build/release' }
        ],
        verbose: true
      }
    },

    compass: {
      options: { sassDir: 'src/sass', require: [ 'breakpoint' ]},
      dev: { options: { cssDir: 'build/dev/stylesheets' } },
      release: { options: { outputStyle: 'compressed', cssDir: 'build/release/stylesheets' } }
    },

    uglify: {
      dev: {
        options: {
          mangle: true,
          sourceMap: true
        },
        files: {
          'build/dev/js/main.libs.js': [
            'build/dev/js/libs/jquery-1.11.0.min.js',
            'build/dev/js/libs/modernizr-2.8.1.min.js'
          ]
        }
      },
      release: {
        options: {
          beautify: true,
          compress: false,
          mangle: false,
          sourceMap: true
        },
        files: {
          'build/release/js/main.libs.js': [
            'build/release/js/libs/jquery-1.11.0.min.js',
            'build/release/js/libs/modernizr-2.8.1.min.js'
          ]
        }
      }
    },

    open: { file: { path: 'build/release/bcc-output.txt' } },

    watch: {
      files: { files: 'src/**/*.*', tasks: ['sync:dev','uglify:dev'] },
      css: { files: 'src/**/*.scss', tasks: ['compass:dev'] }
    }


  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-sync');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-open');

  // Default task
  grunt.registerTask('default', [
    'jshint',
    'sync',
    'compass',
    'uglify',
    'watch'
  ]);


  // Target-specific tasks

  // Dev
  grunt.registerTask('dev', [
    'jshint',
    'sync:dev',
    'compass:dev',
    'uglify:dev',
  ]);

  // Release
  grunt.registerTask('release', [
    'jshint',
    'sync:release',
    'compass:release',
    'uglify:release',
    'open'
  ]);

};