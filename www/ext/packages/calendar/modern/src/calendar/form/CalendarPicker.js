/**
 * A calendar picker component.  Similar to {@link Ext.calendar.List}, the items in the
 * picker will display the title for each source calendar along with a color swatch
 * representing the default color the that calendar's events.
 *
 * The {@link #cfg-store} will be the same {@link Ext.calendar.store.Calendars store}
 * instance used by your target {@link Ext.calendar.view.Base calendar}.
 */
Ext.define('Ext.calendar.form.CalendarPicker', {
    extend: 'Ext.field.Select',
    xtype: 'calendar-calendar-picker',

    cls: Ext.baseCSSPrefix + 'calendar-picker-field',

    floatedPicker: {
        userCls: Ext.baseCSSPrefix + 'calendar-picker-list',
        itemTpl: '<div class="' + Ext.baseCSSPrefix + 'calendar-picker-list-icon" style="background-color: {color};"></div>' +
                 '<span class="' + Ext.baseCSSPrefix + 'calendar-picker-list-text ' + Ext.baseCSSPrefix + 'list-label">{title:htmlEncode}</span>'
    },

    edgePicker: {
        userCls: Ext.baseCSSPrefix + 'calendar-picker-list'
    },

    applyPicker: function(picker, oldPicker) {
        var me = this,
            dv;

        picker = me.callParent([picker, oldPicker]);
        if (picker) {
            if (me.pickerType === 'floated') {
                dv = picker;
            } else {
                dv = picker.items.first();
            }
            dv.prepareData = me.prepareData;
        }
        return picker;
    },

    createEdgePicker: function() {
        var picker = this.callParent();

        picker.slots[0].itemTpl =
            '<div class="' + Ext.baseCSSPrefix + 'picker-item {cls}">' +
                '<div class="' + Ext.baseCSSPrefix + 'calendar-picker-list-icon" style="background-color: {color};"></div>' +
                '<span class="' + Ext.baseCSSPrefix + 'list-label">{title:htmlEncode}</span>' +
            '</div>';

        return picker;
    },

    prepareData: function(data, index, record) {
        return {
            id: record.id,
            title: record.getTitle(),
            color: record.getBaseColor()
        };
    },

    updateValue: function(value, oldValue) {
        var me = this,
            iconEl = me.iconEl,
            record;

        me.callParent([value, oldValue]);

        if (!iconEl) {
            me.iconEl = iconEl = me.bodyElement.createChild({
                cls: Ext.baseCSSPrefix + 'calendar-picker-field-icon'
            });
        }

        record = me.getSelection();
        if (record) {
            iconEl.setDisplayed(true);
            iconEl.setStyle('background-color', record.getBaseColor());
        } else {
            iconEl.setDisplayed(false);
        }
    },

    privates: {
        queryTabletPicker: function(picker) {
            return picker.down('calendar-list');
        }
    }
});
