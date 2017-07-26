Ext.define('Ext.overrides.calendar.view.Weeks', {
    override: 'Ext.calendar.view.Weeks',

    doDestroy: function() {
        this.tip = Ext.destroy(this.tip);
        this.callParent();
    },

    privates: {
        hideOverflowPopup: function() {
            var tip = this.tip;
            if (tip) {
                tip.hide();
                tip.removeAll();
            }
        },

        showOverflowPopup: function(events, date, cell) {
            var me = this,
                tip = me.tip;

            if (!tip) {
                me.tip = tip = new Ext.tip.ToolTip({
                    anchor: true,
                    autoHide: false,
                    ui: 'calendar-overflow',
                    cls: me.$overflowPopupCls,
                    minWidth: 200,
                    border: true
                });
                me.tip.el.on('tap', 'handleEventTap', me, {
                    delegate: '.' + me.$eventCls
                });
            }

            tip.removeAll();
            events = me.createEvents(events, {
                cls: me.$staticEventCls
            });
            tip.add(events);
            tip.el.dom.setAttribute('data-date', Ext.Date.format(date, me.domFormat));
            tip.show();

            tip.showBy(cell, 'tc-bc?', [0, -20]);
        }
    }
});