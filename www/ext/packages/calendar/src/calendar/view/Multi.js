/**
 * For an overview of calendar views see {@link Ext.calendar.view.Base}
 *
 * This view is used to wrap multiple calendar panels and allows switching between and
 * communicating with them through a single interface. This class does not provide any
 * additional UI functionality.  That is provided by {@link Ext.calendar.panel.Panel}
 * which wraps this component.
 *
 * Sample Multi view
 *
 *     Ext.create({
 *         xtype: 'calendar-multiview',
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
 *         },
 *         views: {
 *             day: {
 *                 xtype: 'calendar-day'
 *             },
 *             week: {
 *                 xtype: 'calendar-week'
 *             },
 *             month: {
 *                 xtype: 'calendar-month'
 *             }
 *         },
 *         defaultView: 'day'
 *     });
 *
 * In the previous example we've detailed the calendar panel types we're interested in
 * having contained within the multi view using the {@link #cfg-views} config option.
 * The key specified for each calendar panel will be used when specifying the initial
 * {@link #cfg-defaultView} as well as when setting the current view at runtime using
 * the {@link #method-setView} method.
 *
 * The following Multi view configs will be applied to any calendar panel in the views
 * config:
 *
 *  - {@link #cfg-compact}
 *  - {@link #cfg-compactOptions}
 *  - {@link #cfg-store}
 *  - {@link #cfg-timezoneOffset}
 *  - {@link #cfg-value}
 *
 * ### Date Range Navigation
 *
 * The {@link #movePrevious} and {@link #moveNext} move the active view backward
 * and forward.  The amount moved depends on the current view type.
 *
 * ### Alternative Classes
 *
 * If you require UI controls for navigating views and toggling the visibility of events
 * per source calendar consider {@link Ext.calendar.panel.Panel}.
 * Ext.calendar.panel.Panel wraps the Multi view and provides navigational controls.
 */
