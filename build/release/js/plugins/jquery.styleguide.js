/*
 *     ______  ______  __  __  __      ______  ______  __  __  __  _____   ______      __  ______
 *    /\  ___\/\__  _\/\ \_\ \/\ \    /\  ___\/\  ___\/\ \/\ \/\ \/\  __-./\  ___\    /\ \/\  ___\
 *    \ \___  \/_/\ \/\ \____ \ \ \___\ \  __\\ \ \__ \ \ \_\ \ \ \ \ \/\ \ \  __\   _\_\ \ \___  \
 *     \/\_____\ \ \_\ \/\_____\ \_____\ \_____\ \_____\ \_____\ \_\ \____-\ \_____\/\_____\/\_____\
 *      \/_____/  \/_/  \/_____/\/_____/\/_____/\/_____/\/_____/\/_/\/____/ \/_____/\/_____/\/_____/
 *
 * ==================================================================================================
 *  A jQuery plugin to create a digital "styleguide"
 *  v1.0.0
 * --------------------------------------------------------------------------------------------------
 *  Developed by Addam Wassel (http://wasseldesign.com / @addam)
 *  Heavily influenced by:
 *  - Pattern Lab (http://pattern-lab.info/)
 *  - Starbucks (http://www.starbucks.com/static/reference/styleguide/)
 * ==================================================================================================
 */

 ;(function($) {
  // define variables
  var sg, prefix, eventname, templates, settings, _throttle;

  // set namespace for plugin
  sg = 'styleguide';

  // set short namespace for plugin
  prefix = 'sg';

  // set custom event name
  eventname = prefix + '-event';

  // create template items to use throughout the plugin
  templates = {
    $window: $(window),
    $header: $('<header />', { 'id': prefix + '-panel', 'role': 'banner' }),
      $left: $('<div />', { 'id': prefix + '-left' }),
        $menubutton: $('<button />', { 'id': prefix + '-toggle', 'text': 'Menu' }),
        $list:  $('<ol />', { 'class': prefix + '-list'}),
      $right: $('<div />', { 'id': prefix + '-right' }),
        $size:  $('<div />', { 'id': prefix + '-size'}),
          $sizeform: $('<form class="' + prefix + '-size-form">' +
                  'Size <input type="text" class="' + prefix + '-input ' + prefix + '-size-px" value="320">px /' +
                  '<input type="text" class="' + prefix + '-input ' + prefix + '-size-em" value="20">em' +
                '</form>'),
          $sizepresets: $('<div class="' + prefix + '-size-presets">' +
                  '<a href="#" class="' + prefix + '-preset" data-width="320">Phone</a>' +
                  '<a href="#" class="' + prefix + '-preset" data-width="768">Tablet</a>' +
                  '<a href="#" class="' + prefix + '-preset" data-width="1280">Desktop</a>' +
                  '<a href="#" class="' + prefix + '-preset">Full</a>' +
                '</div>'),
        $options:   $('<div />', { 'class': prefix + '-options' }),
          $optionsbutton: $('<button />', { 'id': prefix + '-options-toggle', 'text': 'Options' }),
          $optionslist: $('<ul />', { 'id': prefix + '-options-list' }),
    $viewport: $('<div />', { 'id': prefix + '-viewport' }),
      $viewportIframe: $('<iframe />', { 'id': prefix + '-iframe-viewport', 'name': prefix + '-iframe', 'height': '100%', 'width': '100%', 'frameborder': '0' })
  };

  // plugin definition
  $.fn[sg] = function(options) {
    // slice arguments to leave only arguments after function name
    var args = Array.prototype.slice.call(arguments, 1);

    // return each plugin with public methods
    return this.each(function() {
      var item = $(this),
          settings = $.extend({}, $.fn[sg].defaults, options),
          instance = item.data(sg);

      if(!instance) {
        // create plugin instance and save it in data
        item.data(sg, new $[sg]($(this), settings));
      } else {
        // if instance already created call method
        if(typeof options === 'string') {
          instance[options].apply(instance, args);
        }
      }
    });
  };

  // plugin defaults
  $.fn[sg].defaults = {
    // Element Definitions
    container:      $('body'),                // define container where sections are located
    sections:       $('.section'),            // define sections of the styleguide
    tocHolder:      $('.toc-holder'),         // define holder where table of contents will be appended. this won't do anything if the 'position' property is set to 'fixed'.

    // Class Definitions
    prefix:         'sg',                     // define prefix for elements
    compactClass:   'compact',                // define class for compact navigation

    // Settings
    throttle:       250,                      // throttle timeout for resizes
    scrollSpeed:    500,                      // speed of scrolling
    responsive:     true,                     // use responsive compact navigation when necessary
    collapsible:    true,                     // use collapsible subnavigation
    position:       'none',                   // positioning for table of contents. choices: none, fixed, absolute
    animSpeed:      500,                      // speed of animation on iframe resize

    // Show Table of Contents
    toc:            true,

    // Show Resize Bar
    size:           true,                     // show browser width options
    presets:        true,                     // show size presets

    // Syntax Highlighting
    highlighting:   true,                     // turn on syntax highlighting on navigation
    highlightClass: 'current',                // define class used for navigation highlighting

    // Grid Options
    grid:           true,                     // show grid option
    columns:        12,                       // number of column in grid
    columnClass:    'col span-1',             // the class of one column

    // Baseline
    baseline:       true                      // show baseline option
  };

  // plugin constructor
  $[sg] = function($sg, settings) {

    // $sg is not defined so attach to the $('body')
    if($sg == null && settings == null) {
      // $.styleguide()
      $('body')[sg]();
      return;
    };

    if ($sg != null && !($sg instanceof jQuery)) {
      // $.styleguide({settings});
      $('body')[sg]($sg);
      return;
    };

    this.$sg = $sg;
    this.settings = settings;

    // constructor call
    this.init();
  };

  // plugin object
  $[sg].prototype = {

    init: function() {
      if(window.self !== window.top) {
        return;
      }

      // cache proxy'd DOM methods
      this.bOnResize = $.proxy(this.onResize, this);
      this.bOnCustomEvent = $.proxy(this.onCustomEvent, this);
      this.bSetIframeHeight = $.proxy(this._setIframeHeight, this);

      // store settings for later use
      this.settings.container = this.$sg;
      this.settings.$wrapper = this.settings.container;
      this.settings.useSizing = this.settings.size || this.settings.presets;
      this.settings.setIframeHeight = this.bSetIframeHeight;

      // since we're using the size option, create the iframe. otherwise, just wrap our contents
      this.settings.useSizing ? this._setSizeIframe() : this._setViewport();
    },

    /*
     * ===============================================
     *  Private Methods
     * ===============================================
     *  0.0 Events
     *  0.0 Table of Contents
     *  0.0 Size
     *  0.0 Options
     *  0.0 Styles
     * ===============================================
     */

    _setSizeIframe: function () {
      // grab our contents and put them in the iframe
      $.ajax(window.location.href)
        .done($.proxy(function (data) {
          // prepend it to the container
          templates.$viewport.append(templates.$viewportIframe);
          this.settings.container.prepend(templates.$viewport);

          // set the contents of the current page into the iframe
          var $iframe = $('#' + templates.$viewportIframe.attr('id')),
              iframe = $iframe[0].contentWindow.document;

          $iframe[0].onload = $.proxy(function () {
            // remove contents of parent
            $('body').contents().not('script, #' + templates.$viewport.attr('id')).remove();

            // now that our iframe has been created, set a reference to it
            this.settings.$wrapper = $('#' + templates.$viewportIframe.attr('id')).contents().find('body');
            this.settings.sections = this.settings.$wrapper.find('.' + this.settings.sections.attr('class'));
            this._build();
          }, this);

          iframe.open();
          iframe.write(data);
          iframe.close();

        }, this));
    },

    _setViewport: function () {
      $('body').children().not('script').wrapAll(templates.$viewport);
      this._build();
    },

    _setIframeHeight: function () {
      if(this.settings.useSizing && this.settings.position !== 'fixed') {
        var $viewport = $('#' + templates.$viewport.attr('id')),
            vheight = $viewport.data('height'),
            height = $(window.frames[templates.$viewportIframe.attr('name')].document).outerHeight();

        $viewport
          .css('height', '')
          .css('height', $(window.frames[templates.$viewportIframe.attr('name')].document).outerHeight())
          .data('height', height);

        $('#' + templates.$viewportIframe.attr('id')).attr('scrolling', 'no');
      }
    },

    _build: function () {
      // setup options
      if(this.settings.toc) this._toc.init(this.settings);
      this._size.init(this.settings);
      this._options.init(this.settings);

      // this._styles.init(this.settings);

      // add floated right elements
      templates.$right.appendTo(templates.$header);

      // add floated left elements
      templates.$menubutton.prependTo(templates.$left);
      templates.$left.appendTo(templates.$header);

      // set dimensions for later use
      this._setDimensions();

      // set our header based on the position setting
      this.settings.position === 'fixed' ? this._fixedHeader() : this._unfixedHeader();

      // if not responsive, set style
      if(!this.settings.responsive) templates.$header.addClass('not-responsive');

      this._attachEvents('bind');
      this._checkSize();
      this._setIframeHeight();

      // set up our styles based on the settings
      this._setStyles();

      // now that we've grabbed our breakpoint, let's fade in the header
      $('#' + templates.$header.attr('id')).fadeIn();
    },

    _checkSize: function () {
      if(this.settings.responsive) {
        var leftWidth = $('#' + templates.$left.attr('id')).data('width'),
          rightWidth = $('#' + templates.$right.attr('id')).data('width'),
          elementWidth = leftWidth + rightWidth + 50;

        $('#' + templates.$header.attr('id'))[elementWidth <= this.settings.container.width() ? 'removeClass' : 'addClass'](this.settings.compactClass);
      }
    },

    _setDimensions: function () {
      // now that our options have been set, let's append the header to our container
      templates.$header
        .prependTo(this.settings.container)
        .css({ 'width': '100000%', 'position': 'absolute', 'top': '-1000000%' }); // hide the nav so we can grab dimensions for responsive navigation

      // grab the dimensions
      $('#' + templates.$header.attr('id')).data('height', $('#' + templates.$header.attr('id')).outerHeight(true));
      $('#' + templates.$right.attr('id')).data('width', $('#' + templates.$right.attr('id')).outerWidth(true));
      $('#' + templates.$left.attr('id')).data('width', $('#' + templates.$left.attr('id')).outerWidth(true));

      // hide the header again
      $('#' + templates.$header.attr('id')).removeAttr('style').hide();
    },

    _fixedHeader: function () {
      templates.$header.css('position', 'fixed');
      $('#' + templates.$viewport.attr('id')).css('top', $('#' + templates.$header.attr('id')).data('height') + 'px');
    },

    _unfixedHeader: function () {
      templates.$header.prependTo(this.settings.container);

      if(this.settings.position == 'absolute') {
        templates.$header.css('position', 'absolute');
      }
    },

    _setStyles: function () {
      $('html')
        .addClass(this.settings.position !== 'fixed' ? prefix + '-position-relative' : prefix + '-position-fixed') // add size class
        .addClass(this.settings.useSizing ? prefix + '-size' : 'no-' + prefix + '-size') // add size class
        .addClass($('#' + templates.$left.attr('id')).children(':not(#' + templates.$menubutton.attr('id') + ')').length > 0 ? prefix + '-left' : 'no-' + prefix + '-left'); // add table of contents class
    },


    // ================================================
    //  EVENTS
    // ================================================

    _attachEvents: function (action) {
      $(window)[action]('resize orientationchange', _throttle(this.bOnResize, this.settings.throttle));
      $(document)[action](eventname, this.bOnCustomEvent);
    },

    onResize: function (event) {
      this._checkSize();
      this._setIframeHeight();
    },

    onCustomEvent: function (event) {
      if(event.category === 'widthResize') {
        var width = event.width;
        this._options.grid.updateWidth(width);
      }
    },



    /*
     * ===============================================
     *  TABLE OF CONTENTS
     * ===============================================
     */

    _toc: {
      subnavClass: 'drop-down',
      activeClass: 'active',

      init: function (settings) {
        // cache DOM elements
        this.settings = settings;

        // cache DOM elements
        this.$window = $(this.settings.useSizing || this.settings.presets ? window.frames[templates.$viewportIframe.attr('name')] : window);

        // set sections to pass to createList()
        var sections = this.settings.sections.first().parent().children('.' + this.settings.sections.attr('class'));

        // cache proxy'd DOM methods
        this.bOnScoll = $.proxy(this.onScoll, this);
        this.bOnSubmenuClick = $.proxy(this.onSubmenuClick, this);
        this.bOnJumpClick = $.proxy(this.onJumpClick, this);
        this.bOnMenuClick = $.proxy(this.onMenuClick, this);

        // create list
        this.createList(sections, templates.$list);

        // cache DOM elements
        this.$links = templates.$list.find('a');
        this.$sublinks = templates.$list.find('.drop-arrow');
        this.$jumplinks = templates.$list.find('a:not(.drop-arrow)');

        // attach element events
        this.attachEvents();
      },

      createList: function (sections, list, parentIndex) {
        var $container = this.settings.tocHolder.length ? this.settings.$wrapper.find('.' + this.settings.tocHolder.attr('class')) : templates.$left;

        sections.each($.proxy(function (index, element) {
          var className = this.settings.sections.attr('class'),
              header = $(element).data('section-title') !== undefined ? $(element).data('section-title') : $(element).find(':first(:header)').text(),
              hash = this.settings.prefix + '-' + className + '-' + (parentIndex != undefined ? (parentIndex + 1) + '-' : '') + (index + 1),
              $item = $('<li />')
              $link = $('<a />', {
                'class': this.settings.prefix + '-links',
                'href': '#' + hash
              });

          $(element).attr('id', hash);
          $link.append(header);
          $item.append($link);

          var subsections = $(element).children('.' + className);
          var clickable = $('<a />', { 'class': 'drop-arrow' });
          if (subsections.length > 0) {
            $item.addClass(this.subnavClass).append(clickable);
            var sublist = $('<ul/>');
            this.createList(subsections, sublist, index);
            sublist.appendTo($item);
          }

          $item.appendTo(list);
        }, this));

        templates.$list.appendTo($container);
      },

      // ---------------------------
      //  TABLE OF CONTENTS EVENTS
      // ---------------------------

      attachEvents: function () {
        this.$sublinks.bind('click', this.bOnSubmenuClick);
        this.$jumplinks.bind('click', this.bOnJumpClick);
        if(this.settings.responsive) templates.$menubutton.bind('click', this.bOnMenuClick);
        if(this.settings.highlighting) this.$window.bind('scroll', this.bOnScoll);
      },

      onSubmenuClick: function (event) {
        var target = event.currentTarget, $target = $(target);

        // prevent default action
        event.preventDefault();
        $target.parent().toggleClass(this.activeClass).siblings('.' + this.activeClass).removeClass(this.activeClass);
      },

      onMenuClick: function (event) {
        // prevent default action
        event.preventDefault();
        templates.$list.toggleClass(this.activeClass);

        if(!templates.$list.hasClass(this.activeClass)) {
          this.$links.parent().removeClass(this.activeClass);
        }
      },

      onJumpClick: function (event) {
        var target = event.currentTarget, $target = $(target),
            href = $target.attr('href'),
            position = this.settings.$wrapper.find(href).offset().top,
            $scroller = this.settings.position === 'fixed' ? $(this.settings.$wrapper).add(this.settings.$wrapper.parent()) : $('html, body');

        if(this.settings.position == 'fixed' && !this.settings.size) {
          position -= parseInt($('#' + templates.$viewport.attr('id')).css('margin-top'), 10);
        }

        // prevent default action
        event.preventDefault();

        // remove active classes on list items
        this.$links.parent().removeClass(this.activeClass);

        // if responsive, close navigation
        if(this.settings.responsive) templates.$list.removeClass(this.activeClass);

        $scroller.animate({ scrollTop: position }, this.settings.scrollSpeed, $.proxy(function () {
          if(window.history) {
            window.history.pushState(null, document.title, href);
          } else {
            window.location.hash = href;
          }
        }, this));
      },

      onScoll: function (event) {
        var currentPosition = this.$window.scrollTop();
        this.settings.sections.each($.proxy(function(index, element) {
          var top = $(element).offset().top,
              bottom = top + $(element).height();

          if(this.settings.position == 'fixed') {
            top -= parseInt($('#' + templates.$viewport.attr('id')).css('margin-top'), 10) + 5; // adds space for scroll
          }

          if (currentPosition >= top && currentPosition <= bottom) {
            this.$links.parent().removeClass(this.settings.highlightClass).eq(index).addClass(this.settings.highlightClass);

            if(this.$links.parent().eq(index).closest('.' + this.subnavClass).length) {
              this.$links.parent()
                .eq(index).closest('.' + this.subnavClass)
                .removeClass(this.settings.highlightClass)
                .addClass(this.settings.highlightClass);
            };
          }
        }, this));
      }
    },


    // ================================================
    //  SIZE
    // ================================================

    _size: {

      init: function (settings) {
        // cache DOM elements
        this.settings = settings;
        this.width = this.settings.container.width();

        // append to header
        if(this.settings.useSizing) {
          if(this.settings.size) templates.$sizeform.appendTo(templates.$size);
          if(this.settings.presets) templates.$sizepresets.appendTo(templates.$size);
          templates.$size.appendTo(templates.$right);
        }

        // cache DOM elements
        this.$inputs = templates.$size.find('.' + this.settings.prefix + '-input');
        this.$presets = templates.$size.find('.' + this.settings.prefix + '-preset');

        this.updateWidth(this.width, true);

        // cache proxy'd DOM methods
        this.bOnBlur = $.proxy(this.onBlur, this);
        this.bOnResize = $.proxy(this.onResize, this);
        this.bOnKeypress = $.proxy(this.onKeypress, this);
        this.bOnPresetClick = $.proxy(this.onPresetClick, this);

        // attach element events
        this.attachEvents();
      },

      updateWidth: function (value, pixel) {
        var em = parseInt($('html').css('font-size').replace('px', ''), 10),
            widthPx, widthEm;

        if(pixel) {
          widthPx = value;
          widthEm = Math.round(((value/em) + 0.00001) * 100) / 100;
        } else {
          widthPx = Math.round(value * em);
          widthEm = value;
        }

        templates.$size.find('.' + this.settings.prefix + '-size-px').val(widthPx);
        templates.$size.find('.' + this.settings.prefix + '-size-em').val(widthEm);

        this.width = widthPx;

        $('#' + this.settings.prefix + '-viewport').stop(true).animate({ 'width': this.width }, this.settings.animSpeed, $.proxy(function () {
          this.settings.setIframeHeight();
        }, this));

        // trigger event for other options
        $(document).trigger({
          'type': eventname,
          'category': 'widthResize',
          'width': widthPx
        });
      },

      // -----------------------
      //  SIZE EVENTS
      // -----------------------

      attachEvents: function () {
        $(window).bind('resize orientationchange', _throttle(this.bOnResize));
        this.$inputs.bind('blur', this.bOnBlur).bind('keypress', this.bOnKeypress);
        this.$presets.bind('click', this.bOnPresetClick);
      },

      onBlur: function (event) {
        var target = event.currentTarget, $target = $(target),
            value = $target.val();

        this.updateWidth(value, $target.hasClass(this.settings.prefix + '-size-px'));
      },

      onKeypress: function (event) {
        var target = event.currentTarget, $target = $(target),
            code = event.keyCode || event.which;

        if(code == 13) {
          event.preventDefault();
          $target.trigger('blur');
        }
      },

      onResize: function (event) {
        this.updateWidth(this.settings.container.width(), true);
      },

      onPresetClick: function (event) {
        var target = event.target, $target = $(target),
            width = $target.data('width') ? $target.data('width') : this.settings.container.width();

        event.preventDefault();

        this.updateWidth(width, true);
      }
    },


    // ================================================
    //  OPTIONS
    // ================================================

    _options: {
      activeClass: 'active',

      init: function (settings) {
        // cache DOM elements
        this.settings = settings;

        // create list
        this.$list = $('<ul />');

        if(this.settings.grid) this.grid.init(this.settings);
        if(this.settings.baseline) this.baseline.init(this.settings);

        templates.$optionsbutton.appendTo(templates.$options);
        templates.$optionslist.appendTo(templates.$options);
        templates.$options.appendTo(templates.$right);

        // cache DOM elements
        this.$buttons = templates.$optionslist.find('button');

        // cache proxy'd DOM methods
        this.bOnButtonsClick = $.proxy(this.onButtonsClick, this);
        this.bOnMenuClick = $.proxy(this.onMenuClick, this);

        // attach element events
        this.attachEvents();
      },

      attachEvents: function () {
        this.$buttons.bind('click', this.bOnButtonsClick);
        if(this.settings.responsive) templates.$optionsbutton.bind('click', this.bOnMenuClick);
      },

      onButtonsClick: function (event) {
        var target = event.currentTarget, $target = $(target),
          option = $target.data('option');

        if ($target.hasClass('on')) {
          this[option].off();
          $target.removeClass('on');

          if (typeof(Storage) !== 'undefined') {
            localStorage.removeItem('debug-' + option);
          }
        } else {
          this[option].on();
          $target.addClass('on');

          if (typeof(Storage) !== 'undefined') {
            localStorage.setItem('debug-' + option, true);
          }
        }
      },

      onMenuClick: function (event) {
        // prevent default action
        event.preventDefault();
        templates.$optionslist.toggleClass(this.activeClass);
      },

      grid: {
        $template: $('<li><button data-option="grid">Grid</button></li>'),

        init: function (settings) {
          // cache DOM elements
          this.settings = settings;
          this.id = this.settings.prefix + '-grid';

          this.$template.appendTo(templates.$optionslist);
        },

        off: function () {
          this.settings.$wrapper.find('#' + this.id).remove();
        },

        on: function () {
          var i;
          var columns = this.settings.columns;
          var grid = ['<div id="' + this.id + '">'];
          var row = '<div class="row">';

          grid.push(row);

          for (i = 0; i <= (columns - 1); i++) {
            grid.push('<div class="' + this.settings.columnClass + '"></div>');
          }

          grid.push('</div></div>');

          this.settings.$wrapper.append(grid.join(''));
        },

        updateWidth: function (width) {
          $('#' + this.id).stop(true).animate({
            'width': width
          });
        }
      },

      baseline: {
        $template: $('<li><button data-option="baseline">Baseline</button></li>'),

        init: function (settings) {
          // cache DOM elements
          this.settings = settings;
          this.id = this.settings.prefix + '-baseline';

          // append to bar
          this.$template.appendTo(templates.$optionslist);
        },

        off: function () {
          this.settings.$wrapper.find('#' + this.id).remove();
        },

        on: function () {
          var fontSize = parseInt($('html').css('font-size').replace('px', ''), 10),
              lineHeight = function () {
                var value = $('body').css('line-height');
                return (value.indexOf('px') > -1) ? value.replace('px', '') : value * fontSize;
              },
              baselineAdjust = -10,
              baselineHeight = (lineHeight() - 1) / fontSize,
              baselineLength = this.settings.$wrapper.height() / lineHeight(),
              i,
              output = [];

          for (i = 0; i <= baselineLength; i++) {
            output.push('<li style="height:' + baselineHeight + 'em"></li>');
          }

          this.settings.$wrapper.append('<ol id="' + this.id + '" style="top:' + baselineAdjust + 'px">' + output.join('') + '</ol>');
        }
      }
    },


    // ===============================================
    //  STYLES
    // ===============================================

    _styles: {

      init: function (settings) {
        this.getStyles(settings.$wrapper.find('#h2-header').get(0));
      },

      getStyles: function (element) {
        var css = window.getComputedStyle(element);
        for (var i = 0; i < css.length; i++) {
            console.log(css[i] +'='+css.getPropertyValue(''+css[i]))
        }
      }
    },


    /*
     * ===============================================
     *  Public Methods
     * ===============================================
     *  0.0 Destory
     * ===============================================
     */

    destroy: function () {
      // remove event listeners
      this._attachEvents('unbind');

      // delete header panel
      $('#' + templates.$header.attr('id')).remove();

      // unwrap viewport
      if(this.settings.useSizing) {
        var $contents = this.settings.$wrapper.clone();
        console.log($contents);
      } else {
        $('#' + templates.$viewport.attr('id')).contents().unwrap();
      }
    }
  };


  /*
   * ======================================================================
   *  Throttle Function
   * ======================================================================
   *  Source: http://remysharp.com/2010/07/21/throttling-function-calls
   * ======================================================================
   */

  _throttle = function (fn, threshhold, scope) {
    threshhold || (threshhold = $.fn[sg].defaults.throttle);

    var last, deferTimer;

    return function () {
      var context = scope || this,
          now = +new Date,
          args = arguments;

      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

})(jQuery);