Ext.define('Ext.overrides.calendar.view.Weeks', {
    override: 'Ext.calendar.view.Weeks',

    requires: [
        'Ext.calendar.form.Edit',
        'Ext.calendar.form.Add'
    ],

    doDestroy: function() {
        this.tip = Ext.destroy(this.tip);
        this.callParent();
    },

    privates: {
        doRefresh: function() {
            this.callParent();
            this.updateLayout();
        },
        
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
                    ui: 'calendar-overflow',
                    anchor: true,
                    renderTo: document.body,
                    hidden: true,
                    autoHide: false,
                    cls: me.$overflowPopupCls,
                    minWidth: 200,
                    defaultAlign: 'tc-bc?'
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
            tip.showBy(cell);
        }
    }
});