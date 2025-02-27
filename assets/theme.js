/*
Motion by Archetype Themes (https://archetypethemes.co)
  Access unminified JS in assets/theme.js

  Use this event listener to run your own JS outside of this file.
  Documentation - https://archetypethemes.co/blogs/motion/javascript-events-for-developers

  document.addEventListener('page:loaded', function() {
    // Page has loaded and theme assets are ready
  });
*/

window.theme = window.theme || {};

// Medium breakpoint is also set in theme.css and inline throughout some templates. Do not change values unless you know what you're doing.
theme.bp = {};
theme.bp.smallUp = 590;
theme.bp.small = theme.bp.smallUp - 1;

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement('div');
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll('[id], [form]').forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = 'none';

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll('script').forEach((oldScriptTag) => {
      const newScriptTag = document.createElement('script');
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}
 
theme.config = {
  bpSmall: false,
  hasSessionStorage: true,
  mediaQuerySmall: 'screen and (max-width: '+ theme.bp.small +'px)',
  mediaQuerySmallUp: 'screen and (min-width: '+ theme.bp.smallUp +'px)',
  youTubeReady: false,
  vimeoReady: false,
  vimeoLoading: false,
  isTouch: ('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
  isIpad: /ipad/.test(window.navigator.userAgent.toLowerCase()) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1),
  rtl: document.documentElement.getAttribute('dir') == 'rtl' ? true : false
};

if (theme.config.isIpad) {
  document.documentElement.className += ' js-ipad';
}

if (console && console.log) {
  console.log('Motion theme ('+theme.settings.themeVersion+') by ARCHΞTYPE | Learn more at https://archetypethemes.co');
}

window.lazySizesConfig = window.lazySizesConfig || {};
lazySizesConfig.expFactor = 2.2;

(function($){
  var $ = jQuery = $;

  theme.utils = {
    /**
     * _.defaultTo from lodash
     * Checks `value` to determine whether a default value should be returned in
     * its place. The `defaultValue` is returned if `value` is `NaN`, `null`,
     * or `undefined`.
     * Source: https://github.com/lodash/lodash/blob/master/defaultTo.js
     *
     * @param {*} value - Value to check
     * @param {*} defaultValue - Default value
     * @returns {*} - Returns the resolved value
     */
    defaultTo: function(value, defaultValue) {
      return (value == null || value !== value) ? defaultValue : value
    }
  };

  theme.a11y = {

    /**
       * Traps the focus in a particular container
       *
       * @param {object} options - Options to be used
       * @param {jQuery} options.$container - Container to trap focus within
       * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
       * @param {string} options.namespace - Namespace used for new focus event handler
       */
    trapFocus: function(options) {
      var eventsName = {
        focusin: options.namespace ? 'focusin.' + options.namespace : 'focusin',
        focusout: options.namespace
        ? 'focusout.' + options.namespace
        : 'focusout',
        keydown: options.namespace
        ? 'keydown.' + options.namespace
        : 'keydown.handleFocus'
      };

      /**
         * Get every possible visible focusable element
         */
      var $focusableElements = options.$container.find(
        $(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])'
        ).filter(':visible')
      );
      var firstFocusable = $focusableElements[0];
      var lastFocusable = $focusableElements[$focusableElements.length - 1];

      if (!options.$elementToFocus) {
        options.$elementToFocus = options.$container;
      }

      function _manageFocus(evt) {
        // Tab key
        if (evt.keyCode !== 9) return;

        /**
           * On the last focusable element and tab forward,
           * focus the first element.
           */
        if (evt.target === lastFocusable && !evt.shiftKey) {
          evt.preventDefault();
          firstFocusable.focus();
        }
        /**
           * On the first focusable element and tab backward,
           * focus the last element.
           */
        if (evt.target === firstFocusable && evt.shiftKey) {
          evt.preventDefault();
          lastFocusable.focus();
        }
      }

      options.$container.attr('tabindex', '-1');
      options.$elementToFocus.focus();

      $(document).off('focusin');

      $(document).on(eventsName.focusout, function() {
        $(document).off(eventsName.keydown);
      });

      $(document).on(eventsName.focusin, function(evt) {
        if (evt.target !== lastFocusable && evt.target !== firstFocusable) return;

        $(document).on(eventsName.keydown, function(evt) {
          _manageFocus(evt);
        });
      });
    },

    /**
     * Removes the trap of focus in a particular container
     *
     * @param {object} options - Options to be used
     * @param {jQuery} options.$container - Container to trap focus within
     * @param {string} options.namespace - Namespace used for new focus event handler
     */
    removeTrapFocus: function(options) {
      var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

      if (options.$container && options.$container.length) {
        options.$container.removeAttr('tabindex');
      }

      $(document).off(eventName);
    },


    lockMobileScrolling: function(namespace, $element) {
      if ($element) {
        var $el = $element;
      } else {
        var $el = $(document.documentElement).add('body');
      }
      $el.on('touchmove' + namespace, function () {
        return false;
      });
    },

    unlockMobileScrolling: function(namespace, $element) {
      if ($element) {
        var $el = $element;
      } else {
        var $el = $(document.documentElement).add('body');
      }
      $el.off(namespace);
    }
  };

  theme.Sections = function Sections() {
    this.constructors = {};
    this.instances = [];

    $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
  };

  theme.Sections.prototype = $.extend({}, theme.Sections.prototype, {
    createInstance: function(container, constructor, customScope) {
      var $container = $(container);
      var id = $container.attr('data-section-id');
      var type = $container.attr('data-section-type');

      constructor = constructor || this.constructors[type];

      if (typeof constructor === 'undefined') {
        return;
      }

      // If custom scope passed, check to see if instance
      // is already initialized so we don't double up
      if (customScope) {
        var instanceExists = this._findInstance(id);
        if (instanceExists) {
          return;
        }
      }

      var instance = $.extend(new constructor(container), {
        id: id,
        type: type,
        container: container
      });

      this.instances.push(instance);
    },

    _onSectionLoad: function(evt, subSection, subSectionId) {
      if (AOS) {
        AOS.refreshHard();
      }
      var container = subSection ? subSection : $('[data-section-id]', evt.target)[0];

      if (!container) {
        return;
      }

      this.createInstance(container);

      var instance = subSection ? subSectionId : this._findInstance(evt.detail.sectionId);

      if (!subSection) {
        this._loadSubSections();
      }

      // Run JS only in case of the section being selected in the editor
      // before merchant clicks "Add"
      if (instance && typeof instance.onLoad === 'function') {
        instance.onLoad(evt);
      }
    },

    _loadSubSections: function() {
      if (AOS) {
        AOS.refreshHard();
      }
      $('[data-subsection]').each(function(evt, el) {
        this._onSectionLoad(null, el, $(el).data('section-id'));
      }.bind(this));
    },

    _onSectionUnload: function(evt) {
      var instance = this._removeInstance(evt.detail.sectionId);
      if (instance && typeof instance.onUnload === 'function') {
        instance.onUnload(evt);
      }
    },

    _onSelect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);

      if (instance && typeof instance.onSelect === 'function') {
        instance.onSelect(evt);
      }
    },

    _onDeselect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);

      if (instance && typeof instance.onDeselect === 'function') {
        instance.onDeselect(evt);
      }
    },

    _onBlockSelect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);

      if (instance && typeof instance.onBlockSelect === 'function') {
        instance.onBlockSelect(evt);
      }
    },

    _onBlockDeselect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);

      if (instance && typeof instance.onBlockDeselect === 'function') {
        instance.onBlockDeselect(evt);
      }
    },

    _findInstance: function(id) {
      for (var i = 0; i < this.instances.length; i++) {
        if (this.instances[i].id === id) {
          return this.instances[i];
        }
      }
    },

    _removeInstance: function(id) {
      var i = this.instances.length;
      var instance;

      while(i--) {
        if (this.instances[i].id === id) {
          instance = this.instances[i];
          this.instances.splice(i, 1);
          break;
        }
      }

      return instance;
    },

    register: function(type, constructor, $scope) {
      var afterLoad = false;
      this.constructors[type] = constructor;
      var $sections = $('[data-section-type=' + type + ']');

      if ($scope) {
        $sections = $('[data-section-type=' + type + ']', $scope);
      }

      $sections.each(function(index, container) {
        this.createInstance(container, constructor, $scope);
      }.bind(this));
    }
  });


  /**
   * Currency Helpers
   * -----------------------------------------------------------------------------
   * A collection of useful functions that help with currency formatting
   *
   * Current contents
   * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
   *
   * Alternatives
   * - Accounting.js - http://openexchangerates.github.io/accounting.js/
   *
   */

  theme.Currency = (function() {
    var moneyFormat = '${{amount}}';

    function formatMoney(cents, format) {
      if (!format) {
        format = theme.settings.moneyFormat;
      }

      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      var value = '';
      var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      var formatString = (format || moneyFormat);

      function formatWithDelimiters(number, precision, thousands, decimal) {
        precision = theme.utils.defaultTo(precision, 2);
        thousands = theme.utils.defaultTo(thousands, ',');
        decimal = theme.utils.defaultTo(decimal, '.');

        if (isNaN(number) || number == null) {
          return 0;
        }

        number = (number / 100.0).toFixed(precision);

        var parts = number.split('.');
        var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
        var centsAmount = parts[1] ? (decimal + parts[1]) : '';

        return dollarsAmount + centsAmount;
      }

      switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = formatWithDelimiters(cents, 0, ' ');
          break;
      }

      return formatString.replace(placeholderRegex, value);
    }

    function getBaseUnit(variant) {
      if (!variant) {
        return;
      }

      if (!variant.unit_price_measurement || !variant.unit_price_measurement.reference_value) {
        return;
      }

      return variant.unit_price_measurement.reference_value === 1
      ? variant.unit_price_measurement.reference_unit
      : variant.unit_price_measurement.reference_value +
        variant.unit_price_measurement.reference_unit;
    }

    return {
      formatMoney: formatMoney,
      getBaseUnit: getBaseUnit
    }
  })();


  /**
   * Image Helper Functions
   * -----------------------------------------------------------------------------
   * A collection of functions that help with basic image operations.
   *
   */

  theme.Images = (function() {

    /**
     * Find the Shopify image attribute size
     *
     * @param {string} src
     * @returns {null}
     */
    function imageSize(src) {
      if (!src) {
        return '620x'; // default based on theme
      }

      var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);

      if (match !== null) {
        return match[1];
      } else {
        return null;
      }
    }

    /**
     * Adds a Shopify size attribute to a URL
     *
     * @param src
     * @param size
     * @returns {*}
     */
    function getSizedImageUrl(src, size) {
      if (!src) {
        return src;
      }

      if (size == null) {
        return src;
      }

      if (size === 'master') {
        return this.removeProtocol(src);
      }

      var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

      if (match != null) {
        var prefix = src.split(match[0]);
        var suffix = match[0];

        return this.removeProtocol(prefix[0] + '_' + size + suffix);
      }

      return null;
    }

    function removeProtocol(path) {
      return path.replace(/http(s)?:/, '');
    }

    return {
      imageSize: imageSize,
      getSizedImageUrl: getSizedImageUrl,
      removeProtocol: removeProtocol
    };
  })();

  theme.Variants = (function() {

    function Variants(options) {
      this.$container = options.$container;
      this.variants = options.variants;
      this.singleOptionSelector = options.singleOptionSelector;
      this.originalSelectorId = options.originalSelectorId;
      this.enableHistoryState = options.enableHistoryState;
      this.currentVariant = this._getVariantFromOptions();

      $(this.singleOptionSelector, this.$container).on('change', this._onSelectChange.bind(this));
    }

    Variants.prototype = $.extend({}, Variants.prototype, {

      _getCurrentOptions: function() {
        var currentOptions = $.map($(this.singleOptionSelector, this.$container), function(element) {
          var $element = $(element);
          var type = $element.attr('type');
          var currentOption = {};

          if (type === 'radio' || type === 'checkbox') {
            if ($element[0].checked) {
              currentOption.value = $element.val();
              currentOption.index = $element.data('index');

              return currentOption;
            } else {
              return false;
            }
          } else {
            currentOption.value = $element.val();
            currentOption.index = $element.data('index');

            return currentOption;
          }
        });

        // remove any unchecked input values if using radio buttons or checkboxes
        currentOptions = this._compact(currentOptions);

        return currentOptions;
      },

      _getVariantFromOptions: function() {
        var selectedValues = this._getCurrentOptions();
        var variants = this.variants;
        var found = false;

        variants.forEach(function(variant) {
          var match = true;
          var options = variant.options;

          selectedValues.forEach(function(option) {
            if (match) {
              match = (variant[option.index] === option.value);
            }
          });

          if (match) {
            found = variant;
          }
        });

        return found || null;
      },

      _onSelectChange: function() {
        var variant = this._getVariantFromOptions();

        this.$container.trigger({
          type: 'variantChange',
          variant: variant
        });

        document.dispatchEvent(new CustomEvent('variant:change', {
          detail: {
            variant: variant
          }
        }));

        if (!variant) {
          return;
        }

        this._updateMasterSelect(variant);
        this._updateImages(variant);
        this._updatePrice(variant);
        this._updateUnitPrice(variant);
        this._updateSKU(variant);
        this.currentVariant = variant;
        if (this.enableHistoryState) {
          this._updateHistoryState(variant);
        }
      },

      _updateImages: function(variant) {

        var variantImage = variant.featured_image || {};
        var currentVariantImage = this.currentVariant.featured_image || {};

        $('.sticky_add_cart .grid .productleft img').attr('src',variantImage.src);
        if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
          return;
        }

        this.$container.trigger({
          type: 'variantImageChange',
          variant: variant
        });
      },

      _updatePrice: function(variant) {
        if (variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
          return;
        }

        this.$container.trigger({
          type: 'variantPriceChange',
          variant: variant
        });
      },

      _updateUnitPrice: function(variant) {
        if (variant.unit_price === this.currentVariant.unit_price) {
          return;
        }

        this.$container.trigger({
          type: 'variantUnitPriceChange',
          variant: variant
        });
      },

      _updateSKU: function(variant) {
        if (variant.sku === this.currentVariant.sku) {
          return;
        }

        this.$container.trigger({
          type: 'variantSKUChange',
          variant: variant
        });
      },

      _updateHistoryState: function(variant) {
        if (!history.replaceState || !variant) {
          return;
        }

        var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
        window.history.replaceState({path: newurl}, '', newurl);
      },

      _updateMasterSelect: function(variant) {
        $(this.originalSelectorId, this.$container).val(variant.id);

        $('.product-single__variant').val(variant.id);
      },

      // _.compact from lodash
      // https://github.com/lodash/lodash/blob/4d4e452ade1e78c7eb890968d851f837be37e429/compact.js
      _compact: function(array) {
        var index = -1,
            length = array == null ? 0 : array.length,
            resIndex = 0,
            result = [];

        while (++index < length) {
          var value = array[index];
          if (value) {
            result[resIndex++] = value;
          }
        }
        return result;
      }
    });

    return Variants;
  })();

  theme.rte = {
    init: function() {
      theme.rte.wrapTable();
      theme.rte.wrapVideo();
      theme.rte.imageLinks();
    },

    wrapTable: function() {
      $('.rte table').wrap('<div class="table-wrapper"></div>');
    },

    wrapVideo: function() {
      var $iframeVideo = $('.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]');
      var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

      $iframeVideo.each(function () {
        // Add wrapper to make video responsive
        if (!$(this).parents('.video-wrapper').length) {
          $(this).wrap('<div class="video-wrapper"></div>');
        }
      });

      $iframeReset.each(function () {
        // Re-set the src attribute on each iframe after page load
        // for Chrome's "incorrect iFrame content on 'back'" bug.
        // https://code.google.com/p/chromium/issues/detail?id=395791
        // Need to specifically target video and admin bar
        this.src = this.src;
      });
    },

    // Remove CSS that adds animated underline under image links
    imageLinks: function() {
      $('.rte a img').parent().addClass('rte__image');
    }
  };

  theme.LibraryLoader = (function() {
    var types = {
      link: 'link',
      script: 'script'
    };

    var status = {
      requested: 'requested',
      loaded: 'loaded'
    };

    var cloudCdn = 'https://cdn.shopify.com/shopifycloud/';

    var libraries = {
      youtubeSdk: {
        tagId: 'youtube-sdk',
        src: 'https://www.youtube.com/iframe_api',
        type: types.script
      },
      shopifyXr: {
        tagId: 'shopify-model-viewer-xr',
        src: cloudCdn + 'shopify-xr-js/assets/v1.0/shopify-xr.en.js',
        type: types.script
      },
      modelViewerUi: {
        tagId: 'shopify-model-viewer-ui',
        src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.en.js',
        type: types.script
      },
      modelViewerUiStyles: {
        tagId: 'shopify-model-viewer-ui-styles',
        src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.css',
        type: types.link
      }
    };

    function load(libraryName, callback) {
      var library = libraries[libraryName];

      if (!library) return;
      if (library.status === status.requested) return;

      callback = callback || function() {};
      if (library.status === status.loaded) {
        callback();
        return;
      }

      library.status = status.requested;

      var tag;

      switch (library.type) {
        case types.script:
          tag = createScriptTag(library, callback);
          break;
        case types.link:
          tag = createLinkTag(library, callback);
          break;
      }

      tag.id = library.tagId;
      library.element = tag;

      var firstScriptTag = document.getElementsByTagName(library.type)[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    function createScriptTag(library, callback) {
      var tag = document.createElement('script');
      tag.src = library.src;
      tag.addEventListener('load', function() {
        library.status = status.loaded;
        callback();
      });
      return tag;
    }

    function createLinkTag(library, callback) {
      var tag = document.createElement('link');
      tag.href = library.src;
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
      tag.addEventListener('load', function() {
        library.status = status.loaded;
        callback();
      });
      return tag;
    }

    return {
      load: load
    };
  })();


  theme.Modals = (function() {
    function Modal(id, name, options) {
      var defaults = {
        close: '.js-modal-close',
        open: '.js-modal-open-' + name,
        openClass: 'modal--is-active',
        closingClass: 'modal--is-closing',
        bodyOpenClass: 'modal-open',
        bodyOpenSolidClass: 'modal-open--solid',
        bodyClosingClass: 'modal-closing',
        closeOffContentClick: true
      };

      this.id = id;
      this.$modal = $('#' + id);

      if (!this.$modal.length) {
        return false;
      }

      this.nodes = {
        $parent: $('html').add('body'),
        $modalContent: this.$modal.find('.modal__inner')
      };

      this.config = $.extend(defaults, options);
      this.modalIsOpen = false;
      this.$focusOnOpen = this.config.focusOnOpen ? $(this.config.focusOnOpen) : this.$modal;
      this.isSolid = this.config.solid;

      this.init();
    }

    Modal.prototype.init = function() {
      var $openBtn = $(this.config.open);

      // Add aria controls
      $openBtn.attr('aria-expanded', 'false');

      $(this.config.open).on('click', this.open.bind(this));
      this.$modal.find(this.config.close).on('click', this.close.bind(this));

      // Close modal if a drawer is opened
      $('body').on('drawerOpen', function() {
        this.close();
      }.bind(this));
    };

    Modal.prototype.open = function(evt) {
      // Keep track if modal was opened from a click, or called by another function
      var externalCall = false;

      // don't open an opened modal
      if (this.modalIsOpen) {
        return;
      }

      // Prevent following href if link is clicked
      if (evt) {
        evt.preventDefault();
      } else {
        externalCall = true;
      }

      // Without this, the modal opens, the click event bubbles up to $nodes.page
      // which closes the modal.
      if (evt && evt.stopPropagation) {
        evt.stopPropagation();
        // save the source of the click, we'll focus to this on close
        this.$activeSource = $(evt.currentTarget).attr('aria-expanded', 'true');
      }

      if (this.modalIsOpen && !externalCall) {
        this.close();
      }

      this.$modal
      .prepareTransition()
      .addClass(this.config.openClass);
      this.nodes.$parent.addClass(this.config.bodyOpenClass);

      if (this.isSolid) {
        this.nodes.$parent.addClass(this.config.bodyOpenSolidClass);
      }

      this.modalIsOpen = true;

      theme.a11y.trapFocus({
        $container: this.$modal,
        $elementToFocus: this.$focusOnOpen,
        namespace: 'modal_focus'
      });

      $('body')
      .trigger('productModalOpen')
      .trigger('modalOpen.' + this.id);

      this.bindEvents();
    };

    Modal.prototype.close = function() {
      // don't close a closed modal
      if (!this.modalIsOpen) {
        return;
      }

      // deselect any focused form elements
      $(document.activeElement).trigger('blur');

      this.$modal
      .prepareTransition()
      .removeClass(this.config.openClass)
      .addClass(this.config.closingClass);
      this.nodes.$parent.removeClass(this.config.bodyOpenClass);
      this.nodes.$parent.addClass(this.config.bodyClosingClass);
      window.setTimeout(function() {
        this.nodes.$parent.removeClass(this.config.bodyClosingClass);
        this.$modal.removeClass(this.config.closingClass);
        if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
          this.$activeSource.attr('aria-expanded', 'false').focus();
        }
      }.bind(this), 500); // modal close css transition

      if (this.isSolid) {
        this.nodes.$parent.removeClass(this.config.bodyOpenSolidClass);
      }

      this.modalIsOpen = false;

      theme.a11y.removeTrapFocus({
        $container: this.$modal,
        namespace: 'modal_focus'
      });

      $('body').trigger('modalClose.' + this.id);

      this.unbindEvents();
    };

    Modal.prototype.bindEvents = function() {
      // Pressing escape closes modal
      this.nodes.$parent.on('keyup.modal', function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }.bind(this));

      if (this.config.closeOffContentClick) {
        // Clicking outside of the modal content also closes it
        this.$modal.on('click.modal', this.close.bind(this));

        // Exception to above: clicking anywhere on the modal content will NOT close it
        this.nodes.$modalContent.on('click.modal', function(evt) {
          evt.stopImmediatePropagation();
        });
      }
    };

    Modal.prototype.unbindEvents = function() {
      this.nodes.$parent.off('.modal');

      if (this.config.closeOffContentClick) {
        this.$modal.off('.modal');
        this.nodes.$modalContent.off('.modal');
      }
    };

    return Modal;
  })();

  theme.Drawers = (function() {
    function Drawer(id, name) {
      this.config = {
        id: id,
        close: '.js-drawer-close',
        open: '.js-drawer-open-' + name,
        openClass: 'js-drawer-open',
        closingClass: 'js-drawer-closing',
        activeDrawer: 'drawer--is-open',
        namespace: '.drawer-' + name
      };
      this.$nodes = {
        parent: $(document.documentElement).add('body'),
        page: $('#MainContent')
      };

      this.$drawer = $('#' + id);

      if (!this.$drawer.length) {
        return false;
      }
      this.isOpen = false;
      this.init();

    };

    Drawer.prototype = $.extend({}, Drawer.prototype, {
      init: function() {
        var $openBtn = $(this.config.open);
        // Add aria controls
        $openBtn.attr('aria-expanded', 'false');

        $openBtn.on('click', this.open.bind(this));
        this.$drawer.find(this.config.close).on('click', this.close.bind(this));

        // Close modal if a drawer is opened
        $('body').on('productModalOpen', function() {
          this.close();
        }.bind(this));
      },

      open: function(evt, returnFocusEl) {
        if (evt) {
          evt.preventDefault();

        }

        if (this.isOpen) {
          return;
        }

        // Without this the drawer opens, the click event bubbles up to $nodes.page which closes the drawer.
        if (evt && evt.stopPropagation) {
          evt.stopPropagation();
          // save the source of the click, we'll focus to this on close
          this.$activeSource = $(evt.currentTarget).attr('aria-expanded', 'true');
        } else if (returnFocusEl) {
          var $el = $(returnFocusEl);
          this.$activeSource = $el.attr('aria-expanded', 'true');
        }

        this.$drawer.prepareTransition().addClass(this.config.activeDrawer);

        this.$nodes.parent.addClass(this.config.openClass);
        this.isOpen = true;

        theme.a11y.trapFocus({
          $container: this.$drawer,
          namespace: 'drawer_focus'
        });

        $('body')
        .trigger('drawerOpen')
        .trigger('drawerOpen.' + this.config.id);

        this.bindEvents();
      },

      close: function() {
        if (!this.isOpen) {
          return;
        }

        // deselect any focused form elements
        $(document.activeElement).trigger('blur');

        this.$drawer.prepareTransition().removeClass(this.config.activeDrawer);

        this.$nodes.parent.removeClass(this.config.openClass);
        this.$nodes.parent.addClass(this.config.closingClass);
        window.setTimeout(function() {
          this.$nodes.parent.removeClass(this.config.closingClass);
          if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
            this.$activeSource.attr('aria-expanded', 'false').focus();
          }
        }.bind(this), 500);

        this.isOpen = false;

        theme.a11y.removeTrapFocus({
          $container: this.$drawer,
          namespace: 'drawer_focus'
        });

        this.unbindEvents();
      },

      bindEvents: function() {
        theme.a11y.lockMobileScrolling(this.config.namespace, this.$nodes.page);

        // Clicking out of drawer closes it
        this.$nodes.page.on('click' + this.config.namespace, function () {
          this.close();
          return false;
        }.bind(this));

        // Pressing escape closes drawer
        this.$nodes.parent.on('keyup' + this.config.namespace, function(evt) {
          if (evt.keyCode === 27) {
            this.close();
          }
        }.bind(this));
      },

      unbindEvents: function() {
        theme.a11y.unlockMobileScrolling(this.config.namespace, this.$nodes.page);
        this.$nodes.parent.off(this.config.namespace);
        this.$nodes.page.off(this.config.namespace);
      }
    });

    return Drawer;
  })();

  theme.cart = {
    getCart: function() {
      return $.getJSON(theme.routes.cart);
    },

    changeItem: function(key, qty) {
      return this._updateCart({
        type: 'POST',
        url: theme.routes.cartChange,
        data: 'quantity=' + qty + '&id=' + key,
        dataType: 'json'
      });
    },

    addItemFromForm: function(data) {

      return this._updateCart({
        type: 'POST',
        url: theme.routes.cartAdd,
        data: data,
        dataType: 'json'
      });
    },

    _updateCart: function(params) {
      return $.ajax(params)
      .then(function(cart) {
        return cart;
      }.bind(this))
    },

    updateNote: function(note) {
      var params = {
        type: 'POST',
        url: '/cart/update.js',
        data: 'note=' + theme.cart.attributeToString(note),
        dataType: 'json',
        success: function(cart) {},
        error: function(XMLHttpRequest, textStatus) {}
      };

      $.ajax(params);
    },

    attributeToString: function(attribute) {
      if ((typeof attribute) !== 'string') {
        attribute += '';
        if (attribute === 'undefined') {
          attribute = '';
        }
      }
      return attribute.trim();
    }
  }

  $(function() {
    // Add a loading indicator on the cart checkout button (/cart and drawer)
    $('body').on('click', '.cart__checkout', function() {
      $(this).addClass('btn--loading');
    });

    $('body').on('change', 'textarea[name="note"]', function() {
      var newNote = $(this).val();
      theme.cart.updateNote(newNote);
    });

    // Update cart when qty changes
    $('.cart-page-form').find('.js-qty__wrapper').each(function(index, el) {
      var selector = new theme.QtySelector($(el), {
        namespace: '.cart-page'
      });
    });

    $('body').on('qty.cart-page', function(evt, key, qty) {
      $('.cart__update').trigger('click');
    });

    // Custom JS to prevent checkout without confirming terms and conditions
    $('body').on('click', '.cart__checkout--ajax', function(evt) {
      if ($('#CartAgree').is(':checked')) {
      } else {
        alert(theme.strings.cartTermsConfirmation);
        $(this).removeClass('btn--loading');
        return false;
      }
    });

    $('body').on('click', '.cart__checkout--page', function(evt) {
      if ($('#CartPageAgree').is(':checked')) {
      } else {
        alert(theme.strings.cartTermsConfirmation);
        $(this).removeClass('btn--loading');
        return false;
      }
    });
  });

  theme.QtySelector = (function() {
    var classes = {
      input: '.js-qty__num',
      plus: '.js-qty__adjust--plus',
      minus: '.js-qty__adjust--minus'
    };

    function QtySelector($el, options) {
      this.$wrapper = $el;
      this.$input = $el.find(classes.input);
      this.$plus = $el.find(classes.plus);
      this.$minus = $el.find(classes.minus);
      this.minValue = this.$input.attr('min') || 1;

      var defaults = {
        namespace: null,
        key: this.$input.data('id')
      };

      this.options = $.extend(defaults, options);

      this.initEventListeners();
    };

    QtySelector.prototype = $.extend({}, QtySelector.prototype, {
      initEventListeners: function() {
        this.$plus.on('click', function() {
          $('.drawer--is-open .cv_index_coll.cartInjectCollection.slick-initialized.slick-slider ').css('opacity','1');
          var qty = this.validateQty(this.$input.val());
          this.addQty(qty);
        }.bind(this));

        this.$minus.on('click', function() {
          $('.drawer--is-open .cv_index_coll.cartInjectCollection.slick-initialized.slick-slider ').css('opacity','1');
          var qty = this.validateQty(this.$input.val());
          this.subtractQty(qty);
        }.bind(this));

        this.$input.on('change', function() {
          var qty = this.validateQty(this.$input.val());
          this.changeQty(qty);
        }.bind(this));
      },

      addQty: function(number) {
        var qty = number + 1;
        this.changeQty(qty);
      },

      subtractQty: function(number) {
        var qty = number - 1;
        if (qty <= this.minValue) {
          qty = this.minValue;
        }
        this.changeQty(qty);
      },

      changeQty: function(qty) {
        this.$input.val(qty);
        $('body').trigger('qty' + this.options.namespace, [this.options.key, qty]);
      },

      validateQty: function(number) {
        if((parseFloat(number) == parseInt(number)) && !isNaN(number)) {
          // We have a valid number!
        } else {
          // Not a number. Default to 1.
          number = 1;
        }
        return parseInt(number);
      }
    });

    return QtySelector;
  })();

  theme.CartDrawer = (function() {
    var config = {
      namespace: '.ajaxcart'
    };

    var selectors = {
      drawer: '#CartDrawer',
      container: '#CartContainer',
      template: '#CartTemplate',
      cartBubble: '.cart-link__bubble'
    };

    function CartDrawer() {
      this.status = {
        loaded: false,
        loading: false
      };

      this.drawer = new theme.Drawers('CartDrawer', 'cart');

      // Prep handlebars template
      var source = $(selectors.template).html();
      this.template = Handlebars.compile(source);

      // Build cart on page load so it's ready in the drawer
      theme.cart.getCart().then(this.buildCart.bind(this));

      document.addEventListener('cart:build', function() {
        theme.cart.getCart().then(this.buildCart.bind(this));
      }.bind(this));

      this.initEventListeners();
    };

    CartDrawer.prototype = $.extend({}, CartDrawer.prototype, {
      initEventListeners: function() {
        $('body').on('updateCart' + config.namespace, this.initQtySelectors.bind(this));
        $('body').on('updateCart' + config.namespace, this.updateCartNotification.bind(this));

        $('body').on('added.ajaxProduct', function(evt, returnFocusEl) {
          theme.cart.getCart().then(function(cart) {
            this.buildCart(cart, true, returnFocusEl);
          }.bind(this));
        }.bind(this));
      },

      buildCart: function(cart, openDrawer, returnFocusEl) {
        this.loading(true);
        this.emptyCart();

        if (cart.item_count === 0) {
          $(selectors.container).append('<div class="drawer__scrollable emptycartwrap"><p class="appear-animation appear-delay-3 emptycart">' + theme.strings.cartEmpty +'<a href="/">Continue shopping > </a></p></div>');
        } else {
          var items = [];
          var item = {};
          var data = {};
          var animation_row = 2;
          var totalAllDiscountPriceWithQty_temp = 0;
          $.each(cart.items, function(index, product) {

            var prodImg;
            if (product.image !== null) {
              prodImg = product.image.replace(/(\.[^.]*)$/, "_180x$1");
            } else {
              prodImg = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
            }

            if (product.properties !== null) {
              $.each(product.properties, function(key, value) {
                if (key.charAt(0) === '_' || !value) {
                  delete product.properties[key];
                }
              });
            }

            // If we have line-item discount, add formattedAmount to discount object
            var amount = 0;
            if (product.line_level_discount_allocations.length !== 0) {
              for (var discount in product.line_level_discount_allocations) {
                amount = product.line_level_discount_allocations[discount].amount;

                product.line_level_discount_allocations[discount].formattedAmount = theme.Currency.formatMoney(amount, theme.settings.moneyFormat);
              }
            }

            animation_row+=2;


            var itemQty_temp =  product.quantity; var totalPriceWithQty_temp = product.price * itemQty_temp ;

            var line_price_temp = product.line_price ;

            var productUrl= product.url;  var productUrlSplit = productUrl.split('?');
            var productUrlhandle = productUrlSplit[0].split('/products/');
            var productUrlhandle =  productUrlhandle[1];
            var productVariant = productUrlSplit[1].split('variant='); productVariant = productVariant[1];
            var myModprice = '<div class="discount__total" data-product-handle="'+productUrlhandle+'" data-variant-id="'+productVariant+'"></div>' + theme.Currency.formatMoney(totalPriceWithQty_temp, theme.settings.moneyFormat);

            item = {
              key: product.key,
              url: product.url,
              img: prodImg,
              animationRow: animation_row,
              name: product.product_title,
              variation: product.variant_title,
              properties: product.properties,
              itemQty: product.quantity,
              //   price: theme.Currency.formatMoney(totalPriceWithQty_temp, theme.settings.moneyFormat),
              price: myModprice,
              unitPrice: theme.Currency.formatMoney(product.unit_price, theme.settings.moneyFormat),
              unitBase: theme.Currency.getBaseUnit(product),
              discountedPrice: theme.Currency.formatMoney((product.price - (product.total_discount/product.quantity)), theme.settings.moneyFormat),
              discounts: product.line_level_discount_allocations,
              discountsApplied: product.line_level_discount_allocations.length === 0 ? false : true,
              vendor: product.vendor,
              line_price: product.line_price
            };

            items.push(item);
          });

          setTimeout(function(){
            window.totalDiscountPriceWithQty_temp = 0; var variantIdList = [];
            //  if( $('.drawer__scrollable .ajaxcart__product').length == 1 )
            // {
            setTimeout(function(){
              var dataDiffTotal = 0;
              $('.drawer__scrollable .ajaxcart__product').each(function(){
                var dataDiff = parseFloat( $(this).find('.discount__total').attr('data-diff') );
                if( typeof dataDiff !== 'undefined' &&  (!isNaN(dataDiff)) ) {
                  var totalQty = $(this).find('.rightinfoall').find('.js-qty__num').val();
                  dataDiffTotal += (dataDiff * totalQty) ; 
                }
              });
              if(dataDiffTotal > 0)
              {
                var totalAllDiscountPriceWithQty_temphtml = theme.Currency.formatMoney(dataDiffTotal, theme.settings.moneyFormat);
                $('#CartContainer .drawer__footer .grid--full .savings__totals').remove();
                $('#CartContainer .drawer__footer .grid--full .savings__totals_outer').html('<div class="savings__totals">You\'re saving '+totalAllDiscountPriceWithQty_temphtml+'</div>');
              }

            },1500);
            //  }

            $('.drawer__scrollable .ajaxcart__product').each(function(){
              var dataProductHandle = $(this).find('.ajaxcart__price').find('.discount__total').attr('data-product-handle');
              var dataVariantId = $(this).find('.ajaxcart__price').find('.discount__total').attr('data-variant-id');

              $.ajax({
                url: '/products/'+dataProductHandle+'.js',
                dataType: 'json',
                async: false,
                success: function(prod_data) {

                  for(var z=0;z< prod_data.variants.length;z++)
                  {
                    var prod_price = prod_data.variants[z].price ;
                    var variantID = prod_data.variants[z].id ; var compare_at_price = prod_data.variants[z].compare_at_price ;
                    if(prod_price < compare_at_price){

                      var diff =  compare_at_price - prod_price ;
                      $('.drawer__scrollable .ajaxcart__product .ajaxcart__price div[data-variant-id="'+variantID+'"]').attr('data-diff',diff);
                      var qty = $('.drawer__scrollable .ajaxcart__product .ajaxcart__price div[data-variant-id="'+variantID+'"]').parents('.display-table').find('.js-qty__num').val();
                      var total_compare_at_price = compare_at_price * qty ;
                      if( $.inArray(variantID, variantIdList) === -1 ){
                        window.totalDiscountPriceWithQty_temp += ( diff * qty ) ; variantIdList.push(variantID);
                      }

                      var  compateAtPriceHtml = theme.Currency.formatMoney(total_compare_at_price, theme.settings.moneyFormat);
                      $('.drawer__scrollable .ajaxcart__product .ajaxcart__price div[data-variant-id="'+variantID+'"]').html(compateAtPriceHtml);
                    }

                  }

                }
              });
            });

            var totalAllDiscountPriceWithQty_temphtml = theme.Currency.formatMoney(window.totalDiscountPriceWithQty_temp, theme.settings.moneyFormat);
            if(window.totalDiscountPriceWithQty_temp > 0){
              //  setTimeout(function(){ 
              $('#CartContainer .drawer__footer .grid--full .savings__totals').remove();
              $('#CartContainer .drawer__footer .grid--full .savings__totals_outer').html('<div class="savings__totals">(You\'re saving '+totalAllDiscountPriceWithQty_temphtml+')</div>');
              //  },200)
            }
          },100);


          animation_row+=2;

          // If we have cart discount, add a formattedAmount to the discount object
          var cartAmount = 0;
          if (cart.cart_level_discount_applications.length !== 0) {
            for (var cartDiscount in cart.cart_level_discount_applications) {
              cartAmount = cart.cart_level_discount_applications[cartDiscount].total_allocated_amount;

              cart.cart_level_discount_applications[cartDiscount].formattedAmount = theme.Currency.formatMoney(cartAmount,theme.settings.moneyFormat);
            }
          }

          data = {
            items: items,
            note: cart.note,
            lastAnimationRow: animation_row,
            cartDiscounts: cart.cart_level_discount_applications,
            cartDiscountsApplied: cart.cart_level_discount_applications.length === 0 ? false : true,
            totalPrice: theme.Currency.formatMoney(cart.total_price, theme.settings.moneyFormat)
          };

          $(selectors.container).append(this.template(data));

        }

        this.status.loaded = true;
        this.loading(false);

        $('body').trigger('updateCart' + config.namespace, cart);

        if (Shopify && Shopify.StorefrontExpressButtons) {
          Shopify.StorefrontExpressButtons.initialize();
        }

        // If specifically asked, open the cart drawer (only happens after product added from form)
        if (openDrawer === true) {
          this.drawer.open(false, returnFocusEl);
        }

        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: {
            cart: cart
          }
        }));
      },

      initQtySelectors: function() {
        $(selectors.container).find('.js-qty__wrapper').each(function(index, el) {
          var selector = new theme.QtySelector($(el), {
            namespace: '.cart-drawer'
          });
        }.bind(this));

        $('body').on('qty.cart-drawer', this.updateItem.bind(this));
      },

      updateItem: function(evt, key, qty) {
        if (this.status.loading) {
          return;
        }

        this.loading(true);

        theme.cart.changeItem(key, qty)
        .then(function(cart) {
          this.updateSuccess(cart);
        }.bind(this))
        .catch(function(XMLHttpRequest) {
          this.updateError(XMLHttpRequest)
        }.bind(this))
        .always(function() {
          this.loading(false);
        }.bind(this));
      },
 
      loading: function(state) {
        this.status.loading = state;

        if (state) {
          $(selectors.container).addClass('is-loading');
        } else {
          $(selectors.container).removeClass('is-loading');
        }
      },

      emptyCart: function() {
        $(selectors.container).empty();
      },


      updateSuccess: function(cart) {
        this.buildCart(cart)

        $.ajax({
          url: "/cart",
          type: 'GET',
          dataType: 'json', // added data type
          success: function(res) {
            var item_count = res.item_count;
            $('.site-nav__icons .site-nav__link .cart-link .cart-link__bubble').text(item_count);
            if(item_count == 0 ){
              $('.cdk_cartCount').text('empty');
            }
            else if(item_count == 1){
              $('.cdk_cartCount').text(item_count+ ' item');
            }
            else{
              $('.cdk_cartCount').text(item_count+ ' items');
            }
          }
        });
      }, 

      updateError: function(XMLHttpRequest) {
        if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
          // console.warn(XMLHttpRequest.responseJSON.description);
        }
      },

      updateCartNotification: function(evt, cart) {
        if (cart.items.length > 0) {
          $(selectors.cartBubble).addClass('cart-link__bubble--visible');
        } else {
          $(selectors.cartBubble).removeClass('cart-link__bubble--visible');
        }
      }
    });
    return CartDrawer;
  })();

  theme.AjaxProduct = (function() {
    var status = {
      loading: false
    };

    function ProductForm($form) {
      this.$form = $form;
      this.$addToCart = this.$form.find('.add-to-cart');

      if (this.$form.length) {
        this.$form.on('submit', this.addItemFromForm.bind(this));
      }
    };

    ProductForm.prototype = $.extend({}, ProductForm.prototype, {
      addItemFromForm: function(evt, callback){
        evt.preventDefault();

        if (status.loading) {
          return;
        }

        // Loading indicator on add to cart button
        this.$addToCart.addClass('btn--loading');

        status.loading = true;

        var data = this.$form.serialize();

        theme.cart.addItemFromForm(data)
        .then(function(product) {
          this.success(product);
          $.ajax({
            url: "/cart",
            type: 'GET',
            dataType: 'json', // added data type
            success: function(res) {
              var item_count = res.item_count;
              $('.site-nav__icons .site-nav__link .cart-link .cart-link__bubble').text(item_count);
              if(item_count == 0 ){
                $('.cdk_cartCount').text('empty');
              }
              else if(item_count == 1){
                $('.cdk_cartCount').text(item_count+ ' item');
              }
              else{
                $('.cdk_cartCount').text(item_count+ ' items');
              }
            }
          });

        }.bind(this))
        .catch(function(XMLHttpRequest) {
          this.error(XMLHttpRequest)
        }.bind(this))
        .always(function() {
          status.loading = false;
          this.$addToCart.removeClass('btn--loading');
        }.bind(this));
      },

      success: function(product) {

        this.$form.find('.errors').remove();
        $('body').trigger('added.ajaxProduct', this.$addToCart);
        document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
          detail: {
            product: product
          }
        }));
      },

      error: function(XMLHttpRequest) {
        this.$form.find('.errors').remove();

        if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
          this.$form.prepend('<div class="errors text-center">' + XMLHttpRequest.responseJSON.description + '</div>');

          document.dispatchEvent(new CustomEvent('ajaxProduct:error', {
            detail: {
              errorMessage: XMLHttpRequest.responseJSON.description
            }
          }));
        }
      }
    });
    
    $(document).on('click', '.WrapActionAddingCart', function(e){ 
      e.preventDefault();
      $('.WrapActionAddingCart').css('pointer-events','none');
      $('.ProductShownEachMainBlock').slick('unslick');
      $(this).closest('.productShownEachblock').remove();
      $('.ProductShownEachMainBlock').slick({infinite: false,swipeToSlide: true,arrows: true,slidesToShow: 4,slidesToScroll: 1,responsive: [{breakpoint: 1024,settings: {slidesToShow: 3,slidesToScroll: 1,infinite: true,}},{breakpoint: 600,settings: {slidesToShow: 2,arrows: true,slidesToScroll: 1}},{breakpoint: 590,settings: {slidesToShow: 1,centerMode: true,centerPadding:'50px',arrows: true,slidesToScroll: 1}}]});
      var variants_id = $(this).attr('data-variant');
      var $recommcart = $(this);
      $.ajax({
        url: '/cart/add.js',
        type: 'POST',
        dataType: 'JSON',
        data: {
          quantity: 1,
          id: variants_id
        },
        success: function (cart) {
          $.ajax({
            url: "/cart", 
            type: 'GET',
            dataType: 'JSON',
            success: function(objectcart) {
              var item_count = objectcart.item_count;
              $('.site-nav__icons .site-nav__link .cart-link .cart-link__bubble').text(item_count);
              if(item_count == 0 ){$('.cdk_cartCount').text('empty');}
              else if(item_count == 1){$('.cdk_cartCount').text(item_count+ ' item');}
              else{$('.cdk_cartCount').text(item_count+ ' items');}
            }
          })
          $('body').trigger('added.ajaxProduct', $recommcart);
          document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
            detail: {
              product: cart
            }
          }));
          $('.WrapActionAddingCart').css('pointer-events','all');
        }
      })
    })


    $(document).on('click', '.ox_cart_atc', function(e){ 
      e.preventDefault();
      $('.ox_cart_atc').css('pointer-events','none');
      $(this).parents('.featured-collection').css('display','none');
      setTimeout(function(){
        $(this).parents('.featured-collection').css('display','block');
      }, 4500);
      var variants_id = $(this).attr('data-variant');
      var HideMainOne = $(this);
      var slideIndex = $(HideMainOne).parents('.cv_index_coll').find('.main-cll').length;
      $.ajax({
        type: 'POST',
        url: '/cart/add.js',
        data: { 
          quantity: 1,
          id: variants_id
        },
        dataType: 'JSON',
        success: function (cart) {
          $(HideMainOne).parents('.cv_index_coll').slick('slickRemove',slideIndex - 1);
          if (slideIndex !== 0){
            slideIndex--;
            HideMainOne.parents('.main-cll').hide();
          }
          $.ajax({
            url: "/cart",
            type: 'GET',
            dataType: 'json', // added data type
            success: function(res) {
              var item_count = res.item_count;
              $('.site-nav__icons .site-nav__link .cart-link .cart-link__bubble').text(item_count);
              if(item_count == 0 ){
                $('.cdk_cartCount').text('empty');
              }
              else if(item_count == 1){
                $('.cdk_cartCount').text(item_count+ ' item');
              }
              else{
                $('.cdk_cartCount').text(item_count+ ' items');
              }
            }
          });
          $('body').trigger('added.ajaxProduct', this.$addToCart);
          document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
            detail: {
              product: cart
            }
          }));
		 $('.ox_cart_atc').css('pointer-events','all');
        }
      })
    })

    return ProductForm;
  })();





  theme.collapsibles = (function() {

    var selectors = {
      trigger: '.collapsible-trigger',
      module: '.collapsible-content',
      moduleInner: '.collapsible-content__inner'
    };

    var classes = {
      hide: 'hide',
      open: 'is-open',
      autoHeight: 'collapsible--auto-height'
    };

    var namespace = '.collapsible';

    var isTransitioning = false;

    function init() {
      $(selectors.trigger).each(function() {
        var $el = $(this);
        var state = $el.hasClass(classes.open);
        $el.attr('aria-expanded', state);
      });

      // Event listeners (hack for modals)
      $('body, .modal__inner')
      .off(namespace)
      .on('click' + namespace, selectors.trigger, function() {
        if (isTransitioning) {
          return;
        }

        isTransitioning = true;

        var $el = $(this);
        var isOpen = $el.hasClass(classes.open);
        var moduleId = $el.attr('aria-controls');
        var $module = $('#' + moduleId);
        var height = $module.find(selectors.moduleInner).outerHeight();
        var isAutoHeight = $el.hasClass(classes.autoHeight);

        // If isAutoHeight, set the height to 0 just after setting the actual height
        // so the closing animation works nicely
        if (isOpen && isAutoHeight) {
          setTimeout(function() {
            height = 0;
            setTransitionHeight($module, height, isOpen, isAutoHeight);
          }, 0);
        }

        if (isOpen && !isAutoHeight) {
          height = 0;
        }

        $el
        .attr('aria-expanded', !isOpen)
        .toggleClass(classes.open, !isOpen);

        setTransitionHeight($module, height, isOpen, isAutoHeight);
      });
    }

    function setTransitionHeight($module, height, isOpen, isAutoHeight) {
      $module
      .removeClass(classes.hide)
      .prepareTransition()
      .css('height', height)
      .toggleClass(classes.open, !isOpen);

      if (!isOpen && isAutoHeight) {
        var o = $module;
        window.setTimeout(function() {
          o.css('height','auto');
          isTransitioning = false;
        }, 500);
      } else {
        isTransitioning = false;
      }
    }

    return {
      init: init
    };
  })();

  theme.headerNav = (function() {

    var $parent = $(document.documentElement).add('body');
    var $page = $('#MainContent');
    var selectors = {
      wrapper: '.header-wrapper',
      siteHeader: '.site-header',
      searchBtn: '.js-search-header',
      closeSearch: '.js-search-header-close',
      searchContainer: '.site-header__search-container',
      logoContainer: '.site-header__logo',
      logo: '.site-header__logo img',
      navigation: '.site-navigation',
      navContainerWithLogo: '.header-item--logo',
      navItems: '.site-nav__item',
      navLinks: '.site-nav__link',
      navLinksWithDropdown: '.site-nav__link--has-dropdown',
      navDropdownLinks: '.site-nav__dropdown-link--second-level'
    };

    var classes = {
      hasDropdownClass: 'site-nav--has-dropdown',
      hasSubDropdownClass: 'site-nav__deep-dropdown-trigger',
      dropdownActive: 'is-focused'
    };

    var config = {
      namespace: '.siteNav',
      wrapperOverlayed: false,
      overlayedClass: 'is-light',
      overlayEnabledClass: 'header-wrapper--overlay',
      stickyEnabled: false,
      stickyActive: false,
      stickyClass: 'site-header--stuck',
      openTransitionClass: 'site-header--opening',
      lastScroll: 0
    };

    // Elements used in resize functions, defined in init
    var $window;
    var $navContainerWithLogo;
    var $logoContainer;
    var $nav;
    var $wrapper;
    var $siteHeader;

    function init() {
      $window = $(window);
      $navContainerWithLogo = $(selectors.navContainerWithLogo);
      $logoContainer = $(selectors.logoContainer);
      $nav = $(selectors.navigation);
      $wrapper = $(selectors.wrapper);
      $siteHeader = $(selectors.siteHeader);

      config.stickyEnabled = $siteHeader.data('sticky');
      if (config.stickyEnabled) {
        config.wrapperOverlayed = $wrapper.hasClass(config.overlayedClass);
        stickyHeader();
      }

      theme.settings.overlayHeader = $siteHeader.data('overlay');
      // Disable overlay header if on collection template with no collection image
      if (theme.settings.overlayHeader && Shopify && Shopify.designMode) {
        if ($('body').hasClass('template-collection') && !$('.collection-hero').length) {
          this.disableOverlayHeader();
        }
      }

      accessibleDropdowns();
      searchDrawer();

      $window.on('load' + config.namespace, resizeLogo);
      $window.on('resize' + config.namespace, $.debounce(150, resizeLogo));
    }

    function unload() {
      $(window).off(config.namespace);
      $(selectors.searchBtn).off(config.namespace);
      $(selectors.closeSearch).off(config.namespace);
      $parent.off(config.namespace);
      $(selectors.navLinks).off(config.namespace);
      $(selectors.navDropdownLinks).off(config.namespace);
    }

    function searchDrawer() {
      $(selectors.searchBtn).on('click' + config.namespace, function(evt) {
        evt.preventDefault();
        openSearchDrawer();
      });

      $(selectors.closeSearch).on('click' + config.namespace, closeSearchDrawer);
    }

    function openSearchDrawer() {
      $(selectors.searchContainer)
      .prepareTransition()
      .addClass('is-active');
      $parent.addClass('js-drawer-open js-drawer-open--search');

      setTimeout(function() {
        theme.a11y.trapFocus({
          $container: $(selectors.searchContainer),
          namespace: 'header_search',
          $elementToFocus: $(selectors.searchContainer).find('.site-header__search-input')
        });
      }, 100);



      // If sticky is enabled, scroll to top on mobile when close to it
      // so you don't get an invisible search box
      if (theme.config.bpSmall && config.stickyEnabled && config.lastScroll < 300) {
        window.scrollTo(0,0);
      }

      // Bind events
      theme.a11y.lockMobileScrolling(config.namespace);

      // Clicking out of container closes it
      $page.on('click' + config.namespace, function () {
        closeSearchDrawer();
        return false;
      });

      $parent.on('keyup' + config.namespace, function(evt) {
        if (evt.keyCode === 27) {
          closeSearchDrawer();
        }
      });


    }

    function closeSearchDrawer() {
      // deselect any focused form elements
      $(document.activeElement).trigger('blur');

      $parent.addClass('js-drawer-closing');
      $parent.removeClass('js-drawer-open js-drawer-open--search').off(config.namespace);

      window.setTimeout(function() {
        $parent.removeClass('js-drawer-closing');
      }.bind(this), 500);

      $(selectors.searchContainer)
      .prepareTransition()
      .removeClass('is-active');

      theme.a11y.removeTrapFocus({
        $container: $(selectors.searchContainer),
        namespace: 'header_search'
      });

      theme.a11y.unlockMobileScrolling(config.namespace);
      $page.off('click' + config.namespace);
      $parent.off('keyup' + config.namespace);
    }

    function resizeLogo() {
      // Using .each() as there can be a reversed logo too
      $(selectors.logo).each(function() {
        var $el = $(this),
            logoWidthOnScreen = $el.width(),
            containerWidth = $el.closest('.grid__item').width();
        // If image exceeds container, let's make it smaller
        if (logoWidthOnScreen > containerWidth) {
          $el.css('maxWidth', containerWidth);
        }
        else {
          $el.removeAttr('style');
        }
      });
    }

    function accessibleDropdowns() {
      var hasActiveDropdown = false;
      var hasActiveSubDropdown = false;
      var closeOnClickActive = false;

      // Touch devices open dropdown on first click, navigate to link on second
      if (theme.config.isTouch) {
        $(selectors.navLinksWithDropdown).on('touchend' + config.namespace, function(evt) {
          var $el = $(this);
          var $parentItem = $el.parent();
          if (!$parentItem.hasClass(classes.dropdownActive)) {
            evt.preventDefault();
            closeDropdowns();
            openFirstLevelDropdown($el);
          } else {
            window.location.replace($el.attr('href'));
          }
        });

        $(selectors.navDropdownLinks).on('touchend' + config.namespace, function(evt) {
          var $el = $(this);
          var $parentItem = $el.parent();

          // Open third level menu or go to link based on active state
          if ($parentItem.hasClass(classes.hasSubDropdownClass)) {
            if (!$parentItem.hasClass(classes.dropdownActive)) {
              evt.preventDefault();
              closeThirdLevelDropdown();
              openSecondLevelDropdown($el);
            } else {
              window.location.replace($el.attr('href'));
            }
          } else {
            // No third level nav, go to link
            window.location.replace($el.attr('href'));
          }
        });
      }

      // Open/hide top level dropdowns
      $(selectors.navLinks).on('focusin mouseover' + config.namespace, function() {
        if (hasActiveDropdown) {
          closeSecondLevelDropdown();
        }

        if (hasActiveSubDropdown) {
          closeThirdLevelDropdown();
        }

        openFirstLevelDropdown($(this));
      });

      // Force remove focus on sitenav links because focus sometimes gets stuck
      $(selectors.navLinks).on('mouseleave' + config.namespace, function() {
        closeDropdowns();
      });

      // Open/hide sub level dropdowns
      $(selectors.navDropdownLinks).on('focusin' + config.namespace, function() {
        closeThirdLevelDropdown();
        openSecondLevelDropdown($(this), true);
      });

      // Private dropdown methods
      function openFirstLevelDropdown($el) {
        var $parentItem = $el.parent();
        if ($parentItem.hasClass(classes.hasDropdownClass)) {
          $parentItem.addClass(classes.dropdownActive);
          hasActiveDropdown = true;
        }

        if (!theme.config.isTouch) {
          if (!closeOnClickActive) {
            var eventType = theme.config.isTouch ? 'touchend' : 'click';
            closeOnClickActive = true;
            $('body').on(eventType + config.namespace, function() {
              closeDropdowns();
              $('body').off(config.namespace);
              closeOnClickActive = false;
            });
          }
        }
      }

      function openSecondLevelDropdown($el, skipCheck) {
        var $parentItem = $el.parent();
        if ($parentItem.hasClass(classes.hasSubDropdownClass) || skipCheck) {
          $parentItem.addClass(classes.dropdownActive);
          hasActiveSubDropdown = true;
        }
      }

      function closeDropdowns() {
        closeSecondLevelDropdown();
        closeThirdLevelDropdown();
      }

      function closeSecondLevelDropdown() {
        $(selectors.navItems).removeClass(classes.dropdownActive);
      }

      function closeThirdLevelDropdown() {
        $(selectors.navDropdownLinks).parent().removeClass(classes.dropdownActive);
      }
    }

    function stickyHeader() {
      config.lastScroll = 0;
      $siteHeader.wrap('<div class="site-header-sticky"></div>');

      stickyHeaderHeight();
      $window.on('resize' + config.namespace, $.debounce(50, stickyHeaderHeight));
      $window.on('scroll' + config.namespace, $.throttle(15, stickyHeaderScroll));

      // This gets messed up in the editor, so here's a fix
      if (Shopify && Shopify.designMode) {
        setTimeout(function() {
          stickyHeaderHeight();
        }, 250);
      }
    }

    function stickyHeaderHeight() {
      var $stickyHeader = $('.site-header-sticky').css('height', $siteHeader.outerHeight(true));
    }

    function stickyHeaderScroll() {
      var scroll = $window.scrollTop();
      var threshold = 250;

      if (scroll > threshold) {
        if (config.stickyActive) {
          return;
        }

        config.stickyActive = true;

        $siteHeader.addClass(config.stickyClass);
        if (config.wrapperOverlayed) {
          $wrapper.removeClass(config.overlayedClass);
        }

        // Add open transition class after element is set to fixed
        // so CSS animation is applied correctly
        setTimeout(function() {
          $siteHeader.addClass(config.openTransitionClass);
        }, 100);
      } else {
        if (!config.stickyActive) {
          return;
        }

        config.stickyActive = false;

        $siteHeader.removeClass(config.openTransitionClass).removeClass(config.stickyClass);
        if (config.wrapperOverlayed) {
          $wrapper.addClass(config.overlayedClass);
        }
      }

      config.lastScroll = scroll;
    }

    // If the header setting to overlay the menu on the collection image
    // is enabled but the collection setting is disabled, we need to undo
    // the init of the sticky nav
    function disableOverlayHeader() {
      $(selectors.wrapper)
      .removeClass(config.overlayEnabledClass)
      .removeClass(config.overlayedClass);
      config.wrapperOverlayed = false;
    }

    return {
      init: init,
      disableOverlayHeader: disableOverlayHeader,
      unload: unload
    };
  })();

  theme.articleImages = (function() {

    var cache = {};

    function init() {
      cache.$rteImages = $('.rte--indented-images');

      if (!cache.$rteImages.length) {
        return;
      }

      $(window).on('load', setImages);
    }

    function setImages() {
      cache.$rteImages.find('img').each(function() {
        var $el = $(this);
        var attr = $el.attr('style');

        // Check if undefined or float: none
        if (!attr || attr == 'float: none;') {
          // Remove grid-breaking styles if image isn't wider than parent
          if ($el.width() < cache.$rteImages.width()) {
            $el.addClass('rte__no-indent');
          }
        }
      });
    }

    return {
      init: init
    };
  })();

  theme.Slideshow = (function() {
    this.$slideshow = null;

    var classes = {
      next: 'is-next',
      init: 'is-init',
      animateOut: 'animate-out',
      wrapper: 'slideshow-wrapper',
      slideshow: 'slideshow',
      allSlides: 'slick-slide',
      currentSlide: 'slick-current',
      pauseButton: 'slideshow__pause',
      isPaused: 'is-paused'
    };

    function slideshow(el, args) {
      this.$slideshow = $(el);
      this.$wrapper = this.$slideshow.closest('.' + classes.wrapper);
      this.$pause = this.$wrapper.find('.' + classes.pauseButton);

      this.settings = {
        accessibility: true,
        arrows: args.arrows ? true : false,
        dots: args.dots ? true : false,
        fade: args.fade ? true : false,
        speed: args.speed ? args.speed : 500,
        draggable: true,
        touchThreshold: 5,
        pauseOnHover: false,
        rtl: theme.config.rtl,
        autoplay: this.$slideshow.data('autoplay'),
        autoplaySpeed: this.$slideshow.data('speed')
      };

      this.$slideshow.on('init', this.init.bind(this));
      if (this.settings.fade) {
        this.$slideshow.on('beforeChange', this.beforeSlideChange.bind(this));
        this.$slideshow.on('afterChange', this.afterSlideChange.bind(this));
      }

      this.$slideshow.slick(this.settings);

      this.$pause.on('click', this._togglePause.bind(this));
    }

    slideshow.prototype = $.extend({}, slideshow.prototype, {
      init: function(event, obj) {
        this.$slideshowList = obj.$list;
        this.$slickDots = obj.$dots;
        this.$allSlides = obj.$slides;
        this.slideCount = obj.slideCount;

        this.$slideshow.addClass(classes.init);
        this._a11y();
        this._clonedLazyloading();
      },
      beforeSlideChange: function(event, slick, currentSlide, nextSlide) {
        var $slider = slick.$slider;
        var $currentSlide = $slider.find('.' + classes.currentSlide).addClass(classes.animateOut);
      },
      afterSlideChange: function(event, slick, currentSlide) {
        var $slider = slick.$slider;
        var $allSlides = $slider.find('.' + classes.allSlides).removeClass(classes.animateOut);
      },
      destroy: function() {
        this.$slideshow.slick('unslick');
      },

      // Playback
      _play: function() {
        this.$slideshow.slick('slickPause');
        $(classes.pauseButton).addClass('is-paused');
      },
      _pause: function() {
        this.$slideshow.slick('slickPlay');
        $(classes.pauseButton).removeClass('is-paused');
      },
      _togglePause: function() {
        var slideshowSelector = this._getSlideshowId(this.$pause);
        if (this.$pause.hasClass(classes.isPaused)) {
          this.$pause.removeClass(classes.isPaused);
          $(slideshowSelector).slick('slickPlay');
        } else {
          this.$pause.addClass(classes.isPaused);
          $(slideshowSelector).slick('slickPause');
        }
      },

      // Helpers
      _getSlideshowId: function($el) {
        return '#Slideshow-' + $el.data('id');
      },
      _activeSlide: function() {
        return this.$slideshow.find('.slick-active');
      },
      _currentSlide: function() {
        return this.$slideshow.find('.slick-current');
      },
      _nextSlide: function(index) {
        return this.$slideshow.find('.slideshow__slide[data-slick-index="' + index + '"]');
      },

      // a11y fixes
      _a11y: function() {
        var $list = this.$slideshowList;
        var autoplay = this.settings.autoplay;

        if (!$list) {
          return;
        }

        // Remove default Slick aria-live attr until slider is focused
        $list.removeAttr('aria-live');

        // When an element in the slider is focused
        // pause slideshow and set aria-live
        $(classes.wrapper).on('focusin', function(evt) {
          if (!$(classes.wrapper).has(evt.target).length) {
            return;
          }

          $list.attr('aria-live', 'polite');
          if (autoplay) {
            this._pause();
          }
        }.bind(this));

        // Resume autoplay
        $(classes.wrapper).on('focusout', function(evt) {
          if (!$(classes.wrapper).has(evt.target).length) {
            return;
          }

          $list.removeAttr('aria-live');
          if (autoplay) {
            this._play();
          }
        }.bind(this));
      },

      // Make sure lazyloading works on cloned slides
      _clonedLazyloading: function() {
        var $slideshow = this.$slideshow;

        $slideshow.find('.slick-slide').each(function(index, el) {
          var $slide = $(el);
          if ($slide.hasClass('slick-cloned')) {
            var slideId = $slide.data('id');
            var $slideImg = $slide.find('.hero__image').removeClass('lazyloading').addClass('lazyloaded');

            // Get inline style attribute from non-cloned slide with arbitrary timeout
            // so the image is loaded
            setTimeout(function() {
              var loadedImageStyle = $slideshow.find('.slideshow__slide--' + slideId + ':not(.slick-cloned) .hero__image').attr('style');

              if (loadedImageStyle) {
                $slideImg.attr('style', loadedImageStyle);
              }

            }, this.settings.autoplaySpeed / 1.5);

          }
        }.bind(this));
      }
    });

    return slideshow;
  })();

  theme.announcementBar = (function() {
    var selectors = {
      bar: '.announcement',
      text: '.announcement__text',
      closeBtn: '.announcement__close'
    };

    var classes = {
      opening: 'announcement--opening',
      closed: 'announcement--closed'
    };

    var config = {
      namespace: '.announcementBar'
    };

    function init() {
      if (!$(selectors.closeBtn).length) {
        return;
      }

      if (theme.config.hasSessionStorage && sessionStorage[announcementBarText()] !== 'hidden') {
        window.setTimeout(function() {
          announcementBarShow();
        }, 2000);
      }

      // Probably in the editor, so show it anyway
      if (!theme.config.hasSessionStorage) {
        window.setTimeout(function() {
          announcementBarShow();
        }, 2000);
      }

      $(selectors.closeBtn).on('click', function(evt) {
        evt.preventDefault();
        announcementBarClose();
      });

      $(window).on('resize' + config.namespace, $.debounce(150, announcementBarHeight));
    }

    function unload() {
      $(window).off(config.namespace);
    }

    function announcementBarShow() {
      $(selectors.bar).removeClass(classes.closed);
      announcementBarHeight();
    }

    function announcementBarHeight() {
      var barHeight = $(selectors.text).outerHeight(true);
      $(selectors.bar).addClass(classes.opening).css({'max-height': barHeight});
    }

    function announcementBarClose() {
      if (theme.config.hasSessionStorage) {
        sessionStorage.setItem(announcementBarText(), 'hidden');
      }

      $(selectors.bar).addClass(classes.closed);
    }

    function announcementBarText() {
      return $(selectors.text).data('text');
    }

    return {
      init: init,
      unload: unload
    };
  })();

  theme.predictiveSearch = (function() {
    var currentString = '';
    var isLoading = false;
    var searchTimeout;
    var namespace = '.predictive';

    var selectors = {
      form: '#HeaderSearchForm',
      input: 'input[type="search"]',
      wrapper: '.predictive-results',

      searchButton: '[data-predictive-search-button]',
      searchTerm: '[data-predictive-search-term]',

      resultDiv: '#PredictiveResults',
      resultTemplate: '#PredictiveTemplate'
    };

    var classes = {
      isActive: 'predicitive-active'
    };

    var keys = {
      up_arrow: 38,
      down_arrow: 40,
      tab: 9
    };

    function init() {
      if (!theme.settings.predictiveSearch) {
        return;
      }

      // Only some languages support predictive search
      if (document.getElementById('shopify-features')) {
        var supportedShopifyFeatures = JSON.parse(document.getElementById('shopify-features').innerHTML);
        if (!supportedShopifyFeatures.predictiveSearch) {
          return;
        }
      }

      $(selectors.form).attr('autocomplete', 'off');
      $(selectors.form).on('submit' + namespace, submitSearch);

      $(selectors.input, selectors.form).on('keyup' + namespace, handleKeyup);
      $(selectors.searchButton, selectors.wrapper).on('click' + namespace, triggerSearch);

      // Prep handlebars template
      var source = $(selectors.resultTemplate).html();
      resultTemplate = Handlebars.compile(source);
    }

    function reset() {
      $(selectors.wrapper).addClass('hide');
      clearTimeout(searchTimeout);
    }

    function triggerSearch() {
      $(selectors.form).trigger('submit');
    }

    // Append * wildcard to search
    function submitSearch(evt) {
      var $form = $(this);
      evt.preventDefault ? evt.preventDefault() : evt.returnValue = false;

      var data = $form.serializeArray().reduce(function(obj, item) {
        obj[item.name] = item.value;
        return obj;
      }, {});

      if (data.q) {
        data.q += '*';
      }

      var query = $.param(data);

      window.location.href = '/search?' + query;
      return false;
    }

    function handleKeyup(evt) {
      if (evt.keyCode === keys.up_arrow) {
        navigationEvent(evt, 'up');
        return;
      }

      if (evt.keyCode === keys.down_arrow) {
        navigationEvent(evt, 'down');
        return;
      }

      if (evt.keyCode === keys.tab) {
        return;
      }

      search();
    }

    function search() {
      var keyword = $(selectors.input, selectors.form).val();

      if (keyword === '') {
        reset();
        return;
      }

      var q = _normalizeQuery(keyword);

      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(
        function () {
          predictQuery(q);
        }.bind(this),
        500
      );
    }

    function predictQuery(q) {
      if (isLoading) {
        return;
      }

      // Do not re-search the same thing
      if (currentString === q) {
        return;
      }

      currentString = q;
      isLoading = true;

      jQuery.getJSON('/search/suggest.json', {
        "q": q,
        "resources": {
          "type": theme.settings.predictiveSearchType,
          "limit": 3,
          "options": {
            "unavailable_products": "last",
            "fields": "title,product_type,variants.title,vendor"
          }
        }
      }).done(function(response) {
        isLoading = false;
        var data = {};
        var resultCount = 0;

        $(selectors.wrapper).removeClass('hide');

        var resultTypes = Object.entries(response.resources.results);

        for (var i = resultTypes.length - 1; i >= 0; i--) {
          var obj = resultTypes[i];
          var type = obj[0];
          var results = obj[1];
          resultCount += results.length;

          switch(type) {
            case 'products':
              data[type] = buildProducts(results);
              break;
            case 'collections':
              data[type] = buildCollections(results);
              break;
            default:
              data[type] = parseResultImages(results);
              break;
          }
        }

        if (resultCount === 0) {
          reset();
        }

        // Append result markup
        $(selectors.resultDiv).empty().append(resultTemplate(data));

        // Update 'search' term text
        $(selectors.searchTerm, selectors.wrapper).text(q);
      });
    }

    function buildProducts(results) {
      var products = [];

      for (var i = results.length - 1; i >= 0; i--) {
        var product = results[i];

        var new_product = {
          title: product.title,
          url: product.url,
          image: theme.Images.getSizedImageUrl(product.image, '200x200_crop_center'),
          vendor: product.vendor,
          price: theme.Currency.formatMoney(product.price),
          compare_price_max: theme.Currency.formatMoney(product.compare_at_price_max),
          on_sale: parseInt(product.compare_at_price_max) > parseInt(product.price)
        };

        products.push(new_product);
      }

      return products;
    }

    function buildCollections(results) {
      var collections = [];

      for (var i = results.length - 1; i >= 0; i--) {
        var collection = results[i];

        var new_collection = {
          title: collection.title,
          url: collection.url
        };

        if (collection.featured_image.url) {
          new_collection.image = theme.Images.getSizedImageUrl(collection.featured_image.url, '200x200_crop_center');
        }

        collections.push(new_collection);
      }

      return collections;
    }

    // Overwrite full sized image returned form API
    // with lazyloading-friendly path
    function parseResultImages(results) {
      for (var i = results.length - 1; i >= 0; i--) {
        if (!results[i].image) {
          continue;
        }

        var image = theme.Images.getSizedImageUrl(results[i].image, '200x200_crop_center');

        results[i].image = image;
      }

      return results;
    }

    function _normalizeQuery(string) {
      if (typeof string !== 'string') {
        return null;
      }

      return string
      .trim()
      .replace(/\ /g, '-')
      .toLowerCase();
    }

    function navigationEvent(evt, direction) {

    }

    return {
      init: init
    };
  })();

  theme.initQuickShop = function(reinit) {
    var ids = [];
    var $buttons = $('.quick-product__btn');
    var $products = $('.grid-product');

    $buttons.each(function() {
      var id = $(this).data('product-id');
      var modalId = 'QuickShopModal-' + id;
      var name = 'quick-modal-' + id;

      // If another identical modal exists, remove duplicates
      if (ids.indexOf(id) > -1) {
        $('.modal--quick-shop[data-product-id="'+ id +'"]').each(function(i) {
          if (i > 0) {
            $(this).remove();
          }
        });
        return;
      }

      new theme.Modals(modalId, name);
      ids.push(id);
    });

    if ($buttons.length) {
      $products.on('mouseover', function() {
        var $el = $(this);

        // No quick view on mobile breakpoint
        if (!theme.config.bpSmall) {
          $el.off('mouseover');
          var handle = $el.data('product-handle');
          var $btn = $el.find('.quick-product__btn');
          theme.preloadProductModal(handle, $btn);
        }
      });
    }
  };

  theme.preloadProductModal = function(handle, $btn) {
    var $holder = $('#QuickShopHolder-' + handle);
    var url = theme.routes.home + 'products/' + handle + '?view=modal';

    $holder.load(url + ' .product-section[data-product-handle='+handle+']', function() {
      sections.register('product-template', theme.Product, $holder);
      $btn.removeClass('quick-product__btn--not-ready');
    });
  }


  // Video modal will auto-initialize for any anchor link that points to YouTube
  // MP4 videos must manually be enabled with:
  //   - .product-video-trigger--mp4 (trigger button)
  //   - .product-video-mp4-sound video player element (cloned into modal)
  //     - see media.liquid for example of this
  theme.videoModal = function() {
    var youtubePlayer = null;
    var videoOptions = {
      width: 1280,
      height: 720,
      playerVars: {
        autohide: 0,
        autoplay: 1,
        branding: 0,
        cc_load_policy: 0,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        quality: 'hd720',
        rel: 0,
        showinfo: 0,
        wmode: 'opaque'
      },
      events: {
        onReady: onPlayerReady
      }
    };

    var videoHolderId = 'VideoHolder';
    var activeVideo = false;

    var selectors = {
      videoHolder: '#' + videoHolderId,
      youtube: 'a[href*="youtube.com/watch"], a[href*="youtu.be/"]',
      mp4Trigger: '.product-video-trigger--mp4',
      mp4Player: '.product-video-mp4-sound'
    };

    if (!$(selectors.youtube).length && !$(selectors.mp4Trigger).length) {
      return;
    }

    var modal = new theme.Modals('VideoModal', 'video-modal', {
      closeOffContentClick: true,
      solid: true
    });

    $(selectors.youtube).on('click', triggerYouTubeModal);
    $(selectors.mp4Trigger).on('click', triggerMp4Modal);

    // Handle closing video modal
    $('body').on('modalClose.VideoModal', function() {
      // Slight timeout so YouTube player is destroyed after the modal closes
      if (youtubePlayer && activeVideo === 'youtube') {
        setTimeout(function() {
          youtubePlayer.destroy();
        }, 500); // modal close css transition
      } else {
        emptyVideoHolder();
      }
    });

    function triggerYouTubeModal(evt) {
      emptyVideoHolder();

      evt.preventDefault();
      theme.LibraryLoader.load('youtubeSdk');

      if (theme.config.youTubeReady) {
        startYoutubeOnClick(evt);
      } else {
        $('body').on('youTubeReady', function() {
          startYoutubeOnClick(evt);
        });
      }
    }

    function triggerMp4Modal(evt) {
      emptyVideoHolder();

      var $el = $(evt.currentTarget);
      var $mp4Player = $el.next(selectors.mp4Player);

      $mp4Player.clone().removeClass('hide').appendTo(selectors.videoHolder);

      modal.open(evt);

      // Play new video element
      $(selectors.videoHolder).find('video')[0].play();

      activeVideo = 'mp4';
    }

    function startYoutubeOnClick(evt) {
      var $el = $(evt.currentTarget);
      var videoId = getYoutubeVideoId($el.attr('href'));

      var args = $.extend({}, videoOptions, {
        videoId: videoId
      });

      // Disable plays inline on mobile
      args.playerVars.playsinline = theme.config.bpSmall ? 0 : 1;

      youtubePlayer = new YT.Player(videoHolderId, args);
      modal.open(evt);

      activeVideo = 'youtube';
    }

    function onPlayerReady(evt) {
      evt.target.playVideo();
    }

    function getYoutubeVideoId(url) {
      var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      var match = url.match(regExp);
      return (match&&match[7].length==11)? match[7] : false;
    }

    function emptyVideoHolder() {
      $(selectors.videoHolder).empty();
    }
  };


  theme.parallaxSections = {};

  theme.Parallax = (function() {
    var speed = 7; // higher is slower

    function parallax(el, args) {
      this.$container = $(el);
      this.namespace = args.namespace;

      if (!this.$container.length) {
        return;
      }

      if (args.desktopOnly) {
        this.desktopInit();
      } else {
        this.init(this.$container, args)
      }
    }

    parallax.prototype = $.extend({}, parallax.prototype, {
      init: function(desktopOnly) {
        var $window = this.$window = $(window);
        var elTop = this.$container.offset().top;

        $window.on('scroll' + this.namespace, function(evt) {
          var scrolled = $window.scrollTop();
          var shiftDistance = (elTop - scrolled) / speed;
          this.$container.css({
            'transform': 'translate3d(0, ' + shiftDistance + 'px, 0)'
          });
        }.bind(this));

        // Reinit on resize
        $window.on('resize' + this.namespace, $.debounce(350, function() {
          $window.off(this.namespace);

          if (desktopOnly) {
            if (!theme.config.bpSmall) {
              this.init(true);
              return;
            }
          }

          this.init();
        }.bind(this)));
      },

      desktopInit: function() {
        if (!theme.config.bpSmall) {
          this.init(true);
        }

        $('body').on('matchSmall', function() {
          this.destroy();
        }.bind(this));

        $('body').on('matchLarge', function() {
          this.init(true);
        }.bind(this));
      },

      destroy: function() {
        this.$container.removeAttr('style');
        if (this.$window) {
          this.$window.off(this.namespace);
        }
      }
    });

    return parallax;
  })();

  // Shopify-built select-like popovers for currency and language selection
  theme.Disclosure = (function() {
    var selectors = {
      disclosureList: '[data-disclosure-list]',
      disclosureToggle: '[data-disclosure-toggle]',
      disclosureInput: '[data-disclosure-input]',
      disclosureOptions: '[data-disclosure-option]'
    };

    var classes = {
      listVisible: 'disclosure-list--visible'
    };

    function Disclosure($disclosure) {
      this.$container = $disclosure;
      this.cache = {};
      this._cacheSelectors();
      this._connectOptions();
      this._connectToggle();
      this._onFocusOut();
    }

    Disclosure.prototype = $.extend({}, Disclosure.prototype, {
      _cacheSelectors: function() {
        this.cache = {
          $disclosureList: this.$container.find(selectors.disclosureList),
          $disclosureToggle: this.$container.find(selectors.disclosureToggle),
          $disclosureInput: this.$container.find(selectors.disclosureInput),
          $disclosureOptions: this.$container.find(selectors.disclosureOptions)
        };
      },

      _connectToggle: function() {
        this.cache.$disclosureToggle.on(
          'click',
          function(evt) {
            var ariaExpanded =
                $(evt.currentTarget).attr('aria-expanded') === 'true';
            $(evt.currentTarget).attr('aria-expanded', !ariaExpanded);

            this.cache.$disclosureList.toggleClass(classes.listVisible);
          }.bind(this)
        );
      },

      _connectOptions: function() {
        this.cache.$disclosureOptions.on(
          'click',
          function(evt) {
            evt.preventDefault();
            this._submitForm($(evt.currentTarget).data('value'));
          }.bind(this)
        );
      },

      _onFocusOut: function() {
        this.cache.$disclosureToggle.on(
          'focusout',
          function(evt) {
            var disclosureLostFocus =
                this.$container.has(evt.relatedTarget).length === 0;

            if (disclosureLostFocus) {
              this._hideList();
            }
          }.bind(this)
        );

        this.cache.$disclosureList.on(
          'focusout',
          function(evt) {
            var childInFocus =
                $(evt.currentTarget).has(evt.relatedTarget).length > 0;
            var isVisible = this.cache.$disclosureList.hasClass(
              classes.listVisible
            );

            if (isVisible && !childInFocus) {
              this._hideList();
            }
          }.bind(this)
        );

        this.$container.on(
          'keyup',
          function(evt) {
            if (evt.which !== 27) return;
            this._hideList();
            this.cache.$disclosureToggle.focus();
          }.bind(this)
        );

        $('body').on(
          'click',
          function(evt) {
            var isOption = this.$container.has(evt.target).length > 0;
            var isVisible = this.cache.$disclosureList.hasClass(
              classes.listVisible
            );

            if (isVisible && !isOption) {
              this._hideList();
            }
          }.bind(this)
        );
      },

      _submitForm: function(value) {
        $('body').addClass('unloading');
        this.cache.$disclosureInput.val(value);
        this.$container.parents('form').submit();
      },

      _hideList: function() {
        this.cache.$disclosureList.removeClass(classes.listVisible);
        this.cache.$disclosureToggle.attr('aria-expanded', false);
      },

      unload: function() {
        this.cache.$disclosureOptions.off();
        this.cache.$disclosureToggle.off();
        this.cache.$disclosureList.off();
        this.$container.off();
      }
    });

    return Disclosure;
  })();

  theme.ProductMedia = (function() {
    var modelJsonSections = {};
    var models = {};
    var xrButtons = {};

    var selectors = {
      mediaGroup: '[data-product-single-media-group]',
      xrButton: '[data-shopify-xr]'
    };

    function init(modelViewerContainers, sectionId) {
      modelJsonSections[sectionId] = {
        loaded: false
      };

      modelViewerContainers.each(function(index) {
        var $modelViewerContainer = $(this);
        var mediaId = $modelViewerContainer.data('media-id');
        var $modelViewerElement = $(
          $modelViewerContainer.find('model-viewer')[0]
        );
        var modelId = $modelViewerElement.data('model-id');

        if (index === 0) {
          var $xrButton = $modelViewerContainer
          .closest(selectors.mediaGroup)
          .find(selectors.xrButton);
          xrButtons[sectionId] = {
            $element: $xrButton,
            defaultId: modelId
          };
        }

        models[mediaId] = {
          modelId: modelId,
          sectionId: sectionId,
          $container: $modelViewerContainer,
          $element: $modelViewerElement
        };
      });

      window.Shopify.loadFeatures([
        {
          name: 'shopify-xr',
          version: '1.0',
          onLoad: setupShopifyXr
        },
        {
          name: 'model-viewer-ui',
          version: '1.0',
          onLoad: setupModelViewerUi
        }
      ]);

      theme.LibraryLoader.load('modelViewerUiStyles');
    }

    function setupShopifyXr(errors) {
      if (errors) return;

      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', function() {
          setupShopifyXr();
        });
        return;
      }

      for (var sectionId in modelJsonSections) {
        if (modelJsonSections.hasOwnProperty(sectionId)) {
          var modelSection = modelJsonSections[sectionId];

          if (modelSection.loaded) continue;
          var $modelJson = $('#ModelJson-' + sectionId);

          window.ShopifyXR.addModels(JSON.parse($modelJson.html()));
          modelSection.loaded = true;
        }
      }
      window.ShopifyXR.setupXRElements();
    }

    function setupModelViewerUi(errors) {
      if (errors) return;

      for (var key in models) {
        if (models.hasOwnProperty(key)) {
          var model = models[key];
          if (!model.modelViewerUi && Shopify) {
            model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
          }
          setupModelViewerListeners(model);
        }
      }
    }

    function setupModelViewerListeners(model) {
      var xrButton = xrButtons[model.sectionId];
      model.$container.on('mediaVisible', function() {
        xrButton.$element.attr('data-shopify-model3d-id', model.modelId);
        if (theme.config.isTouch) return;
        model.modelViewerUi.play();
      });

      model.$container
      .on('mediaHidden', function() {
        xrButton.$element.attr('data-shopify-model3d-id', xrButton.defaultId);
        model.modelViewerUi.pause();
      })
      .on('xrLaunch', function() {
        model.modelViewerUi.pause();
      });
    }

    function removeSectionModels(sectionId) {
      for (var key in models) {
        if (models.hasOwnProperty(key)) {
          var model = models[key];
          if (model.sectionId === sectionId) {
            delete models[key];
          }
        }
      }
      delete modelJsonSections[sectionId];
    }

    return {
      init: init,
      removeSectionModels: removeSectionModels
    };
  })();


  theme.customerTemplates = (function() {

    function initEventListeners() {
      // Show reset password form
      $('#RecoverPassword').on('click', function(evt) {
        evt.preventDefault();
        toggleRecoverPasswordForm();
      });

      // Hide reset password form
      $('#HideRecoverPasswordLink').on('click', function(evt) {
        evt.preventDefault();
        toggleRecoverPasswordForm();
      });
    }

    /**
     *
     *  Show/Hide recover password form
     *
     */
    function toggleRecoverPasswordForm() {
      $('#RecoverPasswordForm').toggleClass('hide');
      $('#CustomerLoginForm').toggleClass('hide');
    }

    /**
     *
     *  Show reset password success message
     *
     */
    function resetPasswordSuccess() {
      var $formState = $('.reset-password-success');

      // check if reset password form was successfully submitted
      if (!$formState.length) {
        return;
      }

      // show success message
      $('#ResetSuccess').removeClass('hide');
    }

    /**
     *
     *  Show/hide customer address forms
     *
     */
    function customerAddressForm() {
      var $newAddressForm = $('#AddressNewForm');
      var $addressForms = $('.js-address-form');

      if (!$newAddressForm.length || !$addressForms.length) {
        return;
      }

      if (Shopify) {
        $('.js-address-country').each(function() {
          var $container = $(this);
          var countryId = $container.data('country-id');
          var provinceId = $container.data('province-id');
          var provinceContainerId = $container.data('province-container-id');

          if (Shopify) {
            new Shopify.CountryProvinceSelector(
              countryId,
              provinceId,
              {
                hideElement: provinceContainerId
              }
            );
          }
        });
      }

      // Toggle new/edit address forms
      $('.address-new-toggle').on('click', function() {
        $newAddressForm.toggleClass('hide');
      });

      $('.address-edit-toggle').on('click', function() {
        var formId = $(this).data('form-id');
        $('#EditAddress_' + formId).toggleClass('hide');
      });

      $('.address-delete').on('click', function() {
        var $el = $(this);
        var formId = $el.data('form-id');
        var confirmMessage = $el.data('confirm-message');

        if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
          if (Shopify) {
            Shopify.postLink('/account/addresses/' + formId, {parameters: {_method: 'delete'}});
          }
        }
      });
    }

    /**
     *
     *  Check URL for reset password hash
     *
     */
    function checkUrlHash() {
      var hash = window.location.hash;

      // Allow deep linking to recover password form
      if (hash === '#recover') {
        toggleRecoverPasswordForm();
      }
    }

    return {
      init: function() {
        checkUrlHash();
        initEventListeners();
        resetPasswordSuccess();
        customerAddressForm();
      }
    };
  })();


  theme.Product = (function() {

    var classes = {
      onSale: 'sale-price',
      disabled: 'disabled',
      isModal: 'is-modal',
      loading: 'loading',
      loaded: 'loaded',
      hidden: 'hide',
      interactable: 'video-interactable',
      visuallyHide: 'visually-invisible'
    };

    var selectors = {
      productVideo: '.product__video',
      videoParent: '.product__video-wrapper',
      currentSlide: '.slick-current',
      startingSlide: '.starting-slide'
    };

    var youtubeReady;
    var videos = {};
    var youtubePlayers = [];
    var youtubeVideoOptions = {
      height: '480',
      width: '850',
      playerVars :{
        autohide: 0,
        autoplay: 0,
        branding: 0,
        cc_load_policy: 0,
        controls: 0,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        quality: 'hd720',
        rel: 0,
        showinfo: 0,
        wmode: 'opaque'
      }
    };

    function onVideoPlayerReady(evt, id) {
      var $player = $('#' + id);
      var playerId = $player.attr('id');
      youtubePlayers[playerId] = evt.target; // update stored player
      var player = youtubePlayers[playerId];

      setParentAsLoading($player);

      if (videos[playerId].style === 'muted') {
        youtubePlayers[playerId].mute();
      } else {
        setParentAsLoaded($player);
      }

      // If first slide or only photo, start video
      if ($player.closest(selectors.startingSlide).length || $player.data('image-count') === 1) {
        if (videos[playerId].style === 'muted') {
          youtubePlayers[playerId].playVideo();
          initCheckVisibility(playerId);
        }
      }
    }

    function initCheckVisibility(playerId) {
      // Add out of view pausing
      videoVisibilityCheck(playerId);
      $(window).on('scroll.' + playerId, {id: playerId}, $.throttle(150, videoVisibilityCheck));
    }

    function videoVisibilityCheck(id) {
      var playerId;

      if (typeof id === 'string') {
        playerId = id;
      } else {
        // Data comes in as part of the scroll event
        if (!id.data) {return}
        playerId = id.data.id;
      }

      if (theme.isElementVisible($('#' + playerId))) {
        if (videos[playerId] && videos[playerId].style === 'unmuted') {
          return;
        }
        playVisibleVideo(playerId);
      } else {
        pauseHiddenVideo(playerId);
      }
    }

    function playVisibleVideo(id) {
      if (youtubePlayers[id] && typeof youtubePlayers[id].playVideo === 'function') {
        youtubePlayers[id].playVideo();
      }
    }

    function pauseHiddenVideo(id) {
      if (youtubePlayers[id] && typeof youtubePlayers[id].pauseVideo === 'function') {
        youtubePlayers[id].pauseVideo();
      }
    }

    function onVideoStateChange(evt, id) {
      var $player = $('#' + id);
      var playerId = $player.attr('id');
      var player = youtubePlayers[playerId];

      switch (evt.data) {
        case -1: // unstarted
          // Handle low power state on iOS by checking if
          // video is reset to unplayed after attempting to buffer
          if (videos[playerId].attemptedToPlay) {
            setParentAsLoaded($player);
            setVideoToBeInteractedWith($player);
          }
          break;
        case 0: // ended
          if (videos[playerId] && videos[playerId].loop) {
            player.playVideo();
          }
          break;
        case 1: // playing
          setParentAsLoaded($player);
          break;
        case 3: // buffering
          videos[playerId].attemptedToPlay = true;
          break;
      }
    }

    function setParentAsLoading($el) {
      $el
      .closest(selectors.videoParent)
      .addClass(classes.loading);
    }

    function setParentAsLoaded($el) {
      $el
      .closest(selectors.videoParent)
      .removeClass(classes.loading)
      .addClass(classes.loaded);
    }

    function setVideoToBeInteractedWith($el) {
      $el
      .closest(selectors.videoParent)
      .addClass(classes.interactable);
    }

    function Product(container) {
      var $container = this.$container = $(container);
      var sectionId = this.sectionId = $container.attr('data-section-id');

      this.inModal = $container.closest('.modal').length;
      this.$modal;

      this.settings = {
        enableHistoryState: $container.data('enable-history-state') || false,
        namespace: '.product-' + sectionId,
        inventory: $container.data('inventory') || false,
        incomingInventory: $container.data('incoming-inventory') || false,
        modalInit: false,
        slickMainInitialized: false,
        slickThumbInitialized: false,
        thumbArrows: false,
        thumbVertical: false,
        hasImages: true,
        hasMultipleImages: false,
        imageSetName: null,
        imageSetIndex: null,
        currentImageSet: null,
        imageSize: '620x',
        currentSlideIndex: 0,
        videoLooping: $container.data('video-looping')
      };

      // Overwrite some settings when loaded in modal
      if (this.inModal) {
        this.settings.enableHistoryState = false;
        this.settings.namespace = '.product-' + sectionId + '-modal';
        this.$modal = $('#QuickShopModal-' + sectionId);
      }

      this.selectors = {
        variantsJson: 'VariantsJson-' + sectionId,
        currentVariantJson: 'CurrentVariantJson-' + sectionId,

        media: '[data-product-media-type-model]',
        closeMedia: '.product-single__close-media',
        photoThumbs: '.product__thumb-' + sectionId,
        thumbSlider: '#ProductThumbs-' + sectionId,
        mainSlider: '#ProductPhotos-' + sectionId,
        imageContainer: '[data-product-images]',
        productImageMain: '.product-image-main--' + sectionId,
        dotsContainer: '.product__photo-dots--' + sectionId,

        priceWrapper: '.product__price-wrap-' + sectionId,
        price: '#ProductPrice-' + sectionId,
        comparePrice: '#ComparePrice-' + sectionId,
        priceA11y: '#PriceA11y-' + sectionId,
        comparePriceA11y: '#ComparePriceA11y-' + sectionId,
        unitWrapper: '.product__unit-price-wrapper--' + sectionId,
        unitPrice: '.product__unit-price--' + sectionId,
        unitPriceBaseUnit: '.product__unit-base--' + sectionId,
        sku: '#Sku-' + sectionId,
        inventory: '#ProductInventory-' + sectionId,
        incomingInventory: '#ProductIncomingInventory-' + sectionId,

        addToCart: '#AddToCart-' + sectionId,
        addToCartText: '#AddToCartText-' + sectionId,

        originalSelectorId: '#ProductSelect-' + sectionId,
        singleOptionSelector: '.variant__input-' + sectionId,
        variantColorSwatch: '.variant__input--color-swatch-' + sectionId,

        modalFormHolder: '#ProductFormHolder-' + sectionId,
        formContainer: '#AddToCartForm-' + sectionId,
        availabilityContainer: 'StoreAvailabilityHolder-' + sectionId
      };

      this.$mainSlider = $(this.selectors.mainSlider);
      this.$thumbSlider = $(this.selectors.thumbSlider);
      this.$firstProductImage = this.$mainSlider.find('img').first();

      if (!this.$firstProductImage.length) {
        this.settings.hasImages = false;
      }

      this.settings.imageSetName = this.$mainSlider.find('[data-set-name]').data('set-name');

      this.init();
    }

    Product.prototype = $.extend({}, Product.prototype, {
      init: function() {
        if (this.inModal) {
          this.$container.addClass(classes.isModal);
          $('body')
          .off('modalOpen.QuickShopModal-' + this.sectionId)
          .off('modalClose.QuickShopModal-' + this.sectionId);
          $('body').on('modalOpen.QuickShopModal-' + this.sectionId, this.openModalProduct.bind(this));
          $('body').on('modalClose.QuickShopModal-' + this.sectionId, this.closeModalProduct.bind(this));
        }

        if (!this.inModal) {
          this.stringOverrides();
          this.formSetup();
          this.productSetup();

          this.checkIfVideos();
          this.createImageCarousels();
          this.customMediaListners();
        }
      },

      formSetup: function() {
        // Determine how to handle variant availability selectors
        if (theme.settings.dynamicVariantsEnable) {
          this.$variantSelectors = $(this.selectors.formContainer).find(this.selectors.singleOptionSelector);
        }

        this.initQtySelector();
        this.initAjaxProductForm();
        this.availabilitySetup();
        this.initVariants();
      },

      availabilitySetup: function() {
        var container = document.getElementById(this.selectors.availabilityContainer);
        if (container) {
          this.storeAvailability = new theme.StoreAvailability(container);
        }
      },

      productSetup: function() {
        this.setImageSizes();
        this.initImageSwitch();
        this.initImageZoom();
        this.initModelViewerLibraries();
        this.initShopifyXrLaunch();
      },

      stringOverrides: function() {
        theme.productStrings = theme.productStrings || {};
        $.extend(theme.strings, theme.productStrings);
      },

      setImageSizes: function() {
        if (!this.settings.hasImages) {
          return;
        }

        // Get srcset image src, works on most modern browsers
        // otherwise defaults to settings.imageSize
        var currentImage = this.$firstProductImage[0].currentSrc;

        if (currentImage) {
          this.settings.imageSize = theme.Images.imageSize(currentImage);
        }
      },

      initVariants: function() {
        console.log(this.$container);
        if (!document.getElementById(this.selectors.variantsJson)) {
          return;
        }

        this.variantsObject = JSON.parse(document.getElementById(this.selectors.variantsJson).innerHTML);

        var options = {
          $container: this.$container,
          enableHistoryState: this.settings.enableHistoryState,
          singleOptionSelector: this.selectors.singleOptionSelector,
          originalSelectorId: this.selectors.originalSelectorId,
          variants: this.variantsObject
        };

        if ($(this.selectors.variantColorSwatch).length) {
          $(this.selectors.variantColorSwatch).on('change', function(evt) {
            var $el = $(evt.currentTarget);
            var color = $el.data('color-name');
            var index = $el.data('color-index');
            this.updateColorName(color, index);
          }.bind(this));
        }

        this.variants = new theme.Variants(options);

        // Product availability on page load
        if (this.storeAvailability) {
          this.storeAvailability.updateContent(
            this.variants.currentVariant.id
          );
          // On variant change
          this.$container.on('variantChange' + this.settings.namespace, this.updateAvailability.bind(this));
        }

        this.$container
        .on('variantChange' + this.settings.namespace, this.updateCartButton.bind(this))
        .on('variantImageChange' + this.settings.namespace, this.updateVariantImage.bind(this))
        .on('variantPriceChange' + this.settings.namespace, this.updatePrice.bind(this))
        .on('variantUnitPriceChange' + this.settings.namespace, this.updateUnitPrice.bind(this));

        if ($(this.selectors.sku).length) {
          this.$container.on('variantSKUChange' + this.settings.namespace, this.updateSku.bind(this));
        }
        if (this.settings.inventory || this.settings.incomingInventory) {
          this.$container.on('variantChange' + this.settings.namespace, this.updateInventory.bind(this));
        }

        // Update individual variant availability on each selection
        if (theme.settings.dynamicVariantsEnable && document.getElementById(this.selectors.currentVariantJson)) {
          this.currentVariantObject = JSON.parse(document.getElementById(this.selectors.currentVariantJson).innerHTML);

          this.$variantSelectors.on('change' + this.settings.namespace, this.updateVariantAvailability.bind(this));

          // Set default state based on current selected variant
          this.setCurrentVariantAvailability(this.currentVariantObject, true);
        }

        if (this.settings.imageSetName) {
          this.settings.imageSetIndex = $(this.selectors.formContainer).find('.variant-input-wrap[data-handle="'+this.settings.imageSetName+'"]').data('index');
          this.$container.on('variantChange' + this.settings.namespace, this.updateImageSet.bind(this))
        }
      },

      /*============================================================================
        Variant change methods
      ==============================================================================*/
      updateColorName: function(color, index) {
        // Updates on radio button change, not variant.js
        $('#VariantColorLabel-' + this.sectionId + '-' + index).text(color);
      },

      initQtySelector: function() {
        this.$container.find('.js-qty__wrapper').each(function() {
          new theme.QtySelector($(this), {
            namespace: '.product'
          });
        });
      },

      initAjaxProductForm: function() {
        if (theme.settings.cartType === 'drawer') {
          new theme.AjaxProduct($(this.selectors.formContainer));
        }
      },

      /*============================================================================
        Dynamic variant availability
          - To disable, set dynamicVariantsEnable to false in theme.liquid
      ==============================================================================*/
      setCurrentVariantAvailability: function(variant) {
        var valuesToEnable = {
          option1: [],
          option2: [],
          option3: []
        };

        // Disable all options to start
        this.disableVariantGroup($(this.selectors.formContainer).find('.variant-input-wrap'));

        // Combine all available variants
        var availableVariants = this.variantsObject.filter(function(el) {
          if (variant.id === el.id) {
            return false;
          }

          // Option 1
          if (variant.option2 === el.option2 && variant.option3 === el.option3) {
            return true;
          }

          // Option 2
          if (variant.option1 === el.option1 && variant.option3 === el.option3) {
            return true;
          }

          // Option 3
          if (variant.option1 === el.option1 && variant.option2 === el.option2) {
            return true;
          }
        });


        // IE11 can't handle shortform of {variant} so extra step is needed
        var variantObject = {
          variant: variant
        };

        availableVariants = Object.assign({}, variantObject, availableVariants);

        // Loop through each available variant to gather variant values
        for (var property in availableVariants) {
          if (availableVariants.hasOwnProperty(property)) {
            var item = availableVariants[property];
            var option1 = item.option1;
            var option2 = item.option2;
            var option3 = item.option3;

            if (option1) {
              if (valuesToEnable.option1.indexOf(option1) === -1) {
                valuesToEnable.option1.push(option1);
              }
            }
            if (option2) {
              if (valuesToEnable.option2.indexOf(option2) === -1) {
                valuesToEnable.option2.push(option2);
              }
            }
            if (option3) {
              if (valuesToEnable.option3.indexOf(option3) === -1) {
                valuesToEnable.option3.push(option3);
              }
            }
          }
        }

        // Have values to enable, separated by option index
        if (valuesToEnable.option1.length) {
          this.enableVariantOptionByValue(valuesToEnable.option1, 'option1');
        }
        if (valuesToEnable.option2.length) {
          this.enableVariantOptionByValue(valuesToEnable.option2, 'option2');
        }
        if (valuesToEnable.option3.length) {
          this.enableVariantOptionByValue(valuesToEnable.option3, 'option3');
        }
      },

      updateVariantAvailability: function(evt, value, index) {
        if (value && index) {
          var newVal = value;
          var optionIndex = index;
        } else {
          var $el = $(evt.currentTarget);
          var newVal = $el.val() ? $el.val() : evt.currentTarget.value;
          var optionIndex = $el.data('index');
        }

        var variants = this.variantsObject.filter(function(el) {
          return el[optionIndex] === newVal;
        });

        // Disable all buttons/dropdown options that aren't the current index
        $(this.selectors.formContainer).find('.variant-input-wrap').each(function(index, el) {
          var $group = $(el);
          var currentOptionIndex = $group.data('index');

          if (currentOptionIndex !== optionIndex) {
            // Disable all options as a starting point
            this.disableVariantGroup($group);

            // Loop through legit available options and enable
            for (var i = 0; i < variants.length; i++) {
              this.enableVariantOption($group, variants[i][currentOptionIndex]);
            }
          }
        }.bind(this));
      },

      disableVariantGroup: function($group) {
        if (theme.settings.dynamicVariantType === 'dropdown') {
          $group.find('option').prop('disabled', true)
        } else {
          $group.find('input').prop('disabled', true);
          $group.find('label').toggleClass('disabled', true);
        }
      },

      enableVariantOptionByValue: function(array, index) {
        var $group = $(this.selectors.formContainer).find('.variant-input-wrap[data-index="'+ index +'"]');

        for (var i = 0; i < array.length; i++) {
          this.enableVariantOption($group, array[i]);
        }
      },

      enableVariantOption: function($group, value) {
        // Selecting by value so escape it
        value = value.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1');

        if (theme.settings.dynamicVariantType === 'dropdown') {
          $group.find('option[value="'+ value +'"]').prop('disabled', false);
        } else {
          var $buttonGroup = $group.find('.variant-input[data-value="'+ value +'"]');
          $buttonGroup.find('input').prop('disabled', false);
          $buttonGroup.find('label').toggleClass('disabled', false);
        }
      },

      updateCartButton: function(evt) {
        var variant = evt.variant;

        if (variant) {
          if (variant.available) {
            // Available, enable the submit button and change text
            $(this.selectors.addToCart).removeClass(classes.disabled).prop('disabled', false);
            var defaultText = $(this.selectors.addToCartText).data('default-text');
            $(this.selectors.addToCartText).html(defaultText);
          } else {
            // Sold out, disable the submit button and change text
            $(this.selectors.addToCart).addClass(classes.disabled).prop('disabled', true);
            $(this.selectors.addToCartText).html(theme.strings.soldOut);
          }
        } else {
          // The variant doesn't exist, disable submit button
          $(this.selectors.addToCart).addClass(classes.disabled).prop('disabled', true);
          $(this.selectors.addToCartText).html(theme.strings.unavailable);
        }
      },

      updatePrice: function(evt) {
        var variant = evt.variant;

        if (variant) {  



          // Regular price
          $(this.selectors.price).html(theme.Currency.formatMoney(variant.price, theme.settings.moneyFormat)).show();
          // Regular price
          $("#ProductPrice-sticky").html(theme.Currency.formatMoney(variant.price, theme.settings.moneyFormat)).show();

          // Sale price, if necessary
          if (variant.compare_at_price > variant.price)
          { 
            var saleicon = $('.hiddenintially').html();
            $('.saleicon').show();
            $('.saleicon').html(saleicon);
            $('.yousave').show();

            /* sticky add to cart trigger */
            var saleicon = $('.hiddenintially2').html();
            $('.saleicon2').show();
            $('.saleicon2').html(saleicon);
            $('.yousave2').show();
            /* sticky add to cart trigger */


            var saleprice = variant.compare_at_price - variant.price;
            var calcPerc = (variant.compare_at_price - variant.price) * 100 / variant.compare_at_price;    
            var   perC = Math.round(calcPerc);    

            var onsale = theme.Currency.formatMoney(variant.compare_at_price - variant.price, theme.settings.moneyFormat);        

            $('.yousave span.perc').html(perC);
            $('.yousave2 span.perc2').html(perC);
            $('.yousave span.onsaleprice').html(onsale);

            $('.yousave').html('You save <span class="perc">' + perC + '%</span> (<span class="onsaleprice">' + onsale + '</span>)');
            $('.yousave2').html('<span class="perc2">' + perC + '</span>% off');

            //alert();
            $(this.selectors.comparePrice).html(theme.Currency.formatMoney(variant.compare_at_price, theme.settings.moneyFormat));
            $(this.selectors.priceWrapper).removeClass(classes.hidden);
            $(this.selectors.price).addClass(classes.onSale);
            $(this.selectors.comparePriceA11y).attr('aria-hidden', 'false');
            $(this.selectors.priceA11y).attr('aria-hidden', 'false');



          } else {
            $(this.selectors.priceWrapper).addClass(classes.hidden);
            $(this.selectors.price).removeClass(classes.onSale);
            $(this.selectors.comparePriceA11y).attr('aria-hidden', 'true');
            $(this.selectors.priceA11y).attr('aria-hidden', 'true');



            $('.saleicon').hide();
            $('.yousave').hide();

            $('.saleicon2').hide();
            $('.yousave2').hide();

          }
        }
      },

      updateUnitPrice: function(evt) {
        var variant = evt.variant;

        if (variant && variant.unit_price) {
          $(this.selectors.unitPrice).html(theme.Currency.formatMoney(variant.unit_price, theme.settings.moneyFormat));
          $(this.selectors.unitPriceBaseUnit).text(theme.Currency.getBaseUnit(variant));
          $(this.selectors.unitWrapper).removeClass(classes.hidden).removeClass(classes.visuallyHide);
        } else {
          $(this.selectors.unitWrapper).addClass(classes.visuallyHide);
        }
      },

      updateImageSet: function(evt) {
        // If called directly, use current variant
        var variant = evt ? evt.variant : (this.variants ? this.variants.currentVariant : null);
        if (!variant) {
          return;
        }

        var groupIndex = this.settings.imageSetIndex;
        if (!groupIndex) {
          return;
        }

        var setValue = variant[groupIndex].toLowerCase().replace(' ','-');

        // Already on the current image group
        if (this.settings.currentImageSet === setValue) {
          return;
        }

        var set = this.settings.imageSetName + '_' + setValue;

        if (this.settings.slickMainInitialized) {
          this.$mainSlider.slick('slickUnfilter');
          this.$mainSlider.slick('slickFilter', '[data-group="'+set+'"]').slick('refresh');
        }
        if (this.settings.slickThumbInitialized) {
          this.$thumbSlider.slick('slickUnfilter');
          this.$thumbSlider.slick('slickFilter', '[data-group="'+set+'"]').slick('refresh');
        }

        this.settings.currentImageSet = setValue;
      },

      updateSku: function(evt) {
        var variant = evt.variant;
        var newSku = '';

        if (variant) {
          if (variant.sku) {
            newSku = variant.sku;
          }

          $(this.selectors.sku).html(newSku);
        }
      },

      updateInventory: function(evt) {
        var variant = evt.variant;

        // Hide stock if no inventory management or policy is continue
        if (!variant || !variant.inventory_management || variant.inventory_policy === 'continue') {
          this.toggleInventoryQuantity(false);
          this.toggleIncomingInventory(false);
          return;
        }

        if (variant.inventory_management === 'shopify' && window.inventories && window.inventories[this.sectionId]) {
          variantInventoryObject = window.inventories[this.sectionId][variant.id];
          var quantity = variantInventoryObject.quantity;
          var showInventory = true;
          var showIncomingInventory = false;

          if (quantity <= 0 || quantity > theme.settings.inventoryThreshold) {
            showInventory = false;
          }

          this.toggleInventoryQuantity(showInventory, quantity);

          if (!showInventory && variantInventoryObject.incoming) {
            showIncomingInventory = true;
          }

          this.toggleIncomingInventory(showIncomingInventory, variant.available, variantInventoryObject.next_incoming_date);
        }
      },

      updateAvailability: function(evt) {
        var variant = evt.variant;
        if (!variant) {
          return;
        }

        this.storeAvailability.updateContent(variant.id);
      },

      toggleInventoryQuantity: function(show, qty) {
        if (!this.settings.inventory) {
          show = false;
        }

        if (show) {
          $(this.selectors.inventory)
          .removeClass(classes.hidden)
          .text(theme.strings.stockLabel.replace('[count]', qty));
        } else {
          $(this.selectors.inventory).addClass(classes.hidden);
        }
      },

      toggleIncomingInventory: function(show, available, date) {
        if (!this.settings.incomingInventory) {
          show = false;
        }

        if (show) {
          var string = available ?
              theme.strings.willNotShipUntil.replace('[date]', date) :
          theme.strings.willBeInStockAfter.replace('[date]', date);

          if (!date) {
            string = theme.strings.waitingForStock;
          }

          $(this.selectors.incomingInventory)
          .removeClass(classes.hidden)
          .text(string);
        } else {
          $(this.selectors.incomingInventory).addClass(classes.hidden);
        }
      },

      /*============================================================================
        Product videos
      ==============================================================================*/
      checkIfVideos: function() {
        var $productVideos = this.$mainSlider.find(selectors.productVideo);

        // Stop if there are 0 videos
        if (!$productVideos.length) {
          return false;
        }

        var videoTypes = [];

        $productVideos.each(function() {
          var type = $(this).data('video-type');

          if (videoTypes.indexOf(type) < 0) {
            videoTypes.push(type);
          }
        });

        // Load YouTube API if not already loaded
        if (videoTypes.indexOf('youtube') > -1) {
          if (!theme.config.youTubeReady) {
            theme.LibraryLoader.load('youtubeSdk');
            $('body').on('youTubeReady' + this.settings.namespace, function() {
              this.loadYoutubeVideos($productVideos);
            }.bind(this));
          } else {
            this.loadYoutubeVideos($productVideos);
          }
        }

        // Add mp4 video players
        if (videoTypes.indexOf('mp4') > -1) {
          this.loadMp4Videos($productVideos);
        }

        return videoTypes;
      },

      loadMp4Videos: function($videos) {
        $videos.each(function() {
          var $el = $(this);
          if ($el.data('video-type') != 'mp4') {
            return;
          }

          var id = $el.attr('id');
          var videoId = $el.data('video-id');

          videos[id] = {
            type: 'mp4',
            divId: id,
            style: $el.data('video-style')
          };
        });
      },

      loadYoutubeVideos: function($videos) {
        $videos.each(function() {
          var $el = $(this);
          if ($el.data('video-type') != 'youtube') {
            return;
          }

          var id = $el.attr('id');
          var videoId = $el.data('youtube-id');

          videos[id] = {
            type: 'youtube',
            id: id,
            videoId: videoId,
            style: $el.data('video-style'),
            loop: $el.data('video-loop'),
            attemptedToPlay: false,
            events: {
              onReady: function(evt) {
                onVideoPlayerReady(evt, id);
              },
              onStateChange: function(evt) {
                onVideoStateChange(evt, id);
              }
            }
          };
        });

        // Create a player for each YouTube video
        for (var key in videos) {
          if (videos[key].type === 'youtube') {
            if (videos.hasOwnProperty(key)) {
              var args = $.extend({}, youtubeVideoOptions, videos[key]);

              if (args.style === 'muted') {
                // default youtubeVideoOptions, no need to change anything
              } else {
                args.playerVars.controls = 1;
                args.playerVars.autoplay = 0;
              }

              youtubePlayers[key] = new YT.Player(key, args);
            }
          }
        }

        youtubeReady = true;
      },

      initVideo: function($video) {
        var videoType = $video.data('video-type');
        var divId = $video.attr('id');

        if (videoType === 'mp4' && videos[divId].style === 'muted') {
          this.playMp4Video(divId);
        }

        if (videoType === 'youtube') {
          if (youtubeReady && videos[divId].style === 'muted') {
            this.requestToPlayYoutubeVideo(divId);
          }
        }

        // Hacky way to trigger resetting the slider layout in modals
        if (this.inModal) {
          this.resizeSlides();
        }
      },

      stopVideo: function(id, type) {
        if (!id) {
          this.stopYoutubeVideo();
          this.stopMp4Video();
        }

        if (type === 'youtube') {
          this.stopYoutubeVideo(id);
        }

        if (type === 'mp4') {
          this.stopMp4Video(id);
        }
      },

      getVideoType: function($video) {
        return $video.data('video-type');
      },

      getVideoId: function($video) {
        return $video.attr('id');
      },

      // Sub video functions (MP4 and YouTube)
      requestToPlayYoutubeVideo: function(id, forcePlay) {
        if (!theme.config.youTubeReady) {
          return;
        }

        var $player = $('#' + id);
        setParentAsLoading($player);

        // If video is requested too soon, player might not be ready.
        // Set arbitrary timeout to request it again in a second
        if (typeof youtubePlayers[id].playVideo != 'function') {
          setTimeout(function() {
            this.playYoutubeVideo(id, forcePlay);
          }.bind(this), 1000);
          return;
        }

        this.playYoutubeVideo(id, forcePlay);
      },

      playYoutubeVideo: function (id, forcePlay) {
        var $player = $('#' + id);
        setParentAsLoaded($player);
        if (typeof youtubePlayers[id].playVideo === 'function') {
          youtubePlayers[id].playVideo();
        }

        // forcePlay is sent as true from beforeSlideChange so the visibility
        // check isn't fooled by the next slide positioning
        if (!forcePlay) {
          initCheckVisibility(id);
        }
      },

      stopYoutubeVideo: function(id) {
        if (!theme.config.youTubeReady) {
          return;
        }

        if (id && youtubePlayers[id]) {
          if (typeof youtubePlayers[id].pauseVideo === 'function') {
            youtubePlayers[id].pauseVideo();
          }
          $(window).off('scroll.' + id);
        } else {
          for (key in youtubePlayers) {
            var childVideo = this.$container.find('#' + key);
            if (childVideo.length && typeof youtubePlayers[key].pauseVideo === 'function') {
              youtubePlayers[key].pauseVideo();
              $(window).off('scroll.' + key);
            }
          }
        }
      },

      playMp4Video: function(id) {
        var $player = $('#' + id);
        setParentAsLoaded($player);

        var playPromise = $player[0].play();

        if (playPromise !== undefined) {
          playPromise.then(function() {})
          .catch(function(error) {
            // Likely low power mode on iOS, show controls
            $player[0].setAttribute('controls', '');
            $player.closest(selectors.videoParent).attr('data-video-style', 'unmuted');
          });
        }
      },

      stopMp4Video: function(id) {
        if (id) {
          $('#' + id)[0].pause();
        } else {
          // loop through all mp4 videos to stop them
          for (var key in videos) {
            var childVideo = this.$container.find('#' + key);
            if (childVideo.length && videos[key].type === 'mp4') {
              var player = $('#' + videos[key].divId)[0];
              if (player && typeof player.pause === 'function') {
                player.pause();
              }
            }
          }
        }
      },

      /*============================================================================
        Product images
      ==============================================================================*/
      initImageSwitch: function() {
        if (!$(this.selectors.photoThumbs).length) {
          return;
        }

        var self = this;

        $(this.selectors.photoThumbs)
        .on('click', function(evt) {
          evt.preventDefault();
        })
        .on('focus', function(evt) {
          if (!this.settings.slickThumbInitialized) { return }

          var index = this.getThumbIndex($(evt.currentTarget));
          if (index !== undefined) {
            this.$thumbSlider.slick('slickGoTo', index);
          }
        }.bind(this))
        .on('keydown', function(evt) {
          if (evt.keyCode === 13) {
            this.$container.find(selectors.currentSlide).focus();
          }
        }.bind(this));
      },

      initImageZoom: function() {
        var $container = $(this.selectors.imageContainer, this.$container);
        var imageZoom = new theme.Photoswipe($container[0], this.sectionId);
      },

      getThumbIndex: function($target) {
        var $slide = $target.closest('.product__thumb-item');
        return $slide.index();
      },

      updateVariantImage: function(evt) {
        var variant = evt.variant;
        var sizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_media.preview_image.src, this.settings.imageSize);

        var $newImage = $('.product__thumb[data-id="' + variant.featured_media.id + '"]');
        var imageIndex = this.getThumbIndex($newImage);

        // If there is no index, slider is not initalized
        if (typeof imageIndex === 'undefined') {
          return;
        }

        this.$mainSlider.slick('slickGoTo', imageIndex);
      },

      createImageCarousels: function() {
        if (!this.$thumbSlider.length || $(this.selectors.photoThumbs).length < 2) {
          // Single product image. Init video if it exists
          var $video = $(this.selectors.productImageMain).find(selectors.productVideo);
          if ($video.length) {
            this.initVideo($video);
          }

          return;
        }

        this.settings.hasMultipleImages = true;

        // Set starting slide (for both sliders)
        var $activeSlide = this.$mainSlider.find('.starting-slide');
        var startIndex = this._slideIndex($activeSlide);

        if (this.settings.imageSetName) {
          startIndex = this.$mainSlider.find('[data-set-name="' + this.settings.imageSetName + '"]').index();
        }

        // Lame way to prevent duplicate event listeners
        this.$mainSlider.off('init');
        this.$mainSlider.off('beforeChange');
        this.$mainSlider.on('init', this.mainSlideInit.bind(this));
        this.$mainSlider.on('beforeChange', this.beforeSlideChange.bind(this));
        this.$thumbSlider.on('init', this.thumbSlideInit.bind(this));

        var thumbnailsVertical = this.settings.thumbVertical = this.$thumbSlider.data('position') === 'beside' ? true : false;
        var thumbArrows = this.settings.thumbArrows = this.$thumbSlider.data('arrows');

        this.$mainSlider.slick({
          accessibility: false,
          adaptiveHeight: true,
          asNavFor: this.selectors.thumbSlider,
          infinite: false,
          arrows: false,
          dots: false,
          initialSlide: startIndex,
          rtl: theme.config.rtl,
          appendDots: this.selectors.dotsContainer
        });

        this.$thumbSlider.slick({
          accessibility: false,
          asNavFor: this.selectors.mainSlider,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: thumbArrows,
          dots: false,
          vertical: thumbnailsVertical,
          verticalSwiping: thumbnailsVertical,
          focusOnSelect: true,
          infinite: false,
          customHeightMatching: thumbArrows ? false : thumbnailsVertical,
          customSlideAdvancement: true,
          rtl: theme.config.rtl,
          initialSlide: startIndex
        });

        if (this.settings.imageSetName) {
          this.updateImageSet();
        }

        // Too many thumbnails can cause the AOS calculations to be off
        // so refresh that when the slider is ready
        if (AOS) {
          AOS.refresh();
        }
      },

      destroyImageCarousels: function() {
        if (this.$mainSlider && this.settings.slickMainInitialized) {
          this.$mainSlider.slick('unslick');
          this.settings.slickMainInitialized = false;
        }

        if (this.$thumbSlider && this.settings.slickThumbInitialized) {
          this.$thumbSlider.slick('unslick');
          this.settings.slickThumbInitialized = false;
        }

        this.settings.slickMainInitialized = false;
        this.settings.slickThumbInitialized = false;
      },

      mainSlideInit: function(event, slick) {
        var $slider = slick.$slider;
        var $currentSlide = $slider.find(selectors.currentSlide);
        var $video = $currentSlide.find(selectors.productVideo);

        this.settings.slickMainInitialized = true;
        this.settings.currentSlideIndex = $currentSlide.data('slick-index');

        if ($video.length) {
          this.initVideo($video);
        }
      },

      thumbSlideInit: function(event, slick) {
        this.settings.slickThumbInitialized = true;

        // Check if we need to hide the arrows
        if (this.settings.thumbArrows) {
          this.$thumbSlider.on('setPosition', this.thumbSlideArrowVisibility.bind(this));
        }
      },

      thumbSlideArrowVisibility: function(event, slick) {
        var $slider = slick.$slider;
        var $arrows = $slider.find('.slick-arrow');
        var showArrows = false;

        if (this.settings.thumbVertical) {
          var $trackHeight = $slider.find('.slick-track').height();
          if ($trackHeight >= $slider.height()) {
            showArrows = true;
          }
        } else {
          var $trackWidth = $slider.find('.slick-track').width();
          if ($trackWidth >= $slider.width()) {
            showArrows = true;
          }
        }

        if (showArrows) {
          $arrows.removeClass(classes.hidden);
        } else {
          $arrows.addClass(classes.hidden);
        }
      },

      beforeSlideChange: function(event, slick, currentSlide, nextSlide) {
        if (this.settings.currentSlideIndex === nextSlide) {
          return;
        } else {
          this.settings.currentSlideIndex = nextSlide;
        }

        var $slider = slick.$slider;
        var $currentSlide = $slider.find(selectors.currentSlide);
        var $nextSlide = $slider.find('.slick-slide[data-slick-index="' + nextSlide + '"]');

        $currentSlide.attr('tabindex', '-1');
        $nextSlide.attr('tabindex', 0);

        // Pause any existing slide video
        var $prevVideo = $currentSlide.find('.product__video');
        if (currentSlide !== nextSlide && $prevVideo.length) {
          var prevVideoType = this.getVideoType($prevVideo);
          var prevVideoId = this.getVideoId($prevVideo);

          if (prevVideoId) {
            this.stopVideo(prevVideoId, prevVideoType);
          }
        }

        // Prep next slide video
        var $nextVideo = $nextSlide.find('.product__video');
        if ($nextVideo.length) {
          var nextVideoType = this.getVideoType($nextVideo);
          var nextVideoId = this.getVideoId($nextVideo);

          // Prep YouTube with a backup in case API isn't ready
          if (nextVideoId && nextVideoType === 'youtube') {
            if (youtubeReady) {
              if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                this.requestToPlayYoutubeVideo(nextVideoId, true);
              }
            } else {
              $('body').on('youTubeReady' + this.settings.namespace, function() {
                if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                  this.requestToPlayYoutubeVideo(nextVideoId, true);
                }
              }.bind(this))
            }
          }

          // Autoplay muted MP4 videos
          if (nextVideoId && videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
            if (nextVideoType === 'mp4') {
              this.playMp4Video(nextVideoId);
            }
          }

          // Set unmuted videos to loaded state
          if (nextVideoId && videos[nextVideoId] && videos[nextVideoId].style != 'muted') {
            setParentAsLoaded($('#' + nextVideoId));
          }
        }

        // Pause any existing media
        var $currentMedia = $currentSlide.find(this.selectors.media);
        if ($currentMedia.length) {
          $currentMedia.trigger('mediaHidden');
        }

        // Prep next slide media
        var $nextMedia = $nextSlide.find(this.selectors.media);
        if ($nextMedia.length) {
          $nextMedia.trigger('mediaVisible');
          $nextSlide.find('.shopify-model-viewer-ui__button').attr('tabindex', 0);
          $nextSlide.find('.product-single__close-media').attr('tabindex', 0);
        }
      },

      resizeSlides: function() {
        if (!this.settings.hasMultipleImages) {
          return;
        }

        $(window).trigger('resize.slick');
        setTimeout(function() {
          if (this.$mainSlider && this.settings.slickMainInitialized) {
            this.$mainSlider.slick('setPosition');
          }
          if (this.$thumbSlider && this.settings.slickThumbInitialized) {
            this.$thumbSlider.slick('setPosition');
          }
        }.bind(this), 500); // same timing as modal open transition
      },

      _slideIndex: function($el) {
        return $el.data('index');
      },

      /*============================================================================
        Products when in quick view modal
      ==============================================================================*/
      openModalProduct: function() {
        var initialized = false;
        if (!this.settings.modalInit) {
          var $formHolder = $(this.selectors.modalFormHolder);
          var url = $formHolder.data('url');
          var template = $formHolder.data('template');

          // If no alt template, use stripped down ajax version
          if (template !== 'preorder') {
            url = url + '?view=ajax';
          }

          $formHolder.load(url + ' #AddToCartForm-' + this.sectionId, function() {
            $formHolder.addClass('product-form-holder--loaded');
            this.formSetup();
            if (Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
          }.bind(this));

          this.productSetup();
          this.loadModalContent();
          this.createImageCarousels();
          this.customMediaListners();
          this.settings.modalInit = true;

          document.dispatchEvent(new CustomEvent('quickview:loaded', {
            detail: {
              productId: this.sectionId
            }
          }));
        } else {
          initialized = true;
        }

        this.resizeSlides();
        AOS.refreshHard();

        document.dispatchEvent(new CustomEvent('quickview:open', {
          detail: {
            initialized: initialized,
            productId: this.sectionId
          }
        }));
      },

      closeModalProduct: function() {
        this.stopVideo();
        $('body').off(this.settings.namespace);
        $(window).off(this.settings.namespace);
      },

      loadModalContent: function() {
        // Load videos if they exist
        var videoTypes = this.checkIfVideos();

        // Lazyload mp4 videos
        if (videoTypes && videoTypes.indexOf('mp4') > -1) {
          this.$modal
          .find('.product__video[data-video-type="mp4"]')
          .find('.product__video-src')
          .each(function(i, video) {
            var $el = $(video);
            var src = $el.attr('src');
            var type = $el.attr('type')
            var newEl = document.createElement('source');
            newEl.src = src;
            newEl.type = type;
            $el.after(newEl);
          }.bind(this));
        }
      },

      /*============================================================================
        Product media (3D)
      ==============================================================================*/
      initModelViewerLibraries: function() {
        var $modelViewerElements = $(
          this.selectors.media,
          this.$container
        );

        if ($modelViewerElements.length < 1) return;

        theme.ProductMedia.init($modelViewerElements, this.sectionId);
      },

      initShopifyXrLaunch: function() {
        var self = this;
        $(document).on('shopify_xr_launch', function() {
          var $currentMedia = $(
            self.selectors.productMediaWrapper +
            ':not(.' +
            classes.hidden +
            ')',
            self.$container
          );
          $currentMedia.trigger('xrLaunch');
        });
      },

      customMediaListners: function() {
        $('body').on('click', this.selectors.closeMedia, function() {
          this.$mainSlider
          .find(selectors.currentSlide)
          .find(this.selectors.media)
          .trigger('mediaHidden');
        }.bind(this));

        this.$container.find('model-viewer')
        .on('shopify_model_viewer_ui_toggle_play', function(evt) {
          this.mediaLoaded(evt);
        }.bind(this))
        .on('shopify_model_viewer_ui_toggle_pause', function(evt) {
          this.mediaUnloaded(evt);
        }.bind(this));
      },

      mediaLoaded: function(evt) {
        this.$container.find(this.selectors.closeMedia).removeClass(classes.hidden);
        this.toggleSliderSwiping(false);
      },

      mediaUnloaded: function(evt) {
        this.$container.find(this.selectors.closeMedia).addClass(classes.hidden);
        this.toggleSliderSwiping(true);
      },

      toggleSliderSwiping: function(enable) {
        if (this.$mainSlider && this.settings.slickMainInitialized) {
          this.$mainSlider.slick('slickSetOption', 'swipe', enable);
          this.$mainSlider.slick('slickSetOption', 'draggable', enable);
          this.$mainSlider.slick('slickSetOption', 'touchMove', enable);
          this.$mainSlider.slick('slickSetOption', 'accessibility', enable);
        }
      },

      onUnload: function() {
        this.$container.off(this.settings.namespace);
        $('body').off(this.settings.namespace);
        this.destroyImageCarousels();
        theme.ProductMedia.removeSectionModels(this.sectionId);
      }
    });

    return Product;
  })();

  theme.Recommendations = (function() {

    function Recommendations(container) {
      var $container = this.$container = $(container);
      var sectionId = this.sectionId = $container.attr('data-section-id');
      this.url = $container.data('url');

      this.selectors = {
        recommendations: '#Recommendations-' + sectionId,
        placeholder: '.product-recommendations-placeholder',
        sectionClass: ' .product-recommendations',
        productResults: '.grid-product'
      };

      this.init();
    }

    Recommendations.prototype = $.extend({}, Recommendations.prototype, {
      init: function() {
        var $section = $(this.selectors.recommendations);

        if (!$section.length || $section.data('enable') === false) {
          return;
        }

        var $placeholder = $section.find(this.selectors.placeholder);
        var id = $section.data('product-id');
        var limit = $section.data('limit');

        var url = this.url + '?section_id=product-recommendations&limit='+ limit +'&product_id=' + id;

        $placeholder.load(url + this.selectors.sectionClass, function(data) {
          theme.reinitProductGridItem($section);
          this.updateVariantInventory($section);

          // If no results, hide the entire section
          if ($(data).find(this.selectors.sectionClass).find(this.selectors.productResults).length === 0) {
            $section.addClass('hide');
          }
        }.bind(this));

      },

      // Recommended products load via JS and don't add variant inventory to the
      // global variable that we later check. This function scrapes a data div
      // to get that info and manually add the values.
      updateVariantInventory: function($section) {
        window.inventories = window.inventories || {};

        $section.find('.js-product-inventory-data').each(function() {
          var $el = $(this);
          var sectionId = $el.data('section-id');
          window.inventories[sectionId] = {};
          $('.js-variant-inventory-data', $el).each(function() {
            var $child = $(this);
            window.inventories[sectionId][$child.data('id')] = {
              'quantity': $child.data('quantity'),
              'incoming': $child.data('incoming'),
              'next_incoming_date': $child.data('date')
            }
          });
        });
      }
    });

    return Recommendations;
  })();

  theme.StoreAvailability = (function() {
    var selectors = {
      drawerOpenBtn: '.js-drawer-open-availability',
      productTitle: '[data-availability-product-title]'
    };

    function StoreAvailability(container) {
      this.container = container;
      this.baseUrl = container.dataset.baseUrl;
      this.productTitle = container.dataset.productName;
    }

    StoreAvailability.prototype = Object.assign({}, StoreAvailability.prototype, {
      updateContent: function(variantId) {
        var variantSectionUrl =
            this.baseUrl +
            '/variants/' +
            variantId +
            '/?section_id=store-availability';

        this.container.innerHTML = '';

        var self = this;

        fetch(variantSectionUrl)
        .then(function(response) {
          return response.text();
        })
        .then(function(storeAvailabilityHTML) {
          if (storeAvailabilityHTML.trim() === '') {
            return;
          }

          self.container.innerHTML = storeAvailabilityHTML;
          self.container.innerHTML = self.container.firstElementChild.innerHTML;

          // Only create drawer if have open button
          if (!self.container.querySelector(selectors.drawerOpenBtn)) {
            return;
          }

          self.drawer = new theme.Drawers('StoreAvailabilityDrawer', 'availability');

          self.container.querySelector(selectors.productTitle).textContent = self.productTitle;
        });
      }
    });

    return StoreAvailability;
  })();

  theme.Collection = (function() {
    var isAnimating = false;

    var selectors = {
      sortSelect: '#SortBy',
      tags: '.tags',
      hero: '.collection-hero',
      title: '.collection-title',
      parallaxContainer: '.parallax-container'
    };

    var data = {
      sortBy: 'data-default-sortby'
    };

    var classes = {
      activeTag: 'tag--active'
    };

    function Collection(container) {
      this.container = container;
      this.sectionId = $(container).attr('data-section-id');
      this.namespace = '.collection-' + this.sectionId;

      var $heroImageContainer = this.$heroContainer = $(container).find('.collection-hero');
      if ($heroImageContainer.length) {
        this.checkIfNeedReload();
        theme.loadImageSection($heroImageContainer);

        if ($(container).data('parallax')) {
          var $parallaxContainer = $(container).find(selectors.parallaxContainer);
          var args = {
            namespace: this.namespace
          };
          theme.parallaxSections[this.namespace] = new theme.Parallax($parallaxContainer, args);
        }
      } else if (theme.settings.overlayHeader) {
        theme.headerNav.disableOverlayHeader();
      }

      // Ajax pagination
      $(window).on('popstate', function(state) {
        if (state) {
          this.getNewCollectionContent(location.href);
        }
      }.bind(this));

      this.init();
    }

    Collection.prototype = $.extend({}, Collection.prototype, {
      init: function() {
        // init is called on load and when tags are selected
        this.$container = $(this.container);
        this.sectionId = this.$container.attr('data-section-id');

        this.$sortSelect = $(selectors.sortSelect);
        this.$sortSelect.on('change', this.onSortChange.bind(this));
        this.defaultSort = this.getDefaultSortValue();

        this.initParams();
        this.sortTags();
        this.initTagAjax();
      },

      initTagAjax: function() {
        this.$container.on('click' + this.namespace, '.tags a', function(evt) {
          var $el = $(evt.currentTarget);
          if ($el.hasClass('no-ajax')) {
            return;
          }

          evt.preventDefault();

          if (isAnimating) {
            return;
          }

          isAnimating = true;

          var newUrl = $el.attr('href');
          $(selectors.tags).find('.' + classes.activeTag).removeClass(classes.activeTag);
          $el.parent().addClass(classes.activeTag);
          history.pushState({}, '', newUrl);
          $('.grid-product').addClass('unload');
          this.getNewCollectionContent(newUrl);
        }.bind(this));
      },

      getNewCollectionContent: function(url) {
        url = url.indexOf('?') === -1 ? (url + '?view=ajax') : (url + '&view=ajax');
        $('#CollectionAjaxResult').load(url + ' #CollectionAjaxContent', function(data) {
          isAnimating = false;
          this.reInit(data);
        }.bind(this));
      },

      initParams: function() {
        this.queryParams = {};

        if (location.search.length) {
          var aKeyValue;
          var aCouples = location.search.substr(1).split('&');
          for (var i = 0; i < aCouples.length; i++) {
            aKeyValue = aCouples[i].split('=');
            if (aKeyValue.length > 1) {
              this.queryParams[
                decodeURIComponent(aKeyValue[0])
              ] = decodeURIComponent(aKeyValue[1]);
            }
          }
        }
      },

      getSortValue: function() {
        return this.$sortSelect.val() || this.defaultSort;
      },

      getDefaultSortValue: function() {
        return this.$sortSelect.attr(data.sortBy);
      },

      onSortChange: function() {
        this.queryParams.sort_by = this.getSortValue();

        if (this.queryParams.page) {
          delete this.queryParams.page;
        }

        window.location.search = $.param(this.queryParams);
      },

      sortTags: function() {
        var $sortTags = $('#SortTags');

        if (!$sortTags.length) {
          return;
        }

        $sortTags.on('change', function() {
          location.href = $(this).val();
        });
      },

      reInit: function(data) {
        // Reload collection template (it can be anywhere in the sections.instance array)
        for (var i = 0; i < sections.instances.length; i++) {
          var instance = sections.instances[i];
          if (instance['type'] === 'collection-template') {
            instance.forceReload();
          }
        }

        // Update collection title
        if (data) {
          var title = $(data).find(selectors.title).text();
          $(selectors.title).text(title);
        }

        theme.reinitProductGridItem();
      },

      forceReload: function() {
        this.onUnload();
        this.init();
      },

      // A liquid variable in the header needs a full page refresh
      // if the collection header hero image setting is enabled
      // and the header is set to sticky. Only necessary in the editor.
      checkIfNeedReload: function() {
        if (!Shopify.designMode) {
          return;
        }

        if (theme.settings.overlayHeader) {
          if (!$('.header-wrapper').hasClass('header-wrapper--overlay')) {
            location.reload();
          }
        }
      },

      onUnload: function() {
        $(window).off(this.namespace);
        this.$container.off(this.namespace);

        if (theme.parallaxSections[this.namespace]) {
          theme.parallaxSections[this.namespace].destroy();
          delete theme.parallaxSections[this.namespace];
        }
      }

    });

    return Collection;
  })();

  theme.CollectionSwitcher = (function() {
    var selectors = {
      trigger: '.collection-switcher__trigger',
      collection: '.collection-switcher__collection',
      slider: '.collection-switcher__collection-grid'
    };

    function CollectionSwitcher(container) {
      this.$container = $(container);
      this.sectionId = this.$container.attr('data-section-id');

      this.config = {
        perRow: this.$container.attr('data-per-row'),
        perRowMobile: 2 // fixed always
      };

      this.sliderArgs = {
        arrows: true,
        speed: 700,
        infinite: false,
        slidesToShow: this.config.perRow,
        slidesToScroll: this.config.perRow
      };

      this.$activeSlider = null;

      this.init();
    }

    CollectionSwitcher.prototype = $.extend({}, CollectionSwitcher.prototype, {
      init: function() {
        this.$triggers = this.$container.find(selectors.trigger);
        this.$collections = this.$container.find(selectors.collection);

        var $firstSlider = this.$container.find(selectors.slider).first();
        if ($firstSlider.length) {
          this.initSlider($firstSlider);

          $('body').on('matchSmall unmatchSmall', function() {
            this.initSlider();
          }.bind(this));
        }

        this.$triggers.on('click', this.switch.bind(this));
      },

      initSlider: function($slider) {
        if (this.$activeSlider) {
          this.$activeSlider
          .off('afterChange')
          .slick('unslick');
        }

        if (!$slider) {
          $slider = this.$activeSlider;
        }

        if (!$slider.length) {
          return;
        }

        // Mobile-specific per-row setting
        if (theme.config.bpSmall) {
          this.sliderArgs.slidesToShow = this.config.perRowMobile;
          this.sliderArgs.slidesToScroll = this.config.perRowMobile;
        } else {
          this.sliderArgs.slidesToShow = parseInt(this.config.perRow);
          this.sliderArgs.slidesToScroll = parseInt(this.config.perRow);
        }

        this.$activeSlider = $slider.slick(this.sliderArgs);

        if (AOS) {
          AOS.refresh();
        }
      },

      switch: function(evt) {
        evt.preventDefault();

        this.$triggers.removeClass('is-active');

        var containerId = $(evt.currentTarget).addClass('is-active').attr('aria-controls');
        var $container = $('#' + containerId);
        var $newSlider = $container.find(selectors.slider);

        // Hide collections, show new one
        this.$collections.addClass('hide');
        $container.removeClass('hide');

        this.initSlider($newSlider);
      },

      onUnload: function() {

      }

    });

    return CollectionSwitcher;
  })();

  theme.HeaderSection = (function() {

    var selectors = {
      drawer: '#NavDrawer',
      mobileSubNavToggle: '.mobile-nav__toggle-btn',
      hasSublist: '.mobile-nav__has-sublist'
    };

    var classes = {
      navExpanded: 'mobile-nav--expanded'
    };

    function Header(container) {
      var $container = this.$container = $(container);
      var sectionId = this.sectionId = $container.attr('data-section-id');

      // Reload any slideshow if when the header is reloaded to make sure the
      // sticky header works as expected (it can be anywhere in the sections.instance array)
      for (var i = 0; i < sections.instances.length; i++) {
        var instance = sections.instances[i];
        if (instance['type'] === 'slideshow-section') {
          instance.forceReload();
        }
      }

      this.initDrawers();
      theme.headerNav.init();
      theme.announcementBar.init();
    }

    Header.prototype = $.extend({}, Header.prototype, {
      initDrawers: function() {
        theme.NavDrawer = new theme.Drawers('NavDrawer', 'nav');
        if (theme.settings.cartType === 'drawer') {
          new theme.CartDrawer();
        }

        this.drawerMenuButtons();
      },

      drawerMenuButtons: function() {
        $(selectors.drawer).find('.js-drawer-close').on('click', function(evt){
          evt.preventDefault();
          theme.NavDrawer.close();
        });

        var $mobileSubNavToggle = $(selectors.mobileSubNavToggle);

        $mobileSubNavToggle.attr('aria-expanded', 'false');
        $mobileSubNavToggle.each(function (i, el) {
          var $el = $(el);
          $el.attr('aria-controls', $el.attr('data-aria-controls'));
        });

        $mobileSubNavToggle.on('click', function() {
          var $el = $(this);
          var currentlyExpanded = $el.attr('aria-expanded');
          var toggleState = false;

          // Updated aria-expanded value based on state pre-click
          if (currentlyExpanded === 'true') {
            $el.attr('aria-expanded', 'false');
          } else {
            $el.attr('aria-expanded', 'true');
            toggleState = true;
          }

          // Toggle class that expands/collapses sublist
          $el.closest(selectors.hasSublist).toggleClass(classes.navExpanded, toggleState);
        });
      },

      onUnload: function() {
        theme.NavDrawer.close();
        theme.headerNav.unload();
        theme.announcementBar.unload();
      }
    });

    return Header;

  })();

  theme.FooterSection = (function() {

    var selectors = {
      disclosureLocale: '[data-disclosure-locale]',
      disclosureCurrency: '[data-disclosure-currency]'
    };

    function Footer(container) {
      var $container = this.$container = $(container);

      this.cache = {};
      this.cacheSelectors();

      if (this.cache.$localeDisclosure.length) {
        this.localeDisclosure = new theme.Disclosure(
          this.cache.$localeDisclosure
        );
      }

      if (this.cache.$currencyDisclosure.length) {
        this.currencyDisclosure = new theme.Disclosure(
          this.cache.$currencyDisclosure
        );
      }
    }

    Footer.prototype = $.extend({}, Footer.prototype, {
      cacheSelectors: function() {
        this.cache = {
          $localeDisclosure: this.$container.find(selectors.disclosureLocale),
          $currencyDisclosure: this.$container.find(selectors.disclosureCurrency)
        };
      },

      onUnload: function() {
        if (this.cache.$localeDisclosure.length) {
          this.localeDisclosure.unload();
        }

        if (this.cache.$currencyDisclosure.length) {
          this.currencyDisclosure.unload();
        }
      }
    });

    return Footer;
  })();

  theme.FeaturedContentSection = (function() {

    function FeaturedContent() {
      $('.rte').find('a:not(:has(img))').addClass('text-link');
    }

    return FeaturedContent;
  })();

  theme.slideshows = {};

  theme.SlideshowSection = (function() {

    var selectors = {
      parallaxContainer: '.parallax-container'
    };

    function SlideshowSection(container) {
      var $container = this.$container = $(container);
      var $section = $container.parent();
      var sectionId = $container.attr('data-section-id');
      var slideshow = this.slideshow = '#Slideshow-' + sectionId;
      this.namespace = '.' + sectionId;

      var $imageContainer = $(container).find('.hero');
      if ($imageContainer.length) {
        theme.loadImageSection($imageContainer);
      }

      this.init();

      if ($container.data('parallax')) {
        var args = {
          namespace: this.namespace
        };

        theme.parallaxSections[this.namespace] = new theme.Parallax($container.find(selectors.parallaxContainer), args);
      }
    }

    SlideshowSection.prototype = $.extend({}, SlideshowSection.prototype, {
      init: function() {
        var args = {
          arrows: $(this.slideshow).data('arrows'),
          dots: $(this.slideshow).data('dots'),
          fade: true,
          speed: 500 // same as $slideshowImageAnimationSpeed in CSS
        };

        theme.slideshows[this.slideshow] = new theme.Slideshow(this.slideshow, args);
      },

      forceReload: function() {
        this.onUnload();
        this.init();
      },

      onUnload: function() {
        if (theme.parallaxSections[this.namespace]) {
          theme.parallaxSections[this.namespace].destroy();
          delete theme.parallaxSections[this.namespace];
        }

        if (theme.slideshows[this.slideshow]) {
          theme.slideshows[this.slideshow].destroy();
          delete theme.slideshows[this.slideshow];
        }
      },

      onSelect: function() {
        $(this.slideshow).slick('slickPause');
      },

      onDeselect: function() {
        $(this.slideshow).slick('slickPlay');
      },

      onBlockSelect: function(evt) {
        var $slideshow = $(this.slideshow);

        // Ignore the cloned version
        var $slide = $('.slideshow__slide--' + evt.detail.blockId + ':not(.slick-cloned)');
        var slideIndex = $slide.data('slick-index');

        // Go to selected slide, pause autoplay
        $slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
      },

      onBlockDeselect: function() {
        $(this.slideshow).slick('slickPlay');
      }
    });

    return SlideshowSection;
  })();

  theme.VideoSection = (function() {
    var youtubeReady;
    var videos = [];
    var youtubePlayers = [];
    var youtubeVideoOptions = {
      width: 1280,
      height: 720,
      playerVars: {
        autohide: 0,
        branding: 0,
        cc_load_policy: 0,
        controls: 0,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        quality: 'hd720',
        rel: 0,
        showinfo: 0,
        wmode: 'opaque'
      }
    };

    var vimeoReady = false;
    var vimeoVideoOptions = {
      byline: false,
      title: false,
      portrait: false,
      loop: true
    };

    var selectors = {
      videoParent: '.video-parent-section'
    };

    var classes = {
      loading: 'loading',
      loaded: 'loaded',
      interactable: 'video-interactable'
    };

    function videoSection(container) {
      var $container = this.$container = $(container);
      var sectionId = this.sectionId = $container.attr('data-section-id');
      var youtubePlayerId = this.youtubePlayerId = 'YouTubeVideo-' + this.sectionId;
      this.namespace = '.' + youtubePlayerId;
      var vimeoPlayerId = this.vimeoPlayerId = 'Vimeo-' + this.sectionId;
      var $vimeoTrigger = this.$vimeoTrigger = $('#VimeoTrigger-' + this.sectionId);
      var mp4Video = 'Mp4Video-' + this.sectionId;

      var $youtubeDiv = $('#' + youtubePlayerId);
      var $vimeoDiv = $('#' + vimeoPlayerId);
      var $mp4Div = $('#' + mp4Video);

      this.vimeoPlayer = [];

      if ($youtubeDiv.length) {
        this.youtubeVideoId = $youtubeDiv.data('video-id');
        this.initYoutubeVideo();
      }

      if ($vimeoDiv.length) {
        this.vimeoVideoId = $vimeoDiv.data('video-id');
        this.initVimeoVideo();
      }

      if ($mp4Div.length) {
        setParentAsLoaded($mp4Div);

        startMp4Playback(mp4Video).then(function() {
          // Video played as expected, don't do anything
        }).catch(function(error) {
          // Video cannot be played with autoplay, so let
          // user interact with video element itself
          $mp4Div.attr('controls', '');
          setVideoToBeInteractedWith($mp4Div);
        })
      }
    }

    function startMp4Playback(mp4Video) {
      return document.querySelector('#' + mp4Video).play();
    }

    function onVideoPlayerReady(evt, id) {
      var $player = $('#' + id);
      var playerId = $player.attr('id');
      youtubePlayers[playerId] = evt.target; // update stored player
      var player = youtubePlayers[playerId];

      setParentAsLoading($player);

      youtubePlayers[playerId].mute();

      // Remove from tabindex because YouTube iframes are annoying and you can focus
      // on the YouTube logo and it breaks
      $player.attr('tabindex', '-1');

      // Add out of view pausing
      videoVisibilityCheck(playerId);
      $(window).on('scroll.' + playerId, {id: playerId}, $.throttle(150, videoVisibilityCheck));
    }

    function videoVisibilityCheck(id) {
      var playerId;

      if (typeof id === 'string') {
        playerId = id;
      } else {
        // Data comes in as part of the scroll event
        if (!id.data) {return}
        playerId = id.data.id;
      }

      if (theme.isElementVisible($('#' + playerId))) {
        playVisibleVideo(playerId);
      } else {
        pauseHiddenVideo(playerId);
      }
    }

    function playVisibleVideo(id) {
      if (youtubePlayers[id] && typeof youtubePlayers[id].playVideo === 'function') {
        youtubePlayers[id].playVideo();
      }
    }

    function pauseHiddenVideo(id) {
      if (youtubePlayers[id] && typeof youtubePlayers[id].pauseVideo === 'function') {
        youtubePlayers[id].pauseVideo();
      }
    }

    function onVideoStateChange(evt, id) {
      var $player = $('#' + id);
      var playerId = $player.attr('id');
      var player = youtubePlayers[playerId];

      switch (evt.data) {
        case -1: // unstarted
          // Handle low power state on iOS by checking if
          // video is reset to unplayed after attempting to buffer
          if (videos[playerId].attemptedToPlay) {
            setParentAsLoaded($player);
            setVideoToBeInteractedWith($player);
          }
          break;
        case 0: // ended
          player.playVideo();
          break;
        case 1: // playing
          setParentAsLoaded($player);
          break;
        case 3: // buffering
          videos[playerId].attemptedToPlay = true;
          break;
      }
    }

    function setParentAsLoading($el) {
      $el
      .closest(selectors.videoParent)
      .addClass(classes.loading);
    }

    function setParentAsLoaded($el) {
      $el
      .closest(selectors.videoParent)
      .removeClass(classes.loading)
      .addClass(classes.loaded);
    }

    function setVideoToBeInteractedWith($el) {
      $el
      .closest(selectors.videoParent)
      .addClass(classes.interactable);
    }

    videoSection.prototype = $.extend({}, videoSection.prototype, {
      initYoutubeVideo: function() {
        videos[this.youtubePlayerId] = {
          id: this.youtubePlayerId,
          videoId: this.youtubeVideoId,
          type: 'youtube',
          attemptedToPlay: false,
          events: {
            onReady: function(evt) {
              onVideoPlayerReady(evt, this.youtubePlayerId);
            }.bind(this),
            onStateChange: function(evt) {
              onVideoStateChange(evt, this.youtubePlayerId);
            }.bind(this)
          }
        };

        if (!youtubeReady) {
          theme.LibraryLoader.load('youtubeSdk');
          $('body').on('youTubeReady' + this.namespace, this.loadYoutubeVideo.bind(this));
        } else {
          this.loadYoutubeVideo();
        }
      },

      loadYoutubeVideo: function() {
        var args = $.extend({}, youtubeVideoOptions, videos[this.youtubePlayerId]);
        args.playerVars.controls = 0;
        youtubePlayers[this.youtubePlayerId] = new YT.Player(this.youtubePlayerId, args);

        youtubeReady = true;
      },

      initVimeoVideo: function() {
        videos[this.vimeoPlayerId] = {
          divId: this.vimeoPlayerId,
          id: this.vimeoVideoId,
          type: 'vimeo'
        };

        var $player = $('#' + this.vimeoPlayerId);
        setParentAsLoading($player);

        // Button to play video on mobile
        this.$vimeoTrigger.on('click', + this.namespace, function(evt) {
          // $(evt.currentTarget).addClass('hide');
          this.requestToPlayVimeoVideo(this.vimeoPlayerId);
        }.bind(this));

        if (!vimeoReady) {
          window.loadVimeo();
          $('body').on('vimeoReady' + this.namespace, this.loadVimeoVideo.bind(this));
        } else {
          this.loadVimeoVideo();
        }
      },

      loadVimeoVideo: function() {
        var args = $.extend({}, vimeoVideoOptions, videos[this.vimeoPlayerId]);
        this.vimeoPlayer[this.vimeoPlayerId] = new Vimeo.Player(videos[this.vimeoPlayerId].divId, args);

        vimeoReady = true;

        // Only autoplay on larger screens
        if (!theme.config.bpSmall) {
          this.requestToPlayVimeoVideo(this.vimeoPlayerId);
        } else {
          var $player = $('#' + this.vimeoPlayerId);
          setParentAsLoaded($player);
        }
      },

      requestToPlayVimeoVideo: function(id) {
        // The slider may initialize and attempt to play the video before
        // the API is even ready, because it sucks.

        if (!vimeoReady) {
          // Wait for the trigger, then play it
          $('body').on('vimeoReady' + this.namespace, function() {
            this.playVimeoVideo(id);
          }.bind(this))
          return;
        }

        this.playVimeoVideo(id);
      },

      playVimeoVideo: function(id) {
        this.vimeoPlayer[id].play();
        this.vimeoPlayer[id].setVolume(0);

        var $player = $('#' + id);
        setParentAsLoaded($player);
      },

      onUnload: function(evt) {
        var sectionId = evt.target.id.replace('shopify-section-', '');
        var playerId = 'YouTubeVideo-' + sectionId;
        youtubePlayers[playerId].destroy();
        $(window).off('scroll' + this.namespace);
        $('body').off('vimeoReady' + this.namespace);
      }
    });

    return videoSection;
  })();

  theme.BackgroundImage = (function() {

    var selectors = {
      parallaxContainer: '.parallax-container'
    };

    function backgroundImage(container) {
      var $container = $(container);
      var sectionId = $container.attr('data-section-id');
      this.namespace = '.' + sectionId;

      if (!$container.length) {
        return;
      }

      if ($container.data('parallax')) {
        var $parallaxContainer = $container.find(selectors.parallaxContainer);
        var args = {
          namespace: this.namespace,
          desktopOnly: true
        };

        theme.parallaxSections[this.namespace] = new theme.Parallax($parallaxContainer, args);
      }
    }

    backgroundImage.prototype = $.extend({}, backgroundImage.prototype, {
      onUnload: function(evt) {
        theme.parallaxSections[this.namespace].destroy();
        delete theme.parallaxSections[this.namespace];
      }
    });

    return backgroundImage;
  })();

  theme.Testimonials = (function() {
    var slideCount = 0;
    var defaults = {
      accessibility: true,
      arrows: false,
      dots: true,
      infinite: true,
      centerMode: true,
      centerPadding: '60px',
      touchThreshold: 20,
      rtl: theme.config.rtl,
      slidesToShow: 3,
      slidesToScroll: 3,
      pauseOnHover: false,
      pauseonFocus: true
    };

    function Testimonials(container) {
      var $container = this.$container = $(container);
      var sectionId = $container.attr('data-section-id');
      var wrapper = this.wrapper = '.testimonials-wrapper';
      var slider = this.slider = '#Testimonials-' + sectionId;
      var $slider = $(slider);

      this.namespace = '.testimonial-' + sectionId;
      this.sliderActive = false;
      var mobileOptions = $.extend({}, defaults, {
        slidesToShow: 1,
        slidesToScroll: 1,
        centerPadding: '30px',
        adaptiveHeight: true
      });

      slideCount = $slider.data('count');

      // Override slidesToShow/Scroll if there are not enough blocks
      if (slideCount < defaults.slidesToShow) {
        defaults.slidesToShow = slideCount;
        defaults.slidesToScroll = slideCount;
      }

      $slider.on('init', this.a11y.bind(this));

      if (theme.config.bpSmall) {
        this.init($slider, mobileOptions);
      } else {
        this.init($slider, defaults);
      }

      $('body').on('matchSmall', function() {
        this.init($slider, mobileOptions);
      }.bind(this));

      $('body').on('unmatchSmall', function() {
        this.init($slider, defaults);
      }.bind(this));

      this.checkVisibility();
      $(window).on('scroll' + this.namespace, $.throttle(50, this.checkVisibility.bind(this)));
    }

    Testimonials.prototype = $.extend({}, Testimonials.prototype, {
      onUnload: function() {
        $(this.slider, this.wrapper).slick('unslick');
      },

      onBlockSelect: function(evt) {
        // Ignore the cloned version
        var $slide = $('.testimonials-slide--' + evt.detail.blockId + ':not(.slick-cloned)');
        var slideIndex = $slide.data('slick-index');

        // Go to selected slide
        $(this.slider, this.wrapper).slick('slickGoTo', slideIndex);
      },

      checkVisibility: function() {
        if (theme.isElementVisible(this.$container)) {
          var curIndex = $(this.slider, this.wrapper).slick('slickCurrentSlide');
          var nextIndex = curIndex + 1;
          setTimeout(function() {
            $(this.slider, this.wrapper).slick('slickGoTo', nextIndex);
          }.bind(this), 500);
          $(window).off(this.namespace);
        }
      },

      init: function(obj, args) {
        if (this.sliderActive) {
          obj.slick('unslick');
          this.sliderActive = false;
        }

        obj.slick(args);
        this.sliderActive = true;

        if (AOS) {
          AOS.refresh();
        }
      },

      a11y: function(event, obj) {
        var $list = obj.$list;
        var $wrapper = $(this.wrapper, this.$container);

        // Remove default Slick aria-live attr until slider is focused
        $list.removeAttr('aria-live');

        // When an element in the slider is focused set aria-live
        $wrapper.on('focusin', function(evt) {
          if ($wrapper.has(evt.target).length) {
            $list.attr('aria-live', 'polite');
          }
        });

        // Remove aria-live
        $wrapper.on('focusout', function(evt) {
          if ($wrapper.has(evt.target).length) {
            $list.removeAttr('aria-live');
          }
        });
      }
    });

    return Testimonials;
  })();

  theme.NewsletterPopup = (function() {
    function NewsletterPopup(container) {
      var $container = this.$container = $(container);
      var sectionId = $container.attr('data-section-id');
      this.cookieName = 'newsletter-' + sectionId;

      if (!$container.length) {
        return;
      }

      // Prevent popup on Shopify robot challenge page
      if (window.location.pathname === '/challenge') {
        return;
      }

      this.data = {
        secondsBeforeShow: $container.data('delay-seconds'),
        daysBeforeReappear: $container.data('delay-days'),
        cookie: Cookies.get(this.cookieName),
        testMode: $container.data('test-mode')
      };

      this.modal = new theme.Modals('NewsletterPopup-' + sectionId, 'newsletter-popup-modal');

      // Open modal if errors or success message exist
      if ($container.find('.errors').length || $container.find('.note--success').length) {
        this.modal.open();
      }

      // Set cookie as opened if success message
      if ($container.find('.note--success').length) {
        this.closePopup(true);
        return;
      }

      $('body').on('modalClose.' + $container.attr('id'), this.closePopup.bind(this));

      if (!this.data.cookie || this.data.testMode) {
        this.initPopupDelay();
      }
    }

    NewsletterPopup.prototype = $.extend({}, NewsletterPopup.prototype, {
      initPopupDelay: function() {
        setTimeout(function() {
          this.modal.open();
        }.bind(this), this.data.secondsBeforeShow * 1000);
      },

      closePopup: function(success) {
        // Remove a cookie in case it was set in test mode
        if (this.data.testMode) {
          Cookies.remove(this.cookieName, { path: '/' });
          return;
        }

        var expiry = success ? 200 : this.data.daysBeforeReappear;

        Cookies.set(this.cookieName, 'opened', { path: '/', expires: expiry });
      },

      onLoad: function() {
        this.modal.open();
      },

      onSelect: function() {
        this.modal.open();
      },

      onDeselect: function() {
        this.modal.close();
      },

      onUnload: function() {}
    });

    return NewsletterPopup;
  })();

  theme.FadingImages = (function() {

    var classes = {
      activeImage: 'active-image',
      finishedImage: 'finished-image',
      activeTitles: 'active-titles',
      finishedTitles: 'finished-titles',
      compensation: 'compensation'
    };

    function FadingImages(container) {
      var $container = this.$container = $(container);
      var sectionId = $container.attr('data-section-id');
      var namespace = this.namespace = '.fading-images-' + sectionId;

      if (!$container.length) {
        return;
      }

      var $imageContainer = $container.find('.fading-images');
      theme.loadImageSection($imageContainer);

      this.data = {
        isInit: false,
        interval: $container.data('interval'),
        block_count: $container.data('count'),
        finish_interval: 1000,
        timer_offset: 400,
        active_image: 1,
        active_title: 1,
        removed_compensation: false
      };

      this.selectors = {
        $allTitles: $container.find('.fading-images-overlay__titles')
      };

      this.checkVisibility();
      $(window).on('scroll' + this.namespace, $.throttle(100, this.checkVisibility.bind(this)));
    }

    FadingImages.prototype = $.extend({}, FadingImages.prototype, {
      checkVisibility: function() {
        if (this.data.isInit) {
          $(window).off('scroll' + this.namespace);
          return;
        }

        if (theme.isElementVisible(this.$container)) {
          this.startImages();
          this.startTitles();
          this.data.isInit = true;
        }
      },

      nextImage: function() {
        var $container = this.$container;

        if (!this.data.removed_compensation) {
          $container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').removeClass(classes.compensation);
          this.data.removed_compensation = true;
        }

        $container
        .find('.fading-images__item[data-slide-index=' + this.data.active_image + ']')
        .removeClass(classes.activeImage)
        .addClass(classes.finishedImage);

        var target_image = this.data.active_image;
        window.setTimeout(function() {
          $container.find('.fading-images__item[data-slide-index=' + target_image + ']').removeClass(classes.finishedImage);
        }, this.data.finish_interval);

        this.data.active_image++;
        if (this.data.active_image > this.data.block_count) {
          this.data.active_image = 1;
        }

        $container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').addClass(classes.activeImage);
      },

      nextTitle: function() {
        var $container = this.$container;
        var $allTitles = this.selectors.$allTitles;

        this.selectors.$allTitles.removeClass(classes.activeTitles).addClass(classes.finishedTitles);

        this.data.active_title++;
        if (this.data.active_title > this.data.block_count) {
          this.data.active_title = 1;
        }

        var target_title = this.data.active_title;
        window.setTimeout(function() {
          var newText1 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title1');
          var newText2 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title2');
          $container.find('.fading-images-overlay__title--1').text(newText1);
          $container.find('.fading-images-overlay__title--2').text(newText2);
          $allTitles.removeClass(classes.finishedTitles).addClass(classes.activeTitles);
        }, this.data.finish_interval - 200);
      },

      startImages: function() {
        // Prep and show first image
        this.$container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').addClass(classes.activeImage).addClass(classes.compensation);

        // Begin timer
        window.setTimeout(function() {
          var fading_images_timer = window.setInterval(this.nextImage.bind(this), this.data.interval);
        }.bind(this), this.data.timer_offset);
      },

      startTitles: function() {
        var $container = this.$container;
        var $allTitles = this.selectors.$allTitles;
        // Prep and show first titles
        var target_title = this.data.active_title;
        window.setTimeout(function() {
          var newText1 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title1');
          var newText2 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title2');
          $container.find('.fading-images-overlay__title--1').text(newText1);
          $container.find('.fading-images-overlay__title--2').text(newText2);
          $allTitles.addClass(classes.activeTitles);
        }, 750);

        // Begin timer
        var fading_titles_timer = window.setInterval(this.nextTitle.bind(this), this.data.interval);
      },

      onLoad: function() {
      },

      onSelect: function() {
      },

      onDeselect: function() {
      },

      onUnload: function() {
      }
    });

    return FadingImages;
  })();

  theme.Maps = (function() {
    var config = {
      zoom: 14
    };
    var apiStatus = null;
    var mapsToLoad = [];

    var errors = {
      addressNoResults: theme.strings.addressNoResults,
      addressQueryLimit: theme.strings.addressQueryLimit,
      addressError: theme.strings.addressError,
      authError: theme.strings.authError
    };

    var selectors = {
      section: '[data-section-type="map"]',
      map: '[data-map]',
      mapOverlay: '[data-map-overlay]'
    };

    var classes = {
      mapError: 'map-section--load-error',
      errorMsg: 'map-section__error errors text-center'
    };

    // Global function called by Google on auth errors.
    // Show an auto error message on all map instances.
    window.gm_authFailure = function() {
      if (!Shopify.designMode) {
        return;
      }

      $(selectors.section).addClass(classes.mapError);
      $(selectors.map).remove();
      $(selectors.mapOverlay).after(
        '<div class="' +
        classes.errorMsg +
        '">' +
        theme.strings.authError +
        '</div>'
      );
    };

    function Map(container) {
      this.$container = $(container);
      this.sectionId = this.$container.attr('data-section-id');
      this.namespace = '.map-' + this.sectionId;
      this.$map = this.$container.find(selectors.map);
      this.key = this.$map.data('api-key');

      if (!this.key) {
        return;
      }

      // Lazyload API
      this.checkVisibility();
      $(window).on('scroll' + this.namespace, $.throttle(50, this.checkVisibility.bind(this)));
    }

    function initAllMaps() {
      // API has loaded, load all Map instances in queue
      $.each(mapsToLoad, function(index, instance) {
        instance.createMap();
      });
    }

    function geolocate($map) {
      var deferred = $.Deferred();
      var geocoder = new google.maps.Geocoder();
      var address = $map.data('address-setting');

      geocoder.geocode({ address: address }, function(results, status) {
        if (status !== google.maps.GeocoderStatus.OK) {
          deferred.reject(status);
        }

        deferred.resolve(results);
      });

      return deferred;
    }

    Map.prototype = $.extend({}, Map.prototype, {
      prepMapApi: function() {
        if (apiStatus === 'loaded') {
          this.createMap();
        } else {
          mapsToLoad.push(this);

          if (apiStatus !== 'loading') {
            apiStatus = 'loading';
            if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined' ) {
              $.getScript(
                'https://maps.googleapis.com/maps/api/js?key=' + this.key
              ).then(function() {
                apiStatus = 'loaded';
                initAllMaps();
              });
            }
          }
        }
      },

      createMap: function() {
        var $map = this.$map;

        return geolocate($map)
        .then(
          function(results) {
            var mapOptions = {
              zoom: config.zoom,
              backgroundColor: 'none',
              center: results[0].geometry.location,
              draggable: false,
              clickableIcons: false,
              scrollwheel: false,
              disableDoubleClickZoom: true,
              disableDefaultUI: true
            };

            var map = (this.map = new google.maps.Map($map[0], mapOptions));
            var center = (this.center = map.getCenter());

            var marker = new google.maps.Marker({
              map: map,
              position: map.getCenter()
            });

            google.maps.event.addDomListener(
              window,
              'resize',
              $.debounce(250, function() {
                google.maps.event.trigger(map, 'resize');
                map.setCenter(center);
                $map.removeAttr('style');
              })
            );
          }.bind(this)
        )
        .fail(function() {
          var errorMessage;

          switch (status) {
            case 'ZERO_RESULTS':
              errorMessage = errors.addressNoResults;
              break;
            case 'OVER_QUERY_LIMIT':
              errorMessage = errors.addressQueryLimit;
              break;
            case 'REQUEST_DENIED':
              errorMessage = errors.authError;
              break;
            default:
              errorMessage = errors.addressError;
              break;
          }

          // Show errors only to merchant in the editor.
          if (Shopify.designMode) {
            $map
            .parent()
            .addClass(classes.mapError)
            .html(
              '<div class="' +
              classes.errorMsg +
              '">' +
              errorMessage +
              '</div>'
            );
          }
        });
      },

      checkVisibility: function() {
        if (theme.isElementVisible(this.$container, 600)) {
          this.prepMapApi();
          $(window).off(this.namespace);
        }
      },

      onUnload: function() {
        if (this.$map.length === 0) {
          return;
        }
        // Causes a harmless JS error when a section without an active map is reloaded
        google.maps.event.clearListeners(this.map, 'resize');
      }
    });

    return Map;
  })();

  theme.Blog = (function() {

    function Blog(container) {
      this.tagFilters();
    }

    Blog.prototype = $.extend({}, Blog.prototype, {
      tagFilters: function() {
        var $filterBy = $('#BlogTagFilter');

        if (!$filterBy.length) {
          return;
        }

        $filterBy.on('change', function() {
          location.href = $(this).val();
        });
      },

      onUnload: function() {

      }
    });

    return Blog;
  })();

  theme.Photoswipe = (function() {
    var selectors = {
      trigger: '.js-photoswipe__zoom',
      images: '.photoswipe__image',
      activeImage: '.slick-active .photoswipe__image'
    };

    function Photoswipe(container, sectionId) {
      this.$container = $(container);
      this.sectionId = sectionId;
      this.namespace = '.photoswipe-' + this.sectionId;
      this.gallery;
      this.$images;
      this.inSlideshow = false;

      if (this.$container.attr('data-zoom') === 'false') {
        return;
      }

      if (this.$container.attr('data-has-slideshow') === 'true') {
        this.inSlideshow = true;
      }

      this.init();
    }

    Photoswipe.prototype = $.extend({}, Photoswipe.prototype, {
      init: function() {
        var $trigger = this.$container.find(selectors.trigger);
        this.$images = this.$container.find(selectors.images);
        var items = [];

        // Init gallery on active image
        $trigger.on('click' + this.namespace, function(evt) {
          items = this.getImageData();
          if (this.inSlideshow) {
            var index = this.$container.find(selectors.activeImage).data('index');
          } else {
            var index = $(evt.currentTarget).data('index');
          }
          this.initGallery(items, index);
        }.bind(this));
      },

      getImageData: function() {
        var haveImages = false;
        var items = [];
        var options = {};

        this.$images.each(function() {
          var haveImages = true;
          var smallSrc = $(this).prop('currentSrc') || $(this).prop('src');
          var item = {
            msrc: smallSrc,
            src: $(this).data('photoswipe-src'),
            w: $(this).data('photoswipe-width'),
            h: $(this).data('photoswipe-height'),
            el: $(this)[0],
            initialZoomLevel: 0.5
          };

          items.push(item);
        });

        return items;
      },

      initGallery: function(items, index) {
        var pswpElement = document.querySelectorAll('.pswp')[0];

        var options = {
          allowPanToNext: false,
          captionEl: false,
          closeOnScroll: false,
          counterEl: false,
          history: false,
          index: index - 1,
          pinchToClose: false,
          preloaderEl: false,
          scaleMode: 'zoom',
          shareEl: false,
          tapToToggleControls: false,
          getThumbBoundsFn: function(index) {
            var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
            var thumbnail = items[index].el;
            var rect = thumbnail.getBoundingClientRect();
            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
          }
        }

        this.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);

        this.gallery.init();
        this.gallery.listen('afterChange', this.afterChange.bind(this));
      },

      afterChange: function() {
        if (this.inSlideshow) {
          var $slideshow = $('#ProductPhotos-' + this.sectionId);
          if ($slideshow.hasClass('slick-initialized')) {
            var newIndex = this.gallery.getCurrentIndex();
            $slideshow.slick('slickGoTo', newIndex);
          }
        }
      }
    });

    return Photoswipe;
  })();



  window.onYouTubeIframeAPIReady = function() {
    theme.config.youTubeReady = true;
    $('body').trigger('youTubeReady');
  }

  window.loadVimeo = function() {
    if (theme.config.vimeoLoading) {
      return;
    }

    if (!theme.config.vimeoReady) {
      theme.config.vimeoLoading = true;
      var tag = document.createElement('script');
      tag.src = "https://player.vimeo.com/api/player.js";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // Because there's no way to check for the Vimeo API being loaded
      // asynchronously, we use this terrible timeout to wait for it being ready
      checkIfVimeoIsReady()
      .then(function() {
        theme.config.vimeoReady = true;
        theme.config.vimeoLoading = false;
        $('body').trigger('vimeoReady');
      })
      .fail(function() {
        // No vimeo API to talk to
      });
    }
  }

  function checkIfVimeoIsReady() {
    var deferred = $.Deferred();
    var wait;
    var timeout;

    wait = setInterval(function() {
      if (!Vimeo) {
        return;
      }

      clearInterval(wait);
      clearTimeout(timeout);
      deferred.resolve();
    }, 500);

    timeout = setTimeout(function() {
      clearInterval(wait);
      deferred.reject();
    }, 4000); // subjective. test up to 8 times over 4 seconds

    return deferred;
  }

  theme.init = function() {
    theme.setGlobals();
    theme.pageTransitions();
    theme.initQuickShop();
    if (theme.settings.predictiveSearch) {
      theme.predictiveSearch.init();
    }
    theme.videoModal();
    theme.articleImages.init();
    theme.customerTemplates.init();
    theme.collapsibles.init();

    theme.rte.init();

    AOS.init({
      easing: 'ease-out-quad',
      once: true,
      offset: 60,
      disableMutationObserver: true
    });

    $(document.documentElement).on('keyup.tab', function(evt) {
      if (evt.keyCode === 9) {
        $(document.documentElement).addClass('tab-outline');
        $(document.documentElement).off('keyup.tab');
      }
    });
  };

  theme.setGlobals = function() {
    theme.config.hasSessionStorage = theme.isSessionStorageSupported();

    if (theme.config.isTouch) {
      $('body').addClass('supports-touch');
    }

    enquire.register(theme.config.mediaQuerySmall, {
      match: function() {
        theme.config.bpSmall = true;
        $('body').trigger('matchSmall');
      },
      unmatch: function() {
        theme.config.bpSmall = false;
        $('body').trigger('unmatchSmall');
      }
    });
  };

  theme.loadImageSection = function($container) {
    // Wait until images inside container have lazyloaded class
    function setAsLoaded() {
      $container.removeClass('loading loading--delayed').addClass('loaded');
    }

    function checkForLazyloadedImage() {
      return $container.find('.lazyloaded').length;
    }

    // If it has SVGs it's in the onboarding state so set as loaded
    if ($container.find('svg').length) {
      setAsLoaded();
      return;
    };

    if (checkForLazyloadedImage() > 0) {
      setAsLoaded();
      return;
    }

    var interval = setInterval(function() {
      if (checkForLazyloadedImage() > 0) {
        clearInterval(interval);
        setAsLoaded();
      }
    }, 80);
  }

  theme.isSessionStorageSupported = function() {
    // Return false if we are in an iframe without access to sessionStorage
    if (window.self !== window.top) {
      return false;
    }

    var testKey = 'test';
    var storage = window.sessionStorage;
    try {
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };

  theme.isElementVisible = function($el, threshold) {
    var rect = $el[0].getBoundingClientRect();
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    threshold = threshold ? threshold : 0;

    return (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <= (windowHeight + threshold) &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  theme.pageTransitions = function() {
    if ($('body').data('transitions') == true) {

      // Hack test to fix Safari page cache issue.
      // window.onpageshow doesn't always run when navigating
      // back to the page, so the unloading class remains, leaving
      // a white page. Setting a timeout to remove that class when leaving
      // the page actually finishes running when they come back.
      if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) {
        $('a').on('click', function() {
          window.setTimeout(function() {
            $('body').removeClass('unloading');
          }, 1200);
        });
      }

      // Add disable transition class to malito, anchor, and YouTube links
      $('a[href^="mailto:"], a[href^="#"], a[target="_blank"], a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[download]').each(function() {
        $(this).addClass('js-no-transition');
      });

      $('a:not(.js-no-transition)').bind('click', function(evt) {
        if (evt.metaKey) return true;
        evt.preventDefault();
        $('body').addClass('unloading');
        var src = $(this).attr('href');
        window.setTimeout(function() {
          location.href = src;
        }, 50);
      });

      $('a.mobile-nav__link').bind('click', function() {
        theme.NavDrawer.close();
      });
    }
  };

  theme.reinitProductGridItem = function($scope) {
    if (AOS) {
      AOS.refreshHard();
    }

    // Reload quick shop buttons
    theme.initQuickShop(true);

    // Refresh reviews app
    if (window.SPR) {
      SPR.initDomEls();SPR.loadBadges();
    }

    // Re-register product templates in quick view modals.
    // Will not double-register.
    sections.register('product-template', theme.Product, $scope);

    // Re-hook up collapsible box triggers
    theme.collapsibles.init();
  };

  window.onpageshow = function(evt) {
    // Removes unload class when returning to page via history
    if (evt.persisted) {
      $('body').removeClass('unloading');
    }
  };

  $(document).ready(function() {
    theme.init();

    window.sections = new theme.Sections();
    sections.register('header-section', theme.HeaderSection);
    sections.register('slideshow-section', theme.SlideshowSection);
    sections.register('video-section', theme.VideoSection);
    sections.register('product', theme.Product);
    sections.register('product-recommendations', theme.Recommendations);
    sections.register('store-availability', theme.StoreAvailability);
    sections.register('product-template', theme.Product);
    sections.register('collection-template', theme.Collection);
    sections.register('featured-content-section', theme.FeaturedContentSection);
    sections.register('collection-switcher', theme.CollectionSwitcher);
    sections.register('testimonials', theme.Testimonials);
    sections.register('newsletter-popup', theme.NewsletterPopup);
    sections.register('fading-images', theme.FadingImages);
    sections.register('background-image', theme.BackgroundImage);
    sections.register('map', theme.Maps);
    sections.register('blog', theme.Blog);
    sections.register('photoswipe', theme.Photoswipe);
    sections.register('footer-section', theme.FooterSection);

    document.dispatchEvent(new CustomEvent('page:loaded'));
  });
})(theme.jQuery);

