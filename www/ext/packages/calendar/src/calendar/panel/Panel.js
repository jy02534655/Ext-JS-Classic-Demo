/**
 * This class is the main calendar panel, it wraps {@link Ext.calendar.view.Multi}.
 *
 * It allows switching between multiple views of the same dataset. It is composed of the
 * other calendar types such as {@link Ext.calendar.panel.Month},
 * {@link Ext.calendar.panel.Week}, and {@link Ext.calendar.panel.Day}.
 *
 * It also provides extra UI features like a switcher button,
 * {@link #cfg-titleBar title bar}, and navigation buttons.
 *
 * Sample Calendar panel
 *
 *     Ext.create({
 *         xtype: 'calendar',
 *         renderTo: Ext.getBody(),
 *         height: 400,
 *         width: 600,
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
 * By default, the Calendar panel contains a {@link Ext.calendar.panel.Day Day},
 * {@link Ext.calendar.panel.Week Week}, and {@link Ext.calendar.panel.Month Month} view.
 * Configurations for these views may be passed in the {@link #cfg-views} config option.
 * For example, to display only a 5-day work week instead of the default 7-day week the
 * following `views` config would be used:
 *
 *     Ext.create({
 *         xtype: 'calendar',
 *         renderTo: Ext.getBody(),
 *         height: 400,
 *         width: 600,
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
 *             week: {
 *                 visibleDays: 5,
 *                 firstDayOfWeek: 1
 *             }
 *         }
 *     });
 *
 * The previous example will result in a Day, Week, and Month view in the Calendar panel
 * with the Week view displaying only 5 days.  Set a default view to `null` to prevent it
 * from being included in the Calendar panel.
 *
 *     Ext.create({
 *         xtype: 'calendar',
 *         renderTo: Ext.getBody(),
 *         height: 400,
 *         width: 600,
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
 *             month: null,  // now only the Week and Day calendars will be included
 *             week: {
 *                 visibleDays: 5,
 *                 firstDayOfWeek: 1
 *             }
 *         }
 *     });
 *
 * See the {@link #cfg-views} config for additional configuration options.
 *
 * The default view is "month".  This can be set using the {@link #cfg-defaultView}
 * config option.
 *
 * The following Multi view configs will be applied to any calendar panel in the views
 * config:
 *
 *  - {@link #cfg-compact}
 *  - {@link #cfg-compactOptions}
 *  - {@link #cfg-store}
 *  - {@link #cfg-timezoneOffset}
 *  - {@link #cfg-value}
 */
