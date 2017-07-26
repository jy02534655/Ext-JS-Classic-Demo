/**
 * For an overview of calendar views see {@link Ext.calendar.view.Base}
 *
 * The Days view displays events for multiple days with the time of day along the y axis.
 * The view will display the current date as the first day displayed unless configured
 * with a different date {@link #value}.  The number of days displayed can be set
 * using the {@link #visibleDays} config option.  By default, the calendar hours are
 * displayed as a 24 hour clock and are constrained to 8 (8:00am) and 20 (8:00pm).  The
 * beginning and end hour can be set using the {@link #startTime} and
 * {@link #endTime} configs.  The time displayed on the timeline may be customized
 * using either the {@link #timeFormat} or {@link #timeRenderer} config options.
 *
 * Below are some of the distinctions to the Days view (and generally its subclasses).
 *
 * ### Current Local Time
 *
 * The current local time (when the current date is displayed) will be shown on the view
 * as a thin marker on the day's timeline.  The current time marker can be set using the
 * {@link #showNowMarker} option.
 *
 * ### Calendar Events
 *
 * Events show on the timeline with their start and end times correlating to the time
 * labels.  The events will display on the timeline according to your local timezone
 * offset from GMT.  The timezone offset can be applied explicitly using the
 * {@link #timezoneOffset} config option.  The exception being all day or multi-day
 * events.  All day / multi-day events will show up at the top of the view in a dedicated
 * space preceding the view's start time.
 *
 * ### Adding All Day Events
 *
 * In addition to being able to drag / swipe across a day's timeline to show the event
 * add form, an all day type event can be quickly added by tapping / clicking on the
 * dedicated all day row displayed above the start hour.  This is the same dedicated
 * space used to display existing all day events.
 *
 * ### Date Range Navigation
 *
 * The {@link #movePrevious} and {@link #moveNext} methods modify the displayed
 * date range by moving the range forward or backward the number of days set on the
 * {@link #visibleDays} config.
 *
 * ### Alternative Classes
 *
 * If your view requires a header showing the dates displayed consider using
 * {@link Ext.calendar.panel.Days} instead.  To display a single day consider using the
 * {@link Ext.calendar.view.Day} view or {@link Ext.calendar.view.Week} to view a week at
 * a time.
 */
