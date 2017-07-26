/**
 * @abstract
 * This is a base class for calendar views.  Calendar views display events for a date /
 * time range specified by the view subclasses:
 *
 * - {@link Ext.calendar.view.Day Day}
 * - {@link Ext.calendar.view.Days Days}
 * - {@link Ext.calendar.view.Week Week}
 * - {@link Ext.calendar.view.Weeks Weeks}
 * - {@link Ext.calendar.view.Month Month}
 * - {@link Ext.calendar.view.Multi Multi}
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
 *         xtype: 'calendar-dayview',
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
Ext.define('Ext.calendar.view.Base', {
    extend: 'Ext.Gadget',

    requires: [
        'Ext.calendar.store.Calendars',
        'Ext.calendar.theme.Theme',
        'Ext.calendar.Event',
        'Ext.Promise',
        'Ext.calendar.date.Range',
        'Ext.calendar.date.Util'
    ],

    mixins: ['Ext.mixin.ConfigState'],
    alternateStateConfig: 'compactOptions',

    config: {
        /**
         * @cfg {Object} addForm
         * The configuration for the {@link Ext.calendar.form.Add add form} to be used
         * when an event is to be created.  Use `null` to disable creation.
         */
        addForm: {
            xtype: 'calendar-form-add'
        },

        /**
         * @cfg {Boolean} compact
         * `true` to display this view in compact mode, typically used
         * for smaller form factors.  Setting to `true` applies any configured
         * {@link #cfg-compactOptions}.
         */
        compact: false,

        /**
         * @cfg {Object} compactOptions
         * A series of config options for this class to set when this class is in
         * {@link #cfg-compact} mode.
         */
        compactOptions: null,

        /**
         * @cfg {Boolean} controlStoreRange
         * `true` to allow this view to set the date range on event stores
         * in reaction to the value changing. The need to disable this surfaces
         * when using multiple views together and allowing one view (the one with
         * the largest range) to be the in control of loading the stores.
         * @private
         */
        controlStoreRange: true,
        
        /**
         * @cfg {Object} editForm
         * The configuration for the {@link Ext.calendar.form.Edit edit form} to be used
         * when an event is to be modified. Use `null` to disable editing.
         */
        editForm: {
            xtype: 'calendar-form-edit'
        },

        /**
         * @cfg {Object} eventDefaults
         * The default configuration for {@link Ext.calendar.Event event} widgets
         * @accessor
         */
        eventDefaults: {
            xtype: 'calendar-event'
        },

        /**
         * @cfg {Boolean} gestureNavigation
         * Allow the view to have the value (displayed date range) changed via swipe
         * navigation on devices that support it
         */
        gestureNavigation: true,

        /**
         * @cfg {Ext.calendar.header.Base} header
         * A {@link Ext.calendar.header.Base header} object to link to this view
         * 
         * @private
         */
        header: null,

        /**
         * @cfg {Object/Ext.calendar.store.Calendars} store
         * A {@link Ext.calendar.store.Calendars calendar store} instance or
         * configuration
         */
        store: null,

        /**
         * @cfg {Number} timezoneOffset
         * The timezone offset to display this calendar in. The value should be
         * specified in the same way as the native Date offset. That is, the number
         * of minutes between UTC and local time. For example the offset for UTC+10
         * would be -600 (10 hours * 60 minutes ahead).
         *
         * Defaults to the current browser offset.
         */
        timezoneOffset: undefined,

        /**
         * @cfg {Date} value
         * The value for the current view.
         *
         *     value: new Date('10-02-2016') // to set the date to Oct 2nd 2016
         */
        value: undefined
    },

    platformConfig: {
        '!desktop':  {
            compact: true
        }
    },

    twoWayBindable: {
        value: 1
    },

    /**
     * @event beforeeventadd
     * Fired before an event {@link #addForm} is shown.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The new event to be added.
     *
     * Return `false` to cancel the form being shown.
     */
    
    /**
     * @event beforeeventedit
     * Fired before an event {@link #editForm} is shown.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event to be edited.
     *
     * Return `false` to cancel the form being shown.
     */
    
    /**
     * @event eventadd
     * Fired when an event has been added via the {@link #addForm}.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The newly added event with data.
     * @param {Object} context.data The data provided by the form.
     */
    
    /**
     * @event eventedit
     * Fired when an event has been edited via the {@link #editForm}.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The edited event with data.
     * @param {Object} context.data The data provided by the form.
     */
    
    /**
     * @event eventdrop
     * Fired when an event has been deleted via the {@link #editForm}.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The removed event.
     */

    /**
     * @event eventtap
     * Fired when an event is tapped.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event model.
     */
    
    /**
     * @event validateeventadd
     * Fired after the {@link #addForm} has been completed, but before the event
     * is added. Allows the add to be validated.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The new event to be added, the
     * data is not yet set on the event.
     * @param {Object} context.data The data provided by the form. This will be used to set the 
     * event data using {@link Ext.calendar.model.EventBase#setData}.
     * @param {Ext.Promise} context.validate A promise that allows validation to occur.
     * The default behavior is for no validation to take place. To achieve asynchronous
     * validation, the promise on the context object must be replaced:
     *
     *     {
     *         listeners: {
     *             validateeventadd: function(view, context) {
     *                 context.validate = context.then(function() {
     *                     return Ext.Ajax.request({
     *                         url: '/checkAdd'
     *                     }).then(function(response) {
     *                         return Promise.resolve(response.responseText === 'ok');
     *                     });
     *                 });
     *             }
     *         }
     *     }
     */
    
    /**
     * @event validateeventedit
     * Fired after the {@link #editForm} has been completed, but before the event
     * is saved. Allows the edit to be validated.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event to be edited, the data
     * is not yet set on the event.
     * @param {Object} context.data The data provided by the form. This will be used to set the 
     * event data using {@link Ext.calendar.model.EventBase#setData}.
     * @param {Ext.Promise} context.validate A promise that allows validation to occur.
     * The default behavior is for no validation to take place. To achieve asynchronous
     * validation, the promise on the context object must be replaced:
     *
     *     {
     *         listeners: {
     *             validateeventedit: function(view, context) {
     *                 context.validate = context.then(function() {
     *                     return Ext.Ajax.request({
     *                         url: '/checkEdit'
     *                     }).then(function(response) {
     *                         return Promise.resolve(response.responseText === 'ok');
     *                     });
     *                 });
     *             }
     *         }
     *     }
     */
    
    /**
     * @event validateeventdrop
     * Fired when the delete button has been tapped on the {@link #editForm}, but before the event
     * is removed. Allows the removal to be validated.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event to be removed.
     * @param {Ext.Promise} context.validate A promise that allows validation to occur.
     * The default behavior is for no validation to take place. To achieve asynchronous
     * validation, the promise on the context object must be replaced:
     *
     *     {
     *         listeners: {
     *             validateeventdrop: function(view, context) {
     *                 context.validate = context.then(function() {
     *                     return new Promise(function(resolve, reject) {
     *                         Ext.Msg.confirm('Delete', 'Really delete this event?', function(btn) {
     *                             return Promise.resolve(btn === 'yes');
     *                         });
     *                     });
     *                 });
     *             }
     *         }
     *     }
     */
    
    /**
     * @event valuechange
     * Fired when the {@link #cfg!value} changes.
     * @param {Ext.calendar.view.Base} this This view.
     * @param {Object} context The context.
     * @param {Date} context.value The new value.
     */

    constructor: function(config) {
        this.eventMap = {};
        this.eventPool = {};
        this.callParent([config]);
    },

    /**
     * @method getDisplayRange
     * Get the display range for this view.
     * @return {Ext.calendar.date.Range} The display range.
     */
    
    /**
     * Get the active {@link #editForm} or {@link #addForm} if it exists.
     * @return {Ext.calendar.form.Base} The active form. `null` if not active.
     */
    getForm: function() {
        return this.form || null;
    },

    /**
     * @method getVisibleRange
     * Get the visible range for this view.
     * @return {Ext.calendar.date.Range} The visible range.
     */
    

    // Public methods
    /**
     * Move the view forward to view the "next" portion of the view based
     * on the current {@link #cfg!value}.
     * This amount depends on the current view.
     */
    moveNext: function() {
        this.setValue(this.calculateMoveNext());
    },

    /**
     * Move the view forward to view the "next" portion of the view based
     * on the current {@link #cfg!value}.
     * This amount depends on the current view.
     */
    movePrevious: function() {
        this.setValue(this.calculateMovePrevious());
    },

    /**
     * Move the current view by an amount based off of the current {@link #cfg!value}.
     * @param {Number} amount The number of intervals to move
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
     * Show the {@link #addForm} for this calendar. Has no behavior if
     * {@link #addForm} is `null`.
     * @param {Ext.calendar.model.EventBase} [event] A new event record containing
     * any data to be passed to the form. If not specified, default dates from
     * this view will be chosen.
     * @param {Object} [options] Callback options for form creation.
     * @param {Function} [options.onSave] A save callback function.
     * @param {Function} [options.onCancel] A cancel callback function.
     * @param {Object} [options.scope] A scope for the callback functions.
     */
    showAddForm: function(event, options) {
        var me = this,
            D = Ext.Date,
            range;

        if (me.getAddForm()) {
            if (!event) {
                range = me.getDefaultCreateRange();
                event = me.createModel({
                    startDate: range.start,
                    endDate: D.add(range.end, D.DAY, 1, true),
                    allDay: true
                });
            }
            me.doShowForm(event, 'add', me.createAddForm(), 'onFormCreateSave', options);
        }
    },

    /**
     * Show the {@link #cfg-editForm} for this calendar. Has no behavior if
     * {@link #editForm} is `null`.
     * @param {Ext.calendar.model.EventBase} event The event to be passed to the form.
     * @param {Object} [options] Callback options for form creation.
     * @param {Function} [options.onSave] A save callback function.
     * @param {Function} [options.onCancel] A cancel callback function.
     * @param {Object} [options.scope] A scope for the callback functions.
     */
    showEditForm: function(event, options) {
        if (this.getEditForm()) {
            this.doShowForm(event, 'edit', this.createEditForm(), 'onFormEditSave', options);
        }
    },

    // protected methods

    /**
     * Create the {@link #addForm add form} configuration. Can be hooked to provide
     * any runtime customization.
     * @return {Object} A configuration for the form instance.
     * 
     * @protected
     */
    createAddForm: function() {
        return Ext.merge({
            view: this
        }, this.getAddForm());
    },

    /**
     * Create the {@link #editForm edit form} configuration. Can be hooked to provide
     * any runtime customization.
     * @return {Object} A configuration for the form instance.
     * 
     * @protected
     */
    createEditForm: function(event) {
        return Ext.merge({
            view: this
        }, this.getEditForm());
    },

    /**
     * Get the {@link Ext.calendar.store.EventSource event source} for this view.
     * @return {Ext.calendar.store.EventSource} The event source.
     */
    getEventSource: function() {
        return this.eventSource;
    },

    // Appliers/updaters
    updateCompact: function(compact) {
        var me = this,
            baseCls = me.baseCls,
            header = me.getHeader();

        me.toggleCls(Ext.baseCSSPrefix + 'calendar-compact', compact);
        me.toggleCls(baseCls + '-compact', compact);
        me.toggleCls(Ext.baseCSSPrefix + 'calendar-large', !compact);
        me.toggleCls(baseCls + '-large', !compact);
        if (header) {
            header.setCompact(compact);
        }
        me.toggleConfigState(compact);
    },

    updateCompactOptions: function() {
        if (!this.isConfiguring && this.getCompact()) {
            this.toggleConfigState(true);
        }
    },

    updateGestureNavigation: function(gestureNavigation) {
        var method;

        if (Ext.supports.Touch) {
            method = gestureNavigation ? 'on' : 'un';
            this.getBodyElement()[method]('swipe', 'onBodySwipe', this);
        }
    },

    updateHeader: function(header, oldHeader) {
        if (oldHeader) {
            oldHeader.destroy();
        }
        
        if (header) {
            header.setCompact(this.getCompact());
            this.refreshHeaders();
        }
    },

    applyStore: function(store) {
        if (store) {
            store = Ext.StoreManager.lookup(store, 'calendar-calendars');
        }
        return store;
    },

    updateStore: function(store, oldStore) {
        var me = this;

        me.eventSource = null;

        if (oldStore) {
            if (oldStore.getAutoDestroy()) {
                oldStore.destroy();
            } else {
                oldStore.getEventSource().un(me.getSourceListeners());
                oldStore.un(me.getStoreListeners());
            }
        }

        if (store) {
            store.on(me.getStoreListeners());
            me.eventSource = store.getEventSource();
            me.eventSource.on(me.getSourceListeners());
            if (!me.isConfiguring) {
                me.onSourceAttach();
                me.refreshEvents();
            }
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

    applyValue: function(value, oldValue) {
        value = Ext.Date.clearTime(value || Ext.calendar.date.Util.getLocalNow(), true);

        if (oldValue && oldValue.getTime() === value.getTime()) {
            value = undefined;
        }
        return value;
    },

    updateValue: function(value) {
        if (!this.isConfiguring) {
            this.fireEvent('valuechange', this, {
                value: value
            });
        }
    },

    // Overrides
    doDestroy: function() {
        var me = this;

        me.clearEvents();
        me.form = Ext.destroy(me.form);
        me.setHeader(null);
        me.setStore(null);
        me.callParent();
    },

    privates: {
        $eventCls: Ext.baseCSSPrefix + 'calendar-event',
        $eventInnerCls: Ext.baseCSSPrefix + 'calendar-event-inner',
        $eventColorCls: Ext.baseCSSPrefix + 'calendar-event-marker-color',
        $staticEventCls: Ext.baseCSSPrefix + 'calendar-event-static',
        $tableCls: Ext.baseCSSPrefix + 'calendar-table',

        eventRefreshSuspend: 0,
        refreshCounter: 0,

        forwardDirection: 'left',
        backwardDirection: 'right',

        /**
         * @property {Object} dateInfo
         * Contains information about the current date ranges.
         * 
         * @private
         */
        dateInfo: null,

        calculateMove: function(offset) {
            var interval = this.getMoveInterval(),
                val = this.getMoveBaseValue();

            return Ext.Date.add(val, interval.unit, offset * interval.amount, true);
        },

        /**
         * Calculate the value to use for {@link #moveNext}
         * @return {Date} The new value.
         *
         * @private
         */
        calculateMoveNext: function() {
            return this.calculateMove(1);
        },

        /**
         * Calculate the value to use for {@link #movePrevious}
         * @return {Date} The new value.
         *
         * @private
         */
        calculateMovePrevious: function() {
            return this.calculateMove(-1);
        },

        /**
         * Clear events from the view.
         *
         * @private
         */
        clearEvents: function() {
            var map = this.eventMap,
                key;

            for (key in map) {
                map[key].destroy();
            }
            this.eventMap = {};
        },

        /**
         * Create an event widget.
         * @param {Ext.calendar.model.EventBase} event The event record.
         * @param {Object} [cfg] A config for the event.
         * @param {Boolean} [dummy=false] `true` if this is a dummy event not backed by a record.
         * @return {Ext.calendar.EventBase} The event widget.
         *
         * @private
         */
        createEvent: function(event, cfg, dummy) {
            var me = this,
                defaults = Ext.apply({}, me.getEventDefaults()),
                widget, d;

            if (dummy) {
                d = me.getUtcNow();
                cfg.startDate = d;
                cfg.endDate = d;
            } else {
                cfg.palette = me.getEventPalette(event);
            }
                
            cfg = cfg || {};
            cfg.model = event;
            cfg.view = me;

            widget = Ext.widget(Ext.apply(cfg, defaults));

            if (!dummy) {
                me.eventMap[widget.id] = widget;
            }

            return widget;
        },

        /**
         * Create a number of event widgets.
         * @param {Ext.calendar.model.EventBase[]} events The events.
         * @param {Object} [cfg] A config for each event.
         * @return {Ext.calendar.EventBase[]} The event widgets.
         *
         * @private
         */
        createEvents: function(events, cfg) {
            var len = events.length,
                ret = [],
                i;

            for (i = 0; i < len; ++i) {
                ret.push(this.createEvent(events[i], Ext.apply({}, cfg)));
            }
            return ret;
        },

        createModel: function(data) {
            return this.getEventSource().createEvent(data);
        },

        /**
         * @method
         * Execute a full refresh of the view and events.
         *
         *
         * @private
         */
        doRefresh: Ext.privateFn,

        /**
         * @method
         * Execute a full refresh of events.
         *
         * @private
         */
        doRefreshEvents: Ext.privateFn,

        /**
         * Show a form for this calendar.
         * @param {Ext.calendar.model.EventBase} event The event.
         * @param type
         * @param {Object} cfg The config for the form.
         * @param {Function} successFn A function to call if the edit is successful.
         * @param {Object} [options] Callback options for form creation.
         * @param {Function} [options.onSave] A save callback function.
         * @param {Function} [options.onCancel] A cancel callback function.
         * @param {Object} [options.scope] A scope for the callback functions.
         *
         * @private
         */
        doShowForm: function(event, type, cfg, successFn, options) {
            var me = this,
                c;

            if (!me.getStore() || !event.isEditable()) {
                return;
            }

            if (me.fireEvent('beforeevent' + type, me, {event: event}) === false) {
                return;
            }

            options = options || {};

            me.form = c = Ext.create(Ext.apply({
                event: event
            }, cfg));

            c.on({
                save: function(form, context) {
                    var data = context.data,
                        o = {
                            event: event,
                            data: data,
                            validate: Ext.Promise.resolve(true)
                        };

                    me.fireEvent('validateevent' + type, me, o);
                    o.validate.then(function(v) {
                        if (v !== false) {
                            if (options.onSave) {
                                options.onSave.call(options.scope || me, me, event, data);
                            }
                            me[successFn](form, event, data);
                            me.fireEvent('event' + type, me, {
                                event: event,
                                data: data
                            });
                        } else {
                            me.onFormCancel(form);
                        }
                    });
                },
                cancel: function(form, context) {
                    if (options.onCancel) {
                        options.onCancel.call(options.scope || me, me, event);
                    }
                    me.onFormCancel(form);
                    me.fireEvent('event' + type + 'cancel', me, {
                        event: event
                    });
                },
                close: function(form) {
                   if (options.onCancel) {
                        options.onCancel.call(options.scope || me, me, event);
                    }
                    me.onFormCancel(form); 
                },
                drop: function(form) {
                    var o = {
                        event: event,
                        validate: Ext.Promise.resolve(true)
                    };
                    me.fireEvent('validateeventdrop', me, o);
                    o.validate.then(function(v) {
                        if (v !== false) {
                            if (options.onDrop) {
                                options.onDrop.call(options.scope || me, me, event);
                            }
                            me.onFormDrop(form, event);
                            me.fireEvent('eventdrop', me, {
                                event: event
                            });
                        } else {
                            me.onFormCancel(form);
                        }
                    });
                }
            });
            c.show();
        },

        /**
         * Get the body element of this view.
         * @return {Ext.dom.Element} The body.
         *
         * @private
         */
        getBodyElement: function() {
            return this.element;
        },

        /**
         * Get a calendar by id.
         * @param {Object} id The id of the calendar.
         * @return {Ext.calendar.model.CalendarBase} The calendar
         *
         * @private
         */
        getCalendar: function(id) {
            return this.getStore().getById(id);
        },

        /**
         * Get the number of days covered for a range. For example,
         * 2010-01-01 22:00, 2010-01-02 01:00 is 2 days because it has boundaries
         * within 2 days.
         * @param {Date} start The start of the range.
         * @param {Date} end The end of the range.
         * @param {Boolean} allDay `true` if the time range should be considered as an all
         * day event.
         * @return {Number} The number of days spanned.
         *
         * @private
         */
        getDaysSpanned: function(start, end, allDay)  {
            var D = Ext.Date,
                ret;

            if (allDay) {
                ret = D.diff(start, end, D.DAY);
            } else {
                start = this.utcToLocal(start);
                end = this.utcToLocal(end);
                ret = Ext.calendar.model.Event.getDaysSpanned(start, end);
            }
            return ret;
        },

        /**
         * The the default range when creating a event.
         * @return {Ext.calendar.date.Range} The range.
         *
         * @private
         */
        getDefaultCreateRange: function() {
            var me = this,
                now = Ext.calendar.date.Util.getLocalNow(),
                displayRange = me.getDisplayRange(),
                d;

            now = me.toUtcOffset(Ext.Date.clearTime(now, true));
            if (displayRange.contains(now)) {
                d = Ext.Date.localToUtc(now);
            } else {
                d = me.toUtcOffset(displayRange.start);
            }
            return new Ext.calendar.date.Range(d, d);
        },

        /**
         * Get the default color palette for this view. Defaults to the
         * color of the first calendar, otherwise the first color in the palette.
         * @return {Ext.calendar.theme.Palette} The color palette.
         *
         * @private
         */
        getDefaultPalette: function() {
            var store = this.getStore(),
                Theme = Ext.calendar.theme.Theme,
                rec, color;

            if (store) {
                rec = store.first();
                if (rec) {
                    color = rec.getBaseColor();
                }
            }

            return Theme.getPalette(color || Theme.colors[0]);
        },

        /**
         * Get all calendars that are {@link Ext.calendar.model.CalendarBase#isEditable editable}.
         * @return {Ext.calendar.model.CalendarBase[]} The editable calendars.
         *
         * @private
         */
        getEditableCalendars: function() {
            var store = this.getStore(),
                ret;

            if (store) {
                ret = Ext.Array.filter(store.getRange(), function(cal) {
                    return cal.isEditable();
                });
            }

            return ret || [];
        },

        /**
         * Get an event record via element/DOM event.
         * @param {Ext.dom.Element/HTMLElement/Ext.event.Event} el The element target,
         * @return {Ext.calendar.model.EventBase} The event record.
         *
         * @private
         */
        getEvent: function(el) {
            var cls = this.$eventCls,
                id;

            if (el.isEvent) {
                el = el.target;
            }

            if (!Ext.fly(el).hasCls(cls)) {
                el = Ext.fly(el).up('.' + cls, this.element, true);
            }
            id = el.getAttribute('data-eventId');
            return this.getEventSource().getById(id);
        },

        /**
         * See {@link #getDaysSpanned}.
         * @param {Ext.calendar.model.EventBase} event The event.
         * @return {Number} The number of days spanned.
         *
         * @private
         */
        getEventDaysSpanned: function(event)  {
            return this.getDaysSpanned(event.getStartDate(), event.getEndDate(), event.getAllDay());
        },

        /**
         * Get the palette for an event record.
         * @param {Ext.calendar.model.EventBase} event The event record.
         * @return {Ext.calendar.theme.Palette} The palette.
         *
         * @private
         */
        getEventPalette: function(event) {
            var color = event.getColor() || event.getCalendar().getBaseColor();
            return Ext.calendar.theme.Theme.getPalette(color);
        },

        /**
         * Get the value to use as the base for moving when using
         * {@link #moveNext} and {@link #movePrevious}.
         * @return {Date} The value.
         *
         * @private
         */
        getMoveBaseValue: function() {
            return this.getValue();
        },

        /**
         * @method
         * Get the period to move when using
         * {@link #moveNext} and {@link #movePrevious}.
         * @return {Object} The period to move
         * @return {String} return.unit The units to move, see {@link Ext.Date}.
         * @return {Number} return.amount The number of units to move.
         *
         * @private
         */
        getMoveInteral: Ext.privateFn,

        /**
         * Get listeners to add to the event source.
         * @return {Object} A listeners config.
         *
         * @private
         */
        getSourceListeners: function() {
            return {
                scope: this,
                add: 'onSourceAdd',
                refresh: 'onSourceRefresh',
                remove: 'onSourceRemove',
                update: 'onSourceUpdate'
            };
        },

        /**
         * Get listeners to add to the calendar store..
         * @return {Object} A listeners config.
         *
         * @private
         */
        getStoreListeners: function() {
            return {
                scope: this,
                update: 'onStoreUpdate'
            };
        },

        /**
         * Get the current date in UTC.
         * @return {Date} The current UTC date.
         *
         * @private
         */
        getUtcNow: function() {
            return Ext.Date.utcToLocal(new Date());
        },

        /**
         * Handle drop on the view.
         * @param type
         * @param {Ext.calendar.model.EventBase} event The event.
         * @param {Ext.calendar.date.Range} newRange The new range.
         * @param {Function} [callback] A callback to execute.
         *
         * @private
         */
        handleChange: function(type, event, newRange, callback) {
            var me = this,
                o = {
                    event: event,
                    newRange: newRange.clone(),
                    validate: Ext.Promise.resolve(true)
                },
                fn = callback ? callback : Ext.emptyFn;

            me.fireEvent('validateevent' + type, me, o);

            o.validate.then(function(v) {
                if (v !== false) {
                    fn(true);
                    event.setRange(newRange);
                    me.fireEvent('event' + type, me, {
                        event: event,
                        newRange: newRange.clone()
                    });
                } else {
                    fn(false);
                }
            });
        },

        /**
         * Handle drag/resize start for an event.
         * @param {String} type The event type.
         * @param {Ext.calendar.model.EventBase} event The event.
         * @return {Boolean} `false` to veto the event.
         *
         * @private
         */
        handleChangeStart: function(type, event) {
            var ret = event.isEditable();
            if (ret) {
                ret = this.fireEvent('beforeevent' + type + 'start', this, {event: event});
            }
            return ret;
        },

        /**
         * @method
         * Handle resizing of the main view element.
         *
         * @private
         */
        handleResize: Ext.privateFn,

        /**
         * Checks if the {@link #store} has editable calendars.
         * @return {Boolean} `true` if any calendars are editable.
         *
         * @private
         */
        hasEditableCalendars: function() {
            return this.getEditableCalendars().length > 0;
        },

        /**
         * Checks if an event is hidden, by virtue of the calendar being hidden.
         * @param {Ext.calendar.model.EventBase} event The event.
         * @return {Boolean} `true` if the event should be hidden.
         *
         * @private
         */
        isEventHidden: function(event) {
            var cal = event.getCalendar();
            return cal ? cal.isHidden() : true;
        },

        /**
         * Handle a swipe on the view body.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onBodySwipe: function(e) {
            var me = this;

            if (e.direction === me.forwardDirection) {
                me.moveNext();
            } else if (e.direction === me.backwardDirection) {
                me.movePrevious();
            }
        },

        /**
         * Handle a tap on an event model.
         * @param {Ext.calendar.model.EventBase} event The event model.
         *
         * @private
         */
        onEventTap: function(event) {
            this.fireEvent('eventtap', this, {
                event: event
            });
            this.showEditForm(event);
        },

        /**
         * Handle create form being saved.
         * @param {Ext.calendar.form.Base} form The form.
         * @param event
         * @param {Object} data The data from the form.
         *
         * @private
         */
        onFormCreateSave: function(form, event, data) {
            event.setData(data);
            event.setCalendar(this.getCalendar(event.getCalendarId()));
            this.getEventSource().add(event);
            this.form = Ext.destroy(form);
        },

        /**
         * Handle edit form being saved.
         * @param {Ext.calendar.form.Base} form The form.
         * @param {Ext.calendar.model.EventBase} event The event being edited.
         * @param {Object} data The data from the form.
         *
         * @private
         */
        onFormEditSave: function(form, event, data) {
            var me = this,
                oldCalendar = event.getCalendar(),
                id;

            me.suspendEventRefresh();
            event.setData(data);
            id = event.getCalendarId();
            if (oldCalendar.id !== id) {
                event.setCalendar(me.getCalendar(id));
                me.getEventSource().move(event, oldCalendar);
            }
            
            me.resumeEventRefresh();
            me.refreshEvents();
            me.form = Ext.destroy(form);
        },

        onFormDrop: function(form, event) {
            this.getEventSource().remove(event);
            this.form = Ext.destroy(form);
        },

        /**
         * Handle the form being cancelled.
         * @param {Ext.calendar.form.Base} form The form.
         *
         * @private
         */
        onFormCancel: function(form) {
            this.form = Ext.destroy(form);
        },

        /**
         * Handle records being added to the source.
         * @param {Ext.calendar.store.EventSource} source The event source.
         * @param {Ext.calendar.model.EventBase[]} events The events.
         *
         * @private
         */
        onSourceAdd: function() {
            this.refreshEvents();
        },

        /**
         * @method
         * Handles a source being attached.
         *
         * @private
         */
        onSourceAttach: Ext.privateFn,

        /**
         * Handles a source being refreshed.
         * @param {Ext.calendar.store.EventSource} source The source.
         *
         * @private
         */
        onSourceRefresh: function() {
            this.refreshEvents();
        },

        /**
         * Handle records being removed from the source.
         * @param {Ext.calendar.store.EventSource} source The event source.
         * @param {Ext.calendar.model.EventBase[]} events The events.
         *
         * @private
         */
        onSourceRemove: function() {
            this.refreshEvents();
        },

        /**
         * Handles a record being updated in the source.
         * @param {Ext.calendar.store.EventSource} source The event source.
         * @param {Ext.calendar.model.EventBase} event The event.
         *
         * @private
         */
        onSourceUpdate: function() {
            this.refreshEvents();
        },

        /**
         * Handles an update on the calendar store.
         * @param {Ext.calendar.store.Calendars} store The store.
         * @param {Ext.calendar.model.CalendarBase} calendar The calendar.
         *
         * @private
         */
        onStoreUpdate: function() {
            this.refreshEvents();
        },

        /**
         * Do a full refresh of the view if not in the middle of configuration.
         *
         * @private
         */
        refresh: function() {
            var me = this;

            if (!me.isConfiguring) {
                ++me.refreshCounter;
                me.doRefresh();
                if (me.hasListeners.refresh) {
                    me.fireEvent('refresh', me);
                }
            }
        },

        /**
         * Do a full event refresh if not configuring and event refresh
         * is not suspended.
         *
         * @private
         */
        refreshEvents: function() {
            var me = this;

            if (!me.eventRefreshSuspend && !me.isConfiguring) {
                if (!me.refreshCounter) {
                    me.refresh();
                }
                me.doRefreshEvents();
            }
        },

        /**
         * @method
         * Refresh any attached {@link #header} object.
         *
         * @private
         */
        refreshHeaders: Ext.privateFn,

        /**
         * Resume the ability to refresh events on the view. The number of calls
         * to resume must match {@link #suspendEventRefresh}.
         *
         * @private
         */
        resumeEventRefresh: function() {
            --this.eventRefreshSuspend;
        },

        /**
         * Set the range on the event source if it exists.
         * @param {Ext.calendar.date.Range} range The range.
         *
         * @private
         */
        setSourceRange: function(range) {
            if (!this.getControlStoreRange()) {
                return;
            }

            var eventSource = this.getEventSource(),
                cached;

            if (eventSource) {
                range = Ext.calendar.date.Util.expandRange(range);

                cached = eventSource.hasRangeCached(range);
                eventSource.setRange(range);
                
                if (cached) {
                    this.refreshEvents();
                }
            }
        },

        /**
         * Suspend the ability to refresh events on the view. The number of calls
         * to suspend must match {@link #resumeEventRefresh}.
         *
         * @private
         */
        suspendEventRefresh: function() {
            ++this.eventRefreshSuspend;
        },

        /**
         * Creates a UTC date at the specified time, taking into account
         * the timezone offset. For example if the timezone offset is +01:00GMT
         * and the values are 2010-01-05:00:00, then the resulting value would be
         * 2010-01-04:23:00.
         * 
         * @param {Date} date The date
         * @return {Date} The offset date
         */
        toUtcOffset: function(date)  {
            var D = Ext.Date,
                d = D.localToUtc(date),
                autoOffset = this.autoOffset,
                tzOffset = autoOffset ? d.getTimezoneOffset() : this.getTimezoneOffset(),
                dOffset;

            if (autoOffset) {
                dOffset = date.getTimezoneOffset();
                if (dOffset !== tzOffset) {
                    tzOffset += dOffset - tzOffset;
                }
            }

            return D.add(d, D.MINUTE, tzOffset, true);
        },

        /**
         * Get a UTC date as a local date, taking into account the {@link #timezoneOffset}.
         * For example, if the current date is:
         * `Thu May 05 2016 10:00:00 GMT+1000` and the timezoneOffset is `-60`, then the value will
         * be `Thu May 05 2016 01:00:00 GMT+1000`.
         * @param {Date} d The date
         * @return {Date} The offset
         */
        utcToLocal: function(d)  {
            var D = Ext.Date,
                viewOffset = this.getTimezoneOffset(),
                localOffset = d.getTimezoneOffset(),
                ret;

            if (this.autoOffset) {
                ret = D.clone(d);
            } else {
                ret = D.subtract(d, D.MINUTE, viewOffset - localOffset, true);
            }
            return ret;
        },

        utcTimezoneOffset: function(date) {
            var D = Ext.Date,
                tzOffset = this.autoOffset ? date.getTimezoneOffset() : this.getTimezoneOffset();

            return D.subtract(date, D.MINUTE, tzOffset, true);
        }
    }
});
