/*
 **********************************************************************************
 *  Global Objects/Functions
 **********************************************************************************
 */

var sgjs = {};

/*
 **********************************************************************************
 *  Require.js Configuration
 **********************************************************************************
 */
requirejs.config({
  baseUrl: 'js',
  enforceDefine: true,
  urlArgs: 'bust=v1', // increment when modifying javascript
  paths: {
    'jquery': [
      '//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min',
      'libs/jquery-1.11.0.min'
    ],

    // plugins
    'jquery.styleguide': 'plugins/jquery.styleguide',
  },
  shim: {
    'jquery.styleguide' : {
      deps: ['jquery'],
      exports: 'jQuery.fn.styleguide'
    }
  },
  config: {
    'jquery.styleguide' : {
      'url': '/js/plugins/jquery.styleguide.js'
    }
  }
});

/*
 **********************************************************************************
 *  Site-wide init
 **********************************************************************************
 */
require(['jquery', 'jquery.styleguide'], function($) {
  // wait for DOM ready
  $(function() {
    // initialize the styleguide
    $.styleguide({
      position: 'fixed'
    });
  });
});