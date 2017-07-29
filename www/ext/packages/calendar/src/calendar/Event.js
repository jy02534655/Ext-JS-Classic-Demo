/**
 * Represents an event on a calendar view.
 */
Ext.define('Ext.calendar.Event', {
    extend: 'Ext.calendar.EventBase',
    xtype: 'calendar-event',

    config: {
        /**
         * @cfg {String} timeFormat
         * A display format for the time.
         * @locale
         */
        timeFormat: 'H:i'
    },

    smallSize: 60,

    getElementConfig: function() {
        var cfg = this.callParent();
        cfg.cls = Ext.baseCSSPrefix + 'calendar-event';
        cfg.children = [{
            cls: Ext.baseCSSPrefix + 'calendar-event-inner',
            reference: 'innerElement',
            children: [{
                cls: Ext.baseCSSPrefix + 'calendar-event-time',
                reference: 'timeElement',
                children: [{
                    tag: 'span',
                    reference: 'startElement',
                    cls: Ext.baseCSSPrefix + 'calendar-event-time-start'
                }, {
                    tag: 'span',
                    html: ' - ',
                    reference: 'separatorElement',
                    cls: Ext.baseCSSPrefix + 'calendar-event-time-separator'
                }, {
                    tag: 'span',
                    reference: 'endElement',
                    cls: Ext.baseCSSPrefix + 'calendar-event-time-end'
                }]
            }, {
                reference: 'titleElement',
                tag: 'span',
                cls: Ext.baseCSSPrefix + 'calendar-event-title'
            }, {
                cls: Ext.baseCSSPrefix + 'calendar-event-resizer',
                reference: 'resizerElement'
            }]
        }];
        return cfg;
    },

    updateEndDate: function(date) {
        this.endElement.setText(this.displayDate(date));
        this.calculateSize();
    },

    updateMode: function(mode) {
        var me = this;

        me.addCls(this.modes[mode]);
        if (mode === 'weekinline' || mode === 'weekspan') {
            me.addCls(me.$inlineTitleCls);
        }
    },

    updatePalette: function(palette) {
        var inner = this.innerElement.dom.style,
            mode = this.getMode();

        if (mode === 'weekspan' || mode === 'day') {
            inner.backgroundColor = palette.primary;
            inner.color = palette.secondary;
            if (mode === 'day') {
                this.element.dom.style.borderColor = palette.border;
            }
        } else {
            inner.color = palette.primary;
        }
    },

    updateStartDate: function(date) {
        this.startElement.setText(this.displayDate(date));
        this.calculateSize();
    },

    updateTitle: function(title) {
        title = title || this.getDefaultTitle();
        this.titleElement.setText(title);
    },

    privates: {
        $inlineTitleCls: Ext.baseCSSPrefix + 'calendar-event-inline-title',

        modes: {
            day: Ext.baseCSSPrefix + 'calendar-event-day',
            weekspan: Ext.baseCSSPrefix + 'calendar-event-week-span',
            weekinline: Ext.baseCSSPrefix + 'calendar-event-week-inline'
        },

        calculateSize: function() {
            var me = this,
                start = me.getStartDate(),
                end = me.getEndDate(),
                ms = me.getView().MS_TO_MINUTES,
                isDay = me.getMode() === 'day',
                small;

            if (!isDay || (start && end)) {
                small = !isDay || ((end - start) <= me.smallSize * ms);
                me.element.toggleCls(me.$inlineTitleCls, small);
            }
        },

        displayDate: function(d) {
            if (d) {
                d = this.getView().utcToLocal(d);
                return Ext.Date.format(d, this.getTimeFormat());
            }
        }
    }
});
