/**
 * Date utility methods.
 */
Ext.define('Ext.calendar.date.Util', {
    singleton: true,

    /**
     * Clear the time portion of a date as UTC.
     * @param {Date} d The date.
     * @param {Boolean} [clone=false] `true` to create a copy of the passed date
     * and not modify it directly.
     * @return {Date} The date. This will be the original date instance if
     * `clone` was not set.
     */
    clearTimeUtc: function(d, clone) {
        if (clone) {
            d = Ext.Date.clone(d);
        }

        d.setUTCHours(0);
        d.setUTCMinutes(0);
        d.setUTCSeconds(0);
        d.setUTCMilliseconds(0);

        return d;
    },

    privates: {
        getDefaultTimezoneOffset: function() {
            return (new Date()).getTimezoneOffset();
        },

        /**
         * Get the current local date.
         * @return {Date} The date.
         *
         * @private
         */
        getLocalNow: function() {
            // Could be useful for overriding with testing.
            return new Date();
        },

        /**
         * Expand a date range via UTC, set the start to 0 hours, set the end to 0 hours (if needed).
         * @param {Ext.calendar.date.Range} range The range.
         * @return {Ext.calendar.date.Range} The new range.
         *
         * @private
         */
        expandRange: function(range) {
            var D = Ext.Date,
                start = range.start,
                end = range.end;

            start = D.clone(start);
            start.setUTCHours(0);

            if (end.getUTCHours() !== 0) {
                // Move to the next day
                end = D.clone(end);
                end.setUTCHours(24);
            }

            return new Ext.calendar.date.Range(start, end);
        }
    }
});