Ext.define('Ext.calendar.view.Days', {
    extend: 'Ext.calendar.view.Base',
    xtype: 'calendar-daysview',

    requires: [
        'Ext.calendar.view.DaysRenderer',
        'Ext.calendar.Event',
        'Ext.scroll.Scroller',
        'Ext.calendar.util.Dom'
    ],

    uses: [
        'Ext.calendar.dd.DaysAllDaySource',
        'Ext.calendar.dd.DaysAllDayTarget',
        'Ext.calendar.dd.DaysBodySource',
        'Ext.calendar.dd.DaysBodyTarget'
    ],

    isDaysView: true,

    baseCls: Ext.baseCSSPrefix + 'calendar-days',

    cellOverflowScrollBug: Ext.isGecko || Ext.isIE11m || Ext.isEdge,

    config: {
        /**
         * @cfg {Boolean} allowSelection
         * `true` to allow selection in the UI to create events. This includes being able
         * to drag-select a range in the all day area, as well as click/tap in the day
         * area (the dedicated space just above the start time's row) to create an event.
         *
         * See {@link #method-showAddForm} for adding an event when selection is
         * disabled.
         * @accessor
         */
        allowSelection: true,

        compactOptions: {
            displayOverlap: false,
            showNowMarker: false,
            timeFormat: 'g',
            timeRenderer: function(hour, formatted, firstInGroup) {
                var D = Ext.Date,
                    suffix = '',
                    d, cls;

                if (firstInGroup) {
                    cls = Ext.baseCSSPrefix + 'calendar-days-time-ampm';
                    d = D.clone(this.baseDate);
                    d.setHours(hour);
                    suffix = '<div class="' + cls + '">' + Ext.Date.format(d, 'a') + '</div>';
                }
                return formatted + suffix;
            }
        },

        /**
         * @cfg {Boolean} displayOverlap
         * When displaying events, allow events that intersect to horizontally overlap to
         * save on horizontal space.
         * @accessor
         */
        displayOverlap: true,

        /**
         * @cfg {Boolean} draggable
         * `true` to allows events to be dragged from this view.
         * @accessor
         */
        draggable: true,

        /**
         * @cfg {Boolean} droppable
         * `true` to allows events to be dropped on this view.
         * @accessor
         */
        droppable: true,

        /**
         * @cfg {Number} endTime
         * The hour number to end this view. Should be a value between `1` and `24`.
         * @accessor
         */
        endTime: 20,

        /**
         * @cfg {Boolean} resizeEvents
         * `true` to allow events in the day area to be resized.
         * @accessor
         */
        resizeEvents: true,

        /**
         * @cfg {Boolean} showNowMarker
         * `true` to show a marker on the view that equates to the current local time.
         * @accessor
         */
        showNowMarker: true,

        /**
         * @cfg {Number} startTime
         * The hour number to start this view. Should be a value between `0` and `23`.
         * @accessor
         */
        startTime: 8,

        /**
         * @cfg {String} timeFormat
         * The format to display the time values in the time gutter.
         *
         * Refer to the class description of {@link Ext.Date} for formatting options.
         *
         * Example format for displaying a 12-hour time with an am/pm suffix:
         *
         *     timeFormat: 'h:ia' // displays 14:00 hours as 2:00pm
         *
         * @locale
         */
        timeFormat: 'H:i',

        /**
         * @cfg {Function} [timeRenderer]
         * A formatting function for more complex displays of time values in the time
         * gutter.
         *
         * @param {Number} hour The hour being shown.
         * @param {String} formatted The formatted value as specified by the {@link #timeFormat}.
         * @param {Boolean} firstInGroup `true` if this hour is the first hour in the specified time
         * range to be in the morning (< 12) or in the afternoon > 12.
         *
         * @accessor
         */
        timeRenderer: null,

        /**
         * @cfg {Date} [value=new Date()]
         * The value to start the view from. The events displayed on this
         * view are configured by the value and the {@link #visibleDays}.
         *
         * @accessor
         */
        
        /**
         * @cfg {Number} visibleDays
         * The number of days to show starting from the {@link #cfg!value}.
         * @accessor
         */
        visibleDays: 4
    },

    /**
     * @event beforeeventdragstart
     * Fired before an event drag begins. Depends on the {@link #cfg!draggable} config.
     * @param {Ext.calendar.view.Days} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event model.
     *
     * Return `false` to cancel the drag.
     */
    
    /**
     * @event beforeeventresizestart
     * Fired before an event resize begins. Depends on the {@link #resizeEvents} config.
     * @param {Ext.calendar.view.Days} this This view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event model.
     *
     * Return `false` to cancel the resize.
     */
    
    /**
     * @event eventdrop
     * Fired when an event drop is complete.
     * Depends on the {@link #droppable} config.
     * @param {Ext.calendar.view.Days} this The view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event model.
     * @param {Ext.calendar.date.Range} context.newRange The new date range.
     */
    
    /**
     * @event eventresize
     * Fired when an event resize is complete.
     * Depends on the {@link #resizeEvents} config.
     * @param {Ext.calendar.view.Days} this The view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event model.
     * @param {Ext.calendar.date.Range} context.newRange The new date range.
     */
    
    /**
     * @event validateeventdrop
     * Fired when an event is dropped on this view, allows the drop
     * to be validated. Depends on the {@link #droppable} config.
     * @param {Ext.calendar.view.Days} this The view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event model.
     * @param {Ext.calendar.date.Range} context.newRange The new date range.
     * @param {Ext.Promise} context.validate A promise that allows validation to occur.
     * The default behavior is for no validation to take place. To achieve asynchronous
     * validation, the promise on the context object must be replaced:
     *
     *     {
     *         listeners: {
     *             validateeventdrop: function(view, context) {
     *                 context.validate = context.then(function() {
     *                     return Ext.Ajax.request({
     *                         url: '/checkDrop'
     *                     }).then(function(response) {
     *                         return Promise.resolve(response.responseText === 'ok');
     *                     });
     *                 });
     *             }
     *         }
     *     }
     */
    
    /**
     * @event validateeventresize
     * Fired when an event is resized on this view, allows the resize
     * to be validated. Depends on the {@link #resizeEvents} config.
     * @param {Ext.calendar.view.Days} this The view.
     * @param {Object} context The context.
     * @param {Ext.calendar.model.EventBase} context.event The event model.
     * @param {Ext.calendar.date.Range} context.newRange The new date range.
     * @param {Ext.Promise} context.validate A promise that allows validation to occur.
     * The default behavior is for no validation to take place. To achieve asynchronous
     * validation, the promise on the context object must be replaced:
     *
     *     {
     *         listeners: {
     *             validateeventresize: function(view, context) {
     *                 context.validate = context.then(function() {
     *                     return Ext.Ajax.request({
     *                         url: '/checkResize'
     *                     }).then(function(response) {
     *                         return Promise.resolve(response.responseText === 'ok');
     *                     });
     *                 });
     *             }
     *         }
     *     }
     */

    constructor: function(config) {
        var me = this;
        me.slotsPerHour = 60 / me.slotTicks;
        me.callParent([config]);
        me.scrollable = me.createScroller();
        me.bodyTable.on('tap', 'handleEventTap', me, {
            delegate: '.' + me.$eventCls
        });
        me.allDayContent.on('tap', 'handleEventTap', me, {
            delegate: '.' + me.$eventCls
        });
        me.recalculate();
        me.refreshHeaders();
    },

    getDisplayRange: function() {
        var me = this,
            range;

        if (me.isConfiguring) {
            me.recalculate();
        }
        range = me.dateInfo.active;

        return new Ext.calendar.date.Range(me.utcToLocal(range.start), me.utcToLocal(range.end));
    },

    getVisibleRange: function() {
        var D = Ext.Date,
            range;

        if (this.isConfiguring) {
            this.recalculate();
        }
        range = this.dateInfo.active;

        return new Ext.calendar.date.Range(D.clone(range.start), D.clone(range.end));
    },

    /**
     * Sets the {@link #startTime} and {@link #endTime} simultaneously.
     * @param {Number} start The start hour between 0 and 23.
     * @param {Number} end The end hour between 1 and 24.
     */
    setTimeRange: function(start, end) {
        var me = this;

        me.isConfiguring = true;
        me.setStartTime(start);
        me.setEndTime(end);
        this.isConfiguring = false;

        me.suspendEventRefresh();
        me.recalculate();
        me.resumeEventRefresh();
        me.refresh();
    },

    // Appliers/Updaters
    updateAllowSelection: function(allowSelection) {
        var me = this;

        me.allDaySelectionListeners = me.selectionListeners = 
            Ext.destroy(me.selectionListeners, me.allDaySelectionListeners);

        if (allowSelection) {
            me.bodySelectionListeners = me.bodyTable.on({
                destroyable: true,
                scope: me,
                touchstart: 'onBodyTouchStart',
                touchmove: 'onBodyTouchMove',
                touchend: 'onBodyTouchEnd'
            });

            me.allDaySelectionListeners = me.headerWrap.on({
                destroyable: true,
                scope: me,
                touchstart: 'onAllDayTouchStart',
                touchmove: 'onAllDayTouchMove',
                touchend: 'onAllDayTouchEnd'
            });
        }
    },

    updateDisplayOverlap: function(displayOverlap) {
        if (!this.isConfiguring) {
            this.refreshEvents();
        }
    },

    applyDraggable: function(draggable) {
        if (draggable) {
            draggable = new Ext.calendar.dd.DaysBodySource();
        }
        return draggable;
    },

    updateDraggable: function(draggable, oldDraggable) {
        var me = this;

        if (oldDraggable) {
            oldDraggable.destroy();
            me.allDayDrag = Ext.destroy(me.allDayDrag);
        }

        if (draggable) {
            draggable.setView(me);

            me.allDayDrag = new Ext.calendar.dd.DaysAllDaySource();
            me.allDayDrag.setView(me);
        }
    },

    applyDroppable: function(droppable) {
        if (droppable && !droppable.isInstance) {
            droppable = new Ext.calendar.dd.DaysBodyTarget(droppable);
        }
        return droppable;
    },

    updateDroppable: function(droppable, oldDroppable) {
        var me = this;

        if (oldDroppable) {
            oldDroppable.destroy();
            me.allDayDrop = Ext.destroy(me.allDayDrop);
        }

        if (droppable) {
            droppable.setView(me);
            me.allDayDrop = new Ext.calendar.dd.DaysAllDayTarget();
            me.allDayDrop.setView(me);
        }
    },

    updateEndTime: function() {
        this.calculateSlots();
        if (!this.isConfiguring) {
            this.refresh();
        }
    },

    updateResizeEvents: function(resizeEvents) {
        var me = this;

        me.dragListeners = Ext.destroy(me.dragListeners);

        if (resizeEvents) {
            me.dragListeners = me.bodyTable.on({
                scope: me,
                dragstart: 'onResizerDragStart',
                drag: 'onResizerDrag',
                dragend: 'onResizerDragEnd',
                destroyable: true,
                delegate: '.' + me.$resizerCls,
                // Give priority so drag can be vetoed
                priority: 1001
            });
        }

        if (!(me.isConfiguring || me.destroying)) {
            me.refreshEvents();
        }
    },

    updateShowNowMarker: function(showNowMarker) {
        var me = this,
            markerEl = me.markerEl;

        Ext.uninterval(me.showNowInterval);
        me.showNowInterval = null;
        me.markerEl = null;
        if (markerEl) {
            Ext.fly(markerEl).remove();
        }

        if (showNowMarker) {
            if (!me.isConfiguring) {
                me.checkNowMarker();
            }

            me.showNowInterval = Ext.interval(me.checkNowMarker, 300000, me); // 5 mins
        }
    },

    updateStartTime: function() {
        this.calculateSlots();
        if (!this.isConfiguring) {
            this.refresh();
        }
    },

    updateTimeFormat: function() {
        if (!this.isConfiguring) {
            this.updateTimeLabels();
        }
    },

    updateTimeRenderer: function() {
        if (!this.isConfiguring) {
            this.updateTimeLabels();
        }
    },

    updateTimezoneOffset: function() {
        if (!this.isConfiguring) {
            this.recalculate();
        }
    },

    updateValue: function(value, oldValue) {
        var me = this;

        if (!me.isConfiguring) {
            me.recalculate();
            me.refreshHeaders();
            me.checkNowMarker();
            me.refreshEvents();
        }
        me.callParent([value, oldValue]);
    },

    updateVisibleDays: function() {
        var me = this;
        if (!me.isConfiguring) {
            me.suspendEventRefresh();
            me.recalculate();
            me.resumeEventRefresh();
            me.refresh();
        }
    },

    // Protected overrides
    getElementConfig: function() {
        var me = this,
            result = me.callParent(),
            table = [{
                tag: 'table',
                cls: me.$tableCls + ' ' + me.$bodyTableCls,
                reference: 'bodyTable',
                children: [{
                    tag: 'tbody',
                    children: [{
                        tag: 'tr',
                        reference: 'timeRow',
                        children: [{
                            tag: 'td',
                            reference: 'timeContainer',
                            cls: me.$timeContainerCls
                        }]
                    }]
                }]
            }];

        // The ugliness in the markup here could be dropped for flexbox once
        // all supported browsers can take advantage of it. The purpose here is that
        // the body should stretch to the full height - the all day height.
        result.children = [{
            cls: Ext.baseCSSPrefix + 'calendar-days-table-wrap',
            reference: 'tableWrap',
            children: [{
                cls: Ext.baseCSSPrefix + 'calendar-days-header-wrap',
                reference: 'headerWrap',
                children: [{
                    cls: Ext.baseCSSPrefix + 'calendar-days-allday-background-wrap',
                    reference: 'allDayBackgroundWrap',
                    children: [{
                        tag: 'table',
                        cls: me.$tableCls + ' ' + Ext.baseCSSPrefix + 'calendar-days-allday-background-table',
                        children: [{
                            tag: 'tbody',
                            children: [{
                                tag: 'tr',
                                reference: 'allDayBackgroundRow',
                                children: [{
                                    tag: 'td',
                                    cls: me.$headerGutterCls
                                }]
                            }]
                        }]
                    }]
                }, {
                    tag: 'table',
                    cls: me.$tableCls + ' ' + Ext.baseCSSPrefix + 'calendar-days-allday-events',
                    children: [{
                        tag: 'tbody',
                        reference: 'allDayContent',
                        children: [{
                            tag: 'tr',
                            reference: 'allDayEmptyRow'
                        }]
                    }]
                }]
            }, {
                cls: Ext.baseCSSPrefix + 'calendar-days-body-row',
                children: [{
                    cls: Ext.baseCSSPrefix + 'calendar-days-body-cell',
                    reference: me.cellOverflowScrollBug ? null : 'bodyWrap',
                    children: me.cellOverflowScrollBug ? [{
                        // This extra wrapping element is here to appease firefox
                        // due to the strange behaviour with table-cell and overflow
                        cls: Ext.baseCSSPrefix + 'calendar-days-body-wrap',
                        reference: 'bodyWrap',
                        children: table
                    }] : table
                }]
            }]
        }];

        return result;
    },

    doDestroy: function() {
        var me = this;

        me.scrollable = Ext.destroy(me.scrollable);
        me.setAllowSelection(false);
        me.setShowNowMarker(false);
        me.setResizeEvents(false);
        me.callParent();
    },

    privates: {
        $allDayBackgroundCls: Ext.baseCSSPrefix + 'calendar-days-allday-background-cell',
        $allDayEmptyRowCls: Ext.baseCSSPrefix + 'calendar-days-allday-empty-cell',
        $bodyCls: Ext.baseCSSPrefix + 'calendar-days-body',
        $bodyTableCls: Ext.baseCSSPrefix + 'calendar-days-body-table',
        $dayColumnCls: Ext.baseCSSPrefix + 'calendar-days-day-column',
        $dayEventContainerCls: Ext.baseCSSPrefix + 'calendar-days-day-event-container',
        $headerGutterCls: Ext.baseCSSPrefix + 'calendar-days-header-gutter',
        $markerAltCls: Ext.baseCSSPrefix + 'calendar-days-marker-alt',
        $markerCls: Ext.baseCSSPrefix + 'calendar-days-marker',
        $nowMarkerCls: Ext.baseCSSPrefix + 'calendar-days-now-marker',
        $resizerCls: Ext.baseCSSPrefix + 'calendar-event-resizer',
        $resizingCls: Ext.baseCSSPrefix + 'calendar-event-resizing',
        $selectionCls: Ext.baseCSSPrefix + 'calendar-days-selection',
        $tableCls: Ext.baseCSSPrefix + 'calendar-days-table',
        $timeCls: Ext.baseCSSPrefix + 'calendar-days-time',
        $timeContainerCls: Ext.baseCSSPrefix + 'calendar-days-time-ct',

        baseDate: new Date(2008, 0, 1),
        MS_TO_MINUTES: 60000,
        minimumEventMinutes: 30,
        slotTicks: 5,
        slotsPerHour: null,

        backPosName: 'left',
        forwardPosName: 'right',
        headerScrollOffsetName: 'padding-right',

        /**
         * Calculate the total number of half hour slots available given
         * the current time range.
         *
         * @private
         */
        calculateSlots: function() {
            this.maxSlots = (this.getEndTime() - this.getStartTime()) * 2;
        },

        /**
         * Check for a position update of the now marker. This
         * is contingent on the config to show the marker being enabled.
         * 
         * @private
         */
        checkNowMarker: function() {
            if (this.getShowNowMarker()) {
                this.doCheckNowMarker();
            }
        },

        /**
         * Clear a row element and populate it with child nodes.
         * @param {Ext.dom.Element} row The row
         * @param {Object[]} nodes The configuration for the new nodes to add.
         * @param {Boolean} [clearAll=false] `true` to clear all nodes. `false` to leave the last node (gutter).
         *
         * @private
         */
        clearAndPopulate: function(row, nodes, clearAll) {
            var children = row.dom.childNodes,
                len = nodes.length,
                limit = clearAll ? 0 : 1,
                i;

            while (children.length > limit) {
                row.removeChild(children[limit]);
            }

            // Don't use .append([]) because it uses a document fragment
            // internally which tries to correct the td to divs.
            for (i = 0; i < len; ++i) {
                row.appendChild(nodes[i], true);
            }
        },

        clearEvents: function() {
            this.callParent();

            var body = this.allDayContent.dom,
                childNodes = body.childNodes;

            // Want to leave the last empty row
            while (childNodes.length > 1) {
                body.removeChild(childNodes[0]);
            }
        },

        /**
         * Clear the selected range in the allday portion.
         * 
         * @private
         */
        clearSelected: function() {
            this.selectRange(-1, -1);
        },

        /**
         * Construct all day events.
         * @param {Ext.calendar.model.EventBase[]} events The events.
         *
         * @private
         */
        constructAllDayEvents: function(events) {
            var me = this,
                D = Ext.Date,
                len = events.length,
                visibleDays = me.getVisibleDays(),
                before = me.allDayEmptyRow.dom,
                content = me.allDayContent.dom,
                week, event, i, rows, row, j, 
                item, widget, rowLen, rowEl, cell;

            week = new Ext.calendar.view.WeeksRenderer({
                view: me,
                start: D.clone(this.dateInfo.full.start),
                days: visibleDays,
                index: 0,
                maxEvents: null
            });

            for (i = 0; i < len; ++i) {
                event = events[i];
                if (!me.isEventHidden(event) && event.isSpan()) {
                    week.addIf(event);
                }
            }

            if (before.firstChild.className === me.$headerGutterCls) {
                before.removeChild(before.firstChild);
            }

            if (week.hasEvents()) {
                week.calculate();
                
                rows = week.rows;
                for (i = 0, len = rows.length; i < len; ++i) {
                    row = week.compress(i);
                    rowEl = document.createElement('tr');
                    for (j = 0, rowLen = row.length; j < rowLen; ++j) {
                        item = row[j];
                        cell = document.createElement('td');
                        cell.colSpan = item.len;
                        if (!item.isEmpty) {
                            widget = me.createEvent(item.event, {}, false);
                            widget.addCls(me.$staticEventCls);
                            cell.appendChild(widget.element.dom);
                        }
                        rowEl.appendChild(cell);
                    }
                    content.insertBefore(rowEl, before);
                }
            }

            Ext.fly(content.firstChild).insertFirst({
                tag: 'td',
                cls: me.$headerGutterCls,
                rowSpan: content.childNodes.length
            });
        },

        /**
         * Construct all events.
         * 
         * @private
         */
        constructEvents: function() {
            var me = this,
                D = Ext.Date,
                events = me.getEventSource().getRange(),
                len = events.length,
                visibleDays = me.getVisibleDays(),
                start = D.clone(me.dateInfo.visible.start),
                end = start,
                hours = me.getEndTime() - me.getStartTime(),
                i, j, day, frag, event;

            me.constructAllDayEvents(events);
            
            for (i = 0; i < visibleDays; ++i) {
                end = D.add(start, D.HOUR, hours, true);
                frag = document.createDocumentFragment();
                day = new Ext.calendar.view.DaysRenderer({
                    view: me,
                    start: start,
                    end: end
                });

                for (j = 0; j < len; ++j) {
                    event = events[j];
                    if (!me.isEventHidden(event)) {
                        day.addIf(event);
                    }
                }

                if (day.hasEvents()) {
                    day.calculate();
                    me.processDay(day, frag);
                }

                me.getEventColumn(i).appendChild(frag);
                start = D.add(start, D.DAY, 1, true);
            }
        },

        createEvent: function(event, cfg, dummy) {
            cfg = cfg || {};

            var allDay = event ? event.getAllDay() : false;

            cfg.mode = allDay ? 'weekspan' : 'day';
            if (!allDay) {
                cfg.resize = this.getResizeEvents();
            }
            return this.callParent([event, cfg, dummy]);
        },

        /**
         * Create the scroller.
         * @return {Ext.scroll.Scroller} The scroller.
         *
         * @private
         */
        createScroller: function() {
            return new Ext.scroll.Scroller({
                element: this.bodyWrap,
                x: false,
                y: true
            });
        },

        /**
         * Checks the position of the now marker, hides/shows it in
         * the correct place as required. Does not check the existence 
         * of the config flag, assumes it's true at this point.
         *
         * @private
         */
        doCheckNowMarker: function() {
            var me = this,
                D = Ext.Date,
                markerEl = me.markerEl,
                now = me.roundDate(Ext.calendar.date.Util.getLocalNow()),
                active = me.dateInfo.visible,
                current = me.utcToLocal(active.start),
                end = me.utcToLocal(active.end),
                visibleDays = me.getVisibleDays(),
                y = now.getFullYear(),
                m = now.getMonth(),
                d = now.getDate(),
                h = now.getHours(),
                min = now.getMinutes(),
                startTime = me.getStartTime(),
                endTime = me.getEndTime(),
                offset, pos, i;

            if (markerEl) {
                Ext.fly(markerEl).remove();
            }
            me.markerEl = null;

            if (!me.element.isVisible(true)) {
                return;
            }

            if (current <= now && now < end) {
                for (i = 0; i < visibleDays; ++i) {
                    if (current.getFullYear() === y && current.getMonth() === m && current.getDate() === d) {
                        // Same day, check time ranges
                        if (startTime <= h && (h < endTime || h === endTime && min === 0)) {
                            current.setHours(startTime);
                            offset = D.diff(current, now, D.MINUTE);
                            pos = (offset / me.slotTicks) * me.getSlotStyle().minSlotHeight;
                        }
                        break;
                    }
                    current = D.add(current, D.DAY, 1, true);
                }
            }

            if (pos !== undefined) {
                me.markerEl = Ext.fly(me.getColumn(i)).createChild({
                    cls: me.$nowMarkerCls,
                    style: {
                        top: pos + 'px'
                    }
                }, null, true);
            }
        },

        /**
         * Do range recalculation.
         * @param {Date} [start] The start to recalculate from. Defaults to the current value.
         * @return {Object}
         * @return {Ext.calendar.date.Range} return.full The full date range (with times cleared).
         * @return {Ext.calendar.date.Range} return.visible The visible date range (with times 
         * based on the {@link #startTime} and {@link #endTime}
         * @return {Date} return.visible.start The start date.
         * @return {Date} return.visible.end The end date.
         *
         * @private
         */
        doRecalculate: function(start) {
            var me = this,
                D = Ext.Date,
                R = Ext.calendar.date.Range,
                end, activeEnd;
                

            if (!start) {
                start = D.clone(me.getValue());
            }

            start = me.toUtcOffset(D.clearTime(start, true));
            end = D.add(start, D.DAY, me.getVisibleDays(), true);

            activeEnd = D.subtract(end, D.DAY, 1, true);

            return {
                full: new R(start, end),
                active: new R(start, activeEnd),
                visible: new R(
                    D.add(start, D.HOUR, me.getStartTime(), true),
                    // Even if the endTime is 24, it will automatically roll over to the next day
                    D.subtract(end, D.HOUR, 24 - me.getEndTime(), true)
                )
            };
        },

        doRefresh: function() {
            var me = this,
                timeContainer = me.timeContainer,
                allDayBackgroundRow = me.allDayBackgroundRow,
                nodes;

            if (!me.dateInfo) {
                me.suspendEventRefresh();
                me.recalculate();
                me.resumeEventRefresh();
            }

            timeContainer.dom.innerHTML = '';
            timeContainer.appendChild(me.generateTimeElements());

            me.clearAndPopulate(me.allDayEmptyRow, me.generateAllDayCells(me.$allDayEmptyRowCls, '&#160;'), true);
            me.clearAndPopulate(allDayBackgroundRow, me.generateAllDayCells(me.$allDayBackgroundCls));
            me.clearAndPopulate(me.timeRow, me.generateColumns());

            nodes = Ext.Array.toArray(me.allDayBackgroundRow.dom.childNodes);
            me.backgroundCells = Ext.Array.slice(nodes, 1);

            me.checkNowMarker();

            me.refreshHeaders();
            me.syncHeaderScroll();

            me.refreshEvents();
        },

        doRefreshEvents: function() {
            var source = this.getEventSource();
            this.clearEvents();
            if (source && source.getCount()) {
                this.constructEvents();
            }
        },

        /**
         * Generate cells for the all day portion of the view.
         * @param {String} [cls] The class to add to the cells.
         * @param {String} [html] The markup to add to the cell.
         * @return {Object[]} The DOM configs for the cells.
         *
         * @private
         */
        generateAllDayCells: function(cls, html) {
            var ret = [],
                days = this.getVisibleDays(),
                i;

            for (i = 0; i < days; ++i) {
                ret.push({
                    tag: 'td',
                    cls: cls,
                    html: html
                });
            }
            return ret;
        },

        /**
         * Generate the column elements for the days.
         * @return {Object[]} The DOM configs for the column elements.
         *
         * @private
         */
        generateColumns: function() {
            var me = this,
                days = me.getVisibleDays(),
                start = me.getStartTime(),
                end = me.getEndTime(),
                ret = [],
                col, i, j, markers;

            for (i = 0; i < days; ++i) {
                markers = [];
                col = {
                    tag: 'td',
                    cls: me.$dayColumnCls,
                    'data-index': i,
                    children: [{
                        cls: me.$dayEventContainerCls
                    }, {
                        cls: me.$markerContainerCls,
                        children: markers
                    }]
                };

                for (j = start; j < end; ++j) {
                    markers.push({
                        cls: me.$markerCls,
                        children: [{
                            cls: me.$markerAltCls
                        }]
                    });
                }
                ret.push(col);
            }

            return ret;
        },

        /**
         * Generate the time elements for the gutter.
         * @return {Object[]} The DOM configs for the time elements.
         *
         * @private
         */
        generateTimeElements: function() {
            var times = this.generateTimeLabels(),
                len = times.length,
                ret = [],
                i;

            for (i = 0; i < len; ++i) {
                ret.push({
                    cls: this.$timeCls,
                    html: times[i]
                });
            }   
            return ret;
        },

        /**
         * Generate the labels for the time gutter.
         * @return {String[]} The times.
         *
         * @private
         */
        generateTimeLabels: function() {
            var me = this,
                D = Ext.Date,
                current = D.clone(me.baseDate),
                start = me.getStartTime(),
                end = me.getEndTime(),
                format = me.getTimeFormat(),
                ret = [],
                renderer = me.getTimeRenderer(),
                seenAM, seenPM, formatted, i, firstInGroup;

            for (i = start; i < end; ++i) {
                current.setHours(i);
                formatted = D.format(current, format);
                if (renderer) {
                    firstInGroup = false;
                    if (i < 12 && !seenAM) {
                        firstInGroup = seenAM = true;
                    } else if (i >= 12 && !seenPM) {
                        firstInGroup = seenPM = true;
                    }
                    formatted = renderer.call(this, i, formatted, firstInGroup);
                }
                ret.push(formatted);

            }
            return ret;
        },

        getBodyElement: function() {
            return this.bodyTable;
        },

        /**
         * Get a day column by index.
         * @param {Number} index The index of the column.
         * @return {HTMLElement} The column.
         *
         * @private
         */
        getColumn: function(index) {
            return this.getColumns()[index];
        },

        /**
         * Get all day columns.
         * @return {HTMLElement[]} The columns.
         *
         * @private
         */
        getColumns: function() {
            return this.bodyTable.query('.' + this.$dayColumnCls);
        },

        /**
         * Get the event container for a column by index.
         * @param {Number} index The index of the event container column.
         * @return {HTMLElement} The event container.
         *
         * @private
         */
        getEventColumn: function(index) {
            return Ext.fly(this.getColumn(index)).down('.' + this.$dayEventContainerCls);
        },

        /**
         * Get styles regarding events. Creates a fake event and measures pieces of the
         * componentry.
         * @return {Object} Size info.
         * @return {Object} return.margin The margins for the event.
         * @return {Number} return.resizerWidth The width of the resizer element.
         *
         * @private
         */
        getEventStyle: function() {
            var me = this,
                eventStyle = me.eventStyle,
                fakeEvent, el, margin;

            if (!eventStyle) {
                fakeEvent = me.createEvent(null, {
                    resize: true
                }, true);
                el = fakeEvent.element;

                el.dom.style.visibility = 'hidden';
                me.getEventColumn(0).appendChild(el.dom);

                margin = el.getMargin();
                margin.height = margin.top + margin.bottom;

                me.eventStyle = eventStyle = {
                    margin: margin,
                    resizerWidth: Ext.fly(el.down('.' + this.$resizerCls, true)).getWidth()
                };
                fakeEvent.destroy();

            }
            return eventStyle;
        },

        /**
         * Find an event widget via record.
         * @param {Ext.calendar.model.EventBase} event The event record.
         * @return {Ext.calendar.EventBase} The event widget. `null` if not found.
         *
         * @private
         */
        getEventWidget: function(event) {
            var map = this.eventMap,
                id = event.id,
                key, w;

            for (key in map) {
                w = map[key];
                if (w.getModel().id === id) {
                    return w;
                }
            }

            return null;
        },

        getMoveInterval: function() {
            return {
                unit: Ext.Date.DAY,
                amount: this.getVisibleDays()
            };
        },

        /**
         * Precalculates the heights of slots for sizing events.
         * Should be invalidated when the view height resizes.
         * @return {Object} The sizes.
         * @return {Number} return.hourHeight The height of 1 hour in px.
         * @return {Number} return.halfHeight The height of half an hour in px.
         * @return {Number} return.minSlotHeight The height of the smallest slot resolution
         * for displayng events.
         *
         * @private
         */
        getSlotStyle: function() {
            var me = this,
                slotStyle = me.slotStyle,
                h;

            if (!slotStyle) {
                h = Ext.fly(me.bodyTable.down('.' + me.$markerCls, true)).getHeight();
                me.slotStyle = slotStyle = {
                    hourHeight: h,
                    halfHeight: h / 2,
                    minSlotHeight: h / me.slotsPerHour
                };
            }
            return slotStyle;
        },

        /**
         * Handle taps on event widgets in the view.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        handleEventTap: function(e) {
            var event = this.getEvent(e);
            if (event) {
                this.onEventTap(event);
            }
        },

        handleResize: function() {
            var me = this;

            me.slotStyle = null;

            me.callParent();
            me.refreshEvents();
            me.checkNowMarker();
            me.syncHeaderScroll();
        },

        /**
         * Handle touchend on the all day portion of the view.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onAllDayTouchEnd: function(e) {
            var me = this,
                D = Ext.Date,
                creating = me.isAllDayCreating,
                startPos, endPos, start, end, diff, event;

            if (creating) {

                startPos = creating.initialIndex;
                endPos = Ext.calendar.util.Dom.getIndexPosition(creating.positions, e.pageX);

                start = creating.startDate;
                diff = Math.abs(endPos - startPos);

                if (startPos > endPos) {
                    end = start;
                    start = D.subtract(end, D.DAY, diff, true);
                } else {
                    end = D.add(start, D.DAY, diff, true);
                }

                // Start will be UTC here, which means end will also be.
                event = me.createModel({
                    startDate: D.localToUtc(start),
                    endDate: D.add(D.localToUtc(end), D.DAY, 1, true),
                    allDay: true
                });

                me.showAddForm(event, {
                    scope: me,
                    onSave: me.clearSelected,
                    onCancel: me.clearSelected
                });
                me.isAllDayCreating = null;
            }
        },

        /**
         * Handle touchmove on the all day portion of the view.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onAllDayTouchMove: function(e) {
            var me = this,
                creating = me.isAllDayCreating,
                startPos, endPos;

            if (!creating) {
                return;
            }

            startPos = creating.initialIndex;
            endPos = Ext.calendar.util.Dom.getIndexPosition(creating.positions, e.pageX);

            me.selectRange(startPos, endPos);
        },

        /**
         * Handle touchstart on the all day portion of the view.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onAllDayTouchStart: function(e) {
            var me = this,
                D = Ext.Date,
                positions, index,
                start = this.utcToLocal(me.dateInfo.full.start);

            if (e.pointerType === 'touch' || e.getTarget('.' + me.$eventCls, me.headerWrap)) {
                return;
            }

            positions = Ext.calendar.util.Dom.extractPositions(me.backgroundCells, 'getX');
            index = Ext.calendar.util.Dom.getIndexPosition(positions, e.pageX);
            me.isAllDayCreating = {
                positions: positions,
                initialIndex: index,
                startDate: D.add(start, D.DAY, index, true)
            };
            me.selectRange(index, index);
        },

        /**
         * Handle touchend on the body day portion of the view.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onBodyTouchEnd: function(e) {
            var me = this,
                creating = me.isBodyCreating,
                w, fn, event, start, end;

            if (creating) {
                w = creating.widget;
                if (w) {
                    start = w.getStartDate();
                    end = w.getEndDate();

                    fn = function() {
                        w.destroy();
                    };

                    event = me.createModel({
                        startDate: start,
                        endDate: end
                    });

                    me.showAddForm(event, {
                        onSave: fn,
                        onCancel: fn
                    });
                }
                me.isBodyCreating = null;
            }
        },

        /**
         * Handle touchmove on the body day portion of the view.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onBodyTouchMove: function(e) {
            var me = this,
                D = Ext.Date,
                creating = me.isBodyCreating,
                resizeMins = me.minimumEventMinutes,
                margin = me.getEventStyle().margin,
                el, w, slot, startSlot,
                topSlot, bottomSlot, start, end;

            if (!creating) {
                return;
            }

            w = creating.widget;
            if (!w) {
                w = me.createEvent(null, {}, true);
                el = w.element;

                w.setPalette(me.getDefaultPalette());
                w.addCls(me.$resizingCls);
                w.setWidth('100%');

                el.setZIndex(999);
                me.getEventColumn(creating.index).appendChild(el);
                creating.widget = w;
            }

            el = w.element;

            slot = me.slotFromPosition(e.getY());
            if (slot < 0 || slot > me.maxSlots) {
                return;
            }

            startSlot = creating.startSlot;

            if (startSlot === slot) {
                slot = startSlot + 1;
            }

            if (startSlot > slot) {
                topSlot = slot;
                bottomSlot = startSlot;
            } else {
                topSlot = startSlot;
                bottomSlot = slot;
            }

            el.setStyle({
                top: (margin.top + me.slotToPosition(topSlot)) + 'px',
                marginTop: 0,
                marginBottom: 0
            });

            w.setHeight((bottomSlot - topSlot) * me.getSlotStyle().halfHeight - margin.bottom);
            start = D.clone(creating.baseDate);
            start = D.add(start, D.MINUTE, topSlot * resizeMins, true);
            end = D.add(start, D.MINUTE, (bottomSlot - topSlot) * resizeMins, true);
            w.setStartDate(start);
            w.setEndDate(end);
        },

        /**
         * Handle touchstart on the body day portion of the view.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onBodyTouchStart: function(e) {
            var me = this,
                D = Ext.Date,
                col, index, d;

            if (e.pointerType === 'touch' || e.getTarget('.' + me.$eventCls, me.bodyTable)) {
                return;
            }

            col = e.getTarget('.' + me.$dayColumnCls);

            if (col) {
                index = parseInt(col.getAttribute('data-index'), 10);
                d = D.add(me.dateInfo.visible.start, D.DAY, index, true);
                me.isBodyCreating = {
                    col: col,
                    index: index,
                    baseDate: d,
                    startSlot: me.slotFromPosition(e.getY())
                };
            }
        },

        /**
         * Handle drag on an event resizer.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onResizerDrag: function(e) {
            if (!this.resizing) {
                return;
            }

            var me = this,
                D = Ext.Date,
                resizing = me.resizing,
                event = resizing.event,
                w = resizing.widget,
                halfHeight = me.getSlotStyle().halfHeight,
                slot = me.slotFromPosition(e.getY()),
                h = (slot * halfHeight) - resizing.eventTop,
                startSlot = resizing.startSlot,
                start = event.getStartDate(),
                resizeMins = me.minimumEventMinutes,
                end;

            e.stopEvent();

            if (slot < 0 || slot > me.maxSlots || slot <= startSlot) {
                return;
            }
            resizing.current = end = D.add(start, D.MINUTE, resizeMins * (slot - startSlot), true);

            w.setHeight(h);
            w.setEndDate(end);
        },

        /**
         * Handle dragend on an event resizer.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onResizerDragEnd: function() {
            if (!this.resizing) {
                return;
            }

            var me = this,
                R = Ext.calendar.date.Range,
                resizing = me.resizing,
                d = resizing.current,
                w = resizing.widget,
                originalHeight = resizing.height,
                event = resizing.event,
                fn = function(success) {
                    if (!w.destroyed) {
                        w.element.setZIndex(resizing.oldZIndex);
                        w.removeCls(me.$resizingCls);
                    }

                    if (!success) {
                        w.setHeight(originalHeight);
                        w.setEndDate(event.getEndDate());
                    }
                };

            me.resizing = null;

            if (d) {
                me.handleChange('resize', event, new R(event.getStartDate(), d), fn);
            } else {
                fn();
            }
        },

        /**
         * Handle dragstart on an event resizer.
         * @param {Ext.event.Event} e The event.
         *
         * @private
         */
        onResizerDragStart: function(e) {
            var me = this,
                event = me.getEvent(e),
                w, el, top;

            e.stopEvent();

            if (me.handleChangeStart('resize', event) !== false) {
                w = me.getEventWidget(event);
                el = w.element;
                top = el.getTop(true);
                me.resizing = {
                    height: w.getHeight(),
                    event: event,
                    eventTop: top,
                    startSlot: me.slotFromPosition(top, true),
                    widget: w,
                    oldZIndex: el.getZIndex()
                };
                w.addCls(me.$resizingCls);
                el.setZIndex(999);
            }
        },

        onSourceAttach: function() {
            this.recalculate();
        },

        /**
         * Position events for a day.
         * @param {Ext.calendar.view.DaysRenderer} day The day.
         * @param {DocumentFragment} frag A fragment to append events to.
         *
         * @private
         */
        processDay: function(day, frag) {
            var me = this,
                events = day.events,
                len = events.length,
                slotHeight = me.getSlotStyle().minSlotHeight,
                eventStyle = me.getEventStyle(),
                margin = eventStyle.margin,
                resizerOffset = 0,
                allowOverlap = me.getDisplayOverlap(),
                i, item, w, back, fwd, forwardPos, backwardPos,
                styles;

            if (me.getResizeEvents()) {
                resizerOffset = eventStyle.resizerWidth + 5;
            }

            for (i = 0; i < len; ++i) {
                item = events[i];

                forwardPos = item.forwardPos;
                backwardPos = item.backwardPos;

                if (allowOverlap) { 
                    forwardPos = Math.min(1, backwardPos + (forwardPos - backwardPos) * 2);
                }

                back = backwardPos;
                fwd = 1 - forwardPos;

                w = me.createEvent(item.event);
                styles = {
                    marginTop: 0,
                    marginBottom: 0,
                    top: (item.start * slotHeight + margin.top) + 'px',
                    zIndex: item.colIdx + 1
                };

                styles[me.backPosName] = back * 100 + '%';
                styles[me.forwardPosName] = fwd * 100 + '%';

                if (allowOverlap && item.edgeWeight > 0) {
                    styles.marginRight = resizerOffset + 'px';
                }
                w.setStyle(styles);
                w.setHeight((item.len * slotHeight - margin.bottom));
                frag.appendChild(w.element.dom);
            }
        },

        /**
         * Recalculate the view bounds and communicate them to the
         * event source.
         *
         * @private
         */
        recalculate: function() {
            var dateInfo = this.doRecalculate();
            this.dateInfo = dateInfo;
            this.setSourceRange(dateInfo.full);
        },

        /**
         * Refresh the {@link #header} if it is attached to the view.
         *
         * @private
         */
        refreshHeaders: function() {
            var me = this,
                header = me.getHeader(),
                dateInfo = me.dateInfo;

            if (header) {
                header.setVisibleDays(me.getVisibleDays());
                if (dateInfo) {
                    header.setValue(me.utcToLocal(dateInfo.full.start));
                }
            }
        },

        /**
         * Round a date to the nearest minimum slot.
         * @param {Date} d The date.
         * @return {Date} The rounded date.
         *
         * @private
         */
        roundDate: function(d) {
            return new Date(Ext.Number.roundToNearest(d.getTime(), this.slotTicks));
        },

        /**
         * Select a range in the all day view.
         * @param {Number} start The start index.
         * @param {Number} end The end index.
         *
         * @private
         */
        selectRange: function(start, end) {
            var cells = this.backgroundCells,
                len = cells.length,
                i;

            if (start > end) {
                i = start;
                start = end;
                end = i;    
            }

            for (i = 0; i < len; ++i) {
                Ext.fly(cells[i]).toggleCls(this.$selectionCls, i >= start && i <= end);
            }
        },

        /**
         * Get the nearest slot based on the page position.
         * @param {Number} pageY The y position on the page.
         * @param {Boolean} [local=false] `true` to calculate as a local y instead of page y.
         * @return {Number} The slot.
         *
         * @private
         */
        slotFromPosition: function(pageY, local) {
            var y = pageY - (local ? 0 : this.bodyTable.getY());
            return Math.round(y / this.getSlotStyle().halfHeight);
        },

        /**
         * Gets the local y position given a slot.
         * @param {Number} slot The slot.
         * @return {Number} The local y position.
         *
         * @private
         */
        slotToPosition: function(slot) {
            return slot * this.getSlotStyle().halfHeight;
        },

        /**
         * Ensure headers take into account a scrollbar on the
         * view if necessary.
         * 
         * @private
         */
        syncHeaderScroll: function() {
            var me = this,
                scrollable = me.scrollable,
                name = me.headerScrollOffsetName,
                w, len;

            if (scrollable) {
                w = scrollable.getScrollbarSize().width + 'px';
                me.headerWrap.setStyle(name, w);
                me.allDayBackgroundWrap.setStyle(name, w);
            }
        },

        updateTimeLabels: function() {
            var times = this.generateTimeLabels(),
                nodes = this.timeContainer.dom.childNodes,
                i;

            //<debug>
            //Should never get here
            if (times.length !== nodes.length) {
                Ext.raise('Number of generated times did not match');
            }
            //</debug>
            for (i = 0, len = times.length; i < len; ++i) {
                nodes[i].innerHTML = times[i];
            }
        }
    }
});