//alert();

function update_cart(){
  $.ajax({
    url: "/cart.js",
    type: 'GET',
    dataType: 'json', // added data type
    success: function(res) {
      var item_count = res.item_count; var original_total_price = res.original_total_price; var discountDataTotal = 0;
      $('.site-nav__icons .site-nav__link .cart-link .cart-link__bubble').text(item_count);
      var original_total_price = theme.Currency.formatMoney(original_total_price, theme.settings.moneyFormat) ;
      $('.drawer__footer .grid--full .grid__item .ajaxcart__price').html(original_total_price);

      $('.drawer__scrollable .ajaxcart__product').each(function(){
        var discountData = parseFloat( $(this).find('.ajaxcart__price').find('.discount__total').attr('data-diff') );
        var totalQty = $(this).find('.rightinfoall').find('.js-qty__num').val();
        if(typeof discountData !== 'undefined'  &&  (!isNaN(discountData)) ){
          discountDataTotal += ( discountData * totalQty ) ;
        }

        if(discountDataTotal > 0){
          var discountDataTotalHtml = theme.Currency.formatMoney(discountDataTotal, theme.settings.moneyFormat);
          $('#CartContainer .drawer__footer .grid--full .savings__totals').remove();
          $('#CartContainer .drawer__footer .grid--full .savings__totals_outer').html('<div class="savings__totals">(You\'re saving '+discountDataTotalHtml+')</div>');
        }
        else
        {
          $('#CartContainer .drawer__footer .grid--full .savings__totals').remove();
        }
        // console.log('discountData :: '+discountData);
      })
      var totalAllDiscountPriceWithQty_temphtml = theme.Currency.formatMoney(window.totalDiscountPriceWithQty_temp, theme.settings.moneyFormat);

      if(item_count == 0 ){
        var textHtml = '<p class="appear-animation appear-delay-3 emptycart">Looks like your cart is empty...<a href="/">Continue shopping &gt; </a></p>';
        $('.cdk_cartCount').text('empty'); $('.drawer__footer .grid__item.one-full').html('');
        $('.drawer__footer .savings__totals').html('');
        $('#CartContainer .drawer__scrollable').addClass('emptycartwrap');
        $('#CartContainer .drawer__footer').remove();
        $('#CartContainer .drawer__scrollable').html(textHtml);
        $('.cart-link__bubble.cart-link__bubble--visible').removeClass('cart-link__bubble--visible');
      }
      else if(item_count == 1){
        $('.cdk_cartCount').text(item_count+ ' item');
      }
      else{
        $('.cdk_cartCount').text(item_count+ ' items');
      }

    }
  });
}
$(document).ready(function(){

  $(document).on('click', '.rightinfoall .remove__me_from_there', function(){
    var indexNum = $(this).parents('.ajaxcart__product').index(); 
    var currentThis = $(this);
    $.ajax({
      url: '/cart/change.js',
      type: 'GET',
      data: { 'line': indexNum, 'quantity': 0 }, 
      dataType: 'json', // added data type  
      success: function(res) {
        var totalAddedProduct = $('.drawer__scrollable .ajaxcart__product').length;
        if(totalAddedProduct > 1){
          currentThis.parents('.ajaxcart__product').remove(); 
        }
        var item_count = res.item_count; var original_total_price = res.original_total_price; var discountDataTotal = 0;
        $('.site-nav__icons .site-nav__link .cart-link .cart-link__bubble').text(item_count);
        var original_total_price = theme.Currency.formatMoney(original_total_price, theme.settings.moneyFormat) ;
        $('.drawer__footer .grid--full .grid__item .ajaxcart__price').html(original_total_price);
        $('.drawer__scrollable .ajaxcart__product').each(function(){
          var discountData = parseFloat( $(this).find('.ajaxcart__price').find('.discount__total').attr('data-diff') );
          var totalQty = $(this).find('.rightinfoall').find('.js-qty__num').val();
          if(typeof discountData !== 'undefined'  &&  (!isNaN(discountData)) ){
            discountDataTotal += ( discountData * totalQty ) ;
          } 
          if(discountDataTotal > 0){
            var discountDataTotalHtml = theme.Currency.formatMoney(discountDataTotal, theme.settings.moneyFormat);
            $('#CartContainer .drawer__footer .grid--full .savings__totals').remove();
            $('#CartContainer .drawer__footer .grid--full .savings__totals_outer').html('<div class="savings__totals">(You\'re saving '+discountDataTotalHtml+')</div>');
          }else{
            $('#CartContainer .drawer__footer .grid--full .savings__totals').remove();
          }
        })
        var totalAllDiscountPriceWithQty_temphtml = theme.Currency.formatMoney(window.totalDiscountPriceWithQty_temp, theme.settings.moneyFormat);
        if(item_count == 0 ){
          var textHtml = '<p class="appear-animation appear-delay-3 emptycart">Looks like your cart is empty...<a href="/">Continue shopping &gt; </a></p>';
          $('.cdk_cartCount').text('empty'); $('.drawer__footer .grid__item.one-full').html('');
          $('.drawer__footer .savings__totals').html('');
          $('#CartContainer .drawer__scrollable').addClass('emptycartwrap');
          $('#CartContainer .drawer__footer').remove();
          $('#CartContainer .drawer__scrollable').html(textHtml);
          $('.cart-link__bubble.cart-link__bubble--visible').removeClass('cart-link__bubble--visible');
        }else if(item_count == 1){
          $('.cdk_cartCount').text(item_count+ ' item');
        }else{
          $('.cdk_cartCount').text(item_count+ ' items');
        }
      }
    });
  })

  setTimeout(function(){
    var rateme = $('#shopify-ali-review .reviews .customer-alireview .customer-write-review .alireview-header-summary .alireview-summary .alireview-number-total-review span').html();
    //alert(rateme);
    $('.sticky_add_cart  .pricefull .cdk_rating_block .cdk_Rating_count').text(rateme);
  },2000);

});


