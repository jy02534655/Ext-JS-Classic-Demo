/**
 * This class is used internally by the pivot grid component.
 * @private
 */
Ext.define('Ext.pivot.Row', {
    extend: 'Ext.grid.Row',
    xtype: 'pivotgridrow',

    requires: [
        'Ext.pivot.cell.Group'
    ],

    config: {
        recordInfo: null,
        rowCls: null,
        eventName: null
    },

    summaryDataCls: Ext.baseCSSPrefix + 'pivot-summary-data',
    summaryRowCls: Ext.baseCSSPrefix + 'pivot-grid-group-total',
    grandSummaryRowCls: Ext.baseCSSPrefix + 'pivot-grid-grand-total',

    onRender: function () {
        this.callParent();

        var model = this.getViewModel();

        if (model) {
            model.set('columns', this.getRefOwner().getMatrix().modelInfo);
        }
    },

    destroy: function () {
        this.setRecordInfo(null);
        this.callParent();
    },

    updateRecord: function (record, oldRecord) {
        var me = this,
            info;

        if (me.destroying || me.destroyed) {
            return;
        }

        info = me.getRefOwner().getRecordInfo(record);

        me.setRecordInfo(info);

        if (info) {
            me.setRowCls(info.rowClasses);
            me.setEventName(info.rowEvent);
        }
        me.callParent([record, oldRecord]);
    }
});
