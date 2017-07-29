/**
 * A base class for the calendar view.
 *
 * @private
 */
Ext.define('Ext.calendar.AbstractList', {
    extend: 'Ext.view.View',

    updateNavigationModel: function(navigationModel, oldNavigationModel) {
        navigationModel.focusCls = '';
    },

    onItemClick: function(record, item, index, e) {
        this.callParent([record, item, index, e]);
        this.handleItemTap(record);
    }
})