/**
 * A base class for the calendar view.
 *
 * @private
 */
Ext.define('Ext.calendar.AbstractList', {
    extend: 'Ext.dataview.DataView',

    onChildTap: function(context) {
        this.callParent([context]);
        this.handleItemTap(context.record);
    }
});