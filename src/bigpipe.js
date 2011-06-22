/*global console,document,jQuery*/

// @link http://javascript.crockford.com/private.html
(function($) {
	'use strict';

	var

	/**
	 * Logs message
	 * 
	 * @access private
	 * @param string msg
	 * @param object obj (optional)
	 * @return void
	 */
	log = function(msg, obj) {
		if('undefined' !== typeof console
		 && 'undefined' !== typeof console.log) {
			console.log(msg, obj || {});
		}
	},

	/**
	 * Pagelet definition
	 * 
	 * @return void
	 */
	Pagelet = function(BigPipe, options) {
		// Private properties

		var

		/**
		 * Pinged resources
		 * @access private
		 * @var integer pinged
		 */
		pinged = 0,
		
		/**
		 * Privileged scope
		 * @access private
		 * @var Pagelet that 
		 */
		that = this,

		// Private methods

		/**
		 * Logs message
		 * 
		 * @access private
		 * @param string msg
		 * @param object obj (optional)
		 * @return void
		 */
		debug = function(msg, obj) {
			if(that.options.debug) {
				log('BigPipe pagelet "' + that.options.id + '": ' + msg, obj || that);
			}
		},

		/**
		 * Updates state
		 * 
		 * @access private
		 * @param integer state
		 * @return void
		 */
		setState = function(state) {
			that.state = state;
			debug('State is now ' + that.state);

			that.options.onStateChange(that.state, that);//notify
		},

		/**
		 * Completes pagelet
		 * 
		 * @access private
		 * @return void
		 */
		onComplete = function() {
			setState(5);
			BigPipe.ping();//notify
		},

		/**
		 * Pings resource queue
		 * 
		 * @access private
		 * @return void
		 */		
		ping = function() {
			pinged += 1;
			if(that.options.js.length === pinged) {
				onComplete();
			}
		};

		// Public properties

		/**
		 * Options
		 * @access public
		 * @var object options
		 */
		this.options = options;
		
		/**
		 * Current state
		 * 0: idle (object has been constructed)
		 * 1: preloading (CSS are loaded)
		 * 2: rendering (HTML is rendered)
		 * 3: waiting (waiting for ready to proceed)
		 * 4: postloading (JS are loaded)
		 * 5: complete (pagelet is complete)
		 * @access public
		 * @var integer state
		 */
		this.state = null;

		/**
		 * Pagelet target
		 * 
		 * @access public
		 * @var object target
		 */
		this.target = $('[data-pagelet=' + this.options.id + ']');

		// Public methods

		/**
		 * Loads JS resources
		 * 
		 * @access public
		 * @return void
		 */
		this.postload = function() {
			if(0 === that.options.js.length) {//nothing to be done
				onComplete();
			}
			else {
				setState(4);
				$.each(that.options.js, function() {
					debug('Postloading "' + this + '"');
					$.ajax({
						dataType: 'script',
						url:      this,

						complete: function() {
							ping();
						}
					});
				});
			}
		};

		/**
		 * Starts pagelet
		 * 
		 * @access public
		 * @return void
		 */
		this.start = function() {
			// Load CSS
			if(0 !== that.options.css.length) {
				setState(1);
				$.each(that.options.css, function() {
					debug('Preloading "' + this + '"');
					if(document.createStyleSheet) {//IE
						// @link http://msdn.microsoft.com/en-us/library/ms531194%28VS.85%29.aspx
						document.createStyleSheet(this);
					}
					else {
						$('<link />', {
							href: this,
							rel:  'stylesheet',
							type: 'text/css'
						}).appendTo('head');
					}
				});
			}
			
			// Render HTML
			setState(2);
			that.target.html(that.options.data);//replace HTML
			setState(3);
		};

		// Constructor
		setState(0);
	},

	/**
	 * BigPipe definition
	 * 
	 * @return void
	 */
	BigPipe = function(options) {
		// Private properties

		var

		/**
		 * Registered pagelets
		 * @access private
		 * @var Array pagelets
		 */
		pagelets = [],

		/**
		 * Pinged pagelets
		 * @access private
		 * @var integer pinged
		 */
		pinged = 0,

		/**
		 * Privileged scope
		 * @access private
		 * @var BigPipe that 
		 */
		that = this,

		// Private methods

		/**
		 * Logs message
		 * 
		 * @access private
		 * @param string msg
		 * @param object obj (optional)
		 * @return void
		 */
		debug = function(msg, obj) {
			if(that.options.debug) {
				log('BigPipe: ' + msg, obj || that);
			}
		},

		/**
		 * Updates state
		 * 
		 * @access private
		 * @param integer state
		 * @return void
		 */
		setState = function(state) {
			that.state = state;
			debug('State is now ' + that.state);

			that.options.onStateChange(that.state, that);//notify
		},

		/**
		 * Completes BigPipe
		 * 
		 * @access public
		 * @return void
		 */
		onComplete = function() {
			setState(3);
		};

		// Public properties

		/**
		 * Options
		 * @access public
		 * @var object options
		 */
		this.options = options;

		/**
		 * Current state
		 * 0: idle (object has been constructed)
		 * 1: receiving (pagelets are coming in)
		 * 2: rendering (scripts are loaded)
		 * 3: complete (pagelets are complete)
		 * @access public
		 * @var integer state
		 */
		this.state = null;

		// Public methods

		/**
		 * Adds pagelet to queue
		 * 
		 * @access public
		 * @param object opts
		 * @return Pagelet
		 */
		this.onArrive = function(opts) {
			setState(1);
			debug('Pagelet arrived', opts);

			// Create pagelet
			var pagelet = new Pagelet(that, $.extend({}, that.options, $.BigPipe.pagelet, opts));
			pagelets.push(pagelet);//add to queue
			pagelet.start();
			return pagelet;
		};

		/**
		 * Pings BigPipe
		 * 
		 * @return void
		 */
		this.ping = function() {
			pinged += 1;
			if(pagelets.length === pinged) {
				onComplete();
			}
		};

		// Constructor
		setState(0);

		// Add trigger for rendering on document ready
		$(function() {
			// Postload pagelets
			if(0 === pagelets.length) {
				onComplete();
			}
			else {
				setState(2);
				$.each(pagelets, function() {
					this.postload();
				});
			}
		});
	};

	/**
	 * Returns new BigPipe
	 * 
	 * @access public
	 * @param object options
	 * @return BigPipe
	 */
	$.BigPipe = function(options) {
		return new BigPipe($.extend({}, $.BigPipe.options, options));
	};

	/**
	 * Default options
	 * @access public
	 * @var object $.BigPipe.options
	 */
	$.BigPipe.options = {
		debug:         false,
		onStateChange: function() { }
	};

	/**
	 * Pagelet default options
	 * @access public
	 * @var object $.BigPipe.pagelet
	 */
	$.BigPipe.pagelet = {
		id:            'pagelet',
		data:          '',
		js:            [],
		css:           [],
		onStateChange: function() { }
	};

}(jQuery));