/*************Product page faq****************/
function vallenato() {
  // Add "inactive" class to all headers.
  $('.vallenato-header').toggleClass('vallenato-inactive');

  // Add "closed" class to all content divs.
  $('.vallenato-content').toggleClass('vallenato-closed');

  // Open the first content section when the page loads.
  //$('.vallenato-header').first().toggleClass('vallenato-active vallenato-inactive');
  //$('.vallenato-content').first().toggleClass('vallenato-open vallenato-closed').slideDown();

  // The Accordion Effect
  $('.vallenato-header').click(function () {
    if($(this).is('.vallenato-inactive')) {
      $('.vallenato-active').toggleClass('vallenato-active vallenato-inactive').next().slideToggle().toggleClass('vallenato-open');
      $(this).toggleClass('vallenato-active vallenato-inactive');
      $(this).next().slideToggle().toggleClass('vallenato-open');
    }

    else {
      $(this).toggleClass('vallenato-active vallenato-inactive');
      $(this).next().slideToggle().toggleClass('vallenato-open');
    }
  });
};
$(document).ready(function() {
  vallenato();


  $('.toggle_content').click(function(e)
                             {
    e.preventDefault();
    $(this).children('.arrowup').toggle();
    $(this).children('.arrowdown').toggle();
    $(this).siblings('.collapse_info').slideToggle();
  });


  $('#block30cedd38-ac40-4e95-861f-d516cb3d5504 a').click(function(e){
    e.preventDefault();
    $('.add-to-cart').trigger('click');
  });

  $('.addtocartbtn').click(function(e){
    e.preventDefault();
    $('.add-to-cart').trigger('click');
  });
});