Ext.define('Ext.calendar.panel.Panel', {
    extend: 'Ext.calendar.panel.AbstractPanel',
    xtype: 'calendar',

    mixins: ['Ext.mixin.ConfigState'],
    alternateStateConfig: 'compactOptions',

    requires: [
        'Ext.calendar.panel.Day',
        'Ext.calendar.panel.Week',
        'Ext.calendar.panel.Month',
        'Ext.calendar.List',
        'Ext.calendar.view.Multi',
        'Ext.calendar.date.Util'
    ],

    referenceHolder: true,

    platformConfig: {
        '!desktop':  {
            compact: true
        }
    },

    config: {
        /**
         * @cfg {Object} calendarList
         * The config for creating the {@link Ext.calendar.List calendar list).
         */
        calendarList: {
            xtype: 'calendar-list',
            reference: 'list',
            flex: 1
        },

        /**
         * @cfg {Boolean} compact
         * @inheritdoc Ext.calendar.view.Multi#cfg-compact
         */
        compact: false,

        /**
         * @cfg {Object} compactOptions
         * @inheritdoc Ext.calendar.view.Multi#cfg-compactOptions
         */
        compactOptions: {},

        /**
         * @cfg {Object} createButton
         * The config for creating the create button.  Clicking / tapping the create
         * button shows the {@link Ext.calendar.form.Add add event form}.  To prevent the
         * create button from being created use `null`.
         *
         *     createButton: null
         *
         * To configure the add form or prevent a user from adding events via calendar
         * interactions see calendar view's
         * {@link Ext.calendar.view.Base#cfg-addForm addForm} config option.
         */
        createButton: {
            xtype: 'button',
            cls: Ext.baseCSSPrefix + 'calendar-panel-create-button',
            text: 'Create'
        },

        /**
         * @cfg {String} createButtonPosition
         * The position for the create button. Can be "sideBar" or "titleBar".
         */
        createButtonPosition: 'sideBar',

        /**
         * @cfg {Object} dateTitle
         * The config for the date title.
         *
         * **Note:** The date title template is configurable within the
         * {@link #cfg-views} config option for each view
         */
        dateTitle: {
            xtype: 'component',
            reference: 'calTitle',
            cls: Ext.baseCSSPrefix + 'calendar-panel-title',
            margin: '0 0 0 10'
        },

        /**
         * @cfg {Object} nextButton
         * The configuration for the next navigation button.
         */
        nextButton: {
            xtype: 'button',
            text: '>'
        },

        /**
         * @cfg {Object} previousButton
         * The configuration for the previous navigation button.
         */
        previousButton: {
            xtype: 'button',
            text: '<'
        },

        /**
         * @cfg {Object} sideBar
         * The configuration for the sidebar. Extra items can be added/inserted into
         * the sidebar by adding the items configuration. Items will be sorted by a `weight`
         * property. Existing items in the sidebar have weights `0-100` with an increment of 10
         * for each item. Use a number less than 0 to insert at the front. Use a number larger than 100
         * to insert at the end.
         */
        sideBar: {
            xtype: 'panel',
            cls: Ext.baseCSSPrefix + 'calendar-sidebar'
        },

        /**
         * @cfg {Object/Ext.calendar.store.Calendars} store
         * @inheritdoc Ext.calendar.view.Multi#cfg-store
         */
        store: null,

        /**
         * @cfg {Object} switcher
         * The switcher is a Segmented Button used to switch the calendar views within
         * the Calendar Panel.  The buttons items themselves are added when the Calendar
         * Panel is created using the configured {@link #cfg-views views}.  The views'
         * keys (names) and weight determine the appearance of tbe switcher buttons.
         * 
         * For example, using the following views config:
         * 
         *     day: {
         *         xtype: 'calendar-day',
         *         titleTpl: '{start:date("l F d, Y")}',
         *         controlStoreRange: false,
         *         label: 'Day',
         *         weight: 10,
         *         dayHeader: null
         *     },
         *     week: {
         *         xtype: 'calendar-week',
         *         dayHeaderFormat: 'D d',
         *         controlStoreRange: false,
         *         titleTpl: '{start:date("j M")} - {end:date("j M Y")}',
         *         label: 'Week',
         *         weight: 20
         *     },
         *     month: {
         *         xtype: 'calendar-month',
         *         titleTpl: '{start:date("F Y")}',
         *         label: 'Month',
         *         weight: 30
         *     }
         * 
         * The following buttons would be created in the following order:
         * Day > Week > Month
         */
        switcher: {
            xtype: 'segmentedbutton',
            reference: 'switcher',
            cls: Ext.baseCSSPrefix + 'calendar-panel-switcher',
            allowMultiple: false
        },

        /**
         * @cfg {String} switcherPosition
         * The position for the create button. Can be `sideBar` or `titleBar`.
         */
        switcherPosition: 'titleBar',

        /**
         * @cfg {Number} timezoneOffset
         * @inheritdoc Ext.calendar.view.Multi#cfg-timezoneOffset
         */
        timezoneOffset: undefined,

        /**
         * @cfg {Object} titleBar
         * The configuration for the titleBar. Extra items can be added/inserted into
         * the title bar by adding the items configuration. Items will be sorted by a
         * `weight` property. Existing items in the title bar have weights `0-100` with
         * an increment of 10 for each item. Use a number less than 0 to insert at the
         * front. Use a number larger than 100 to insert at the end.
         */
        titleBar: {
            xtype: 'toolbar'
        },

        /**
         * @cfg {Object} todayButton
         * The configuration for the today button.
         */
        todayButton: {
            xtype: 'button',
            text: 'Today',
            margin: '0 10 0 0'
        },

        /**
         * @cfg {Date} value
         * @inheritdoc Ext.calendar.view.Multi#cfg-value
         */
        value: undefined,

        /**
         * @cfg {Object} views
         * The calendar views to have available.  Each item in this configuration
         * (labelled by a key) is to contain the configuration for the view, a class that
         * extends {@link Ext.calendar.panel.Base}. There are also other configurations
         * available only when used in conjunction with this panel:
         *
         * - `label` - A label to display on the switcher control
         * - `weight` - A number to indicate the order in which items are
         * displayed in the switcher.  Lower numbers are displayed first.
         * - `titleTpl` - A template string for displaying the current date title.  The
         * values passed are the start and end dates.
         *
         * The default configuration:
         *
         *     views: {
         *         day: {
         *             xtype: 'calendar-day',
         *             titleTpl: '{start:date("l F d, Y")}',
         *             controlStoreRange: false,
         *             label: 'Day',
         *             weight: 10,
         *             dayHeader: null
         *         },
         *         week: {
         *             xtype: 'calendar-week',
         *             dayHeaderFormat: 'D d',
         *             controlStoreRange: false,
         *             titleTpl: '{start:date("j M")} - {end:date("j M Y")}',
         *             label: 'Week',
         *             weight: 20
         *         },
         *         month: {
         *             xtype: 'calendar-month',
         *             titleTpl: '{start:date("F Y")}',
         *             label: 'Month',
         *             weight: 30
         *         }
         *     }
         *
         * Any view configuration options passed will override the default configuration.
         * For example, to change the week view to show 5 days with the week beginning on
         * Monday:
         *
         *     views: {
         *         week: {
         *             visibleDays: 5,
         *             firstDayOfWeek: 1,
         *             label: 'Work Week'
         *         }
         *     }
         *
         * With the above config the default day and month views will be rendered along
         * with a modified week view with the text of "Work Week" in the view switcher
         * control.
         *
         * To prevent a default view from being displayed set the view config to `null`.
         * For example, to hide the Month view:
         *
         *     views: {
         *         month: null
         *     }
         *
         * Any calendar views configured with keys other than "day", "week", and "month"
         * will be included in addition to the default views.  For example, to show the
         * modified work week view we configured above in addition to the default Day,
         * Week, and Month views we would pass in the same config with a key of
         * "workweek" (the can be anything you choose) along with a weight indicating the
         * placement of the "Work Week" button in the switcher.
         *
         *     views: {
         *         workweek: {
         *             visibleDays: 5,
         *             firstDayOfWeek: 1,
         *             label: 'Work Week',
         *             weight: 25
         *         }
         *     }
         *
         * Using the above config the Calendar would now have 4 views available and would
         * display "Work Week" in the switcher control after "Week" and before "Month".
         *
         * The configuration key will be the string used when specifying the
         * {@link #cfg-defaultView} as well as that passed to the {@link #method-setView}
         * method.  For example, using the last views config example the "worweek" would
         * be shown using:
         *
         *     CalendarInstance.setView('workweek');
         * @locale
         */
        views: {
            day: {
                xtype: 'calendar-day',
                titleTpl: '{start:date("l F d, Y")}',
                controlStoreRange: false,
                label: 'Day',
                weight: 10,
                dayHeader: null
            },
            week: {
                xtype: 'calendar-week',
                dayHeaderFormat: 'D d',
                controlStoreRange: false,
                titleTpl: '{start:date("j M")} - {end:date("j M Y")}',
                label: 'Week',
                weight: 20
            },
            month: {
                xtype: 'calendar-month',
                titleTpl: '{start:date("F Y")}',
                label: 'Month',
                weight: 30
            }
        }
    },

    /**
     * @inheritdoc Ext.calendar.view.Multi#cfg-defaultView
     */
    defaultView: 'month',

    cls: Ext.baseCSSPrefix + 'calendar-panel',

    /**
     * @method getCalendarList
     * @hide
     */

    /**
     * @method setCalendarList
     * @hide
     */

    /**
     * @method getCreateButton
     * @hide
     */

    /**
     * @method setCreateButton
     * @hide
     */

    /**
     * @method getNextButton
     * @hide
     */

    /**
     * @method setNextButton
     * @hide
     */

    /**
     * @method getPreviousButton
     * @hide
     */

    /**
     * @method setPreviousButton
     * @hide
     */

    /**
     * @method getSideBar
     * @hide
     */

    /**
     * @method setSideBar
     * @hide
     */

    /**
     * @method getSwitcher
     * @hide
     */

    /**
     * @method setSwitcher
     * @hide
     */

    /**
     * @method getTitleBar
     * @hide
     */

    /**
     * @method setTitleBar
     * @hide
     */

    /**
     * @method getTodayButton
     * @hide
     */

    /**
     * @method setTodayButton
     * @hide
     */

    /**
     * @method setViews
     * @hide
     */

    /**
     * Moves the active view forward. The amount moved
     * depends on the current view.
     */
    moveNext: function() {
        this.getView().moveNext();
    },

    /**
     * Moves the active view backward. The amount moved
     * depends on the current view.
     */
    movePrevious: function() {
        this.getView().movePrevious();
    },

    /**
     * Move the current view by an amount based of the current {@link #value}.
     * @param {Number} amount The number of intervals to move.
     * @param {String} [interval=Ext.Date.DAY] The interval to navigate by. See {@link Ext.Date}
     * for valid intervals.
     */
    navigate: function(amount, interval) {
        this.getView().navigate(amount, interval);
    },

    /**
     * @inheritdoc Ext.calendar.view.Multi#method-setView
     */
    setView: function(view) {
        this.doSetView(view);
    },

    // Appliers/Updaters
    updateCompact: function(compact, oldCompact) {
        var me = this;

        me.toggleCls(Ext.baseCSSPrefix + 'compact', compact);

        me.toggleConfigState(compact);
        me.callParent([compact, oldCompact]);
        me.setViewCfg('setCompact', compact);
    },

    updateCompactOptions: function() {
        if (!this.isConfiguring && this.getCompact()) {
            this.toggleConfigState(true);
        }
    },

    applyStore: function(store) {
        if (store) {
            store = Ext.StoreManager.lookup(store, 'calendar-calendars');
        }
        return store;
    },

    updateStore: function(store) {
        var list = this.lookup('list');
        this.setViewCfg('setStore', store);
        if (list) {
            list.setStore(store);
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
        this.setViewCfg('setValue', value);
        this.refreshCalTitle();
    },

    getValue: function() {
        var view = this.getView();
        return view ? view.getValue() : this.callParent();
    },

    /**
     * @protected
     * Returns the {@link Ext.calendar.view.Multi} container used to house the configured
     * calendar {@link #cfg-views}
     * @return {Ext.calendar.view.Multi} The multi calendar view container
     */
    getView: function() {
        return this.lookup('view');
    },

    privates: {
        weightStart: 0,
        weightIncrement: 10,

        createCalendarList: function(cfg) {
            return Ext.apply({
                store: this.getStore()
            }, this.getCalendarList());
        },

        createCreateButton: function(cfg) {
            cfg = cfg || {};
            cfg = Ext.apply(cfg, this.getCreateButton());
            return Ext.apply({
                handler: 'onCreateTap',
                scope: this
            }, cfg);
        },

        createContainerWithChildren: function(defaults, cfg, items) {
            cfg = Ext.apply({}, cfg);

            var me = this,
                cfgItems = cfg.items,
                weight = me.weightStart,
                incr = me.weightIncrement,
                len, i, item;

            if (cfgItems) {
                if (!Ext.isArray(cfgItems)) {
                    cfgItems = [cfgItems];
                }

                items = Ext.Array.clone(items);

                for (i = 0, len = items.length; i < len; ++i) {
                    item = items[i];
                    if (item.weight == null) {
                        items[i] = Ext.apply({
                            weight: weight
                        }, item);
                    }
                    weight += incr;
                }

                items = items.concat(cfgItems);
                Ext.Array.sort(items, me.weightSorter);
                delete cfg.items;
            }
            cfg.items = items;

            return Ext.apply(cfg, defaults);
        },

        createDateTitle: function(cfg) {
            cfg = cfg || {};
            return Ext.apply(cfg, this.getDateTitle());
        },

        createNextButton: function() {
            return Ext.apply({
                handler: 'onNextTap',
                scope: this
            }, this.getNextButton());
        },

        createPreviousButton: function() {
            return Ext.apply({
                handler: 'onPrevTap',
                scope: this
            }, this.getPreviousButton());
        },

        createSwitcher: function(cfg) {
            var me = this,
                view = me.getView();

            cfg = Ext.apply({
                value: (view && view.getActiveKey()) || me.defaultView,
                listeners: {
                    scope: me,
                    change: 'onSwitcherChange'
                },
                items: me.getSwitcherItems()
            }, cfg);

            return Ext.apply(cfg, me.getSwitcher());
        },

        createTodayButton: function() {
            return Ext.apply({
                handler: 'onTodayTap',
                scope: this
            }, this.getTodayButton());
        },

        createView: function() {
            var me = this;
            return {
                xtype: 'calendar-multiview',
                reference: 'view',
                compact: me.getCompact(),
                defaultView: me.defaultView,
                store: me.getStore(),
                timezoneOffset: me.autoOffset ? undefined : me.getTimezoneOffset(),
                value: me.getValue(),
                views: me.getViews(),
                listeners: {
                    scope: me,
                    valuechange: 'onValueChange'
                }
            };
        },

        doSetView: function(view, fromSwitcher) {
            if (!fromSwitcher) {
                this.setSwitcherValue(view);
                return;
            }
            this.getView().setView(view);
            this.refreshCalTitle();
        },

        getSwitcherItems: function() {
            var views = this.getViews(),
                items = [],
                key, o;

            for (key in views) {
                o = views[key];
                if (o) {
                    items.push({
                        text: o.label,
                        value: key,
                        weight: o.weight
                    });
                }
            }

            items.sort(this.weightSorter);
            return items;
        },

        onCreateTap: function() {
            this.getView().showAddForm();
        },

        onNextTap: function() {
            this.moveNext();
        },

        onPrevTap: function() {
            this.movePrevious();
        },

        onValueChange: function(view, context) {
            this.setValue(context.value);
        },

        onTodayTap: function() {
            this.setValue(new Date());
        },

        refreshCalTitle: function() {
            var me = this,
                view = me.getView(),
                calTitle = me.lookup('calTitle'),
                tpl;

            if (view && calTitle) {
                view = view.activeView;
                tpl = view.lookupTpl('titleTpl');
                if (tpl) {
                    calTitle.setHtml(tpl.apply(view.getDisplayRange()));
                }
            }
        },

        setViewCfg: function(setterName, value) {
            if (!this.isConfiguring) {
                var view = this.getView();
                if (view) {
                    view[setterName](value);
                }
            }
        },

        weightSorter: function(a, b) {
            return a.weight - b.weight;
        }
    }
});
