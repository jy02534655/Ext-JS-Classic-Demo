/**
 * Base class for the grid exporter plugin. It contains common functions for both classic and modern toolkits.
 *
 * This class is extended by the toolkit specific grid plugin.
 *
 * @private
 */
Ext.define('Ext.grid.plugin.BaseExporter', {
    extend: 'Ext.exporter.Plugin',

    /**
     * @event beforedocumentsave
     * Fires on the grid panel before a document is exported and saved.
     * @param {Ext.grid.Panel} grid Reference to the grid panel
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */
    /**
     * @event documentsave
     * Fires on the grid panel whenever a document is exported and saved.
     * @param {Ext.grid.Panel} grid Reference to the grid panel
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */
    /**
     * @event dataready
     * Fires on the grid panel when the {@link Ext.exporter.data.Table data} is ready.
     * You could adjust styles or data before the document is generated and saved.
     * @param {Ext.grid.Panel} grid Reference to the grid panel
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */

    /**
     * Save the export file. This method is added to the grid panel as "saveDocumentAs".
     *
     * Pass in exporter specific configs to the config parameter.
     *
     * @method saveDocumentAs
     * @param {Ext.exporter.Base} config Config object used to initialize the proper exporter
     * @param {String} config.type Type of the exporter as defined in the exporter alias. Default is `excel`.
     * @param {String} [config.title] Title added to the export document
     * @param {String} [config.author] Who exported the document?
     * @param {String} [config.fileName] Name of the exported file, including the extension
     * @param {String} [config.charset] Exported file's charset
     *
     */

    /**
     * Fetch the export data. This method is added to the grid panel as "getDocumentData".
     *
     * Pass in exporter specific configs to the config parameter.
     *
     * @method getDocumentData
     * @param {Ext.exporter.Base} config Config object used to initialize the proper exporter
     * @param {String} [config.type] Type of the exporter as defined in the exporter alias. Default is `excel`.
     * @param {String} [config.title] Title added to the export document
     * @param {String} [config.author] Who exported the document?
     * @return {String}
     *
     */

    /**
     * @inheritdoc Ext.exporter.Plugin#method!prepareData
     */
    prepareData: function(config){
        var me = this,
            store = me.cmp.getStore(),
            table = new Ext.exporter.data.Table(),
            result, columns;

        result = me.getColumnHeaders(config, me.getGridColumns());
        table.setColumns(result.headers);

        if (!store || (store && store.destroyed)) {
            return table;
        }

        // <debug>
        if (store && store.isBufferedStore) {
            Ext.raise('BufferedStore can\'t be exported because it doesn\'t have all data available');
        }
        // </debug>

        columns = me.prepareDataIndexColumns(config, result.dataIndexes);
        if(store.isTreeStore) {
            me.extractNodeData(config, table, columns, store.getRoot());
        } else {
	        if(config && config.includeGroups && store.isGrouped()) {
	            me.extractData(config, table, columns, store.getGroups());
	            me.extractSummaryRow(config, table, columns, store);
	        } else {
	            me.extractRows(config, table, columns, store);
	        }
	    }

        return table;
    },

    /**
     *
     * @param config
     * @param columns
     * @return {Object}
     * @private
     */
    getColumnHeaders: function(config, columns) {
        var cols = [],
            dataIndexes = [],
            len = columns.length,
            i, result;

        for(i = 0; i < len; i++){
            result = this.getColumnHeader(config, columns[i]);
            if(result){
                cols.push(result.header);
                Ext.Array.insert(dataIndexes, dataIndexes.length, result.dataIndexes);
            }
        }
        return {
            headers: cols,
            dataIndexes: dataIndexes
        };
    },

    /**
     * Fetch grid column headers that will be processed
     *
     * @return {Ext.grid.column.Column[]}
     * @private
     */
    getGridColumns: function(){
        return [];
    },

    /**
     * Check if the column should be exported or not. Columns that are hidden or have ignoreExport = true are ignored.
     *
     * Returns an object that has 2 keys:
     * - header
     * - dataIndexes
     *
     * @param {Object} config
     * @param {Ext.grid.column.Column} column
     * @return {Object}
     * @private
     */
    getColumnHeader: Ext.emptyFn,

    prepareDataIndexColumns: function(config, dataIndexes) {
        var len = dataIndexes.length,
            columns = [],
            i;

        for(i = 0; i < len; i++){
            columns.push(this.prepareDataIndexColumn(config, dataIndexes[i]));
        }

        return columns;
    },

    prepareDataIndexColumn: function(config, column) {
        return {
            column: column,
            fn: Ext.emptyFn
        };
    },

    /**
     * Fetch data from store groups.
     *
     * @param {Object} config
     * @param {Ext.exporter.data.Group} group
     * @param {Ext.grid.column.Column[]} columns
     * @param {Ext.util.GroupCollection} collection
     * @private
     */
    extractData: function(config, group, columns, collection) {
        var i, len, children, storeGroup, tableGroup;

        if(!collection){
            return;
        }

        len = collection.getCount();
        for(i = 0; i < len; i++){
            storeGroup = collection.getAt(i);
            children = storeGroup.getGroups();

            tableGroup = group.addGroup({
                text: storeGroup.getGroupKey()
            });

            if(children){
                this.extractData(config, tableGroup, columns, children);
            }else{
                this.extractRows(config, tableGroup, columns, storeGroup);
            }
        }
    },

    /**
     * Fetch data from TreeStore node.
     *
     * @param {Object} config
     * @param {Ext.exporter.data.Group} group
     * @param {Ext.grid.column.Column[]} columns
     * @param {Ext.data.NodeInterface} node
     * @private
     */
    extractNodeData: function (config, group, columns, node) {
        var me = this,
            store = me.cmp.getStore(),
            lenCols = columns.length,
            i, j, record, row, cell, column, children, len;

        if(node && node.hasChildNodes()) {
            children = node.childNodes;
            len = children.length;

            for (i = 0; i < len; i++) {
                record = children[i];
                row = {
                    cells: []
                };

                for (j = 0; j < lenCols; j++) {
                    column = columns[j];

                    cell = me.getCell(store, record, column) || {
                            value: null
                        };

                    if (column.column.isTreeColumn && cell) {
                        cell.style = Ext.merge(cell.style || {}, {
                            alignment: {
                                indent: record.getDepth() - 1
                            }
                        });
                    }
                    row.cells.push(cell);
                }
                group.addRow(row);

                if (record.hasChildNodes()) {
                    me.extractNodeData(config, group, columns, record);
                }
            }
        }
    },

    /**
     *
     * @param {Object} config
     * @param {Ext.exporter.data.Group} group
     * @param {Ext.grid.column.Column[]} columns
     * @param {Ext.data.Store/Ext.util.Group} collection
     * @private
     */
    extractRows: function(config, group, columns, collection){
        var cmp = this.cmp,
            store = cmp.getStore(),
            len = collection.getCount(),
            lenCols = columns.length,
            rows = [],
            i, j, record, row, cell;

        for(i = 0; i < len; i++){
            record = collection.getAt(i);
            row = {
                cells: []
            };

            for(j = 0; j < lenCols; j++){
                cell = this.getCell(store, record, columns[j]);
                row.cells.push(cell || {
                        value: null
                    });
            }
            rows.push(row);
        }
        group.setRows(rows);
        this.extractSummaryRow(config, group, columns, collection);
    },

    extractSummaryRow: function(config, group, columns, collection) {
        var lenCols = columns.length,
            i, record, row, cell;

        if(config.includeSummary){
            row = {
                cells: []
            };

            record = this.getSummaryRecord(collection, columns);
            for(i = 0; i < lenCols; i++){
                cell = this.getSummaryCell(collection, record, columns[i]);
                row.cells.push(cell || {
                        value: null
                    });
            }

            group.setSummaries(row);
        }
    },

    /**
     *
     * @param {Ext.data.Store} store
     * @param {Ext.data.Model} record
     * @param {Object} colDef
     * @param {String} colDef.dataIndex
     * @param {Ext.grid.column.Column} colDef.column
     * @param {Function} colDef.fn
     * @param {Function/String} colDef.summaryType
     * @param {Function} colDef.summaryFn
     * @return {Ext.exporter.data.Cell} A cell config object
     * @private
     */
    getCell: Ext.emptyFn,
    /**
     *
     * @param {Ext.data.Store/Ext.util.Group} collection
     * @param {Object} colDef
     * @param {Ext.grid.column.Column} colDef.column
     * @param {Function} colDef.fn
     * @return {Ext.exporter.data.Cell} A cell config object
     * @private
     */
    getSummaryCell: Ext.emptyFn,

    getSummaryRecord: function(collection, columns) {
        var len = columns.length,
            summaryRecord = collection.getSummaryRecord(),
            record = new Ext.data.Model({
                id: 'summary-record'
            }),
            i, colDef, records;

        record.beginEdit();
        record.set(summaryRecord.getData());

        for(i = 0; i < len; i++) {
            colDef = columns[i];
            if (colDef.summary) {
                records = collection.isStore ? collection.data.items.slice() : collection.items.slice();
                record.set(colDef.summaryIndex, colDef.summary.calculate(records, colDef.summaryIndex, 'data', 0, records.length));
            } else if (colDef.summaryType) {
                record.set(colDef.summaryIndex, this.getSummary(collection, colDef.summaryType, colDef.summaryIndex));
            }
        }

        record.endEdit();
        record.commit(true);

        return record;
    },

    /**
     * Get the summary data for a field.
     * @param {Ext.data.Store/Ext.util.Group} item The store or group to get the data from
     * @param {String/Function} type The type of aggregation. If a function is specified it will
     * be passed to the stores aggregate function.
     * @param {String} field The field to aggregate on
     * @return {Number/String/Object} See the return type for the store functions.
     * if the group parameter is `true` An object is returned with a property named for each group who's
     * value is the summary value.
     * @private
     */
    getSummary: function (item, type, field) {
        var isStore = item.isStore;

        if (type) {
            if (Ext.isFunction(type)) {
                if (isStore) {
                    return item.aggregate(type, null, false, [field]);
                } else {
                    return item.aggregate(field, type);
                }
            }

            switch (type) {
                case 'count':
                    return item.count();
                case 'min':
                    return item.min(field);
                case 'max':
                    return item.max(field);
                case 'sum':
                    return item.sum(field);
                case 'average':
                    return item.average(field);
                default:
                    return null;

            }
        }
    }

});