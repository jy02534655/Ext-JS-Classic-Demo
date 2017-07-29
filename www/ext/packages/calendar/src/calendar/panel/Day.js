/**
 * For an overview of calendar panels see {@link Ext.calendar.panel.Base}
 *
 * A panel for display a single day. Composes a 
 * {@link Ext.calendar.view.Day Day View} with a
 * {@link Ext.calendar.header.Base docked header}.
 *
 * The Day panel operates the same as its parent {@link Ext.calendar.panel.Days Days}
 * panel with one notable difference: the {@link #cfg-visibleDays} for the Day panel is
 * `1` resulting in only a single day displayed at a time.
 *
 * ### Alternative Classes
 *
 * To display more than a single day consider using the {@link Ext.calendar.panel.Days}
 * or {@link Ext.calendar.panel.Week} views.
 */
Ext.define('Ext.calendar.panel.Day', {
    extend: 'Ext.calendar.panel.Days',
    xtype: 'calendar-day',

    requires: [
        'Ext.calendar.view.Day'
    ],

    config: {
        view: {
            xtype: 'calendar-dayview'
        }
    }

    /**
     * @cfg visibleDays
     * @inheritdoc Ext.calendar.view.Days#cfg!visibleDays
     */
});
