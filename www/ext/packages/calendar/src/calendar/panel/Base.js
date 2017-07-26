/**
 * @abstract
 * A base class that composes a calendar view and a
 * {@link Ext.calendar.header.Base header}.  Calendar views display events for a date /
 * time range specified by the view subclasses:
 *
 * - {@link Ext.calendar.panel.Day Day}
 * - {@link Ext.calendar.panel.Days Days}
 * - {@link Ext.calendar.panel.Week Week}
 * - {@link Ext.calendar.panel.Weeks Weeks}
 * - {@link Ext.calendar.panel.Month Month}
 * - {@link Ext.calendar.panel.Multi Multi}
 *
 * By default, the view will display the current date along with any other dates surround
 * that date as specified by the particular view type.  A target date can be specified
 * by setting the {@link #value} config option.
 *
 * ### Sample View
 *
 * Below is a sample view instance.  The following example shows how to create a day view,
 * but the basic configuration applies to all view subclasses with the exception of the
 * xtype used.
 *
 *     Ext.create({
 *         xtype: 'calendar-day',
 *         renderTo: Ext.getBody(),
 *         height: 400,
 *         width: 400,
 *         store: {
 *             autoLoad: true,
 *             proxy: {
 *                 type: 'ajax',
 *                 url: 'calendars.php'
 *             },
 *             eventStoreDefaults: {
 *                 proxy: {
 *                     type: 'ajax',
 *                     url: 'events.php'
 *                 }
 *             }
 *         }
 *     });
 *
 * Configurations for the view can be specified directly on the panel:
 *
 *     Ext.create({
 *         xtype: 'calendar-day',
 *         height: 500,
 *         height: 500,
 *         resizeEvents: false,
 *         startTime: 8,
 *         endTime: 16,
 *         store: {
 *             autoLoad: true,
 *             proxy: {
 *                 type: 'ajax',
 *                 url: 'calendars.php'
 *             },
 *             eventStoreDefaults: {
 *                 proxy: {
 *                     type: 'ajax',
 *                     url: 'events.php'
 *                 }
 *             }
 *         }
 *         listeners: {
 *             eventdrop: function() {
 *                 console.log('Dropped');
 *             }
 *         }
 *     });
 *
 * **Note:** For more information on possible store configurations and the expected
 * server response for both Calendars and Events stores see:
 * {@link Ext.calendar.store.Calendars}.
 *
 * ### In-View Calendar Events
 *
 * Events show on the view timeline with their start and end times correlating to either
 * the date or the time slots depending on the view type.  The events will display on the
 * timeline according to your local timezone offset from GMT (the expected format for
 * start / end times for events is UTC).  The timezone offset can be applied explicitly
 * using the {@link #timezoneOffset} config option.  If the view has multiple source
 * calendars, their events will attempt to share overlapping space within their
 * corresponding date / time slots.  Events will be displayed as a different color for
 * each source calendar and their appearance will vary slightly depending on their
 * {@link Ext.calendar.Event.html#mode mode}.  The overlapping behavior of events
 * competing for the same time slot can be managed using the {@link #displayOverlap}
 * config option.
 *
 * ### Adding / Editing Events
 *
 * Events may be added to the view by dragging / swiping across the timeline to create
 * the event endpoints.  Doing so shows the {@link Ext.calendar.form.Add add event form}
 * with the dates / times pre-populated from the drag selection.  The
 * {@link #allowSelection} config can be set to false to prevent user from creating
 * events in this way.  Events added programmatically by calling the
 * {@link #method-showAddForm} method to present the add input form.  Set the view's
 * {@link #addForm} config to `null` to prevent events from being added to the
 * calendar.
 *
 * Double clicking / tapping an event within the view shows the
 * {@link Ext.calendar.form.Edit edit event form} allowing events to be edited by users.
 * The add form and edit form can be configured using the view's {@link #addForm} and
 * {@link #editForm} configs.  For views with time displayed on the y axis of the
 * view (Day, Days, and Week), existing events can be resized using the resize handle on
 * the event widget as well as dragged across the view.  The {@link #resizeEvents},
 * {@link #draggable}, and {@link #droppable} configs may be used to manage event
 * interactions.
 *
 * ### View Navigation
 *
 * The calendar view does not create controls for navigating the view's date range,
 * however the view can be navigated programmatically.  The view's target date can be set
 * explicitly using the {@link #method-setValue} method.  The
 * {@link #method-movePrevious} and {@link #method-moveNext} methods may be called to
 * move the displayed date range forward or back.  And the {@link #method-navigate} lets
 * you move the date an arbitrary amount relative to the current date {@link #value}.
 *
 * ### Compact Mode
 * The base view class has a {@link #compact} config.  This boolean configures
 * whether or not the view is in compact mode.  It’s expected that this will be used as a
 * platform config or a responsive config.  Setting compact mode by itself does not
 * modify how the view displays.  What it does do is apply the
 * {@link #compactOptions} config over the top over the current configuration
 * options.  These `compactOptions` are what is used to specify what compactness means
 * for a particular view.  Check out the `compactOptions` for each calendar view type to
 * see its default `compactOptions`.
 */
