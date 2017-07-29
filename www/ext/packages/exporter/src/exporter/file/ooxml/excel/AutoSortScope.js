/**
 * Represents the sorting scope for the PivotTable.
 *
 * (CT_AutoSortScope)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.AutoSortScope', {
    extend: 'Ext.exporter.file.ooxml.Base',

    requires: [
        'Ext.exporter.file.ooxml.excel.PivotArea'
    ],

    config: {
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotArea} pivotArea
         *
         * PivotArea where sorting applies to.
         */
        pivotArea: {}
    },

    tpl: [
        '<autoSortScope>{[values.pivotArea.render()]}</autoSortScope>'
    ],

    destroy: function(){
        this.setPivotArea(null);
        this.callParent();
    },

    applyPivotArea: function(data){
        if(!data || data.isInstance){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.PivotArea(data);
    },

    updatePivotArea: function(data, oldData){
        Ext.destroy(oldData);
    }
});