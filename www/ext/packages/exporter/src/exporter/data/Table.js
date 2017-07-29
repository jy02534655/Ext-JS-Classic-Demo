/**
 * This class implements the data structure required by an exporter.
 */
Ext.define('Ext.exporter.data.Table', {
    extend: 'Ext.exporter.data.Group',

    requires: [
        'Ext.exporter.data.Column'
    ],

    isDataTable: true,

    config: {
        /**
         * @cfg {Ext.exporter.data.Column[]} columns
         *
         * Collection of columns that need to be exported.
         *
         */
        columns: null

        /**
         * @cfg {Ext.exporter.data.Row[]} rows
         *
         * Table's rows
         *
         */

        /**
         * @cfg {Ext.exporter.data.Row[]} summaries
         *
         * Table's summaries
         *
         */

        /**
         * @cfg {Ext.exporter.data.Group[]} groups
         *
         * Collection of groups that need to be exported.
         *
         */
    },

    autoGenerateId: false,

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
            me.syncColumns();
        }
    },

    syncColumns: function(){
        var cols = this.getColumns(),
            depth = this.getColDepth(cols, -1),
            result = {},
            i, j, length, len, keys, arr, prevCol, index;

        if(!cols){
            return;
        }
        length = cols.length;
        for(i = 0; i < length; i++){
            cols.items[i].sync(0, depth);
        }
        this.getColumnLevels(cols, depth, result);
        keys = Ext.Object.getKeys(result);
        length = keys.length;

        for(i = 0; i < length; i++){
            arr = result[keys[i]];
            len = arr.length;
            for(j = 0; j < len; j++){
                if(j === 0){
                    index = 1;
                }else if(arr[j - 1]) {
                    prevCol = arr[j - 1].getConfig();
                    index += (prevCol.mergeAcross ? prevCol.mergeAcross + 1 : 1);
                }else{
                    index++;
                }
                if(arr[j]){
                    arr[j].setIndex(index);
                }
            }
        }
    },

    getLeveledColumns: function(){
        var cols = this.getColumns(),
            depth = this.getColDepth(cols, -1),
            result = {};

        this.getColumnLevels(cols, depth, result, true);
        return result;
    },

    /**
     * Fetch all bottom columns from the `columns` hierarchy.
     *
     * @return {Ext.exporter.data.Column[]}
     */
    getBottomColumns: function(){
        var result = this.getLeveledColumns(),
            keys, len;

        keys = Ext.Object.getKeys(result);
        len = keys.length;

        return len ? result[keys[keys.length - 1]] : [];
    },

    getColumnLevels: function(columns, depth, result, topDown){
        var col, i, j, len, name, level, cols;

        if (!columns) {
            return;
        }

        len = columns.length;
        for (i = 0; i < len; i++) {
            col = columns.items[i];
            level = col.getLevel();
            cols = col.getColumns();

            name = 's' + level;
            result[name] = result[name] || [];
            result[name].push(col);

            if(!cols) {
                for (j = level + 1; j <= depth; j++) {
                    name = 's' + j;
                    result[name] = result[name] || [];
                    result[name].push(topDown ? col : null);
                }
            }else{
                this.getColumnLevels(cols, depth, result, topDown);
            }
        }
    },

    onColumnAdd: function(collection, details){
        var items = details.items,
            length = items.length,
            i, item;

        for(i = 0; i < length; i++) {
            item = items[i];
            item.setTable(this);
        }
        this.syncColumns();
    },

    onColumnRemove: function(collection, details){
        Ext.destroy(details.items);
        this.syncColumns();
    },

    getColumnCount: function(){
        var cols = this._columns,
            s = 0,
            i, length;

        if(cols) {
            length = cols.length;
            for (i = 0; i < length; i++) {
                s += cols.items[i].getColumnCount();
            }
        }
        return s;
    },

    getColDepth: function(columns, level){
        var m = 0,
            len;

        if (!columns) {
            return level;
        }

        len = columns.length;
        for (var i = 0; i < len; i++) {
            m = Math.max(m, this.getColDepth(columns.items[i]._columns, level + 1));
        }

        return m;
    },

    /**
     * Convenience method to add columns.
     * @param {Object/Array} config
     * @return {Ext.exporter.data.Column/Ext.exporter.data.Column[]}
     */
    addColumn: function(config){
        if(!this._columns){
            this.setColumns([]);
        }
        return this._columns.add(config || {});
    },

    /**
     * Convenience method to fetch a column by its id.
     * @param id
     * @return {Ext.exporter.data.Column}
     */
    getColumn: function(id){
        return this._columns ? this._columns.get(id) : null;
    }

});