setInterval(function(){ 
  if( $('.cv_index_coll.slick-initialized.slick-slider').length > 0 ){
    var highest112 = 0; 
    $('.ox_cart_variants').css('height','auto');
    $('.cv_index_coll').children('.slick-list').children('.slick-track').children('.main-cll').children('.m_cll').children('.hover_cv_cll').children('.captureFormBuilt').children('.ox_cart_variants').each(function(){
      var ht2 = $(this).height();
      highest112 = Math.max(highest112, parseFloat(ht2));
    });
    $('.ox_cart_variants').css('height',highest112 +'px');
  }
},200);

setInterval(function(){ 
  if( $('.cv_index_coll.slick-initialized.slick-slider').length > 0 ){
    var highest112 = 0; 
    $('.cv_index_coll').children('.slick-list').children('.slick-track').children('.main-cll').children('.m_cll').children('.hover_cv_cll').children('.captureFormBuilt').children('.ox_cart_variants').each(function(){
      var ht2 = $(this).height();
      highest112 = Math.max(highest112, parseFloat(ht2));
    });
    //$('.ox_cart_variants').css('height',highest112 +'px');
  }
},300);

setInterval(function(){ 
  if( $('.cv_index_coll.slick-initialized.slick-slider').length > 0 ){
    var highest112 = 0; 
    $('.CartBuiltTitleRecomm').css('height','auto');
    $('.cv_index_coll').children('.slick-list').children('.slick-track').children('.main-cll').children('.m_cll').children('.hover_cv_cll').children('.CartBuiltTitleRecomm').each(function(){
      var ht2 = $(this).height();
      highest112 = Math.max(highest112, parseFloat(ht2));
    });
    $('.CartBuiltTitleRecomm').css('height',highest112 +'px');
  }
},200);

