/**
 * A base panel class for panels with a header a single view.
 * 
 * @private
 */
Ext.define('Ext.calendar.panel.AbstractBase', {
    extend: 'Ext.Panel',

    requires: [
        'Ext.layout.Fit'
    ],

    layout: 'fit',

    autoSize: false,

    initialize: function() {
        var me = this;

        me.callParent();
        if (me.syncHeaderSize) {
            me.element.on('resize', 'handleResize', me);
            // Listen to the refresh event the first time to prevent scrollbar flicker
            me.getView().on('refresh', 'handleRefresh', me, {single: true});
        }
    },

    updateDayHeader: function(dayHeader) {
        if (dayHeader) {
            dayHeader.setDocked('top');
            this.add(dayHeader);
        }
    },

    updateView: function(view) {
        this.add(view);
    },

    privates: {
        handleRefresh: function() {
            this.handleResize();
        },

        handleResize: function() {
            var header = this.getDayHeader();

            if (header) {
                header.setOverflowWidth(this.getView().scrollable.getScrollbarSize().width);
            }
        }
    }
});