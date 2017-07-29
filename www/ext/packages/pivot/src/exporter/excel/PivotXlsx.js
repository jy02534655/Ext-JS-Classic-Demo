/**
 * This exporter class creates an XLSX file that has 2 sheets:
 *
 * - one sheet that has the pivot table
 * - one sheet that has the raw data
 *
 * To be able to correctly export the pivot table definition to Excel you need to ensure that:
 * 
 * - only the following aggregator functions are used: min, max, avg, count, countNumbers, variance, varianceP, stdDev and stdDevP
 * - the pivot matrix provided should be {@link Ext.pivot.matrix.Local}
 * - the config {@link Ext.pivot.matrix.Local#calculateAsExcel} is set to `true`
 *
 * This exporter can be used together with the {@link Ext.pivot.plugin.Exporter}.
 */
Ext.define('Ext.exporter.excel.PivotXlsx', {
    extend: 'Ext.exporter.Base',

    alias: [
        'exporter.pivotxlsx'
    ],

    requires: [
        'Ext.exporter.file.ooxml.Excel'
    ],

    config: {
        /**
         * @cfg {Ext.exporter.file.excel.Style} titleStyle
         *
         * Default style applied to the title
         */
        titleStyle: {
            alignment: {
                horizontal: 'Center',
                vertical: 'Center'
            },
            font: {
                fontName: 'Arial',
                family: 'Swiss',
                size: 18,
                color: '#1F497D'
            }
        },
        /**
         * @cfg {Ext.pivot.matrix.Local} matrix
         *
         * Reference to the pivot matrix that needs to be exported
         */
        matrix: null,

        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotTableStyleInfo} pivotTableStyle
         *
         * Represent information on style applied to the PivotTable.
         *
         * The following style names are predefined:
         * - `PivotStyleLight1` -> `PivotStyleLight28`
         * - `PivotStyleMedium1` -> `PivotStyleMedium28`
         * - `PivotStyleDark1` -> `PivotStyleDark28`
         *
         */
        pivotTableStyle: {
            name: 'PivotStyleMedium7'
        }
        /**
         * @cfg data
         * @hide
         */
    },

    fileName: 'export.xlsx',
    charset: 'ascii',
    mimeType: 'application/zip',
    binary: true,

    aggregateMap: {
        avg: 'average',
        sum: 'sum',
        count: 'count',
        countNumbers: 'countNums',
        min: 'min',
        max: 'max',
        variance: 'var',
        varianceP: 'varp',
        stdDev: 'stdDev',
        stdDevP: 'stdDevp'
    },

    titleRowHeight: 22.5,
    columnLabelsText: 'Column Labels',
    rowLabelsText: 'Row Labels',
    valuesText: 'Values',
    totalText: 'Total',
    grandTotalText: 'Grand total',

    getContent: function(){
        var me = this,
            matrix = me.getMatrix(),
            excel, ws1, ws2, store, result;

        // if no matrix is available then the Excel file has no data in it
        excel = new Ext.exporter.file.ooxml.Excel({
            properties: {
                title: me.getTitle(),
                author: me.getAuthor()
            }
        });

        store = matrix && matrix.store;
        if(!matrix || !store || !store.isStore || store.isDestroyed){
            //<debug>
            Ext.raise('No pivot matrix provided to the exporter or there is no store defined on the matrix');
            //</debug>
            excel.addWorksheet({
                rows: [{
                    cells: 'Unable to export the pivot table since no raw data is available'
                }]
            });
            return excel.render();
        }

        //<debug>
        if(matrix && !matrix.calculateAsExcel) {
            Ext.raise('The pivot table calculations are different than what Excel does. Check "calculateAsExcel" config on the pivot matrix!');
        }
        //</debug>

        ws1 = excel.addWorksheet();
        ws2 = excel.addWorksheet();

        result = me.generateDataSheet({
            store: store,
            worksheet: ws2
        });

        me.generatePivotSheet({
            worksheet: ws1,
            data: result
        });

        result = excel.render();
        excel.destroy();
        return result;
    },

    /**
     * Generates the Excel sheet that contains the data that will be aggregated by the pivot table
     *
     * @param params
     * @return {Object}
     * @private
     */
    generateDataSheet: function(params){
        var store = params.store,
            ws = params.worksheet,
            result;

        result = this.buildStoreRows(store);
        result.worksheet = ws;

        // let's use cached rendering for performance reasons
        ws.beginRowRendering();
        ws.renderRows([result.fields]);
        ws.renderRows(result.rows);
        ws.endRowRendering();

        return result;
    },

    /**
     * Generates the Excel sheet that contains the pivot table
     *
     * @param params
     * @private
     */
    generatePivotSheet: function(params){
        var me = this,
            matrix = me._matrix,
            ws = params.worksheet,
            data = params.data;

        // let's use cached rendering for performance reasons
        ws.beginRowRendering();

        me.generatePivotSheetTitle(ws);

        // in Excel the aggregate names should be unique so we need to generate Excel friendly names
        me.setupUniqueAggregateNames(data.fields);
        // let's extract the unique values for used dimensions
        me.setupUniqueValues(matrix.aggregate, data.uniqueValues);
        me.setupUniqueValues(matrix.leftAxis.dimensions, data.uniqueValues);
        me.setupUniqueValues(matrix.topAxis.dimensions, data.uniqueValues);

        me.generatePivotSheetData(params);

        ws.endRowRendering();
    },

    /**
     * Generates the title of the pivot table sheet
     *
     * @param ws
     * @private
     */
    generatePivotSheetTitle: function(ws){
        ws.renderRow({
            height: this.titleRowHeight,
            cells: [{
                mergeAcross: 5,
                value: this.getTitle(),
                styleId: ws.getWorkbook().addCellStyle(this.getTitleStyle())
            }]
        });
    },

    /**
     * Generates the pivot table definition xml
     *
     * @param params
     * @private
     */
    generatePivotSheetData: function(params){
        var me = this,
            ws = params.worksheet;

        me.generatePivotConfig(params);
        me.generatePivotLocation(params);
        me.generatePivotDataFields(params);
        me.generatePivotFields(params);
        me.generatePivotRowFields(params);
        me.generatePivotColumnFields(params);

        ws.addPivotTable(params.pivotConfig);
    },

    /**
     * Generates a new pivot table definition object and fills in some configs
     *
     * @param params
     * @private
     */
    generatePivotConfig: function (params) {
        var matrix = this._matrix,
            data = params.data,
            dataWs = data.worksheet,
            countLeft = matrix.leftAxis.dimensions.items.length,
            pivotConfig;

        pivotConfig = params.pivotConfig = {
            // rowGrandTotals: matrix.rowGrandTotalsPosition !== 'none',
            // colGrandTotals: matrix.colGrandTotalsPosition !== 'none',
            grandTotalCaption: matrix.textGrandTotalTpl,
            location: {
                ref: '',
                firstHeaderRow: 1,
                firstDataRow: 1,
                firstDataCol: 1
            },
            cacheDefinition: {
                cacheSource: {
                    worksheetSource: {
                        ref: dataWs.getTopLeftRef() + ':' + dataWs.getBottomRightRef(),
                        sheet: dataWs.getName()
                    }
                },
                cacheFields: [],
                cacheRecords: {
                    items: data.cache
                }
            },
            pivotTableStyleInfo: this.getPivotTableStyle(),
            pivotFields: [],
            rowFields: [],
            colFields: [],
            dataFields: [],
            rowItems: [],
            colItems: []
        };

        pivotConfig.rowHeaderCaption = this.rowLabelsText;
        pivotConfig.colHeaderCaption = this.columnLabelsText;
        pivotConfig.viewLayoutType = matrix.viewLayoutType;
    },

    /**
     * Generates the location of the pivot table on the excel sheet
     *
     * @param params
     * @private
     */
    generatePivotLocation: function(params) {
        var me = this,
            matrix = me._matrix,
            ws = params.worksheet,
            location = params.pivotConfig.location,
            uniqueValues = params.data.uniqueValues,
            countAgg = matrix.aggregate.items.length,
            countLeft = matrix.leftAxis.dimensions.items.length,
            countTop = matrix.topAxis.dimensions.items.length,
            result, i, j, len, length, row, item, ref;

        params.header = [];
        params.body = [];
        params.totals = [];
        params.dataIndexes = [];
        params.columns = [];

        if(countLeft === 0 && countTop === 0) {
            if(countAgg === 0){
                me.generatePivotDataEmpty(params);
            }else{
                me.generatePivotDataAgg(params);
            }
        }else{
            location.firstDataRow += countTop + (countAgg > 1 ? 1 : 0);
            location.firstDataCol = 1;
            location.firstHeaderRow = 1;

            // let's build the Excel pivot table cache data
            me.generatePivotHeader(params);

            if(countAgg === 0){
                if(countTop && countLeft){
                    me.generatePivotDataLeftTopAgg(params);
                }else if(countLeft){
                    me.generatePivotDataLeft(params);
                }else{
                    me.generatePivotDataTop(params);
                }
            }else{
                if(countTop && countLeft){
                    me.generatePivotDataLeftTopAgg(params);
                }else if(countLeft){
                    me.generatePivotDataLeftAgg(params);
                }else{
                    me.generatePivotDataTopAgg(params);
                }
            }

            me.generatePivotBody(params);
            me.generatePivotRowTotals(params);
        }
        me.generatePivotData(params);
    },

    /**
     * If no dimensions are defined for left/top/aggregate then the pivot table needs
     * to have some empty cells defined on that excel sheet. This function does that.
     *
     * @param params
     * @private
     */
    generatePivotDataEmpty: function(params) {
        var i;

        // add 18 empty rows just to mark the pivot table as Excel does
        params.header.push({
            cells: [null, null, null]
        });

        for(i = 0; i < 17; i++) {
            params.header.push({
                cells: [null, null, null]
            });
        }
    },

    /**
     * If there are no dimensions on left/top axis then the pivot table needs to have a special layout on
     * the excel sheet. This function does that.
     *
     * @param params
     * @private
     */
    generatePivotDataAgg: function(params) {
        var matrix = this._matrix,
            location = params.pivotConfig.location,
            countAgg = matrix.aggregate.items.length,
            ref1, ref2, i, row, row2,
            record, item;

        row = {
            cells: [{
                value: null
            }]
        };
        row2 = {
            cells: [{
                value: this.totalText
            }]
        };
        params.header.push(row, row2);

        for(i = 0; i < countAgg; i++){
            item = matrix.aggregate.items[i];
            row.cells.push({
                value: item.excelName
            });
            record = matrix.results.items.map[matrix.grandTotalKey + '/' + matrix.grandTotalKey];
            row2.cells.push({
                value: record ? record.values[item.id] : null
            });
        }
        if(countAgg > 1) {
            location.firstHeaderRow = 0;
        }
    },

    generatePivotDataLeftTopAgg: function(params) {
        var matrix = this._matrix,
            pivotConfig = params.pivotConfig,
            location = pivotConfig.location,
            layout = pivotConfig.viewLayoutType,
            countAgg = matrix.aggregate.items.length,
            countLeft = matrix.leftAxis.dimensions.items.length,
            countTop = matrix.topAxis.dimensions.items.length,
            dataIndexes = params.dataIndexes,
            rows = params.header,
            row = rows[0],
            len = rows.length,
            i, j, item;

        for(i = 0; i < len; i++){
            if(layout === 'compact'){
                Ext.Array.insert(rows[i].cells, 0, [{
                    value: i === len - 1 ? this.rowLabelsText : (i === 0 && countAgg === 1 ? matrix.aggregate.items[0].excelName : null)
                }]);
            }else{
                for(j = 0; j < countLeft; j++){
                    if(i === 0 && j === 0 && countAgg === 1){
                        item = {
                            value: matrix.aggregate.items[0].excelName
                        };
                    }else{
                        item = {
                            value: i === len - 1 ? matrix.leftAxis.dimensions.items[j].dataIndex : null
                        };
                    }
                    Ext.Array.insert(rows[i].cells, j, [item]);
                }
            }
        }

        if(layout === 'compact'){
            row.cells.push({
                value: this.columnLabelsText
            });
            Ext.Array.insert(dataIndexes, 0, [{
                aggregate: false,
                dataIndex: matrix.compactViewKey
            }]);
        }else{
            for(i = 0; i < countLeft; i++){
                Ext.Array.insert(dataIndexes, i, [{
                    aggregate: false,
                    dataIndex: matrix.leftAxis.dimensions.items[i].id
                }]);
            }
            for(i = 0; i < countTop; i++) {
                row.cells.push({
                    value: matrix.topAxis.dimensions.items[i].dataIndex
                });
            }

            if(countAgg > 1){
                row.cells.push({
                    value: this.valuesText
                });
            }
        }

        this.generatePivotColTotals(params, rows[1]);
        location.firstDataCol = (layout === 'compact' ? 1 : countLeft);
    },

    generatePivotDataLeftTop: function(params) {
        var matrix = this._matrix,
            pivotConfig = params.pivotConfig,
            location = pivotConfig.location,
            layout = pivotConfig.viewLayoutType,
            countLeft = matrix.leftAxis.dimensions.items.length,
            countTop = matrix.topAxis.dimensions.items.length,
            dataIndexes = params.dataIndexes,
            rows = params.header,
            row = rows[0],
            len = rows.length,
            i, j;

        for(i = 0; i < len; i++){
            if(layout === 'compact'){
                Ext.Array.insert(rows[i].cells, 0, [{
                    value: i === len - 1 ? this.rowLabelsText : null
                }]);
            }else{
                for(j = 0; j < countLeft; j++){
                    Ext.Array.insert(rows[i].cells, j, [{
                        value: i === len - 1 ? matrix.leftAxis.dimensions.items[j].dataIndex : null
                    }]);
                }
            }
        }

        if(layout === 'compact') {
            row.cells.push({
                value: this.columnLabelsText
            });
            Ext.Array.insert(dataIndexes, 0, [{
                aggregate: false,
                dataIndex: matrix.compactViewKey
            }]);
        }else{
            for(i = 0; i < countLeft; i++){
                Ext.Array.insert(dataIndexes, i, [{
                    aggregate: false,
                    dataIndex: matrix.leftAxis.dimensions.items[i].id
                }]);
            }
            for(i = 0; i < countTop; i++) {
                row.cells.push({
                    value: matrix.topAxis.dimensions.items[i].dataIndex
                });
            }
        }

        this.generatePivotColTotals(params, rows[1]);
        location.firstDataCol = (layout === 'compact' ? 1 : countLeft);
    },

    generatePivotDataLeftAgg: function(params) {
        var matrix = this._matrix,
            pivotConfig = params.pivotConfig,
            location = pivotConfig.location,
            layout = pivotConfig.viewLayoutType,
            countAgg = matrix.aggregate.items.length,
            countLeft = matrix.leftAxis.dimensions.items.length,
            dataIndexes = params.dataIndexes,
            row = params.header[0],
            i, item;

        if(layout === 'compact'){
            row.cells.push({
                value: this.rowLabelsText
            });
            dataIndexes.push({
                aggregate: false,
                dataIndex: matrix.compactViewKey
            });
        }else{
            for (i = 0; i < countLeft; i++) {
                item = matrix.leftAxis.dimensions.items[i];
                row.cells.push({
                    value: item.dataIndex
                });
                dataIndexes.push({
                    aggregate: false,
                    dataIndex: item.id
                });
            }
        }

        this.generatePivotColTotals(params, row);
        location.firstHeaderRow = countAgg > 1 ? 0 : 1;
        location.firstDataRow = 1;
        location.firstDataCol = (layout === 'compact' ? 1 : countLeft);
    },

    generatePivotDataLeft: function(params) {
        var matrix = this._matrix,
            pivotConfig = params.pivotConfig,
            location = pivotConfig.location,
            layout = pivotConfig.viewLayoutType,
            countLeft = matrix.leftAxis.dimensions.items.length,
            row = params.header[0],
            dataIndexes = params.dataIndexes,
            i, item;

        if(layout === 'compact') {
            row.cells.push({
                value: this.rowLabelsText
            });
            dataIndexes.push({
                aggregate: false,
                dataIndex: matrix.compactViewKey
            });
        }else{
            for (i = 0; i < countLeft; i++) {
                item = matrix.leftAxis.dimensions.items[i];
                row.cells.push({
                    value: item.dataIndex
                });
                dataIndexes.push({
                    aggregate: false,
                    dataIndex: item.id
                });
            }
        }
        dataIndexes.push({
            aggregate: false
        });
        location.firstDataCol = (layout === 'compact' ? 1 : countLeft);
    },

    generatePivotDataTopAgg: function(params) {
        var matrix = this._matrix,
            pivotConfig = params.pivotConfig,
            layout = pivotConfig.viewLayoutType,
            countAgg = matrix.aggregate.items.length,
            countTop = matrix.topAxis.dimensions.items.length,
            dataIndexes = params.dataIndexes,
            rows = params.header,
            row = rows[0],
            len = rows.length,
            i;

        for(i = 0; i < len; i++){
            Ext.Array.insert(rows[i].cells, 0, [{
                value: countAgg === 1 && i === 0 ? matrix.aggregate.items[0].excelName : null
            }]);
        }
        Ext.Array.insert(dataIndexes, 0, [{
            aggregate: false,
            dataIndex: layout === 'compact' ? matrix.compactViewKey : ''
        }]);

        if(layout === 'compact'){
            row.cells.push({
                value: this.columnLabelsText
            });
        }else{
            for(i = 0; i < countTop; i++) {
                row.cells.push({
                    value: matrix.topAxis.dimensions.items[i].dataIndex
                });
            }
            if(countAgg > 1){
                row.cells.push({
                    value: this.valuesText
                });
            }
        }

        this.generatePivotColTotals(params, rows[1]);
    },

    generatePivotDataTop: function(params) {
        var matrix = this._matrix,
            pivotConfig = params.pivotConfig,
            location = pivotConfig.location,
            layout = pivotConfig.viewLayoutType,
            countTop = matrix.topAxis.dimensions.items.length,
            dataIndexes = params.dataIndexes,
            rows = params.header,
            row = rows[0],
            len = rows.length,
            i;

        Ext.Array.insert(dataIndexes, 0, [{
            aggregate: false,
            dataIndex: layout === 'compact' ? matrix.compactViewKey : ''
        }]);

        for(i = 0; i < len; i++){
            Ext.Array.insert(rows[i].cells, 0, [{
                value: null
            }]);
        }

        if(layout === 'compact') {
            row.cells.push({
                value: this.columnLabelsText
            });
        }else{
            for(i = 0; i < countTop; i++) {
                row.cells.push({
                    value: matrix.topAxis.dimensions.items[i].dataIndex
                });
            }
        }

        this.generatePivotColTotals(params, rows[1]);

        // If countTop then we have a 2nd row with all group names listed + Grand Total
        location.firstDataCol = 1;
        location.firstDataRow = countTop + 1;
    },

    generatePivotHeader: function(params) {
        var me = this,
            columns = params.columns,
            rows, i, j, len, length, item, row;

        me.generateTopAxisColumns(params, -1);

        rows = params.header;

        // the pivot table header has at least one row
        rows.push({
            cells: []
        });

        len = columns.length;
        for(i = 0; i < len; i++){
            row = {
                cells: []
            };

            item = columns[i];
            length = item.length;
            for (j = 0; j < length; j++) {
                row.cells.push({
                    value: item[j].value
                });
            }
            rows.push(row);
        }

        if(len){
            params.pivotConfig.colItems = Ext.Array.pluck(columns[len - 1], 'colItem');
            params.dataIndexes = columns[len - 1];
        }
    },

    generatePivotBody: function(params, items) {
        var matrix = this._matrix,
            i, len;

        if(!items){
            items = matrix.leftAxis.getTree();
        }

        len = items.length;
        for(i = 0; i < len; i++) {
            this.generatePivotBodyItem(params, items[i]);
        }
    },

    generatePivotBodyItem: function(params, item) {
        var matrix = this._matrix,
            ws = params.worksheet,
            uniqueValues = params.data.uniqueValues,
            columns = params.dataIndexes,
            length = columns.length,
            layout = params.pivotConfig.viewLayoutType,
            rows = params.body,
            rowItems = params.pivotConfig.rowItems,
            i, col, cell, result, rowItem, row, level;

        rowItem = {
            r: item.level,
            x: [Ext.Array.indexOf(uniqueValues[item.dimension.dataIndex], item.value)]
        };
        row = {
            cells: []
        };

        for(i = 0; i < length; i++){
            col = columns[i];
            cell = {
                value: null
            };

            if(col.aggregate){
                result = matrix.results.items.map[item.key + '/' + col.key];
                cell.value = result ? result.values[col.dataIndex] : null;
            }else if(col.dataIndex === item.dimensionId){
                cell.value = item.value;
            }else if(layout === 'compact' && col.dataIndex === matrix.compactViewKey){
                params.styles = params.styles || {};
                level = 'level' + item.level;
                params.styles[level] = params.styles[level] || ws.getWorkbook().addCellStyle({
                    alignment: {
                        horizontal: 'left',
                        indent: item.level * 2
                    }
                });

                cell.styleId = params.styles[level];
                cell.value = item.value;
            }
            row.cells.push(cell);
        }

        rowItems.push(rowItem);
        rows.push(row);

        if(item.children){
            if(layout === 'tabular') {
                this.generatePivotBodyTabularItem(params, item, item);
            }else {
                this.generatePivotBody(params, item.children);
            }
        }
    },

    generatePivotBodyTabularItem: function(params, item) {
        var matrix = this._matrix,
            uniqueValues = params.data.uniqueValues,
            items = item.children,
            len = items.length,
            columns = params.dataIndexes,
            length = columns.length,
            rows = params.body,
            cells = rows[rows.length - 1].cells,
            rowItems = params.pivotConfig.rowItems,
            rowItem = rowItems[rowItems.length - 1],
            i, j, col, cell, result, group;

        for(i = 0; i < len; i++){
            group = items[i];
            if(i === 0){
                rowItem.x.push(Ext.Array.indexOf(uniqueValues[group.dimension.dataIndex], group.value));
                for(j = 0; j < length; j++){
                    col = columns[j];
                    cell = cells[j];

                    if(col.aggregate){
                        result = matrix.results.items.map[group.key + '/' + col.key];
                        cell.value = result ? result.values[col.dataIndex] : null;
                    }else if(col.dataIndex === group.dimensionId){
                        cell.value = group.value;
                    }
                }

                if(group.children){
                    this.generatePivotBodyTabularItem(params, group);
                }
            }else{
                this.generatePivotBodyItem(params, group);
            }
        }

        // add group total
        rowItems.push({
            r: item.level,
            t: 'default',
            x: [Ext.Array.indexOf(uniqueValues[item.dimension.dataIndex], item.value)]
        });

        cells = [];
        for(j = 0; j < length; j++){
            col = columns[j];
            cell = {
                value: null
            };

            if(col.aggregate){
                result = matrix.results.items.map[item.key + '/' + col.key];
                cell.value = result ? result.values[col.dataIndex] : null;
            }else if(col.dataIndex === item.dimensionId){
                cell.value = item.data[col.dataIndex] + ' ' + this.totalText;
            }
            cells.push(cell);
        }
        rows.push({
            cells: cells
        });
    },

    generatePivotRowTotals: function(params) {
        var matrix = this._matrix,
            countAgg = matrix.aggregate.items.length,
            countLeft = matrix.leftAxis.dimensions.items.length,
            columns = params.dataIndexes,
            length = columns.length,
            rows = params.totals,
            cells = [],
            rowItems = params.pivotConfig.rowItems,
            i, j, len, item, col, cell, result;

        for(j = 0; j < length; j++){
            col = columns[j];
            cell = {
                value: null
            };

            if(j === 0){
                cell.value = countLeft ? this.grandTotalText : (countAgg ? this.totalText : null);
            }else if(col.aggregate){
                result = matrix.results.items.map[matrix.grandTotalKey + '/' + col.key];
                cell.value = result ? result.values[col.dataIndex] : null;
            }
            cells.push(cell);
        }

        rows.push({
            cells: cells
        });

        rowItems.push({
            t: 'grand',
            x: 0
        });
    },

    generatePivotColTotals: function(params, row) {
        var matrix = this._matrix,
            colItems = params.pivotConfig.colItems,
            dataIndexes = params.dataIndexes,
            aggregates = matrix.aggregate.items,
            countAgg = matrix.aggregate.items.length,
            countTop = matrix.topAxis.dimensions.items.length,
            i, item;

        if(countTop === 0){
            for(i = 0; i < countAgg; i++) {
                item = aggregates[i];

                row.cells.push({
                    value: item.excelName
                });
                dataIndexes.push({
                    aggregate: true,
                    key: matrix.grandTotalKey,
                    dataIndex: item.id
                });
                colItems.push({
                    t: 'grand',
                    i: i,
                    x: 0
                });
            }
        } else {
            if(countAgg <= 1){
                row.cells.push({
                    value: this.grandTotalText
                });
                dataIndexes.push({
                    aggregate: true,
                    key: matrix.grandTotalKey,
                    dataIndex: countAgg ? aggregates[0].id : ''
                });
                colItems.push({
                    t: 'grand',
                    x: 0
                });
            }else{
                for(i = 0; i < countAgg; i++) {
                    item = aggregates[i];

                    row.cells.push({
                        value: this.totalText + ' ' + item.excelName
                    });
                    dataIndexes.push({
                        aggregate: true,
                        key: matrix.grandTotalKey,
                        dataIndex: item.id
                    });
                    colItems.push({
                        t: 'grand',
                        i: i,
                        x: 0
                    });
                }

            }
        }
    },

    generatePivotData: function(params) {
        var ws = params.worksheet,
            location = params.pivotConfig.location,
            len, i, ref;

        len = params.header.length;
        for(i = 0; i < len; i++){
            ref = ws.renderRow(params.header[i]);
            if(i === 0){
                location.ref = ref.first + ':';
            }
        }

        ws.renderRows(params.body);
        ws.renderRows(params.totals);
        location.ref += ws.getBottomRightRef();
    },

    /**
     * The pivot table needs to know what fields are used as data (aggregate) fields. This function
     * generates this list of fields.
     *
     * @param params
     * @private
     */
    generatePivotDataFields: function(params) {
        var matrix = this._matrix,
            fields = params.data.fields,
            aggMap = this.aggregateMap,
            countAgg = matrix.aggregate.items.length,
            i, dimension;

        for(i = 0; i < countAgg; i++) {
            dimension = matrix.aggregate.items[i];

            //<debug>
            if(!aggMap[dimension.aggregator]) {
                Ext.raise('Custom aggregate functions are not supported by this exporter');
            }
            //</debug>

            params.pivotConfig.dataFields.push({
                name: dimension.excelName,
                fld: Ext.Array.indexOf(fields, dimension.dataIndex),
                subtotal: aggMap[dimension.aggregator] || 'sum',
                baseField: 0,
                baseItem: 0
            });
        }
    },

    /**
     * The pivot table needs a list of all fields available in the source sheet and what unique values
     * are available for each field.
     *
     * @param params
     * @private
     */
    generatePivotFields: function(params) {
        var me = this,
            matrix = me._matrix,
            data = params.data,
            fields = data.fields,
            uniqueValues = data.uniqueValues,
            countAgg = matrix.aggregate.items.length,
            i, j, len, length, field, item, dimension;

        // setup pivot fields: the pivot table needs to know what unique values are available
        // for each pivot field, which fields are used on row/column axis and which fields are data fields
        len = fields.length;
        for(i = 0; i < len; i++) {
            field = fields[i];
            item = {
                showAll: false
            };

            for(j = 0; j < countAgg; j++) {
                dimension = matrix.aggregate.items[j];
                if(dimension.dataIndex === field) {
                    item.dataField = true;
                    break;
                }
            }

            if(dimension = me.getDimension(matrix.aggregate, field)) {
                // do nothing; we parsed all aggregates above;
                // we just need its unique values
            } else if(dimension = me.getDimension(matrix.leftAxis.dimensions, field)) {
                item.axis = 'axisRow';
                if(dimension.getSortable()) {
                    item.sortType = (dimension.direction === 'ASC' ? 'ascending' : 'descending');
                } else {
                    item.sortType = 'manual';
                }
            } else if(dimension = me.getDimension(matrix.topAxis.dimensions, field)) {
                item.axis = 'axisCol';
                if(dimension.getSortable()) {
                    item.sortType = (dimension.direction === 'ASC' ? 'ascending' : 'descending');
                } else {
                    item.sortType = 'manual';
                }
            }

            if(dimension) {
                item.items = [];
                length = uniqueValues[field].length;
                for (j = 0; j < length; j++) {
                    item.items.push({
                        x: j
                    });
                }
                item.items.push({
                    t: 'default'
                });
            }

            params.pivotConfig.cacheDefinition.cacheFields.push({
                name: field,
                sharedItems: {
                    items: dimension && !dimension.isAggregate ? uniqueValues[field] : []
                }
            });

            params.pivotConfig.pivotFields.push(item);
        }
    },

    /**
     * Generates the list of fields used as left axis dimensions used by the pivot table.
     *
     * @param params
     * @private
     */
    generatePivotRowFields: function(params) {
        var matrix = this._matrix,
            fields = params.data.fields,
            countLeft = matrix.leftAxis.dimensions.items.length,
            i;

        // setup row fields: this informs the pivot table what fields are used on the row axis
        for(i = 0; i < countLeft; i++){
            params.pivotConfig.rowFields.push({
                x: Ext.Array.indexOf(fields, matrix.leftAxis.dimensions.items[i].dataIndex)
            });
        }
    },

    /**
     * Generates the list of top axis dimensions used by the pivot table.
     *
     * @param params
     * @private
     */
    generatePivotColumnFields: function(params) {
        var matrix = this._matrix,
            fields = params.data.fields,
            countAgg = matrix.aggregate.items.length,
            countTop = matrix.topAxis.dimensions.items.length,
            i;

        // setup col fields: this informs the pivot table what fields are used on the column axis
        for(i = 0; i < countTop; i++){
            params.pivotConfig.colFields.push({
                x: Ext.Array.indexOf(fields, matrix.topAxis.dimensions.items[i].dataIndex)
            });
        }
        if(countAgg > 1){
            params.pivotConfig.colFields.push({
                x: -2
            });
        }
    },

    /**
     * This function parses the matrix store and extracts all data and all unique values for each field.
     *
     * @param store
     * @return {Object}
     * @private
     */
    buildStoreRows: function(store){
        var result = {
                rows: [],
                cache: [],
                fields: [],
                uniqueValues: {}
            },
            fields, i, j, len, length, field, row, record, item, cache;

        fields = store.model.getFields();
        len = fields.length;
        for (i = 0; i < len; i++) {
            field = fields[i].getName();
            result.fields.push(field);
            result.uniqueValues[field] = [];
        }

        length = store.data.length;
        for (i = 0; i < length; i++) {
            row = [];
            cache = [];
            record = store.data.items[i];
            for (j = 0; j < len; j++) {
                field = result.fields[j];
                item = record.get(field);
                row.push({
                    value: item
                });
                cache.push(item);
                if(Ext.Array.indexOf(result.uniqueValues[field], item) === -1) {
                    result.uniqueValues[field].push(item);
                }
            }
            result.rows.push(row);
            result.cache.push(cache);
        }

        return result;
    },

    /**
     * Excel pivot table needs unique aggregate names so we need to ensure the matrix aggregate
     * dimensions are unique
     *
     * @param fields
     * @private
     */
    setupUniqueAggregateNames: function(fields){
        var aggregates = this._matrix.aggregate,
            len = aggregates.getCount(),
            length = fields.length,
            data = [],
            index, i, j, agg, name, temp;

        for(i = 0; i < len; i++) {
            agg = aggregates.getAt(i);
            name = agg.dataIndex || agg.header;
            temp = name;
            index = 2;

            for(j = 0; j < length; j++) {
                if(String(temp).toLowerCase() === String(fields[j]).toLowerCase() || Ext.Array.indexOf(data, temp) >= 0){
                    temp = name + index;
                    index++;
                    j = -1;
                }
            }
            data.push(temp);
            agg.excelName = temp;
        }
    },

    setupUniqueValues: function(dimensions, uniqueValues){
        var items = dimensions.items,
            len = items.length,
            i, item;

        for(i = 0; i < len; i++){
            item = items[i];
            uniqueValues[item.dataIndex] = Ext.Array.pluck(item.values.items, 'value');
        }
    },

    /**
     * Find the dimension that matches the dataIndex and return the index
     *
     * @param collection
     * @param name
     * @return {Number}
     * @private
     */
    getDimension: function(collection, name){
        var index = collection.findIndex('dataIndex', name, 0, false, true);

        return index >= 0 ? collection.getAt(index) : null;
    },

    /**
     *  When there's only one aggregate available then the pivot table headers look like this
     *
     *  | USA |   |   |          |     |   |          | USA Sum | Sum |
     *  | 2012|   |   | 2012 Sum | 2013|   | 2013 Sum |         |     |
     *  | 1   | 2 | 3 |          | 1   | 2 |          |         |     |
     *
     *  When there are multiple aggregates available then the pivot table headers look like this
     *
     *  | USA |     |     |     |          |          |     |     |     |     |          |          | USA Sum | USA Avg | Sum | Avg |
     *  | 2012|     |     |     | 2012 Sum | 2012 Avg | 2013|     |     |     | 2013 Sum | 2013 Avg |         |         |     |     |
     *  | 1   |     | 2   |     |          |          | 1   |     | 2   |     |          |          |         |         |     |     |
     *  | sum | avg | sum | avg |          |          | sum | avg | sum | avg |          |          |         |         |     |     |
     *
     *
     * @param params
     * @param colIndex
     * @param items
     * @private
     */
    generateTopAxisColumns: function(params, colIndex, items){
        var matrix = this._matrix,
            uniqueValues = params.data.uniqueValues,
            columns = params.columns,
            aggregates = matrix.aggregate.items,
            ret = [],
            i, j, k, len, length, levels, item, agg, col, level, obj, result, index;

        if(!items ){
            items = matrix.topAxis.getTree();
        }

        len = items.length;
        length = aggregates.length;

        for(i = 0; i < len; i++) {
            item = items[i];

            index = Ext.Array.indexOf(uniqueValues[item.dimension.dataIndex], item.value);
            level = item.level;

            columns[level] = columns[level] || [];

            col = {
                value: item.value == null ? '(blank)' : item.value,
                index: index
            };

            columns[level].push(col);

            if(item.children){

                result = this.generateTopAxisColumns(params, colIndex, item.children);

                // fill in the current level with empty columns
                levels = result.length;
                for(j = 1; j < levels; j++){
                    columns[level].push({
                        value: '',
                        empty: true
                    });
                }

                for(j = 0; j < length; j++) {
                    // add group total
                    agg = aggregates[j];
                    obj = {
                        value: col.value + ' ' + (agg.excelName)
                    };
                    columns[level].push(obj);
                    result.push(obj);

                    // fill in the bottom levels with empty columns below the group total
                    levels = columns.length;
                    for(k = level + 1; k < levels; k++) {
                        if(k === levels - 1) {
                            // on the last level we store the dataIndex
                            columns[k].push({
                                aggregate: true,
                                value: '',
                                key: item.key,
                                dataIndex: agg.id,
                                colItem: {
                                    t: 'default',
                                    i: j,
                                    x: index
                                }
                            });
                        } else {
                            columns[k].push({
                                value: '',
                                empty: true
                            });
                        }
                    }
                }

                Ext.Array.insert(ret, ret.length, result);
                colIndex += result.length;

            } else {
                if(length <= 1) {
                    ret.push(col);
                    colIndex++;
                    col.aggregate = true;
                    col.colItem = this.getColItem(colIndex, 0, columns);
                }

                if(length === 1){
                    col.key = item.key;
                    col.dataIndex = aggregates[0].id;
                } else if(length > 1) {
                    level++;
                    columns[level] = columns[level] || [];

                    for(j = 0; j < length; j++) {
                        agg = aggregates[j];
                        colIndex++;
                        obj = {
                            aggregate: true,
                            value: agg.excelName,
                            index: j,
                            key: item.key,
                            dataIndex: agg.id
                        };
                        columns[level].push(obj);
                        obj.colItem = this.getColItem(colIndex, j, columns);
                        ret.push(obj);

                        if(j > 0) {
                            columns[level - 1].push({
                                value: '',
                                empty: true
                            });
                        }
                    }
                }

            }
        }

        return ret;
    },

    /**
     * Format an excel pivot table colItem
     *
     * @param colIndex
     * @param aggIndex
     * @param columns
     * @return {Object}
     * @private
     */
    getColItem: function(colIndex, aggIndex, columns){
        var colItem = {
                i: aggIndex
            },
            r = 0,
            x = [],
            len = columns.length,
            i, col;

        // we need to parse columns from top to bottom on the colIndex and find out what values are empty
        // so we can calculate r & x
        for(i = 0; i < len; i++) {
            col = columns[i][colIndex];

            if(col) {
                if(!col.empty){
                    x.push(col.index);
                } else {
                    //r++;
                }
            } else {
                r++;
            }
        }
        colItem.r = r;
        colItem.x = x;

        return colItem;
    }
});