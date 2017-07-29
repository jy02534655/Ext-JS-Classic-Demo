/**
 * For an overview of calendar views see {@link Ext.calendar.view.Base}
 *
 * The Day view operates the same as its parent {@link Ext.calendar.view.Days Days} view
 * with one notable difference: the {@link #cfg-visibleDays} for the Day view is `1`
 * resulting in only a single day displayed at a time.
 *
 * ### Alternative Classes
 *
 * If your view requires a header showing the date displayed consider using
 * {@link Ext.calendar.panel.Day} instead.  To display more than a single day consider
 * using the {@link Ext.calendar.view.Days} or {@link Ext.calendar.view.Week} views.
 */
Ext.define('Ext.calendar.view.Day', {
    extend: 'Ext.calendar.view.Days',
    xtype: 'calendar-dayview',

    config: {
        compactOptions: {
            displayOverlap: true
        },

        visibleDays: 1
    },

    privates: {
        getMoveInterval: function() {
            return {
                unit: Ext.Date.DAY,
                amount: 1
            };
        }
    }
});
