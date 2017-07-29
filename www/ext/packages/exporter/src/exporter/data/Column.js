/**
 * This class implements a table column definition
 */
Ext.define('Ext.exporter.data.Column', {
    extend: 'Ext.exporter.data.Base',

    config:{
        /**
         * @cfg {Ext.exporter.data.Table} table
         *
         * Reference to the parent table object
         *
         * @private
         */
        table: null,
        /**
         * @cfg {String} text
         *
         * Column's text header
         *
         */
        text: null,
        /**
         * @cfg {Ext.exporter.file.Style} style
         *
         * Column's style. Use this to add special formatting to the exported document.
         *
         */
        style: null,
        /**
         * @cfg {Number} width
         *
         * Column's width
         *
         */
        width: null,
        /**
         * @cfg {Number} mergeAcross
         *
         * Specifies how many cells need to be merged from the current position to the right
         *
         * @readOnly
         */
        mergeAcross: null,
        /**
         * @cfg {Number} mergeDown
         *
         * Specifies how many cells need to be merged from the current position to the bottom
         *
         * @readOnly
         */
        mergeDown: null,
        /**
         * @cfg {Number} level
         *
         * Column's level
         *
         * @readOnly
         */
        level: 0,
        /**
         * @cfg {Number} index
         *
         * Column's index
         *
         * @readOnly
         */
        index: null,
        /**
         * @cfg {Ext.exporter.data.Column[]} columns
         *
         * Collection of children columns
         *
         */
        columns: null
    },

    destroy: function() {
        this.setTable(null);
        this.callParent();
    },

    updateTable: function(table){
        var cols = this.getColumns(),
            i, length;

        if(cols){
            length = cols.length;
            for(i = 0; i < length; i++){
                cols.getAt(i).setTable(table);
            }
        }
    },

    applyColumns: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Column');
    },

    updateColumns: function(collection, oldCollection){
        var me = this;

        if(oldCollection){
            oldCollection.un({
                add: me.onColumnAdd,
                remove: me.onColumnRemove,
                scope: me
            });
            Ext.destroy(oldCollection.items, oldCollection);
        }
        if(collection){
            collection.on({
                add: me.onColumnAdd,
                remove: me.onColumnRemove,
                scope: me
            });
            me.onColumnAdd(collection, {items: collection.getRange()});
        }
    },

    sync: function(level, depth){
        var me = this,
            count = me.getColumnCount() - 1,
            cols = me.getColumns(),
            i, length, down;

        me.setLevel(level);
        if(cols) {
            length = cols.length;
            for (i = 0; i < length; i++) {
                cols.items[i].sync(level + 1, depth);
            }
            me.setMergeDown(null);
        }else{
            down = depth - level;
            me.setMergeDown(down > 0 ? down : null);
        }
        me.setMergeAcross(count > 0 ? count : null);
    },

    onColumnAdd: function(collection, details){
        var items = details.items,
            length = items.length,
            table = this.getTable(),
            i, item;

        for(i = 0; i < length; i++) {
            item = items[i];
            item.setTable(table);
        }

        if(table) {
            table.syncColumns();
        }
    },

    onColumnRemove: function(collection, details){
        var table = this.getTable();

        Ext.destroy(details.items);
        if(table) {
            table.syncColumns();
        }
    },

    getColumnCount: function(columns){
        var s = 0,
            cols;

        if (!columns) {
            columns = this.getColumns();
            if(!columns){
                return 1;
            }
        }

        for (var i = 0; i < columns.length; i++) {
            cols = columns.getAt(i).getColumns();
            if (!cols) {
                s += 1;
            } else {
                s += this.getColumnCount(cols);
            }
        }

        return s;
    },

    /**
     * Convenience method to add columns.
     * @param {Object/Array} config
     * @return {Ext.exporter.data.Column/Ext.exporter.data.Column[]}
     */
    addColumn: function(config){
        if(!this.getColumns()){
            this.setColumns([]);
        }
        return this.getColumns().add(config || {});
    },

    /**
     * Convenience method to fetch a column by its id.
     * @param id
     * @return {Ext.exporter.data.Column}
     */
    getColumn: function(id){
        return this.getColumns().get(id);
    }

});