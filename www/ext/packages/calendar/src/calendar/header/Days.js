/**
 * A header for {@link Ext.calendar.view.Days} to display the
 * active dates.
 */
Ext.define('Ext.calendar.header.Days', {
    extend: 'Ext.calendar.header.Base',
    xtype: 'calendar-daysheader',

    /**
     * @cfg {String} format
     * @inheritdoc
     */
    format: 'D m/d',

    compactOptions: {
        format: 'd'
    },

    getElementConfig: function() {
        var result = this.callParent();

        result.cls = this.$tableCls;
        delete result.reference;

        return {
            cls: Ext.baseCSSPrefix + 'calendar-header',
            reference: 'element',
            children: [result]
        };
    },

    privates: {
        headerScrollOffsetName: 'padding-right',
        $gutterCls: Ext.baseCSSPrefix + 'calendar-header-gutter',

        createCells: function() {
            var me = this,
                row = me.row,
                cells = me.callParent();

            row.insertFirst({
                tag: 'td',
                cls: me.$headerCls + ' ' + me.$gutterCls
            });

            row.append({
                tag: 'td',
                style: 'display: none;'
            });
            return cells;
        },

        setOverflowWidth: function(width) {
            this.element.setStyle(this.headerScrollOffsetName, width + 'px');
        }
    }
});