module.exports = ( grunt ) ->

  header =
    """
    /*! RecoilJS (Alpha) by Robert Messerle  |  https://github.com/robertmesserle/RecoilJS */
    /*! This work is licensed under the Creative Commons Attribution 3.0 Unported License. To view a copy of this license, visit http://creativecommons.org/licenses/by/3.0/. */
    """

  grunt.initConfig
    coffee:
      compile:
        expand: true
        cwd: 'src'
        src: [ '*.coffee', 'bindings/*.coffee' ]
        dest: 'tmp'
        ext: '.js'
        options:
          bare: true
    concat:
      options:
        stripBanners: true
        banner: "#{ header }\n\n(function($){\n"
        footer: "window.Recoil = Recoil;\n})(jQuery);"
      dist:
        src: [
          'tmp/main.js'
          'tmp/overrides.js'
          'tmp/bindings/base.js'
          'tmp/bindings/*.js'
          'tmp/parser.js'
          'tmp/core.js'
        ]
        dest: 'recoil.js'
    uglify:
      options:
        mangle: false
        banner: "#{ header }\n\n"
      compile:
        files: 'recoil.min.js': [ 'recoil.js' ]
    watch:
      scripts:
        files: [ 'src/*.coffee', 'src/**/*.coffee' ]
        tasks: [ 'coffee', 'concat', 'uglify', 'clean' ]
    clean: [ 'tmp' ]

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'default', [ 'coffee', 'concat', 'uglify', 'clean' ]
