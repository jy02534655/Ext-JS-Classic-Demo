/**
 * This class is used internally by the pivot grid component.
 * @private
 */
Ext.define('Ext.pivot.cell.Cell', {
    extend: 'Ext.grid.cell.Cell',
    xtype: 'pivotgridcell',

    config: {
        eventCell: true,
        collapsible: null
    },

    // outline view css classes
    outlineGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-outline',
    outlineCellHiddenCls: Ext.baseCSSPrefix + 'pivot-grid-outline-cell-hidden',
    outlineCellGroupExpandedCls: Ext.baseCSSPrefix + 'pivot-grid-outline-cell-previous-expanded',

    // compact view css classes
    compactGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-compact',
    compactLayoutPadding: 25,

    // tabular view css classes
    tabularGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-tabular',

    encodeHtml: false,

    onRender: function () {
        var me = this,
            dataIndex = me.dataIndex,
            model = me.getViewModel(),
            record = me.getRecord(),
            matrix;

        me.callParent();

        if (model && dataIndex) {
            matrix = me.row.getGrid().getMatrix();
            model.setData({
                column: matrix.modelInfo[dataIndex] || {},
                value: me.getValue(),
                record: record
            });
        }
    },

    handleEvent: function(type, e){
        var me = this,
            row = me.row,
            grid = row.getGrid(),
            record = me.getRecord(),
            params = {
                grid: grid
            },
            info, eventName, ret, column, leftKey, topKey,
            matrix, leftItem, topItem;

        if(!record){
            return;
        }

        eventName = row.getEventName() || '';

        info = row.getRecordInfo(record);
        matrix = grid.getMatrix();
        column = me.getColumn();

        leftItem = info.rendererParams[column._dataIndex];
        if(!leftItem){
            leftItem = info.rendererParams['topaxis'];
        }
        leftItem = leftItem ? leftItem.group : null;
        leftKey = leftItem ? leftItem.key : info.leftKey;

        Ext.apply(params, {
            cell: me,
            leftKey: leftKey,
            leftItem: leftItem,
            column: column
        });

        if (me.getEventCell()) {
            eventName += 'cell';
            topKey = grid.getTopAxisKey(params.column);
            params.topKey = topKey;

            if(topKey){
                topItem = matrix.topAxis.findTreeElement('key', topKey);
                topItem = topItem ? topItem.node : null;

                if(topItem) {
                    Ext.apply(params, {
                        topItem: topItem,
                        dimensionId: topItem.dimensionId
                    });
                }
            }
        }

        ret = grid.fireEvent(eventName + type, params, e);

        if(ret !== false && type == 'tap' && me.getCollapsible()){
            if(leftItem.expanded){
                leftItem.collapse();
            }else{
                leftItem.expand();
            }
        }
        return false;
    },

    updateRecord: function (record, oldRecord) {
        var model = this.getViewModel();

        this.callParent([ record, oldRecord ]);

        if (model) {
            model.setData({
                value: this.getValue(),
                record: record
            });
        }
    }
});
