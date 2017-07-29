/**
 * This class is used to generate the rendering parameters for an event
 * in a {@link Ext.calendar.view.Days}. The purpose of this class is
 * to provide the rendering logic insulated from the DOM.
 * 
 * @private
 */
Ext.define('Ext.calendar.view.DaysRenderer', {

    /**
     * @cfg {Date} end
     * The end for the day.
     */
    end: null,

    /**
     * @cfg {Date} start
     * The start for the day.
     */
    start: null,

    /**
     * @cfg {Ext.calendar.view.Days} view
     * The view.
     */
    view: null,

    constructor: function(config) {
        var me = this,
            view, slotTicks;

        Ext.apply(me, config);

        view = me.view;

        slotTicks = view.slotTicks;
        me.slots = (view.getEndTime() - view.getStartTime()) * (60 / slotTicks);
        me.offset = view.MS_TO_MINUTES * slotTicks;

        me.events = [];
    },

    /**
     * Adds the event to this renderer if it is valid.
     * @param {Ext.calendar.model.EventBase} event.
     */
    addIf: function(event) {
        var me = this,
            start = me.start,
            view = me.view,
            offset = me.offset,
            startSlot, endSlot;

        if (!event.isSpan() && event.isContainedByRange(start, me.end)) {
            startSlot = Math.max(0, (view.roundDate(event.getStartDate()) - start) / offset);
            endSlot = Math.min(me.slots, (view.roundDate(event.getEndDate()) - start) / offset);

            this.events.push({
                event: event,
                start: startSlot,
                end: endSlot,
                len: endSlot - startSlot,
                colIdx: -1,
                overlaps: [],
                edgeWeight: -1,
                forwardPos: -1,
                backwardPos: -1
            });
        }
    },

    /**
     * Indicates that all events are added and the positions can be calculated.
     */
    calculate: function() {
        var me = this,
            events = me.events,
            columns, len, i, firstCol;

        events.sort(me.sortEvents);

        columns = me.buildColumns(events);
        me.constructOverlaps(columns);

        firstCol = columns[0];
        if (firstCol) {
            len = firstCol.length;

            for (i = 0; i < len; ++i) {
                me.calculateEdgeWeights(firstCol[i]);
            }

            for (i = 0; i < len; ++i) {
                me.calculatePositions(firstCol[i], 0, 0);
            }
        }
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
         * Finds any vertically overlapping events from the candidates and
         * pushes them into the events overlap collection.
         * @param {Object} event The event meta object.
         * @param {Object[]} candidates The possible overlapping candidates.
         *
         * @private
         */
        appendOverlappingEvents: function(event, candidates) {
            this.doOverlap(event, candidates, event.overlaps);
        },

        /**
         * Construct a series of columns for events. If there is no
         * vertical collision between events, they can exist in the same column.
         * @param {Object[]} events The events.
         * @return {Object[][]} The columns. Each column will be an array of events.
         *
         * @private
         */
        buildColumns: function(events) {
            var len = events.length,
                columns = [],
                i, j, colLen, event, idx;

            for (i = 0; i < len; ++i) {
                idx = -1;
                event = events[i];

                for (j = 0, colLen = columns.length; j < colLen; ++j) {
                    if (!this.hasOverlappingEvents(event, columns[j])) {
                        idx = j;
                        break;
                    }
                }

                if (idx === -1) {
                    idx = columns.length;
                    columns[idx] = [];
                }
                columns[idx].push(event);
                event.colIdx = idx;
            }

            return columns;
        },

        /**
         * Calculate the distance of this event to the edge in terms of items that
         * are overlapping in the horizontal group. A larger weight means there are
         * more items between the event and the edge,
         * @param {Object} event The event.
         * @return {Number} The weight.
         *
         * @private
         */
        calculateEdgeWeights: function(event) {
            var overlaps = event.overlaps,
                len = overlaps.length,
                weight = event.edgeWeight,
                i;

            if (weight === -1) {
                weight = 0;
                for (i = 0; i < len; ++i) {
                    weight = Math.max(weight, this.calculateEdgeWeights(overlaps[i]) + 1);
                }
                event.edgeWeight = weight;
            }
            return weight;
        },

        /**
         * Calculate the backward/forward position from the start/end edges. The values
         * for each offset will be a percentage value.
         * @param {Object} event The event
         * @param {Number} edgeOffset The number of items before this one in the horizontal series.
         * @param {Number} backOffset The starting offset of an item in this horizontal series.
         *
         * @private
         */
        calculatePositions: function(event, edgeOffset, backOffset) {
            var overlaps = event.overlaps,
                len = overlaps.length,
                nextEdgeOffset = edgeOffset + 1,
                fwd, i, first, availWidth;

            if (event.forwardPos === -1) {
                if (len === 0) {
                    event.forwardPos = 1;
                } else {
                    overlaps.sort(this.sortOverlaps);

                    first = overlaps[0];
                    // Calculate the forward pos from the backward pos of the first item
                    // in the series. This will be the item with the highest edge weight in
                    // the overlaps collection.
                    this.calculatePositions(first, nextEdgeOffset, backOffset);
                    event.forwardPos = first.backwardPos;
                }

                fwd = event.forwardPos;
                availWidth = fwd - backOffset;
                event.backwardPos = fwd - availWidth / nextEdgeOffset;

                // Start from 1, either we have 0 overlaps or we already calculated it above.
                for (i = 1; i < len; ++i) {
                    this.calculatePositions(overlaps[i], 0, fwd);
                }
            }
        },

        /**
         * Finds events in subsequent columns that have a vertical overlap and tracks
         * them on the event.
         * @param {Object[][]} columns The columns.
         *
         * @private
         */
        constructOverlaps: function(columns) {
            var len = columns.length,
                col, i, j, k, colLen, event;

            for (i = 0; i < len; ++i) {
                col = columns[i];

                for (j = 0, colLen = col.length; j < colLen; ++j) {
                    event = col[j];

                    for (k = i + 1; k < len; ++k) {
                        this.appendOverlappingEvents(event, columns[k])
                    }
                }
            }
        },

        /**
         * Utility method for checking events. Either returns true once
         * it finds an overlap or appends items to an array.
         * 
         * @param {Object} event The event.
         * @param {Object[]} candidates The overlap candidates.
         * @param {Object[]} append If specified, overlapping items will be appended here.
         * @return {Boolean} `true` if there are overlapping events.
         * @private
         */
        doOverlap: function (event, candidates, append) {
            var len = candidates.length,
                ret = false,
                i, other;

            for (i = 0; i < len; ++i) {
                other = candidates[i];

                if (this.overlaps(event, other)) {
                    if (append) {
                        append.push(other);
                        ret = true;
                    } else {
                        return true;
                    }
                }
            }

            return ret;
        },

        /**
         * Checks if overlaps exist between an event and candidates.
         * @param {Object} event The event.
         * @param {Object[]} candidates The candidates.
         * @return {Boolean} `true` if there are overlapping events.
         *
         * @private
         */
        hasOverlappingEvents: function(event, candidates) {
            return this.doOverlap(event, candidates);
        },

        /**
         * Checks whether two events vertically overlap.
         * @param {Object} e1 The first event.
         * @param {Object} e2 The second event.
         * @return {Boolean} `true` if the events overlap.
         *
         * @private
         */
        overlaps: function(e1, e2) {
            return e1.start < e2.end && e1.end > e2.start;
        },

        /**
         * A sort comparator function for processing events.
         * @param {Object} e1 The first event.
         * @param {Object} e2 The second event,
         * @return {Number} A standard sort comparator.
         *
         * @private
         */
        sortEvents: function(e1, e2) {
            return Ext.calendar.model.EventBase.sort(e1.event, e2.event);
        },

        /**
         * A sort comparator function for overlapping events.
         * @param {Object} e1 The first event.
         * @param {Object} e2 The second event,
         * @return {Number} A standard sort comparator.
         *
         * @private
         */
        sortOverlaps: function(e1, e2) {
            // Higher edge weights go first, since are at the start.                
            return e2.edgeWeight - e1.edgeWeight ||
                   // Otherwise sort by events closer to the start edge, giving
                   // precedence to those where the backwardPos hasn't be calculated
                   (e1.backwardPos || 0) - (e2.backwardPos || 0) ||
                   Ext.calendar.model.EventBase.sort(e1.event, e2.event);
            
        }
    }
});