setInterval(function(){ 
  if( $('.cv_index_coll.slick-initialized.slick-slider').length > 0 ){
    var highest113 = 0; 
    $('.cart_recommendationPrice').css('height','auto');
    $('.cv_index_coll').children('.slick-list').children('.slick-track').children('.main-cll').children('.m_cll').children('.hover_cv_cll').children('.cart_recommendationPrice').each(function(){
      var ht13 = $(this).height();
      highest113 = Math.max(highest113, parseFloat(ht13));
    });
    $('.cart_recommendationPrice').css('height',highest113 +'px');
  }
},200);

setInterval(function(){ 
  if( $('.cv_index_coll.slick-initialized.slick-slider').length > 0 ){
    var highest1118 = 0; 
    var Widthcartrecomm
    $('.cv_index_coll').children('.slick-list').children('.slick-track').children('.main-cll').children('.m_cll').children('.cart_recomm_mg').children('img').each(function(){
      var ht1318 = $(this).height();
      var ht131cart = $(this).width();
      highest1118 = Math.max(highest1118, parseFloat(ht1318));
      Widthcartrecomm = Math.max(highest1118, parseFloat(ht131cart));
    });
    $('.cart_recomm_mg img').css('height',Widthcartrecomm +'px');
  }
},200);

setInterval(function(){
  if( $('.cartInjectCollection').length > 0 ){
    $.ajax({
      url: "/cart.js",
      type: "GET",
      dataType: "JSON",
      success: function (cart) {
        $.each(cart.items, function (index, item) {
          $('.cartInjectCollection').find('.main-cll').each(function(){
            var GetHandle = $(this).attr('data-product-handle');
            if( GetHandle == item.handle ){
              $(this).remove();
            }
          });
        });

      }
    });
  }
},100);


