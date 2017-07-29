/**
 * The workbook element is the top level element. It contains elements and attributes that encompass the
 * data content of the workbook.
 *
 * (CT_Workbook)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Workbook', {
    extend: 'Ext.exporter.file.ooxml.XmlRels',

    requires: [
        'Ext.exporter.file.ooxml.excel.Worksheet',
        'Ext.exporter.file.ooxml.excel.Stylesheet',
        'Ext.exporter.file.ooxml.excel.SharedStrings',
        'Ext.exporter.file.ooxml.theme.Office'
    ],

    isWorkbook: true,
    currentSheetIndex: 1,
    currentPivotCacheIndex: 0,

    config: {
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Stylesheet} stylesheet
         *
         * This is the root element of the Styles part.
         */
        stylesheet: {},
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.SharedStrings} sharedStrings
         *
         * A workbook can contain thousands of cells containing string (non-numeric) data.
         * Furthermore this data is very likely to be repeated across many rows or columns.
         * The goal of implementing a single string table that is shared across the workbook is
         * to improve performance in opening and saving the file by only reading and writing the
         * repetitive information once.
         */
        sharedStrings: {},
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Sheet[]} sheets
         *
         * This element represents the collection of sheets in the workbook. There are different
         * types of sheets you can create in SpreadsheetML. The most common sheet type is a worksheet;
         * also called a spreadsheet. A worksheet is the primary document that you use in SpreadsheetML
         * to store and work with data. A worksheet consists of cells that are organized into columns and rows.
         */
        sheets: [],
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotCache[]} pivotCaches
         *
         * This element enumerates pivot cache definition parts used by pivot tables and formulas in this workbook.
         */
        pivotCaches: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.theme.Base} theme
         *
         * The theme used by this workbook
         */
        theme: {
            type: 'office',
            folder: '/xl/theme/',
            index: 1
        }
    },

    contentType: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'
    },

    relationship: {
        schema: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument'
    },

    folder: '/xl/',
    fileName: 'workbook',

    tpl: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ',
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
        '<tpl if="sheets">',
        '<sheets>',
        '<tpl if="sheets"><tpl for="sheets.items"><sheet name="{[this.utf8(values.getName())]}" sheetId="{[xindex]}" state="visible" r:id="{[values.getRelationship().getId()]}"/></tpl></tpl>',
        '</sheets>',
        '</tpl>',
        '<tpl if="pivotCaches">',
        '<pivotCaches>',
        '<tpl for="pivotCaches.getRange()">{[values.render()]}</tpl>',
        '</pivotCaches>',
        '</tpl>',
        '</workbook>',
        {
            utf8: function(v){
                return Ext.util.Base64._utf8_encode(v || '');
            }
        }
    ],

    destroy: function(){
        var me = this;

        me.setStylesheet(null);
        me.setSharedStrings(null);
        me.setTheme(null);
        me.callParent();
    },

    collectFiles: function(files){
        var me = this,
            style = me._stylesheet,
            strings = me._sharedStrings,
            theme = me._theme,
            ws, i, length;

        ws = me._sheets;
        length = ws.length;
        for(i = 0; i < length; i++){
            ws.items[i].collectFiles(files);
        }

        files[me._path] = me.render();
        files[style._path] = style.render();
        files[strings._path] = strings.render();
        files[theme._path] = theme.render();

        me.collectRelationshipsFiles(files);
    },

    collectContentTypes: function(types){
        var me = this,
            ws, i, length;

        types.push(me.getStylesheet().getContentType());
        types.push(me.getSharedStrings().getContentType());
        types.push(me.getTheme().getContentType());

        ws = me.getSheets();
        length = ws.length;
        for(i = 0; i < length; i++){
            ws.getAt(i).collectContentTypes(types);
        }

        me.callParent([types]);
    },

    applyStylesheet: function(data){
        if(!data || data.isStylesheet){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.Stylesheet();
    },

    updateStylesheet: function(data, oldData){
        var rels = this.getRelationships();

        if(oldData && rels){
            rels.removeRelationship(oldData.getRelationship());
        }
        if(data && rels){
            rels.addRelationship(data.getRelationship());
        }
        Ext.destroy(oldData);
    },

    applySharedStrings: function(data){
        if(!data || data.isSharedStrings){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.SharedStrings();
    },

    updateSharedStrings: function(data, oldData){
        var rels = this.getRelationships();

        if(oldData && rels){
            rels.removeRelationship(oldData.getRelationship());
        }
        if(data){
            rels.addRelationship(data.getRelationship());
        }
        Ext.destroy(oldData);
    },

    applyPivotCaches: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.PivotCache');
    },

    updatePivotCaches: function(collection, oldCollection){
        var me = this;

        if(oldCollection){
            oldCollection.un({
                add: me.onPivotCacheAdd,
                scope: me
            });
        }
        if(collection){
            collection.on({
                add: me.onPivotCacheAdd,
                scope: me
            });
        }
    },

    onPivotCacheAdd: function(collection, details){
        var length = details.items.length,
            i, item;

        for(i = 0; i < length; i++) {
            item = details.items[i];
            item.setCacheId(this.currentPivotCacheIndex++);
        }
    },

    applySheets: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Sheet');
    },

    updateSheets: function(collection, oldCollection){
        var me = this;

        if(oldCollection){
            oldCollection.un({
                add: me.onSheetAdd,
                remove: me.onSheetRemove,
                scope: me
            });
        }
        if(collection){
            collection.on({
                add: me.onSheetAdd,
                remove: me.onSheetRemove,
                scope: me
            });
        }
    },

    applyTheme: function(value) {
        var cfg = {
            type: 'office'
        };

        if (value) {
            if (typeof value == 'string') {
                cfg.type = value;
            } else {
                Ext.apply(cfg, value);
            }
            value = Ext.Factory.ooxmltheme(value);
        }
        return value;
    },

    updateTheme: function(data, oldData) {
        var rels = this.getRelationships();

        if(oldData && rels){
            rels.removeRelationship(oldData.getRelationship());
        }
        if(data && rels){
            rels.addRelationship(data.getRelationship());
        }
        Ext.destroy(oldData);
    },

    onSheetAdd: function(collection, details){
        var rels = this.getRelationships(),
            length = details.items.length,
            i, item;

        for(i = 0; i < length; i++) {
            item = details.items[i];
            item.setIndex(this.currentSheetIndex++);
            item.setWorkbook(this);
            rels.addRelationship(item.getRelationship());
        }
    },

    onSheetRemove: function(collection, details){
        var rels = this.getRelationships(),
            length = details.items.length,
            i, item;

        for(i = 0; i < length; i++) {
            item = details.items[i];
            rels.removeRelationship(item.getRelationship());
            Ext.destroy(item);
        }
    },


    /**
     * Convenience method to add worksheets.
     * @param {Object/Array} config
     * @return {Ext.exporter.file.ooxml.excel.Worksheet/Ext.exporter.file.ooxml.excel.Worksheet[]}
     */
    addWorksheet: function(config){
        var ws = Ext.Array.from(config || {}),
            length = ws.length,
            i, w;

        for(i = 0; i < length; i++){
            w = ws[i];

            if(w && !w.isWorksheet){
                w.workbook = this;
                ws[i] = new Ext.exporter.file.ooxml.excel.Worksheet(w);
            }
        }

        return this.getSheets().add(ws);
    },

    /**
     * Convenience method to remove worksheets.
     * @param {Object/Array} config
     * @return {Ext.exporter.file.ooxml.excel.Worksheet/Ext.exporter.file.ooxml.excel.Worksheet[]}
     */
    removeWorksheet: function(config){
        return this.getSheets().remove(config);
    },

    /**
     * Convenience method to add pivot caches.
     * @param {Object/Array} config
     * @return {Ext.exporter.file.ooxml.excel.PivotCache/Ext.exporter.file.ooxml.excel.PivotCache[]}
     */
    addPivotCache: function(config){
        if(!this.getPivotCaches()){
            this.setPivotCaches([]);
        }
        return this.getPivotCaches().add(config || {});
    },

    /**
     * Convenience method to remove pivot caches.
     * @param {Object/Array} config
     * @return {Ext.exporter.file.ooxml.excel.PivotCache/Ext.exporter.file.ooxml.excel.PivotCache[]}
     */
    removePivotCache: function(config){
        return this.getPivotCaches().remove(config);
    },

    /**
     * Convenience method to add a style.
     *
     * @param {Ext.exporter.file.Style} config
     * @return {Number} Index of the cell style
     */
    addStyle: function(config){
        return this.getStylesheet().addStyle(config);
    },

    /**
     * Convenience method to add a style.
     *
     * @param {Ext.exporter.file.Style} config
     * @return {Number} Index of the cell style
     */
    addCellStyle: function(config){
        return this.getStylesheet().addCellStyle(config);
    }

});