/**
 * A header for {@link Ext.calendar.view.Weeks} to display day names.
 */
Ext.define('Ext.calendar.header.Weeks', {
    extend: 'Ext.calendar.header.Base',
    xtype: 'calendar-weeksheader',

    /**
     * @cfg {String} format
     * @inheritdoc
     */
    format: 'D',

    privates: {
        useDates: false,
        
        getCreateDays: function() {
            return Ext.Date.DAYS_IN_WEEK;
        },

        onCellCreate: function(cell, index) {
            Ext.fly(cell).toggleCls(this.$hiddenCls, index >= this.getVisibleDays());
        }
    }
});