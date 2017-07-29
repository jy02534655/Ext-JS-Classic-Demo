/**
 * For an overview of calendar views see {@link Ext.calendar.view.Base}
 *
 * The Month view shows events over an entire month.  The view shows a summary of the
 * events that occur on each day.  The month view uses the current date (or the date set
 * on the {@link #value} config) to determine the month to show.
 *
 * The Month view displays (as needed) days from trailing/leading months as required to
 * fill the space in the view based on the {@link #value} and the
 * {@link #firstDayOfWeek}.  In the following example, the view will start on Sun Dec
 * 27 and conclude on Sat Feb 6 because we require 6 rows to display the month of
 * January.
 *
 *      {
 *          value: new Date(2010, 0, 1) // Fri
 *          firstDayOfWeek: 0 // Sunday
 *      }
 *
 * The {@link #visibleWeeks} can be specified as `null` to allow the view to
 * calculate the appropriate number of rows to show in the view, as this varies
 * from month to month.  This defaults to the largest possible value (6 weeks) so that
 * the view size is consistent across months.
 *
 * ### Date Range Navigation
 *
 * In addition to {@link #navigate}, {@link #movePrevious}, and
 * {@link #moveNext} the Month view let you quickly navigate between months and
 * years.  The {@link #previousMonth} and {@link #nextMonth} methods allow for
 * programmatic month-to-month navigation while {@link #previousYear} and
 * {@link #nextYear} navigate the view across years.
 *
 * ### Alternative Classes
 *
 * If your view requires a header showing the days of the week consider using
 * {@link Ext.calendar.panel.Weeks} instead.  For a multi-week view refer to
 * {@link Ext.calendar.view.Weeks}.
 */
Ext.define('Ext.calendar.view.Month', {
    extend: 'Ext.calendar.view.Weeks',
    xtype: 'calendar-monthview',

    config: {
        /**
         * @cfg {Date} [value=new Date()]
         * The current month to show. The value will default to the 
         * first date of the configured month.  For example:
         *
         *      calendar.setValue(new Date(2010, 0, 13));
         *      console.log(calendar.getValue()); // -> 2010-01-01
         */
        value: undefined,
        
        /**
         * @cfg {Number} [visibleWeeks=6]
         * The number of weeks to show in this view. If specified as `null`, the view will generate the appropriate
         * number of rows to display a full month based on the passed {@link #cfg!value}. In a majority of cases,
         * this will be 5, however some months will only require 4, while others will need 6. Defaults to the
         * largest value to keep the view size consistent.
         */
        visibleWeeks: 6
    },

    /**
     * Move forward by a number of months.
     * @param {Number} [months=1] The number of months to move.
     */
    nextMonth: function(months) {
        this.navigate(this.getNavigateValue(months), Ext.Date.MONTH);
    },

    /**
     * Move forward by a number of years.
     * @param {Number} [years=1] The number of years to move.
     */
    nextYear: function(years) {
        this.navigate(this.getNavigateValue(years), Ext.Date.YEAR);
    },

    /**
     * Move backward by a number of months.
     * @param {Number} [months=1] The number of months to move.
     */
    previousMonth: function(months) {
        this.navigate(-this.getNavigateValue(months), Ext.Date.MONTH);
    },

    /**
     * Move backward by a number of years.
     * @param {Number} [years=1] The number of years to move.
     */
    previousYear: function(years) {
        this.navigate(-this.getNavigateValue(years), Ext.Date.YEAR);
    },

    privates: {
        displayRangeProp: 'month',

        /**
         * @property {Number} maxWeeks
         * The maximum amount of weeks to be shown 
         *
         * @private
         */
        maxWeeks: 6,

        /**
         * @property {String[]} rowClasses
         * The row classes for the view when they are to be displayed as 
         * @private
         */
        $rowClasses: [
            Ext.baseCSSPrefix + 'calendar-month-4weeks',
            Ext.baseCSSPrefix + 'calendar-month-5weeks',
            Ext.baseCSSPrefix + 'calendar-month-6weeks'
        ],

        trackRanges: true,

        /**
         * Calculate the relevant date ranges given the current value.
         * @param {Date} [start] The start to recalculate from. Defaults to the current value.
         * @return {Object} The active values.
         * @return {Ext.calendar.date.Range} return.visible The visible date range.
         * @return {Ext.calendar.date.Range} return.active The active range for the view.
         * @return {Ext.calendar.date.Range} return.month The month range for the view.
         * @return {Number} return.requireWeeks The number of weeks in the current view.
         *
         * @private
         */
        doRecalculate: function(start) {
            var me = this,
                D = Ext.Date,
                daysInWeek = D.DAYS_IN_WEEK,
                firstDayOfWeek = me.getFirstDayOfWeek(),
                requiredWeeks = me.maxWeeks,
                visibleWeeks = me.getVisibleWeeks(),
                visibleDays = me.getVisibleDays(),
                R = Ext.calendar.date.Range,
                days, end, first, l, last, startOffset;

            start = D.getFirstDateOfMonth(start || me.getValue());
            // The number of days before the value date to reach the previous firstDayOfWeek
            startOffset = (start.getDay() + daysInWeek - firstDayOfWeek) % daysInWeek;

            first = me.toUtcOffset(start);

            l = D.getLastDateOfMonth(start);
            last = me.toUtcOffset(l);

            // A null value means we need to figure out how many weeks we need
            if (visibleWeeks === null) {
                if (startOffset >= visibleDays) {
                    startOffset = visibleDays - startOffset;
                }
                days = startOffset + D.getDaysInMonth(start);
                requiredWeeks = Math.ceil(days / daysInWeek);
            }

            end = daysInWeek * requiredWeeks - (daysInWeek - visibleDays);

            start = D.subtract(first, D.DAY, startOffset, true);
            end = D.add(start, D.DAY, end, true);

            return {
                // For compat with day views
                full: new R(start, end),
                visible: new R(start, end),
                active: new R(start, D.subtract(end, D.DAY, 1, true)),
                month: new R(first, last),
                requiredWeeks: requiredWeeks
            };
        },

        doRefresh: function() {
            var me = this,
                cls = me.$rowClasses,
                weeks = me.dateInfo.requiredWeeks;

            me.element.replaceCls(cls, cls[weeks - 1 - cls.length]);

            me.callParent();
        },

        getMoveBaseValue: function() {
            return this.utcToLocal(this.dateInfo.month.start);
        },

        getMoveInterval: function() {
            return {
                unit: Ext.Date.MONTH,
                amount: 1
            };
        },

        generateCells: function() {
            // Always generate the max number of cells and we'll hide/show as needed.
            return this.callParent([this.maxWeeks, false]);
        },

        /**
         * Gets the value to navigate by, if no value is specified then
         * it will default to `1`.
         * @param {Number} n Get the value to navigate by.
         * @return {Number} The value to navigate by, `1` if no value is passed.
         *
         * @private
         */
        getNavigateValue: function(n) {
            return n || n === 0 ? n : 1;
        }
    }
});