Ext.define('Ext.calendar.panel.Base', {
    extend: 'Ext.calendar.panel.AbstractBase',

    config: {
        /**
         * @cfg {Object} dayHeader
         * A config for the {@link Ext.calendar.header.Base day header}. This can be
         * configured directly on the panel.  The relevant configurations will be
         * forwarded to the header.
         */
        dayHeader: null,

        /**
         * @cfg {Object} eventRelayers
         * A list of events to relay from the underlying view.
         * 
         * @private
         */
        eventRelayers: {
            view: {
                /**
                 * @event beforeeventadd
                 * @inheritdoc Ext.calendar.view.Base#beforeeventadd
                 */
                beforeeventadd: true,

                /**
                 * @event beforeeventedit
                 * @inheritdoc Ext.calendar.view.Base#beforeeventadd
                 */
                beforeeventedit: true,

                /**
                 * @event eventadd
                 * @inheritdoc Ext.calendar.view.Base#eventadd
                 */
                eventadd: true,

                /**
                 * @event eventedit
                 * @inheritdoc Ext.calendar.view.Base#eventedit
                 */
                eventedit: true,

                /**
                 * @event eventdrop
                 * @inheritdoc Ext.calendar.view.Base#eventdrop
                 */
                eventdrop: true,

                /**
                 * @event eventtap
                 * @inheritdoc Ext.calendar.view.Base#eventtap
                 */
                eventtap: true,

                /**
                 * @event validateeventadd
                 * @inheritdoc Ext.calendar.view.Base#validateeventadd
                 */
                validateeventadd: true,

                /**
                 * @event validateeventedit
                 * @inheritdoc Ext.calendar.view.Base#validateeventedit
                 */
                validateeventedit: true,

                /**
                 * @event validateeventdrop
                 * @inheritdoc Ext.calendar.view.Base#validateeventdrop
                 */
                validateeventdrop: true,

                /**
                  * @event valuechange
                  * @inheritdoc Ext.calendar.view.Base#valuechange
                  */
                valuechange: true
            }
        },

        /**
         * @cfg {Object} view
         * A config for the main calendar view. This can be configured directly on the panel,
         * the relevant configurations will be forwarded to the view.
         */
        view: null
    },

    platformConfig: {
        '!desktop':  {
            compact: true
        }
    },

    // This must sit outside a config block because we need to
    // access the value before initConfig.
    /**
     * @cfg {Object} configExtractor
     * A set of configs for the composable pieces.
     * This serves 2 purposes:
     * - Pulls configs from the initial class config to
     * pass to the constructor for the relevant piece.
     * - Generates proxy getter/setter methods.
     *
     * @protected
     */
    configExtractor: {
        view: {
            /**
             * @inheritdoc Ext.calendar.view.Base#addForm
             * @accessor
             */
            addForm: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#compact
             * @accessor
             */
            compact: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#compactOptions
             * @accessor
             */
            compactOptions: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#controlStoreRange
             * @accessor
             */
            controlStoreRange: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#editForm
             * @accessor
             */
            editForm: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#eventDefaults
             * @accessor
             */
            eventDefaults: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#gestureNavigation
             * @accessor
             */
            gestureNavigation: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#store
             * @accessor
             */
            store: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#timezoneOffset
             * @accessor
             */
            timezoneOffset: true,
            /**
             * @inheritdoc Ext.calendar.view.Base#value
             * @accessor
             */
            value: true
        }
    },

    twoWayBindable: {
        value: 1
    },

    cls: [ Ext.baseCSSPrefix + 'calendar-base', Ext.baseCSSPrefix + 'unselectable' ],

    constructor: function(config) {
        var me = this,
            C = Ext.Config,
            extractor = me.configExtractor,
            extracted = {},
            cfg, key, item, extractedItem, proxyKey;

        config = Ext.apply({}, config);

        me.extracted = extracted;

        for (cfg in extractor) {
            item = extractor[cfg];
            extracted[cfg] = extractedItem = {};

            for (key in config) {
                if (key in item) {
                    proxyKey = item[key];
                    if (proxyKey === true) {
                        proxyKey = key;
                    }
                    extractedItem[proxyKey] = config[key];
                    delete config[key];
                }
            }

            me.setupProxy(item, C.get(cfg).names.get);
        }
        me.callParent([config]);

        me.initRelayers();
    },

    onClassExtended: function(cls, data, hooks) {
        // We need to manually merge these because we can't have it in
        // the config block, we need to access it before initConfig.
        var extractor = data.configExtractor;
        if (extractor) {
            delete data.configExtractor;
            cls.prototype.configExtractor = Ext.merge({}, cls.prototype.configExtractor, extractor);
        }
    },

    /**
     * @inheritdoc Ext.calendar.view.Base#method-getDisplayRange
     */
    getDisplayRange: function() {
        return this.getView().getDisplayRange();
    },

    /**
     * @inheritdoc Ext.calendar.view.Base#method-getVisibleRange
     */
    getVisibleRange: function() {
        return this.getView().getVisibleRange();
    },

    /**
     * @inheritdoc Ext.calendar.view.Base#method-moveNext
     */
    moveNext: function() {
        this.getView().moveNext();
    },

    /**
     * @inheritdoc Ext.calendar.view.Base#method-movePrevious
     */
    movePrevious: function() {
        this.getView().movePrevious();
    },

    /**
     * @inheritdoc Ext.calendar.view.Base#method-navigate
     */
    navigate: function(amount, interval) {
        this.getView().navigate(amount, interval);
    },

    /**
     * @inheritdoc Ext.calendar.view.Base#method-showAddForm
     */
    showAddForm: function(data, options) {
        this.getView().showAddForm(data, options);
    },

    /**
     * @inheritdoc Ext.calendar.view.Base#method-showEditForm
     */
    showEditForm: function(event, options) {
        this.getView().showEditForm(event, options);
    },

    // Appliers/Updaters
    applyDayHeader: function(dayHeader) {
        if (dayHeader) {
            dayHeader = Ext.apply(this.extracted.dayHeader, dayHeader);
            dayHeader = Ext.create(dayHeader);
        }
        return dayHeader;
    },

    updateDayHeader: function(dayHeader, oldDayHeader) {
        if (oldDayHeader) {
            oldDayHeader.destroy();
        }
        if (dayHeader) {
            this.getView().setHeader(dayHeader);
        }
        this.callParent([dayHeader, oldDayHeader]);
    },

    applyView: function(view) {
        if (view) {
            view = Ext.create(Ext.apply(this.extracted.view, view));
        }
        return view;
    },

    updateView: function(view, oldView) {
        if (oldView) {
            oldView.destroy();
        }
        this.callParent([view, oldView]);
    },

    privates: {
        /**
         * @inheritdoc Ext.calendar.view.Base#calculateMoveNext
         * @private
         */
        calculateMoveNext: function() {
            return this.getView().calculateMoveNext();
        },

        /**
         * @inheritdoc Ext.calendar.view.Base#calculateMovePrevious
         * @private
         */
        calculateMovePrevious: function() {
            return this.getView().calculateMovePrevious();
        },

        /**
         * Create a relayer function. 
         * @param {name} name The event name to fire.
         * @return {Function} A function that fires the relayed event.
         *
         * @private
         */
        createItemRelayer: function(name) {
            var me = this;
            return function(view, o) {
                return me.fireEvent(name, me, o);
            };
        },

        /**
         * Generates proxy getter/setter methods 
         * @param {Ext.Config} thisCfg The config to apply to this object.
         * @param {Ext.Config} targetCfg The config object for the target config.
         * @param {String} targetName The getter name for the item on this component.
         *
         * @private
         */
        generateProxyMethod: function(thisCfg, targetCfg, targetName) {
            var me = this,
                targetSetter = targetCfg.names.set,
                targetGetter = targetCfg.names.get,
                setter = thisCfg.names.set,
                getter = thisCfg.names.get;

            if (!me[setter]) {
                me[setter] = function(value) {
                    var o = me[targetName]();
                    if (o) {
                        o[targetSetter](value);
                    }
                };
            }

            if (!me[getter]) {
                me[getter] = function() {
                    var o = me[targetName]();
                    if (o) {
                        return o[targetGetter]();
                    }
                };
            }
        },

        /**
         * Initialize event relayers.
         *
         * @private
         */
        initRelayers: function() {
            var C = Ext.Config,
                relayers = this.getEventRelayers(),
                key, events, c, name, prefix;

            for (key in relayers) {
                events = relayers[key];
                c = this[C.get(key).names.get]();
                prefix = events.$prefix || '';
                for (name in events) {
                    c.on(name, this.createItemRelayer(prefix + name));
                }
            }
        },

        /**
         * Refresh events on the view.
         * @private
         */
        refreshEvents: function() {
            this.getView().refreshEvents();
        },

        /**
         * Sets up proxy methods for a component.
         * @param {Object} configs The list of to setup for a component.
         * @param {String} targetName The getter name for the item on this component.
         *
         * @private
         */
        setupProxy: function(configs, targetName) {
            var me = this,
                C = Ext.Config,
                key, targetCfg, thisCfg, val;

            for (key in configs) {
                val = configs[key];
                thisCfg = C.get(key);
                if (val === true) {
                    targetCfg = thisCfg;
                } else {
                    targetCfg = C.get(val);
                }

                me.generateProxyMethod(thisCfg, targetCfg, targetName);
            }
        }
    }
});
