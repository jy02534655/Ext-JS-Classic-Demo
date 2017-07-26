/**
 * A mixin that provides some base behaviors for events. The default
 * implementation is {@link Ext.calendar.model.Event}. To provide
 * a custom implementation, this mixin should be used and the remaining
 * parts of the API need to be implemented.
 */
Ext.define('Ext.calendar.model.EventBase', {
    extend: 'Ext.Mixin',

    requires: [
        'Ext.calendar.date.Range'
    ],

    inheritableStatics: {
        getDaysSpanned: function(start, end) {
            var D = Ext.Date,
                count = 0;

            start = D.clearTime(start, true);
            while (start < end) {
                ++count;
                start = D.add(start, D.DAY, 1, true);
            }
            return count;
        },

        sort: function(a, b) {
            return a.getStartDate().getTime() - b.getStartDate().getTime() ||
                   b.getDuration() - a.getDuration() ||
                   a.getTitle() - b.getTitle();
        }
    },

    /**
     * Checks if this event fully contains a date range.
     * @param {Ext.calendar.date.Range/Date} start The range, or the start date.
     * @param {Date} end The end date. This is not required if a range is passed for start.
     * @return {Boolean} `true` if this event contains a date range.
     */
    containsRange: function(start, end) {
        return this.getRange().containsRange(start, end);
    },

    /**
     * @method getAllDay
     * Gets whether this event is an all day event.
     * @return {Boolean} `true` if this is an all day event.
     *
     * @abstract
     */

    /**
     * Get the calendar for this event.
     * @return {Ext.calendar.model.Calendar} The calendar, `null` if it does
     * not exist.
     */
    getCalendar: function() {
        return this.calendar || null;
    },

    /**
     * @method getCalendarId
     * Get the id for the calendar this event belongs to.
     * @return {Object} The id.
     *
     * @abstract
     */

    /**
     * @method getColor
     * Get a specified color for this event.
     * @return {String} The color.
     *
     * @abstract
     */
    
    /**
     * @method getDescription
     * Gets the description for this event.
     * @return {String} The description.
     *
     * @abstract
     */

    /**
     * @method getDuration
     * Get the duration of this event in minutes.
     * @return {Number} The duration of the event in minutes.
     *
     * @abstract
     */

    /**
     * @method getEndDate
     * Get the end date for this event (including time).
     * The date should be UTC.
     * @return {Date} The end date.
     *
     * @abstract
     */
    
    /**
     * Gets a range for this event,
     * @return {Ext.calendar.date.Range} The range.
     */
    getRange: function() {
        return new Ext.calendar.date.Range(this.getStartDate(), this.getEndDate());
    },

    /**
     * @method getStartDate
     * Get the start date for this event (including time).
     * The date should be UTC.
     * @return {Date} The start date.
     *
     * @abstract
     */

    /**
     * @method getTitle
     * Get the title for this event.
     * @return {String} The title.
     *
     * @abstract
     */
    
    /**
     * Checks if this event is fully contained by the passed range.
     * @param {Ext.calendar.date.Range/Date} start The range, or the start date.
     * @param {Date} end The end date. This is not required if a range is passed for start.
     * @return {Boolean} `true` if this event is fully contained by the passed range.
     */
    isContainedByRange: function(start, end) {
        return this.getRange().isContainedBy(start, end);
    },

    /**
     * @method isEditable
     * Checks if this event is editable. This means that it can be removed
     * or modified via the UI.
     *
     * @abstract
     */

    /**
     * Checks whether this event spans a full day or more.
     * @return {Boolean} `true` if the event is an all day event or spans
     * over 24 hours or more.
     */
    isSpan: function() {
        // Either an all day event, or duration >= 1 day
        return this.getAllDay() || this.getDuration() >= 1440;
    },

    /**
     * Checks if any part of this event occurs within the specified
     * date range.
     * @param {Ext.calendar.date.Range/Date} start The range, or the start date.
     * @param {Date} end The end date. This is not required if a range is passed for start.
     * @return {Boolean} `true` if any part of this events occurs in the range.
     */
    occursInRange: function(start, end) {
        return this.getRange().overlaps(start, end);
    },

    /**
     * @method setAllDay
     * Sets the allDay state of this event.
     * @param {Boolean} allDay The allDay value
     * 
     * @abstract
     */

    /**
     * Sets the calendar of this event. Also sets the underlying
     * {@link setCalendarId calendar id}.
     * @param {Ext.calendar.model.Calendar} calendar The calendar.
     * @param {Boolean} [dirty=true] `false` to not mark this record as dirty. Useful
     * for inferring a calendar id when doing nested loading.
     */
    setCalendar: function(calendar, dirty) {
        dirty = dirty !== false;
        this.calendar = calendar;
        this.setCalendarId(calendar ? calendar.id : null, dirty);
    }

    /**
     * @method setCalendarId
     * Sets the calendar id for this event.
     * @param {Object} calendarId The calendar id.
     * @param {Boolean} [dirty=true] `false` to not mark this record as dirty. Useful
     * for inferring a calendar id when doing nested loading.
     *
     * @abstract
     */

    /**
     * @method setColor
     * Sets the color for this event.
     * @param {String} color The color.
     *
     * @abstract
     */
    
    
    /**
     * @method setData
     * Sets the data for this event in bulk.
     * @param {Object} A set of key value pairs for this event, matching to the
     * property names, eg:
     *
     *      {
     *          color: '#FFF',
     *          startDate: new Date(),
     *          descrption: 'Foo',
     *          title: 'Bar'
     *      }
     *
     * @abstract
     */
    
    /**
     * @method setDescription
     * Sets the description for this event.
     * @param {String} The description.
     *
     * @abstract
     */
    
    /**
     * @method setDuration
     * Sets the duration for this event. Leaves
     * the {@link #getStartDate} unmodified.
     * @param {Number} duration The duration in minutes.
     *
     * @abstract
     */

    /**
     * @method setRange
     * Sets the start and end date for this event.
     * @param {Ext.calendar.date.Range/Date} range The range, or the start date.
     * @param {Date} end The end date (if the first parameter was not the range).
     *
     * @abstract
     */

    /**
     * @method setTitle
     * Sets the title for this event.
     * @param {String} title The title.
     *
     * @abstract
     */
});
