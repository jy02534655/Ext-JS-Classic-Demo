Ext.define('Ext.overrides.calendar.view.Days', {
    override: 'Ext.calendar.view.Days',

    requires: [
        'Ext.calendar.form.Edit',
        'Ext.calendar.form.Add'
    ],

    privates: {
        doRefresh: function() {
            this.setBodyWrapSize();
            this.callParent();
            this.updateLayout();
        },

        doRefreshEvents: function() {
            var me = this,
                bodyWrap = me.bodyWrap;

            me.callParent();
            me.setBodyWrapSize();
            me.syncHeaderScroll();
            // private
            me.fireEvent('eventrefresh', me, {});
        },

        setBodyWrapSize: function() {
            var tableWrap = this.tableWrap,
                bodyWrap = this.bodyWrap,
                tableHeight;

            if (Ext.isIE10m) {
                tableHeight = Ext.fly(tableWrap.dom.parentNode).getHeight();
                tableWrap.setHeight(tableHeight);
                bodyWrap.setHeight(tableHeight - this.headerWrap.getHeight());
            }
        }
    }
});