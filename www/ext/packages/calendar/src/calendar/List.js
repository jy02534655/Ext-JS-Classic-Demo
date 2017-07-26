/**
 * A simple view for displaying a list of calendars.
 */
Ext.define('Ext.calendar.List', {
    extend: 'Ext.calendar.AbstractList',
    xtype: 'calendar-list',

    config: {
        /**
         * @cfg {Boolean} enableToggle
         * `true` to allow the calendar {@link Ext.calendar.model.CalendarBase#setHidden hidden}
         * state to be toggled when tapping on a calendar.
         */
        enableToggle: true
    },

    cls: Ext.baseCSSPrefix + 'calendar-list',

    itemTpl: '<div class="' + 
                 '<tpl if="hidden">' +
                     Ext.baseCSSPrefix + 'calendar-list-item-hidden' +
                 '</tpl>">' +
                 '<div class="' + Ext.baseCSSPrefix + 'calendar-list-icon" style="background-color: {color};"></div>' +
                 '<div class="' + Ext.baseCSSPrefix + 'calendar-list-text">{title:htmlEncode}</div>' +
             '</div>',

    itemSelector: '.' + Ext.baseCSSPrefix + 'calendar-list-item',
    itemCls: Ext.baseCSSPrefix + 'calendar-list-item',
    scrollable: true,

    prepareData: function(data, index, record) {
        return {
            id: record.id,
            editable: record.isEditable(),
            hidden: record.isHidden(),
            color: record.getBaseColor(),
            title: record.getTitle()
        };
    },

    handleItemTap: function(record) {
        if (this.getEnableToggle()) {
            record.setHidden(!record.isHidden());
        }
    }
});