Ext.define('Ext.calendar.view.Multi', {
    extend: 'Ext.container.Container',
    xtype: 'calendar-multiview',

    requires: [
        'Ext.calendar.date.Util'
    ],

    layout: 'fit',

    platformConfig: {
        '!desktop':  {
            compact: true
        }
    },

    config: {
        /**
         * @inheritdoc Ext.calendar.view.Base#cfg-compact
         * <br>The compact config is applied to all configured {@link #cfg-views}.
         */
        compact: false,

        /**
         * @inheritdoc Ext.calendar.view.Base#cfg-compactOptions
         * <br>The compactOptions config is applied to all configured {@link #cfg-views}.
         */
        compactOptions: null,

        /**
         * @inheritdoc Ext.calendar.view.Base#cfg-store
         * <br>The store config is applied to all configured {@link #cfg-views}.
         */
        store: null,

        /**
         * @inheritdoc Ext.calendar.view.Base#cfg-timezoneOffset
         * <br>The timezoneOffset config is applied to all configured {@link #cfg-views}.
         */
        timezoneOffset: undefined,

        /**
         * @inheritdoc Ext.calendar.view.Base#cfg-value
         * <br>The value config is applied to all configured {@link #cfg-views}.
         */
        value: undefined,

        /**
         * @cfg {Object} views
         * The calendar views to have available, each item in this configuration
         * (labelled by a key) is to contain the configuration for the view, a class that
         * extends {@link Ext.calendar.panel.Base}.
         *
         * Example with a day and week view:
         *
         *     views: {
         *         day: {
         *             xtype: 'calendar-day'
         *         },
         *         week: {
         *             xtype: 'calendar-week'
         *         }
         *     }
         *
         * The "day" and "week" keys would be the eligible values for the
         * {@link #cfg-defaultView} and the param string to pass to
         * {@link #method-setView}.
         */
        views: null
    },

    /**
     * @cfg {String} defaultView
     * The key of the item from {@link #views} to use as the default.
     */
    defaultView: null,

    constructor: function(config) {
        this.callParent([config]);
        var view = this.defaultView;
        if (view) {
            this.setView(view);
        }
    },

    /**
     * Moves the active view forward. The amount moved
     * depends on the current view.
     */
    moveNext: function() {
        this.setValue(this.activeView.calculateMoveNext());
    },

    /**
     * Moves the active view backward. The amount moved
     * depends on the current view.
     */
    movePrevious: function() {
        this.setValue(this.activeView.calculateMovePrevious());
    },

    /**
     * Move the current view by an amount based of the current {@link #value}.
     * @param {Number} amount The number of intervals to move.
     * @param {String} [interval=Ext.Date.DAY] The interval to navigate by. See {@link Ext.Date}
     * for valid intervals.
     */
    navigate: function(amount, interval) {
        var D = Ext.Date;
        if (amount !== 0) {
            this.setValue(D.add(this.getValue(), interval || D.DAY, amount, true));
        }
    },

    /**
     * Set the active view.
     *
     * Example defaultView / views configuration
     *
     *     defaultView: 'day',
     *     views: {
     *         day: {
     *             xtype: 'calendar-day'
     *         },
     *         week: {
     *             xtype: 'calendar-week'
     *         }
     *     }
     *
     * To change the view from the default of "day" to "week":
     *
     *     ViewInstance.setView('week');
     *
     * @param {String} view The view name from {@link #views}.
     */
    setView: function(view) {
        var me = this,
            active = me.activeView,
            cfg;

        if (active && active.$key === view) {
            return;
        }

        Ext.suspendLayouts();
        if (active) {
            me.remove(active);
        }
        cfg = me.getViews()[view];
        //<debug>
        if (!cfg) {
            Ext.raise('Invalid view specified: "' + view + '".');
        }
        //</debug>
        me.activeView = me.add(me.createView(cfg, view));
        me.activeView.on('valuechange', 'onValueChange', me);
        me.recalculate(me.getValue());

        Ext.resumeLayouts(true);
    },

    // Appliers/Updaters
    updateCompact: function(compact) {
        this.setViewCfg('setCompact', compact);
    },

    applyStore: function(store) {
        if (store) {
            store = Ext.StoreManager.lookup(store, 'calendar-calendars');
        }
        return store;
    },

    updateStore: function(store) {
        var me = this;

        me.setViewCfg('setStore', store);
        if (!me.isConfiguring) {
            me.recalculate(me.getValue());
        }
    },

    applyTimezoneOffset: function(timezoneOffset) {
        this.autoOffset = false;
        if (timezoneOffset === undefined) {
            timezoneOffset = Ext.calendar.date.Util.getDefaultTimezoneOffset();
            this.autoOffset = true;
        }
        return timezoneOffset;
    },

    updateTimezoneOffset: function(timezoneOffset) {
        this.setViewCfg('setTimezoneOffset', timezoneOffset);
    },

    applyValue: function(value, oldValue) {
        value = Ext.Date.clearTime(value || Ext.calendar.date.Util.getLocalNow(), true);
        if (oldValue && oldValue.getTime() === value.getTime()) {
            value = undefined;
        }
        return value;
    },

    updateValue: function(value) {
        if (!this.isConfiguring) {
            this.recalculate(value);
        }
    },
    
    showAddForm: function(data, options) {
        return this.activeView.showAddForm(data, options);
    },
    
    showEditForm: function(event, options) {
        return this.activeView.showEditForm(event, options);
    },

    privates: {
        createView: function(cfg, key) {
            var me = this;

            return Ext.apply({
                $key: key,
                controlStoreRange: false,
                compact: me.getCompact(),
                store: me.getStore(),
                timezoneOffset: me.autoOffset ? undefined : me.getTimezoneOffset(),
                value: me.getValue()
            }, cfg);
        },

        getActiveKey: function() {
            var active = this.activeView;
            return active ? active.$key : '';
        },
        
        onValueChange: function(view, context) {
            this.setValue(context.value);
            this.fireEvent('valuechange', this, context);
        },

        recalculate: function(value) {
            var view = this.activeView,
                store = this.getStore(),
                range, eventSource;

            if (view && store) {
                eventSource = store.getEventSource();
                range = Ext.calendar.date.Util.expandRange(view.getView().doRecalculate(value).full);

                eventSource.setRange(range);
                view.setValue(value);
            }
        },

        setViewCfg: function(setterName, value) {
            if (!this.isConfiguring) {
                var view = this.activeView;
                if (view) {
                    view[setterName](value);
                }
            }
        }
    }
});
