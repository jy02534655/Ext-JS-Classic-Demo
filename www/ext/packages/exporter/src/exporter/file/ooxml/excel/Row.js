/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Row', {
    extend: 'Ext.exporter.file.Base',

    requires: [
        'Ext.exporter.file.ooxml.excel.Cell'
    ],

    config: {
        /**
         * @cfg {Boolean} [collapsed]
         *
         * `true` if the rows 1 level of outlining deeper than the current row are in the collapsed outline state.
         * It means that the rows which are 1 outline level deeper (numerically higher value) than the current
         * row are currently hidden due to a collapsed outline state.
         *
         * It is possible for collapsed to be false and yet still have the rows in question hidden. This can
         * be achieved by having a lower outline level collapsed, thus hiding all the child rows.
         */
        collapsed: null,
        /**
         * @cfg {Boolean} [hidden=false]
         *
         * `true` if the row is hidden, e.g., due to a collapsed outline or by manually selecting and hiding a row.
         */
        hidden: null,
        /**
         * @cfg {Number} [height]
         *
         * Row height measured in point size. There is no margin padding on row height.
         */
        height: null,
        /**
         * @cfg {Number} [outlineLevel]
         *
         * Outlining level of the row, when outlining is on.
         */
        outlineLevel: null,
        /**
         * @cfg {Boolean} [showPhonetic]
         *
         * `true` if the row should show phonetic.
         */
        showPhonetic: null,
        /**
         * @cfg {String} index
         *
         * Row index. Indicates to which row in the sheet this row definition corresponds.
         */
        index: null,
        /**
         * @cfg {String} [styleId]
         *
         * Index to style record for the row
         */
        styleId: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Worksheet} worksheet
         *
         * Reference to the parent worksheet
         */
        worksheet: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Cell[]} cells
         *
         * Collection of cells available on this row.
         */
        cells: [],
        cachedCells: null
    },

    tpl: [
        '<row',
        '<tpl if="index"> r="{index}"</tpl>',
        '<tpl if="collapsed"> collapsed="{collapsed}"</tpl>',
        '<tpl if="hidden"> hidden="1"</tpl>',
        '<tpl if="height"> ht="{height}" customHeight="1"</tpl>',
        '<tpl if="outlineLevel"> outlineLevel="{outlineLevel}"</tpl>',
        '<tpl if="styleId"> s="{styleId}" customFormat="1"</tpl>',
        '<tpl if="cachedCells">',
        '>{cachedCells}</row>',
        '<tpl elseif="cells && cells.length">',
        '><tpl for="cells.items">{[values.render()]}</tpl></row>',
        '<tpl else>',
        '/>',
        '</tpl>'
    ],

    lastCellIndex: 1,

    constructor: function(config){
        var cfg = config;

        if(Ext.isArray(config)){
            cfg = {
                cells: config
            };
        }
        return this.callParent([cfg]);
    },

    destroy: function() {
        this.setWorksheet(null);
        this.callParent();
    },

    applyCells: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Cell');
    },

    updateCells: function(collection, oldCollection){
        var me = this;

        if(oldCollection){
            collection.un({
                add: me.onCellAdd,
                remove: me.onCellRemove,
                scope: me
            });
        }
        if(collection){
            collection.on({
                add: me.onCellAdd,
                remove: me.onCellRemove,
                scope: me
            });
            me.onCellAdd(collection, {items: collection.getRange()});
        }
    },

    onCellAdd: function(collection, details){
        var items = details.items,
            length = items.length,
            i, item, index;

        for(i = 0; i < length; i++) {
            item = items[i];
            item.setRow(this);
            index = item._index;

            if(!index){
                item.setIndex(this.lastCellIndex++);
            }else{
                this.lastCellIndex = Math.max(collection.length, index) + 1;
            }
        }
    },

    onCellRemove: function(collection, details){
        Ext.destroy(details.items);
        this.updateCellIndexes();
    },

    /**
     * Convenience method to add cells.
     * @param {Object/Array} config
     * @return {Ext.exporter.file.ooxml.excel.Cell/Ext.exporter.file.ooxml.excel.Cell[]}
     */
    addCell: function(config){
        if(!this._cells){
            this.setCells([]);
        }
        return this._cells.add(config || {});
    },

    /**
     * Convenience method to fetch a cell by its id.
     * @param id
     * @return {Ext.exporter.file.ooxml.excel.Cell}
     */
    getCell: function(id){
        return this._cells ? this._cells.get(id) : null;
    },

    beginCellRendering: function(){
        var me = this;

        me.tempCells = [];
        me.startCaching = true;
        me.lastCellIndex = 1;

        if(!me.cachedCell) {
            me.cachedCell = new Ext.exporter.file.ooxml.excel.Cell({
                row: me
            });
            me.cachedCellConfig = me.cachedCell.getConfig();
            me.cachedCellConfig.id = null;
        }
    },

    endCellRendering: function(){
        var me = this;

        me.setCachedCells(me.tempCells.join(''));
        me.tempCells = null;
        me.startCaching = false;
        me.lastCellIndex = 1;
    },

    renderCells: function(cells){
        var me = this,
            ret = {
                first: null,
                last: null,
                row: '',
                merged: ''
            },
            len = cells.length,
            mergedCells = [],
            i, cell, config, cache, index;

        me.beginCellRendering();
        cache = me.cachedCell;

        for(i = 0; i < len; i++){
            cell = cells[i] || {};

            if(typeof cell === 'object' && !(cell instanceof Date)){
                config = cell;
            }else{
                config = {
                    value: cell
                };
            }
            Ext.applyIf(config, me.cachedCellConfig);

            //cache.setConfig(config); setConfig is expensive
            cache.setValue(config.value);
            cache.setShowPhonetic(config.showPhonetic);
            cache.setStyleId(config.styleId);
            cache.setMergeAcross(config.mergeAcross);
            cache.setMergeDown(config.mergeDown);
            cache.setIndex(config.index);

            index = cache.getIndex();
            if(!index) {
                cache.setIndex(me.lastCellIndex++);
            }else{
                me.lastCellIndex = Math.max(me.lastCellIndex, index) + 1;
            }

            if(i === 0) {
                ret.first = ret.last = cache.getRef();
            }else if(i === len - 1){
                ret.last = cache.getRef();
            }

            me.tempCells.push(cache.render());

            if(cache.isMergedCell){
                mergedCells.push('<mergeCell ref="' + cache.getMergedCellRef() +'"/>');
            }
        }

        me.endCellRendering();

        ret.row = me.render();
        ret.merged = mergedCells.join('');

        return ret;
    }

});