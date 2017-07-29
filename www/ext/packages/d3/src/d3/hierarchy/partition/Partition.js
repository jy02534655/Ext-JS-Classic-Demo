/**
 * Abstract class for D3 components
 * with the [Partition layout](https://github.com/mbostock/d3/wiki/Partition-Layout).
 */
Ext.define('Ext.d3.hierarchy.partition.Partition', {
    extend: 'Ext.d3.hierarchy.Hierarchy',
    xtype: 'd3-partition',

    config: {
        partitionCls: 'partition',

        nodeValue: function (record) {
            return record.isExpanded() && record.childNodes ? 0 : 1;
        }
    },

    updatePartitionCls: function (partitionCls, oldPartitionCls) {
        var baseCls = this.baseCls,
            el = this.element;

        if (partitionCls && Ext.isString(partitionCls)) {
            el.addCls(partitionCls, baseCls);
            if (oldPartitionCls) {
                el.removeCls(oldPartitionCls, baseCls);
            }
        }
    },

    applyLayout: function () {
        return d3.partition();
    },

    /**
     * Resets the zoom back to the root node.
     * @param {Boolean} [instantly] If set to `true`, the animation is skipped.
     */
    resetZoom: function (instantly) {
        var me = this,
            store = me.getStore(),
            root = store && store.getRoot();

        me.zoomInNode(root, instantly);
    }

});