$(document).ready(function(){
  var RecommVariantOne,RecomVariantTwo,RecomVarinatThree,combineAll,matchCombileRecom,GetVariantID,GetVariantPrice,GetVariantComparePrice,GetVariantImage,GetVariantDiscount;

  $('.sliderWrapCustomproduct').slick({
    infinite: false,
    swipeToSlide: true,
    arrows: true, 
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          arrows: true, 
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 590,
        settings: {
          slidesToShow: 1,
          centerMode: true,
          centerPadding:'50px',
          arrows: true, 
          slidesToScroll: 1
        }
      }

    ]
  });

  $(document).on('change', '.ox_select_chng1', function(){
    RecommVariantOne = $(this).val();   
    if($(this).parents('.ox_variant_main').children('.myvariantclass3').length > 0){
      RecomVariantTwo = $(this).parents('.ox_variant_main').find('.ox_select_chng2').children('option:selected').val();
      RecomVarinatThree = $(this).parents('.ox_variant_main').find('.ox_select_chng3').children('option:selected').val();
      combineAll = RecommVariantOne+' / '+RecomVariantTwo+' / '+RecomVarinatThree;
    }
    else{
      if($(this).parents('.ox_variant_main').children('.myvariantclass2').length > 0){
        RecomVariantTwo = $(this).parents('.ox_variant_main').find('.ox_select_chng2').children('option:selected').val();
        combineAll = RecommVariantOne+' / '+RecomVariantTwo
      }
      else {
        combineAll = RecommVariantOne; 
      }
    }

    $(this).parents('.captureFormBuilt').find('.hiddenCustomSelector').children('option').each(function(){
      matchCombileRecom = $(this).html();
      if(matchCombileRecom == combineAll){
        if( $(this).prop('disabled') ){
          $(this).parents('.captureFormBuilt').find('[type="submit"]').children('span').html('Sold out');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').prop('disabled',true);
        }
        else{
          GetVariantID = $(this).attr('vid');
          GetVariantPrice = $(this).attr('data-price');
          GetVariantComparePrice = $(this).attr('data-compare'); 
          GetVariantDiscount = $(this).attr('disount-cal');
          GetVariantImage = $(this).attr('data-img');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').attr('data-variant',GetVariantID);
          $(this).parents('.captureFormBuilt').find('[type="submit"]').children('span').html('Add to cart');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').prop('disabled',false);

          $(this).parents('.main-cll').find('[data-recomm-price-update]').children('[actual-price]').html(GetVariantPrice);
          $(this).parents('.main-cll').find('[data-recomm-price-update]').children('[recomm-cmopare-price]').html(GetVariantComparePrice);
          $(this).parents('.main-cll').find('[cart-recomm-image-update]').attr("src",GetVariantImage);
        }
      }
    })
  });

  $(document).on('change', '.ox_select_chng2', function(){
    RecomVariantTwo = $(this).val();   
    if($(this).parents('.ox_variant_main').children('.myvariantclass3').length > 0){
      RecommVariantOne = $(this).parents('.ox_variant_main').find('.ox_select_chng1').children('option:selected').val();
      RecomVarinatThree = $(this).parents('.ox_variant_main').find('.ox_select_chng3').children('option:selected').val();
      combineAll = RecommVariantOne+' / '+RecomVariantTwo+' / '+RecomVarinatThree;
    }
    else{
      RecommVariantOne = $(this).parents('.ox_variant_main').find('.ox_select_chng1').children('option:selected').val();
      combineAll = RecommVariantOne+' / '+RecomVariantTwo;
    }

    $(this).parents('.captureFormBuilt').find('.hiddenCustomSelector').children('option').each(function(){
      matchCombileRecom = $(this).html();
      if(matchCombileRecom == combineAll){
        if( $(this).prop('disabled') ){
          $(this).parents('.captureFormBuilt').find('[type="submit"]').children('span').html('Sold out');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').prop('disabled',true);
        }
        else{
          GetVariantID = $(this).attr('vid');
          GetVariantPrice = $(this).attr('data-price');
          GetVariantComparePrice = $(this).attr('data-compare'); 
          GetVariantDiscount = $(this).attr('disount-cal');
          GetVariantImage = $(this).attr('data-img');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').attr('data-variant',GetVariantID);
          $(this).parents('.captureFormBuilt').find('[type="submit"]').children('span').html('Add to cart');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').prop('disabled',false);

          $(this).parents('.main-cll').find('[data-recomm-price-update]').children('[actual-price]').html(GetVariantPrice);
          $(this).parents('.main-cll').find('[data-recomm-price-update]').children('[recomm-cmopare-price]').html(GetVariantComparePrice);
          $(this).parents('.main-cll').find('[cart-recomm-image-update]').attr("src",GetVariantImage);
        }
      }
    })
  });

  $(document).on('change', '.ox_select_chng3', function(){
    RecomVarinatThree = $(this).val();   
    RecommVariantOne = $(this).parents('.ox_variant_main').find('.ox_select_chng1').children('option:selected').val();
    RecomVariantTwo = $(this).parents('.ox_variant_main').find('.ox_select_chng2').children('option:selected').val();

    combineAll = RecommVariantOne+' / '+RecomVariantTwo+' / '+RecomVarinatThree;

    $(this).parents('.captureFormBuilt').find('.hiddenCustomSelector').children('option').each(function(){
      matchCombileRecom = $(this).html();
      if(matchCombileRecom == combineAll){
        if( $(this).prop('disabled') ){
          $(this).parents('.captureFormBuilt').find('[type="submit"]').children('span').html('Sold out');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').prop('disabled',true);
        }
        else{
          GetVariantID = $(this).attr('vid');
          GetVariantPrice = $(this).attr('data-price');
          GetVariantComparePrice = $(this).attr('data-compare'); 
          GetVariantDiscount = $(this).attr('disount-cal');
          GetVariantImage = $(this).attr('data-img');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').attr('data-variant',GetVariantID);
          $(this).parents('.captureFormBuilt').find('[type="submit"]').children('span').html('Add to cart');
          $(this).parents('.captureFormBuilt').find('[type="submit"]').prop('disabled',false);

          $(this).parents('.main-cll').find('[data-recomm-price-update]').children('[actual-price]').html(GetVariantPrice);
          $(this).parents('.main-cll').find('[data-recomm-price-update]').children('[recomm-cmopare-price]').html(GetVariantComparePrice);
          $(this).parents('.main-cll').find('[cart-recomm-image-update]').attr("src",GetVariantImage);
        }
      }
    })
  });



  $(document).on('change', '.ProductShownSelect-1', function(){
    RecommVariantOne = $(this).val();   
    if($(this).parents('.ProductShownVariantCollection').children('.ProductShownSelect-3').length > 0){
      RecomVariantTwo = $(this).parents('.ProductShownVariantCollection').find('.ProductShownSelect-2').children('option:selected').val();
      RecomVarinatThree = $(this).parents('.ProductShownVariantCollection').find('.ProductShownSelect-3').children('option:selected').val();
      combineAll = RecommVariantOne+' / '+RecomVariantTwo+' / '+RecomVarinatThree;
    }
    else{
      if($(this).parents('.ProductShownVariantCollection').children('.ProductShownSelect-2').length > 0){
        RecomVariantTwo = $(this).parents('.ProductShownVariantCollection').find('.ProductShownSelect-2').children('option:selected').val();
        combineAll = RecommVariantOne+' / '+RecomVariantTwo
      }
      else {
        combineAll = RecommVariantOne; 
      }
    }

    $(this).parents('.productShownVariantMain').find('.productCaptionHiddenSt').children('option').each(function(){
      matchCombileRecom = $(this).html();
      if(matchCombileRecom == combineAll){
        if( $(this).prop('disabled') ){
          $(this).parents('.ProductShownForm').find('[type="submit"]').children('span').html('Sold out');
          $(this).parents('.ProductShownForm').find('[type="submit"]').prop('disabled',true);
        }
        else{
          GetVariantID = $(this).attr('vid');
          GetVariantPrice = $(this).attr('data-price');
          GetVariantComparePrice = $(this).attr('data-compare'); 
          GetVariantDiscount = $(this).attr('disount-cal');
          GetVariantImage = $(this).attr('data-img');
          $(this).parents('.ProductShownForm').find('[type="submit"]').attr('data-variant',GetVariantID);
          $(this).parents('.ProductShownForm').find('[type="submit"]').children('span').html('Add to cart');
          $(this).parents('.ProductShownForm').find('[type="submit"]').prop('disabled',false);

          $(this).parents('.productShownEachblock').find('[data-recomm-price-update]').children('.productShownPriceBox').children('[actual-price]').html(GetVariantPrice);
          $(this).parents('.productShownEachblock').find('[data-recomm-price-update]').children('.productShownPriceBox').children('[recomm-cmopare-price]').html(GetVariantComparePrice);
          $(this).parents('.productShownEachblock').children('.productShownImage').children('a').find('[cart-recomm-image-update]').attr("src",GetVariantImage);
        }
      }
    })
  });

  $(document).on('change', '.ProductShownSelect-2', function(){
    RecomVariantTwo = $(this).val();   
    if($(this).parents('.ProductShownVariantCollection').children('.ProductShownSelect-3').length > 0){
      RecommVariantOne = $(this).parents('.ProductShownVariantCollection').find('.ProductShownSelect-1').children('option:selected').val();
      RecomVarinatThree = $(this).parents('.ProductShownVariantCollection').find('.ProductShownSelect-3').children('option:selected').val();
      combineAll = RecommVariantOne+' / '+RecomVariantTwo+' / '+RecomVarinatThree;
    }
    else{
      RecommVariantOne = $(this).parents('.ProductShownVariantCollection').find('.ProductShownSelect-1').children('option:selected').val();
      combineAll = RecommVariantOne+' / '+RecomVariantTwo;
    }

    $(this).parents('.productShownVariantMain').find('.productCaptionHiddenSt').children('option').each(function(){
      matchCombileRecom = $(this).html();
      if(matchCombileRecom == combineAll){
        if( $(this).prop('disabled') ){
          $(this).parents('.ProductShownForm').find('[type="submit"]').children('span').html('Sold out');
          $(this).parents('.ProductShownForm').find('[type="submit"]').prop('disabled',true);
        }
        else{
          GetVariantID = $(this).attr('vid');
          GetVariantPrice = $(this).attr('data-price');
          GetVariantComparePrice = $(this).attr('data-compare'); 
          GetVariantDiscount = $(this).attr('disount-cal');
          GetVariantImage = $(this).attr('data-img');
          $(this).parents('.ProductShownForm').find('[type="submit"]').attr('data-variant',GetVariantID);
          $(this).parents('.ProductShownForm').find('[type="submit"]').children('span').html('Add to cart');
          $(this).parents('.ProductShownForm').find('[type="submit"]').prop('disabled',false);

          $(this).parents('.productShownEachblock').find('[data-recomm-price-update]').children('.productShownPriceBox').children('[actual-price]').html(GetVariantPrice);
          $(this).parents('.productShownEachblock').find('[data-recomm-price-update]').children('.productShownPriceBox').children('[recomm-cmopare-price]').html(GetVariantComparePrice);
          $(this).parents('.productShownEachblock').children('.productShownImage').children('a').find('[cart-recomm-image-update]').attr("src",GetVariantImage);
        }
      }
    })
  });


 
  // Ensure event listener is attached to the variant change (may vary based on your theme)
  document.addEventListener('change', function(event) {
    if (event.target.matches('.swatch_color')) { // Shopify default variant selector
      // setTimeout(function() {
      //   console.log('here ');
      //   alert('sdfdsfd')
      //   // Reinitialize carousel after variant change
      //   if ($('.product-recommendations .carousel').length) {
      //     $('.product-recommendations .carousel').slick('refresh');
      //   }
      // }, 500); // Delay to allow DOM updates

       setTimeout(function() {
        $('.product-recommendations .carousel').slick('refresh');
      }, 500);
    }
  });



  document.addEventListener('variant:changed', function() {
   
  });


  document.addEventListener('variant:changed', function() {
    if (typeof BCurrency !== 'undefined' && BCurrency.convertAll) {
      BCurrency.convertAll(window.shop_currency, BCurrency.currentCurrency);
    }
  });

  $(document).on('change', '.ProductShownSelect-3', function(){
    RecomVarinatThree = $(this).val();   
    RecommVariantOne = $(this).parents('.ProductShownVariantCollection').find('.ProductShownSelect-1').children('option:selected').val();
    RecomVariantTwo = $(this).parents('.ProductShownVariantCollection').find('.ProductShownSelect-2').children('option:selected').val();

    combineAll = RecommVariantOne+' / '+RecomVariantTwo+' / '+RecomVarinatThree;

    $(this).parents('.productShownVariantMain').find('.productCaptionHiddenSt').children('option').each(function(){
      matchCombileRecom = $(this).html();
      if(matchCombileRecom == combineAll){
        if( $(this).prop('disabled') ){
          $(this).parents('.ProductShownForm').find('[type="submit"]').children('span').html('Sold out');
          $(this).parents('.ProductShownForm').find('[type="submit"]').prop('disabled',true);
        }
        else{
          GetVariantID = $(this).attr('vid');
          GetVariantPrice = $(this).attr('data-price');
          GetVariantComparePrice = $(this).attr('data-compare'); 
          GetVariantDiscount = $(this).attr('disount-cal');
          GetVariantImage = $(this).attr('data-img');
          $(this).parents('.ProductShownForm').find('[type="submit"]').attr('data-variant',GetVariantID);
          $(this).parents('.ProductShownForm').find('[type="submit"]').children('span').html('Add to cart');
          $(this).parents('.ProductShownForm').find('[type="submit"]').prop('disabled',false);

          $(this).parents('.productShownEachblock').find('[data-recomm-price-update]').children('.productShownPriceBox').children('[actual-price]').html(GetVariantPrice);
          $(this).parents('.productShownEachblock').find('[data-recomm-price-update]').children('.productShownPriceBox').children('[recomm-cmopare-price]').html(GetVariantComparePrice);
          $(this).parents('.productShownEachblock').children('.productShownImage').children('a').find('[cart-recomm-image-update]').attr("src",GetVariantImage);
        }
      }
    })
  });

  setInterval(function(){ 
    if( $('.ProductShownEachMainBlock.slick-initialized.slick-slider').length > 0 ){
      var productShowHeightTitle = 0; 
      var productShowwidthTitle = 0;
      if( $('.ProductShownEachMainBlock').children('.slick-list').children('.slick-track').children('.productShownEachblock').length > 1 ){
        $('.ProductShownEachMainBlock').children('.slick-list').children('.slick-track').children('.productShownEachblock').children('.productShownImage').children('a').children('.ProductMainImageShows').each(function(){
          var phtl = $(this).height();
          var pht2 = $(this).width(); 
          productShowHeightTitle = Math.max(productShowHeightTitle, parseFloat(phtl));
          productShowwidthTitle = Math.max(productShowwidthTitle, parseFloat(pht2));
        });
        $('.productShownImage a img').css('height',productShowwidthTitle +'px');  
         $('.productShownImage a img').css('width',productShowwidthTitle +'px'); 
      }
      else{
//         var pht2 = $('.ProductShownEachMainBlock').children('.slick-list').children('.slick-track').children('.productShownEachblock').children('.productShownImage').children('a').children('.ProductMainImageShows').width();
//         console.log(pht2);
//         $('.productShownImage a img').css('height',pht2 +'px'); 
      } 
    }
  },200);

  setInterval(function(){ 
    if( $('.ProductShownEachMainBlock.slick-initialized.slick-slider').length > 0 ){
      var highest118 = 0; 
      $('.ProductShownDetail').css('height','auto');
      $('.ProductShownEachMainBlock').children('.slick-list').children('.slick-track').children('.productShownEachblock').children('.productShownPriceDatilCapture').children('.ProductShownDetail').each(function(){
        var ht18 = $(this).height();
        highest118 = Math.max(highest118, parseFloat(ht18));
      }); 
      $('.ProductShownDetail').css('height',highest118 +'px');
    }
  },200); 

  setInterval(function(){ 
    if( $('.ProductShownEachMainBlock.slick-initialized.slick-slider').length > 0 ){
      var productShowHeightVariant = 0; 
      $('.productShownPriceBox').css('height','auto');
      $('.ProductShownEachMainBlock').children('.slick-list').children('.slick-track').children('.productShownEachblock').children('.ProductShownFormCapture').children('.ProductShownForm').children('.productShownVariantMain').each(function(){
        var phtvv = $(this).height();
        productShowHeightVariant = Math.max(productShowHeightVariant, parseFloat(phtvv));
      });
      $('.productShownVariantMain').css('height',productShowHeightVariant +'px');
    }
  },200);

  setInterval(function(){   
    if( $('.ProductShownEachMainBlock.slick-initialized.slick-slider').length > 0 ){
      var productShowHeightprice = 0; 
      $('.productShownPriceBox').css('height','auto');
      $('.ProductShownEachMainBlock').children('.slick-list').children('.slick-track').children('.productShownEachblock').children('.productShownPriceDatilCapture').children('.productShownPriceBox').each(function(){
        var phtpp = $(this).height();
        productShowHeightprice = Math.max(productShowHeightprice, parseFloat(phtpp));
      });
      $('.productShownPriceBox').css('height',productShowHeightprice +'px');
    }
  },200);

  
  $('.addtocart_sticky').click(function(e){
    e.preventDefault();  
    $('.add-to-cart').trigger('click'); 
  });

  $(".product-single__variant").on('change', function()
                                   {
    var data= $(this).val();
    $('.product-single__variants').val(data).trigger('change');  

    var option = $('option:selected', this).attr('data-title');
    var option = option.split(" / ");
    // ********************************option1
    var variant1 = option[0];
    variant1 =  $.trim(variant1);

    $('.myoption1 .variant-input').each(function() {
      var optiontest = $(this).attr('data-value');

      if(optiontest==variant1)
      {
        //alert('hurray');
        $(this).children('input').trigger('click');
      }

    }); 
    // ********************************option2
    if(option[1] == null)
    {
    }
    else
    {
      var variant2 = option[1];
      variant2 =  $.trim(variant2);
      $('.myoption2 .variant-input').each(function()
                                          {
        var optiontest = $(this).attr('data-value');
        if(optiontest==variant2)
        {
          //alert('hurray');
          $(this).children('input').trigger('click');
        } 
      }); 
    }
    // ********************************option3
    if(option[2] == null)
    {
    }
    else
    {
      var variant3 = option[2];
      variant3 =  $.trim(variant3);
      $('.myoption3 .variant-input').each(function()
                                          {
        var optiontest = $(this).attr('data-value');
        if(optiontest==variant3)
        {
          //alert('hurray');
          $(this).children('input').trigger('click');
        } 
      }); 
    }
    // ********************************option3



  });


  setInterval(function(){ 
    var leng = $(".main-cll").length;
    if(leng == '2'){
      $('.cv_index_coll').addClass('ox_unslick');
      $('.featured-collection').find('.slick-next').addClass('oxi_none');
      $('.featured-collection').find('.slick-prev').addClass('oxi_none');
    }else if(leng == '1'){
      $('.cv_index_coll').addClass('ox_unslick');
      $('.featured-collection').find('.slick-next').addClass('oxi_none');
      $('.featured-collection').find('.slick-prev').addClass('oxi_none');
    }else if(leng == '0'){
      $('section.featured-collection').addClass('oxi_none');
      $('.featured-collection').find('.slick-prev').addClass('oxi_none');
    }
  },400);

  setInterval(function(){ 
    var leng = $(".productShownEachblock ").length;
    if(leng == '0'){
      $('.product-shown-collection').addClass('oxi_none');
    }
  },400);

  setInterval(function(){ 
    var ttl;
    var tl;
    $('.ajaxcart__product').each(function(){
      ttl = $(this).find('.ajaxcart__product-name').html();
    });
    $('.main-cll').each(function(){
      tl = $(this).find('.CartBuiltTitleRecomm').html();
      if(ttl.match(tl)){
        $(this).hide();
      }
    });
  },1000);

});









