'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true,
        },
      },
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          ignore: ['node_modules/**'],
          ext: 'js',
          legacyWatch: true,
        },
      },
    },
    eslint: {
      target: [
        'Gruntfile.js', 'server.js', 'express.js',
        'app/**/*.js', 'config/**/*.js', 'test/**/*.js', 'utils/**/*.js',
      ],
      options: {
        quiet: true,
        configFile: '.eslintrc',
      },
    },
    watch: {
      files: ['<%= eslint.target %>'],
      tasks: ['eslint'],
    },
    mochaTest: {
      unit: {
        src: ['test/unit/**/*.js'],
      },
      integration: {
        src: ['test/integration/**/*.js'],
      },
      component: {
        src: ['test/component/**/*.js'],
      },
      e2e: {
        src: ['test/e2e/**/*.js'],
      },
      // unit, integration, component
      uic: {
        src: [
          'test/unit/**/*.js',
          'test/integration/**/*.js',
          'test/component/**/*.js',
        ],
      },
      all: {
        src: ['test/**/*.js'],
      },
    },
    env: {
      development: {
        src: 'config/development.env',
      },
      test: {
        src: 'config/test.env',
      },
    },
    jsdoc: {
      dist: {
        src: ['app/**/*.js', 'config/**/*.js'],
        options: {
          destination: 'doc',
        },
      },
    },
  });

  // test task
  const description = 'Task running tests, first argument test type. Test types: ' +
    'unit, integration, component, e2e, uic (default), all.';
  grunt.registerTask('test', description, type => {
    const testType = type || 'all';
    const setEnv = process.env.SET_ENV_VARS !== 'false';
    const tasks = ['eslint'];
    if (setEnv) {
      tasks.push('env:test');
    }
    tasks.push(`mochaTest:${testType}`);
    grunt.task.run(tasks);
  });
  // dev & default tasks
  grunt.registerTask('dev', ['eslint', 'env:development', 'concurrent:dev']);
  grunt.registerTask('default', ['eslint', 'env:test', 'mochaTest']);
};
