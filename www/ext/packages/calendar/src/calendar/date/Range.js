/**
 * Utility class for dealing with date ranges.
 */
Ext.define('Ext.calendar.date.Range', {

    /**
     * @property {Date} end
     * The end of this range.
     */
    end: null,

    /**
     * @property {Date} start
     * The start of this range.
     */
    start: null,

    isRange: true,

    statics: {
        fly: (function () {
            var range = null;
            return function (start, end) {
                if (start.isRange) {
                    return start;
                }

                if (!range) {
                    range = new Ext.calendar.date.Range();
                }
                range.start = start;
                range.end = end;
                return range;
            }
        })()
    },

    /**
     * @constructor
     * @param {Date} start The start date.
     * @param {Date} end The end date.
     */
    constructor: function(start, end) {
        this.start = start;
        this.end = end;
    },

    /**
     * Clone this range.
     * @return {Ext.calendar.date.Range} The new range.
     */
    clone: function() {
        var D = Ext.Date,
            T = this.self;

        return new T(D.clone(this.start), D.clone(this.end));
    },

    /**
     * Checks if this range contains a date.
     * @param {Date} d The date.
     * @return {Boolean} `true` if this date is contained in the range.
     */
    contains: function(d) {
        return this.start <= d && d <= this.end;
    },

    /**
     * Checks if this range fully contains another range (inclusive).
     * @param {Ext.calendar.date.Range/Date} start The range, or the start date.
     * @param {Date} end The end date. This is not required if a range is passed for start.
     * @return {Boolean} `true` if this range fully contains another range.
     */
    containsRange: function(start, end) {
        var other = this.self.fly(start, end);
        return other.start >= this.start && other.end <= this.end;
    },

    /**
     * Checks if this range equals another range.
     * @param {Ext.calendar.date.Range/Date} start The range, or the start date.
     * @param {Date} end The end date. This is not required if a range is passed for start.
     * @return {Boolean} `true` if this range equals another range.
     */
    equals: function(start, end) {
        if (!start) {
            return false;
        }

        var other = this.self.fly(start, end);
        return this.start.getTime() === other.start.getTime() &&
               this.end.getTime() === other.end.getTime();
    },

    /**
     * Get the duration of this range in milliseconds.
     * @return {Number} The duration.
     */
    getDuration: function() {
        return this.end.getTime() - this.start.getTime();
    },

    /**
     * Checks if this range is fully contained by another range.
     * @param {Ext.calendar.date.Range/Date} start The range, or the start date.
     * @param {Date} end The end date. This is not required if a range is passed for start.
     * @return {Boolean} `true` if this range fully is fully contained by another range.
     */
    isContainedBy: function(start, end) {
        var other = this.self.fly(start, end);
        return other.containsRange(this);
    },

    /**
     * Checks if any part of this range overlaps another range.
     * @param {Ext.calendar.date.Range/Date} start The range, or the start date.
     * @param {Date} end The end date. This is not required if a range is passed for start.
     * @return {Boolean} `true` if this range overlaps any part of the other range.
     */
    overlaps: function(start, end) {
        var other = this.self.fly(start, end);
        return other.start < this.end && this.start < other.end;
    }
});