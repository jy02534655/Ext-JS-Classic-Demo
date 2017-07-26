/**
 * This class is used to generate the rendering parameters for an event
 * in a {@link Ext.calendar.view.Weeks}. The purpose of this class is
 * to provide the rendering logic insulated from the DOM.
 * 
 * @private
 */
Ext.define('Ext.calendar.view.WeeksRenderer', {
    /**
     * @cfg {Number} days
     * The number of days.
     */
    days: null,

    /**
     * @cfg {Number} index
     * The index of this week.
     */
    index: null,

    /**
     * @cfg {Number} maxEvents
     * The maximum number of events per day before overflow.
     * `null` to disable this.
     */
    maxEvents: null,

    /**
     * @cfg {Boolean} overflow
     * `true` to calculate sizes as if overflow could occur.
     */
    overflow: true,

    /**
     * @cfg {Date} start
     * The start of the week.
     */
    start: null,

    /**
     * {@link Ext.calendar.view.Base} view
     * The view.
     */
    view: null,

    constructor: function(config) {
        var me = this,
            D = Ext.Date,
            start, end;

        Ext.apply(me, config);

        start = me.start;
        me.end = end = D.add(start, D.DAY, me.days, true);
        me.utcStart = this.view.utcTimezoneOffset(start);
        me.utcEnd = D.add(me.utcStart, D.DAY, me.days, true);

        me.hasMaxEvents = me.maxEvents !== null;

        me.rows = [];
        me.events = [];
        me.seen = {};
        me.overflows = [];
    },

    /**
     * Add an event if it occurs within the range for this week.
     * @param {Ext.calendar.model.EventBase} event The event.
     */
    addIf: function(event) {
        var me = this,
            start, end;

        if (event.getAllDay()) {
            // Treat all day events as UTC
            start = me.utcStart;
            end = me.utcEnd;
        } else {
            start = me.start;
            end = me.end;
        }

        if (event.occursInRange(start, end)) {
            me.events.push(event);
        }
    },

    /**
     * Indicates that all events are added and the positions can be calculated.
     */
    calculate: function() {
        var me = this,
            D = Ext.Date,
            view = me.view,
            seen = me.seen,
            events = me.events,
            len = events.length,
            days = me.days,
            rangeEnd = me.end,
            utcRangeEnd = me.utcEnd,
            start = D.clone(me.start),
            utcStart = D.clone(me.utcStart),
            maxEvents = me.maxEvents,
            hasMaxEvents = me.hasMaxEvents,
            overflows = me.overflows,
            overflowOffset = me.overflow ? 1 : 0,
            dayEventList = [],
            i, j, dayEvents, event, eLen,
            utcEnd, end, id, eventEnd, span,
            offsetStart, offsetEnd, offsetRangeEnd,
            allDay, item, offset, isSpan, dayLen,
            hasAnyOverflows, overflow, map, prev, dayOverflows;

        for (i = 0; i < days; ++i) {
            end = D.add(start, D.DAY, 1, true);
            utcEnd = D.add(utcStart, D.DAY, 1, true);
            dayEvents = [];

            for (j = 0; j < len; ++j) {
                event = events[j];
                id = event.id;

                allDay = event.getAllDay();
                if (allDay) {
                    offsetStart = utcStart;
                    offsetEnd = utcEnd;
                    offsetRangeEnd = utcRangeEnd;
                } else {
                    offsetStart = start;
                    offsetEnd = end;
                    offsetRangeEnd = rangeEnd;
                }

                if (event.occursInRange(offsetStart, offsetEnd)) {
                    isSpan = event.isSpan();
                    if (!seen[id]) {
                        span = 1;
                        // If the event only spans 1 day, don't bother calculating
                        if (isSpan) {
                            eventEnd = event.getEndDate();
                            if (eventEnd > offsetRangeEnd) {
                                // If the event finishes after our range, then just span it to the end
                                span = days - i;
                            } else {
                                // Otherwise, calculate the number of days used by this event
                                span = view.getDaysSpanned(offsetStart, eventEnd, allDay);
                            }
                        }
                        seen[id] = span;
                        dayEvents.push({
                            event: event,
                            id: id
                        });
                    } else if (isSpan) {
                        // Seen this span already, but it needs to go in the day events so
                        // overflows get generated correctly
                        dayEvents.push({
                            isPlaceholder: true,
                            event: event,
                            id: id
                        });
                    }
                }
            }

            eLen = dayEvents.length;
            // Now we have all of the events for this day, sort them based on "priority",
            // then add them to our internal structure
            dayEvents.sort(me.sortEvents);

            if (hasMaxEvents) {
                map = {};
                overflows[i] = overflow = [];
                overflow.$map = map;

                // Can't check previous days on the first day
                if (i > 0) {
                    prev = overflows[i - 1].$map;
                    // Loop through all the events for today. If the event
                    // is overflowed in the previous day, it must also be overflowed today
                    for (j = 0; j < eLen; ++j) {
                        item = dayEvents[j];
                        id = item.id;
                        if (prev[id]) {
                            overflow.push(item.event);
                            map[id] = true;
                            dayEvents.splice(j, 1);
                            hasAnyOverflows = true;
                            --j;
                            --eLen;
                        }
                    }
                }

                if (eLen > 0) {
                    if (eLen > maxEvents) {
                        // This is a naive attempt to calculate overflows, without taking into account
                        // other days in the row. We'll use this a the basis going forward if we need
                        // to do any extra calculations once we start considering other days.


                        // -1 here because maxEvents is the total we can show, without the "show more" item.
                        // Assuming that "show more" is roughly the same size as an event, which we'll
                        // also need to show, we have to lop off another event.
                        offset = Math.max(0, maxEvents - overflowOffset);
                        dayOverflows = Ext.Array.splice(dayEvents, offset);
                        for (j = 0, dayLen = dayOverflows.length; j < dayLen; ++j) {
                            item = dayOverflows[j];
                            overflow.push(item.event);
                            map[item.id] = true;
                        }
                        hasAnyOverflows = true;
                    } else if (overflowOffset > 0 && overflow.length && eLen === maxEvents) {
                        item = dayEvents.pop();
                        overflow.push(item.event);
                        map[item.id] = true;
                    }
                }
            }
            dayEventList.push(dayEvents);

            start = end;
            utcStart = utcEnd;
        }

        if (hasAnyOverflows && maxEvents > 0) {
            me.calculateOverflows(dayEventList, overflows);
        }

        // Once we have overflows, place the events
        for (i = 0; i < days; ++i) {
            dayEvents = dayEventList[i];
            eLen = dayEvents.length;
            for (j = 0; j < eLen; ++j) {
                item = dayEvents[j];
                if (!item.isPlaceholder) {
                    event = item.event;
                    me.addToRow(event, i, seen[event.id]);
                }
            }
        }
    },

    /**
     * Compress existing rows into consumable pieces for the view.
     * @param {Number} rowIdx The row index to compress.
     * @return {Object[]} A compressed set of config objects for the row.
     */
    compress: function(rowIdx) {
        var row = this.rows[rowIdx],
            ret = [],
            days = this.days,
            count = 0,
            i = 0,
            inc, item;

        while (i < days) {
            inc = 1;
            item = row[i];
            if (item.event) {
                if (count > 0) {
                    ret.push({
                        isEmpty: true,
                        len: count
                    });
                    count = 0;
                }
                ret.push(item);
                i += item.len;
            } else {
                ++count;
                ++i;
            }
        }

        if (count > 0) {
            ret.push({
                isEmpty: true,
                len: count
            });
        }

        return ret;
    },

    /**
     * Checks if this renderer has any events.
     * @return {Boolean} `true` if there are events.
     */
    hasEvents: function() {
        return this.events.length > 0;
    },

    privates: {
        /**
         * Add an event to an existing row. Creates a new row
         * if one cannout be found.
         * @param {Ext.calendar.model.EventBase} event The event.
         * @param {Number} dayIdx The start day for the event.
         * @param {Number} days The number of days to span
         *
         * @private
         */
        addToRow: function(event, dayIdx, days) {
            var me = this,
                rows = me.rows,
                len = rows.length,
                end = days + dayIdx,
                found, i, j, row, idx;

            for (i = 0; i < len; ++i) {
                row = rows[i];
                for (j = dayIdx; j < end; ++j) {
                    if (row[j]) {
                        // Something occupying the space
                        break;
                    }
                }

                // If we got to the end of the loop above, we're ok to use this row
                if (j === end) {
                    found = row;
                    idx = i;
                    break;
                }
            }

            if (!found) {
                found = me.makeRow();
                rows.push(found);
                idx = rows.length - 1;
            }
            me.occupy(event, found, idx, dayIdx, end - 1);
        },

        /**
         * Setup any overflows triggered by overflows in other days.
         * @param {Object[]} dayEventList The list of events for all days.
         * @param  {Object[]} overflows The list overflows for all days.
         *
         * @private
         */
        calculateOverflows: function(dayEventList, overflows) {
            var days = this.days,
                maxEvents = this.maxEvents,
                i, dayEvents, len, item, id;

            // We are checking if we have events overflowing to the right
            // which may be truncated by overflow. Ignore the last day since it
            // will have no influence because there's nothing it can overflow into
            for (i = days - 2; i >= 0; --i) {
                dayEvents = dayEventList[i];
                len = dayEvents.length;
                // If we don't have any overflow, but we are on the boundary of being
                // overflowed, we need to check if we move into another cell that would
                // cause us to be hidden
                if (len > 0 && overflows[i].length === 0 && len === maxEvents) {
                    item = dayEvents[len - 1];
                    id = item.id;

                    // Only need to check one day forward, since an event can't "jump".
                    // If it's not in the day forward, then it can't be in any further day.
                    if (overflows[i + 1].$map[id]) {
                        // If it's overflowed, then we must overflow it
                        overflows[i].unshift(item.event);
                        overflows[i].$map[id] = true;
                        dayEvents.length = len - 1;
                    }
                }
            }
        },

        /**
         * Construct a new row.
         * @return {Object[]} The new row.
         *
         * @private
         */
        makeRow: function() {
            var row = [],
                days = this.days,
                i;

            for (i = 0; i < days; ++i) {
                row[i] = 0;
            }
            return row;
        },

        /**
         * Have an event occupy space in a row.
         * @param {Ext.calendar.model.EventBase} event The event.
         * @param {Object[]} row  The row.
         * @param {Number} rowIdx The local index of the row.
         * @param {Number} fromIdx The start index to occupy.
         * @param {Number} toIdx The end index to occupy.
         *
         * @private
         */
        occupy: function(event, row, rowIdx, fromIdx, toIdx) {
            var len = toIdx - fromIdx + 1,
                i;

            for (i = fromIdx; i <= toIdx; ++i) {
                row[i] = i === fromIdx ? {
                    event: event,
                    len: len,
                    start: fromIdx,
                    weekIdx: this.index,
                    localIdx: rowIdx
                } : true;
            }
        },

        /**
         * A sort comparator function for processing events.
         * @param {Object} event1 The first event.
         * @param {Object} event2 The second event,
         * @return {Number} A standard sort comparator.
         * @private
         */
        sortEvents: function(event1, event2) {
            event1 = event1.event;
            event2 = event2.event;
            return +event2.isSpan() - +event1.isSpan() ||
                   Ext.calendar.model.Event.sort(event1, event2);
        }
    }
});