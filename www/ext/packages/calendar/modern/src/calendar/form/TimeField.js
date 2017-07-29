/**
 * @private
 */
Ext.define('Ext.calendar.form.TimeField', {
    extend: 'Ext.field.Select',
    xtype: 'calendar-timefield',

    config: {
        increment: 15,
        format : 'g:i A',
        minValue: null,
        maxValue: null
    },

    initialize: function() {
        this.callParent();
        this.refreshOptions();
    },

    updateMinValue: function() {
        if (!this.isConfiguring) {
            this.refreshOptions();
        }
    },

    updateMaxValue: function() {
        if (!this.isConfiguring) {
            this.refreshOptions();
        }
    },

    applyValue: function(value) {
        var record = null,
            h, m, range, len, i, item, d;

        if (value) {
            if (value.isModel) {
                value = value.data.value;
            }

            h = value.getHours();
            m = value.getMinutes();

            range = this.getStore().getRange();

            for (i = 0, len = range.length; i < len; ++i) {
                item = range[i];
                d = item.data.value;
                if (h === d.getHours() && m === d.getMinutes()) {
                    record = item;
                    break;
                }
            }
        }
        return record;
    },

    updateValue: function(value) {
        if (value && value.isModel) {
            this.setSelection(value);
            this.setInputValue(value.data.text);
        }
    },

    getValue: function() {
        var value = this.callParent();
        if (value && value.isModel) {
            value = value.data.value;
        }
        return value;
    },

    privates: {
        initDate: new Date(2008, 0, 1),

        refreshOptions: function() {
            var me = this,
                D = Ext.Date,
                min = me.getMinValue(),
                max = me.getMaxValue(),
                increment = me.getIncrement(),
                format = me.getFormat(),
                current = D.clone(this.initDate),
                options = [],
                end;

            if (max) {
                end = D.clone(current);
                end.setHours(max.getHours());
                end.setMinutes(max.getMinutes());
            } else {
                end = D.add(current, D.DAY, 1);
            }

            if (min) {
                current.setHours(min.getHours());
                current.setMinutes(min.getMinutes());
            }

            while (current < end) {
                options.push({
                    value: current,
                    text: D.format(current, format)
                });
                current = D.add(current, D.MINUTE, increment);
            }
            me.setOptions(options);
        }
    }
});
