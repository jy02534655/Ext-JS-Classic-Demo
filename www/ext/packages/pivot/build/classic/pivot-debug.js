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
    },
    /**
         * @cfg data
         * @hide
         */
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
    getContent: function() {
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
        if (!matrix || !store || !store.isStore || store.isDestroyed) {
            Ext.raise('No pivot matrix provided to the exporter or there is no store defined on the matrix');
            excel.addWorksheet({
                rows: [
                    {
                        cells: 'Unable to export the pivot table since no raw data is available'
                    }
                ]
            });
            return excel.render();
        }
        if (matrix && !matrix.calculateAsExcel) {
            Ext.raise('The pivot table calculations are different than what Excel does. Check "calculateAsExcel" config on the pivot matrix!');
        }
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
    generateDataSheet: function(params) {
        var store = params.store,
            ws = params.worksheet,
            result;
        result = this.buildStoreRows(store);
        result.worksheet = ws;
        // let's use cached rendering for performance reasons
        ws.beginRowRendering();
        ws.renderRows([
            result.fields
        ]);
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
    generatePivotSheet: function(params) {
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
    generatePivotSheetTitle: function(ws) {
        ws.renderRow({
            height: this.titleRowHeight,
            cells: [
                {
                    mergeAcross: 5,
                    value: this.getTitle(),
                    styleId: ws.getWorkbook().addCellStyle(this.getTitleStyle())
                }
            ]
        });
    },
    /**
     * Generates the pivot table definition xml
     *
     * @param params
     * @private
     */
    generatePivotSheetData: function(params) {
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
    generatePivotConfig: function(params) {
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
        if (countLeft === 0 && countTop === 0) {
            if (countAgg === 0) {
                me.generatePivotDataEmpty(params);
            } else {
                me.generatePivotDataAgg(params);
            }
        } else {
            location.firstDataRow += countTop + (countAgg > 1 ? 1 : 0);
            location.firstDataCol = 1;
            location.firstHeaderRow = 1;
            // let's build the Excel pivot table cache data
            me.generatePivotHeader(params);
            if (countAgg === 0) {
                if (countTop && countLeft) {
                    me.generatePivotDataLeftTopAgg(params);
                } else if (countLeft) {
                    me.generatePivotDataLeft(params);
                } else {
                    me.generatePivotDataTop(params);
                }
            } else {
                if (countTop && countLeft) {
                    me.generatePivotDataLeftTopAgg(params);
                } else if (countLeft) {
                    me.generatePivotDataLeftAgg(params);
                } else {
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
            cells: [
                null,
                null,
                null
            ]
        });
        for (i = 0; i < 17; i++) {
            params.header.push({
                cells: [
                    null,
                    null,
                    null
                ]
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
            ref1, ref2, i, row, row2, record, item;
        row = {
            cells: [
                {
                    value: null
                }
            ]
        };
        row2 = {
            cells: [
                {
                    value: this.totalText
                }
            ]
        };
        params.header.push(row, row2);
        for (i = 0; i < countAgg; i++) {
            item = matrix.aggregate.items[i];
            row.cells.push({
                value: item.excelName
            });
            record = matrix.results.items.map[matrix.grandTotalKey + '/' + matrix.grandTotalKey];
            row2.cells.push({
                value: record ? record.values[item.id] : null
            });
        }
        if (countAgg > 1) {
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
        for (i = 0; i < len; i++) {
            if (layout === 'compact') {
                Ext.Array.insert(rows[i].cells, 0, [
                    {
                        value: i === len - 1 ? this.rowLabelsText : (i === 0 && countAgg === 1 ? matrix.aggregate.items[0].excelName : null)
                    }
                ]);
            } else {
                for (j = 0; j < countLeft; j++) {
                    if (i === 0 && j === 0 && countAgg === 1) {
                        item = {
                            value: matrix.aggregate.items[0].excelName
                        };
                    } else {
                        item = {
                            value: i === len - 1 ? matrix.leftAxis.dimensions.items[j].dataIndex : null
                        };
                    }
                    Ext.Array.insert(rows[i].cells, j, [
                        item
                    ]);
                }
            }
        }
        if (layout === 'compact') {
            row.cells.push({
                value: this.columnLabelsText
            });
            Ext.Array.insert(dataIndexes, 0, [
                {
                    aggregate: false,
                    dataIndex: matrix.compactViewKey
                }
            ]);
        } else {
            for (i = 0; i < countLeft; i++) {
                Ext.Array.insert(dataIndexes, i, [
                    {
                        aggregate: false,
                        dataIndex: matrix.leftAxis.dimensions.items[i].id
                    }
                ]);
            }
            for (i = 0; i < countTop; i++) {
                row.cells.push({
                    value: matrix.topAxis.dimensions.items[i].dataIndex
                });
            }
            if (countAgg > 1) {
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
        for (i = 0; i < len; i++) {
            if (layout === 'compact') {
                Ext.Array.insert(rows[i].cells, 0, [
                    {
                        value: i === len - 1 ? this.rowLabelsText : null
                    }
                ]);
            } else {
                for (j = 0; j < countLeft; j++) {
                    Ext.Array.insert(rows[i].cells, j, [
                        {
                            value: i === len - 1 ? matrix.leftAxis.dimensions.items[j].dataIndex : null
                        }
                    ]);
                }
            }
        }
        if (layout === 'compact') {
            row.cells.push({
                value: this.columnLabelsText
            });
            Ext.Array.insert(dataIndexes, 0, [
                {
                    aggregate: false,
                    dataIndex: matrix.compactViewKey
                }
            ]);
        } else {
            for (i = 0; i < countLeft; i++) {
                Ext.Array.insert(dataIndexes, i, [
                    {
                        aggregate: false,
                        dataIndex: matrix.leftAxis.dimensions.items[i].id
                    }
                ]);
            }
            for (i = 0; i < countTop; i++) {
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
        if (layout === 'compact') {
            row.cells.push({
                value: this.rowLabelsText
            });
            dataIndexes.push({
                aggregate: false,
                dataIndex: matrix.compactViewKey
            });
        } else {
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
        if (layout === 'compact') {
            row.cells.push({
                value: this.rowLabelsText
            });
            dataIndexes.push({
                aggregate: false,
                dataIndex: matrix.compactViewKey
            });
        } else {
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
        for (i = 0; i < len; i++) {
            Ext.Array.insert(rows[i].cells, 0, [
                {
                    value: countAgg === 1 && i === 0 ? matrix.aggregate.items[0].excelName : null
                }
            ]);
        }
        Ext.Array.insert(dataIndexes, 0, [
            {
                aggregate: false,
                dataIndex: layout === 'compact' ? matrix.compactViewKey : ''
            }
        ]);
        if (layout === 'compact') {
            row.cells.push({
                value: this.columnLabelsText
            });
        } else {
            for (i = 0; i < countTop; i++) {
                row.cells.push({
                    value: matrix.topAxis.dimensions.items[i].dataIndex
                });
            }
            if (countAgg > 1) {
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
        Ext.Array.insert(dataIndexes, 0, [
            {
                aggregate: false,
                dataIndex: layout === 'compact' ? matrix.compactViewKey : ''
            }
        ]);
        for (i = 0; i < len; i++) {
            Ext.Array.insert(rows[i].cells, 0, [
                {
                    value: null
                }
            ]);
        }
        if (layout === 'compact') {
            row.cells.push({
                value: this.columnLabelsText
            });
        } else {
            for (i = 0; i < countTop; i++) {
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
        for (i = 0; i < len; i++) {
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
        if (len) {
            params.pivotConfig.colItems = Ext.Array.pluck(columns[len - 1], 'colItem');
            params.dataIndexes = columns[len - 1];
        }
    },
    generatePivotBody: function(params, items) {
        var matrix = this._matrix,
            i, len;
        if (!items) {
            items = matrix.leftAxis.getTree();
        }
        len = items.length;
        for (i = 0; i < len; i++) {
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
            x: [
                Ext.Array.indexOf(uniqueValues[item.dimension.dataIndex], item.value)
            ]
        };
        row = {
            cells: []
        };
        for (i = 0; i < length; i++) {
            col = columns[i];
            cell = {
                value: null
            };
            if (col.aggregate) {
                result = matrix.results.items.map[item.key + '/' + col.key];
                cell.value = result ? result.values[col.dataIndex] : null;
            } else if (col.dataIndex === item.dimensionId) {
                cell.value = item.value;
            } else if (layout === 'compact' && col.dataIndex === matrix.compactViewKey) {
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
        if (item.children) {
            if (layout === 'tabular') {
                this.generatePivotBodyTabularItem(params, item, item);
            } else {
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
        for (i = 0; i < len; i++) {
            group = items[i];
            if (i === 0) {
                rowItem.x.push(Ext.Array.indexOf(uniqueValues[group.dimension.dataIndex], group.value));
                for (j = 0; j < length; j++) {
                    col = columns[j];
                    cell = cells[j];
                    if (col.aggregate) {
                        result = matrix.results.items.map[group.key + '/' + col.key];
                        cell.value = result ? result.values[col.dataIndex] : null;
                    } else if (col.dataIndex === group.dimensionId) {
                        cell.value = group.value;
                    }
                }
                if (group.children) {
                    this.generatePivotBodyTabularItem(params, group);
                }
            } else {
                this.generatePivotBodyItem(params, group);
            }
        }
        // add group total
        rowItems.push({
            r: item.level,
            t: 'default',
            x: [
                Ext.Array.indexOf(uniqueValues[item.dimension.dataIndex], item.value)
            ]
        });
        cells = [];
        for (j = 0; j < length; j++) {
            col = columns[j];
            cell = {
                value: null
            };
            if (col.aggregate) {
                result = matrix.results.items.map[item.key + '/' + col.key];
                cell.value = result ? result.values[col.dataIndex] : null;
            } else if (col.dataIndex === item.dimensionId) {
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
        for (j = 0; j < length; j++) {
            col = columns[j];
            cell = {
                value: null
            };
            if (j === 0) {
                cell.value = countLeft ? this.grandTotalText : (countAgg ? this.totalText : null);
            } else if (col.aggregate) {
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
        if (countTop === 0) {
            for (i = 0; i < countAgg; i++) {
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
            if (countAgg <= 1) {
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
            } else {
                for (i = 0; i < countAgg; i++) {
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
        for (i = 0; i < len; i++) {
            ref = ws.renderRow(params.header[i]);
            if (i === 0) {
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
        for (i = 0; i < countAgg; i++) {
            dimension = matrix.aggregate.items[i];
            if (!aggMap[dimension.aggregator]) {
                Ext.raise('Custom aggregate functions are not supported by this exporter');
            }
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
        for (i = 0; i < len; i++) {
            field = fields[i];
            item = {
                showAll: false
            };
            for (j = 0; j < countAgg; j++) {
                dimension = matrix.aggregate.items[j];
                if (dimension.dataIndex === field) {
                    item.dataField = true;
                    break;
                }
            }
            if (dimension = me.getDimension(matrix.aggregate, field)) {}
            // do nothing; we parsed all aggregates above;
            // we just need its unique values
            else if (dimension = me.getDimension(matrix.leftAxis.dimensions, field)) {
                item.axis = 'axisRow';
                if (dimension.getSortable()) {
                    item.sortType = (dimension.direction === 'ASC' ? 'ascending' : 'descending');
                } else {
                    item.sortType = 'manual';
                }
            } else if (dimension = me.getDimension(matrix.topAxis.dimensions, field)) {
                item.axis = 'axisCol';
                if (dimension.getSortable()) {
                    item.sortType = (dimension.direction === 'ASC' ? 'ascending' : 'descending');
                } else {
                    item.sortType = 'manual';
                }
            }
            if (dimension) {
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
        for (i = 0; i < countLeft; i++) {
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
        for (i = 0; i < countTop; i++) {
            params.pivotConfig.colFields.push({
                x: Ext.Array.indexOf(fields, matrix.topAxis.dimensions.items[i].dataIndex)
            });
        }
        if (countAgg > 1) {
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
    buildStoreRows: function(store) {
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
                if (Ext.Array.indexOf(result.uniqueValues[field], item) === -1) {
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
    setupUniqueAggregateNames: function(fields) {
        var aggregates = this._matrix.aggregate,
            len = aggregates.getCount(),
            length = fields.length,
            data = [],
            index, i, j, agg, name, temp;
        for (i = 0; i < len; i++) {
            agg = aggregates.getAt(i);
            name = agg.dataIndex || agg.header;
            temp = name;
            index = 2;
            for (j = 0; j < length; j++) {
                if (String(temp).toLowerCase() === String(fields[j]).toLowerCase() || Ext.Array.indexOf(data, temp) >= 0) {
                    temp = name + index;
                    index++;
                    j = -1;
                }
            }
            data.push(temp);
            agg.excelName = temp;
        }
    },
    setupUniqueValues: function(dimensions, uniqueValues) {
        var items = dimensions.items,
            len = items.length,
            i, item;
        for (i = 0; i < len; i++) {
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
    getDimension: function(collection, name) {
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
    generateTopAxisColumns: function(params, colIndex, items) {
        var matrix = this._matrix,
            uniqueValues = params.data.uniqueValues,
            columns = params.columns,
            aggregates = matrix.aggregate.items,
            ret = [],
            i, j, k, len, length, levels, item, agg, col, level, obj, result, index;
        if (!items) {
            items = matrix.topAxis.getTree();
        }
        len = items.length;
        length = aggregates.length;
        for (i = 0; i < len; i++) {
            item = items[i];
            index = Ext.Array.indexOf(uniqueValues[item.dimension.dataIndex], item.value);
            level = item.level;
            columns[level] = columns[level] || [];
            col = {
                value: item.value == null ? '(blank)' : item.value,
                index: index
            };
            columns[level].push(col);
            if (item.children) {
                result = this.generateTopAxisColumns(params, colIndex, item.children);
                // fill in the current level with empty columns
                levels = result.length;
                for (j = 1; j < levels; j++) {
                    columns[level].push({
                        value: '',
                        empty: true
                    });
                }
                for (j = 0; j < length; j++) {
                    // add group total
                    agg = aggregates[j];
                    obj = {
                        value: col.value + ' ' + (agg.excelName)
                    };
                    columns[level].push(obj);
                    result.push(obj);
                    // fill in the bottom levels with empty columns below the group total
                    levels = columns.length;
                    for (k = level + 1; k < levels; k++) {
                        if (k === levels - 1) {
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
                if (length <= 1) {
                    ret.push(col);
                    colIndex++;
                    col.aggregate = true;
                    col.colItem = this.getColItem(colIndex, 0, columns);
                }
                if (length === 1) {
                    col.key = item.key;
                    col.dataIndex = aggregates[0].id;
                } else if (length > 1) {
                    level++;
                    columns[level] = columns[level] || [];
                    for (j = 0; j < length; j++) {
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
                        if (j > 0) {
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
    getColItem: function(colIndex, aggIndex, columns) {
        var colItem = {
                i: aggIndex
            },
            r = 0,
            x = [],
            len = columns.length,
            i, col;
        // we need to parse columns from top to bottom on the colIndex and find out what values are empty
        // so we can calculate r & x
        for (i = 0; i < len; i++) {
            col = columns[i][colIndex];
            if (col) {
                if (!col.empty) {
                    x.push(col.index);
                } else {}
            } else //r++;
            {
                r++;
            }
        }
        colItem.r = r;
        colItem.x = x;
        return colItem;
    }
});

/**
 * This class contains all predefined aggregator functions for the pivot grid.
 *
 * For each summary function (ie `fn`) defined in this class there's a property name (ie `fnText`) which will be
 * used by the configurator plugin to display the function used for each aggregate dimension.
 *
 * Override this class if more aggregate functions are needed:
 *
 *      Ext.define('overrides.pivot.Aggregators', {
 *          override: 'Ext.pivot.Aggregators',
 *
 *          fnText: 'My special fn', // useful when using the Configurator plugin
 *          fn: function(records, measure, matrix, rowGroupKey, colGroupKey){
 *              var result;
 *
 *              // ... calculate the result
 *
 *              return result;
 *          }
 *      });
 *
 * @singleton
 */
Ext.define('Ext.pivot.Aggregators', {
    alternateClassName: [
        'Mz.aggregate.Aggregators'
    ],
    singleton: true,
    /**
     * @property {String} customText
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    customText: 'Custom',
    /**
     * @property {String} sumText
     *
     * Defines the name of the {@link #sum} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    sumText: 'Sum',
    /**
     * @property {String} avgText
     *
     * Defines the name of the {@link #avg} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    avgText: 'Avg',
    /**
     * @property {String} minText
     *
     * Defines the name of the {@link #min} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    minText: 'Min',
    /**
     * @property {String} maxText
     *
     * Defines the name of the {@link #max} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    maxText: 'Max',
    /**
     * @property {String} countText
     *
     * Defines the name of the {@link #count} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    countText: 'Count',
    /**
     * @property {String} countNumbersText
     *
     * Defines the name of the {@link #countNumbers} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    countNumbersText: 'Count numbers',
    /**
     * @property {String} groupSumPercentageText
     *
     * Defines the name of the {@link #groupSumPercentage} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    groupSumPercentageText: 'Group sum percentage',
    /**
     * @property {String} groupCountPercentageText
     *
     * Defines the name of the {@link #groupCountPercentage} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    groupCountPercentageText: 'Group count percentage',
    /**
     * @property {String} varianceText
     *
     * Defines the name of the {@link #variance} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    varianceText: 'Var',
    /**
     * @property {String} variancePText
     *
     * Defines the name of the {@link #varianceP} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    variancePText: 'Varp',
    /**
     * @property {String} stdDevText
     *
     * Defines the name of the {@link #stdDev} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    stdDevText: 'StdDev',
    /**
     * @property {String} stdDevPText
     *
     * Defines the name of the {@link #stdDevP} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    stdDevPText: 'StdDevp',
    /**
     * Calculates the sum of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    sum: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            total = matrix.calculateAsExcel ? null : 0,
            i, value;
        // Excel works like this:
        // - if all values are null then sum is null
        // - if at least one value is not null then sum is not null (it's either 0 or some other number)
        for (i = 0; i < length; i++) {
            value = records[i].get(measure);
            if (value !== null) {
                if (total === null) {
                    total = 0;
                }
                if (typeof value === 'number') {
                    total += value;
                }
            }
        }
        return total;
    },
    /**
     * Calculates the avg of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    avg: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            asExcel = matrix.calculateAsExcel,
            total = asExcel ? null : 0,
            items = 0,
            i, value;
        // Excel works like this:
        // - it sums all numeric values
        // - it counts only the numeric values
        // - null and not numeric values are ignored
        for (i = 0; i < length; i++) {
            value = records[i].get(measure);
            if (typeof value === 'number') {
                if (total === null) {
                    total = 0;
                }
                total += value;
                items++;
            }
        }
        if (!asExcel) {
            items = length;
        }
        return (items > 0 && total !== null) ? (total / items) : null;
    },
    /**
     * Calculates the min of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    min: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            min = null,
            i, item, compare;
        // Excel works like this:
        // - if all values are null then min is null
        // - if all values are null except one that is a number then min is that number
        // - if all values are null except one that is a string then min is 0
        for (i = 0; i < length; i++) {
            item = records[i].get(measure);
            compare = true;
            if (matrix.calculateAsExcel) {
                if (item !== null) {
                    if (typeof item !== 'number') {
                        item = 0;
                        compare = false;
                    }
                    if (min === null) {
                        min = item;
                    }
                } else {
                    compare = false;
                }
            }
            if (compare && item < min) {
                min = item;
            }
        }
        return min;
    },
    /**
     * Calculates the max of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    max: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            max = null,
            i, item, compare;
        // Excel works like this:
        // - if all values are null then max is null
        // - if all values are null except one that is a number then max is that number
        // - if all values are null except one that is a string then max is 0
        for (i = 0; i < length; i++) {
            item = records[i].get(measure);
            compare = true;
            if (matrix.calculateAsExcel) {
                if (item !== null) {
                    if (typeof item !== 'number') {
                        item = 0;
                        compare = false;
                    }
                    if (max === null) {
                        max = item;
                    }
                } else {
                    compare = false;
                }
            }
            if (compare && item > max) {
                max = item;
            }
        }
        return max;
    },
    /**
     * Calculates the count of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    count: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            n = null,
            i, item;
        // Excel works like this:
        // - if all values are null then count is null
        // - count how many not-null values are
        if (matrix.calculateAsExcel) {
            for (i = 0; i < length; i++) {
                item = records[i].get(measure);
                if (item !== null) {
                    if (n === null) {
                        n = 0;
                    }
                    n++;
                }
            }
        } else {
            n = length;
        }
        return n;
    },
    /**
     * Calculates the number of all numeric values in the records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    countNumbers: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            n = null,
            i, item;
        // Excel works like this:
        // - if all values are null then countNumbers is null
        // - if all values are null except one that is a string then countNumbers is 0
        // - count how many numeric values are
        for (i = 0; i < length; i++) {
            item = records[i].get(measure);
            if (item !== null) {
                if (n === null) {
                    n = 0;
                }
                if (typeof item === 'number') {
                    n++;
                }
            }
        }
        return matrix.calculateAsExcel ? n : n || 0;
    },
    /**
     * Calculates the percentage from the row group sum.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    groupSumPercentage: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var sumFn = Ext.pivot.Aggregators.sum,
            length = records.length,
            keys = rowGroupKey.split(matrix.keysSeparator),
            sum = null,
            sumParent = null,
            result, resultParent;
        if (!length)  {
            return null;
        }
        
        keys.pop();
        keys = keys.join(matrix.keysSeparator);
        if (Ext.isEmpty(keys)) {
            keys = matrix.grandTotalKey;
        }
        result = matrix.results.get(rowGroupKey, colGroupKey);
        if (result) {
            if (result.hasValue('groupSum')) {
                sum = result.getValue('groupSum');
            } else {
                sum = result.calculateByFn('groupSum', measure, sumFn);
            }
        }
        resultParent = matrix.results.get(keys, colGroupKey);
        if (resultParent) {
            if (resultParent.hasValue('groupSum')) {
                sumParent = resultParent.getValue('groupSum');
            } else {
                sumParent = resultParent.calculateByFn('groupSum', measure, sumFn);
            }
        }
        return (sumParent !== null && sum !== null && sumParent !== 0) ? sum / sumParent * 100 : null;
    },
    /**
     * Calculates the percentage from the row group count.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    groupCountPercentage: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var countFn = Ext.pivot.Aggregators.count,
            length = records.length,
            keys = rowGroupKey.split(matrix.keysSeparator),
            sum = null,
            sumParent = null,
            result, resultParent;
        if (!length)  {
            return null;
        }
        
        keys.pop();
        keys = keys.join(matrix.keysSeparator);
        if (Ext.isEmpty(keys)) {
            keys = matrix.grandTotalKey;
        }
        result = matrix.results.get(rowGroupKey, colGroupKey);
        if (result) {
            if (result.hasValue('groupCount')) {
                sum = result.getValue('groupCount');
            } else {
                sum = result.calculateByFn('groupCount', measure, countFn);
            }
        }
        resultParent = matrix.results.get(keys, colGroupKey);
        if (resultParent) {
            if (resultParent.hasValue('groupCount')) {
                sumParent = resultParent.getValue('groupCount');
            } else {
                sumParent = resultParent.calculateByFn('groupCount', measure, countFn);
            }
        }
        return (sumParent !== null && sum !== null && sumParent !== 0) ? sum / sumParent * 100 : null;
    },
    /**
     * Calculates the sample variance of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    variance: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var asExcel = matrix.calculateAsExcel,
            me = Ext.pivot.Aggregators,
            count = asExcel ? me.countNumbers.apply(me, arguments) : records.length,
            avg = me.avg.apply(me, arguments),
            length = records.length,
            total = 0,
            i, item;
        // Excel works like this:
        // - only numbers in the array are counted
        // - null values, logical values or text are ignored.
        if (avg > 0) {
            for (i = 0; i < length; i++) {
                item = records[i].get(measure);
                if (asExcel) {
                    if (typeof item === 'number') {
                        total += Math.pow(item - avg, 2);
                    }
                } else {
                    total += Math.pow(Ext.Number.from(item, 0) - avg, 2);
                }
            }
        }
        return (total > 0 && count > 1) ? (total / (count - 1)) : null;
    },
    /**
     * Calculates the population variance of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    varianceP: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var asExcel = matrix.calculateAsExcel,
            me = Ext.pivot.Aggregators,
            count = asExcel ? me.countNumbers.apply(me, arguments) : records.length,
            avg = me.avg.apply(me, arguments),
            length = records.length,
            total = 0,
            i, item;
        // Excel works like this:
        // - only numbers in the array are counted
        // - null values, logical values or text are ignored.
        if (avg > 0) {
            for (i = 0; i < length; i++) {
                item = records[i].get(measure);
                if (asExcel) {
                    if (typeof item === 'number') {
                        total += Math.pow(item - avg, 2);
                    }
                } else {
                    total += Math.pow(Ext.Number.from(item, 0) - avg, 2);
                }
            }
        }
        return (total > 0 && count > 0) ? (total / count) : null;
    },
    /**
     * Calculates the sample standard deviation of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    stdDev: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var me = Ext.pivot.Aggregators,
            v = me.variance.apply(me, arguments);
        return v > 0 ? Math.sqrt(v) : null;
    },
    /**
     * Calculates the population standard deviation of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    stdDevP: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var me = Ext.pivot.Aggregators,
            v = me.varianceP.apply(me, arguments);
        return v > 0 ? Math.sqrt(v) : null;
    }
});

/**
 *
 * This class enhances the {@link Ext.util.MixedCollection} class by allowing the
 * children objects to be destroyed on remove.
 *
 * @private
 *
 */
Ext.define('Ext.pivot.MixedCollection', {
    extend: 'Ext.util.MixedCollection',
    alternateClassName: [
        'Mz.aggregate.MixedCollection'
    ],
    removeAt: function(index) {
        Ext.destroy(this.callParent(arguments));
    },
    clear: function() {
        this.destroyItems();
        this.callParent(arguments);
    },
    removeAll: function() {
        this.destroyItems();
        this.callParent(arguments);
    },
    destroy: function() {
        // destroy all objects in the items array
        this.clear();
    },
    destroyItems: function() {
        var items = this.items,
            len, i, item;
        // when having hundreds of thousand of items Ext.destroy fails because
        // the "apply" function cannot accept so many arguments
        if (items) {
            len = items.length;
            for (i = 0; i < len; i++) {
                item = items[i];
                if (item.destroy) {
                    item.destroy();
                }
            }
        }
    }
});

/**
 * Base implementation of a filter. It handles common type of filters.
 */
Ext.define('Ext.pivot.filter.Base', {
    alternateClassName: [
        'Mz.aggregate.filter.Abstract'
    ],
    alias: 'pivotfilter.base',
    mixins: [
        'Ext.mixin.Factoryable'
    ],
    isFilter: true,
    /**
     * @cfg {String} type
     * Used when you define a filter on a dimension to set what kind of filter is to be
     * instantiated.
     */
    /**
     * @cfg {String} operator (required)
     * Operator to use to compare labels/values to this Filter's {@link #value}.
     *
     * The `between` and `not between` operators expect this filter's {@link #value} to be an array with two values.
     *
     * Possible values are:
     *
     *  - `<`
     *  - `<=`
     *  - `=`
     *  - `>=`
     *  - `>`
     *  - `!=`
     *  - `between`
     *  - `not between`
     */
    operator: null,
    /**
     * @cfg {String/Array} value (required)
     * Value to filter by. For 'between' and 'not between' operators this should be an array of values.
     */
    value: null,
    /**
     * @cfg {Boolean} caseSensitive
     * During filtering should we use case sensitive comparison?
     *
     */
    caseSensitive: true,
    /**
     * @property {Ext.pivot.dimension.Item} parent
     * Reference to the parent dimension object.
     * @readonly
     * @private
     */
    parent: null,
    constructor: function(config) {
        var me = this,
            fmt = Ext.util.Format;
        // define thousand and decimal separator regexp
        me.thousandRe = new RegExp('[' + fmt.thousandSeparator + ']', 'g');
        me.decimalRe = new RegExp('[' + fmt.decimalSeparator + ']');
        Ext.apply(this, config);
        return this.callParent([
            config
        ]);
    },
    destroy: function() {
        var me = this;
        me.parent = me.thousandRe = me.decimalRe = null;
        me.callParent();
    },
    /**
     * Returns the serialized filter data as an object.
     *
     * @returns {Object}
     */
    serialize: function() {
        var me = this;
        return Ext.apply({
            type: me.type,
            operator: me.operator,
            value: me.value,
            caseSensitive: me.caseSensitive
        }, me.getSerialArgs() || {});
    },
    /**
     * @method
     * Template method to be implemented by all subclasses that is used to
     * get and return serialized filter data.
     *
     * Defaults to Ext.emptyFn.
     *
     */
    getSerialArgs: Ext.emptyFn,
    /**
     * Check if the specified value matches the filter.
     *
     * @returns Boolean True if the value matches the filter
     * @param value
     *
     */
    isMatch: function(value) {
        var me = this,
            v = me.value,
            ret, retFrom, retTo, from, to;
        v = (Ext.isArray(v) ? v[0] : v) || '';
        ret = me.compare(value, v);
        if (me.operator == '=') {
            return (ret === 0);
        }
        if (me.operator == '!=') {
            return (ret !== 0);
        }
        if (me.operator == '>') {
            return (ret > 0);
        }
        if (me.operator == '>=') {
            return (ret >= 0);
        }
        if (me.operator == '<') {
            return (ret < 0);
        }
        if (me.operator == '<=') {
            return (ret <= 0);
        }
        v = me.value;
        from = (Ext.isArray(v) ? v[0] : v) || '';
        to = (Ext.isArray(v) ? v[1] : v) || '';
        retFrom = me.compare(value, from);
        retTo = me.compare(value, to);
        if (me.operator == 'between') {
            return (retFrom >= 0 && retTo <= 0);
        }
        if (me.operator == 'not between') {
            return !(retFrom >= 0 && retTo <= 0);
        }
        // no valid operator was specified. ignore filtering
        return true;
    },
    /**
     * Check if the specified value is a number and returns it.
     *
     * Takes care of the regional settings (decimal and thousand separators).
     *
     * @param value
     * @return {Number} Returns the number or null if the value is not numeric
     * @private
     */
    parseNumber: function(value) {
        var v;
        if (typeof value === 'number') {
            return value;
        }
        if (Ext.isEmpty(value)) {
            value = '';
        }
        // if the value comes as a string it may be a number formatted using locale settings
        // which means that we need to convert it to a number with `.` decimal separator.
        v = String(value).replace(this.thousandRe, '');
        v = v.replace(this.decimalRe, '.');
        if (Ext.isNumeric(v)) {
            return parseFloat(v);
        }
        return null;
    },
    /**
     * Compare 2 values and return the result.
     *
     * @param a
     * @param b
     * @private
     */
    compare: function(a, b) {
        var sorter = Ext.pivot.matrix.Base.prototype.naturalSort,
            v1 = this.parseNumber(a),
            v2 = this.parseNumber(b);
        if (Ext.isNumber(v1) && Ext.isNumber(v2)) {
            return sorter(v1, v2);
        }
        if (Ext.isDate(a)) {
            if (Ext.isDate(b)) {
                return sorter(a, b);
            } else {
                return sorter(a, Ext.Date.parse(b, Ext.Date.defaultFormat));
            }
        }
        return (this.caseSensitive ? sorter(a || '', b || '') : sorter(String(a || '').toLowerCase(), String(b || '').toLowerCase()));
    },
    deprecated: {
        '6.0': {
            properties: {
                /**
                 * @cfg {String} mztype
                 *
                 * @deprecated 6.0 Use {@link #type} instead. The old type config was renamed to {@link #operator}.
                 */
                mztype: null,
                /**
                 * @cfg {String} from
                 * @deprecated 6.0 Use {@link #value} instead as an array with 2 values.
                 *
                 * Used in case of a 'between/not between' type of filter
                 *
                 */
                from: null,
                /**
                 * @cfg {String} to
                 * @deprecated 6.0 Use {@link #value} instead as an array with 2 values.
                 *
                 * Used in case of a 'between/not between' operator
                 *
                 */
                to: null
            }
        }
    }
});

/**
 * Label filter class. Use this filter type when you want to filter
 * the left/top axis results by their values.
 *
 * Example:
 *
 *      {
 *          xtype: 'pivotgrid',
 *
 *          matrix: {
 *              // This example will generate a grid column for the year 2012
 *              // instead of columns for all unique years.
 *              topAxis: [{
 *                  dataIndex:  'year',
 *                  header:     'Year',
 *                  filter: {
 *                      type:       'label',
 *                      operator:   '=',
 *                      value:      2012
 *                  }
 *              }]
 *
 *              leftAxis: [{
 *                  dataIndex:  'country',
 *                  header:     'Country',
 *                  filter: {
 *                      type:       'label',
 *                      operator:   'in',
 *                      value:      ['USA', 'Canada', 'Australia']
 *                  }
 *              }]
 *          }
 *      }
 *
 */
Ext.define('Ext.pivot.filter.Label', {
    alternateClassName: [
        'Mz.aggregate.filter.Label'
    ],
    extend: 'Ext.pivot.filter.Base',
    alias: 'pivotfilter.label',
    /**
     * @cfg {String} operator
     * @inheritdoc
     * @localdoc
     *  * `begins`
     *  * `not begins`
     *  * `ends`
     *  * `not ends`
     *  * `contains`
     *  * `not contains`
     *  * `in`
     *  * `not in`
     *
     * The `in` and `not in` operators expect this filter's {@link #value} to be an array of values.
     *
     */
    /**
     * @inheritdoc
     */
    isMatch: function(value) {
        var me = this,
            v;
        if (me.operator == 'begins') {
            return Ext.String.startsWith(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        if (me.operator == 'not begins') {
            return !Ext.String.startsWith(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        if (me.operator == 'ends') {
            return Ext.String.endsWith(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        if (me.operator == 'not ends') {
            return !Ext.String.endsWith(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        if (me.operator == 'contains') {
            return me.stringContains(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        if (me.operator == 'not contains') {
            return !me.stringContains(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        if (me.operator == 'in') {
            return me.foundInArray(me.value);
        }
        if (me.operator == 'not in') {
            return !me.foundInArray(me.value);
        }
        // no valid operator was specified. check if it matches the parent class.
        return me.callParent(arguments);
    },
    foundInArray: function(item) {
        var values = Ext.Array.from(this.value),
            len = values.length,
            found = false,
            i;
        if (this.caseSensitive) {
            return Ext.Array.indexOf(values, item) >= 0;
        } else {
            for (i = 0; i < len; i++) {
                found = found || (String(item).toLowerCase() == String(values[i]).toLowerCase());
                if (found) {
                    break;
                }
            }
            return found;
        }
    },
    /**
     * Check if the specified string contains the substring
     *
     * @param {String} s The original string
     * @param {String} start The substring to check
     * @param {Boolean} [ignoreCase=false] True to ignore the case in the comparison
     *
     * @private
     */
    stringContains: function(s, start, ignoreCase) {
        var result = (start.length <= s.length);
        if (result) {
            if (ignoreCase) {
                s = s.toLowerCase();
                start = start.toLowerCase();
            }
            result = (s.lastIndexOf(start) >= 0);
        }
        return result;
    },
    deprecated: {
        '6.0': {
            methods: {
                /**
                 * Checks if a string starts with a substring
                 *
                 * @deprecated 6.0 This method is deprecated.
                 *
                 * @method startsWith
                 * @param {String} s The original string
                 * @param {String} start The substring to check
                 * @param {Boolean} [ignoreCase=false] True to ignore the case in the comparison
                 */
                startsWith: Ext.emptyFn,
                /**
                 * Checks if a string ends with a substring
                 *
                 * @deprecated 6.0 This method is deprecated.
                 *
                 * @method endsWith
                 * @param {String} s The original string
                 * @param {String} end The substring to check
                 * @param {Boolean} [ignoreCase=false] True to ignore the case in the comparison
                 */
                endsWith: Ext.emptyFn
            }
        }
    }
});

/**
 * Value filter class. Use this filter type when you want to filter
 * the left/top axis results by the grand total summary values.
 *
 * Example for a value filter:
 *
 *      {
 *          xtype: 'pivotgrid',
 *
 *          matrix: {
 *              // This example will generate a column for each year
 *              // that has its grand total value between 1,000 and 15,000.
 *              aggregate: [{
 *                  id:         'agg',
 *                  dataIndex:  'value',
 *                  aggregator: 'sum',
 *                  header:     'Total'
 *              }],
 *              topAxis: [{
 *                  dataIndex:  'year',
 *                  header:     'Year',
 *                  filter: {
 *                      type:           'value',
 *                      operator:       'between',
 *                      dimensionId:    'agg',  // this is the id of an aggregate dimension
 *                      value:          [1000, 15000]
 *                  }
 *              }]
 *          }
 *      }
 *
 *
 * Top 10 filter works as following:
 *
 * First of all sort axis groups by grand total value of the specified dimension. The sorting
 * order depends on top/bottom configuration.
 *
 *  - Top/Bottom 10 Items: Keep only the top x items from the groups array
 *
 *  - Top/Bottom 10 Percent: Find first combined values to total at least x percent of the parent grandtotal
 *
 *  - Top/Bottom 10 Sum: Find first combined values to total at least x
 *
 *
 * Example for a top 10 value filter:
 *
 *      {
 *          xtype: 'pivotgrid',
 *
 *          matrix: {
 *              // This example will return the bottom 3 years that have the smallest
 *              // sum of value.
 *              aggregate: [{
 *                  id:         'agg',
 *                  dataIndex:  'value',
 *                  aggregator: 'sum',
 *                  header:     'Total'
 *              }],
 *              leftAxis: [{
 *                  dataIndex:  'year',
 *                  header:     'Year',
 *                  filter: {
 *                      type:           'value',
 *                      operator:       'top10',
 *                      dimensionId:    'agg',   // this is the id of an aggregate dimension
 *                      topType:        'items',
 *                      topOrder:       'bottom',
 *                      value:          3
 *                  }
 *              }]
 *          }
 *      }
 *
 */
Ext.define('Ext.pivot.filter.Value', {
    alternateClassName: [
        'Mz.aggregate.filter.Value'
    ],
    extend: 'Ext.pivot.filter.Base',
    alias: 'pivotfilter.value',
    /**
     * @cfg {String} operator
     * @inheritdoc
     * @localdoc
     *    * `top10`
     *
     */
    /**
     * @cfg {String} dimensionId (required)
     *
     * Id of the aggregate dimension used to filter by the specified value
     *
     */
    dimensionId: '',
    /**
     * @cfg {String} [topType="items"]
     *
     * Specify here which kind of Top10 we need to perform.
     * Possible values: items, percent, sum
     *
     */
    topType: 'items',
    /**
     * @cfg {String} [topOrder="top"]
     *
     * Which kind of top10 do you want? Possible values: top, bottom
     *
     */
    topOrder: 'top',
    /**
     * @cfg {Boolean} [topSort=true]
     *
     * Should the top10 results be sorted? If True then the dimension sorting is ignored and
     * the results are sorted by the grand total in DESC (topOrder = top) or ASC (topOrder = bottom) order.
     *
     */
    topSort: true,
    /**
     * @property {Boolean} isTopFilter
     * @readonly
     *
     * Is this a top10 type of filter?
     *
     */
    isTopFilter: false,
    constructor: function(config) {
        var ret = this.callParent([
                config
            ]);
        if (Ext.isEmpty(this.dimensionId)) {
            Ext.raise('dimensionId is mandatory on Value filters');
        }
        this.isTopFilter = (this.operator === 'top10');
        return ret;
    },
    destroy: function() {
        this.dimension = null;
        this.callParent();
    },
    getDimension: function() {
        if (!this.parent.matrix.aggregate.getByKey(this.dimensionId)) {
            Ext.raise('There is no aggregate dimension that matches the dimensionId provided');
        }
        return this.parent.matrix.aggregate.getByKey(this.dimensionId);
    },
    /**
     * @inheritdoc
     */
    getSerialArgs: function() {
        var me = this;
        return {
            dimensionId: me.dimensionId,
            topType: me.topType,
            topOrder: me.topOrder,
            topSort: me.topSort
        };
    },
    /**
     * This function performs top10 on the specified array.
     *
     * @param axis
     * @param treeItems
     *
     * @private
     */
    applyFilter: function(axis, treeItems) {
        var me = this,
            items = me.topSort ? treeItems : Ext.Array.clone(treeItems),
            ret = [];
        if (treeItems.length == 0) {
            return ret;
        }
        //sort the items by the grand total value in ASC(top)/DESC(bottom) order
        me.sortItemsByGrandTotal(axis, items);
        switch (me.topType) {
            case 'items':
                ret = me.extractTop10Items(items);
                break;
            case 'sum':
                ret = me.extractTop10Sum(items);
                break;
            case 'percent':
                ret = me.extractTop10Percent(axis, items);
                break;
        }
        if (!me.topSort) {
            items.length = 0;
        }
        return ret;
    },
    /**
     *
     * @param items
     * @returns {Array}
     *
     * @private
     */
    extractTop10Items: function(items) {
        // we have to extract all values which are not part of the top
        // ie: we need to extract top2 but there are 3 values which are the same
        var me = this,
            uniqueValues = [],
            i;
        for (i = 0; i < items.length; i++) {
            if (uniqueValues.indexOf(items[i]['tempVar']) < 0) {
                uniqueValues.push(items[i]['tempVar']);
                if (uniqueValues.length > me.value || (me.value < i + 1 && i > 0)) {
                    break;
                }
            }
        }
        return Ext.Array.slice(items, i);
    },
    /**
     *
     * @param items
     * @returns {Array}
     *
     * @private
     */
    extractTop10Sum: function(items) {
        var me = this,
            sum = 0,
            i;
        for (i = 0; i < items.length; i++) {
            sum += items[i]['tempVar'];
            if (sum >= me.value) {
                break;
            }
        }
        return Ext.Array.slice(items, i + 1);
    },
    /**
     *
     * @param axis
     * @param items
     * @returns {Array}
     *
     * @private
     */
    extractTop10Percent: function(axis, items) {
        var me = this,
            sum = 0,
            keys = items[0].key.split(axis.matrix.keysSeparator),
            i, leftKey, topKey, parentKey, result, grandTotal;
        //let's find the parent grand total
        keys.length--;
        parentKey = (keys.length > 0 ? keys.join(axis.matrix.keysSeparator) : axis.matrix.grandTotalKey);
        leftKey = (axis.isLeftAxis ? parentKey : axis.matrix.grandTotalKey);
        topKey = (axis.isLeftAxis ? axis.matrix.grandTotalKey : parentKey);
        result = axis.matrix.results.get(leftKey, topKey);
        grandTotal = (result ? result.getValue(me.dimensionId) : 0);
        for (i = 0; i < items.length; i++) {
            sum += items[i]['tempVar'];
            if ((sum * 100 / grandTotal) >= me.value) {
                break;
            }
        }
        return Ext.Array.slice(items, i + 1);
    },
    /**
     *
     * @param axis
     * @param items
     *
     * @private
     */
    sortItemsByGrandTotal: function(axis, items) {
        var me = this,
            leftKey, topKey, result, i;
        //let's fetch the grandtotal values and store them in a temp var on each item
        for (i = 0; i < items.length; i++) {
            leftKey = (axis.isLeftAxis ? items[i].key : axis.matrix.grandTotalKey);
            topKey = (axis.isLeftAxis ? axis.matrix.grandTotalKey : items[i].key);
            result = axis.matrix.results.get(leftKey, topKey);
            items[i]['tempVar'] = (result ? result.getValue(me.dimensionId) : 0);
        }
        Ext.Array.sort(items, function(a, b) {
            var result = axis.matrix.naturalSort(a['tempVar'], b['tempVar']);
            if (result < 0 && me.topOrder === 'top') {
                return 1;
            }
            if (result > 0 && me.topOrder === 'top') {
                return -1;
            }
            return result;
        });
    }
});

/**
 * This class is used to initialize the dimensions defined on the pivot grid leftAxis,
 * topAxis and aggregate.
 */
Ext.define('Ext.pivot.dimension.Item', {
    alternateClassName: [
        'Mz.aggregate.dimension.Item'
    ],
    requires: [
        'Ext.pivot.MixedCollection',
        'Ext.pivot.filter.Label',
        'Ext.pivot.filter.Value',
        'Ext.app.bind.Template'
    ],
    $configPrefixed: false,
    $configStrict: false,
    config: {
        /**
         * @cfg {String} id
         * Unique id of this dimension.
         */
        id: null,
        /**
         * @cfg {String} header (required)
         *
         * This text is visible in the pivot grid in the following cases:
         *
         * - the dimension is defined on the left axis. The pivot grid will generate one grid column per dimension and
         * this header will go into the grid column header.
         *
         * - the dimension is defined on the aggregate. The pivot grid will generate one grid column per dimension per top
         * axis label. If there are at least 2 aggregate dimensions then this header will be visible. When only one is
         * defined the aggregate dimension header is replaced by the top axis label.
         *
         * - if the {@link Ext.pivot.plugin.Configurator Configurator plugin} is used then this header will be visible
         * in the axis panels.
         *
         */
        header: '',
        /**
         * @cfg {String} dataIndex (required)
         * The field name on the record from where this dimension extracts data.
         */
        dataIndex: '',
        /**
         * @cfg {String} sortIndex
         * Field name on the record used when sorting this dimension results. Defaults to {@link #dataIndex} if
         * none is specified.
         */
        sortIndex: '',
        /**
         * @cfg {Number} [width=100]
         * Default column width when this dimension is a left axis or aggregate dimension.
         * Used by the generated columns.
         */
        width: 100,
        /**
         * @cfg {Number} [flex=0]
         * Column flex when this dimension is a left axis or aggregate dimension.
         * Used by the generated columns.
         */
        flex: 0,
        /**
         * @cfg {String} [align="left"]
         * Column alignment when this dimension is a left axis or aggregate dimension.
         * Used by the generated columns.
         */
        align: 'left',
        /**
         * @cfg {Boolean} [sortable=true]
         * Is this dimension sortable when the pivot is generated?
         */
        sortable: true,
        /**
         * @cfg {"ASC"/"DESC"} [direction="ASC"]
         * If this dimension is sortable then this is the type of sorting.
         */
        direction: 'ASC',
        /**
         * @cfg {Function} sorterFn
         * Provide here your own sorting function for this dimension.
         * If none is specified then the defaultSorterFn is used.
         */
        sorterFn: null,
        /**
         * @cfg {Boolean} [caseSensitiveSort=true]
         * If this dimension is sortable, should we do a case sensitive sort?
         */
        caseSensitiveSort: true,
        /**
         * @cfg {Ext.pivot.filter.Base} filter
         * Provide a filter configuration to filter your axis items.
         * This works only on left/top axis dimensions.
         *
         * Example for a label filter:
         *
         *      {
         *          dataIndex:  'year',
         *          header:     'Year',
         *          filter: {
         *              type:       'label',
         *              operator:   '=',
         *              value:      2012
         *          }
         *      }
         *
         *
         * Example for a value filter:
         *
         *      {
         *          dataIndex:  'year',
         *          header:     'Year',
         *          filter: {
         *              type:       'value',
         *              operator:   'between',
         *              value:      [2012, 2015]
         *          }
         *      }
         *
         *
         * Example for a top 10 value filter:
         *
         *      {
         *          dataIndex:  'year',
         *          header:     'Year',
         *          filter: {
         *              type:           'value',
         *              operator:       'top10',
         *              dimensionId:    'value',   // this is the id of an aggregate dimension
         *              topType:        'items',
         *              topOrder:       'bottom'
         *          }
         *      }
         */
        filter: null,
        /**
         * @cfg {String/Function} labelRenderer
         *
         * Callback function or the name of the callback function to execute when labels
         * are generated for this dimension.
         *
         * **Note:** This works when the dimension is used as either left or top axis dimension.
         *
         * Example:
         *
         *      {
         *          xtype: 'pivot',
         *
         *          matrix: {
         *              topAxis: [{
         *                  dataIndex: 'month'
         *                  labelRenderer: function(monthValue){
         *                      return Ext.Date.monthNames[monthValue];
         *                  }
         *              }]
         *
         *              // ...
         *          }
         *      }
         *
         * The above labelRenderer will convert the month value to a textual month name.
         *
         * @param {Mixed} value Value that needs to be formatted
         * @return {String} The label value displayed in the pivot grid
         */
        labelRenderer: null,
        /**
         * @cfg {String/Function} renderer
         *
         * Callback function or the name of the callback function that will be attached to the grid column
         * generated for this dimension.
         *
         * **Note:** This works when the dimension is used as either left axis or aggregate dimension.
         *
         * The following example describes how columns are generated by the pivot grid:
         *
         *      {
         *          xtype: 'pivot',
         *
         *          matrix: {
         *              leftAxis: [{
         *                  dataIndex: 'country'
         *              }],
         *
         *              topAxis: [{
         *                  dataIndex: 'year',
         *                  labelRenderer: function(v) {
         *                      return 'Year ' + v;
         *                  }
         *              }],
         *
         *              aggregate: [{
         *                  dataIndex: 'value',
         *                  aggregator: 'sum',
         *                  renderer: function(value, metaData, record, rowIndex, colIndex, store, view){
         *                      metaData.tdCls = (value < 0) ? 'redCls' : 'greenCls';
         *                      return Ext.util.Format(value, '0,000.00');
         *                  }
         *              },{
         *                  dataIndex: 'qty',
         *                  aggregator: 'sum',
         *                  renderer: function(value, metaData, record, rowIndex, colIndex, store, view){
         *                      metaData.tdCls = (value < 0) ? 'redCls' : 'greenCls';
         *                      return Ext.util.Format(value, '0.00');
         *                  }
         *              }]
         *          }
         *      }
         *
         * Let's say that we have records for the years 2015 and 2016. In this scenario the resulting grid will have:
         *
         *  - 1 column for the left axis dimension defined. This column will use the renderer defined on the left
         *  axis dimension
         *  - 4 columns calculated for the top axis results (2) multiplied by the number of aggregate dimensions (2). These columns will
         *  use the renderers defined on the aggregate dimensions and each group column header is generated using
         *  labelRenderer defined on the top axis dimension.
         *
         * Read more about grid column renderers {@link Ext.grid.column.Column#renderer here}.
         *
         */
        renderer: null,
        /**
         * @cfg {String} formatter
         *
         * This formatter will be attached to the grid column generated for this dimension.
         *
         * **Note:** This works when the dimension is used either as a left axis or an aggregate dimension.
         *
         * Read more about grid column formatters {@link Ext.grid.column.Column#formatter here}.
         */
        formatter: null,
        /**
         * @cfg {Object} column
         *
         * Configuration object that will be used when the grid columns are generated. Beware that this
         * object will be merged into each column generated for each aggregate and left axis dimensions.
         *
         * **Note:** This works when the dimension is used either as a left axis or an aggregate dimension.
         */
        column: null,
        /**
         * @cfg {Ext.exporter.file.Style/Ext.exporter.file.Style[]} exportStyle
         *
         * Style used during export by the {@link Ext.pivot.plugin.Exporter exporter plugin}. This style will
         * be applied to the columns generated for the aggregate or left axis dimensions in the exported file.
         *
         * You could define it as a single object that will be used by all exporters:
         *
         *      aggregate: [{
         *          dataIndex: 'price',
         *          header: 'Total',
         *          aggregator: 'sum',
         *          exportStyle: {
         *              format: 'Currency',
         *              alignment: {
         *                  horizontal: 'Right'
         *              },
         *              font: {
         *                  italic: true
         *              }
         *          }
         *      }]
         *
         * You could also define it as an array of objects, each object having a `type` that specifies by
         * which exporter will be used:
         *
         *      aggregate: [{
         *          dataIndex: 'price',
         *          header: 'Total',
         *          aggregator: 'sum',
         *          exportStyle: [{
         *              type: 'html', // used by the `html` exporter
         *              format: 'Currency',
         *              alignment: {
         *                  horizontal: 'Right'
         *              },
         *              font: {
         *                  italic: true
         *              }
         *          },{
         *              type: 'csv', // used by the `csv` exporter
         *              format: 'General'
         *          }]
         *      }]
         *
         *
         * Or you can define it as an array of objects that has:
         *
         * - one object with no `type` key that is considered the style to use by all exporters
         * - objects with the `type` key defined that are exceptions of the above rule
         *
         *
         *      aggregate: [{
         *          dataIndex: 'price',
         *          header: 'Total',
         *          aggregator: 'sum',
         *          exportStyle: [{
         *              // no type defined means this is the default
         *              format: 'Currency',
         *              alignment: {
         *                  horizontal: 'Right'
         *              },
         *              font: {
         *                  italic: true
         *              }
         *          },{
         *              type: 'csv', // only the CSV exporter has a special style
         *              format: 'General'
         *          }]
         *      }]
         *
         */
        exportStyle: null,
        /**
         * @cfg {Object} scope
         *
         * Scope to run all custom functions defined on the dimension item.
         */
        scope: null,
        /**
         * @cfg {Function} grouperFn
         *
         * This function is used when the groups are generated for the axis.
         * It will return the value that will uniquely identify a group on the axis.
         *
         * ie: you have a Date field that you want to group by year.
         * This renderer could return the year from that Date value.
         *
         * The function receives one parameter and that is the record.
         *
         * It will run using Ext.callback so you can also provide a String that resolves to the view controller.
         *
         * @param {Ext.data.Model} record Record used to extract the group value
         * @return {String/Number}
         */
        grouperFn: null,
        /**
         * @cfg {String} [blankText="(blank)"]
         * Default text to use when a group name is blank. This value is applied even if you set your own label renderer.
         */
        blankText: '(blank)',
        /**
         * @cfg {Boolean} [showZeroAsBlank=false]
         * Should 0 values be displayed as blank? This config is used when
         * this is an aggregate dimension.
         */
        showZeroAsBlank: false,
        /**
         * @cfg {String/Function} [aggregator="sum"]
         * This is the function that should be used to aggregate when this is an aggregate dimension.
         *
         * You can either provide a function name available in {@link Ext.pivot.Aggregators} or
         * set your own function.
         *
         * It's probably best to override {@link Ext.pivot.Aggregators} to add you own function
         * and use that function name on this config. This way the stateles pivot will save this value.
         */
        aggregator: 'sum',
        /**
         * @cfg {Ext.util.MixedCollection} values
         * Collection of unique values on this dimension; each item has a "value" and a "display".
         */
        values: []
    },
    /**
     * @property {Boolean} isAggregate
     * True to identify a dimension of an aggregate configuration.
     */
    isAggregate: false,
    /**
     * @property {Ext.pivot.matrix.Base} matrix
     * @readonly
     * Reference to the matrix object.
     */
    matrix: null,
    constructor: function(config) {
        var me = this;
        this.initConfig(config);
        if (!me.getId()) {
            // generate an internal id used by the matrix
            me.setId(Ext.id());
        }
        if (Ext.isEmpty(me.dataIndex)) {
            Ext.raise('No dataIndex provided to the dimension!');
        }
        if (!me.grouperFn) {
            me.groupFn = Ext.bind(me.defaultGrouperFn, me);
        }
        if (me.sortable) {
            if (!me.sorterFn) {
                me.sortFn = Ext.bind(me.defaultSorterFn, me);
            }
        } else {
            me.sortFn = Ext.bind(me.manualSorterFn, me);
        }
        if (Ext.isEmpty(me.getSortIndex())) {
            me.setSortIndex(me.getDataIndex());
        }
        if (me.isAggregate && !me.getFormatter() && !me.getRenderer()) {
            // in most cases the aggregate value is a number
            me.setRenderer(me.getDefaultFormatRenderer('0,000.00'));
        }
        return this.callParent([
            config
        ]);
    },
    destroy: function() {
        this.setConfig({
            values: null,
            grouperFn: null,
            sorterFn: null,
            filter: null,
            renderer: null,
            labelRenderer: null,
            aggregator: null
        });
        this.callParent();
    },
    /**
     * Returns the serialized dimension data.
     * @return {Object}
     */
    serialize: function() {
        return this.getConfiguration(true);
    },
    /**
     * Returns the actual configuration of this dimension.
     *
     * @param {Boolean} [serializable=false] Set to true if the result is serializable and should not include functions
     * @return {Object}
     */
    getConfiguration: function(serializable) {
        var me = this,
            cfg = me.getConfig();
        delete (cfg.values);
        if (cfg.filter) {
            cfg.filter = cfg.filter.serialize();
        }
        if (serializable && typeof cfg.aggregator === 'function') {
            cfg.aggregator = 'sum';
        }
        if (serializable && typeof cfg.renderer === 'function') {
            cfg.renderer = null;
        }
        if (serializable && typeof cfg.labelRenderer === 'function') {
            cfg.labelRenderer = null;
        }
        return cfg;
    },
    applyId: function(id) {
        return id ? id : Ext.id();
    },
    updateExportStyle: function(style) {
        if (style && !style.id) {
            style.id = this.getId();
        }
    },
    applyFilter: function(filter, oldFilter) {
        if (filter == null) {
            return filter;
        }
        if (filter && filter.isFilter) {
            filter.parent = this;
            return filter;
        }
        if (Ext.isObject(filter)) {
            Ext.applyIf(filter, {
                type: 'label',
                parent: this
            });
            filter = Ext.Factory.pivotfilter(filter);
        } else {
            filter = false;
        }
        return filter;
    },
    updateAggregator: function(fn) {
        var aggregators = Ext.pivot.Aggregators;
        if (Ext.isString(fn) && Ext.isFunction(aggregators[fn])) {
            this.aggregatorFn = Ext.bind(aggregators[fn], aggregators);
        } else {
            this.aggregatorFn = fn || 'sum';
        }
    },
    updateGrouperFn: function(fn) {
        this.groupFn = (Ext.isFunction(fn) ? Ext.bind(fn, this) : fn);
    },
    updateSorterFn: function(fn) {
        this.sortFn = (Ext.isFunction(fn) ? Ext.bind(fn, this) : fn);
    },
    /**
     * Add unique values available for this dimension. These are used when filtering.
     *
     * @param value
     * @param display
     */
    addValue: function(value, display) {
        var values = this.values;
        if (!values.getByKey(value)) {
            values.add({
                sortValue: value,
                value: value,
                display: display
            });
        }
    },
    applyValues: function(values, oldValues) {
        var ret;
        Ext.destroy(oldValues);
        if (values && !values.isInstance) {
            ret = new Ext.pivot.MixedCollection();
            ret.getKey = function(item) {
                return item.value;
            };
            ret.addAll(values);
            return ret;
        }
        return values;
    },
    sortValues: function() {
        if (this.sortable) {
            this.values.sortBy(this.sortFn);
        }
    },
    /**
     * Default sorter function used to sort the axis dimensions on the same tree level.
     *
     * @param o1
     * @param o2
     *
     * @return {Number}
     */
    defaultSorterFn: function(o1, o2) {
        var me = this,
            s1 = o1.sortValue,
            s2 = o2.sortValue,
            result;
        if (s1 instanceof Date) {
            s1 = s1.getTime();
        }
        if (s2 instanceof Date) {
            s2 = s2.getTime();
        }
        if (!me.caseSensitiveSort) {
            s1 = typeof s1 === 'string' ? s1.toUpperCase() : s1;
            s2 = typeof s2 === 'string' ? s2.toUpperCase() : s2;
        }
        if (me.matrix.useNaturalSorting) {
            result = me.matrix.naturalSort(s1, s2);
        } else {
            result = (s1 === s2 ? 0 : (s1 < s2 ? -1 : 1));
        }
        if (result < 0 && me.direction === 'DESC') {
            return 1;
        }
        if (result > 0 && me.direction === 'DESC') {
            return -1;
        }
        return result;
    },
    /**
     * When we have manual sorting then we need to sort the items by the order they appear in the
     * internal `values` collection (unique values for this dimension).
     *
     * @param o1
     * @param o2
     * @return {number}
     * @private
     */
    manualSorterFn: function(o1, o2) {
        // sort items by their appearance in the list of values
        var v = this.values,
            i1 = v ? v.indexOfKey(o1.value) : 0,
            i2 = v ? v.indexOfKey(o2.value) : 0;
        return (i1 === i2 ? 0 : (i1 < i2 ? -1 : 1));
    },
    /**
     * Builds a renderer function by using the specified format.
     *
     * @param format Could be either a function or a string
     */
    getDefaultFormatRenderer: function(format) {
        var me = this;
        return function(v) {
            var positive;
            if (Ext.isEmpty(format)) {
                return v;
            }
            if (Ext.isFunction(format)) {
                return format.apply(me, arguments);
            }
            if (!Ext.isNumber(v)) {
                return v;
            }
            if (me.isAggregate && v === 0 && me.showZeroAsBlank) {
                return '';
            }
            positive = (v >= 0);
            v = Math.abs(v);
            v = Ext.util.Format.number(v, format);
            return positive ? v : '-' + v;
        };
    },
    /**
     * Default grouper function used for rendering axis item values.
     * The grouper function can be used to group together multiple items.
     * Returns a group value
     *
     * @param record
     * @return {String/Number/Date}
     */
    defaultGrouperFn: function(record) {
        return record.get(this.dataIndex);
    },
    getFormatterFn: function() {
        var me = this,
            format = me.getFormatter(),
            scoped;
        if (format) {
            scoped = format.indexOf('this.') === 0;
            if (scoped) {
                format = format.substring(5);
            }
            format = Ext.app.bind.Template.prototype.parseFormat(format);
            if (scoped) {
                format.scope = null;
            }
            return function(v) {
                return format.format(v, format.scope || me.getScope() || me.matrix.cmp.resolveListenerScope('self.controller') || this);
            };
        }
    },
    /**
     * @method
     * This function is used when we summarize the records for a left/top pair.
     *
     * @private
     */
    aggregatorFn: Ext.emptyFn,
    /**
     * @method
     * This function is used when the axis item value is generated. It will either be the defaultGrouperFn or a custom one.
     * It will run using Ext.callback to you can also provide a String that resolves to the view controller.
     *
     * @private
     */
    groupFn: Ext.emptyFn,
    /**
     * @method
     * This function is used for sorting axis items
     *
     * @private
     */
    sortFn: Ext.emptyFn
});

/**
 * The axis has items that are generated when the records are processed.
 *
 * This class stores info about such an item.
 */
Ext.define('Ext.pivot.axis.Item', {
    alternateClassName: [
        'Mz.aggregate.axis.Item'
    ],
    /**
     * @property {Number} level The tree level this item belongs to
     * @readonly
     *
     */
    level: 0,
    /**
     * @cfg {String} key
     *
     * The key that uniquely identifies this item in the tree. The key is a string compound of
     * all parent items keys separated by the matrix keysSeparator
     *
     */
    key: '',
    /**
     * @cfg {String/Number} value The item value as it appears in the store
     *
     */
    value: '',
    /**
     * @cfg {String/Number} sortValue The item sort value as it appears in the store. This value will be used when sorting results.
     *
     */
    sortValue: '',
    /**
     * @cfg {String} name The item name after the grouperFn was applied to the {@link #value}
     *
     */
    name: '',
    /**
     * @cfg {String} id Id of the dimension this item refers to.
     *
     */
    dimensionId: '',
    /**
     * @property {Ext.pivot.dimension.Item} dimension The dimension instance
     * @readonly
     *
     */
    dimension: null,
    /**
     * @property {Ext.pivot.axis.Item[]} children Array of children items this item has
     *
     */
    children: null,
    /**
     * @property {Ext.data.Model} record
     * @readonly
     *
     * When the {@link Ext.pivot.matrix.Local Local} matrix is used this is the pivot store record generated for this axis item.
     * Only bottom level items belonging to the leftAxis have this property.
     *
     */
    record: null,
    records: null,
    /**
     * @property {Ext.pivot.axis.Base} axis Parent axis instance
     * @readonly
     *
     */
    axis: null,
    /**
     * Object that stores all values from all axis items parents
     *
     * @private
     */
    data: null,
    /**
     * @property {Boolean} expanded Is this item expanded or collapsed?
     *
     */
    expanded: false,
    constructor: function(config) {
        var me = this,
            axis;
        Ext.apply(me, config || {});
        if (Ext.isEmpty(me.sortValue)) {
            me.sortValue = me.value;
        }
        axis = me.axis;
        me.expanded = (axis && ((axis.isLeftAxis && !axis.matrix.collapsibleRows) || (!axis.isLeftAxis && !axis.matrix.collapsibleColumns)));
        me.callParent(arguments);
    },
    destroy: function() {
        var me = this;
        Ext.destroy(me.children);
        me.axis = me.data = me.dimension = me.record = me.children = me.records = null;
        me.callParent(arguments);
    },
    /**
     * Returns the group total text formatted according to the template defined in the matrix
     *
     */
    getTextTotal: function() {
        var me = this,
            groupHeaderTpl = Ext.XTemplate.getTpl(me.axis.matrix, 'textTotalTpl');
        return groupHeaderTpl.apply({
            groupField: me.dimension.dataIndex,
            columnName: me.dimension.dataIndex,
            name: me.name,
            rows: me.children || []
        });
    },
    /**
     * Expand this item and fire the groupexpand event on the matrix
     *
     * @param {Boolean} includeChildren Expand the children tree too?
     */
    expand: function(includeChildren) {
        var me = this;
        me.expanded = true;
        if (includeChildren === true) {
            me.expandCollapseChildrenTree(true);
        }
        me.axis.matrix.fireEvent('groupexpand', me.axis.matrix, (me.axis.isLeftAxis ? 'row' : 'col'), me);
    },
    /**
     * Collapse this item and fire the groupcollapse event on the matrix
     *
     * @param {Boolean} includeChildren Collapse the children tree too?
     */
    collapse: function(includeChildren) {
        var me = this;
        me.expanded = false;
        if (includeChildren === true) {
            me.expandCollapseChildrenTree(false);
        }
        me.axis.matrix.fireEvent('groupcollapse', me.axis.matrix, (me.axis.isLeftAxis ? 'row' : 'col'), me);
    },
    /**
     * Expand or collapse all children tree of the specified item
     *
     * @private
     */
    expandCollapseChildrenTree: function(state) {
        var me = this,
            i;
        me.expanded = state;
        if (Ext.isArray(me.children)) {
            for (i = 0; i < me.children.length; i++) {
                me.children[i].expandCollapseChildrenTree(state);
            }
        }
    }
});

/**
 * Base implementation of a pivot axis. You may customize multiple dimensions
 * on an axis. Basically this class stores all labels that were generated
 * for the configured dimensions.
 *
 * Example:
 *
 *      leftAxis: [{
 *          dataIndex:  'person',
 *          header:     'Person',
 *          sortable:   false
 *      },{
 *          dataIndex:  'country',
 *          header:     'Country',
 *          direction:  'DESC'
 *      }]
 *
 */
Ext.define('Ext.pivot.axis.Base', {
    alternateClassName: [
        'Mz.aggregate.axis.Abstract'
    ],
    alias: 'pivotaxis.base',
    mixins: [
        'Ext.mixin.Factoryable'
    ],
    requires: [
        'Ext.pivot.MixedCollection',
        'Ext.pivot.dimension.Item',
        'Ext.pivot.axis.Item'
    ],
    /**
     * @cfg {Ext.pivot.dimension.Item[]} dimensions All dimensions configured for this axis.
     *
     */
    dimensions: null,
    /**
     * @property {Ext.pivot.matrix.Base} matrix Matrix instance this axis belongs to.
     *
     */
    matrix: null,
    /**
     * @property {Ext.pivot.MixedCollection} items All items generated for this axis are stored in this collection.
     *
     */
    items: null,
    /**
     * When the tree is built for this axis it is stored in this property.
     *
     * @private
     */
    tree: null,
    /**
     * @property {Number} levels No of levels this axis tree has
     * @readonly
     *
     */
    levels: 0,
    /**
     * @property {Boolean} isLeftAxis Internal flag to know which axis is this one
     * @readonly
     */
    isLeftAxis: false,
    constructor: function(config) {
        var me = this,
            i, sorter;
        if (!config || !config.matrix) {
            Ext.log('Wrong initialization of the axis!');
            return;
        }
        me.isLeftAxis = config.isLeftAxis || me.isLeftAxis;
        me.matrix = config.matrix;
        me.tree = [];
        // init dimensions
        me.dimensions = new Ext.pivot.MixedCollection();
        me.dimensions.getKey = function(item) {
            return item.getId();
        };
        me.items = new Ext.pivot.MixedCollection();
        me.items.getKey = function(item) {
            return item.key;
        };
        Ext.Array.each(Ext.Array.from(config.dimensions || []), me.addDimension, me);
    },
    destroy: function() {
        var me = this;
        Ext.destroyMembers(me, 'dimensions', 'items', 'tree');
        me.matrix = me.dimensions = me.items = me.tree = null;
    },
    /**
     * Create an {@link Ext.pivot.dimension.Item} object with the specified config and add it to the
     * internal collection of dimensions.
     *
     * @param {Object} config Config object for the {@link Ext.pivot.dimension.Item} that is created.
     */
    addDimension: function(config) {
        var item = config;
        if (!config) {
            return;
        }
        if (!config.isInstance) {
            item = new Ext.pivot.dimension.Item(config);
        }
        item.matrix = this.matrix;
        this.dimensions.add(item);
    },
    /**
     * Add the specified item to the internal collection of items.
     *
     * @param {Object} item Config object for the {@link Ext.pivot.axis.Item} that is added
     */
    addItem: function(item) {
        var me = this;
        if (!Ext.isObject(item) || Ext.isEmpty(item.key) || Ext.isEmpty(item.value) || Ext.isEmpty(item.dimensionId)) {
            return false;
        }
        item.key = String(item.key);
        item.dimension = me.dimensions.getByKey(item.dimensionId);
        item.name = item.name || Ext.callback(item.dimension.labelRenderer, item.dimension.scope || 'self.controller', [
            item.value
        ], 0, me.matrix.cmp) || item.value;
        item.dimension.addValue(item.value, item.name);
        item.axis = me;
        if (!me.items.map[item.key] && item.dimension) {
            me.items.add(new Ext.pivot.axis.Item(item));
            return true;
        }
        return false;
    },
    /**
     * Clear all items and the tree.
     *
     */
    clear: function() {
        this.items.clear();
        this.tree = null;
    },
    /**
     * This function parses the internal collection of items and builds a tree.
     * This tree is used by the Matrix class to generate the pivot store and column headers.
     *
     */
    getTree: function() {
        if (!this.tree) {
            this.buildTree();
        }
        return this.tree;
    },
    /**
     * Expand all groups
     */
    expandAll: function() {
        var me = this,
            items = me.getTree(),
            len = items.length,
            i;
        for (i = 0; i < len; i++) {
            items[i].expandCollapseChildrenTree(true);
        }
        // we fire a single groupexpand event without any item
        if (len > 0) {
            me.matrix.fireEvent('groupexpand', me.matrix, (me.isLeftAxis ? 'row' : 'col'), null);
        }
    },
    /**
     * Collapse all groups
     */
    collapseAll: function() {
        var me = this,
            items = me.getTree(),
            len = items.length,
            i;
        for (i = 0; i < len; i++) {
            items[i].expandCollapseChildrenTree(false);
        }
        // we fire a single groupcollapse event without any item
        if (len > 0) {
            me.matrix.fireEvent('groupcollapse', me.matrix, (me.isLeftAxis ? 'row' : 'col'), null);
        }
    },
    /**
     * Find the first element in the tree that matches the criteria (attribute = value).
     *
     * It returns an object with the tree element and depth level.
     *
     * @return {Object}
     */
    findTreeElement: function(attribute, value) {
        var items = this.items,
            len = items.getCount(),
            found = false,
            i, item;
        for (i = 0; i < len; i++) {
            item = items.items[i];
            if (Ext.isDate(value) ? Ext.Date.isEqual(item[attribute], value) : item[attribute] === value) {
                found = true;
                break;
            }
        }
        return found ? {
            level: item.level,
            node: item
        } : null;
    },
    /**
     * This function builds the internal tree after all records were processed
     *
     * @private
     */
    buildTree: function() {
        var me = this,
            items = me.dimensions.items,
            len = items.length,
            i, item, keys, parentKey, el;
        for (i = 0; i < len; i++) {
            // sort unique values for each dimension on this axis
            items[i].sortValues();
        }
        me.tree = [];
        // transform the flat items collection into a tree
        items = me.items.items;
        len = items.length;
        for (i = 0; i < len; i++) {
            item = items[i];
            keys = String(item.key).split(me.matrix.keysSeparator);
            keys = Ext.Array.slice(keys, 0, keys.length - 1);
            parentKey = keys.join(me.matrix.keysSeparator);
            el = me.items.map[parentKey];
            if (el) {
                item.level = el.level + 1;
                item.data = Ext.clone(el.data || {});
                el.children = el.children || [];
                el.children.push(item);
            } else {
                item.level = 0;
                item.data = {};
                me.tree.push(item);
            }
            item.data[item.dimension.getId()] = item.name;
            //item.data[item.dimension.getId()] = item.value;
            me.levels = Math.max(me.levels, item.level);
        }
        me.sortTree();
    },
    rebuildTree: function() {
        var items = this.items.items,
            len = items.length,
            i;
        this.tree = null;
        for (i = 0; i < len; i++) {
            items[i].children = null;
        }
        this.buildTree();
    },
    /**
     * Sort the tree using the sorters defined on the axis dimensions
     *
     * @private
     */
    sortTree: function() {
        var tree = arguments[0] || this.tree,
            len = tree.length,
            dimension, i, item;
        if (tree.length > 0) {
            dimension = tree[0].dimension;
        }
        if (dimension) {
            // let's sort this array
            Ext.Array.sort(tree, dimension.sortFn);
        }
        for (i = 0; i < len; i++) {
            item = tree[i];
            if (item.children) {
                this.sortTree(item.children);
            }
        }
    },
    /**
     * Sort the tree by the specified field and direction.
     *
     * If the field is one of the axis dimension then sort by that otherwise go to the records and sort
     * them by that field.
     *
     * @param field
     * @param direction
     *
     * @returns {Boolean}
     * @private
     */
    sortTreeByField: function(field, direction) {
        var me = this,
            sorted = false,
            dimension, len, i;
        if (field == me.matrix.compactViewKey) {
            // in compact view we need to sort by all axis dimensions
            sorted = me.sortTreeByDimension(me.tree, me.dimensions.items, direction);
            len = me.dimensions.items.length;
            for (i = 0; i < len; i++) {
                me.dimensions.items[i].direction = direction;
            }
        } else {
            direction = direction || 'ASC';
            dimension = me.dimensions.getByKey(field);
            if (dimension) {
                // we need to sort the tree level where this dimension exists
                sorted = me.sortTreeByDimension(me.tree, dimension, direction);
                dimension.direction = direction;
            } else {
                // the field is not a dimension defined on the axis, so it's probably a generated field on the
                // pivot record which means we need to sort by calculated values
                sorted = me.sortTreeByRecords(me.tree, field, direction);
            }
        }
        return sorted;
    },
    /**
     * Sort tree by a specified dimension. The dimension's sorter function is used for sorting.
     *
     * @param tree
     * @param dimension
     * @param direction
     * @returns {Boolean}
     *
     * @private
     */
    sortTreeByDimension: function(tree, dimension, direction) {
        var sorted = false,
            dimensions = Ext.Array.from(dimension),
            aDimension, len, i, temp;
        tree = tree || [];
        len = tree.length;
        if (len > 0) {
            aDimension = tree[0].dimension;
        }
        if (Ext.Array.indexOf(dimensions, aDimension) >= 0) {
            if (aDimension.sortable) {
                // we have to sort this tree items by the dimension sortFn
                temp = aDimension.direction;
                aDimension.direction = direction;
                Ext.Array.sort(tree, aDimension.sortFn);
                aDimension.direction = temp;
            }
            // we do not change the dimension direction now since we didn't finish yet
            sorted = aDimension.sortable;
        }
        // the dimension we want to sort may be on leaves
        // in compact view mode we need to sort everything
        for (i = 0; i < len; i++) {
            sorted = this.sortTreeByDimension(tree[i].children, dimension, direction) || sorted;
        }
        // ready now so exit
        return sorted;
    },
    /**
     * Sort tree by values on a generated field on the pivot model.
     *
     * @param tree
     * @param field
     * @param direction
     * @returns {boolean}
     *
     * @private
     */
    sortTreeByRecords: function(tree, field, direction) {
        var i, len;
        tree = tree || [];
        len = tree.length;
        if (len <= 0) {
            return false;
        }
        if (tree[0].record) {
            this.sortTreeRecords(tree, field, direction);
        } else {
            this.sortTreeLeaves(tree, field, direction);
        }
        for (i = 0; i < len; i++) {
            this.sortTreeByRecords(tree[i].children, field, direction);
        }
        return true;
    },
    /**
     * Sort the records array of each item in the tree
     *
     * @param tree
     * @param field
     * @param direction
     *
     * @private
     */
    sortTreeRecords: function(tree, field, direction) {
        var sortFn = this.matrix.naturalSort;
        direction = direction || 'ASC';
        // let's sort the records of this item
        Ext.Array.sort(tree || [], function(a, b) {
            var result,
                o1 = a.record,
                o2 = b.record;
            if (!(o1 && o1.isModel && o2 && o2.isModel)) {
                return 0;
            }
            result = sortFn(o1.get(field) || '', o2.get(field) || '');
            if (result < 0 && direction === 'DESC') {
                return 1;
            }
            if (result > 0 && direction === 'DESC') {
                return -1;
            }
            return result;
        });
    },
    /**
     * Sort tree leaves by their group summary.
     *
     * @param tree
     * @param field
     * @param direction
     *
     * @returns {Boolean}
     *
     * @private
     */
    sortTreeLeaves: function(tree, field, direction) {
        var sortFn = this.matrix.naturalSort,
            results = this.matrix.results,
            matrixModel = this.matrix.model,
            idx = Ext.Array.indexOf(Ext.Array.pluck(matrixModel, 'name'), field),
            col, agg;
        if (idx < 0) {
            return false;
        }
        col = matrixModel[idx]['col'];
        agg = matrixModel[idx]['agg'];
        direction = direction || 'ASC';
        // let's sort the records of this item
        Ext.Array.sort(tree || [], function(a, b) {
            var result, o1, o2;
            o1 = results.get(a.key, col);
            if (o1) {
                o1 = o1.getValue(agg);
            } else {
                o1 = 0;
            }
            o2 = results.get(b.key, col);
            if (o2) {
                o2 = o2.getValue(agg);
            } else {
                o2 = 0;
            }
            result = sortFn(o1, o2);
            if (result < 0 && direction === 'DESC') {
                return 1;
            }
            if (result > 0 && direction === 'DESC') {
                return -1;
            }
            return result;
        });
    }
});

/**
 * Axis implementation specific to {@link Ext.pivot.matrix.Local} matrix.
 */
Ext.define('Ext.pivot.axis.Local', {
    alternateClassName: [
        'Mz.aggregate.axis.Local'
    ],
    extend: 'Ext.pivot.axis.Base',
    alias: 'pivotaxis.local',
    /**
     * This method processes the record and creates items for the configured dimensions.
     * If there's at least one label filter set on this axis dimensions and there's no
     * match then the function returns null.
     *
     * @param record
     * @returns {Array/null}
     * @private
     *
     */
    processRecord: function(record) {
        var me = this,
            items = [],
            parentKey = '',
            filterOk = true,
            dimCount = me.dimensions.items.length,
            groupValue, groupKey, dimension, i;
        for (i = 0; i < dimCount; i++) {
            dimension = me.dimensions.items[i];
            groupValue = Ext.callback(dimension.groupFn, dimension.scope || 'self.controller', [
                record
            ], 0, me.matrix.cmp);
            groupKey = parentKey ? parentKey + me.matrix.keysSeparator : '';
            groupValue = Ext.isEmpty(groupValue) ? dimension.blankText : groupValue;
            groupKey += me.matrix.getKey(groupValue);
            if (dimension.filter instanceof Ext.pivot.filter.Label) {
                // can't use the groupName to filter. That one could have html code in it because of the renderer
                filterOk = dimension.filter.isMatch(groupValue);
            }
            // if at least one filter has no match then don't add this record
            if (!filterOk) {
                break;
            }
            items.push({
                value: groupValue,
                sortValue: record.get(dimension.sortIndex),
                key: groupKey,
                dimensionId: dimension.getId()
            });
            parentKey = groupKey;
        }
        if (filterOk) {
            return items;
        } else {
            return null;
        }
    },
    /**
     * Build the tree and apply value filters.
     *
     */
    buildTree: function() {
        this.callParent(arguments);
        this.filterTree();
    },
    /**
     * Apply all value filters to the tree.
     *
     * @private
     */
    filterTree: function() {
        var me = this,
            length = me.dimensions.items.length,
            hasFilters = false,
            i;
        // if at least one dimension has a value filter then parse the tree
        for (i = 0; i < length; i++) {
            hasFilters = hasFilters || (me.dimensions.items[i].filter instanceof Ext.pivot.filter.Value);
        }
        if (!hasFilters) {
            return;
        }
        me.matrix.filterApplied = true;
        me.filterTreeItems(me.tree);
    },
    filterTreeItems: function(items) {
        var me = this,
            filter, i, filteredItems;
        if (!items || !Ext.isArray(items) || items.length <= 0) {
            return;
        }
        filter = items[0].dimension.filter;
        if (filter && (filter instanceof Ext.pivot.filter.Value)) {
            if (filter.isTopFilter) {
                filteredItems = filter.applyFilter(me, items) || [];
            } else {
                filteredItems = Ext.Array.filter(items, me.canRemoveItem, me);
            }
            me.removeRecordsFromResults(filteredItems);
            me.removeItemsFromArray(items, filteredItems);
            for (i = 0; i < filteredItems.length; i++) {
                me.removeTreeChildren(filteredItems[i]);
            }
        }
        for (i = 0; i < items.length; i++) {
            if (items[i].children) {
                me.filterTreeItems(items[i].children);
                if (items[i].children.length === 0) {
                    // destroy removed item?
                    me.items.remove(items[i]);
                    // if all children were removed then remove the parent too
                    Ext.Array.erase(items, i, 1);
                    i--;
                }
            }
        }
    },
    removeTreeChildren: function(item) {
        var i, len;
        if (item.children) {
            len = item.children.length;
            for (i = 0; i < len; i++) {
                this.removeTreeChildren(item.children[i]);
            }
        }
        this.items.remove(item);
    },
    canRemoveItem: function(item) {
        var me = this,
            leftKey = (me.isLeftAxis ? item.key : me.matrix.grandTotalKey),
            topKey = (me.isLeftAxis ? me.matrix.grandTotalKey : item.key),
            result = me.matrix.results.get(leftKey, topKey),
            filter = item.dimension.filter;
        return (result ? !filter.isMatch(result.getValue(filter.dimensionId)) : false);
    },
    removeItemsFromArray: function(source, toDelete) {
        for (var i = 0; i < source.length; i++) {
            if (Ext.Array.indexOf(toDelete, source[i]) >= 0) {
                Ext.Array.erase(source, i, 1);
                i--;
            }
        }
    },
    removeRecordsFromResults: function(items) {
        for (var i = 0; i < items.length; i++) {
            this.removeRecordsByItem(items[i]);
        }
    },
    removeRecordsByItem: function(item) {
        var me = this,
            keys, i, results, result, toRemove;
        if (item.children) {
            me.removeRecordsFromResults(item.children);
        }
        if (me.isLeftAxis) {
            toRemove = me.matrix.results.get(item.key, me.matrix.grandTotalKey);
            results = me.matrix.results.getByLeftKey(me.matrix.grandTotalKey);
        } else {
            toRemove = me.matrix.results.get(me.matrix.grandTotalKey, item.key);
            results = me.matrix.results.getByTopKey(me.matrix.grandTotalKey);
        }
        if (!toRemove) {
            return;
        }
        // remove records from grand totals
        for (i = 0; i < results.length; i++) {
            me.removeItemsFromArray(results[i].records, toRemove.records);
        }
        keys = item.key.split(me.matrix.keysSeparator);
        keys.length = keys.length - 1;
        while (keys.length > 0) {
            // remove records from parent groups
            if (me.isLeftAxis) {
                results = me.matrix.results.getByLeftKey(keys.join(me.matrix.keysSeparator));
            } else {
                results = me.matrix.results.getByTopKey(keys.join(me.matrix.keysSeparator));
            }
            for (i = 0; i < results.length; i++) {
                me.removeItemsFromArray(results[i].records, toRemove.records);
            }
            keys.length = keys.length - 1;
        }
    }
});

/**
 * This class remodels the grid store when required.
 *
 * @private
 */
Ext.define('Ext.pivot.feature.PivotStore', {
    config: {
        store: null,
        grid: null,
        matrix: null,
        clsGrandTotal: '',
        clsGroupTotal: ''
    },
    totalRowEvent: 'pivottotal',
    groupRowEvent: 'pivotgroup',
    itemRowEvent: 'pivotitem',
    constructor: function(config) {
        this.initConfig(config);
        return this.callParent(arguments);
    },
    destroy: function() {
        var me = this;
        Ext.destroy(me.storeListeners, me.matrixListeners);
        me.setConfig({
            store: null,
            matrix: null,
            grid: null
        });
        me.storeInfo = me.storeListeners = null;
        me.callParent(arguments);
    },
    updateStore: function(store) {
        var me = this;
        Ext.destroy(me.storeListeners);
        if (store) {
            me.storeListeners = store.on({
                // this event is fired by the pivot grid for private use
                pivotstoreremodel: me.processStore,
                scope: me,
                destroyable: true
            });
        }
    },
    updateMatrix: function(matrix) {
        var me = this;
        Ext.destroy(me.matrixListeners);
        if (matrix) {
            me.matrixListeners = matrix.on({
                // this event is fired by the pivot grid for private use
                groupexpand: me.onGroupExpand,
                groupcollapse: me.onGroupCollapse,
                scope: me,
                destroyable: true
            });
        }
    },
    processStore: function() {
        var me = this,
            store = me.getStore(),
            matrix = me.getMatrix(),
            records = [],
            items, length, i, group, fields;
        if (!matrix || !store) {
            return;
        }
        fields = matrix.getColumns();
        store.suspendEvents();
        store.model.replaceFields(fields, true);
        me.storeInfo = {};
        if (matrix.rowGrandTotalsPosition == 'first') {
            records.push.apply(records, me.processGrandTotal() || []);
        }
        items = matrix.leftAxis.getTree();
        length = items.length;
        for (i = 0; i < length; i++) {
            group = items[i];
            records.push.apply(records, me.processGroup({
                group: group,
                previousExpanded: (i > 0 ? items[i - 1].expanded : false)
            }) || []);
        }
        if (matrix.rowGrandTotalsPosition == 'last') {
            records.push.apply(records, me.processGrandTotal() || []);
        }
        // loadRecords called by loadData removes existing records by default.
        store.loadData(records);
        store.resumeEvents();
        store.fireEvent('refresh', store);
    },
    processGroup: function(config) {
        var me = this,
            fn = me['processGroup' + Ext.String.capitalize(me.getMatrix().viewLayoutType)];
        if (!Ext.isFunction(fn)) {
            // specified view type doesn't exist so let's use the outline view
            fn = me.processGroupOutline;
        }
        return fn.call(me, config);
    },
    processGrandTotal: function() {
        var me = this,
            found = false,
            matrix = me.getMatrix(),
            group = {
                key: matrix.grandTotalKey
            },
            records = [],
            lenT = matrix.totals.length,
            dimensions = matrix.leftAxis.dimensions.items,
            lenD = dimensions.length,
            i, j, k, total, column, record, key;
        for (i = 0; i < lenT; i++) {
            total = matrix.totals[i];
            record = total.record;
            k = lenD;
            if (record && record.isModel) {
                me.storeInfo[record.internalId] = {
                    leftKey: group.key,
                    rowStyle: '',
                    rowClasses: [
                        me.getClsGrandTotal()
                    ],
                    rowEvent: me.totalRowEvent,
                    rendererParams: {}
                };
                for (j = 0; j < lenD; j++) {
                    column = dimensions[j];
                    if (matrix.viewLayoutType == 'compact' || j === 0) {
                        if (matrix.viewLayoutType == 'compact') {
                            key = matrix.compactViewKey;
                            k = 1;
                        } else {
                            key = column.getId();
                        }
                        record.data[key] = total.title;
                        me.storeInfo[record.internalId].rendererParams[key] = {
                            fn: 'groupOutlineRenderer',
                            group: group,
                            colspan: k,
                            hidden: false,
                            subtotalRow: true
                        };
                        found = true;
                    } else {
                        me.storeInfo[record.internalId].rendererParams[column.id] = {
                            fn: 'groupOutlineRenderer',
                            group: group,
                            colspan: 0,
                            hidden: found,
                            subtotalRow: true
                        };
                        k--;
                    }
                }
                // for all top axis columns use a new renderer
                me.storeInfo[record.internalId].rendererParams['topaxis'] = {
                    fn: 'topAxisRenderer'
                };
                records.push(record);
            }
        }
        return records;
    },
    // Outline view functions    
    processGroupOutline: function(config) {
        var me = this,
            group = config['group'],
            results = [];
        if (group.record) {
            me.processRecordOutline({
                results: results,
                group: group
            });
        } else {
            me.processGroupOutlineWithChildren({
                results: results,
                group: group,
                previousExpanded: config.previousExpanded
            });
        }
        return results;
    },
    processGroupOutlineWithChildren: function(config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            previousExpanded = config['previousExpanded'],
            hasSummaryData, record, i, len;
        hasSummaryData = (!group.expanded || (group.expanded && matrix.rowSubTotalsPosition == 'first'));
        record = group.expanded ? group.records.expanded : group.records.collapsed;
        me.processGroupHeaderRecordOutline({
            results: config.results,
            group: group,
            record: record,
            previousExpanded: previousExpanded,
            hasSummaryData: hasSummaryData
        });
        if (group.expanded) {
            if (group.children) {
                len = group.children.length;
                for (i = 0; i < len; i++) {
                    if (group.children[i]['children']) {
                        me.processGroupOutlineWithChildren({
                            results: config.results,
                            group: group.children[i]
                        });
                    } else {
                        me.processRecordOutline({
                            results: config.results,
                            group: group.children[i]
                        });
                    }
                }
            }
            if (matrix.rowSubTotalsPosition == 'last') {
                record = group.records.footer;
                me.processGroupHeaderRecordOutline({
                    results: config.results,
                    group: group,
                    record: record,
                    previousExpanded: previousExpanded,
                    subtotalRow: true,
                    hasSummaryData: true
                });
            }
        }
    },
    processGroupHeaderRecordOutline: function(config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            record = config['record'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'],
            hasSummaryData = config['hasSummaryData'],
            items = matrix.leftAxis.dimensions.items,
            len = items.length,
            k = len,
            found = false,
            i, column;
        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [
                me.getClsGroupTotal()
            ],
            rowEvent: me.groupRowEvent,
            rendererParams: {}
        };
        for (i = 0; i < len; i++) {
            column = items[i];
            if (column.id == group.dimension.id) {
                me.storeInfo[record.internalId].rendererParams[column.id] = {
                    fn: 'groupOutlineRenderer',
                    group: group,
                    colspan: k,
                    hidden: false,
                    previousExpanded: previousExpanded,
                    subtotalRow: subtotalRow
                };
                found = true;
            } else {
                me.storeInfo[record.internalId].rendererParams[column.id] = {
                    fn: 'groupOutlineRenderer',
                    group: group,
                    colspan: 0,
                    hidden: found,
                    previousExpanded: previousExpanded,
                    subtotalRow: subtotalRow
                };
                k--;
            }
        }
        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: (hasSummaryData ? 'topAxisRenderer' : 'topAxisNoRenderer'),
            group: group
        };
        config.results.push(record);
    },
    processRecordOutline: function(config) {
        var me = this,
            group = config['group'],
            found = false,
            record = group.record,
            items = me.getMatrix().leftAxis.dimensions.items,
            len = items.length,
            i, column;
        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [],
            rowEvent: me.itemRowEvent,
            rendererParams: {}
        };
        for (i = 0; i < len; i++) {
            column = items[i];
            if (column.id == group.dimension.id) {
                found = true;
            }
            me.storeInfo[record.internalId].rendererParams[column.id] = {
                fn: 'recordOutlineRenderer',
                group: group,
                hidden: !found
            };
        }
        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: 'topAxisRenderer',
            group: group
        };
        config.results.push(record);
    },
    // Compact view functions
    processGroupCompact: function(config) {
        var me = this,
            group = config['group'],
            previousExpanded = config['previousExpanded'],
            results = [];
        if (group.record) {
            me.processRecordCompact({
                results: results,
                group: group
            });
        } else {
            me.processGroupCompactWithChildren({
                results: results,
                group: group,
                previousExpanded: previousExpanded
            });
        }
        return results;
    },
    processGroupCompactWithChildren: function(config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            previousExpanded = config['previousExpanded'],
            hasSummaryData, i, len;
        hasSummaryData = (!group.expanded || (group.expanded && matrix.rowSubTotalsPosition == 'first'));
        me.processGroupHeaderRecordCompact({
            results: config.results,
            group: group,
            record: group.expanded ? group.records.expanded : group.records.collapsed,
            previousExpanded: previousExpanded,
            hasSummaryData: hasSummaryData
        });
        if (group.expanded) {
            if (group.children) {
                len = group.children.length;
                for (i = 0; i < len; i++) {
                    if (group.children[i]['children']) {
                        me.processGroupCompactWithChildren({
                            results: config.results,
                            group: group.children[i]
                        });
                    } else {
                        me.processRecordCompact({
                            results: config.results,
                            group: group.children[i]
                        });
                    }
                }
            }
            if (matrix.rowSubTotalsPosition == 'last') {
                me.processGroupHeaderRecordCompact({
                    results: config.results,
                    group: group,
                    record: group.records.footer,
                    previousExpanded: previousExpanded,
                    subtotalRow: true,
                    hasSummaryData: true
                });
            }
        }
    },
    processGroupHeaderRecordCompact: function(config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            record = config['record'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'],
            hasSummaryData = config['hasSummaryData'];
        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [
                me.getClsGroupTotal()
            ],
            rowEvent: me.groupRowEvent,
            rendererParams: {}
        };
        me.storeInfo[record.internalId].rendererParams[matrix.compactViewKey] = {
            fn: 'groupCompactRenderer',
            group: group,
            colspan: 0,
            previousExpanded: previousExpanded,
            subtotalRow: subtotalRow
        };
        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: (hasSummaryData ? 'topAxisRenderer' : 'topAxisNoRenderer'),
            group: group
        };
        config.results.push(record);
    },
    processRecordCompact: function(config) {
        var me = this,
            group = config['group'],
            record = group.record;
        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [],
            rowEvent: me.itemRowEvent,
            rendererParams: {}
        };
        me.storeInfo[record.internalId].rendererParams[me.getMatrix().compactViewKey] = {
            fn: 'recordCompactRenderer',
            group: group
        };
        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: 'topAxisRenderer',
            group: group
        };
        config.results.push(record);
    },
    // Tabular view functions
    processGroupTabular: function(config) {
        var me = this,
            group = config['group'],
            results = [];
        if (group.record) {
            me.processRecordTabular({
                results: results,
                group: group
            });
        } else {
            me.processGroupTabularWithChildren({
                results: results,
                group: group,
                previousExpanded: config.previousExpanded
            });
        }
        return results;
    },
    processGroupTabularWithChildren: function(config, noFirstRecord) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            previousExpanded = config['previousExpanded'],
            record, i, child, len;
        if (!noFirstRecord) {
            me.processGroupHeaderRecordTabular({
                results: config.results,
                group: group,
                previousExpanded: previousExpanded,
                hasSummaryData: !group.expanded
            });
        }
        if (group.expanded) {
            if (group.children) {
                len = group.children.length;
                for (i = 0; i < len; i++) {
                    child = group.children[i];
                    if (i === 0 && child.children && child.expanded) {
                        me.processGroupTabularWithChildren({
                            results: config.results,
                            group: child
                        }, true);
                    } else if (i > 0) {
                        if (child.children) {
                            me.processGroupTabularWithChildren({
                                results: config.results,
                                group: child
                            });
                        } else {
                            me.processRecordTabular({
                                results: config.results,
                                group: child
                            });
                        }
                    }
                }
            }
            if (matrix.rowSubTotalsPosition !== 'none') {
                record = group.records.footer;
                me.processGroupHeaderRecordTabular({
                    results: config.results,
                    group: group,
                    record: record,
                    previousExpanded: previousExpanded,
                    subtotalRow: true,
                    hasSummaryData: true
                });
            }
        }
    },
    // used in PivotEvents
    getTabularGroupRecord: function(group) {
        var record = group.record;
        if (!record) {
            if (!group.expanded) {
                record = group.records.collapsed;
            } else {
                record = this.getTabularGroupRecord(group.children[0]);
            }
        }
        return record;
    },
    processGroupHeaderRecordTabular: function(config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            record = config['record'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'],
            hasSummaryData = config['hasSummaryData'],
            dimensions = matrix.leftAxis.dimensions,
            len = dimensions.length,
            k = len,
            found = false,
            rendererParams = {},
            rowClasses = [],
            rowEvent = me.itemRowEvent,
            i, dim, item, keys, parentGroup, prevGroup;
        if (!record) {
            item = group;
            record = item.record;
            while (!record) {
                rendererParams[item.dimension.id] = {
                    fn: 'groupTabularRenderer',
                    group: item,
                    colspan: 0,
                    hidden: false,
                    previousExpanded: previousExpanded,
                    subtotalRow: subtotalRow
                };
                if (item.children) {
                    if (!item.expanded) {
                        record = item.records.collapsed;
                        rendererParams[item.dimension.id].colspan = len - item.level;
                    } else {
                        item = item.children[0];
                    }
                } else {
                    record = item.record;
                }
            }
            //Ext.apply(record.data, item.data);
            found = false;
            for (i = 0; i < len; i++) {
                dim = matrix.leftAxis.dimensions.items[i];
                if (rendererParams[dim.id]) {
                    record.data[dim.id] = rendererParams[dim.id].group.name;
                    found = true;
                } else if (found) {
                    rendererParams[dim.id] = {
                        fn: 'groupTabularRenderer',
                        group: group,
                        colspan: 0,
                        hidden: true,
                        previousExpanded: previousExpanded,
                        subtotalRow: subtotalRow
                    };
                } else {
                    record.data[dim.id] = '';
                }
            }
            if (group.level > 0) {
                prevGroup = group;
                keys = prevGroup.key.split(matrix.keysSeparator);
                keys.length--;
                parentGroup = matrix.leftAxis.items.getByKey(keys.join(matrix.keysSeparator));
                while (parentGroup && parentGroup.children[0] == prevGroup) {
                    rendererParams[parentGroup.dimension.id] = {
                        fn: 'groupTabularRenderer',
                        group: parentGroup,
                        colspan: 0,
                        hidden: false,
                        previousExpanded: previousExpanded,
                        subtotalRow: subtotalRow
                    };
                    record.data[parentGroup.dimension.id] = parentGroup.name;
                    prevGroup = parentGroup;
                    keys = prevGroup.key.split(matrix.keysSeparator);
                    keys.length--;
                    parentGroup = matrix.leftAxis.items.getByKey(keys.join(matrix.keysSeparator));
                }
            }
        } else {
            for (i = 0; i < len; i++) {
                dim = matrix.leftAxis.dimensions.items[i];
                rendererParams[dim.id] = {
                    fn: 'groupTabularRenderer',
                    group: group,
                    colspan: 0,
                    hidden: false,
                    previousExpanded: previousExpanded,
                    subtotalRow: subtotalRow
                };
                if (dim.id == group.dimension.id) {
                    rendererParams[dim.id].colspan = k;
                    found = true;
                } else {
                    rendererParams[dim.id].hidden = found;
                    k--;
                }
            }
            item = group;
        }
        if (hasSummaryData) {
            rowClasses.push(me.getClsGroupTotal());
            rowEvent = me.groupRowEvent;
        }
        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: rowClasses,
            rowEvent: rowEvent,
            rendererParams: rendererParams
        };
        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: 'topAxisRenderer',
            group: item
        };
        config.results.push(record);
    },
    processRecordTabular: function(config) {
        var me = this,
            group = config['group'],
            found = false,
            record = group.record,
            items = me.getMatrix().leftAxis.dimensions.items,
            len = items.length,
            i, column;
        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [],
            rowEvent: me.itemRowEvent,
            rendererParams: {}
        };
        for (i = 0; i < len; i++) {
            column = items[i];
            if (column.id == group.dimension.id) {
                found = true;
            } else {
                record.data[column.id] = null;
            }
            me.storeInfo[record.internalId].rendererParams[column.id] = {
                fn: 'recordTabularRenderer',
                group: group,
                hidden: !found
            };
        }
        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: 'topAxisRenderer',
            group: group
        };
        config.results.push(record);
    },
    // various functions
    doExpandCollapse: function(key, oldRecord) {
        var me = this,
            gridMaster = me.getGrid(),
            group;
        group = me.getMatrix().leftAxis.findTreeElement('key', key);
        if (!group) {
            return;
        }
        me.doExpandCollapseInternal(group.node, oldRecord);
        gridMaster.fireEvent((group.node.expanded ? 'pivotgroupexpand' : 'pivotgroupcollapse'), gridMaster, 'row', group.node);
    },
    doExpandCollapseInternal: function(group, oldRecord) {
        var me = this,
            store = me.getStore(),
            isClassic = Ext.isClassic,
            items, oldItems, startIdx;
        group.expanded = !group.expanded;
        oldItems = me.processGroup({
            group: group,
            previousExpanded: false
        });
        group.expanded = !group.expanded;
        items = me.processGroup({
            group: group,
            previousExpanded: false
        });
        if (items.length && oldItems.length && (startIdx = store.indexOf(oldItems[0])) !== -1) {
            store.suspendEvents();
            if (group.expanded) {
                store.remove(store.getAt(startIdx));
                store.insert(startIdx, items);
            } else {
                store.remove(oldItems);
                store.insert(startIdx, items);
            }
            me.removeStoreInfoData(oldItems);
            store.resumeEvents();
            if (isClassic) {
                // For Classic, the replace event is better than remove and inserts
                store.fireEvent('replace', store, startIdx, oldItems, items);
            } else {
                // For Modern, the refresh event is better than remove and inserts
                store.fireEvent('refresh', store);
            }
        }
    },
    removeStoreInfoData: function(records) {
        var len = records.length,
            record, i;
        for (i = 0; i < len; i++) {
            record = records[i];
            if (this.storeInfo[record.internalId]) {
                delete this.storeInfo[record.internalId];
            }
        }
    },
    onGroupExpand: function(matrix, type, item) {
        if (type == 'row') {
            if (item) {
                this.doExpandCollapseInternal(item, item.records.collapsed);
            } else {
                this.processStore();
            }
        }
    },
    onGroupCollapse: function(matrix, type, item) {
        if (type == 'row') {
            if (item) {
                this.doExpandCollapseInternal(item, item.records.expanded);
            } else {
                this.processStore();
            }
        }
    }
});

/**
 * Base implementation of a result object.
 *
 * The Result object stores all calculated values for the aggregate dimensions
 * for a left/top item pair.
 */
Ext.define('Ext.pivot.result.Base', {
    alias: 'pivotresult.base',
    mixins: [
        'Ext.mixin.Factoryable'
    ],
    /**
     * @cfg {String} leftKey (required)
     *
     *  Key of left axis item or grandTotalKey
     */
    leftKey: '',
    /**
     * @cfg {String} topKey (required)
     *
     * Key of top axis item or grandTotalKey
     */
    topKey: '',
    /**
     * @property {Boolean} dirty
     *
     * Set this flag on true if you modified at least one record in this result.
     * The grid cell will be marked as dirty in such a case.
     */
    dirty: false,
    /**
     * @property {Object} values
     *
     * Object that stores all calculated values for each pivot aggregate.
     * The object keys are the dimension ids.
     *
     * @private
     */
    values: null,
    /**
     * @property {Ext.pivot.matrix.Base} matrix
     * @readonly
     *
     * Reference to the matrix object
     */
    matrix: null,
    constructor: function(config) {
        var me = this;
        Ext.apply(me, config || {});
        me.values = {};
        return me.callParent(arguments);
    },
    destroy: function() {
        var me = this;
        me.matrix = me.values = null;
        me.leftAxisItem = me.topAxisItem = null;
        return me.callParent(arguments);
    },
    /**
     * @method
     * Calculate all pivot aggregate dimensions for the internal records. Useful when using a
     * {@link Ext.pivot.matrix.Local Local} matrix.
     *
     */
    calculate: Ext.emptyFn,
    /**
     * @method
     *
     * Besides the calculation functions defined on your aggregate dimension you could
     * calculate values based on other store fields and custom functions.
     *
     * @param key The generated value will be stored in the result under this key for later extraction
     * @param dataIndex The dataIndex that should be used on the records for doing calculations
     * @param aggFn Your custom function
     */
    calculateByFn: Ext.emptyFn,
    /**
     * Add the calculated value for an aggregate dimension to the internal values storage
     *
     * @param dimensionId
     * @param value
     */
    addValue: function(dimensionId, value) {
        this.values[dimensionId] = value;
    },
    /**
     * Returns the calculated value for the specified aggregate dimension
     *
     * @param dimensionId
     */
    getValue: function(dimensionId) {
        return this.values[dimensionId];
    },
    /**
     * Check if the value was already calculated for the specified dimension
     *
     * @param dimensionId
     * @return {Boolean}
     */
    hasValue: function(dimensionId) {
        return (dimensionId in this.values);
    },
    /**
     * Returns the left axis item
     *
     * @returns {Ext.pivot.axis.Item}
     */
    getLeftAxisItem: function() {
        return this.matrix.leftAxis.items.getByKey(this.leftKey);
    },
    /**
     * Returns the top axis item
     *
     * @returns {Ext.pivot.axis.Item}
     */
    getTopAxisItem: function() {
        return this.matrix.topAxis.items.getByKey(this.topKey);
    }
});

/**
 * This class stores the matrix results. When the pivot component uses the
 * {@link Ext.pivot.matrix.Local} matrix then this class does
 * calculations in the browser.
 */
Ext.define('Ext.pivot.result.Collection', {
    alternateClassName: [
        'Mz.aggregate.matrix.Results'
    ],
    requires: [
        'Ext.pivot.MixedCollection',
        'Ext.pivot.result.Base'
    ],
    /**
     * @cfg {String} resultType
     *
     * Define here what class to be used when creating {@link Ext.pivot.result.Base Result} objects
     */
    resultType: 'base',
    /**
     * @property {Ext.pivot.MixedCollection} items
     *
     * Collection of {@link Ext.pivot.result.Base Result} objects
     *
     * @private
     */
    items: null,
    /**
     * @cfg {Ext.pivot.matrix.Base} matrix
     *
     * Reference to the matrix object
     */
    matrix: null,
    constructor: function(config) {
        var me = this;
        Ext.apply(me, config || {});
        me.items = new Ext.pivot.MixedCollection();
        me.items.getKey = function(obj) {
            return obj.leftKey + '/' + obj.topKey;
        };
        return me.callParent(arguments);
    },
    destroy: function() {
        var me = this;
        Ext.destroy(me.items);
        me.matrix = me.items = null;
        me.callParent(arguments);
    },
    /**
     * Clear all calculated results.
     *
     */
    clear: function() {
        this.items.clear();
    },
    /**
     * Add a new Result object by left/top axis keys.
     *
     * If there is already a Result object for the left/top axis pair then return that one.
     *
     * @param leftKey
     * @param topKey
     * @returns {Ext.pivot.result.Base}
     */
    add: function(leftKey, topKey) {
        var obj = this.get(leftKey, topKey);
        if (!obj) {
            obj = this.items.add(Ext.Factory.pivotresult({
                type: this.resultType,
                leftKey: leftKey,
                topKey: topKey,
                matrix: this.matrix
            }));
        }
        return obj;
    },
    /**
     * Returns the Result object for the specified left/top axis keys
     *
     * @param leftKey
     * @param topKey
     * @returns {Ext.pivot.result.Base}
     */
    get: function(leftKey, topKey) {
        return this.items.getByKey(leftKey + '/' + topKey);
    },
    remove: function(leftKey, topKey) {
        this.items.removeAtKey(leftKey + '/' + topKey);
    },
    /**
     * Return all Result objects for the specified leftKey
     *
     * @param leftKey
     * @returns Array
     */
    getByLeftKey: function(leftKey) {
        var col = this.items.filterBy(function(item, key) {
                var keys = String(key).split('/');
                return (leftKey == keys[0]);
            });
        return col.getRange();
    },
    /**
     * Return all Result objects for the specified topKey
     *
     * @param topKey
     * @returns Array
     */
    getByTopKey: function(topKey) {
        var col = this.items.filterBy(function(item, key) {
                var keys = String(key).split('/');
                return (keys.length > 1 && topKey == keys[1]);
            });
        return col.getRange();
    },
    /**
     * Calculate aggregate values for each available Result object
     *
     */
    calculate: function() {
        var len = this.items.getCount(),
            i;
        for (i = 0; i < len; i++) {
            this.items.getAt(i).calculate();
        }
    }
});

/**
 * Base implementation of a pivot matrix.
 *
 * This class contains basic methods that are used to generate the pivot data. It
 * needs to be extended by other classes to properly generate the results.
 */
Ext.define('Ext.pivot.matrix.Base', {
    alternateClassName: [
        'Mz.aggregate.matrix.Abstract'
    ],
    extend: 'Ext.util.Observable',
    alias: 'pivotmatrix.base',
    mixins: [
        'Ext.mixin.Factoryable'
    ],
    requires: [
        'Ext.util.DelayedTask',
        'Ext.data.ArrayStore',
        'Ext.XTemplate',
        'Ext.pivot.Aggregators',
        'Ext.pivot.MixedCollection',
        'Ext.pivot.axis.Base',
        'Ext.pivot.dimension.Item',
        'Ext.pivot.result.Collection'
    ],
    /**
     * Fires before the generated data is destroyed.
     * The components that uses the matrix should unbind this pivot store before is destroyed.
     * The grid panel will trow errors if the store is destroyed and the grid is refreshed.
     *
     * @event cleardata
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     */
    /**
     * Fires before the matrix is reconfigured.
     *
     * Return false to stop reconfiguring the matrix.
     *
     * @event beforereconfigure
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Object} config Object used to reconfigure the matrix
     */
    /**
     * Fires when the matrix is reconfigured.
     *
     * @event reconfigure
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Object} config Object used to reconfigure the matrix
     */
    /**
     * Fires when the matrix starts processing the records.
     *
     * @event start
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     */
    /**
     * Fires during records processing.
     *
     * @event progress
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Integer} index Current index of record that is processed
     * @param {Integer} total Total number of records to process
     */
    /**
     * Fires when the matrix finished processing the records
     *
     * @event done
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     */
    /**
     * Fires after the matrix built the store model.
     *
     * @event modelbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Model} model The built model
     */
    /**
     * Fires after the matrix built the columns.
     *
     * @event columnsbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Array} columns The built columns
     */
    /**
     * Fires after the matrix built a pivot store record.
     *
     * @event recordbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Model} record The built record
     * @param {Ext.pivot.axis.Item} item The left axis item the record was built for
     */
    /**
     * Fires before grand total records are created in the pivot store.
     * Push additional objects to the array if you need to create additional grand totals.
     *
     * @event buildtotals
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Array} totals Array of objects that will be used to create grand total records in the pivot store. Each object should have:
     * @param {String} totals.title Name your grand total
     * @param {Object} totals.values Values used to generate the pivot store record
     */
    /**
     * Fires after the matrix built the pivot store.
     *
     * @event storebuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Store} store The built store
     */
    /**
     * @cfg {String} [type=abstract]
     *
     * Used when you define a filter on a dimension to set what kind of filter is to be
     * instantiated.
     */
    /**
     * @cfg {String} resultType
     *
     * Define the type of Result this class uses. Specify here the pivotresult alias.
     */
    resultType: 'base',
    /**
     * @cfg {String} leftAxisType
     *
     * Define the type of left Axis this class uses. Specify here the pivotaxis alias.
     */
    leftAxisType: 'base',
    /**
     * @cfg {String} topAxisType
     *
     * Define the type of top Axis this class uses. Specify here the pivotaxis alias.
     */
    topAxisType: 'base',
    /**
     * @cfg {String} textRowLabels
     *
     * In compact layout only one column is generated for the left axis dimensions.
     * This is value of that column header.
     */
    textRowLabels: 'Row labels',
    /**
     * @cfg {String} textTotalTpl Configure the template for the group total. (i.e. '{name} ({rows.length} items)')
     * @cfg {String}           textTotalTpl.groupField         The field name being grouped by.
     * @cfg {String}           textTotalTpl.name               Group name
     * @cfg {Ext.data.Model[]} textTotalTpl.rows               An array containing the child records for the group being rendered.
     */
    textTotalTpl: 'Total ({name})',
    /**
     * @cfg {String} textGrandTotalTpl Configure the template for the grand total.
     */
    textGrandTotalTpl: 'Grand total',
    /**
     * @cfg {String} keysSeparator
     *
     * An axis item has a key that is a combination of all its parents keys. This is the keys separator.
     *
     * Do not use regexp special chars for this.
     */
    keysSeparator: '#_#',
    /**
     * @cfg {String} grandTotalKey
     *
     * Generic key used by the grand total records.
     */
    grandTotalKey: 'grandtotal',
    /**
     * @cfg {String} compactViewKey
     *
     * In compact view layout mode the matrix generates only one column for all left axis dimensions.
     * This is the 'dataIndex' field name on the pivot store model.
     */
    compactViewKey: '_compactview_',
    /**
     * @cfg {Number} compactViewColumnWidth
     *
     * In compact view layout mode the matrix generates only one column for all left axis dimensions.
     * This is the width of that column.
     */
    compactViewColumnWidth: 200,
    /**
     * @cfg {String} viewLayoutType Type of layout used to display the pivot data.
     * Possible values: outline, compact, tabular
     */
    viewLayoutType: 'outline',
    /**
     * @cfg {String} rowSubTotalsPosition Possible values: `first`, `none`, `last`
     */
    rowSubTotalsPosition: 'first',
    /**
     * @cfg {String} rowGrandTotalsPosition Possible values: `first`, `none`, `last`
     */
    rowGrandTotalsPosition: 'last',
    /**
     * @cfg {String} colSubTotalsPosition Possible values: `first`, `none`, `last`
     */
    colSubTotalsPosition: 'last',
    /**
     * @cfg {String} colGrandTotalsPosition Possible values: `first`, `none`, `last`
     */
    colGrandTotalsPosition: 'last',
    /**
     * @cfg {Boolean} showZeroAsBlank Should 0 values be displayed as blank?
     *
     */
    showZeroAsBlank: false,
    /**
     * @cfg {Boolean} calculateAsExcel
     *
     * Set to true if you want calculations to be done like in Excel.
     *
     * Set to false if you want all non numeric values to be treated as 0.
     *
     * Let's say we have the following values: 2, null, 4, 'test'.
     * - when `calculateAsExcel` is true then we have the following results: sum: 6; min: 2; max: 4; avg: 3; count: 3
     * - if `calculateAsExcel` is false then the results are: sum = 6, min: null; max: 4; avg: 1.5; count: 4
     */
    calculateAsExcel: false,
    /**
     * @cfg {Ext.pivot.axis.Base} leftAxis
     *
     * Left axis object stores all generated groups for the left axis dimensions
     */
    leftAxis: null,
    /**
     * @cfg {Ext.pivot.axis.Base} topAxis
     *
     * Top axis object stores all generated groups for the top axis dimensions
     */
    topAxis: null,
    /**
     * @cfg {Ext.pivot.MixedCollection} aggregate
     *
     * Collection of configured aggregate dimensions
     */
    aggregate: null,
    /**
     * @property {Ext.pivot.result.Collection} results
     * @readonly
     *
     * Stores the calculated results
     */
    results: null,
    /**
     * @property {Ext.data.ArrayStore} pivotStore
     * @readonly
     *
     * The generated pivot store
     *
     * @private
     */
    pivotStore: null,
    /**
     * @property {Boolean} isDestroyed
     * @readonly
     *
     * This property is set to true when the matrix object is destroyed.
     * This is useful to check when functions are deferred.
     */
    isDestroyed: false,
    /**
     * @cfg {Ext.Component} cmp (required)
     *
     * Reference to the pivot component that monitors this matrix.
     */
    cmp: null,
    /**
     * @cfg {Boolean} useNaturalSorting
     *
     * Set to true if you want to use natural sorting algorithm when sorting dimensions.
     *
     * For performance reasons this is turned off by default.
     */
    useNaturalSorting: false,
    /**
     * @cfg {Boolean} collapsibleRows
     *
     * Set to false if you want row groups to always be expanded and the buttons that
     * expand/collapse groups to be hidden in the UI.
     */
    collapsibleRows: true,
    /**
     * @cfg {Boolean} collapsibleColumns
     *
     * Set to false if you want column groups to always be expanded and the buttons that
     * expand/collapse groups to be hidden in the UI.
     */
    collapsibleColumns: true,
    isPivotMatrix: true,
    serializeProperties: [
        'viewLayoutType',
        'rowSubTotalsPosition',
        'rowGrandTotalsPosition',
        'colSubTotalsPosition',
        'colGrandTotalsPosition',
        'showZeroAsBlank',
        'collapsibleRows',
        'collapsibleColumns'
    ],
    constructor: function(config) {
        var ret = this.callParent(arguments);
        this.initialize(true, config);
        return ret;
    },
    destroy: function() {
        var me = this;
        me.delayedTask.cancel();
        me.delayedTask = null;
        if (Ext.isFunction(me.onDestroy)) {
            me.onDestroy();
        }
        Ext.destroy(me.results, me.leftAxis, me.topAxis, me.aggregate, me.pivotStore);
        me.results = me.leftAxis = me.topAxis = me.aggregate = me.pivotStore = null;
        if (Ext.isArray(me.columns)) {
            me.columns.length = 0;
        }
        if (Ext.isArray(me.model)) {
            me.model.length = 0;
        }
        if (Ext.isArray(me.totals)) {
            me.totals.length = 0;
        }
        me.columns = me.model = me.totals = me.keysMap = me.cmp = me.modelInfo = null;
        me.isDestroyed = true;
        me.callParent(arguments);
    },
    /**
     * The arguments are combined in a string and the function returns the crc32
     * for that key
     *
     * @deprecated 6.0.0 This method is deprecated.
     * @method formatKeys
     * @returns {String}
     */
    /**
     * Return a unique id for the specified value. The function builds a keys map so that same values get same ids.
     *
     * @param value
     * @returns {String}
     *
     * @private
     */
    getKey: function(value) {
        var me = this;
        me.keysMap = me.keysMap || {};
        if (!Ext.isDefined(me.keysMap[value])) {
            me.keysMap[value] = Ext.id();
        }
        return me.keysMap[value];
    },
    /**
     * Natural Sort algorithm for Javascript - Version 0.8 - Released under MIT license
     * Author: Jim Palmer (based on chunking idea from Dave Koelle)
     * https://github.com/overset/javascript-natural-sort/blob/master/naturalSort.js
     *
     * @private
     */
    naturalSort: (function() {
        var re = /(^([+\-]?(?:\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[\da-fA-F]+$|\d+)/g,
            sre = /^\s+|\s+$/g,
            // trim pre-post whitespace
            snre = /\s+/g,
            // normalize all whitespace to single ' ' character
            dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
            hre = /^0x[0-9a-f]+$/i,
            ore = /^0/,
            normChunk = function(s, l) {
                // normalize spaces; find floats not starting with '0', string or 0 if not defined (Clint Priest)
                s = s || '';
                return (!s.match(ore) || l == 1) && parseFloat(s) || s.replace(snre, ' ').replace(sre, '') || 0;
            };
        return function(a, b) {
            // convert all to strings strip whitespace
            var x = String(a instanceof Date ? a.getTime() : (a || '')).replace(sre, ''),
                y = String(b instanceof Date ? b.getTime() : (b || '')).replace(sre, ''),
                // chunk/tokenize
                xN = x.replace(re, '\x00$1\x00').replace(/\0$/, '').replace(/^\0/, '').split('\x00'),
                yN = y.replace(re, '\x00$1\x00').replace(/\0$/, '').replace(/^\0/, '').split('\x00'),
                // numeric, hex or date detection
                xD = parseInt(x.match(hre), 16) || (xN.length !== 1 && Date.parse(x)),
                yD = parseInt(y.match(hre), 16) || xD && y.match(dre) && Date.parse(y) || null,
                oFxNcL, oFyNcL;
            // first try and sort Hex codes or Dates
            if (yD) {
                if (xD < yD) {
                    return -1;
                } else if (xD > yD) {
                    return 1;
                }
            }
            // natural sorting through split numeric strings and default strings
            for (var cLoc = 0,
                xNl = xN.length,
                yNl = yN.length,
                numS = Math.max(xNl, yNl); cLoc < numS; cLoc++) {
                oFxNcL = normChunk(xN[cLoc], xNl);
                oFyNcL = normChunk(yN[cLoc], yNl);
                // handle numeric vs string comparison - number < string - (Kyle Adams)
                if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
                    return (isNaN(oFxNcL)) ? 1 : -1;
                }
                // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
                else if (typeof oFxNcL !== typeof oFyNcL) {
                    oFxNcL += '';
                    oFyNcL += '';
                }
                if (oFxNcL < oFyNcL) {
                    return -1;
                }
                if (oFxNcL > oFyNcL) {
                    return 1;
                }
            }
            return 0;
        };
    }()),
    /**
     *
     * Initialize the matrix with the new config object
     *
     * @param firstTime
     * @param config
     *
     * @private
     *
     */
    initialize: function(firstTime, config) {
        var me = this,
            props = me.serializeProperties,
            i;
        config = config || {};
        // initialize the results object
        me.initResults();
        if (firstTime || config.aggregate) {
            // initialize aggregates
            me.initAggregates(config.aggregate || []);
        }
        if (firstTime || config.leftAxis) {
            // initialize dimensions and build axis tree
            me.initLeftAxis(config.leftAxis || []);
        }
        if (firstTime || config.topAxis) {
            // initialize dimensions and build axis tree
            me.initTopAxis(config.topAxis || []);
        }
        for (i = 0; i < props.length; i++) {
            if (Ext.isDefined(config[props[i]])) {
                me[props[i]] = config[props[i]];
            }
        }
        me.totals = [];
        me.modelInfo = {};
        me.keysMap = null;
        if (!firstTime) {
            if (!me.collapsibleRows) {
                me.leftAxis.expandAll();
            }
            if (!me.collapsibleColumns) {
                me.topAxis.expandAll();
            }
        }
        if (firstTime) {
            me.pivotStore = new Ext.data.ArrayStore({
                autoDestroy: false,
                fields: []
            });
            me.delayedTask = new Ext.util.DelayedTask(me.startProcess, me);
            if (Ext.isFunction(me.onInitialize)) {
                me.onInitialize();
            }
        }
        // after initializing the matrix we can start processing data
        // we do it in a delayed task because a reconfigure may follow shortly
        me.delayedTask.delay(5);
    },
    /**
     * @method
     * Template method called to do your internal initialization when you extend this class.
     */
    onInitialize: Ext.emptyFn,
    /**
     * @method
     * Template method called before destroying the instance.
     */
    onDestroy: Ext.emptyFn,
    /**
     * Call this function to reconfigure the matrix with a new set of configs
     *
     * @param {Object} config Config object which has all configs that you want to change on this instance
     */
    reconfigure: function(config) {
        var me = this,
            cfg = Ext.clone(config || {});
        if (me.fireEvent('beforereconfigure', me, cfg) !== false) {
            if (Ext.isFunction(me.onReconfigure)) {
                me.onReconfigure(cfg);
            }
            // the user can change values on the config before reinitializing the matrix
            me.fireEvent('reconfigure', me, cfg);
            me.initialize(false, cfg);
            me.clearData();
        } else {
            me.delayedTask.cancel();
        }
    },
    /**
     * @method
     *
     * Template function called when the matrix has to be reconfigured with a new set of configs.
     *
     * @param {Object} config Config object which has all configs that need to be changed on this instance
     */
    onReconfigure: Ext.emptyFn,
    /**
     * Returns the serialized matrix configs.
     *
     * @return {Object}
     */
    serialize: function() {
        var me = this,
            props = me.serializeProperties,
            len = props.length,
            cfg = {},
            i, prop;
        for (i = 0; i < len; i++) {
            prop = props[i];
            cfg[prop] = me[prop];
        }
        cfg.leftAxis = me.serializeDimensions(me.leftAxis.dimensions);
        cfg.topAxis = me.serializeDimensions(me.topAxis.dimensions);
        cfg.aggregate = me.serializeDimensions(me.aggregate);
        return cfg;
    },
    /**
     * Serialize the given dimensions collection
     *
     * @param dimensions
     * @return {Array}
     * @private
     */
    serializeDimensions: function(dimensions) {
        var len = dimensions.getCount(),
            cfg = [],
            i;
        for (i = 0; i < len; i++) {
            cfg.push(dimensions.getAt(i).serialize());
        }
        return cfg;
    },
    /**
     * Initialize the Results object
     *
     * @private
     */
    initResults: function() {
        Ext.destroy(this.results);
        this.results = new Ext.pivot.result.Collection({
            resultType: this.resultType,
            matrix: this
        });
    },
    /**
     * @private
     */
    initAggregates: function(dimensions) {
        var me = this,
            i, item;
        Ext.destroy(me.aggregate);
        me.aggregate = new Ext.pivot.MixedCollection();
        me.aggregate.getKey = function(item) {
            return item.getId();
        };
        if (Ext.isEmpty(dimensions)) {
            return;
        }
        dimensions = Ext.Array.from(dimensions);
        for (i = 0; i < dimensions.length; i++) {
            item = dimensions[i];
            if (!item.isInstance) {
                Ext.applyIf(item, {
                    isAggregate: true,
                    align: 'right',
                    showZeroAsBlank: me.showZeroAsBlank
                });
                item = new Ext.pivot.dimension.Item(item);
            }
            item.matrix = this;
            me.aggregate.add(item);
        }
    },
    /**
     * @private
     */
    initLeftAxis: function(dimensions) {
        var me = this;
        dimensions = Ext.Array.from(dimensions || []);
        Ext.destroy(me.leftAxis);
        me.leftAxis = Ext.Factory.pivotaxis({
            type: me.leftAxisType,
            matrix: me,
            dimensions: dimensions,
            isLeftAxis: true
        });
    },
    /**
     * @private
     */
    initTopAxis: function(dimensions) {
        var me = this;
        dimensions = Ext.Array.from(dimensions || []);
        Ext.destroy(me.topAxis);
        me.topAxis = Ext.Factory.pivotaxis({
            type: me.topAxisType,
            matrix: me,
            dimensions: dimensions,
            isLeftAxis: false
        });
    },
    /**
     * This function clears any data that was previously calculated/generated.
     *
     */
    clearData: function() {
        var me = this;
        me.fireEvent('cleardata', me);
        me.leftAxis.clear();
        me.topAxis.clear();
        me.results.clear();
        if (Ext.isArray(me.columns)) {
            me.columns.length = 0;
        }
        if (Ext.isArray(me.model)) {
            me.model.length = 0;
        }
        me.totals = [];
        me.modelInfo = {};
        me.keysMap = null;
        if (me.pivotStore) {
            me.pivotStore.removeAll(true);
        }
    },
    /**
     * Template function called when the calculation process is started.
     * This function needs to be implemented in the subclass.
     */
    startProcess: Ext.emptyFn,
    /**
     * Call this function after you finished your matrix processing.
     * This function will build up the pivot store and column headers.
     */
    endProcess: function() {
        var me = this;
        // force tree creation on both axis
        me.leftAxis.getTree();
        me.topAxis.getTree();
        // build pivot store model and column headers
        me.buildModelAndColumns();
        // build pivot store rows
        me.buildPivotStore();
        if (Ext.isFunction(me.onBuildStore)) {
            me.onBuildStore(me.pivotStore);
        }
        me.fireEvent('storebuilt', me, me.pivotStore);
        me.fireEvent('done', me);
    },
    /**
     * @method
     *
     * Template function called after the pivot store model was created.
     * You could extend the model in a subclass if you implement this method.
     *
     * @param {Array} model
     */
    onBuildModel: Ext.emptyFn,
    /**
     * @method
     *
     * Template function called after the pivot columns were created.
     * You could extend the columns in a subclass if you implement this method.
     *
     * @param {Array} columns
     */
    onBuildColumns: Ext.emptyFn,
    /**
     * @method
     *
     * Template function called after a pivot store record was created.
     * You can use this to populate the record with your data.
     *
     * @param {Ext.data.Model} record
     * @param {Ext.pivot.axis.Item} item
     */
    onBuildRecord: Ext.emptyFn,
    /**
     * @method
     *
     * Template function called before building grand total records.
     * Use it to add additional grand totals to the pivot grid.
     * You have to push objects into the totals array with properties for each matrix.model fields.
     * For each object that you add a new record will be added to the pivot store
     * and will be styled as a grand total.
     *
     * @param {Array} totals
     */
    onBuildTotals: Ext.emptyFn,
    /**
     * @method
     *
     * Template function called after the pivot store was created.
     *
     * @param {Ext.data.ArrayStore} store
     */
    onBuildStore: Ext.emptyFn,
    /**
     * This function dynamically builds the model of the pivot records.
     *
     * @private
     */
    buildModelAndColumns: function() {
        var me = this;
        me.model = [
            {
                name: 'id',
                type: 'string'
            },
            {
                name: 'isRowGroupHeader',
                type: 'boolean',
                defaultValue: false
            },
            {
                name: 'isRowGroupTotal',
                type: 'boolean',
                defaultValue: false
            },
            {
                name: 'isRowGrandTotal',
                type: 'boolean',
                defaultValue: false
            },
            {
                name: 'leftAxisKey',
                type: 'string',
                defaultValue: null
            }
        ];
        me.internalCounter = 0;
        me.columns = [];
        if (me.viewLayoutType == 'compact') {
            me.generateCompactLeftAxis();
        } else {
            me.leftAxis.dimensions.each(me.parseLeftAxisDimension, me);
        }
        if (me.colGrandTotalsPosition == 'first') {
            me.columns.push(me.parseAggregateForColumn(null, {
                text: me.textGrandTotalTpl,
                grandTotal: true
            }));
        }
        Ext.Array.each(me.topAxis.getTree(), me.parseTopAxisItem, me);
        if (me.colGrandTotalsPosition == 'last') {
            me.columns.push(me.parseAggregateForColumn(null, {
                text: me.textGrandTotalTpl,
                grandTotal: true
            }));
        }
        // call the hook functions
        if (Ext.isFunction(me.onBuildModel)) {
            me.onBuildModel(me.model);
        }
        me.fireEvent('modelbuilt', me, me.model);
        if (Ext.isFunction(me.onBuildColumns)) {
            me.onBuildColumns(me.columns);
        }
        me.fireEvent('columnsbuilt', me, me.columns);
    },
    getDefaultFieldInfo: function(config) {
        return Ext.apply({
            isColGroupTotal: false,
            isColGrandTotal: false,
            leftAxisColumn: false,
            topAxisColumn: false,
            topAxisKey: null
        }, config);
    },
    /**
     * @private
     */
    parseLeftAxisDimension: function(dimension) {
        var me = this,
            id = dimension.getId();
        me.model.push({
            name: id,
            type: 'auto'
        });
        me.columns.push(Ext.merge({
            dataIndex: id,
            text: dimension.header,
            dimension: dimension,
            leftAxis: true
        }, dimension.column));
        me.modelInfo[id] = me.getDefaultFieldInfo({
            leftAxisColumn: true
        });
    },
    /**
     * @private
     */
    generateCompactLeftAxis: function() {
        var me = this;
        me.model.push({
            name: me.compactViewKey,
            type: 'auto'
        });
        me.columns.push({
            dataIndex: me.compactViewKey,
            text: me.textRowLabels,
            leftAxis: true,
            width: me.compactViewColumnWidth
        });
        me.modelInfo[me.compactViewKey] = me.getDefaultFieldInfo({
            leftAxisColumn: true
        });
    },
    /**
     * @private
     */
    parseTopAxisItem: function(item) {
        var me = this,
            columns = [],
            retColumns = [],
            o1, o2, len, i, ret;
        if (!item.children) {
            columns = me.parseAggregateForColumn(item, null);
            if (item.level === 0) {
                me.columns.push(columns);
            } else {
                // we reached the deepest level so we can add to the model now
                return columns;
            }
        } else {
            if (me.colSubTotalsPosition == 'first') {
                o2 = me.addColSummary(item);
                if (o2) {
                    retColumns.push(o2);
                }
            }
            // this part has to be done no matter if the column is added to the grid or not
            // the dataIndex is generated incrementally
            len = item.children.length;
            for (i = 0; i < len; i++) {
                ret = me.parseTopAxisItem(item.children[i]);
                if (Ext.isArray(ret)) {
                    Ext.Array.insert(columns, columns.length, ret);
                } else {
                    columns.push(ret);
                }
            }
            o1 = {
                text: item.name,
                group: item,
                columns: columns,
                key: item.key,
                xexpandable: true,
                xgrouped: true
            };
            if (item.level === 0) {
                me.columns.push(o1);
            }
            retColumns.push(o1);
            if (me.colSubTotalsPosition == 'last') {
                o2 = me.addColSummary(item);
                if (o2) {
                    retColumns.push(o2);
                }
            }
            if (me.colSubTotalsPosition == 'none') {
                o2 = me.addColSummary(item);
                if (o2) {
                    retColumns.push(o2);
                }
            }
            return retColumns;
        }
    },
    /**
     * @private
     */
    addColSummary: function(item) {
        var me = this,
            o2,
            doAdd = false;
        // add subtotal columns if required
        o2 = me.parseAggregateForColumn(item, {
            text: item.expanded ? item.getTextTotal() : item.name,
            group: item,
            subTotal: true
        });
        if (item.level === 0) {
            me.columns.push(o2);
        }
        Ext.apply(o2, {
            key: item.key,
            xexpandable: true,
            xgrouped: true
        });
        return o2;
    },
    /**
     * @private
     */
    parseAggregateForColumn: function(item, config) {
        var me = this,
            columns = [],
            column = {},
            dimensions = me.aggregate.getRange(),
            length = dimensions.length,
            i, agg;
        for (i = 0; i < length; i++) {
            agg = dimensions[i];
            me.internalCounter++;
            me.model.push({
                name: 'c' + me.internalCounter,
                type: 'auto',
                defaultValue: undefined,
                useNull: true,
                col: item ? item.key : me.grandTotalKey,
                agg: agg.getId()
            });
            columns.push(Ext.merge({
                dataIndex: 'c' + me.internalCounter,
                text: agg.header,
                topAxis: true,
                // generated based on the top axis
                subTotal: (config ? config.subTotal === true : false),
                grandTotal: (config ? config.grandTotal === true : false),
                dimension: agg
            }, agg.column));
            me.modelInfo['c' + me.internalCounter] = me.getDefaultFieldInfo({
                isColGroupTotal: (config ? config.subTotal === true : false),
                isColGrandTotal: (config ? config.grandTotal === true : false),
                topAxisColumn: true,
                topAxisKey: item ? item.key : me.grandTotalKey
            });
        }
        if (columns.length == 0 && me.aggregate.getCount() == 0) {
            me.internalCounter++;
            column = Ext.apply({
                text: item ? item.name : '',
                dataIndex: 'c' + me.internalCounter
            }, config || {});
        } else if (columns.length == 1) {
            column = Ext.applyIf({
                text: item ? item.name : ''
            }, columns[0]);
            Ext.apply(column, config || {});
            // if there is only one aggregate available then don't show the grand total text
            // use the aggregate header instead.
            if (config && config.grandTotal && me.aggregate.getCount() == 1) {
                column.text = me.aggregate.getAt(0).header || config.text;
            }
        } else {
            column = Ext.apply({
                text: item ? item.name : '',
                columns: columns
            }, config || {});
        }
        return column;
    },
    /**
     * @private
     */
    buildPivotStore: function() {
        var me = this;
        if (Ext.isFunction(me.pivotStore.model.setFields)) {
            me.pivotStore.model.setFields(me.model);
        } else {
            // ExtJS 5 has no "setFields" anymore so fallback to "replaceFields"
            me.pivotStore.model.replaceFields(me.model, true);
        }
        me.pivotStore.removeAll(true);
        Ext.Array.each(me.leftAxis.getTree(), me.addRecordToPivotStore, me);
        me.addGrandTotalsToPivotStore();
    },
    /**
     * @private
     */
    addGrandTotalsToPivotStore: function() {
        var me = this,
            totals = [],
            len, i, t;
        // first of all add the grand total
        totals.push({
            title: me.textGrandTotalTpl,
            values: me.preparePivotStoreRecordData({
                key: me.grandTotalKey
            }, {
                isRowGrandTotal: true
            })
        });
        // additional grand totals can be added. collect these using events or 
        if (Ext.isFunction(me.onBuildTotals)) {
            me.onBuildTotals(totals);
        }
        me.fireEvent('buildtotals', me, totals);
        // add records to the pivot store for each grand total
        len = totals.length;
        for (i = 0; i < len; i++) {
            t = totals[i];
            if (Ext.isObject(t) && Ext.isObject(t.values)) {
                Ext.applyIf(t.values, {
                    isRowGrandTotal: true
                });
                me.totals.push({
                    title: t.title || '',
                    record: me.pivotStore.add(t.values)[0]
                });
            }
        }
    },
    /**
     * @private
     */
    addRecordToPivotStore: function(item) {
        var me = this,
            record, dataIndex;
        if (!item.children) {
            // we are on the deepest level so it's time to build the record and add it to the store
            record = me.pivotStore.add(me.preparePivotStoreRecordData(item))[0];
            item.record = record;
            // this should be moved into the function "preparePivotStoreRecordData"
            if (Ext.isFunction(me.onBuildRecord)) {
                me.onBuildRecord(record, item);
            }
            me.fireEvent('recordbuilt', me, record, item);
        } else {
            // This group is expandable so let's generate records for the following use cases
            // - expanded group
            // - collapsed group
            // - footer for an expanded group that has rowSubTotalsPosition = last.
            // We define all these records on the group item so that we can update them as well
            // when we have an editable pivot. Without doing this we can't mark dirty records
            // in the pivot grid cells
            item.records = {};
            dataIndex = (me.viewLayoutType === 'compact' ? me.compactViewKey : item.dimensionId);
            // a collapsed group will always be the same
            item.records.collapsed = me.pivotStore.add(me.preparePivotStoreRecordData(item, {
                isRowGroupHeader: true,
                isRowGroupTotal: true
            }))[0];
            if (me.rowSubTotalsPosition === 'first' && me.viewLayoutType !== 'tabular') {
                item.records.expanded = me.pivotStore.add(me.preparePivotStoreRecordData(item, {
                    isRowGroupHeader: true
                }))[0];
            } else {
                record = {};
                record[dataIndex] = item.name;
                record.isRowGroupHeader = true;
                item.records.expanded = me.pivotStore.add(record)[0];
                if (me.rowSubTotalsPosition === 'last' || me.viewLayoutType === 'tabular') {
                    record = me.preparePivotStoreRecordData(item, {
                        isRowGroupTotal: true
                    });
                    record[dataIndex] = item.getTextTotal();
                    item.records.footer = me.pivotStore.add(record)[0];
                }
            }
            Ext.Array.each(item.children, me.addRecordToPivotStore, me);
        }
    },
    /**
     * Create an object using the pivot model and data of an axis item.
     * This object is used to create a record in the pivot store.
     *
     * @private
     */
    preparePivotStoreRecordData: function(group, values) {
        var me = this,
            data = {},
            len = me.model.length,
            i, field, result;
        if (group) {
            if (group.dimensionId) {
                data[group.dimensionId] = group.name;
            }
            data.leftAxisKey = group.key;
            for (i = 0; i < len; i++) {
                field = me.model[i];
                if (field.col && field.agg) {
                    //result = me.results.get(group.key, field.col);
                    // optimize this call
                    result = me.results.items.map[group.key + '/' + field.col];
                    //data[field.name] = result.getValue(field.agg);
                    //optimize this call
                    data[field.name] = result ? result.values[field.agg] : null;
                }
            }
            if (me.viewLayoutType === 'compact') {
                data[me.compactViewKey] = group.name;
            }
        }
        return Ext.applyIf(data, values);
    },
    /**
     * Returns the generated model fields
     *
     * @returns {Object[]} Array of config objects used to build the pivot store model fields
     */
    getColumns: function() {
        return this.model;
    },
    /**
     * Returns all generated column headers
     *
     * @returns {Object[]} Array of config objects used to build the pivot grid columns
     */
    getColumnHeaders: function() {
        var me = this;
        if (!me.model) {
            me.buildModelAndColumns();
        }
        return me.columns;
    },
    /**
     *    Find out if the specified key belongs to a row group.
     *
     *    Returns FALSE if the key is not found.
     *
     *    Returns 0 if the current key doesn't belong to a group. That means that group children items will always be 0.
     *
     *    If it'a a group then it returns the level number which is always > 0.
     *
     * @param {String} key
     * @returns {Number/Boolean}
     */
    isGroupRow: function(key) {
        var obj = this.leftAxis.findTreeElement('key', key);
        if (!obj)  {
            return false;
        }
        
        return (obj.node.children && obj.node.children.length == 0) ? 0 : obj.level;
    },
    /**
     *    Find out if the specified key belongs to a col group.
     *
     *    Returns FALSE if the key is not found.
     *
     *    Returns 0 if the current key doesn't belong to a group. That means that group children items will always be 0.
     *
     *    If it'a a group then it returns the level number which is always > 0.
     *
     * @param {String} key
     * @returns {Number/Boolean}
     */
    isGroupCol: function(key) {
        var obj = this.topAxis.findTreeElement('key', key);
        if (!obj)  {
            return false;
        }
        
        return (obj.node.children && obj.node.children.length == 0) ? 0 : obj.level;
    },
    deprecated: {
        '6.0': {
            properties: {
                /**
                 * @cfg {String} mztype
                 *
                 * @deprecated 6.0 Use {@link #type} instead.
                 */
                mztype: 'type',
                /**
                 * @cfg {String} mztypeLeftAxis
                 * @deprecated 6.0 Use {@link #leftAxisType} instead.
                 *
                 * Define the type of left Axis this class uses. Specify here the pivotaxis alias.
                 */
                mztypeLeftAxis: 'leftAxisType',
                /**
                 * @cfg {String} mztypeTopAxis
                 * @deprecated 6.0 Use {@link #topAxisType} instead.
                 *
                 * Define the type of top Axis this class uses. Specify here the pivotaxis alias.
                 */
                mztypeTopAxis: 'topAxisType'
            }
        }
    }
});

/**
 * The Result object stores all calculated values for the aggregate dimensions
 * for a left/top item pair and all records that are used to calculate
 * those values.
 *
 * It is used by the {@link Ext.pivot.matrix.Local} matrix class.
 */
Ext.define('Ext.pivot.result.Local', {
    extend: 'Ext.pivot.result.Base',
    alias: 'pivotresult.local',
    alternateClassName: [
        'Mz.aggregate.matrix.Result'
    ],
    /**
     * @property {Ext.data.Model[]} records
     *
     * Array of records for the left/top axis keys pair. Only available for a {@link Ext.pivot.matrix.Local Local} matrix.
     */
    records: null,
    constructor: function(config) {
        this.records = [];
        return this.callParent(arguments);
    },
    destroy: function() {
        this.records.length = 0;
        this.records = null;
        return this.callParent(arguments);
    },
    /**
     * @inheritdoc
     */
    calculate: function() {
        var me = this,
            i, dimension,
            length = me.matrix.aggregate.getCount();
        // for each pivot aggregate dimension calculate the value and call addValue
        for (i = 0; i < length; i++) {
            dimension = me.matrix.aggregate.getAt(i);
            me.addValue(dimension.getId(), Ext.callback(dimension.aggregatorFn, dimension.getScope() || 'self.controller', [
                me.records,
                dimension.dataIndex,
                me.matrix,
                me.leftKey,
                me.topKey
            ], 0, me.matrix.cmp));
        }
    },
    /**
     * @inheritdoc
     */
    calculateByFn: function(key, dataIndex, aggFn) {
        var me = this,
            v;
        if (Ext.isString(aggFn)) {
            aggFn = Ext.pivot.Aggregators[aggFn];
        }
        if (!Ext.isFunction(aggFn)) {
            Ext.raise('Invalid function provided!');
        }
        v = aggFn(me.records, dataIndex, me.matrix, me.leftKey, me.topKey);
        me.addValue(key, v);
        return v;
    },
    /**
     * Add the specified record to the internal records storage.
     * These records will be used for calculating the pivot aggregate dimension values.
     * This should be used only when all calculations are done locally and not remotely.
     *
     * @param {Ext.data.Model} record
     */
    addRecord: function(record) {
        this.records.push(record);
    },
    removeRecord: function(record) {
        Ext.Array.remove(this.records, record);
    }
});

/**
 * This type of matrix does all calculations in the browser.
 *
 * You need to provide at least a store that contains the records
 * that need to be processed.
 *
 * The store records are processed in batch jobs to avoid freezing the browser.
 * You can also configure how many records should be processed per job
 * and time to wait between jobs.
 *
 *
 * Example:
 *
 *      {
 *          xtype: 'pivotgrid',
 *          matrix: {
 *              type: 'local',
 *              store: 'yourStore',
 *              leftAxis: [...],
 *              topAxis: [...],
 *              aggregate: [...]
 *          }
 *      }
 *
 */
Ext.define('Ext.pivot.matrix.Local', {
    alternateClassName: [
        'Mz.aggregate.matrix.Local'
    ],
    extend: 'Ext.pivot.matrix.Base',
    alias: 'pivotmatrix.local',
    requires: [
        'Ext.pivot.matrix.Base',
        'Ext.pivot.axis.Local',
        'Ext.pivot.result.Local'
    ],
    isLocalMatrix: true,
    resultType: 'local',
    leftAxisType: 'local',
    topAxisType: 'local',
    /**
     * Fires before updating the matrix data due to a change in the bound store.
     *
     * @event beforeupdate
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @private
     */
    /**
     * Fires after updating the matrix data due to a change in the bound store.
     *
     * @event afterupdate
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @private
     */
    /**
     * @cfg {Ext.data.Store/String} store (required)
     *
     * This is the store that needs to be processed. The store should contain all records
     * and cannot be paginated or buffered.
     */
    store: null,
    /**
     * @cfg {Number} recordsPerJob
     *
     * The matrix processes the records in multiple jobs.
     * Specify here how many records should be processed in a single job.
     */
    recordsPerJob: 1000,
    /**
     * @cfg {Number} timeBetweenJobs
     *
     * How many milliseconds between processing jobs?
     */
    timeBetweenJobs: 2,
    onInitialize: function() {
        var me = this;
        me.localDelayedTask = new Ext.util.DelayedTask(me.delayedProcess, me);
        me.storeCleanDelayedTask = new Ext.util.DelayedTask(me.onOriginalStoreCleanDelayed, me);
        me.storeChangedDelayedTask = new Ext.util.DelayedTask(me.onOriginalStoreChangedDelayed, me);
        me.initializeStore({
            store: me.store
        });
        me.callParent(arguments);
    },
    initializeStore: function(config) {
        var me = this,
            store, newStore;
        me.processedRecords = {};
        if (config.store) {
            // a new store was passed to
            newStore = config.store;
        } else {
            if (me.store) {
                if (me.store.isStore && !me.storeListeners) {
                    // we have a store but no listeners were attached to it
                    store = me.store;
                } else {
                    // we need to initialize the store that we got
                    newStore = me.store;
                }
            }
        }
        if (newStore) {
            store = Ext.getStore(newStore || '');
            if (Ext.isEmpty(store) && Ext.isString(newStore)) {
                store = Ext.create(newStore);
            }
        }
        if (store && store.isStore) {
            Ext.destroy(me.storeListeners);
            if (me.store && me.store.autoDestroy && store != me.store) {
                Ext.destroy(me.store);
            }
            // let's initialize the store (if needed)
            me.store = store;
            // add listeners to the store
            me.storeListeners = me.store.on({
                refresh: me.startProcess,
                beforeload: me.onOriginalStoreBeforeLoad,
                add: me.onOriginalStoreAdd,
                update: me.onOriginalStoreUpdate,
                remove: me.onOriginalStoreRemove,
                commit: me.onOriginalStoreClean,
                reject: me.onOriginalStoreClean,
                clear: me.startProcess,
                scope: me,
                destroyable: true
            });
            if (store.isLoaded()) {
                me.startProcess();
            }
        }
    },
    onReconfigure: function(config) {
        this.initializeStore(config);
        this.callParent(arguments);
    },
    onDestroy: function() {
        var me = this;
        me.localDelayedTask.cancel();
        me.localDelayedTask = null;
        me.storeCleanDelayedTask.cancel();
        me.storeCleanDelayedTask = null;
        me.storeChangedDelayedTask.cancel();
        me.storeChangedDelayedTask = null;
        if (Ext.isArray(me.records)) {
            me.records.length = 0;
        }
        me.records = me.changedRecords = null;
        Ext.destroy(me.storeListeners);
        if (me.store && me.store.isStore && me.store.autoDestroy) {
            Ext.destroy(me.store);
        }
        me.store = me.storeListeners = me.processedRecords = null;
        me.callParent(arguments);
    },
    /**
     * @private
     */
    onOriginalStoreBeforeLoad: function(store) {
        this.fireEvent('start', this);
    },
    /**
     * @private
     */
    createStoreChangesQueue: function() {
        var me = this;
        me.changedRecords = me.changedRecords || {};
        me.changedRecords.add = me.changedRecords.add || [];
        me.changedRecords.update = me.changedRecords.update || [];
        me.changedRecords.remove = me.changedRecords.remove || [];
    },
    /**
     * @private
     */
    dropStoreChangesQueue: function() {
        var me = this;
        if (me.changedRecords) {
            me.changedRecords.add.length = 0;
            me.changedRecords.update.length = 0;
            me.changedRecords.remove.length = 0;
        }
    },
    /**
     * @private
     */
    onOriginalStoreAdd: function(store, records) {
        var me = this;
        me.createStoreChangesQueue();
        Ext.Array.insert(me.changedRecords.add, me.changedRecords.add.length, records);
        me.storeChangedDelayedTask.delay(100);
    },
    /**
     * @private
     */
    onOriginalStoreUpdate: function(store, record) {
        var me = this;
        me.createStoreChangesQueue();
        // if this record was previously added to the store then we don't do anything
        if (Ext.Array.indexOf(me.changedRecords.add, record) < 0) {
            Ext.Array.insert(me.changedRecords.update, me.changedRecords.update.length, [
                record
            ]);
        }
        me.storeChangedDelayedTask.delay(100);
    },
    /**
     * @private
     */
    onOriginalStoreRemove: function(store, records, index, isMove) {
        var me = this,
            len = records.length,
            i;
        if (isMove) {
            //don't do anything. nothing changed in the data
            return;
        }
        me.createStoreChangesQueue();
        for (i = 0; i < len; i++) {
            // if this record was previously updated then remove it from the update queue
            Ext.Array.remove(me.changedRecords.update, records[i]);
            // if this record was previously added then remove it from the add queue
            Ext.Array.remove(me.changedRecords.add, records[i]);
        }
        Ext.Array.insert(me.changedRecords.remove, me.changedRecords.remove.length, records);
        me.storeChangedDelayedTask.delay(100);
    },
    onOriginalStoreChangedDelayed: function() {
        var me = this,
            records = me.changedRecords;
        if (me.isDestroyed) {
            return;
        }
        me.storeChanged = !!(records.add.length || records.update.length || records.remove.length);
        if (me.storeChanged) {
            me.onOriginalStoreAddDelayed();
            me.onOriginalStoreUpdateDelayed();
            me.onOriginalStoreRemoveDelayed();
        }
    },
    /**
     * @private
     */
    onOriginalStoreAddDelayed: function() {
        var me = this,
            items = [],
            changed = false,
            len, i, records, record, obj;
        records = me.changedRecords.add;
        len = records.length;
        if (!len) {
            return;
        }
        for (i = 0; i < len; i++) {
            record = records[i];
            me.processRecord(record, i, len);
            obj = me.processedRecords[record.internalId];
            changed = changed || obj.left.length || obj.top.length;
            if (obj.left.length) {
                Ext.Array.insert(items, items.length, obj.left);
            }
        }
        records.length = 0;
        if (changed) {
            me.leftAxis.rebuildTree();
            me.topAxis.rebuildTree();
        }
        // the new records might have created new groups on left axis
        // which means that we need to create subtotals for them
        len = items.length;
        if (len) {
            for (i = 0; i < len; i++) {
                obj = items[i];
                if ((obj.children && !obj.records) || (!obj.children && !obj.record)) {
                    me.addRecordToPivotStore(obj);
                }
            }
        }
        me.recalculateResults(me.store, records, changed);
    },
    /**
     * @private
     */
    onOriginalStoreUpdateDelayed: function() {
        var me = this,
            items = [],
            changed = false,
            len, i, j, records, record, obj, prev, current, sameLeft, sameTop;
        records = me.changedRecords.update;
        len = records.length;
        if (!len) {
            return;
        }
        for (i = 0; i < len; i++) {
            record = records[i];
            prev = me.processedRecords[record.internalId];
            me.removeRecordFromResults(record);
            me.processRecord(record, i, len);
            current = me.processedRecords[record.internalId];
            // check if the record changes the top/left axis structure
            if (prev && current) {
                sameLeft = Ext.Array.equals(prev.left, current.left);
                sameTop = Ext.Array.equals(prev.top, current.top);
                changed = changed || !sameLeft || !sameTop;
                if (!sameLeft) {
                    Ext.Array.insert(items, items.length, current.left);
                }
            }
        }
        records.length = 0;
        if (changed) {
            me.leftAxis.rebuildTree();
            me.topAxis.rebuildTree();
        }
        // the updated records might have created new groups on left axis
        // which means that we need to create subtotals for them
        len = items.length;
        for (i = 0; i < len; i++) {
            obj = items[i];
            if ((obj.children && !obj.records) || (!obj.children && !obj.record)) {
                me.addRecordToPivotStore(obj);
            }
        }
        me.recalculateResults(me.store, records, changed);
    },
    /**
     * @private
     */
    onOriginalStoreRemoveDelayed: function() {
        var me = this,
            len, i, records, changed;
        records = me.changedRecords.remove;
        len = records.length;
        if (!len) {
            return;
        }
        for (i = 0; i < len; i++) {
            changed = me.removeRecordFromResults(records[i]) || changed;
        }
        records.length = 0;
        if (changed) {
            me.leftAxis.rebuildTree();
            me.topAxis.rebuildTree();
        }
        me.recalculateResults(me.store, records, changed);
    },
    /**
     * @private
     */
    onOriginalStoreClean: function() {
        var me = this;
        if (me.localDelayedTask.id) {
            // a complete recalculation has been started and the task is queued
            // which means that we need to drop queued store changes
            me.dropStoreChangesQueue();
            me.storeChanged = false;
        } else {
            me.storeCleanDelayedTask.delay(100);
        }
    },
    /**
     * @private
     */
    onOriginalStoreCleanDelayed: function() {
        var me = this,
            records, length, i;
        if (me.isDestroyed) {
            return;
        }
        records = me.pivotStore.getRange();
        length = records.length;
        for (i = 0; i < length; i++) {
            records[i].commit(true);
        }
        me.storeChanged = false;
        me.fireEvent('afterupdate', me, false);
    },
    /**
     * @private
     */
    removeRecordFromResults: function(record) {
        var me = this,
            obj = me.processedRecords[record.internalId],
            grandTotalKey = me.grandTotalKey,
            changed = false,
            result, item, i, j, len, length;
        if (!obj) {
            // something's wrong here; the record should be there
            return changed;
        }
        result = me.results.get(grandTotalKey, grandTotalKey);
        if (result) {
            result.removeRecord(record);
            if (result.records.length === 0) {
                me.results.remove(grandTotalKey, grandTotalKey);
            }
        }
        len = obj.top.length;
        for (i = 0; i < len; i++) {
            item = obj.top[i];
            result = me.results.get(grandTotalKey, item.key);
            if (result) {
                result.removeRecord(record);
                if (result.records.length === 0) {
                    me.results.remove(grandTotalKey, item.key);
                    // the item needs to be removed
                    me.topAxis.items.remove(item);
                    changed = true;
                }
            }
        }
        len = obj.left.length;
        for (i = 0; i < len; i++) {
            item = obj.left[i];
            result = me.results.get(item.key, grandTotalKey);
            if (result) {
                result.removeRecord(record);
                if (result.records.length === 0) {
                    me.results.remove(item.key, grandTotalKey);
                    // the item needs to be removed
                    me.leftAxis.items.remove(item);
                    changed = true;
                }
            }
            length = obj.top.length;
            for (j = 0; j < length; j++) {
                result = me.results.get(obj.left[i].key, obj.top[j].key);
                if (result) {
                    result.removeRecord(record);
                    if (result.records.length === 0) {
                        me.results.remove(obj.left[i].key, obj.top[j].key);
                    }
                }
            }
        }
        return changed;
    },
    /**
     * @private
     */
    recalculateResults: function(store, records, changed) {
        var me = this;
        me.fireEvent('beforeupdate', me, changed);
        me.buildModelAndColumns();
        // recalculate all results
        me.results.calculate();
        // now update the pivot store records
        Ext.Array.each(me.leftAxis.getTree(), me.updateRecordToPivotStore, me);
        // update all grand totals
        me.updateGrandTotalsToPivotStore();
        // 'changed' means that the structure of left/top axis has changed
        me.fireEvent('afterupdate', me, changed);
    },
    /**
     * @private
     */
    updateGrandTotalsToPivotStore: function() {
        var me = this,
            totals = [],
            i;
        if (me.totals.length <= 0) {
            return;
        }
        totals.push({
            title: me.textGrandTotalTpl,
            values: me.preparePivotStoreRecordData({
                key: me.grandTotalKey
            })
        });
        // additional grand totals can be added. collect these using events or 
        if (Ext.isFunction(me.onBuildTotals)) {
            me.onBuildTotals(totals);
        }
        me.fireEvent('buildtotals', me, totals);
        // update records to the pivot store for each grand total
        if (me.totals.length === totals.length) {
            for (i = 0; i < me.totals.length; i++) {
                if (Ext.isObject(totals[i]) && Ext.isObject(totals[i].values) && (me.totals[i].record instanceof Ext.data.Model)) {
                    delete (totals[i].values.id);
                    me.totals[i].record.set(totals[i].values);
                }
            }
        }
    },
    /**
     * @private
     */
    updateRecordToPivotStore: function(item) {
        var me = this,
            dataIndex, data;
        if (!item.children) {
            if (item.record) {
                data = me.preparePivotStoreRecordData(item);
                delete (data['id']);
                item.record.set(data);
            }
        } else {
            // update all pivot store records of this item
            if (item.records) {
                dataIndex = (me.viewLayoutType === 'compact' ? me.compactViewKey : item.dimensionId);
                data = me.preparePivotStoreRecordData(item);
                delete (data['id']);
                delete (data[dataIndex]);
                item.records.collapsed.set(data);
                if (item.records.expanded) {
                    item.records.expanded.set(data);
                }
                if (item.records.footer) {
                    item.records.footer.set(data);
                }
            }
            Ext.Array.each(item.children, me.updateRecordToPivotStore, me);
        }
    },
    startProcess: function() {
        var me = this;
        // if we don't have a store then do nothing
        if (!me.store || (me.store && !me.store.isStore) || me.isDestroyed || me.store.isLoading()) {
            // nothing to do
            return;
        }
        // if there are queued changes then drop them because we will recalculate everything
        me.dropStoreChangesQueue();
        me.clearData();
        me.localDelayedTask.delay(50);
    },
    delayedProcess: function() {
        var me = this;
        if (me.isDestroyed) {
            return;
        }
        // let's start the process
        me.fireEvent('start', me);
        me.records = me.store.getRange();
        if (me.records.length == 0) {
            me.endProcess();
            return;
        }
        me.statusInProgress = false;
        me.processRecords(0);
    },
    processRecords: function(position) {
        var me = this,
            i = position,
            totalLength;
        // don't do anything if the matrix was destroyed while doing calculations.
        if (me.isDestroyed) {
            return;
        }
        totalLength = me.records.length;
        me.statusInProgress = true;
        while (i < totalLength && i < position + me.recordsPerJob && me.statusInProgress) {
            me.processRecord(me.records[i], i, totalLength);
            i++;
        }
        // if we reached the last record then stop the process
        if (i >= totalLength) {
            me.statusInProgress = false;
            // now that the cells matrix was built let's calculate the aggregates
            me.results.calculate();
            // let's build the trees and apply value filters
            me.leftAxis.buildTree();
            me.topAxis.buildTree();
            // recalculate everything after applying the value filters
            if (me.filterApplied) {
                me.results.calculate();
            }
            me.records = null;
            me.endProcess();
            return;
        }
        // if the matrix was not reconfigured meanwhile then start a new job
        if (me.statusInProgress && totalLength > 0) {
            Ext.defer(me.processRecords, me.timeBetweenJobs, me, [
                i
            ]);
        }
    },
    /**
     * Process the specified record and fire the 'progress' event
     *
     * @private
     */
    processRecord: function(record, index, total) {
        var me = this,
            grandTotalKey = me.grandTotalKey,
            leftItems, topItems, i, j, len, length, records, item;
        // we keep track of processed records so that if they are changed we could
        // adjust the matrix calculations/tree
        me.processedRecords[record.internalId] = records = {
            left: [],
            top: []
        };
        // if null is returned that means it was filtered out
        // if array was returned that means it is valid
        leftItems = me.leftAxis.processRecord(record);
        topItems = me.topAxis.processRecord(record);
        // left and top items are added to their respective axis if the record
        // is not filtered out on both axis
        if (leftItems && topItems) {
            me.results.add(grandTotalKey, grandTotalKey).addRecord(record);
            len = topItems.length;
            for (i = 0; i < len; i++) {
                item = topItems[i];
                me.topAxis.addItem(item);
                records.top.push(me.topAxis.items.map[item.key]);
                me.results.add(grandTotalKey, item.key).addRecord(record);
            }
            length = leftItems.length;
            for (i = 0; i < length; i++) {
                item = leftItems[i];
                me.leftAxis.addItem(item);
                records.left.push(me.leftAxis.items.map[item.key]);
                me.results.add(item.key, grandTotalKey).addRecord(record);
                for (j = 0; j < len; j++) {
                    me.results.add(item.key, topItems[j].key).addRecord(record);
                }
            }
        }
        me.fireEvent('progress', me, index + 1, total);
    },
    /**
     * Fetch all records that belong to the specified row group
     *
     * @param {String} key Row group key
     */
    getRecordsByRowGroup: function(key) {
        var results = this.results.getByLeftKey(key),
            length = results.length,
            records = [],
            i;
        for (i = 0; i < length; i++) {
            Ext.Array.insert(records, records.length, results[i].records || []);
        }
        return records;
    },
    /**
     * Fetch all records that belong to the specified col group
     *
     * @param {String} key Col group key
     */
    getRecordsByColGroup: function(key) {
        var results = this.results.getByTopKey(key),
            length = results.length,
            records = [],
            i;
        for (i = 0; i < length; i++) {
            Ext.Array.insert(records, records.length, results[i].records || []);
        }
        return records;
    },
    /**
     * Fetch all records that belong to the specified row/col group
     *
     * @param {String} rowKey Row group key
     * @param {String} colKey Col group key
     */
    getRecordsByGroups: function(rowKey, colKey) {
        var result = this.results.get(rowKey, colKey);
        return (result ? result.records || [] : []);
    }
});

/**
 * This matrix allows you to do all the calculations on the backend.
 * This is handy when you have large data sets.
 *
 * Basically this class sends to the specified URL the following configuration object:
 *
 * - leftAxis: array of serialized dimensions on the left axis
 *
 * - topAxis: array of serialized dimensions on the top axis
 *
 * - aggregate: array of serialized dimensions on the aggregate
 *
 * - keysSeparator: the separator used by the left/top items keys. It's the one defined on the matrix
 *
 * - grandTotalKey: the key for the grand total items. It's the one defined on the matrix
 *
 *
 * The expected JSON should have the following format:
 *
 * - success - true/false
 *
 * - leftAxis - array of items that were generated for the left axis. Each item is an
 * object with keys for: key, value, name, dimensionId. If you send back the item name and you also
 * have a renderer defined then the renderer is not called anymore.
 *
 * - topAxis - array of items that were generated for the top axis.
 *
 * - results - array of results for all left/top axis items. Each result is an object
 * with keys for: leftKey, topKey, values. The 'values' object has keys for each
 * aggregate id that was sent to the backend.
 *
 * Example
 *
 *      // let's assume that we have this configuration on the pivot grid
 *      {
 *          xtype:  'pivotgrid',
 *
 *          matrix: {
 *              type:   'remote',
 *              url:    'your-backend-url'.
 *
 *              aggregate: [{
 *                  id:         'agg1',
 *                  dataIndex:  'value',
 *                  header:     'Sum of value',
 *                  aggregator: 'sum'
 *              },{
 *                  id:         'agg2',
 *                  dataIndex:  'value',
 *                  header:     '# records',
 *                  aggregator: 'count',
 *                  align:      'right',
 *                  renderer:   Ext.util.Format.numberRenderer('0')
 *              }],
 *
 *              leftAxis: [{
 *                  id:         'person',
 *                  dataIndex:  'person',
 *                  header:     'Person',
 *                  sortable:   false
 *              },{
 *                  id:         'country',
 *                  dataIndex:  'country',
 *                  header:     'Country'
 *              }],
 *
 *              topAxis: [{
 *                  id:         'year',
 *                  dataIndex:  'year',
 *                  header:     'Year'
 *              },{
 *                  id:         'month',
 *                  dataIndex:  'month',
 *                  header:     'Month'
 *              }]
 *          }
 *      }
 *
 *      // this is the expected result from the server
 *      {
 *          "success": true,
 *          "leftAxis": [{
 *              "key": "john",
 *              "value": "John",
 *              "name": "John",
 *              "dimensionId": "person"
 *          }, {
 *              "key": "john#_#usa",
 *              "value": "USA",
 *              "name": "United States of America",
 *              "dimensionId": "country"
 *          }, {
 *              "key": "john#_#canada",
 *              "value": "Canada",
 *              "name": "Canada",
 *              "dimensionId": "country"
 *          }],
 *          "topAxis": [{
 *              "key": "2014",
 *              "value": "2014",
 *              "name": "2014",
 *              "dimensionId": "year"
 *          }, {
 *              "key": "2014#_#2",
 *              "value": "2",
 *              "name": "February",
 *              "dimensionId": "month"
 *          }],
 *          "results": [{
 *              "leftKey": "grandtotal",
 *              "topKey": "grandtotal",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "john",
 *              "topKey": "grandtotal",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "john#_#canada",
 *              "topKey": "grandtotal",
 *              "values": {
 *                  "agg1": 70,
 *                  "agg2": 13
 *              }
 *          }, {
 *              "leftKey": "john#_#usa",
 *              "topKey": "grandtotal",
 *              "values": {
 *                  "agg1": 30,
 *                  "agg2": 7
 *              }
 *          }, {
 *              "leftKey": "grandtotal",
 *              "topKey": "2014",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "grandtotal",
 *              "topKey": "2014#_#2",
 *              "values": {
 *                  "agg1": 50,
 *                  "agg2": 70
 *              }
 *          }, {
 *              "leftKey": "john",
 *              "topKey": "2014",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "john",
 *              "topKey": "2014#_#2",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "john#_#usa",
 *              "topKey": "2014",
 *              "values": {
 *                  "agg1": 70,
 *                  "agg2": 13
 *              }
 *          }, {
 *              "leftKey": "john#_#usa",
 *              "topKey": "2014#_#2",
 *              "values": {
 *                  "agg1": 70,
 *                  "agg2": 13
 *              }
 *          }, {
 *              "leftKey": "john#_#canada",
 *              "topKey": "2014",
 *              "values": {
 *                  "agg1": 30,
 *                  "agg2": 7
 *              }
 *          }, {
 *              "leftKey": "john#_#canada",
 *              "topKey": "2014#_#2",
 *              "values": {
 *                  "agg1": 30,
 *                  "agg2": 7
 *              }
 *          }]
 *      }
 *
 *
 * It is very important to use the dimension IDs that were sent to the backend
 * instead of creating new ones.
 *
 * This class can also serve as an example for implementing various types of
 * remote matrix.
 */
Ext.define('Ext.pivot.matrix.Remote', {
    alternateClassName: [
        'Mz.aggregate.matrix.Remote'
    ],
    extend: 'Ext.pivot.matrix.Base',
    alias: 'pivotmatrix.remote',
    isRemoteMatrix: true,
    /**
     * Fires before requesting data from the server side.
     * Return false if you don't want to make the Ajax request.
     *
     * @event beforerequest
     * @param {Ext.pivot.matrix.Remote} matrix Reference to the Matrix object
     * @param {Object} params Params sent by the Ajax request
     */
    /**
     * Fires if there was any Ajax exception or the success value in the response was false.
     *
     * @event requestexception
     * @param {Ext.pivot.matrix.Remote} matrix Reference to the Matrix object
     * @param {Object} response The Ajax response object
     */
    /**
     * @cfg {String} url
     *
     * URL on the server side where the calculations are performed.
     */
    url: '',
    /**
     * @cfg {Number} timeout
     *
     * The timeout in miliseconds to be used for the server side request.
     * Default to 30 seconds.
     */
    timeout: 3000,
    /**
     * @method
     *
     * Template function called before doing the Ajax request
     * You could change the request params in a subclass if you implement this method.
     * Return false if you don't want to make the Ajax request.
     *
     * @param {Object} params
     */
    onBeforeRequest: Ext.emptyFn,
    /**
     * @method
     *
     * Template function called if there was any Ajax exception or the success value
     * in the response was false.
     * You could handle the exception in a subclass if you implement this method.
     *
     * @param {Object} response
     */
    onRequestException: Ext.emptyFn,
    onInitialize: function() {
        var me = this;
        me.remoteDelayedTask = new Ext.util.DelayedTask(me.delayedProcess, me);
        me.callParent(arguments);
    },
    onDestroy: function() {
        this.remoteDelayedTask.cancel();
        this.remoteDelayedTask = null;
        this.callParent();
    },
    startProcess: function() {
        var me = this;
        if (Ext.isEmpty(me.url)) {
            // nothing to do
            return;
        }
        me.clearData();
        // let's start the process
        me.fireEvent('start', me);
        me.statusInProgress = false;
        me.remoteDelayedTask.delay(5);
    },
    delayedProcess: function() {
        var me = this,
            matrix = me.serialize(),
            ret, params;
        params = {
            keysSeparator: me.keysSeparator,
            grandTotalKey: me.grandTotalKey,
            leftAxis: matrix.leftAxis,
            topAxis: matrix.topAxis,
            aggregate: matrix.aggregate
        };
        ret = me.fireEvent('beforerequest', me, params);
        if (ret !== false) {
            if (Ext.isFunction(me.onBeforeRequest)) {
                ret = me.onBeforeRequest(params);
            }
        }
        if (ret === false) {
            me.endProcess();
        } else {
            // do an Ajax call to the configured URL and fetch the results
            Ext.Ajax.request({
                url: me.url,
                timeout: me.timeout,
                jsonData: params,
                callback: me.processRemoteResults,
                scope: me
            });
        }
    },
    /**
     * Ajax request callback
     *
     * @private
     */
    processRemoteResults: function(options, success, response) {
        var me = this,
            exception = !success,
            data = Ext.JSON.decode(response.responseText, true),
            items, item, len, i;
        if (success) {
            exception = (!data || !data['success']);
        }
        if (exception) {
            // handle exception
            me.fireEvent('requestexception', me, response);
            if (Ext.isFunction(me.onRequestException)) {
                me.onRequestException(response);
            }
            me.endProcess();
            return;
        }
        items = Ext.Array.from(data.leftAxis || []);
        len = items.length;
        for (i = 0; i < len; i++) {
            item = items[i];
            if (Ext.isObject(item)) {
                me.leftAxis.addItem(item);
            }
        }
        items = Ext.Array.from(data.topAxis || []);
        len = items.length;
        for (i = 0; i < len; i++) {
            item = items[i];
            if (Ext.isObject(item)) {
                me.topAxis.addItem(item);
            }
        }
        items = Ext.Array.from(data.results || []);
        len = items.length;
        for (i = 0; i < len; i++) {
            item = items[i];
            if (Ext.isObject(item)) {
                var result = me.results.add(item.leftKey || '', item.topKey || '');
                Ext.Object.each(item.values || {}, result.addValue, result);
            }
        }
        me.endProcess();
    }
});

/**
 * This plugin allows pivot grid data export using various exporters. Each exporter should extend
 * the {@link Ext.exporter.Base} class.
 *
 * Two new methods are created on the pivot grid by this plugin:
 *
 *  - saveDocumentAs(config): saves the document
 *  - getDocumentData(config): returns the document content
 *
 * Example usage:
 *
 *
 *      {
 *          xtype: 'pivotgrid',
 *          plugins: {
 *              pivotexporter: true
 *          }
 *      }
 *
 *      pivot.saveDocumentAs({
 *          type: 'xlsx',
 *          title: 'My export',
 *          fileName: 'myExport.xlsx'
 *      });
 *
 *
 * When the exported data needs to be formatted then the {@link Ext.pivot.dimension.Item#exportStyle}
 * can be used on either left axis or aggregate dimensions.
 *
 *      {
 *          xtype: 'pivotgrid',
 *
 *          matrix: {
 *              aggregate: [{
 *                  dataIndex:  'value',
 *                  header:     'Total',
 *                  aggregator: 'sum',
 *                  exportStyle: {
 *                      format: 'Currency',
 *                      alignment: {
 *                          horizontal: 'Right'
 *                      }
 *                  }
 *              }],
 *
 *              leftAxis: [{
 *                  dataIndex:  'date',
 *                  header:     'Transaction date',
 *                  exportStyle: {
 *                      format: 'Short Date',
 *                      alignment: {
 *                          horizontal: 'Right'
 *                      }
 *                  }
 *              },{
 *                  dataIndex:  'company',
 *                  header:     'Company',
 *                  sortable:   false
 *              }]
 *          }
 *          // ...
 *      }
 *
 */
Ext.define('Ext.pivot.plugin.Exporter', {
    alternateClassName: [
        'Mz.pivot.plugin.ExcelExport'
    ],
    alias: [
        'plugin.pivotexporter',
        'plugin.mzexcelexport'
    ],
    extend: 'Ext.exporter.Plugin',
    /**
     * @event beforedocumentsave
     * Fires on the pivot grid before a document is exported and saved.
     * @param {Ext.pivot.Grid} pivotGrid Reference to the pivot grid
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */
    /**
     * @event documentsave
     * Fires on the pivot grid whenever a document is exported and saved.
     * @param {Ext.pivot.Grid} pivotGrid Reference to the pivot grid
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */
    /**
     * @event dataready
     * Fires on the pivot grid when the {Ext.exporter.data.Table data object} is ready.
     * You could adjust styles or data before the document is generated and saved.
     * @param {Ext.pivot.Grid} pivotGrid Reference to the pivot grid
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */
    /**
     *  `"both"` (the default) - The plugin is added to both grids
     *  `"top"` - The plugin is added to the containing Panel
     *  `"locked"` - The plugin is added to the locked (left) grid
     *  `"normal"` - The plugin is added to the normal (right) grid
     *
     * @private
     */
    lockableScope: 'top',
    init: function(cmp) {
        var me = this;
        // this plugin is available only for the pivot grid
        if (!cmp.isPivotGrid) {
            Ext.raise('This plugin is only compatible with Ext.pivot.Grid');
        }
        return me.callParent([
            cmp
        ]);
    },
    /**
     * @inheritdoc
     */
    prepareData: function(config) {
        var me = this,
            table, matrix, group, columns, headers, total, i, j, dLen, tLen, dataIndexes, row, value, cells;
        me.matrix = matrix = me.cmp.getMatrix();
        me.onlyExpandedNodes = (config && config.onlyExpandedNodes);
        if (!me.onlyExpandedNodes) {
            me.setColumnsExpanded(matrix.topAxis.getTree(), true);
        }
        columns = Ext.clone(matrix.getColumnHeaders());
        headers = me.getColumnHeaders(columns, config);
        dataIndexes = me.getDataIndexColumns(columns);
        if (!me.onlyExpandedNodes) {
            me.setColumnsExpanded(matrix.topAxis.getTree());
        }
        group = {
            columns: headers,
            groups: []
        };
        me.extractGroups(group, matrix.leftAxis.getTree(), dataIndexes);
        tLen = matrix.totals.length;
        dLen = dataIndexes.length;
        if (tLen) {
            group.summaries = [];
            for (i = 0; i < tLen; i++) {
                total = matrix.totals[i];
                row = {
                    cells: [
                        {
                            value: total.title
                        }
                    ]
                };
                for (j = 1; j < dLen; j++) {
                    value = total.record.data[dataIndexes[j].dataIndex];
                    row.cells.push({
                        value: (value == null || value === 0) && matrix.showZeroAsBlank ? '' : value
                    });
                }
                group.summaries.push(row);
            }
        }
        me.matrix = me.onlyExpandedNodes = null;
        return new Ext.exporter.data.Table(group);
    },
    /**
     * If we have to export everything then expand all top axis tree nodes temporarily
     *
     * @param items
     * @param expanded
     *
     * @private
     */
    setColumnsExpanded: function(items, expanded) {
        for (var i = 0; i < items.length; i++) {
            if (Ext.isDefined(expanded)) {
                items[i].backupExpanded = items[i].expanded;
                items[i].expanded = expanded;
            } else {
                items[i].expanded = items[i].backupExpanded;
                items[i].backupExpanded = null;
            }
            if (items[i].children) {
                this.setColumnsExpanded(items[i].children, expanded);
            }
        }
    },
    /**
     * Returns an array of column headers to be used in the export file
     *
     * @param {Array} columns
     * @param {Object} config
     *
     * @return {Array}
     *
     * @private
     */
    getColumnHeaders: function(columns, config) {
        var cols = [],
            length = columns.length,
            i, obj, col, doExtract;
        for (i = 0; i < length; i++) {
            col = columns[i];
            doExtract = this.onlyExpandedNodes ? (!col.group || col.group.expanded || (!col.group.expanded && col.subTotal)) : true;
            if (doExtract) {
                obj = {
                    text: (col.subTotal && col.group && col.group.expanded ? col.group.getTextTotal() : col.text)
                };
                if (col.columns) {
                    obj.columns = this.getColumnHeaders(col.columns, config);
                } else {
                    obj.width = col.dimension ? col.dimension.getWidth() : col.width || 100;
                    obj.style = col.dimension ? this.getExportStyle(col.dimension.getExportStyle(), config) : null;
                }
                cols.push(obj);
            }
        }
        return cols;
    },
    /**
     * Find all columns that have a dataIndex
     *
     * @param columns
     *
     * @returns {Array}
     *
     * @private
     */
    getDataIndexColumns: function(columns) {
        var cols = [],
            i, col, doExtract;
        for (i = 0; i < columns.length; i++) {
            col = columns[i];
            doExtract = this.onlyExpandedNodes ? (!col.group || col.group.expanded || (!col.group.expanded && col.subTotal)) : true;
            if (doExtract) {
                if (col.dataIndex) {
                    cols.push({
                        dataIndex: col.dataIndex,
                        agg: col.dimension ? col.dimension.getId() : null
                    });
                } else if (col.columns) {
                    Ext.Array.insert(cols, cols.length, this.getDataIndexColumns(col.columns));
                }
            }
        }
        return cols;
    },
    /**
     * Extract data from left axis groups.
     *
     * @param group
     * @param items
     * @param columns
     *
     * @returns {Object}
     *
     * @private
     */
    extractGroups: function(group, items, columns) {
        var i, j, iLen, cLen, doExtract, item, row, subGroup, record, value, cells;
        iLen = items.length;
        for (i = 0; i < iLen; i++) {
            item = items[i];
            if (item.record) {
                group.rows = group.rows || [];
                cells = [];
                row = {
                    cells: cells
                };
                for (j = 0; j < columns.length; j++) {
                    value = item.record.data[columns[j].dataIndex];
                    cells.push({
                        value: (value == null || value === 0) && this.matrix.showZeroAsBlank ? '' : value
                    });
                }
                group.rows.push(row);
            } else if (item.children) {
                group.groups = group.groups || [];
                subGroup = {
                    text: item.name
                };
                doExtract = this.onlyExpandedNodes ? item.expanded : true;
                if (doExtract) {
                    this.extractGroups(subGroup, item.children, columns);
                }
                subGroup.summaries = [];
                cells = [
                    {
                        value: (doExtract ? item.getTextTotal() : item.value)
                    }
                ];
                row = {
                    cells: cells
                };
                record = (item.expanded ? item.records.expanded : item.records.collapsed);
                cLen = columns.length;
                for (j = 1; j < cLen; j++) {
                    value = record.data[columns[j].dataIndex];
                    cells.push({
                        value: (value == null || value === 0) && this.matrix.showZeroAsBlank ? '' : value
                    });
                }
                subGroup.summaries.push(row);
                group.groups.push(subGroup);
            }
        }
    }
});

/**
 * This class allows you to define various settings for each configurator field.
 */
Ext.define('Ext.pivot.plugin.configurator.FieldSettings', {
    $configStrict: false,
    config: {
        /**
         * @cfg {String} cls
         *
         * CSS class to add to this configurator field
         */
        cls: '',
        /**
         * @cfg {String/Object} style Similar to {@link Ext.Component#style Component style config}.
         */
        style: null,
        /**
         * @cfg {String/Array} fixed
         *
         * If you want a field to be fixed in a specific area then you must define those areas here.
         *
         * Possible values:
         *
         * - `aggregate`: "values" area;
         * - `leftAxis`: "row values" area;
         * - `topAxis`: "column values" area;
         *
         */
        fixed: [],
        /**
         * @cfg {String[]} allowed
         *
         * Define here the areas where this field can be used.
         *
         * Possible values:
         *
         * - `aggregate`: "values" area;
         * - `leftAxis`: "row values" area;
         * - `topAxis`: "column values" area;
         *
         */
        allowed: [
            'leftAxis',
            'topAxis',
            'aggregate'
        ],
        /**
         * @cfg {String[]} aggregators
         *
         * Define here the functions that can be used when the dimension is configured as an aggregate.
         *
         * If you need to use your own function then you could override {@link Ext.pivot.Aggregators} like this:
         *
         *      Ext.define('overrides.pivot.Aggregators', {
         *          customFn: function(){
         *              // ... do your own calculation
         *          },
         *          customFnText: 'Custom fn'
         *      });
         *
         * Do not forget to define a text for your function. It will be displayed inside the 'Summarize by' field of
         * the FieldSettings window.
         *
         * If no text is defined then `Custom` will be used.
         *
         * You can also provide a function on the view controller and it will appear in the FieldSettings window as
         * "Custom".
         *
         */
        aggregators: [
            'sum',
            'avg',
            'min',
            'max',
            'count',
            'countNumbers',
            'groupSumPercentage',
            'groupCountPercentage',
            'variance',
            'varianceP',
            'stdDev',
            'stdDevP'
        ],
        /**
         * @cfg {Object} renderers
         *
         * These renderers are used only on the aggregate dimensions.
         *
         * The expected value is an object. Each key of this object is a text that will be shown in the "Format as" field
         * in the FieldSettings window. Check out the {@link Ext.grid.column.Column#renderer grid column renderer}
         * to see what is supported.
         *
         *      renderers: {
         *          'Colored 0,000.00': 'coloredRenderer' // function on the controller
         *      }
         *
         */
        renderers: {},
        /**
         * @cfg {Object} formatters
         *
         * Formatters are used only on the aggregate dimensions.
         *
         * The expected value is an object. Each key of this object is a text that will be shown in the "Format as" field
         * in the FieldSettings window. Check out the {@link Ext.grid.column.Column#formatter grid column formatter}
         * to see what is supported.
         *
         *      formatters: {
         *          '0': 'number("0")',
         *          '0%': 'number("0%")'
         *      }
         *
         */
        formatters: {}
    },
    isFieldSettings: true,
    constructor: function(config) {
        this.initConfig(config || {});
        return this.callParent(arguments);
    },
    getDefaultEmptyArray: function(prop) {
        var ret = this['_' + prop];
        if (!ret) {
            ret = [];
            this['set' + Ext.String.capitalize(prop)](ret);
        }
        return ret;
    },
    applyArrayValues: function(prop, newValue, oldValue) {
        if (newValue == null || (newValue && Ext.isArray(newValue))) {
            return newValue;
        }
        if (newValue) {
            if (!oldValue) {
                oldValue = this['get' + Ext.String.capitalize(prop)]();
            }
            Ext.Array.splice(oldValue, 0, oldValue.length, newValue);
        }
        return oldValue;
    },
    getFixed: function() {
        return this.getDefaultEmptyArray('fixed');
    },
    applyFixed: function(newValue, oldValue) {
        return this.applyArrayValues('fixed', newValue, oldValue);
    },
    getAllowed: function() {
        return this.getDefaultEmptyArray('allowed');
    },
    applyAllowed: function(newValue, oldValue) {
        return this.applyArrayValues('allowed', newValue, oldValue);
    },
    getAggregators: function() {
        return this.getDefaultEmptyArray('aggregators');
    },
    applyAggregators: function(newValue, oldValue) {
        return this.applyArrayValues('aggregators', newValue, oldValue);
    },
    /**
     * Check if this field is fixed in the specified container or not.
     *
     * @param {Ext.pivot.plugin.configurator.Container} fromContainer
     * @return {Boolean}
     */
    isFixed: function(fromContainer) {
        var type;
        if (!fromContainer) {
            return false;
        }
        type = fromContainer.getFieldType();
        return Ext.Array.indexOf(this.getFixed(), type) >= 0;
    },
    /**
     * Check if this field is allowed to be added to the specified container
     *
     * @param {Ext.pivot.plugin.configurator.Container} toContainer
     * @return {Boolean}
     */
    isAllowed: function(toContainer) {
        var fixed = this.getFixed(),
            type;
        if (!toContainer) {
            return false;
        }
        type = toContainer.getFieldType();
        if (fixed.length) {
            // if we have 'fixed' constraints then we can only move there
            return Ext.Array.indexOf(fixed, type) >= 0;
        }
        return (type === 'all') || (Ext.Array.indexOf(this.getAllowed(), type) >= 0);
    }
});

/**
 * This class extends the dimension item to be able to provide additional settings in the configurator plugin.
 */
Ext.define('Ext.pivot.plugin.configurator.Field', {
    extend: 'Ext.pivot.dimension.Item',
    requires: [
        'Ext.pivot.plugin.configurator.FieldSettings'
    ],
    config: {
        /**
         * The CellEditing plugin uses an `editor` config on the dimension
         * to be able to set the editor for the aggregate dimensions.
         * When the CellEditing plugin is used together with the Configurator
         * plugin then this config is lost if the dimensions are reconfigured.
         * @private
         */
        editor: null,
        /**
         * @cfg {Ext.pivot.plugin.configurator.FieldSettings} settings
         *
         * Define special restrictions or configurations for this field.
         */
        settings: {}
    },
    isField: true,
    clone: function() {
        return new Ext.pivot.plugin.configurator.Field(Ext.applyIf({
            id: Ext.id()
        }, this.getInitialConfig()));
    },
    getConfiguration: function(serializable) {
        var cfg = this.callParent([
                serializable
            ]);
        if (cfg.settings) {
            cfg.settings = cfg.settings.getConfig();
        }
        return cfg;
    },
    updateAggregator: function(agg, oldAgg) {
        var settings, fns;
        this.callParent([
            agg,
            oldAgg
        ]);
        if (agg) {
            settings = this.getSettings();
            fns = settings.getAggregators();
            if (fns.length === 0) {
                Ext.Array.remove(settings.getAllowed(), 'aggregate');
            } else {
                Ext.Array.include(fns, agg);
            }
        }
    },
    getSettings: function() {
        var ret = this.settings;
        if (!ret) {
            ret = new Ext.pivot.plugin.configurator.FieldSettings({});
            this.setSettings(ret);
        }
        return ret;
    },
    applySettings: function(settings, obj) {
        if (settings == null || (settings && settings.isFieldSettings)) {
            return settings;
        }
        if (settings) {
            if (!obj) {
                obj = this.getSettings();
            }
            obj.setConfig(settings);
        }
        if (obj) {
            this.setAggregator(this.getAggregator());
        }
        return obj;
    },
    getFieldText: function() {
        var header = this.getHeader();
        if (this.isAggregate) {
            header += ' (' + this.getAggText() + ')';
        }
        return header;
    },
    getAggText: function(fn) {
        var Agg = Ext.pivot.Aggregators,
            f = fn || this.getAggregator();
        if (Ext.isFunction(f)) {
            return Agg.customText;
        }
        return Agg[f + 'Text'] || Agg.customText;
    }
});

/**
 * This class defines an update operation that occurs on records belonging to a
 * {@link Ext.pivot.result.Base result}.
 *
 * This class should be extended to provide the update operation algorithm.
 *
 * How does such an update work?
 *
 * The {@link Ext.pivot.result.Base result object} contains an array of records that participate
 * in the result aggregation. The {@link #value} is used to update all these records on the
 * {@link #dataIndex} field.
 *
 * **Note:** These updaters are used by the {@link Ext.pivot.plugin.RangeEditor} plugin.
 */
Ext.define('Ext.pivot.update.Base', {
    extend: 'Ext.mixin.Observable',
    alias: 'pivotupdate.base',
    mixins: [
        'Ext.mixin.Factoryable'
    ],
    config: {
        /**
         * @cfg {String} leftKey (required)
         *
         *  Key of left axis item or grandTotalKey
         */
        leftKey: null,
        /**
         * @cfg {String} topKey (required)
         *
         * Key of top axis item or grandTotalKey
         */
        topKey: null,
        /**
         * @cfg {Ext.pivot.matrix.Base} matrix (required)
         *
         * Reference to the matrix object
         */
        matrix: null,
        /**
         * @cfg {String} dataIndex (required)
         *
         * Field that needs to be updated on all records found on the {@link Ext.pivot.result.Base matrix result}.
         */
        dataIndex: null,
        /**
         * @cfg {Variant} value
         *
         * The new value that is set for each record found on the {@link Ext.pivot.result.Base matrix result}.
         */
        value: null
    },
    destroy: function() {
        Ext.unasap(this.updateTimer);
        this.setMatrix(null);
        this.callParent();
    },
    getResult: function() {
        var matrix = this.getMatrix();
        return matrix ? matrix.results.get(this.getLeftKey(), this.getTopKey()) : null;
    },
    /**
     * Update values on the specified {@link Ext.pivot.result.Base matrix result} records.
     *
     * @return {Ext.Promise}
     */
    update: function() {
        var me = this;
        /**
         * Fires before updating all result records.
         *
         * @event beforeupdate
         * @param {Ext.pivot.update.Base} updater Reference to the updater object
         */
        /**
         * Fires after updating all result records.
         *
         * @event update
         * @param {Ext.pivot.update.Base} updater Reference to the updater object
         */
        Ext.unasap(me.updateTimer);
        return new Ext.Promise(function(resolve, reject) {
            if (!me.getMatrix() || !me.getDataIndex()) {
                Ext.raise('Invalid configuration');
            }
            var result = me.getResult();
            if (result) {
                if (me.fireEvent('beforeupdate', me) !== false) {
                    me.updateTimer = Ext.asap(me.onUpdate, me, [
                        result,
                        resolve,
                        reject
                    ]);
                } else {
                    reject('Operation canceled!');
                }
            } else {
                reject('No Result found!');
            }
        });
    },
    /**
     * Overwrite this function to provide update operation algorithm.
     *
     * @param {Ext.pivot.result.Base} result
     * @param {Function} resolve Function called if operation is successful
     * @param {Function} reject Function called if operation fails
     */
    onUpdate: function(result, resolve, reject) {
        this.fireEvent('update', this);
        resolve(this);
    }
});

/**
 * This updater increments all records found on the {@link Ext.pivot.result.Base matrix result}
 * using the specified value.
 *
 * Let's say that the result object contains the following records (each record is a
 * {@link Ext.data.Model model} in fact but we use json representation for this example):
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 100 },
 *          { product: 'Tablet', country: 'USA', order: 200 }
 *      ]
 *
 * And we want to increment all orders by a fixed value of 50. This is how the updater config looks like:
 *
 *      {
 *          type: 'increment',
 *          leftKey: resultLeftKey,
 *          topKey: resultTopKey,
 *          matrix: matrix,
 *          dataIndex: 'order',
 *          value: 50
 *      }
 *
 * And this is how the records look after the update:
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 150 },
 *          { product: 'Tablet', country: 'USA', order: 250 }
 *      ]
 *
 */
Ext.define('Ext.pivot.update.Increment', {
    extend: 'Ext.pivot.update.Base',
    alias: 'pivotupdate.increment',
    onUpdate: function(result, resolve, reject) {
        // This could fire asynchronously after we've been destroyed
        if (this.destroyed) {
            return;
        }
        var dataIndex = this.getDataIndex(),
            value = parseFloat(this.getValue()),
            records = result.records,
            len, i, rec;
        if (isNaN(value)) {
            value = null;
        }
        if (records && value) {
            len = records.length;
            for (i = 0; i < len; i++) {
                rec = records[i];
                rec.set(dataIndex, rec.get(dataIndex) + value);
            }
        }
        this.callParent([
            result,
            resolve,
            reject
        ]);
    }
});

/**
 * This updater overwrites the value on all records found on the {@link Ext.pivot.result.Base matrix result}.
 *
 * Let's say that the result object contains the following records (each record is a
 * {@link Ext.data.Model model} in fact but we use json representation for this example):
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 100 },
 *          { product: 'Tablet', country: 'USA', order: 200 }
 *      ]
 *
 * And we want all orders to have the same value of 250. This is how the updater config looks like:
 *
 *      {
 *          type: 'overwrite',
 *          leftKey: resultLeftKey,
 *          topKey: resultTopKey,
 *          matrix: matrix,
 *          dataIndex: 'order',
 *          value: 250
 *      }
 *
 * And this is how the records look after the update:
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 250 },
 *          { product: 'Tablet', country: 'USA', order: 250 }
 *      ]
 *
 */
Ext.define('Ext.pivot.update.Overwrite', {
    extend: 'Ext.pivot.update.Base',
    alias: 'pivotupdate.overwrite',
    onUpdate: function(result, resolve, reject) {
        // This could fire asynchronously after we've been destroyed
        if (this.destroyed) {
            return;
        }
        var dataIndex = this.getDataIndex(),
            value = parseFloat(this.getValue()),
            records = result.records,
            len, i;
        if (isNaN(value)) {
            value = null;
        }
        if (records) {
            len = records.length;
            for (i = 0; i < len; i++) {
                records[i].set(dataIndex, value);
            }
        }
        this.callParent([
            result,
            resolve,
            reject
        ]);
    }
});

/**
 * This updater changes all records found on the {@link Ext.pivot.result.Base matrix result}
 * using the specified value as a percentage.
 *
 * Let's say that the result object contains the following records (each record is a
 * {@link Ext.data.Model model} in fact but we use json representation for this example):
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 100 },
 *          { product: 'Tablet', country: 'USA', order: 200 }
 *      ]
 *
 * And we want to increase all orders by 150%. This is how the updater config looks like:
 *
 *      {
 *          type: 'percentage',
 *          leftKey: resultLeftKey,
 *          topKey: resultTopKey,
 *          matrix: matrix,
 *          dataIndex: 'order',
 *          value: 150
 *      }
 *
 * And this is how the records look after the update:
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 150 },
 *          { product: 'Tablet', country: 'USA', order: 300 }
 *      ]
 *
 */
Ext.define('Ext.pivot.update.Percentage', {
    extend: 'Ext.pivot.update.Base',
    alias: 'pivotupdate.percentage',
    onUpdate: function(result, resolve, reject) {
        // This could fire asynchronously after we've been destroyed
        if (this.destroyed) {
            return;
        }
        var dataIndex = this.getDataIndex(),
            value = parseFloat(this.getValue()),
            records = result.records,
            len, i, rec;
        if (isNaN(value)) {
            value = null;
        }
        if (records) {
            len = records.length;
            for (i = 0; i < len; i++) {
                rec = records[i];
                rec.set(dataIndex, value === null ? null : Math.floor(rec.get(dataIndex) * value / 100));
            }
        }
        this.callParent([
            result,
            resolve,
            reject
        ]);
    }
});

/**
 * This updater evenly distributes the value across all records found on the {@link Ext.pivot.result.Base matrix result}.
 *
 * Let's say that the result object contains the following records (each record is a
 * {@link Ext.data.Model model} in fact but we use json representation for this example):
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 100 },
 *          { product: 'Tablet', country: 'USA', order: 200 }
 *      ]
 *
 * And we want to evenly distribute the value 300 to all orders. This is how the updater config looks like:
 *
 *      {
 *          type: 'uniform',
 *          leftKey: resultLeftKey,
 *          topKey: resultTopKey,
 *          matrix: matrix,
 *          dataIndex: 'order',
 *          value: 300
 *      }
 *
 * And this is how the records look after the update:
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 150 },
 *          { product: 'Tablet', country: 'USA', order: 150 }
 *      ]
 *
 */
Ext.define('Ext.pivot.update.Uniform', {
    extend: 'Ext.pivot.update.Base',
    alias: 'pivotupdate.uniform',
    onUpdate: function(result, resolve, reject) {
        // This could fire asynchronously after we've been destroyed
        if (this.destroyed) {
            return;
        }
        var dataIndex = this.getDataIndex(),
            records = result.records,
            value = parseFloat(this.getValue()),
            len, i, avg;
        if (isNaN(value)) {
            value = null;
        }
        if (records) {
            len = records.length;
            if (len > 0) {
                avg = (value === null ? null : (value / len));
                for (i = 0; i < len; i++) {
                    records[i].set(dataIndex, avg);
                }
            }
        }
        this.callParent([
            result,
            resolve,
            reject
        ]);
    }
});

/**
 * This is the class that takes care of pivot grid mouse events.
 *
 * @private
 */
Ext.define('Ext.pivot.feature.PivotEvents', {
    alternateClassName: [
        'Mz.pivot.feature.PivotEvents'
    ],
    extend: 'Ext.grid.feature.Feature',
    alias: 'feature.pivotevents',
    requires: [
        'Ext.pivot.feature.PivotStore'
    ],
    eventPrefix: 'pivotcell',
    eventSelector: '.' + Ext.baseCSSPrefix + 'grid-cell',
    // this cls is used to catch events on the summary data rows (not on the header)
    cellSelector: '.' + Ext.baseCSSPrefix + 'grid-cell',
    rowSelector: '.' + Ext.baseCSSPrefix + 'grid-row',
    groupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header',
    groupHeaderCollapsibleCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsible',
    init: function(grid) {
        this.initEventsListeners();
        this.callParent(arguments);
    },
    destroy: function() {
        var me = this;
        me.destroyEventsListeners();
        Ext.destroy(me.dataSource);
        me.view = me.grid = me.gridMaster = me.matrix = me.dataSource = null;
        me.callParent(arguments);
    },
    initEventsListeners: function() {
        var me = this;
        me.eventsViewListeners = me.view.on(Ext.apply({
            scope: me,
            destroyable: true
        }, me.getViewListeners() || {}));
        me.gridListeners = me.grid.on(Ext.apply({
            scope: me,
            destroyable: true
        }, me.getGridListeners() || {}));
    },
    getViewListeners: function() {
        var me = this,
            listeners = {
                afterrender: me.onViewAfterRender
            };
        listeners[me.eventPrefix + 'click'] = me.onCellEvent;
        listeners[me.eventPrefix + 'dblclick'] = me.onCellEvent;
        listeners[me.eventPrefix + 'contextmenu'] = me.onCellEvent;
        return listeners;
    },
    getGridListeners: Ext.emptyFn,
    destroyEventsListeners: function() {
        Ext.destroyMembers(this, 'eventsViewListeners', 'gridListeners');
        this.eventsViewListeners = this.gridListeners = null;
    },
    onViewAfterRender: function() {
        var me = this,
            lockPartner;
        me.gridMaster = me.view.up('pivotgrid');
        me.matrix = me.gridMaster.getMatrix();
        // Share the GroupStore between both sides of a locked grid
        lockPartner = me.lockingPartner;
        if (lockPartner && lockPartner.dataSource) {
            me.dataSource = lockPartner.dataSource;
        } else {
            me.dataSource = new Ext.pivot.feature.PivotStore({
                store: me.grid.store,
                matrix: me.matrix,
                grid: me.gridMaster,
                clsGrandTotal: me.gridMaster.clsGrandTotal,
                clsGroupTotal: me.gridMaster.clsGroupTotal
            });
        }
    },
    getRowId: function(record) {
        return this.view.id + '-record-' + record.internalId;
    },
    getRecord: function(row) {
        return this.view.getRecord(row);
    },
    onCellEvent: function(view, tdCell, e) {
        var me = this,
            row = Ext.fly(tdCell).findParent(me.rowSelector),
            record = me.getRecord(row),
            params = {
                grid: me.gridMaster,
                view: me.view,
                cellEl: tdCell
            },
            colIndex, ret, eventName, column, colDef, leftKey, topKey, matrix, leftItem, topItem, recordInfo;
        if (!row || !record) {
            return false;
        }
        matrix = me.gridMaster.getMatrix();
        colIndex = Ext.getDom(tdCell).getAttribute('data-columnid');
        column = me.getColumnHeaderById(colIndex);
        recordInfo = me.dataSource.storeInfo[record.internalId];
        leftItem = recordInfo.rendererParams[column.dataIndex];
        if (!leftItem) {
            leftItem = recordInfo.rendererParams['topaxis'];
        }
        leftItem = leftItem ? leftItem.group : null;
        leftKey = leftItem ? leftItem.key : recordInfo.leftKey;
        row = Ext.fly(row);
        eventName = recordInfo.rowEvent;
        Ext.apply(params, {
            columnId: colIndex,
            column: column,
            leftKey: leftKey,
            leftItem: leftItem
        });
        if (Ext.fly(tdCell).hasCls(me.groupHeaderCls)) {}
        // it's a header cell
        else if (column) {
            eventName += 'cell';
            colDef = me.getTopAxisGroupByDataIndex(column.dataIndex);
            if (colDef) {
                topKey = colDef.col;
                topItem = matrix.topAxis.findTreeElement('key', topKey);
                Ext.apply(params, {
                    topKey: topKey,
                    topItem: topItem ? topItem.node : null,
                    dimensionId: colDef.agg
                });
            }
        }
        ret = me.gridMaster.fireEvent(eventName + e.type, params, e);
        if (ret !== false && e.type == 'click' && Ext.fly(tdCell).hasCls(me.groupHeaderCollapsibleCls)) {
            if (leftItem.expanded) {
                leftItem.collapse();
                me.view.focusNode(matrix.viewLayoutType === 'tabular' ? me.dataSource.getTabularGroupRecord(leftItem) : leftItem.records.collapsed);
            } else {
                leftItem.expand();
                me.view.focusNode(matrix.viewLayoutType === 'tabular' ? me.dataSource.getTabularGroupRecord(leftItem) : leftItem.records.expanded);
            }
        }
        return false;
    },
    getColumnHeaderById: function(columnId) {
        var columns = this.view.getGridColumns(),
            i;
        for (i = 0; i < columns.length; i++) {
            if (columns[i].id === columnId) {
                return columns[i];
            }
        }
    },
    getTopAxisGroupByDataIndex: function(dataIndex) {
        var columns = this.gridMaster.matrix.getColumns(),
            i;
        for (i = 0; i < columns.length; i++) {
            if (columns[i].name === dataIndex) {
                return columns[i];
            }
        }
    }
});

/**
 * This grid feature is automatically used by the pivot grid to customize grid templates.
 * @private
 */
Ext.define('Ext.pivot.feature.PivotView', {
    extend: 'Ext.pivot.feature.PivotEvents',
    alias: 'feature.pivotview',
    // all views css classes
    groupCls: Ext.baseCSSPrefix + 'pivot-grid-group',
    groupTitleCls: Ext.baseCSSPrefix + 'pivot-grid-group-title',
    groupHeaderCollapsedCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsed',
    // outline view css classes
    outlineCellHiddenCls: Ext.baseCSSPrefix + 'pivot-grid-outline-cell-hidden',
    outlineCellGroupExpandedCls: Ext.baseCSSPrefix + 'pivot-grid-outline-cell-previous-expanded',
    compactGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-compact',
    outlineGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-outline',
    tabularGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-tabular',
    compactLayoutPadding: 25,
    outerTpl: [
        '{%',
        // Set up the grouping unless we are disabled
        'var me = this.pivotViewFeature;',
        'if (!(me.disabled)) {',
        'me.setup();',
        '}',
        // Process the item
        'this.nextTpl.applyOut(values, out, parent);',
        '%}',
        {
            priority: 200
        }
    ],
    rowTpl: [
        '{%',
        'var me = this.pivotViewFeature;',
        'me.setupRowData(values.record, values.rowIndex, values);',
        'values.view.renderColumnSizer(values, out);',
        'this.nextTpl.applyOut(values, out, parent);',
        'me.resetRenderers();',
        '%}',
        {
            priority: 200,
            syncRowHeights: function(firstRow, secondRow) {
                var firstHeight, secondHeight;
                firstRow = Ext.fly(firstRow, 'syncDest');
                if (firstRow) {
                    firstHeight = firstRow.offsetHeight;
                }
                secondRow = Ext.fly(secondRow, 'sycSrc');
                if (secondRow) {
                    secondHeight = secondRow.offsetHeight;
                }
                // Sync the heights of row body elements in each row if they need it.
                if (firstRow && secondRow) {
                    if (firstHeight > secondHeight) {
                        Ext.fly(secondRow).setHeight(firstHeight);
                    } else if (secondHeight > firstHeight) {
                        Ext.fly(firstRow).setHeight(secondHeight);
                    }
                }
            }
        }
    ],
    cellTpl: [
        '{%',
        'values.hideCell = values.tdAttr == "hidden";\n',
        '%}',
        '<tpl if="!hideCell">',
        '<td class="{tdCls}" role="{cellRole}" {tdAttr} {cellAttr:attributes}',
        ' style="width:{column.cellWidth}px;<tpl if="tdStyle">{tdStyle}</tpl>"',
        ' tabindex="-1" data-columnid="{[values.column.getItemId()]}">',
        '<div {unselectableAttr} class="' + Ext.baseCSSPrefix + 'grid-cell-inner {innerCls}" ',
        'style="text-align:{align};<tpl if="style">{style}</tpl>" ',
        '{cellInnerAttr:attributes}>{value}</div>',
        '</td>',
        '</tpl>',
        {
            priority: 0
        }
    ],
    rtlCellTpl: [
        '{%',
        'values.hideCell = values.tdAttr == "hidden";\n',
        '%}',
        '<tpl if="!hideCell">',
        '<td class="{tdCls}" role="{cellRole}" {tdAttr} {cellAttr:attributes}',
        ' style="width:{column.cellWidth}px;<tpl if="tdStyle">{tdStyle}</tpl>"',
        ' tabindex="-1" data-columnid="{[values.column.getItemId()]}">',
        '<div {unselectableAttr} class="' + Ext.baseCSSPrefix + 'grid-cell-inner {innerCls}" ',
        'style="text-align:{[this.getAlign(values.align)]};<tpl if="style">{style}</tpl>" ',
        '{cellInnerAttr:attributes}>{value}</div>',
        '</td>',
        '</tpl>',
        {
            priority: 200,
            rtlAlign: {
                right: 'left',
                left: 'right',
                center: 'center'
            },
            getAlign: function(align) {
                return this.rtlAlign[align];
            }
        }
    ],
    init: function(grid) {
        var me = this,
            view = me.view;
        me.callParent(arguments);
        // Add a table level processor
        view.addTpl(Ext.XTemplate.getTpl(me, 'outerTpl')).pivotViewFeature = me;
        // Add a row level processor
        view.addRowTpl(Ext.XTemplate.getTpl(me, 'rowTpl')).pivotViewFeature = me;
        view.preserveScrollOnRefresh = true;
        if (view.bufferedRenderer) {
            view.bufferedRenderer.variableRowHeight = true;
        } else {
            grid.variableRowHeight = view.variableRowHeight = true;
        }
    },
    destroy: function() {
        this.columns = null;
        this.callParent(arguments);
    },
    setup: function() {
        this.columns = this.view.getGridColumns();
    },
    isRTL: function() {
        var me = this,
            grid = me.gridMaster || me.grid;
        if (Ext.isFunction(grid.isLocalRtl)) {
            return grid.isLocalRtl();
        }
        return false;
    },
    getGridListeners: function() {
        var me = this;
        return Ext.apply(me.callParent(arguments) || {}, {
            beforerender: me.onBeforeGridRendered
        });
    },
    onBeforeGridRendered: function(grid) {
        var me = this;
        if (me.isRTL()) {
            me.view.addCellTpl(Ext.XTemplate.getTpl(me, 'rtlCellTpl'));
        } else {
            me.view.addCellTpl(Ext.XTemplate.getTpl(me, 'cellTpl'));
        }
    },
    vetoEvent: function(record, row, rowIndex, e) {
        // Do not veto mouseover/mouseout
        if (e.type !== 'mouseover' && e.type !== 'mouseout' && e.type !== 'mouseenter' && e.type !== 'mouseleave' && e.getTarget(this.eventSelector)) {
            return false;
        }
    },
    setupRowData: function(record, idx, rowValues) {
        var storeInfo = this.dataSource.storeInfo[record.internalId],
            rendererParams = storeInfo ? storeInfo.rendererParams : {};
        rowValues.rowClasses.length = 0;
        Ext.Array.insert(rowValues.rowClasses, 0, storeInfo ? storeInfo.rowClasses : []);
        this.setRenderers(rendererParams);
    },
    setRenderers: function(rendererParams) {
        var len = this.columns.length,
            i, column;
        for (i = 0; i < len; i++) {
            column = this.columns[i];
            if (column.leftAxis && rendererParams[column.dataIndex]) {
                column.savedRenderer = column.renderer;
                column.renderer = this[rendererParams[column.dataIndex].fn](Ext.apply({
                    renderer: column.savedRenderer
                }, rendererParams[column.dataIndex]));
            }
            if (column.topAxis && rendererParams['topaxis']) {
                column.savedRenderer = column.renderer;
                column.renderer = this[rendererParams['topaxis'].fn](Ext.apply({
                    renderer: column.savedRenderer
                }, rendererParams[column.dataIndex]));
            }
        }
    },
    resetRenderers: function() {
        var len = this.columns.length,
            i, column;
        for (i = 0; i < len; i++) {
            column = this.columns[i];
            if (Ext.isDefined(column.savedRenderer)) {
                column.renderer = column.savedRenderer;
                delete column.savedRenderer;
            }
        }
    },
    groupOutlineRenderer: function(config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            colspan = config['colspan'],
            hidden = config['hidden'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'];
        return function(value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }
            if (colspan > 0) {
                metaData.tdAttr = 'colspan = "' + colspan + '"';
                metaData.tdCls = me.groupHeaderCls + ' ' + me.outlineGroupHeaderCls;
                if (!subtotalRow) {
                    if (group && group.children && group.axis.matrix.collapsibleRows) {
                        metaData.tdCls += ' ' + me.groupHeaderCollapsibleCls;
                        if (!group.expanded) {
                            metaData.tdCls += ' ' + me.groupHeaderCollapsedCls;
                        }
                    }
                    if (previousExpanded) {
                        metaData.tdCls += ' ' + me.outlineCellGroupExpandedCls;
                    }
                }
                return '<div class="' + me.groupTitleCls + ' ' + me.groupCls + '">' + value + '</div>';
            }
            if (hidden) {
                metaData.tdAttr = 'hidden';
            }
            metaData.tdCls = me.outlineCellHiddenCls;
            return '';
        };
    },
    recordOutlineRenderer: function(config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            hidden = config['hidden'];
        return function(value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }
            if (hidden) {
                metaData.tdCls = me.outlineCellHiddenCls;
                // a class that hides the cell borders
                return '';
            }
            metaData.tdCls = me.groupHeaderCls + ' ' + me.groupTitleCls;
            return value;
        };
    },
    groupCompactRenderer: function(config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            colspan = config['colspan'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'];
        return function(value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }
            if (group.level > 0) {
                metaData.style = (me.isRTL() ? 'margin-right: ' : 'margin-left: ') + (me.compactLayoutPadding * group.level) + 'px;';
            }
            metaData.tdCls = me.groupHeaderCls + ' ' + me.compactGroupHeaderCls;
            if (!subtotalRow) {
                if (group && group.children && group.axis.matrix.collapsibleRows) {
                    metaData.tdCls += ' ' + me.groupHeaderCollapsibleCls;
                    if (!group.expanded) {
                        metaData.tdCls += ' ' + me.groupHeaderCollapsedCls;
                    }
                }
                if (previousExpanded) {
                    metaData.tdCls += ' ' + me.outlineCellGroupExpandedCls;
                }
            }
            return '<div class="' + me.groupTitleCls + ' ' + me.groupCls + '">' + value + '</div>';
        };
    },
    recordCompactRenderer: function(config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'];
        return function(value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }
            if (group.level > 0) {
                metaData.style = (me.isRTL() ? 'margin-right: ' : 'margin-left: ') + (me.compactLayoutPadding * group.level) + 'px;';
            }
            metaData.tdCls = me.groupHeaderCls + ' ' + me.groupTitleCls + ' ' + me.compactGroupHeaderCls;
            return value;
        };
    },
    groupTabularRenderer: function(config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            colspan = config['colspan'],
            hidden = config['hidden'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'];
        return function(value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }
            if (colspan > 0) {
                metaData.tdAttr = 'colspan = "' + colspan + '"';
            }
            metaData.tdCls = me.groupHeaderCls + ' ' + me.tabularGroupHeaderCls;
            if (!subtotalRow) {
                if (group && group.children && group.axis.matrix.collapsibleRows) {
                    metaData.tdCls += ' ' + me.groupHeaderCollapsibleCls;
                    if (!group.expanded) {
                        metaData.tdCls += ' ' + me.groupHeaderCollapsedCls;
                    }
                }
            }
            if (hidden) {
                metaData.tdAttr = 'hidden';
            }
            return '<div class="' + me.groupTitleCls + ' ' + me.groupCls + '">' + value + '</div>';
        };
    },
    recordTabularRenderer: function(config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            hidden = config['hidden'];
        return function(value, metaData, record, rowIndex, colIndex, store, view) {
            if (hidden) {
                return '';
            }
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }
            metaData.tdCls = me.groupHeaderCls + ' ' + me.groupTitleCls;
            return value;
        };
    },
    topAxisNoRenderer: function(config) {
        return function(value, metaData, record, rowIndex, colIndex, store, view) {
            return '';
        };
    },
    topAxisRenderer: function(config) {
        var me = this,
            prevRenderer = config['renderer'];
        return function(value, metaData, record, rowIndex, colIndex, store, view) {
            var hideValue = (value === 0 && me.gridMaster.showZeroAsBlank);
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }
            return hideValue ? '' : value;
        };
    }
});

/**
 * The pivot grid helps you analyze your data.
 *
 * Calculations can be done either in your browser using a {@link Ext.pivot.matrix.Local}
 * matrix or remotely on the server using a {@link Ext.pivot.matrix.Remote} matrix.
 *
 * Example usage:
 *
 *      {
 *          xtype:  'pivotgrid',
 *          matrix: {
 *              type: 'local',
 *              store: 'yourStoreId',    // or a store instance
 *              rowGrandTotalsPosition: 'first',
 *              leftAxis: [{
 *                  dataIndex: 'country',
 *                  direction: 'DESC',
 *                  header: 'Countries',
 *                  width: 150
 *              }],
 *              topAxis: [{
 *                  dataIndex: 'year',
 *                  direction: 'ASC'
 *              }],
 *              aggregate: [{
 *                  dataIndex: 'value',
 *                  header: 'Total',
 *                  aggregator: 'sum',
 *                  width: 120
 *              }]
 *          }
 *      }
 *
 */
Ext.define('Ext.pivot.Grid', {
    extend: 'Ext.grid.Panel',
    alternateClassName: [
        'Mz.pivot.Grid',
        'Mz.pivot.Table'
    ],
    xtype: [
        'pivotgrid',
        'mzpivotgrid'
    ],
    requires: [
        'Ext.pivot.matrix.Local',
        'Ext.pivot.matrix.Remote',
        'Ext.pivot.feature.PivotView',
        'Ext.data.ArrayStore'
    ],
    subGridXType: 'gridpanel',
    isPivotGrid: true,
    isPivotComponent: true,
    /**
     * Fires before the matrix is reconfigured.
     *
     * Return false to stop reconfiguring the matrix.
     *
     * @event pivotbeforereconfigure
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Object} config Object used to reconfigure the matrix
     */
    /**
     * Fires when the matrix is reconfigured.
     *
     * @event pivotreconfigure
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Object} config Object used to reconfigure the matrix
     */
    /**
     * Fires when the matrix starts processing the records.
     *
     * @event pivotstart
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     */
    /**
     * Fires during records processing.
     *
     * @event pivotprogress
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Integer} index Current index of record that is processed
     * @param {Integer} total Total number of records to process
     */
    /**
     * Fires when the matrix finished processing the records
     *
     * @event pivotdone
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     */
    /**
     * Fires after the matrix built the store model.
     *
     * @event pivotmodelbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Model} model The built model
     */
    /**
     * Fires after the matrix built the columns.
     *
     * @event pivotcolumnsbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Array} columns The built columns
     */
    /**
     * Fires after the matrix built a pivot store record.
     *
     * @event pivotrecordbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Model} record The built record
     */
    /**
     * Fires before grand total records are created in the pivot store.
     * Push additional objects to the array if you need to create additional grand totals.
     *
     * @event pivotbuildtotals
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Array} totals Array of objects that will be used to create grand total records in the pivot store. Each object should have:
     * @param {String} totals.title Name your grand total
     * @param {Object} totals.values Values used to generate the pivot store record
     */
    /**
     * Fires after the matrix built the pivot store.
     *
     * @event pivotstorebuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Store} store The built store
     */
    /**
     * Fires when a pivot group is expanded. Could be a row or col pivot group.
     *
     * The same event is fired when all groups are expanded but no group param is provided.
     *
     * @event pivotgroupexpand
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {String} type  Either 'row' or 'col'
     * @param {Ext.pivot.axis.Item} group The axis item
     */
    /**
     * Fires when a pivot group is collapsed. Could be a row or col pivot group.
     *
     * The same event is fired when all groups are collapsed but no group param is provided.
     *
     * @event pivotgroupcollapse
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {String} type  Either 'row' or 'col'
     * @param {Ext.pivot.axis.Item} group The axis item
     */
    /**
     * Fires when a mouse click is detected on a pivot group element.
     * The pivot group element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * Return false if you want to prevent expanding/collapsing that group.
     *
     * @event pivotgroupclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse double click is detected on a pivot group element.
     * The pivot group element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotgroupdblclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse right click is detected on a pivot group element.
     * The pivot group element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotgroupcontextmenu
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse click is detected on a pivot group cell.
     * The pivot group cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotgroupcellclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse double click is detected on a pivot group cell.
     * The pivot group cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotgroupcelldblclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse right click is detected on a pivot group cell.
     * The pivot group cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotgroupcellcontextmenu
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse click is detected on a pivot item element.
     * The pivot item element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotitemclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse double click is detected on a pivot item element.
     * The pivot item element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotitemdblclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse right click is detected on a pivot item element.
     * The pivot item element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotitemcontextmenu
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse click is detected on a pivot item cell.
     * The pivot item cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotitemcellclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse double click is detected on a pivot item cell.
     * The pivot item cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotitemcelldblclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse right click is detected on a pivot item cell.
     * The pivot item cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotitemcellcontextmenu
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse click is detected on a pivot grand total element.
     * The pivot grand total element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivottotalclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse double click is detected on a pivot grand total element.
     * The pivot grand total element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivottotaldblclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse right click is detected on a pivot grand total element.
     * The pivot grand total element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivottotalcontextmenu
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse click is detected on a pivot grand total cell.
     * The pivot total cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivottotalcellclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse double click is detected on a pivot grand total cell.
     * The pivot total cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivottotalcelldblclick
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a mouse double click is detected on a pivot grand total cell.
     * The pivot total cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivottotalcellcontextmenu
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.view.Table} params.view Grid view
     * @param {HTMLElement} params.cellEl The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {String} params.columnId Id of the column header
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Available only when using a {@link Ext.pivot.matrix.Remote Remote} matrix.
     * Fires before requesting data from the server side.
     * Return false if you don't want to make the Ajax request.
     *
     * @event pivotbeforerequest
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Object} params Params sent by the Ajax request
     */
    /**
     * Available only when using a {@link Ext.pivot.matrix.Remote Remote} matrix.
     * Fires if there was any Ajax exception or the success value in the response was false.
     *
     * @event pivotrequestexception
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Object} response The Ajax response object
     */
    /**
     * @cfg {Array} columns
     * @hide
     * Has no effect on a pivot grid
     */
    /**
     * @cfg {Ext.data.Store} store
     * @hide
     * Should be defined in the {@link #matrix} when using a {@link Ext.pivot.matrix.Local} matrix.
     */
    /**
     * @cfg {Boolean} enableLoadMask Set this on false if you don't want to see the loading mask.
     */
    enableLoadMask: true,
    /**
     * @cfg {Boolean} enableLocking Set this on false if you don't want to lock the left axis columns.
     */
    enableLocking: false,
    /**
     * @cfg {Boolean} enableColumnSort Set this on false if you don't want to allow column sorting
     * in the pivot grid generated columns.
     */
    enableColumnSort: true,
    /**
     * @cfg {Boolean} columnLines Set this on false if you don't want to show the column lines.
     */
    columnLines: true,
    /**
     * @cfg {String} clsGroupTotal CSS class assigned to the group totals.
     */
    clsGroupTotal: Ext.baseCSSPrefix + 'pivot-grid-group-total',
    /**
     * @cfg {String} clsGrandTotal CSS class assigned to the grand totals.
     */
    clsGrandTotal: Ext.baseCSSPrefix + 'pivot-grid-grand-total',
    /**
     * @cfg {Boolean} startRowGroupsCollapsed Should the row groups be expanded on first init?
     *
     */
    startRowGroupsCollapsed: true,
    /**
     * @cfg {Boolean} startColGroupsCollapsed Should the col groups be expanded on first init?
     *
     */
    startColGroupsCollapsed: true,
    /**
     * @cfg {String[]} stateEvents
     * @inheritdoc Ext.state.Stateful#cfg-stateEvents
     * @localdoc By default the following stateEvents are added:
     * 
     *  - {@link #event-resize} - _(added by Ext.Component)_
     *  - {@link #event-collapse} - _(added by Ext.panel.Panel)_
     *  - {@link #event-expand} - _(added by Ext.panel.Panel)_
     *  - {@link #event-columnresize} - _(added by Ext.panel.Table)_
     *  - {@link #event-columnmove} - _(added by Ext.panel.Table)_
     *  - {@link #event-columnhide} - _(added by Ext.panel.Table)_
     *  - {@link #event-columnshow} - _(added by Ext.panel.Table)_
     *  - {@link #event-sortchange} - _(added by Ext.panel.Table)_
     *  - {@link #event-filterchange} - _(added by Ext.panel.Table)_
     *  - {@link #event-groupchange} - _(added by Ext.panel.Table)_
     *  - {@link #event-pivotgroupexpand}
     *  - {@link #event-pivotgroupcollapse}
     *  - {@link #event-pivotdone}
     */
    stateEvents: [
        'pivotgroupexpand',
        'pivotgroupcollapse',
        'pivotdone'
    ],
    groupHeaderCollapsedCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsed',
    groupHeaderCollapsibleCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsible',
    groupCls: Ext.baseCSSPrefix + 'pivot-grid-group',
    relayedMatrixEvents: [
        'beforereconfigure',
        'reconfigure',
        'start',
        'progress',
        'done',
        'modelbuilt',
        'columnsbuilt',
        'recordbuilt',
        'buildtotals',
        'storebuilt',
        'groupexpand',
        'groupcollapse',
        'beforerequest',
        'requestexception'
    ],
    deprecatedConfigs: [
        'matrixConfig',
        'leftAxis',
        'topAxis',
        'aggregate',
        'showZeroAsBlank',
        'textTotalTpl',
        'textGrandTotalTpl',
        'viewLayoutType',
        'rowSubTotalsPosition',
        'rowGrandTotalsPosition',
        'colSubTotalsPosition',
        'colGrandTotalsPosition'
    ],
    config: {
        /**
         * @cfg {Ext.pivot.matrix.Base} matrix (required)
         *
         * This is the pivot matrix used by the pivot grid. All axis and aggregate dimensions should
         * be defined here.
         *
         * Example usage:
         *
         *      {
         *          xtype:  'pivotgrid',
         *          matrix: {
         *              type: 'local',
         *              store: 'yourStoreId'    // or a store instance
         *              rowGrandTotalsPosition: 'first',
         *              leftAxis: [{
         *                  dataIndex: 'country',
         *                  direction: 'DESC',
         *                  header: 'Countries'
         *                  width: 150
         *              }],
         *              topAxis: [{
         *                  dataIndex: 'year',
         *                  direction: 'ASC'
         *              }],
         *              aggregate: [{
         *                  dataIndex: 'value',
         *                  header: 'Total',
         *                  aggregator: 'sum',
         *                  width: 120
         *              }]
         *          }
         *      }
         *
         */
        matrix: {
            type: 'local'
        }
    },
    /**
     * @private
     */
    initComponent: function() {
        var me = this;
        me.columns = [];
        me.preInitialize();
        me.callParent(arguments);
        me.postInitialize();
    },
    /***
     * @private
     *
     */
    preInitialize: function() {
        var me = this;
        me.features = [
            {
                id: 'group',
                ftype: 'pivotview',
                summaryRowCls: me.clsGroupTotal,
                grandSummaryRowCls: me.clsGrandTotal
            }
        ];
        me.addCls(Ext.baseCSSPrefix + 'pivot-grid');
        // for backward compatibility check if a store was provided
        if (me.store) {
            me.originalStore = me.store;
        }
        // create a grid store that will be reconfigured whenever the matrix store changes
        me.store = new Ext.data.ArrayStore({
            fields: []
        });
        me.enableColumnMove = false;
    },
    /**
     * @private
     */
    postInitialize: function() {
        var me = this,
            headerListener = {
                headerclick: me.onHeaderClick,
                scope: me,
                destroyable: true
            },
            view = me.getView(),
            deprecated = [],
            configs = me.deprecatedConfigs,
            len = configs.length,
            matrix = me.getMatrix(),
            i, cfg, temp;
        if (me.enableLocking) {
            me.lockedHeaderCtListeners = view.lockedView.getHeaderCt().on(headerListener);
            me.headerCtListeners = view.normalView.getHeaderCt().on(headerListener);
        } else {
            me.headerCtListeners = view.getHeaderCt().on(headerListener);
        }
        // checks for backward compatibility - to be removed in future versions
        for (i = 0; i < len; i++) {
            temp = configs[i];
            if (!!me[temp]) {
                deprecated.push(temp);
            }
        }
        if (deprecated.length > 0) {
            cfg = {};
            len = deprecated.length;
            for (i = 0; i < len; i++) {
                temp = deprecated[i];
                if (temp === 'matrixConfig') {
                    Ext.apply(cfg, me.matrixConfig);
                } else {
                    cfg[temp] = me[temp];
                }
            }
            if (me.originalStore) {
                cfg.store = me.originalStore;
            }
            if (matrix) {
                if (cfg.type && matrix.type === cfg.type) {
                    matrix.reconfigure(cfg);
                    return;
                }
            } else {
                if (!cfg.type) {
                    cfg.type = 'local';
                }
                cfg.cmp = me;
            }
            me.setMatrix(cfg);
        }
    },
    destroy: function() {
        var me = this;
        me.setMatrix(null);
        Ext.destroy(me.headerCtListeners, me.lockedHeaderCtListeners);
        Ext.destroy(me.originalStore);
        me.headerCtListeners = me.lockedHeaderCtListeners = null;
        me.originalStore = me.pivotColumns = null;
        me.callParent(arguments);
        Ext.destroy(me.store);
        me.store = null;
    },
    applyMatrix: function(newMatrix, oldMatrix) {
        Ext.destroy(oldMatrix);
        if (newMatrix == null) {
            return newMatrix;
        }
        if (newMatrix && newMatrix.isPivotMatrix) {
            newMatrix.cmp = this;
            return newMatrix;
        }
        Ext.applyIf(newMatrix, {
            type: 'local'
        });
        newMatrix.cmp = this;
        // just a bit of hardcoding for old version compatibility
        if (newMatrix.type == 'local' && this.originalStore) {
            Ext.applyIf(newMatrix, {
                store: this.originalStore
            });
        }
        return Ext.Factory.pivotmatrix(newMatrix);
    },
    updateMatrix: function(matrix, oldMatrix) {
        var me = this,
            dataSource;
        me.matrixRelayedListeners = me.matrixListeners = Ext.destroy(oldMatrix, me.matrixListeners, me.matrixRelayedListeners);
        if (matrix) {
            me.matrixListeners = me.matrix.on({
                cleardata: me.onMatrixClearData,
                start: me.onMatrixProcessStart,
                progress: me.onMatrixProcessProgress,
                done: me.onMatrixDataReady,
                afterupdate: me.onMatrixAfterUpdate,
                groupexpand: me.onMatrixGroupExpandCollapse,
                groupcollapse: me.onMatrixGroupExpandCollapse,
                scope: me,
                destroyable: true
            });
            me.matrixRelayedListeners = me.relayEvents(me.matrix, me.relayedMatrixEvents, 'pivot');
            dataSource = me.getFeatureDataSource();
            if (dataSource && !me.isConfiguring) {
                dataSource.setMatrix(matrix);
            }
        }
    },
    /**
     * Refresh the view.
     *
     * @private
     */
    refreshView: function() {
        var me = this;
        if (me.destroyed || me.destroying) {
            return;
        }
        me.store.fireEvent('pivotstoreremodel', me);
    },
    /**
     * @private
     */
    updateHeaderContainerColumns: function(group) {
        var me = this,
            view = this.getView(),
            headerCt = view.normalView ? view.normalView.getHeaderCt() : view.getHeaderCt(),
            grid = view.normalGrid ? view.normalGrid : me,
            i = 0,
            toDestroy = [],
            cols, index, ownerCt, item, column;
        if (group) {
            // let's find the first column that matches this group
            // that will be our new columns insertion point
            column = me.getColumnForGroup(headerCt.items, group);
            if (column.found) {
                // let's inform the view that we add/remove columns in a batch
                grid.reconfiguring = true;
                ownerCt = column.item.ownerCt;
                index = column.index;
                while (i < ownerCt.items.length) {
                    item = ownerCt.items.getAt(i);
                    if (item.group == group) {
                        // destroying should happen after the new columns were inserted
                        toDestroy.push(item);
                    }
                    i++;
                }
                cols = Ext.clone(me.pivotColumns);
                me.preparePivotColumns(cols);
                cols = me.getVisiblePivotColumns(me.prepareVisiblePivotColumns(cols), group);
                cols = ownerCt.insert(index, cols);
                Ext.destroy(toDestroy);
                grid.reconfiguring = false;
                // let's focus the first inserted column now
                if (cols && cols.length) {
                    cols[0].focus();
                }
                // for performance reasons we do a custom reconfiguring of columns
                // so we need to call ourselves onHeadersChanged handler
                grid.onHeadersChanged();
            }
        } else {
            // we probably have to expand/collapse all group columns
            cols = Ext.clone(me.pivotColumns);
            me.preparePivotColumns(cols);
            // we need to remove the hidden columns because they trigger view refreshes during reconfiguring
            cols = me.prepareVisiblePivotColumns(cols);
            me.reconfigure(undefined, cols);
        }
    },
    getColumnForGroup: function(items, group) {
        var length = items.length,
            ret = {
                found: false,
                index: -1,
                item: null
            },
            i, item;
        // let's find the first column that matches this group
        // that will be our new columns insertion point
        for (i = 0; i < length; i++) {
            item = items.getAt(i);
            if (item.group == group) {
                ret.found = true;
                ret.index = i;
                ret.item = item;
            } else if (item.items) {
                ret = this.getColumnForGroup(item.items, group);
            }
            if (ret.found) {
                break;
            }
        }
        return ret;
    },
    /**
     * @private
     *
     */
    onMatrixClearData: function() {
        var me = this;
        me.store.removeAll(true);
        if (!me.expandedItemsState) {
            me.lastColumnsState = null;
        }
        me.sortedColumn = null;
    },
    /**
     * @private
     *
     */
    onMatrixProcessStart: function() {
        if (this.enableLoadMask) {
            this.setLoading(true);
        }
    },
    /**
     * @private
     *
     */
    onMatrixProcessProgress: function(matrix, index, length) {
        var me = this,
            percent = ((index || 0.1) * 100) / (length || 0.1),
            pEl;
        if (me.loadMask) {
            if (me.loadMask.msgTextEl) {
                pEl = me.loadMask.msgTextEl;
            } else if (me.loadMask.msgEl) {
                pEl = me.loadMask.msgEl;
            }
            if (pEl) {
                pEl.update(Ext.util.Format.number(percent, '0') + '%');
            }
        }
    },
    /**
     * @private
     *
     */
    onMatrixDataReady: function(matrix) {
        this.refreshMatrixData(matrix, false);
    },
    /**
     * @private
     */
    onMatrixAfterUpdate: function(matrix, changed) {
        if (changed) {
            // if the structure of the left/top axis changed
            // then we need to reconfigure the grid
            this.refreshMatrixData(matrix, true);
        } else {
            this.refreshView();
        }
    },
    /**
     * @private
     */
    onMatrixGroupExpandCollapse: function(matrix, type, item) {
        if (type == 'col') {
            this.updateHeaderContainerColumns(item);
        }
    },
    /**
     * @private
     */
    refreshMatrixData: function(matrix, keepStates) {
        var me = this,
            cols = matrix.getColumnHeaders(),
            stateApplied = false,
            leftItems = matrix.leftAxis.items.items,
            topItems = matrix.topAxis.items.items,
            i, len, item;
        if (me.enableLoadMask) {
            me.setLoading(false);
        }
        if (!keepStates) {
            if (me.expandedItemsState) {
                len = leftItems.length;
                for (i = 0; i < len; i++) {
                    item = leftItems[i];
                    if (Ext.Array.indexOf(me.expandedItemsState['rows'], item.value) >= 0) {
                        item.expanded = true;
                        stateApplied = true;
                    }
                }
                len = topItems.length;
                for (i = 0; i < len; i++) {
                    item = topItems[i];
                    if (Ext.Array.indexOf(me.expandedItemsState['cols'], item.value) >= 0) {
                        item.expanded = true;
                        stateApplied = true;
                    }
                }
                if (stateApplied) {
                    delete me.expandedItemsState;
                }
            } else {
                if (matrix.collapsibleRows) {
                    me.doExpandCollapseTree(matrix.leftAxis.getTree(), !me.startRowGroupsCollapsed);
                }
                if (matrix.collapsibleColumns) {
                    me.doExpandCollapseTree(matrix.topAxis.getTree(), !me.startColGroupsCollapsed);
                }
            }
        }
        me.pivotColumns = Ext.clone(cols);
        cols = Ext.clone(me.pivotColumns);
        me.preparePivotColumns(cols);
        me.restorePivotColumnsState(cols);
        cols = me.prepareVisiblePivotColumns(cols);
        me.reconfigure(undefined, cols);
        if (!Ext.isEmpty(me.sortedColumn)) {
            matrix.leftAxis.sortTreeByField(me.sortedColumn.dataIndex, me.sortedColumn.direction);
        }
        me.store.fireEvent('pivotstoreremodel', me);
        if (!Ext.isEmpty(me.sortedColumn)) {
            me.updateColumnSortState(me.sortedColumn.dataIndex, me.sortedColumn.direction);
        }
    },
    /**
     * Extract from all visible pivot columns only those that match the respective top axis group
     *
     * @param columns
     * @param group
     * @returns {Array}
     *
     * @private
     */
    getVisiblePivotColumns: function(columns, group) {
        var ret = [],
            len = columns.length,
            i, column;
        for (i = 0; i < len; i++) {
            column = columns[i];
            if (column.group == group) {
                ret.push(column);
            }
            if (column.columns) {
                ret = Ext.Array.merge(ret, this.getVisiblePivotColumns(column.columns, group));
            }
        }
        return ret;
    },
    /**
     * Extract from all generated pivot columns only those that are visible
     *
     * @param columns
     * @returns {Array}
     *
     * @private
     */
    prepareVisiblePivotColumns: function(columns) {
        var len = columns.length,
            ret = [],
            i, column, valid;
        for (i = 0; i < len; i++) {
            column = columns[i];
            if (!column.hidden) {
                ret.push(column);
            }
            if (column.columns) {
                column.columns = this.prepareVisiblePivotColumns(column.columns);
            }
        }
        return ret;
    },
    /**
     *
     * Prepare columns delivered by the Matrix to be used inside the grid panel
     *
     * @param columns
     *
     * @private
     */
    preparePivotColumns: function(columns) {
        var me = this,
            defaultColConfig = {
                menuDisabled: true,
                sortable: false,
                lockable: false
            },
            colCount = columns.length,
            i, column;
        for (i = 0; i < colCount; i++) {
            column = columns[i];
            column.cls = column.cls || '';
            Ext.apply(column, defaultColConfig);
            if (column.leftAxis) {
                column.locked = me.enableLocking;
            }
            //else leave it as it is
            if (column.subTotal) {
                column.cls = column.tdCls = me.clsGroupTotal;
            }
            if (column.grandTotal) {
                column.cls = column.tdCls = me.clsGrandTotal;
            }
            if (column.group && column.xgrouped) {
                if (column.group.expanded) {
                    if (!column.subTotal && me.matrix.collapsibleColumns) {
                        column.cls += (Ext.isEmpty(column.cls) ? '' : ' ') + me.groupHeaderCollapsibleCls;
                    }
                } else {
                    if (column.subTotal && me.matrix.collapsibleColumns) {
                        column.cls += (Ext.isEmpty(column.cls) ? '' : ' ') + me.groupHeaderCollapsibleCls + ' ' + me.groupHeaderCollapsedCls;
                    }
                }
                if (column.subTotal) {
                    column.text = column.group.expanded ? column.group.getTextTotal() : Ext.String.format('<span class="' + this.groupCls + '">{0}</span>', column.group.name);
                } else if (column.group) {
                    column.text = Ext.String.format('<span class="' + this.groupCls + '">{0}</span>', column.group.name);
                }
                column.xexpandable = column.subTotal ? !column.group.expanded : column.group.expanded;
                if ((!column.group.expanded && !column.subTotal) || (column.group.expanded && column.subTotal && this.getMatrix().colSubTotalsPosition == 'none')) {
                    column.hidden = true;
                }
            }
            if (Ext.isEmpty(column.columns)) {
                if (column.dimension) {
                    column.renderer = column.dimension ? column.dimension.getRenderer() : false;
                    column.formatter = column.dimension ? column.dimension.getFormatter() : false;
                    column.scope = column.dimension ? column.dimension.scope : null;
                    column.align = column.dimension.align;
                    if (column.dimension.flex > 0) {
                        column.flex = column.flex || column.dimension.flex;
                    } else {
                        column.width = column.width || column.dimension.width;
                    }
                }
            } else {
                column.focusable = true;
                column.enableFocusableContainer = true;
                me.preparePivotColumns(column.columns);
            }
        }
    },
    /**
     * If you want to reconfigure the pivoting parameters then use this function.
     * The config object is used to reconfigure the matrix object.
     *
     * The matrix type can also be changed by providing a proper type in the config parameter.
     *
     * @param {Ext.pivot.matrix.Base} config Configuration object used to reconfigure the pivot matrix
     */
    reconfigurePivot: function(config) {
        var matrix = this.getMatrix();
        config = config || {};
        if (matrix) {
            if (config.type && matrix.type !== config.type) {
                this.setMatrix(config);
            } else {
                matrix.reconfigure(config);
            }
        } else {
            this.setMatrix(config);
        }
    },
    /**
     * Collapse or expand the Matrix tree items.
     *
     * @private
     */
    doExpandCollapseTree: function(tree, expanded) {
        var i;
        for (i = 0; i < tree.length; i++) {
            tree[i].expanded = expanded;
            if (tree[i].children) {
                this.doExpandCollapseTree(tree[i].children, expanded);
            }
        }
    },
    /**
     *
     *   Expand or collapse the specified group.
     *   If no "state" is provided then toggle the expanded property
     *
     * @private
     */
    doExpandCollapse: function(type, groupId, state, includeChildren) {
        var matrix = this.getMatrix(),
            item;
        if (!matrix) {
            // nothing to do
            return;
        }
        item = (type == 'row' ? matrix.leftAxis : matrix.topAxis)['findTreeElement']('key', groupId);
        if (!item) {
            return;
        }
        item = item.node;
        state = Ext.isDefined(state) ? state : !item.expanded;
        if (state) {
            item.expand(includeChildren);
        } else {
            item.collapse(includeChildren);
        }
    },
    setHeaderGroupVisibility: function(column) {
        var i, len, col, columns;
        if (column.xgrouped) {
            // if it's a subtotal then change the column text depending on the group expanded
            if (column.subTotal) {
                column.setText(column.group.expanded ? column.group.getTextTotal() : Ext.String.format('<span class="' + this.groupCls + '">{0}</span>', column.group.name));
                if (!column.group.expanded) {
                    column.addCls(this.groupHeaderCollapsibleCls);
                    column.addCls(this.groupHeaderCollapsedCls);
                } else {
                    column.removeCls(this.groupHeaderCollapsibleCls);
                    column.removeCls(this.groupHeaderCollapsedCls);
                }
            } else {
                column.setText(Ext.String.format('<span class="' + this.groupCls + '">{0}</span>', column.group.name));
                column.addCls(this.groupHeaderCollapsibleCls);
            }
            column.xexpandable = column.subTotal ? !column.group.expanded : column.group.expanded;
            if ((!column.group.expanded && !column.subTotal) || (column.group.expanded && column.subTotal && this.getMatrix().colSubTotalsPosition == 'none')) {
                column.hide();
                return;
            }
        }
        column.show();
        column.items.each(this.setHeaderGroupVisibility, this);
    },
    /**
     * Expand the specified left axis item
     *
     * @param {String} leftAxisItemKey Key of the left axis item
     * @param {Boolean} includeChildren Expand the entire children tree below this item
     */
    expandRow: function(leftAxisItemKey, includeChildren) {
        this.doExpandCollapse('row', leftAxisItemKey, true, includeChildren);
    },
    /**
     * Collapse the specified left axis item
     *
     * @param {String} leftAxisItemKey Key of the left axis item
     * @param {Boolean} includeChildren Collapse the entire children tree below this item
     */
    collapseRow: function(leftAxisItemKey, includeChildren) {
        this.doExpandCollapse('row', leftAxisItemKey, false, includeChildren);
    },
    /**
     * Expand the specified top axis item
     *
     * @param {String} topAxisItemKey Key of the top axis item
     * @param {Boolean} includeChildren Expand the entire children tree below this item
     */
    expandCol: function(topAxisItemKey, includeChildren) {
        this.doExpandCollapse('col', topAxisItemKey, true, includeChildren);
    },
    /**
     * Collapse the specified top axis item
     *
     * @param {String} topAxisItemKey Key of the top axis item
     * @param {Boolean} includeChildren Collapse the entire children tree below this item
     */
    collapseCol: function(topAxisItemKey, includeChildren) {
        this.doExpandCollapse('col', topAxisItemKey, false, includeChildren);
    },
    /**
     * Expand all groups.
     *
     */
    expandAll: function() {
        this.expandAllColumns();
        this.expandAllRows();
    },
    /**
     * Expand all row groups
     *
     */
    expandAllRows: function() {
        this.getMatrix().leftAxis.expandAll();
    },
    /**
     * Expand all column groups
     *
     */
    expandAllColumns: function() {
        this.getMatrix().topAxis.expandAll();
    },
    /**
     * Collapse all groups.
     *
     */
    collapseAll: function() {
        this.collapseAllRows();
        this.collapseAllColumns();
    },
    /**
     * Collapse all row groups
     *
     */
    collapseAllRows: function() {
        this.getMatrix().leftAxis.collapseAll();
    },
    /**
     * Collapse all column groups
     *
     */
    collapseAllColumns: function() {
        this.getMatrix().topAxis.collapseAll();
    },
    /**
     * Set a new store that will be used to pivot the data. This works only when using a {@link Ext.pivot.matrix.Local}
     * matrix.
     *
     * You can also use {@link #reconfigurePivot} to change the store for a {@link Ext.pivot.matrix.Local} matrix.
     *
     * @param {Ext.data.Store} store Can be either a Store instance or a configuration object that
     * will be turned into a Store.
     *
     * @since 6.0.0
     */
    setStore: function(store) {
        var matrix = this.getMatrix();
        if (matrix && matrix.type === 'local') {
            matrix.initializeStore({
                store: store
            });
        }
    },
    /**
     *     Returns the original store with the data to process.
     *    @returns {Ext.data.Store}
     */
    getStore: function() {
        var me = this,
            matrix = me.getMatrix();
        return ((matrix instanceof Ext.pivot.matrix.Local) ? matrix.store : me.originalStore) || me.store;
    },
    /**
     *    Returns the pivot store with the aggregated values
     *    @returns {Ext.data.Store}
     */
    getPivotStore: function() {
        return this.store;
    },
    /**
     * Returns the top axis item used to generate the specified column.
     *
     * @param {Ext.grid.column.Column} column
     */
    getTopAxisItem: function(column) {
        var me = this,
            matrix = me.getMatrix(),
            columns = matrix.getColumns(),
            key, i;
        if (!column) {
            return null;
        }
        for (i = 0; i < columns.length; i++) {
            if (columns[i].name === column.dataIndex) {
                key = columns[i].col;
                break;
            }
        }
        return Ext.isEmpty(key) ? null : matrix.topAxis.items.getByKey(key);
    },
    /**
     * Returns the left axis item used to generate the specified record.
     *
     * @param {Ext.data.Model} record
     */
    getLeftAxisItem: function(record) {
        var dataSource = this.getFeatureDataSource(),
            info;
        if (!record || !dataSource) {
            return null;
        }
        info = dataSource.storeInfo[record.internalId];
        return info ? this.getMatrix().leftAxis.items.getByKey(info.leftKey) : null;
    },
    getFeatureDataSource: function() {
        var view = this.rendered ? this.getView() : null,
            feature;
        if (!view) {
            return;
        }
        view = view.normalView || view;
        feature = view.getFeature('group');
        return feature ? feature.dataSource : null;
    },
    /**
     * @private
     */
    onHeaderClick: function(ct, column, e) {
        var me = this,
            sortState = (column.sortState ? (column.sortState == 'ASC' ? 'DESC' : 'ASC') : 'ASC');
        if (e) {
            e.stopEvent();
        }
        if (!column.xexpandable) {
            if (!me.enableColumnSort) {
                return;
            }
            if ((column.leftAxis || column.topAxis) && !Ext.isEmpty(column.dataIndex)) {
                // sort the results when a dataIndex column was clicked
                if (me.getMatrix().leftAxis.sortTreeByField(column.dataIndex, sortState)) {
                    me.refreshView();
                    me.updateColumnSortState(column, sortState);
                }
            }
            return false;
        }
        if (me.matrix.collapsibleColumns) {
            me.doExpandCollapse('col', column.key);
        }
        return false;
    },
    updateColumnSortState: function(column, sortState) {
        if (Ext.isString(column)) {
            column = this.down('[dataIndex="' + column + '"]');
        }
        if (!column) {
            return;
        }
        // we need to create a dummy sorter object to be able to change the column styling
        column.setSortState(new Ext.util.Sorter({
            direction: sortState,
            property: 'dummy'
        }));
        column.sortState = sortState;
        this.sortedColumn = {
            dataIndex: column.dataIndex,
            direction: sortState
        };
    },
    getStateProperties: function() {
        return [
            'enableColumnSort',
            'sortedColumn',
            'startRowGroupsCollapsed',
            'startColGroupsCollapsed'
        ];
    },
    /**
     * Applies the saved state of the pivot grid
     */
    applyState: function(state) {
        var me = this,
            props = me.getStateProperties(),
            matrix = me.getMatrix(),
            i, prop;
        for (i = 0; i < props.length; i++) {
            prop = props[i];
            if (state[prop]) {
                me[prop] = state[prop];
            }
        }
        if (state['expandedItems']) {
            me.expandedItemsState = state['expandedItems'];
        }
        me.lastColumnsState = state['pivotcolumns'] || {};
        if (matrix) {
            matrix.reconfigure(state.matrix);
        } else {
            me.setMatrix(state.matrix);
        }
    },
    /**
     *    Get the current state of the pivot grid.
     *     Be careful that the stateful feature won't work correctly in this cases:
     *
     *    - if you provide an aggregator function to the aggregate item then this won't be serialized.
     *        You could extend {@link Ext.pivot.Aggregators Aggregators} to add your own function
     *
     *    - if you provide a renderer function then this won't be serialized. You need to provide a formatting string instead.
     */
    getState: function() {
        var state = {},
            props = this.getStateProperties(),
            matrix = this.getMatrix(),
            i, len, item;
        len = props.length;
        for (i = 0; i < len; i++) {
            state[props[i]] = this[props[i]];
        }
        // save the state of all expanded axis groups
        state.expandedItems = {
            cols: [],
            rows: []
        };
        if (matrix) {
            state.matrix = matrix.serialize();
            len = matrix.leftAxis.items.getCount();
            for (i = 0; i < len; i++) {
                item = matrix.leftAxis.items.getAt(i);
                if (item.expanded) {
                    state.expandedItems.rows.push(item.value);
                }
            }
            // to be able to restore the width/flex of the left axis columns we need the IDs
            len = matrix.leftAxis.dimensions.getCount();
            for (i = 0; i < len; i++) {
                item = matrix.leftAxis.dimensions.getAt(i);
                state.matrix.leftAxis[i]['id'] = item.getId();
            }
            len = matrix.topAxis.items.getCount();
            for (i = 0; i < len; i++) {
                item = matrix.topAxis.items.getAt(i);
                if (item.expanded) {
                    state.expandedItems.cols.push(item.value);
                }
            }
        }
        state.pivotcolumns = this.getPivotColumnsState();
        return state;
    },
    /**
     * @private
     */
    getPivotColumnsState: function() {
        var me = this,
            i, cols;
        if (!me.lastColumnsState) {
            cols = me.getDataIndexColumns(me.getMatrix().getColumnHeaders());
            me.lastColumnsState = {};
            for (i = 0; i < cols.length; i++) {
                if (cols[i].dataIndex) {
                    me.lastColumnsState[cols[i].dataIndex] = {
                        width: cols[i].width,
                        flex: cols[i].flex || 0
                    };
                }
            }
        }
        cols = me.getView().getGridColumns();
        for (i = 0; i < cols.length; i++) {
            if (cols[i].dataIndex) {
                me.lastColumnsState[cols[i].dataIndex] = {
                    width: cols[i].rendered ? cols[i].getWidth() : cols[i].width,
                    flex: cols[i].flex || 0
                };
            }
        }
        return me.lastColumnsState;
    },
    /**
     * @private
     */
    getDataIndexColumns: function(columns) {
        var cols = [],
            i;
        for (i = 0; i < columns.length; i++) {
            if (columns[i].dataIndex) {
                cols.push(columns[i].dataIndex);
            } else if (Ext.isArray(columns[i].columns)) {
                cols = Ext.Array.merge(cols, this.getDataIndexColumns(columns[i].columns));
            }
        }
        return cols;
    },
    /**
     * @private
     */
    restorePivotColumnsState: function(columns) {
        this.parsePivotColumnsState(this.getPivotColumnsState(), columns);
    },
    parsePivotColumnsState: function(state, columns) {
        var item, i;
        if (!columns) {
            return;
        }
        for (i = 0; i < columns.length; i++) {
            item = state[columns[i].dataIndex];
            if (item) {
                if (item.flex) {
                    columns[i].flex = item.flex;
                } else if (item.width) {
                    columns[i].width = item.width;
                }
            }
            this.parsePivotColumnsState(state, columns[i].columns);
        }
    },
    deprecated: {
        '6.2': {
            properties: {
                /**
                 * @cfg {Object} matrixConfig Define here matrix specific configuration.
                 * @deprecated 6.2 Use {@link #matrix} instead.
                 */
                matrixConfig: null,
                /**
                 * @cfg {String} viewLayoutType Type of layout used to display the pivot data.
                 * Possible values: outline, compact.
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                viewLayoutType: 'outline',
                /**
                 * @cfg {String} rowSubTotalsPosition Possible values: first, none, last
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                rowSubTotalsPosition: 'first',
                /**
                 * @cfg {String} rowGrandTotalsPosition Possible values: first, none, last
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                rowGrandTotalsPosition: 'last',
                /**
                 * @cfg {String} colSubTotalsPosition Possible values: first, none, last
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                colSubTotalsPosition: 'last',
                /**
                 * @cfg {String} colGrandTotalsPosition Possible values: first, none, last
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                colGrandTotalsPosition: 'last',
                /**
                 * @cfg {String} textTotalTpl Configure the template for the group total. (i.e. '{name} ({rows.length} items)')
                 * @cfg {String}           textTotalTpl.groupField         The field name being grouped by.
                 * @cfg {String}           textTotalTpl.name               Group name
                 * @cfg {Ext.data.Model[]} textTotalTpl.rows               An array containing the child records for the group being rendered.
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                textTotalTpl: 'Total ({name})',
                /**
                 * @cfg {String} textGrandTotalTpl Configure the template for the grand total.
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                textGrandTotalTpl: 'Grand total',
                /**
                 * @cfg {Boolean} showZeroAsBlank Should 0 values be displayed as blank?
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                showZeroAsBlank: false,
                /**
                 * @cfg {Ext.pivot.dimension.Item[]} leftAxis Define the left axis used by the grid. Each item of the array
                 * is a configuration object used to instantiate an {@link Ext.pivot.dimension.Item Item}.
                 *
                 * Example:
                 *
                 *      leftAxis: [{
                 *          width:      80,         // column width in the grid
                 *          dataIndex:  'person',   // field used for extracting data from the store
                 *          header:     'Persons',  // column title
                 *          direction:  'ASC'       // sort values ascending
                 *      },{
                 *          width:      90,
                 *          dataIndex:  'quarter',
                 *          header:     'Quarter'
                 *      },{
                 *          width:      90,
                 *          dataIndex:  'product',
                 *          header:     'Products',
                 *          sortable:   false
                 *      }]
                 *
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                leftAxis: null,
                /**
                 * @cfg {Ext.pivot.dimension.Item[]} topAxis Define the top axis used by the pivot grid. Each item of the array
                 * is a configuration object used to instantiate an {@link Ext.pivot.dimension.Item Item}.
                 *
                 * Example:
                 *
                 *      topAxis: [{
                 *          dataIndex:  'city',     // field used for extracting data from the store
                 *          direction:  'ASC'       // sort values ascending
                 *          renderer: function(v){
                 *              return v;           // do your own stuff here
                 *          }                       // this renderer is used to format the value of top axis labels
                 *      }]
                 *
                 *
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                topAxis: null,
                /**
                 * @cfg {Ext.pivot.dimension.Item[]} aggregate Define the fields you want to aggregate in the pivot grid.
                 * You can have one or multiple fields. Each item of the array
                 * is a configuration object used to instantiate an {@link Ext.pivot.dimension.Item Item}.
                 *
                 * Example:
                 *
                 *      aggregate: [{
                 *          dataIndex:  'value',        // what field is aggregated
                 *          header:     'Total',        // column title
                 *          aggregator: 'sum',          // function used for aggregating
                 *          align:      'right',        // grid cell alignment
                 *          width:      100,            // column width
                 *          renderer:   '0'             // grid cell renderer
                 *      },{
                 *          measure:    'quantity',
                 *          header:     'Quantity',
                 *          aggregator: function(records, measure, matrix, rowGroupKey, colGroupKey){
                 *              // provide your own aggregator function
                 *              return records.length;
                 *          },
                 *          align:      'right',
                 *          width:      80,
                 *          renderer: function(v){
                 *              return v; // grid cell renderer
                 *          }
                 *      }]
                 *
                 *
                 * @deprecated 6.2 Define it in {@link #matrix} instead.
                 */
                aggregate: null
            }
        }
    }
});

/**
 * This plugin allows inline cell editing of the pivot grid results.
 *
 * This plugin requires editors to be defined on the aggregate dimensions.
 *
 *      {
 *          xtype: 'pivotgrid',
 *          plugins: {
 *              pivotcellediting: {
 *                  clicksToEdit:   1,
 *                  // Can be 'overwrite', 'increment', 'percentage', 'uniform'
 *                  defaultUpdater: 'overwrite'
 *              }
 *          },
 *          matrix: {
 *              aggregate: [{
 *                  dataIndex:  'value',
 *                  header:     'Total',
 *                  aggregator: 'sum',
 *
 *                  // Specify "editor" to edit an aggregate dimension
 *                  editor:     'numberfield'
 *              }]
 *              // ...
 *          }
 *      }
 *
 *  The new value is applied to the records behind that cell using different approaches:
 *
 * - `percentage`: the user fills in a percentage that is applied to each record.
 * - `increment`:  the user fills in a value that is added to each record.
 * - `overwrite`:  the new value filled in by the user overwrites each record.
 * - `uniform`:  replace sum of values with a provided value using uniform distribution
 *
 * More pivot updater types can be defined by extending {@link Ext.pivot.update.Base}.
 *
 * **Note:** Only works when using a {@link Ext.pivot.matrix.Local} matrix on a pivot grid.
 */
Ext.define('Ext.pivot.plugin.CellEditing', {
    extend: 'Ext.grid.plugin.CellEditing',
    alias: 'plugin.pivotcellediting',
    requires: [
        'Ext.pivot.update.Increment',
        'Ext.pivot.update.Overwrite',
        'Ext.pivot.update.Percentage',
        'Ext.pivot.update.Uniform'
    ],
    /**
     * @cfg {String} defaultUpdater
     *
     * Define which pivot updater is used when the cell value changes.
     */
    defaultUpdater: 'uniform',
    /**
     * @cfg {Number/String} defaultValue
     *
     * Define a default value to show when cell editor is active.
     */
    defaultValue: null,
    updater: null,
    init: function(grid) {
        var me = this;
        /**
         * Fires on the pivot grid before updating all result records.
         *
         * @event pivotbeforeupdate
         * @param {Ext.pivot.update.Base} updater Reference to the updater object
         */
        /**
         * Fires on the pivot grid after updating all result records.
         *
         * @event pivotupdate
         * @param {Ext.pivot.update.Base} updater Reference to the updater object
         */
        me.callParent([
            grid
        ]);
        me.pivot = grid.isPivotGrid ? grid : grid.up('pivotgrid');
        me.mon(me, {
            beforeedit: me.onBeforeEdit,
            // if users are listening to this event too then they should be allowed to change the context value
            // so we run first
            priority: 1000,
            scope: me
        });
        if (!me.pivot.isCellEditingAttached) {
            me.mon(me.pivot, {
                pivotcolumnsbuilt: me.addColumnEditors,
                scope: me
            });
            me.pivot.isCellEditingAttached = true;
        }
        me.updater = Ext.Factory.pivotupdate({
            type: me.defaultUpdater
        });
        me.pivot.relayEvents(me.updater, [
            'beforeupdate',
            'update'
        ], 'pivot');
    },
    destroy: function() {
        var me = this;
        me.pivot.isCellEditingAttached = false;
        me.pivot = me.updater = Ext.destroy(me.updater);
        me.callParent();
    },
    /**
     * Attach column editors when column configs are generated by the pivot grid.
     *
     * @param matrix
     * @param columns
     *
     * @private
     */
    addColumnEditors: function(matrix, columns) {
        var len = columns.length,
            col, i;
        for (i = 0; i < len; i++) {
            col = columns[i];
            if (col.dimension && col.dimension.editor) {
                // it has an aggregate dimension assigned
                col.editor = Ext.clone(col.dimension.editor);
            }
            if (col.columns) {
                this.addColumnEditors(matrix, col.columns);
            }
        }
    },
    /**
     * Check if the cell is editable or not.
     *
     * A cell that doesn't have any pivot result it's not editable, which means that no record is available.
     *
     * @param {Ext.data.Model} record
     * @param {Ext.grid.column.Column} columnHeader
     * @return {Boolean}
     */
    isCellEditable: function(record, columnHeader) {
        return this.callParent([
            record,
            columnHeader
        ]) && Boolean(this.getPivotResult(this.getEditingContext(record, columnHeader)));
    },
    onBeforeEdit: function(plugin, context) {
        if (!Ext.isEmpty(this.defaultValue)) {
            context.value = this.defaultValue;
        }
        return this.isCellEditable(context.record, context.column);
    },
    getPivotResult: function(context) {
        var matrix = this.pivot.getMatrix(),
            leftItem = this.pivot.getLeftAxisItem(context.record),
            topItem = this.pivot.getTopAxisItem(context.column);
        return matrix.results.get(leftItem ? leftItem.key : matrix.grandTotalKey, topItem ? topItem.key : matrix.grandTotalKey);
    },
    updateRecords: function(context, value) {
        var pivot = this.pivot,
            matrix = pivot.getMatrix(),
            leftItem = pivot.getLeftAxisItem(context.record),
            topItem = pivot.getTopAxisItem(context.column);
        this.updater.setConfig({
            leftKey: leftItem ? leftItem.key : matrix.grandTotalKey,
            topKey: topItem ? topItem.key : matrix.grandTotalKey,
            matrix: matrix,
            dataIndex: context.column.dimension.dataIndex,
            value: value
        });
        this.updater.update();
    },
    onEditComplete: function(ed, value, startValue) {
        var me = this,
            context = ed.context,
            view, record, result;
        view = context.view;
        record = context.record;
        context.value = value;
        if (!me.validateEdit(context)) {
            me.editing = false;
            return;
        }
        me.updateRecords(context, value);
        // Changing the record may impact the position
        context.rowIdx = view.indexOf(record);
        me.fireEvent('edit', me, context);
        // We clear down our context here in response to the CellEditor completing.
        // We only do this if we have not already started editing a new context.
        if (me.context === context) {
            me.setActiveEditor(null);
            me.setActiveColumn(null);
            me.setActiveRecord(null);
            me.editing = false;
        }
    }
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.window.Window', {
    extend: 'Ext.window.Window',
    requires: [
        'Ext.form.Panel',
        'Ext.form.FieldContainer',
        'Ext.form.field.Text',
        'Ext.form.field.Hidden',
        'Ext.form.field.ComboBox',
        'Ext.layout.container.HBox'
    ],
    modal: true,
    closeAction: 'destroy',
    initComponent: function() {
        var me = this;
        Ext.apply(me, {
            layout: 'fit',
            items: [
                me.getSettingsForm()
            ],
            buttons: [
                {
                    text: Ext.Msg.buttonText.ok,
                    handler: me.applySettings,
                    scope: me
                },
                {
                    text: Ext.Msg.buttonText.cancel,
                    handler: me.cancelSettings,
                    scope: me
                }
            ]
        });
        return me.callParent(arguments);
    },
    /**
     * @method
     * Override to change settings before applying them. Return false to cancel changes.
     *
     * @param {Object} settings
     */
    beforeApplySettings: Ext.emptyFn,
    /**
     * Override to supply own form for settings
     */
    getSettingsForm: function() {
        return {
            xtype: 'form',
            bodyPadding: 5,
            items: []
        };
    },
    loadSettings: function(settings) {
        var form = this.down('form');
        if (form) {
            form.getForm().setValues(settings || {});
        }
    },
    applySettings: function() {
        var form = this.down('form'),
            settings;
        if (form && form.getForm().isValid()) {
            settings = form.getForm().getValues();
            if (this.beforeApplySettings(settings) !== false) {
                if (this.fireEvent('applysettings', this, settings) !== false) {
                    this.cancelSettings();
                }
            }
        }
    },
    cancelSettings: function() {
        this.close();
    }
});

/**
 * This is the window that allows configuring a label filter
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.window.FilterLabel', {
    extend: 'Ext.pivot.plugin.configurator.window.Window',
    titleText: 'Label filter ({0})',
    fieldText: 'Show items for which the label',
    caseSensitiveText: 'Case sensitive',
    initComponent: function() {
        var me = this;
        me.callParent(arguments);
        me.setTitle(Ext.String.format(me.titleText, me.title));
    },
    getSettingsForm: function() {
        var me = this,
            items = me.filterFields || [];
        items.push({
            xtype: 'combo',
            editable: false,
            queryMode: 'local',
            valueField: 'value',
            store: me.store,
            name: 'operator',
            listeners: {
                change: function(combo, newValue) {
                    var me = this,
                        hidden = me.isOperatorBetween(newValue);
                    me.down('#fValue').setVisible(!hidden);
                    me.down('#fValue').allowBlank = hidden;
                    me.down('#fFrom').setVisible(hidden);
                    me.down('#fFrom').allowBlank = !hidden;
                    me.down('#fTo').setVisible(hidden);
                    me.down('#fTo').allowBlank = !hidden;
                },
                scope: me
            }
        }, {
            itemId: 'fValue',
            xtype: 'textfield',
            margin: '0 0 0 5',
            name: 'value'
        }, {
            itemId: 'fFrom',
            xtype: 'textfield',
            margin: '0 0 0 5',
            name: 'from'
        }, {
            itemId: 'fTo',
            xtype: 'textfield',
            margin: '0 0 0 5',
            name: 'to'
        });
        return Ext.apply(me.callParent(arguments), {
            items: [
                {
                    xtype: 'hidden',
                    name: 'type'
                },
                {
                    xtype: 'fieldcontainer',
                    labelSeparator: '',
                    fieldLabel: me.fieldText,
                    labelAlign: 'top',
                    layout: {
                        type: 'hbox',
                        align: 'stretch'
                    },
                    defaults: {
                        allowBlank: false,
                        flex: 1
                    },
                    items: items
                },
                {
                    xtype: 'checkbox',
                    boxLabel: me.caseSensitiveText,
                    name: 'caseSensitive'
                }
            ]
        });
    },
    beforeApplySettings: function(settings) {
        if (this.isOperatorBetween(settings.operator)) {
            settings.value = [
                settings.from,
                settings.to
            ];
        }
        delete (settings.from);
        delete (settings.to);
        settings.caseSensitive = (settings.caseSensitive === 'on');
        settings.topSort = (settings.topSort === 'on');
    },
    isOperatorBetween: function(operator) {
        return Ext.Array.indexOf([
            'between',
            'not between'
        ], operator) >= 0;
    }
});

/**
 * This is the window that allows configuring a value filter
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.window.FilterValue', {
    extend: 'Ext.pivot.plugin.configurator.window.FilterLabel',
    titleText: 'Value filter ({0})',
    fieldText: 'Show items for which',
    initComponent: function() {
        var me = this;
        me.filterFields = [
            {
                xtype: 'combo',
                editable: false,
                queryMode: 'local',
                valueField: 'value',
                store: me.storeAgg,
                name: 'dimensionId'
            }
        ];
        me.callParent(arguments);
    }
});

/**
 * This is the window that allows configuring a top10 value filter
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.window.FilterTop', {
    extend: 'Ext.pivot.plugin.configurator.window.Window',
    titleText: 'Top 10 filter ({0})',
    fieldText: 'Show',
    sortResultsText: 'Sort results',
    initComponent: function() {
        var me = this;
        me.callParent(arguments);
        me.setTitle(Ext.String.format(me.titleText, me.title));
    },
    getSettingsForm: function() {
        var me = this,
            items = [];
        items.push({
            xtype: 'combo',
            editable: false,
            queryMode: 'local',
            valueField: 'value',
            store: me.storeTopOrder,
            name: 'topOrder'
        }, {
            xtype: 'textfield',
            margin: '0 0 0 5',
            name: 'value'
        }, {
            xtype: 'combo',
            margin: '0 0 0 5',
            editable: false,
            queryMode: 'local',
            valueField: 'value',
            store: me.storeTopType,
            name: 'topType'
        }, {
            xtype: 'combo',
            margin: '0 0 0 5',
            editable: false,
            queryMode: 'local',
            valueField: 'value',
            store: me.storeAgg,
            name: 'dimensionId'
        });
        return Ext.apply(me.callParent(arguments), {
            defaults: {
                allowBlank: false
            },
            items: [
                {
                    xtype: 'hidden',
                    name: 'type'
                },
                {
                    xtype: 'hidden',
                    name: 'operator'
                },
                {
                    xtype: 'fieldcontainer',
                    labelSeparator: '',
                    fieldLabel: me.fieldText,
                    labelAlign: 'top',
                    layout: {
                        type: 'hbox',
                        align: 'stretch'
                    },
                    defaults: {
                        flex: 1,
                        allowBlank: false
                    },
                    items: items
                },
                {
                    xtype: 'checkbox',
                    boxLabel: me.sortResultsText,
                    name: 'topSort'
                }
            ]
        });
    }
});

/**
 * This is the window that allows field settings configuration.
 */
Ext.define('Ext.pivot.plugin.configurator.window.FieldSettings', {
    extend: 'Ext.pivot.plugin.configurator.window.Window',
    requires: [
        'Ext.form.field.Display'
    ],
    title: 'Field settings',
    formatText: 'Format as',
    summarizeByText: 'Summarize by',
    customNameText: 'Custom name',
    sourceNameText: 'Source name',
    alignText: 'Align',
    alignLeftText: 'Left',
    alignCenterText: 'Center',
    alignRightText: 'Right',
    field: null,
    getSettingsForm: function() {
        var me = this,
            dataFormatters = [],
            dataAggregators = [],
            settings = me.field.getSettings(),
            formatters = settings.getFormatters(),
            renderers = settings.getRenderers(),
            fns = settings.getAggregators(),
            length, i, list;
        length = fns.length;
        for (i = 0; i < length; i++) {
            dataAggregators.push([
                me.field.getAggText(fns[i]),
                fns[i]
            ]);
        }
        list = Ext.Object.getAllKeys(formatters || {});
        length = list.length;
        for (i = 0; i < length; i++) {
            dataFormatters.push([
                list[i],
                formatters[list[i]],
                1
            ]);
        }
        list = Ext.Object.getAllKeys(renderers || {});
        length = list.length;
        for (i = 0; i < length; i++) {
            dataFormatters.push([
                list[i],
                renderers[list[i]],
                2
            ]);
        }
        return Ext.apply(me.callParent(arguments), {
            items: [
                {
                    xtype: 'displayfield',
                    fieldLabel: me.sourceNameText,
                    name: 'dataIndex'
                },
                {
                    xtype: 'textfield',
                    fieldLabel: me.customNameText,
                    name: 'header',
                    allowBlank: false
                },
                {
                    xtype: 'combo',
                    fieldLabel: me.alignText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'align',
                    store: new Ext.data.ArrayStore({
                        fields: [
                            'text',
                            'value'
                        ],
                        data: [
                            [
                                me.alignLeftText,
                                'left'
                            ],
                            [
                                me.alignCenterText,
                                'center'
                            ],
                            [
                                me.alignRightText,
                                'right'
                            ]
                        ]
                    })
                },
                {
                    xtype: 'combo',
                    fieldLabel: me.formatText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'formatter',
                    store: new Ext.data.ArrayStore({
                        fields: [
                            'text',
                            'value',
                            'type'
                        ],
                        data: dataFormatters
                    })
                },
                {
                    xtype: 'combo',
                    fieldLabel: me.summarizeByText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'aggregator',
                    store: new Ext.data.ArrayStore({
                        fields: [
                            'text',
                            'value'
                        ],
                        data: dataAggregators
                    })
                }
            ]
        });
    },
    beforeApplySettings: function(settings) {
        var formatAs = this.down('[name=formatter]'),
            store, item;
        if (formatAs) {
            store = formatAs.getStore();
            item = store.findRecord('value', settings.formatter, 0, false, true, true);
            if (item) {
                if (item.get('type') == 1) {
                    settings.formatter = item.get('value');
                    settings.renderer = null;
                } else {
                    settings.renderer = item.get('value');
                    settings.formatter = null;
                }
            }
        }
    },
    loadSettings: function(settings) {
        var format = settings.formatter;
        if (Ext.isFunction(format)) {
            format = null;
        }
        if (!format && !Ext.isFunction(settings.renderer)) {
            format = settings.renderer;
        }
        settings.formatter = format;
        this.callParent([
            settings
        ]);
    }
});

/**
 * This class is used for creating a configurator field component.
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.Column', {
    extend: 'Ext.Component',
    requires: [
        'Ext.menu.Menu',
        'Ext.menu.CheckItem',
        'Ext.menu.Item',
        'Ext.menu.Separator',
        'Ext.pivot.plugin.configurator.Field',
        'Ext.pivot.plugin.configurator.window.FilterLabel',
        'Ext.pivot.plugin.configurator.window.FilterValue',
        'Ext.pivot.plugin.configurator.window.FilterTop',
        'Ext.pivot.plugin.configurator.window.FieldSettings'
    ],
    alias: 'widget.pivotconfigfield',
    childEls: [
        'textCol',
        'filterCol',
        'sortCol'
    ],
    tabIndex: 0,
    focusable: true,
    isConfiguratorField: true,
    renderTpl: '<div id="{id}-configCol" role="button" class="' + Ext.baseCSSPrefix + 'pivot-grid-config-column-inner" >' + '<span id="{id}-customCol" role="presentation" class="' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-customize ' + Ext.baseCSSPrefix + 'border-box ' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn ' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-image"></span>' + '<span id="{id}-sortCol" role="presentation" data-ref="sortCol" class="' + Ext.baseCSSPrefix + 'border-box ' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn"></span>' + '<span id="{id}-filterCol" role="presentation" data-ref="filterCol" class="' + Ext.baseCSSPrefix + 'border-box ' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn"></span>' + '<span id="{id}-textCol" role="presentation" data-ref="textCol" data-qtip="{header}" class="' + Ext.baseCSSPrefix + 'pivot-grid-config-column-text ' + Ext.baseCSSPrefix + 'column-header-text ' + Ext.baseCSSPrefix + 'border-box">' + '{header}' + '</span>' + '</div>',
    header: '&#160;',
    minWidth: 80,
    sortAscText: 'Sort A to Z',
    sortDescText: 'Sort Z to A',
    sortClearText: 'Disable sorting',
    clearFilterText: 'Clear filter from "{0}"',
    labelFiltersText: 'Label filters',
    valueFiltersText: 'Value filters',
    equalsText: 'Equals...',
    doesNotEqualText: 'Does not equal...',
    beginsWithText: 'Begins with...',
    doesNotBeginWithText: 'Does not begin with...',
    endsWithText: 'Ends with...',
    doesNotEndWithText: 'Does not end with...',
    containsText: 'Contains...',
    doesNotContainText: 'Does not contain...',
    greaterThanText: 'Greater than...',
    greaterThanOrEqualToText: 'Greater than or equal to...',
    lessThanText: 'Less than...',
    lessThanOrEqualToText: 'Less than or equal to...',
    betweenText: 'Between...',
    notBetweenText: 'Not between...',
    top10Text: 'Top 10...',
    equalsLText: 'equals',
    doesNotEqualLText: 'does not equal',
    beginsWithLText: 'begins with',
    doesNotBeginWithLText: 'does not begin with',
    endsWithLText: 'ends with',
    doesNotEndWithLText: 'does not end with',
    containsLText: 'contains',
    doesNotContainLText: 'does not contain',
    greaterThanLText: 'is greater than',
    greaterThanOrEqualToLText: 'is greater than or equal to',
    lessThanLText: 'is less than',
    lessThanOrEqualToLText: 'is less than or equal to',
    betweenLText: 'is between',
    notBetweenLText: 'is not between',
    top10LText: 'Top 10...',
    topOrderTopText: 'Top',
    topOrderBottomText: 'Bottom',
    topTypeItemsText: 'Items',
    topTypePercentText: 'Percent',
    topTypeSumText: 'Sum',
    baseCls: Ext.baseCSSPrefix + 'pivot-grid-config-column',
    btnIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-image',
    setFilterIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-filter-set',
    clearFilterIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-filter-clear',
    ascSortIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-sort-asc',
    descSortIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-sort-desc',
    clearSortIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-sort-clear',
    overCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-over',
    cls: Ext.baseCSSPrefix + 'unselectable',
    config: {
        /**
         * @cfg {String} fieldType
         *
         * Defines in which area this configurator field exists.
         *
         * Possible values:
         *
         * - `all` = the field is located in the "all fields" area;
         * - `aggregate` = the field is located in the "values" area;
         * - `leftAxis` = the field is located in the "row values" area;
         * - `topAxis` = the field is located in the "column values" area;
         *
         */
        fieldType: 'all',
        /**
         * @cfg {Ext.pivot.plugin.configurator.Field} field
         *
         * Reference to the configured dimension on this configurator field.
         */
        field: null
    },
    destroy: function() {
        this.setField(null);
        this.callParent();
    },
    initRenderData: function() {
        var dim = this.getField();
        return Ext.apply(this.callParent(arguments), {
            header: this.getFieldType() == 'aggregate' ? dim.getFieldText() : dim.getHeader(),
            dimension: dim
        });
    },
    afterRender: function() {
        var me = this,
            dim = me.getField(),
            settings = dim.getSettings();
        me.callParent();
        if (Ext.Array.indexOf([
            'leftAxis',
            'topAxis'
        ], me.getFieldType()) >= 0) {
            if (!Ext.isDefined(dim.sortable) || dim.sortable) {
                me.addSortCls(dim.direction);
            }
            if (dim.filter) {
                me.addFilterCls();
            }
        }
        // the custom style we configure it on the textCol since that one is one level deeper
        me.textCol.setStyle(settings.getStyle());
        // but the custom class we configure it on the component itself since it's more flexible this way
        me.addCls(settings.getCls());
    },
    getMenuConfig: function() {
        var fieldType = this.getFieldType();
        if (fieldType == 'leftAxis' || fieldType == 'topAxis') {
            return this.getColMenuConfig();
        }
    },
    addSortCls: function(direction) {
        var me = this;
        if (!me.sortCol) {
            return;
        }
        if (direction === 'ASC' || !direction) {
            me.sortCol.addCls(me.ascSortIconCls);
            me.sortCol.removeCls(me.descSortIconCls);
        } else {
            me.sortCol.addCls(me.descSortIconCls);
            me.sortCol.removeCls(me.ascSortIconCls);
        }
        me.sortCol.addCls(me.btnIconCls);
    },
    removeSortCls: function(direction) {
        var me = this;
        if (!me.sortCol) {
            return;
        }
        if (direction === 'ASC') {
            me.sortCol.removeCls(me.ascSortIconCls);
        } else {
            me.sortCol.removeCls(me.descSortIconCls);
        }
        me.sortCol.removeCls(me.btnIconCls);
    },
    addFilterCls: function() {
        var me = this;
        if (me.filterCol && !me.filterCol.hasCls(me.setFilterIconCls)) {
            me.filterCol.addCls(me.setFilterIconCls);
            me.filterCol.addCls(me.btnIconCls);
        }
    },
    removeFilterCls: function() {
        var me = this;
        if (me.filterCol) {
            me.filterCol.removeCls(me.setFilterIconCls);
            me.filterCol.removeCls(me.btnIconCls);
        }
    },
    getColMenuConfig: function() {
        var me = this,
            items = [],
            labelItems, valueItems, commonItems, i,
            filter = me.getField().filter;
        // check if the dimension is sortable
        items.push({
            text: me.sortAscText,
            direction: 'ASC',
            iconCls: me.ascSortIconCls,
            handler: me.sortMe
        }, {
            text: me.sortDescText,
            direction: 'DESC',
            iconCls: me.descSortIconCls,
            handler: me.sortMe
        }, {
            text: me.sortClearText,
            direction: '',
            disabled: me.getField().sortable === false,
            iconCls: me.clearSortIconCls,
            handler: me.sortMe
        }, {
            xtype: 'menuseparator'
        });
        commonItems = [
            {
                text: me.equalsText,
                operator: '='
            },
            {
                text: me.doesNotEqualText,
                operator: '!='
            },
            {
                xtype: 'menuseparator'
            },
            {
                text: me.greaterThanText,
                operator: '>'
            },
            {
                text: me.greaterThanOrEqualToText,
                operator: '>='
            },
            {
                text: me.lessThanText,
                operator: '<'
            },
            {
                text: me.lessThanOrEqualToText,
                operator: '<='
            },
            {
                xtype: 'menuseparator'
            },
            {
                text: me.betweenText,
                operator: 'between'
            },
            {
                text: me.notBetweenText,
                operator: 'not between'
            }
        ];
        labelItems = Ext.clone(commonItems);
        Ext.Array.insert(labelItems, 3, [
            {
                text: me.beginsWithText,
                operator: 'begins'
            },
            {
                text: me.doesNotBeginWithText,
                operator: 'not begins'
            },
            {
                text: me.endsWithText,
                operator: 'ends'
            },
            {
                text: me.doesNotEndWithText,
                operator: 'not ends'
            },
            {
                xtype: 'menuseparator'
            },
            {
                text: me.containsText,
                operator: 'contains'
            },
            {
                text: me.doesNotContainText,
                operator: 'not contains'
            },
            {
                xtype: 'menuseparator'
            }
        ]);
        for (i = 0; i < labelItems.length; i++) {
            labelItems[i]['checked'] = (filter && filter.type == 'label' && filter.operator == labelItems[i].operator);
        }
        valueItems = Ext.clone(commonItems);
        valueItems.push({
            xtype: 'menuseparator'
        }, {
            text: me.top10Text,
            operator: 'top10'
        });
        for (i = 0; i < valueItems.length; i++) {
            valueItems[i]['checked'] = (filter && filter.type == 'value' && filter.operator == valueItems[i].operator);
        }
        items.push({
            text: Ext.String.format(me.clearFilterText, me.header),
            iconCls: me.clearFilterIconCls,
            disabled: !filter,
            handler: me.onRemoveFilter
        }, {
            text: me.labelFiltersText,
            menu: {
                defaults: {
                    handler: me.onShowFilter,
                    scope: me,
                    xtype: 'menucheckitem',
                    group: 'filterlabel',
                    type: 'label'
                },
                items: labelItems
            }
        }, {
            text: me.valueFiltersText,
            menu: {
                defaults: {
                    handler: me.onShowFilter,
                    scope: me,
                    xtype: 'menucheckitem',
                    group: 'filtervalue',
                    type: 'value'
                },
                items: valueItems
            }
        });
        return {
            defaults: {
                scope: me
            },
            items: items
        };
    },
    sortMe: function(btn) {
        var me = this,
            field = me.getField();
        if (Ext.isEmpty(btn.direction)) {
            //disable sorting
            field.setSortable(false);
            me.removeSortCls(field.getDirection());
        } else {
            field.setSortable(true);
            me.addSortCls(btn.direction);
            field.setDirection(btn.direction);
        }
        me.applyChanges();
    },
    onShowFilter: function(btn) {
        var me = this,
            panel = me.up('pivotconfigpanel'),
            dataAgg = [],
            winCfg = {},
            filter = me.getField().getFilter(),
            values = {
                type: btn.type,
                operator: btn.operator,
                value: (filter ? filter.value : ''),
                from: (filter ? (Ext.isArray(filter.value) ? filter.value[0] : '') : ''),
                to: (filter ? (Ext.isArray(filter.value) ? filter.value[1] : '') : ''),
                caseSensitive: (filter ? filter.caseSensitive : false),
                topSort: (filter ? filter.topSort : false)
            },
            items = panel.getAggregateContainer().items,
            len = items.getCount(),
            win, winClass, data, i, field;
        for (i = 0; i < len; i++) {
            field = items.getAt(i).getField();
            dataAgg.push([
                field.getHeader(),
                field.getId()
            ]);
        }
        if (btn.type == 'label' || (btn.type == 'value' && btn.operator != 'top10')) {
            data = [
                [
                    me.equalsLText,
                    '='
                ],
                [
                    me.doesNotEqualLText,
                    '!='
                ],
                [
                    me.greaterThanLText,
                    '>'
                ],
                [
                    me.greaterThanOrEqualToLText,
                    '>='
                ],
                [
                    me.lessThanLText,
                    '<'
                ],
                [
                    me.lessThanOrEqualToLText,
                    '<='
                ],
                [
                    me.betweenLText,
                    'between'
                ],
                [
                    me.notBetweenLText,
                    'not between'
                ]
            ];
            if (btn.type == 'label') {
                Ext.Array.insert(data, 3, [
                    [
                        me.beginsWithLText,
                        'begins'
                    ],
                    [
                        me.doesNotBeginWithLText,
                        'not begins'
                    ],
                    [
                        me.endsWithLText,
                        'ends'
                    ],
                    [
                        me.doesNotEndWithLText,
                        'not ends'
                    ],
                    [
                        me.containsLText,
                        'contains'
                    ],
                    [
                        me.doesNotContainLText,
                        'not contains'
                    ]
                ]);
                winClass = 'Ext.pivot.plugin.configurator.window.FilterLabel';
            } else {
                winClass = 'Ext.pivot.plugin.configurator.window.FilterValue';
                Ext.apply(values, {
                    dimensionId: (filter ? filter.dimensionId : '')
                });
                winCfg.storeAgg = new Ext.data.ArrayStore({
                    fields: [
                        'text',
                        'value'
                    ],
                    data: dataAgg
                });
            }
            winCfg.store = new Ext.data.ArrayStore({
                fields: [
                    'text',
                    'value'
                ],
                data: data
            });
        } else {
            winClass = 'Ext.pivot.plugin.configurator.window.FilterTop';
            data = [];
            Ext.apply(winCfg, {
                storeTopOrder: new Ext.data.ArrayStore({
                    fields: [
                        'text',
                        'value'
                    ],
                    data: [
                        [
                            me.topOrderTopText,
                            'top'
                        ],
                        [
                            me.topOrderBottomText,
                            'bottom'
                        ]
                    ]
                }),
                storeTopType: new Ext.data.ArrayStore({
                    fields: [
                        'text',
                        'value'
                    ],
                    data: [
                        [
                            me.topTypeItemsText,
                            'items'
                        ],
                        [
                            me.topTypePercentText,
                            'percent'
                        ],
                        [
                            me.topTypeSumText,
                            'sum'
                        ]
                    ]
                }),
                storeAgg: new Ext.data.ArrayStore({
                    fields: [
                        'text',
                        'value'
                    ],
                    data: dataAgg
                })
            });
            Ext.apply(values, {
                operator: 'top10',
                dimensionId: (filter ? filter.dimensionId : ''),
                topType: (filter ? filter.topType : 'items'),
                topOrder: (filter ? filter.topOrder : 'top')
            });
        }
        win = Ext.create(winClass, Ext.apply(winCfg || {}, {
            title: me.header,
            listeners: {
                applysettings: Ext.bind(me.onApplyFilterSettings, me)
            }
        }));
        win.loadSettings(values);
        win.show();
    },
    onApplyFilterSettings: function(win, filter) {
        var me = this;
        win.close();
        me.addFilterCls();
        me.getField().setFilter(filter);
        me.applyChanges();
    },
    onRemoveFilter: function() {
        var me = this;
        me.removeFilterCls();
        me.getField().setFilter(null);
        me.applyChanges();
    },
    /**
     * This is used for firing the 'configchange' event
     *
     */
    applyChanges: function() {
        if (this.ownerCt) {
            this.ownerCt.applyChanges(this);
        }
    }
});

/**
 * This is a container that holds configurator fields.
 */
Ext.define('Ext.pivot.plugin.configurator.Container', {
    extend: 'Ext.panel.Panel',
    requires: [
        'Ext.pivot.plugin.configurator.Column'
    ],
    mixins: [
        'Ext.mixin.FocusableContainer'
    ],
    alias: 'widget.pivotconfigcontainer',
    childEls: [
        'innerCt'
    ],
    handleSorting: false,
    handleFiltering: false,
    position: 'top',
    border: false,
    enableFocusableContainer: true,
    isConfiguratorContainer: true,
    cls: Ext.baseCSSPrefix + 'pivot-grid-config-container-body',
    dockedTopRightCls: Ext.baseCSSPrefix + 'pivot-grid-config-container-body-tr',
    dockedBottomLeftCls: Ext.baseCSSPrefix + 'pivot-grid-config-container-body-bl',
    hintTextCls: Ext.baseCSSPrefix + 'pivot-grid-config-container-hint',
    config: {
        /**
         * @cfg {String} fieldType
         * Possible values:
         *
         * - `all` = the container is the "all fields" area;
         * - `aggregate` = the container is the "values" area;
         * - `leftAxis` = the container is the "row values" area;
         * - `topAxis` = the container is the "column values" area;
         *
         */
        fieldType: 'all',
        dragDropText: '&nbsp;'
    },
    initComponent: function() {
        var me = this;
        if (me.position == 'top' || me.position == 'bottom') {
            Ext.apply(me, {
                style: 'overflow:hidden',
                layout: 'column',
                height: 'auto'
            });
        } else {
            Ext.apply(me, {
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                }
            });
        }
        if (me.position == 'top' || me.position == 'right') {
            me.cls += ' ' + me.dockedTopRightCls;
        } else {
            me.cls += ' ' + me.dockedBottomLeftCls;
        }
        me.callParent(arguments);
    },
    destroy: function() {
        this.infoEl = Ext.destroy(this.infoEl);
        this.callParent();
    },
    afterRender: function() {
        var me = this;
        me.callParent();
        me.infoEl = me.innerCt.createChild({
            cls: me.hintTextCls,
            html: me.getDragDropText()
        });
        me.setInfoElVisibility();
    },
    /**
     * This is used for firing the 'configchange' event
     *
     */
    applyChanges: function(field, force) {
        if (this.getFieldType() != 'all' || force === true) {
            this.fireEvent('configchange', field || this);
        }
    },
    /**
     * This is used for adding a new config field to this container.
     * @return {Ext.pivot.plugin.configurator.Column} The new configurator field.
     *
     * @private
     */
    addField: function(config, pos, notify) {
        var me = this,
            cfg = {
                xtype: 'pivotconfigfield',
                field: config,
                header: config.getHeader(),
                // These are drag/droppable, so need
                // panning disabled.
                touchAction: {
                    panX: false,
                    panY: false
                }
            },
            newCol;
        config.isAggregate = (me.getFieldType() === 'aggregate');
        if (pos !== -1) {
            newCol = me.insert(pos, cfg);
        } else {
            newCol = me.add(cfg);
        }
        if (notify === true) {
            me.applyChanges(newCol);
        }
        return newCol;
    },
    onAdd: function(column) {
        this.setInfoElVisibility();
        column.setFieldType(this.getFieldType());
        this.callParent(arguments);
    },
    onRemove: function() {
        this.setInfoElVisibility();
    },
    /**
     * This is used for moving a field inside this container.
     *
     * @private
     */
    moveField: function(from, to, position) {
        var me = this;
        if (Ext.isString(from)) {
            from = me.items.getByKey(from);
        }
        if (Ext.isString(to)) {
            to = me.items.getByKey(to);
        }
        if (from != to) {
            me['move' + Ext.String.capitalize(position)](from, to);
            me.applyChanges(from);
        }
    },
    /**
     * This is used to remove a field inside this container and apply changes
     *
     * @param {Ext.pivot.plugin.configurator.Column} field
     *
     * @private
     */
    removeField: function(field) {
        this.remove(field);
        this.applyChanges();
    },
    /**
     * The container has an info text displayed inside. This function makes it visible or hidden.
     *
     * @private
     */
    setInfoElVisibility: function() {
        var el = this.infoEl;
        if (!el) {
            return;
        }
        if (this.items.getCount() == 0) {
            el.show();
        } else {
            el.hide();
        }
    }
});

/**
 * This class is used for managing the configurator's panel drag zone.
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.DragZone', {
    extend: 'Ext.dd.DragZone',
    configColumnSelector: '.' + Ext.baseCSSPrefix + 'pivot-grid-config-column',
    configColumnInnerSelector: '.' + Ext.baseCSSPrefix + 'pivot-grid-config-column-inner',
    maxProxyWidth: 120,
    dragging: false,
    constructor: function(panel) {
        this.panel = panel;
        this.ddGroup = this.getDDGroup();
        this.callParent([
            panel.el
        ]);
    },
    getDDGroup: function() {
        // return the column header dd group so we can allow column droping inside the grouping panel
        return 'configurator-' + this.panel.id;
    },
    getDragData: function(e) {
        var header, headerCmp, ddel, field;
        if (e.getTarget(this.configColumnInnerSelector)) {
            header = e.getTarget(this.configColumnSelector);
            if (header) {
                headerCmp = Ext.getCmp(header.id);
                headerCmp.focus();
                field = headerCmp.getField();
                if (!this.panel.dragging && field && !field.getSettings().isFixed(headerCmp.ownerCt)) {
                    ddel = document.createElement('div');
                    ddel.innerHTML = headerCmp.header;
                    return {
                        ddel: ddel,
                        header: headerCmp
                    };
                }
            }
        }
        return false;
    },
    onBeforeDrag: function() {
        return !(this.panel.dragging || this.disabled);
    },
    onInitDrag: function() {
        this.panel.dragging = true;
        this.callParent(arguments);
    },
    onDragDrop: function() {
        this.panel.dragging = false;
        this.callParent(arguments);
    },
    afterRepair: function() {
        this.callParent();
        this.panel.dragging = false;
    },
    getRepairXY: function() {
        return this.dragData.header.el.getXY();
    },
    disable: function() {
        this.disabled = true;
    },
    enable: function() {
        this.disabled = false;
    }
});

/**
 * This class is used for managing the configurator's panel drop zone.
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.DropZone', {
    extend: 'Ext.dd.DropZone',
    proxyOffsets: [
        -4,
        -9
    ],
    configPanelCls: Ext.baseCSSPrefix + 'pivot-grid-config-container-body',
    configColumnCls: Ext.baseCSSPrefix + 'pivot-grid-config-column',
    constructor: function(panel) {
        this.panel = panel;
        this.ddGroup = this.getDDGroup();
        this.callParent([
            panel.id
        ]);
    },
    disable: function() {
        this.disabled = true;
    },
    enable: function() {
        this.disabled = false;
    },
    getDDGroup: function() {
        // return the column header dd group so we can allow column droping inside the grouping panel
        return 'configurator-' + this.panel.id;
    },
    getTargetFromEvent: function(e) {
        return e.getTarget('.' + this.configColumnCls) || e.getTarget('.' + this.configPanelCls);
    },
    getTopIndicator: function() {
        if (!this.topIndicator) {
            this.self.prototype.topIndicator = Ext.DomHelper.append(Ext.getBody(), {
                cls: 'col-move-top ' + Ext.baseCSSPrefix + 'col-move-top',
                html: "&#160;"
            }, true);
            this.self.prototype.indicatorXOffset = Math.floor((this.topIndicator.dom.offsetWidth + 1) / 2);
        }
        return this.topIndicator;
    },
    getBottomIndicator: function() {
        if (!this.bottomIndicator) {
            this.self.prototype.bottomIndicator = Ext.DomHelper.append(Ext.getBody(), {
                cls: 'col-move-bottom ' + Ext.baseCSSPrefix + 'col-move-bottom',
                html: "&#160;"
            }, true);
        }
        return this.bottomIndicator;
    },
    getLocation: function(data, t, e) {
        var x = e.getXY()[0],
            target = Ext.getCmp(t.id),
            region, pos;
        if (target instanceof Ext.pivot.plugin.configurator.Container) {
            // that means that the column is dragged above the grouping panel so find out if there are any columns already
            if (target.items.getCount() > 0) {
                // now fetch the position of the last item
                region = Ext.fly(target.items.last().el).getRegion();
            } else {
                region = new Ext.util.Region(0, 1000000, 0, 0);
            }
        } else {
            region = Ext.fly(t).getRegion();
        }
        if ((region.right - x) <= (region.right - region.left) / 2) {
            pos = "after";
        } else {
            pos = "before";
        }
        return data.dropLocation = {
            pos: pos,
            header: Ext.getCmp(t.id),
            node: t
        };
    },
    positionIndicator: function(data, node, e) {
        var me = this,
            dragHeader = data.header,
            dropLocation = me.getLocation(data, node, e),
            targetHeader = dropLocation.header,
            pos = dropLocation.pos,
            nextHd, prevHd, topIndicator, bottomIndicator, topAnchor, bottomAnchor, topXY, bottomXY, headerCtEl, minX, maxX, allDropZones, ln, i, dropZone;
        // Avoid expensive CQ lookups and DOM calculations if dropPosition has not changed
        if (targetHeader === me.lastTargetHeader && pos === me.lastDropPos) {
            return;
        }
        nextHd = dragHeader.nextSibling('pivotconfigfield:not([hidden])');
        prevHd = dragHeader.previousSibling('pivotconfigfield:not([hidden])');
        me.lastTargetHeader = targetHeader;
        me.lastDropPos = pos;
        if ((dragHeader !== targetHeader) && ((pos === "before" && nextHd !== targetHeader) || (pos === "after" && prevHd !== targetHeader)) && !targetHeader.isDescendantOf(dragHeader)) {
            // As we move in between different DropZones that are in the same
            // group (such as the case when in a locked grid), invalidateDrop
            // on the other dropZones.
            allDropZones = Ext.dd.DragDropManager.getRelated(me);
            ln = allDropZones.length;
            i = 0;
            for (; i < ln; i++) {
                dropZone = allDropZones[i];
                if (dropZone !== me && dropZone.invalidateDrop) {
                    dropZone.invalidateDrop();
                }
            }
            me.valid = true;
            topIndicator = me.getTopIndicator();
            bottomIndicator = me.getBottomIndicator();
            if (pos === 'before') {
                topAnchor = 'bc-tl';
                bottomAnchor = 'tc-bl';
            } else {
                topAnchor = 'bc-tr';
                bottomAnchor = 'tc-br';
            }
            // Calculate arrow positions. Offset them to align exactly with column border line
            if (targetHeader.isConfiguratorContainer && targetHeader.items.getCount() > 0) {
                // if dropping zone is the container then align the rows to the last column item
                topXY = topIndicator.getAlignToXY(targetHeader.items.last().el, topAnchor);
                bottomXY = bottomIndicator.getAlignToXY(targetHeader.items.last().el, bottomAnchor);
            } else {
                topXY = topIndicator.getAlignToXY(targetHeader.el, topAnchor);
                bottomXY = bottomIndicator.getAlignToXY(targetHeader.el, bottomAnchor);
            }
            // constrain the indicators to the viewable section
            headerCtEl = me.panel.el;
            minX = headerCtEl.getX() - me.indicatorXOffset;
            maxX = headerCtEl.getX() + headerCtEl.getWidth();
            topXY[0] = Ext.Number.constrain(topXY[0], minX, maxX);
            bottomXY[0] = Ext.Number.constrain(bottomXY[0], minX, maxX);
            // position and show indicators
            topIndicator.setXY(topXY);
            bottomIndicator.setXY(bottomXY);
            topIndicator.show();
            bottomIndicator.show();
        } else // invalidate drop operation and hide indicators
        {
            me.invalidateDrop();
        }
    },
    invalidateDrop: function() {
        this.valid = false;
        this.hideIndicators();
    },
    onNodeOver: function(node, dragZone, e, data) {
        var me = this,
            doPosition = true,
            dragColumn = data.header,
            target = me.getLocation(data, node, e);
        if (data.header.el.dom === node) {
            doPosition = false;
        }
        if (target && target.header && dragColumn) {
            doPosition = doPosition && dragColumn.getField().getSettings().isAllowed(target.header) && me.panel.isAllowed(target.header, dragColumn);
        }
        if (doPosition) {
            me.positionIndicator(data, node, e);
        } else {
            me.valid = false;
        }
        return me.valid ? me.dropAllowed : me.dropNotAllowed;
    },
    hideIndicators: function() {
        var me = this;
        me.getTopIndicator().hide();
        me.getBottomIndicator().hide();
        me.lastTargetHeader = me.lastDropPos = null;
    },
    onNodeOut: function() {
        this.hideIndicators();
    },
    onNodeDrop: function(node, dragZone, e, data) {
        var me = this,
            dragColumn = data.header,
            dropLocation = data.dropLocation;
        if (me.valid && dropLocation) {
            me.panel.dragDropField(dropLocation.header, dragColumn, dropLocation.pos);
        }
    }
});

/**
 * This is the window that allows pivot matrix settings configuration.
 */
Ext.define('Ext.pivot.plugin.configurator.window.Settings', {
    extend: 'Ext.pivot.plugin.configurator.window.Window',
    requires: [
        'Ext.form.field.Display'
    ],
    title: 'Settings',
    layoutText: 'Layout',
    outlineLayoutText: 'Outline',
    compactLayoutText: 'Compact',
    tabularLayoutText: 'Tabular',
    firstPositionText: 'First',
    hidePositionText: 'Hide',
    lastPositionText: 'Last',
    rowSubTotalPositionText: 'Row subtotal position',
    columnSubTotalPositionText: 'Column subtotal position',
    rowTotalPositionText: 'Row total position',
    columnTotalPositionText: 'Column total position',
    showZeroAsBlankText: 'Show zero as blank',
    yesText: 'Yes',
    noText: 'No',
    getSettingsForm: function() {
        var me = this,
            storePositions = {
                type: 'array',
                fields: [
                    'text',
                    'value'
                ],
                data: [
                    [
                        me.firstPositionText,
                        'first'
                    ],
                    [
                        me.hidePositionText,
                        'none'
                    ],
                    [
                        me.lastPositionText,
                        'last'
                    ]
                ]
            };
        return Ext.apply(me.callParent(arguments), {
            items: [
                {
                    xtype: 'combo',
                    fieldLabel: me.layoutText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'viewLayoutType',
                    store: {
                        type: 'array',
                        fields: [
                            'text',
                            'value'
                        ],
                        data: [
                            [
                                me.outlineLayoutText,
                                'outline'
                            ],
                            [
                                me.compactLayoutText,
                                'compact'
                            ],
                            [
                                me.tabularLayoutText,
                                'tabular'
                            ]
                        ]
                    }
                },
                {
                    xtype: 'combo',
                    fieldLabel: me.rowSubTotalPositionText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'rowSubTotalsPosition',
                    store: storePositions
                },
                {
                    xtype: 'combo',
                    fieldLabel: me.columnSubTotalPositionText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'colSubTotalsPosition',
                    store: storePositions
                },
                {
                    xtype: 'combo',
                    fieldLabel: me.rowTotalPositionText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'rowGrandTotalsPosition',
                    store: storePositions
                },
                {
                    xtype: 'combo',
                    fieldLabel: me.columnTotalPositionText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'colGrandTotalsPosition',
                    store: storePositions
                },
                {
                    xtype: 'combo',
                    fieldLabel: me.showZeroAsBlankText,
                    editable: false,
                    queryMode: 'local',
                    valueField: 'value',
                    name: 'showZeroAsBlank',
                    store: {
                        type: 'array',
                        fields: [
                            'text',
                            'value'
                        ],
                        data: [
                            [
                                me.yesText,
                                true
                            ],
                            [
                                me.noText,
                                false
                            ]
                        ]
                    }
                }
            ]
        });
    }
});

/**
 * This class implements the configurator panel.
 */
Ext.define('Ext.pivot.plugin.configurator.Panel', {
    extend: 'Ext.panel.Panel',
    requires: [
        'Ext.pivot.plugin.configurator.Container',
        'Ext.pivot.plugin.configurator.DragZone',
        'Ext.pivot.plugin.configurator.DropZone',
        'Ext.layout.container.HBox',
        'Ext.layout.container.VBox',
        'Ext.pivot.plugin.configurator.window.Settings'
    ],
    mixins: [
        'Ext.mixin.FocusableContainer'
    ],
    alias: 'widget.pivotconfigpanel',
    weight: 50,
    // the column header container has a weight of 100 so we want to dock it before that.
    defaultMinHeight: 70,
    defaultMinWidth: 250,
    dock: 'right',
    header: false,
    title: 'Configurator',
    collapsible: true,
    collapseMode: 'placeholder',
    /**
     * @cfg {String} panelAllFieldsText Text displayed in the container reserved for all available fields
     * when docked to top or bottom.
     */
    panelAllFieldsText: 'Drop Unused Fields Here',
    /**
     * @cfg {String} panelAllFieldsTitle Text displayed in the container reserved for all available fields
     * when docked to left or right.
     */
    panelAllFieldsTitle: 'All fields',
    /**
     * @cfg {String} panelTopFieldsText Text displayed in the container reserved for all top axis fields
     * when docked to top or bottom.
     */
    panelTopFieldsText: 'Drop Column Fields Here',
    /**
     * @cfg {String} panelTopFieldsTitle Text displayed in the container reserved for all top axis fields
     * when docked to left or right.
     */
    panelTopFieldsTitle: 'Column labels',
    /**
     * @cfg {String} panelLeftFieldsText Text displayed in the container reserved for all left axis fields
     * when docked to top or bottom.
     */
    panelLeftFieldsText: 'Drop Row Fields Here',
    /**
     * @cfg {String} panelLeftFieldsTitle Text displayed in the container reserved for all left axis fields
     * when docked to left or right.
     */
    panelLeftFieldsTitle: 'Row labels',
    /**
     * @cfg {String} panelAggFieldsText Text displayed in the container reserved for all aggregate fields
     * when docked to top or bottom.
     */
    panelAggFieldsText: 'Drop Agg Fields Here',
    /**
     * @cfg {String} panelAggFieldsTitle Text displayed in the container reserved for all aggregate fields
     * when docked to left or right.
     */
    panelAggFieldsTitle: 'Values',
    /**
     * @cfg {String} addToText Text displayed in the field menu
     */
    addToText: 'Add to {0}',
    /**
     * @cfg {String} moveToText Text displayed in the field menu
     */
    moveToText: 'Move to {0}',
    /**
     * @cfg {String} removeFieldText Text displayed in the field menu
     */
    removeFieldText: 'Remove field',
    /**
     * @cfg {String} moveUpText Text displayed in the field menu
     */
    moveUpText: 'Move up',
    /**
     * @cfg {String} moveDownText Text displayed in the field menu
     */
    moveDownText: 'Move down',
    /**
     * @cfg {String} moveBeginText Text displayed in the field menu
     */
    moveBeginText: 'Move to beginning',
    /**
     * @cfg {String} moveEndText Text displayed in the field menu
     */
    moveEndText: 'Move to end',
    /**
     * @cfg {String} fieldSettingsText Text displayed in the field menu
     */
    fieldSettingsText: 'Field settings',
    headerContainerCls: Ext.baseCSSPrefix + 'pivot-grid-config-container-header',
    keyEventRe: /^key/,
    config: {
        fields: [],
        refreshDelay: 300,
        pivot: null
    },
    initComponent: function() {
        var me = this,
            listeners = {
                configchange: me.applyChanges,
                scope: me
            };
        Ext.apply(me, Ext.Array.indexOf([
            'top',
            'bottom'
        ], me.dock) >= 0 ? me.getHorizontalConfig() : me.getVerticalConfig());
        me.callParent(arguments);
        me.getAllFieldsContainer().on(listeners);
        me.getLeftAxisContainer().on(listeners);
        me.getTopAxisContainer().on(listeners);
        me.getAggregateContainer().on(listeners);
        me.pivotListeners = me.getPivot().getMatrix().on({
            done: me.onPivotDone,
            scope: me,
            destroyable: true
        });
        me.task = new Ext.util.DelayedTask(me.reconfigurePivot, me);
    },
    destroy: function() {
        var me = this,
            toDestroy = [
                'relayers',
                'pivotListeners',
                'menu',
                'dragZone',
                'dropZone'
            ],
            length = toDestroy.length,
            i;
        for (i = 0; i < length; i++) {
            Ext.destroy(me[toDestroy[i]]);
            me[toDestroy[i]] = null;
        }
        me.task.cancel();
        me.task = me.lastFocusedField = null;
        me.callParent();
    },
    enable: function() {
        var me = this;
        if (me.rendered) {
            me.dragZone.enable();
            me.dropZone.enable();
            me.initPivotFields();
        }
        me.show();
    },
    disable: function() {
        var me = this;
        if (me.rendered) {
            me.dragZone.disable();
            me.dropZone.disable();
        }
        me.hide();
    },
    afterRender: function() {
        var me = this,
            el = me.getEl();
        me.callParent(arguments);
        me.mon(el, {
            scope: me,
            delegate: '.' + Ext.baseCSSPrefix + 'pivot-grid-config-column',
            click: me.handleEvent,
            keypress: me.handleEvent
        });
        me.dragZone = new Ext.pivot.plugin.configurator.DragZone(me);
        me.dropZone = new Ext.pivot.plugin.configurator.DropZone(me);
        el.unselectable();
    },
    handleEvent: function(e) {
        var me = this,
            isKeyEvent = me.keyEventRe.test(e.type),
            pivot = me.getPivot(),
            fly, cmp, menuCfg, options;
        if ((isKeyEvent && e.getKey() === e.SPACE) || (e.button === 0)) {
            fly = Ext.fly(e.target);
            if (fly && (cmp = fly.component)) {
                e.stopEvent();
                cmp.focus();
                Ext.destroy(me.menu);
                menuCfg = me.getMenuConfig(cmp);
                if (menuCfg) {
                    me.menu = new Ext.menu.Menu(menuCfg);
                    options = {
                        menu: me.menu,
                        field: cmp.getField(),
                        container: cmp.getFieldType()
                    };
                    if (pivot.fireEvent('beforeshowconfigfieldmenu', me, options) !== false) {
                        me.menu.showBy(cmp);
                        me.menu.focus();
                        pivot.fireEvent('showconfigfieldmenu', me, options);
                    } else {
                        Ext.destroy(me.menu);
                    }
                }
            }
        }
    },
    getPanelConfigHeader: function(config) {
        return Ext.apply({
            xtype: 'header',
            // make it look like a panel header but with a different padding
            baseCls: Ext.baseCSSPrefix + 'panel-header',
            cls: this.headerContainerCls,
            border: 1,
            width: 100
        }, config || {});
    },
    getHorizontalConfig: function() {
        var me = this,
            tools = [
                {
                    type: 'gear',
                    handler: me.showSettings,
                    scope: me
                }
            ];
        if (me.collapsible) {
            tools.push({
                type: me.dock == 'top' ? 'up' : 'down',
                handler: me.collapseMe,
                scope: me
            });
        }
        return {
            minHeight: me.defaultMinHeight,
            headerPosition: me.dock == 'top' ? 'bottom' : 'top',
            collapseDirection: me.dock,
            defaults: {
                xtype: 'container',
                layout: {
                    type: 'hbox',
                    align: 'stretchmax'
                },
                minHeight: me.defaultMinHeight / 3
            },
            items: [
                {
                    items: [
                        me.getPanelConfigHeader({
                            title: me.panelAllFieldsTitle,
                            tools: tools
                        }),
                        {
                            itemId: 'fieldsCt',
                            xtype: 'pivotconfigcontainer',
                            fieldType: 'all',
                            dragDropText: me.panelAllFieldsText,
                            position: me.dock,
                            flex: 1
                        }
                    ]
                },
                {
                    items: [
                        me.getPanelConfigHeader({
                            title: me.panelAggFieldsTitle
                        }),
                        {
                            itemId: 'fieldsAggCt',
                            xtype: 'pivotconfigcontainer',
                            fieldType: 'aggregate',
                            dragDropText: me.panelAggFieldsText,
                            position: me.dock,
                            flex: 1
                        }
                    ]
                },
                {
                    defaults: {
                        xtype: 'pivotconfigcontainer',
                        minHeight: me.defaultMinHeight / 3,
                        position: me.dock
                    },
                    items: [
                        me.getPanelConfigHeader({
                            title: me.panelLeftFieldsTitle
                        }),
                        {
                            itemId: 'fieldsLeftCt',
                            fieldType: 'leftAxis',
                            dragDropText: me.panelLeftFieldsText,
                            flex: 1
                        },
                        me.getPanelConfigHeader({
                            title: me.panelTopFieldsTitle
                        }),
                        {
                            itemId: 'fieldsTopCt',
                            fieldType: 'topAxis',
                            dragDropText: me.panelTopFieldsText,
                            flex: 1
                        }
                    ]
                }
            ]
        };
    },
    getVerticalConfig: function() {
        var me = this,
            tools = [
                {
                    type: 'gear',
                    handler: me.showSettings,
                    scope: me
                }
            ];
        if (me.collapsible) {
            tools.push({
                type: me.dock,
                handler: me.collapseMe,
                scope: me
            });
        }
        return {
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            width: me.defaultMinWidth,
            minWidth: me.defaultMinWidth,
            headerPosition: me.dock == 'right' ? 'left' : 'right',
            collapseDirection: me.dock,
            defaults: {
                flex: 1
            },
            items: [
                {
                    itemId: 'fieldsCt',
                    xtype: 'pivotconfigcontainer',
                    position: me.dock,
                    title: me.panelAllFieldsTitle,
                    fieldType: 'all',
                    dragDropText: me.panelAllFieldsText,
                    autoScroll: true,
                    header: {
                        cls: me.headerContainerCls
                    },
                    tools: tools
                },
                {
                    xtype: 'container',
                    defaults: {
                        xtype: 'pivotconfigcontainer',
                        flex: 1,
                        autoScroll: true,
                        position: me.dock,
                        header: {
                            cls: me.headerContainerCls
                        }
                    },
                    layout: {
                        type: 'vbox',
                        align: 'stretch'
                    },
                    items: [
                        {
                            itemId: 'fieldsAggCt',
                            title: me.panelAggFieldsTitle,
                            fieldType: 'aggregate',
                            dragDropText: me.panelAggFieldsText
                        },
                        {
                            itemId: 'fieldsLeftCt',
                            title: me.panelLeftFieldsTitle,
                            fieldType: 'leftAxis',
                            dragDropText: me.panelLeftFieldsText
                        },
                        {
                            itemId: 'fieldsTopCt',
                            title: me.panelTopFieldsTitle,
                            fieldType: 'topAxis',
                            dragDropText: me.panelTopFieldsText
                        }
                    ]
                }
            ]
        };
    },
    /**
     * Returns the container that stores all unused fields.
     *
     * @return {Ext.pivot.plugin.configurator.Container}
     */
    getAllFieldsContainer: function() {
        return this.down('#fieldsCt');
    },
    /**
     * Returns the header of the container that stores all unused fields.
     *
     * @return {Ext.panel.Header}
     */
    getAllFieldsHeader: function() {
        var dock = this.dock,
            ct = this.getAllFieldsContainer();
        return (dock === 'top' || dock === 'bottom') ? ct.prev() : ct.getHeader();
    },
    /**
     * Set visibility of the "All fields" header and container
     * @param {Boolean} visible
     */
    setAllFieldsContainerVisible: function(visible) {
        this.getAllFieldsContainer().setVisible(visible);
        this.getAllFieldsHeader().setVisible(visible);
    },
    /**
     * Returns the container that stores all fields configured on the left axis.
     *
     * @return {Ext.pivot.plugin.configurator.Container}
     */
    getLeftAxisContainer: function() {
        return this.down('#fieldsLeftCt');
    },
    /**
     * Returns the header of the container that stores all fields configured on the left axis.
     *
     * @return {Ext.panel.Header}
     */
    getLeftAxisHeader: function() {
        var dock = this.dock,
            ct = this.getLeftAxisContainer();
        return (dock === 'top' || dock === 'bottom') ? ct.prev() : ct.getHeader();
    },
    /**
     * Set visibility of the "Row labels" header and container
     * @param {Boolean} visible
     */
    setLeftAxisContainerVisible: function(visible) {
        this.getLeftAxisContainer().setVisible(visible);
        this.getLeftAxisHeader().setVisible(visible);
    },
    /**
     * Returns the container that stores all fields configured on the top axis.
     *
     * @return {Ext.pivot.plugin.configurator.Container}
     */
    getTopAxisContainer: function() {
        return this.down('#fieldsTopCt');
    },
    /**
     * Returns the header of the container that stores all fields configured on the top axis.
     *
     * @return {Ext.panel.Header}
     */
    getTopAxisHeader: function() {
        var dock = this.dock,
            ct = this.getTopAxisContainer();
        return (dock === 'top' || dock === 'bottom') ? ct.prev() : ct.getHeader();
    },
    /**
     * Set visibility of the "Column labels" header and container
     * @param {Boolean} visible
     */
    setTopAxisContainerVisible: function(visible) {
        this.getTopAxisContainer().setVisible(visible);
        this.getTopAxisHeader().setVisible(visible);
    },
    /**
     * Returns the container that stores all fields configured on the aggregate.
     *
     * @return {Ext.pivot.plugin.configurator.Container}
     */
    getAggregateContainer: function() {
        return this.down('#fieldsAggCt');
    },
    /**
     * Returns the header of the container that stores all fields configured on the aggregate.
     *
     * @return {Ext.panel.Header}
     */
    getAggregateHeader: function() {
        var dock = this.dock,
            ct = this.getAggregateContainer();
        return (dock === 'top' || dock === 'bottom') ? ct.prev() : ct.getHeader();
    },
    /**
     * Set visibility of the "Values" header and container
     * @param {Boolean} visible
     */
    setAggregateContainerVisible: function(visible) {
        this.getAggregateContainer().setVisible(visible);
        this.getAggregateHeader().setVisible(visible);
    },
    /**
     * Apply configurator changes to the pivot component.
     *
     * This function will trigger the delayed task which is actually reconfiguring the pivot component
     * with the new configuration.
     *
     */
    applyChanges: function(field) {
        var me = this;
        if (me.disabled) {
            // if the plugin is disabled don't do anything
            return;
        }
        if (field) {
            me.lastFocusedField = field;
        }
        me.task.delay(me.getRefreshDelay());
    },
    collapseMe: function() {
        this.collapse(this.dock);
    },
    showSettings: function() {
        var pivot = this.getPivot(),
            win = new Ext.pivot.plugin.configurator.window.Settings({
                listeners: {
                    applysettings: Ext.bind(this.applyPivotSettings, this)
                }
            }),
            settings = pivot.getMatrix().serialize();
        delete (settings.leftAxis);
        delete (settings.topAxis);
        delete (settings.aggregate);
        if (pivot.fireEvent('beforeshowpivotsettings', this, {
            container: win,
            settings: settings
        }) !== false) {
            win.loadSettings(settings);
            win.show();
            pivot.fireEvent('showpivotsettings', this, {
                container: win,
                settings: settings
            });
        } else {
            Ext.destroy(win);
        }
    },
    applyPivotSettings: function(win, settings) {
        var pivot = this.getPivot();
        if (pivot.fireEvent('beforeapplypivotsettings', this, {
            container: win,
            settings: settings
        }) !== false) {
            pivot.fireEvent('applypivotsettings', this, {
                container: win,
                settings: settings
            });
            pivot.getMatrix().reconfigure(settings);
        } else {
            return false;
        }
    },
    /**
     * This function is used to retrieve all configured fields in a fields container.
     *
     * @private
     */
    getFieldsFromContainer: function(ct, justConfigs) {
        var fields = [],
            len = ct.items.getCount(),
            i, item;
        for (i = 0; i < len; i++) {
            item = ct.items.getAt(i);
            fields.push(justConfigs === true ? item.getField().getConfiguration() : item.getField());
        }
        return fields;
    },
    /**
     * Initialize all container fields fetching the configuration from the pivot grid.
     *
     * @private
     */
    initPivotFields: function() {
        var me = this,
            matrix = me.getPivot().getMatrix(),
            fieldsAllCt = me.getAllFieldsContainer(),
            fieldsLeftCt = me.getLeftAxisContainer(),
            fieldsTopCt = me.getTopAxisContainer(),
            fieldsAggCt = me.getAggregateContainer(),
            fieldsTop, fieldsLeft, fieldsAgg, fields;
        fields = me.getFields().clone();
        Ext.suspendLayouts();
        // remove all previously created columns
        fieldsAllCt.removeAll();
        fieldsTopCt.removeAll();
        fieldsLeftCt.removeAll();
        fieldsAggCt.removeAll();
        fieldsTop = me.getConfigFields(matrix.topAxis.dimensions.getRange());
        fieldsLeft = me.getConfigFields(matrix.leftAxis.dimensions.getRange());
        fieldsAgg = me.getConfigFields(matrix.aggregate.getRange());
        // the "All fields" will always contain all available fields (both defined on the plugin and existing in the matrix configuration)
        me.addFieldsToConfigurator(fields.getRange(), fieldsAllCt);
        me.addFieldsToConfigurator(fieldsTop, fieldsTopCt);
        me.addFieldsToConfigurator(fieldsLeft, fieldsLeftCt);
        me.addFieldsToConfigurator(fieldsAgg, fieldsAggCt);
        Ext.resumeLayouts(true);
    },
    /**
     * Easy function for assigning fields to a container.
     *
     * @private
     */
    addFieldsToConfigurator: function(fields, fieldsCt) {
        var len = fields.length,
            i;
        for (i = 0; i < len; i++) {
            fieldsCt.addField(fields[i], -1);
        }
    },
    /**
     * Build the fields array for each container by parsing all given fields or from the pivot config.
     *
     * @private
     */
    getConfigFields: function(items) {
        var len = items.length,
            fields = this.getFields(),
            list = [],
            i, field, item;
        for (i = 0; i < len; i++) {
            item = items[i];
            field = fields.byDataIndex.get(item.dataIndex);
            if (field) {
                // we need to clone the field that includes all constraints
                // and apply the configs from the original field
                field = field.clone();
                field.setConfig(item.getInitialConfig());
                list.push(field);
            }
        }
        return list;
    },
    getMenuConfig: function(field) {
        var me = this,
            fieldType = field.getFieldType(),
            items = [],
            menu = field.getMenuConfig() || {},
            container = field.up('pivotconfigcontainer'),
            siblings = container.items.getCount(),
            fieldIdx = container.items.indexOf(field),
            dimension = field.getField(),
            settings = dimension.getSettings(),
            fieldsLeftCt = me.getLeftAxisContainer(),
            fieldsTopCt = me.getTopAxisContainer(),
            fieldsAggCt = me.getAggregateContainer(),
            titleLeft = me.getLeftAxisHeader().getTitle().getText(),
            titleTop = me.getTopAxisHeader().getTitle().getText(),
            titleAgg = me.getAggregateHeader().getTitle().getText();
        menu.items = menu.items || [];
        if (fieldType == 'all') {
            items.push({
                text: Ext.String.format(me.addToText, titleLeft),
                disabled: !settings.isAllowed(fieldsLeftCt),
                handler: Ext.bind(me.dragDropField, me, [
                    fieldsLeftCt,
                    field,
                    'after'
                ]),
                hidden: fieldsLeftCt.isHidden()
            }, {
                text: Ext.String.format(me.addToText, titleTop),
                disabled: !settings.isAllowed(fieldsTopCt),
                handler: Ext.bind(me.dragDropField, me, [
                    fieldsTopCt,
                    field,
                    'after'
                ]),
                hidden: fieldsTopCt.isHidden()
            }, {
                text: Ext.String.format(me.addToText, titleAgg),
                disabled: !settings.isAllowed(fieldsAggCt),
                handler: Ext.bind(me.dragDropField, me, [
                    fieldsAggCt,
                    field,
                    'after'
                ]),
                hidden: fieldsAggCt.isHidden()
            });
        } else {
            items.push({
                text: me.moveUpText,
                disabled: (siblings == 1 || fieldIdx == 0),
                handler: Ext.bind(me.dragDropField, me, [
                    field.previousSibling(),
                    field,
                    'before'
                ])
            }, {
                text: me.moveDownText,
                disabled: (siblings == 1 || fieldIdx == siblings - 1),
                handler: Ext.bind(me.dragDropField, me, [
                    field.nextSibling(),
                    field,
                    'after'
                ])
            }, {
                text: me.moveBeginText,
                disabled: (siblings == 1 || fieldIdx == 0),
                handler: Ext.bind(me.dragDropField, me, [
                    container.items.first(),
                    field,
                    'before'
                ])
            }, {
                text: me.moveEndText,
                disabled: (siblings == 1 || fieldIdx == siblings - 1),
                handler: Ext.bind(me.dragDropField, me, [
                    container.items.last(),
                    field,
                    'after'
                ])
            }, {
                xtype: 'menuseparator'
            }, {
                text: Ext.String.format(me.moveToText, me.panelLeftFieldsTitle),
                disabled: (fieldType == 'leftAxis' || !settings.isAllowed(fieldsLeftCt) || settings.isFixed(container)),
                handler: Ext.bind(me.dragDropField, me, [
                    fieldsLeftCt,
                    field,
                    'after'
                ])
            }, {
                text: Ext.String.format(me.moveToText, me.panelTopFieldsTitle),
                disabled: (fieldType == 'topAxis' || !settings.isAllowed(fieldsTopCt) || settings.isFixed(container)),
                handler: Ext.bind(me.dragDropField, me, [
                    fieldsTopCt,
                    field,
                    'after'
                ])
            }, {
                text: Ext.String.format(me.moveToText, me.panelAggFieldsTitle),
                disabled: (fieldType == 'aggregate' || !settings.isAllowed(fieldsAggCt) || settings.isFixed(container)),
                handler: Ext.bind(me.dragDropField, me, [
                    fieldsAggCt,
                    field,
                    'after'
                ])
            }, {
                xtype: 'menuseparator'
            }, {
                text: me.removeFieldText,
                disabled: settings.isFixed(container),
                handler: Ext.bind(me.dragDropField, me, [
                    me.getAllFieldsContainer(),
                    field,
                    'after'
                ])
            });
        }
        if (fieldType == 'aggregate') {
            items.push({
                xtype: 'menuseparator'
            }, {
                text: me.fieldSettingsText,
                handler: Ext.bind(me.openFieldSettings, me, [
                    field
                ])
            });
        }
        if (menu.items.length) {
            items.push({
                xtype: 'menuseparator'
            });
        }
        Ext.Array.insert(menu.items, 0, items);
        return Ext.apply({
            ownerCmp: me,
            floating: true
        }, menu);
    },
    openFieldSettings: function(field) {
        var pivot = this.getPivot(),
            win = new Ext.pivot.plugin.configurator.window.FieldSettings({
                field: field.getField(),
                listeners: {
                    applysettings: Ext.bind(this.applyFieldSettings, this, [
                        field
                    ], 0)
                }
            }),
            settings = field.getField().getConfig();
        if (pivot.fireEvent('beforeshowconfigfieldsettings', this, {
            container: win,
            settings: settings
        }) !== false) {
            win.loadSettings(settings);
            win.show();
            pivot.fireEvent('showconfigfieldsettings', this, {
                container: win,
                settings: settings
            });
        } else {
            Ext.destroy(win);
        }
    },
    applyFieldSettings: function(field, win, settings) {
        var pivot = this.getPivot(),
            fieldCfg = field.getField();
        if (pivot.fireEvent('beforeapplyconfigfieldsettings', this, {
            container: win,
            settings: settings
        }) !== false) {
            fieldCfg.setConfig(settings || {});
            if (field.rendered) {
                field.textCol.setHtml(fieldCfg.getFieldText());
                field.textCol.dom.setAttribute('data-qtip', fieldCfg.getFieldText());
            }
            pivot.fireEvent('applyconfigfieldsettings', this, {
                container: win,
                settings: settings
            });
            this.applyChanges(field);
        } else {
            return false;
        }
    },
    /**
     * This function either moves or copies the dragged field from one container to another.
     *
     * @param {Ext.pivot.plugin.configurator.Container/Ext.pivot.plugin.configurator.Column} toTarget
     * @param {Ext.pivot.plugin.configurator.Column} column
     * @param {String} pos Position: `after` or `before`
     *
     * @private
     */
    dragDropField: function(toTarget, column, pos) {
        var me = this,
            pivot = me.getPivot(),
            field = column.getField(),
            fromContainer = column.ownerCt,
            toContainer = toTarget.isConfiguratorContainer ? toTarget : toTarget.ownerCt,
            toField = toTarget.isConfiguratorField ? toTarget : toTarget.items.last(),
            fromFieldType = fromContainer.getFieldType(),
            toFieldType = toContainer.getFieldType(),
            topAxisCt = me.getTopAxisContainer(),
            leftAxisCt = me.getLeftAxisContainer(),
            newPos, item, toFocus;
        if (pivot.fireEvent('beforemoveconfigfield', this, {
            fromContainer: fromContainer,
            toContainer: toContainer,
            field: field
        }) !== false) {
            if (fromContainer !== toContainer) {
                if (toField) {
                    newPos = toContainer.items.findIndex('id', toField.id);
                    newPos = (pos === 'before') ? newPos : newPos + 1;
                } else {
                    newPos = -1;
                }
                if (toFieldType === 'all') {
                    // source is "Row labels"/"Column labels"/"Values"
                    // destination is "All fields"
                    // we just remove the field from the source
                    toField.focus();
                    fromContainer.removeField(column);
                } else if (toFieldType === 'aggregate') {
                    // source is "Row labels"/"Column labels"/"All fields"
                    // destination is "Values"
                    // we copy the field to destination
                    toFocus = toContainer.addField(field.clone(), newPos, true);
                    if (fromFieldType !== 'all') {
                        // remove the field from the left/top axis
                        fromContainer.remove(column);
                    }
                } else {
                    // source is "Row labels"/"Column labels"/"Values"/"All fields"
                    // destination is "Row labels"/"Column labels"
                    // first let's check if the field is already in the destination container
                    item = me.findFieldInContainer(field, toContainer);
                    if (item) {
                        // the destination has the field already
                        return;
                    }
                    // See if it was on another axis.
                    if (toFieldType === 'leftAxis') {
                        item = me.findFieldInContainer(field, topAxisCt);
                    } else {
                        item = me.findFieldInContainer(field, leftAxisCt);
                    }
                    // If so, move it here.
                    if (item) {
                        toContainer.add(item);
                        return me.applyChanges(item);
                    } else {
                        if (fromFieldType === 'aggregate') {
                            // we need to remove the dragged field because it was found on one of the axis
                            fromContainer.remove(column);
                        }
                        toFocus = toContainer.addField(field.clone(), newPos, true);
                    }
                }
            } else {
                toContainer.moveField(column.id, toField.id, pos);
            }
            // Ensure that any removal does not allow focus to escape to the body
            if (toFocus) {
                toFocus.focus();
                toFocus.el.resumeFocusEvents();
            }
        }
    },
    isAllowed: function(toTarget, column) {
        var allowed = true,
            field = column.getField(),
            fromContainer = column.ownerCt,
            toContainer = toTarget.isConfiguratorContainer ? toTarget : toTarget.ownerCt,
            fromFieldType = fromContainer.getFieldType(),
            toFieldType = toContainer.getFieldType();
        if (fromFieldType === 'aggregate' && (toFieldType === 'leftAxis' || toFieldType === 'topAxis')) {
            allowed = !this.findFieldInContainer(field, toContainer);
        }
        return allowed;
    },
    /**
     *
     * @param {Ext.pivot.plugin.configurator.Field} field
     * @param {Ext.pivot.plugin.configurator.Container} container
     * @returns {Ext.pivot.plugin.configurator.Column}
     *
     * @private
     */
    findFieldInContainer: function(field, container) {
        var length = container.items.getCount(),
            i, item;
        for (i = 0; i < length; i++) {
            item = container.items.getAt(i);
            if (item.getField().getDataIndex() == field.getDataIndex()) {
                return item;
            }
        }
    },
    /**
     * Listener for the 'pivotdone' event. Initialize configurator fields or restore last field focus.
     *
     * @private
     */
    onPivotDone: function() {
        var me = this,
            field = me.lastFocusedField;
        if (me.internalReconfiguration) {
            me.internalReconfiguration = false;
            // restore focus
            if (field && field.isConfiguratorContainer) {
                field = field.items.first();
            }
            if (!field) {
                field = me.getAllFieldsContainer().items.first();
            }
            if (field) {
                field.focus();
            } else {
                me.getPivot().focus();
            }
        } else {
            me.initPivotFields();
        }
    },
    /**
     * Collect configurator changes and reconfigure the pivot component
     *
     * @private
     */
    reconfigurePivot: function() {
        var me = this,
            pivot = me.getPivot(),
            obj = {
                topAxis: me.getFieldsFromContainer(me.getTopAxisContainer(), true),
                leftAxis: me.getFieldsFromContainer(me.getLeftAxisContainer(), true),
                aggregate: me.getFieldsFromContainer(me.getAggregateContainer(), true)
            };
        me.internalReconfiguration = true;
        if (pivot.fireEvent('beforeconfigchange', me, obj) !== false) {
            pivot.getMatrix().reconfigure(obj);
            pivot.fireEvent('configchange', me, obj);
        }
    },
    /**
     * This function is temporarily added here until the placeholder expanding/collpasing
     * is fixed for docked panels.
     *
     * @param direction
     * @param animate
     * @returns {Ext.pivot.plugin.configurator.Panel}
     * @private
     */
    placeholderCollapse: function(direction, animate) {
        var me = this,
            ownerCt = me.ownerCt,
            collapseDir = direction || me.collapseDirection,
            floatCls = Ext.panel.Panel.floatCls,
            placeholder = me.getPlaceholder(collapseDir),
            slideInDirection;
        me.isCollapsingOrExpanding = 1;
        // Upcoming layout run will ignore this Component
        me.setHiddenState(true);
        me.collapsed = collapseDir;
        if (placeholder.rendered) {
            // We may have been added to another Container from that in which we rendered the placeholder
            if (placeholder.el.dom.parentNode !== me.el.dom.parentNode) {
                me.el.dom.parentNode.insertBefore(placeholder.el.dom, me.el.dom);
            }
            placeholder.hidden = false;
            placeholder.setHiddenState(false);
            placeholder.el.show();
            ownerCt.updateLayout();
        } else {
            //ATE - this is the fix
            if (me.dock) {
                placeholder.dock = me.dock;
                ownerCt.addDocked(placeholder);
            } else {
                ownerCt.insert(ownerCt.items.indexOf(me), placeholder);
            }
        }
        if (me.rendered) {
            // We assume that if collapse was caused by keyboard action
            // on focused collapse tool, the logical focus transition
            // is to placeholder's expand tool. Note that it may not be
            // the case when the user *clicked* collapse tool while focus
            // was elsewhere; in that case we dare not touch focus
            // to avoid sudden jumps.
            if (Ext.ComponentManager.getActiveComponent() === me.collapseTool) {
                me.focusPlaceholderExpandTool = true;
            }
            // We MUST NOT hide using display because that resets all scroll information.
            me.el.setVisibilityMode(me.placeholderCollapseHideMode);
            if (animate) {
                me.el.addCls(floatCls);
                placeholder.el.hide();
                slideInDirection = me.convertCollapseDir(collapseDir);
                me.el.slideOut(slideInDirection, {
                    preserveScroll: true,
                    duration: Ext.Number.from(animate, Ext.fx.Anim.prototype.duration),
                    listeners: {
                        scope: me,
                        afteranimate: function() {
                            var me = this;
                            me.el.removeCls(floatCls);
                            /* We need to show the element so that slideIn will work correctly.
                             * However, if we leave it visible then it can be seen before
                             * the animation starts, causing a flicker. The solution,
                             * borrowed from date picker, is to hide it using display:none.
                             * The slideIn effect includes a call to fixDisplay() that will
                             * undo the display none at the appropriate time.
                             */
                            me.placeholder.el.show().setStyle('display', 'none').slideIn(slideInDirection, {
                                easing: 'linear',
                                duration: 100,
                                listeners: {
                                    afteranimate: me.doPlaceholderCollapse,
                                    scope: me
                                }
                            });
                        }
                    }
                });
            } else {
                me.el.hide();
                me.doPlaceholderCollapse();
            }
        } else {
            me.isCollapsingOrExpanding = 0;
            if (!me.preventCollapseFire) {
                me.fireEvent('collapse', me);
            }
        }
        return me;
    },
    /**
     * This function is temporarily added here until the placeholder expanding/collpasing
     * is fixed for docked panels.
     *
     * @param animate
     * @returns {Ext.pivot.plugin.configurator.Panel}
     * @private
     */
    placeholderExpand: function(animate) {
        var me = this,
            collapseDir = me.collapsed,
            expandTool = me.placeholder.expandTool,
            floatCls = Ext.panel.Panel.floatCls,
            center = me.ownerLayout ? me.ownerLayout.centerRegion : null,
            finalPos, floatedPos;
        // Layouts suspended - don't bother with animation shenanigans
        if (Ext.Component.layoutSuspendCount) {
            animate = false;
        }
        if (me.floatedFromCollapse) {
            floatedPos = me.getPosition(true);
            // these are the same cleanups performed by the normal slideOut mechanism:
            me.slideOutFloatedPanelBegin();
            me.slideOutFloatedPanelEnd();
            me.floated = false;
        }
        // We assume that if expand was caused by keyboard action on focused
        // placeholder expand tool, the logical focus transition is to the
        // panel header's collapse tool.
        // Note that it may not be the case when the user *clicked* expand tool
        // while focus was elsewhere; in that case we dare not touch focus to avoid
        // sudden jumps.
        if (Ext.ComponentManager.getActiveComponent() === expandTool) {
            me.focusHeaderCollapseTool = true;
            // There is an odd issue with JAWS screen reader: when expanding a panel,
            // it will announce Expand tool again before focus is forced to Collapse
            // tool. I'm not sure why that happens since focus does not move from
            // Expand tool during animation; this hack should work around
            // the problem until we come up with more understanding and a proper
            // solution. The attributes are restored below in doPlaceholderExpand.
            expandTool._ariaRole = expandTool.ariaEl.dom.getAttribute('role');
            expandTool._ariaLabel = expandTool.ariaEl.dom.getAttribute('aria-label');
            expandTool.ariaEl.dom.setAttribute('role', 'presentation');
            expandTool.ariaEl.dom.removeAttribute('aria-label');
        }
        if (animate) {
            // Expand me and hide the placeholder
            Ext.suspendLayouts();
            me.placeholder.hide();
            me.el.show();
            me.collapsed = false;
            me.setHiddenState(false);
            // Stop the center region from moving when laid out without the placeholder there.
            // Unless we are expanding from a floated out situation. In that case, it's laid out immediately.
            if (center && !floatedPos) {
                center.hidden = true;
            }
            Ext.resumeLayouts(true);
            //ATE - this is the fix
            if (center) {
                center.hidden = false;
            }
            me.el.addCls(floatCls);
            // At this point, this Panel is arranged in its correct, expanded layout.
            // The center region has not been affected because it has been flagged as hidden.
            //
            // If we are proceeding from floated, the center region has also been arranged
            // in its new layout to accommodate this expansion, so no further layout is needed, just
            // element animation.
            //
            // If we are proceeding from fully collapsed, the center region has *not* been relayed out because
            // the UI look and feel dictates that it stays stable until the expanding panel has slid in all the
            // way, and *then* it snaps into place.
            me.isCollapsingOrExpanding = 2;
            // Floated, move it back to the floated pos, and thence into the correct place
            if (floatedPos) {
                finalPos = me.getXY();
                me.setLocalXY(floatedPos[0], floatedPos[1]);
                me.setXY([
                    finalPos[0],
                    finalPos[1]
                ], {
                    duration: Ext.Number.from(animate, Ext.fx.Anim.prototype.duration),
                    listeners: {
                        scope: me,
                        afteranimate: function() {
                            var me = this;
                            me.el.removeCls(floatCls);
                            me.isCollapsingOrExpanding = 0;
                            me.fireEvent('expand', me);
                        }
                    }
                });
            } else // Not floated, slide it in to the correct place
            {
                me.el.hide();
                me.placeholder.el.show();
                me.placeholder.hidden = false;
                // Slide this Component's el back into place, after which we lay out AGAIN
                me.setHiddenState(false);
                me.el.slideIn(me.convertCollapseDir(collapseDir), {
                    preserveScroll: true,
                    duration: Ext.Number.from(animate, Ext.fx.Anim.prototype.duration),
                    listeners: {
                        afteranimate: me.doPlaceholderExpand,
                        scope: me
                    }
                });
            }
        } else {
            me.floated = me.collapsed = false;
            me.doPlaceholderExpand(true);
        }
        return me;
    }
});

/**
 * This plugin allows the end user to configure the pivot component.
 *
 * It adds the following methods to the pivot grid:
 * - showConfigurator: which when called will show the configurator panel
 * - hideConfigurator: which when called will hide the configurator panel
 *
 * The configurator panel will be shown docked to the pivot grid.
 */
Ext.define('Ext.pivot.plugin.Configurator', {
    alternateClassName: [
        'Mz.pivot.plugin.Configurator'
    ],
    extend: 'Ext.plugin.Abstract',
    requires: [
        'Ext.util.DelayedTask',
        'Ext.menu.Menu',
        'Ext.menu.CheckItem',
        'Ext.util.Collection',
        'Ext.pivot.plugin.configurator.Panel'
    ],
    alias: [
        'plugin.pivotconfigurator',
        'plugin.mzconfigurator'
    ],
    /**
     * Fired on the pivot component before a configurator field is moved.
     *
     * Return false if you don't want to move that field.
     *
     * @event beforemoveconfigfield
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Container} config.fromContainer Source container to move from
     * @param {Ext.pivot.plugin.configurator.Container} config.toContainer Destination container to move to
     * @param {Ext.pivot.plugin.configurator.Field} config.field Field configuration
     */
    /**
     * Fired on the pivot component before the pivot settings window is shown.
     *
     * Return false if you don't want to show the window.
     *
     * @event beforeshowpivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Window object where you can inject
     * additional fields
     * @param {Object} config.settings Settings that will be loaded into the form
     */
    /**
     * Fired on the pivot component after the configurator pivot settings window is shown.
     *
     * @event showpivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Window object where you can inject
     * additional fields
     * @param {Object} config.settings Settings that were loaded into the form
     */
    /**
     * Fired on the pivot component before settings are applied to the pivot matrix.
     *
     * Return false if you don't want to apply the settings to the field.
     *
     * @event beforeapplypivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Window object that contains all
     * pivot matrix settings.
     * @param {Object} config.settings Settings that will be loaded into the form
     */
    /**
     * Fired on the pivot component after settings are applied to the pivot matrix.
     *
     * @event applypivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Window object
     * @param {Object} config.settings Settings that were loaded into the form
     */
    /**
     * Fired on the pivot component before the field settings window is shown.
     *
     * Return false if you don't want to show the window.
     *
     * @event beforeshowconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.FieldSettings} config.container Window object where you can inject
     * additional fields
     * @param {Object} config.settings Settings that will be loaded into the form
     */
    /**
     * Fired on the pivot component after the configurator field settings window is shown.
     *
     * @event showconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.FieldSettings} config.container Window object where you can inject
     * additional fields
     * @param {Object} config.settings Settings that were loaded into the form
     */
    /**
     * Fired on the pivot component before settings are applied to the configurator field.
     *
     * Return false if you don't want to apply the settings to the field.
     *
     * @event beforeapplyconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.FieldSettings} config.container Window object that contains all
     * field settings.
     * @param {Object} config.settings Settings that will be loaded into the form
     */
    /**
     * Fired on the pivot component after settings are applied to the configurator field.
     *
     * @event applyconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.FieldSettings} config.container Window object
     * @param {Object} config.settings Settings that were loaded into the form
     */
    /**
     * Fired on the pivot component before the configurator field menu is shown.
     *
     * Return false if you don't want to show the menu.
     *
     * @event beforeshowconfigfieldmenu
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.menu.Menu} config.menu Menu object
     * @param {Ext.pivot.plugin.configurator.Field} config.field Field configuration
     * @param {String} config.container Type of container in which the field is located: `all`, `leftAxis`,
     * `topAxis` or `aggregate`.
     */
    /**
     * Fired on the pivot component after the configurator field menu is shown.
     *
     * @event showconfigfieldmenu
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.menu.Menu} config.menu Menu object
     * @param {Ext.pivot.plugin.configurator.Field} config.field Field configuration
     * @param {String} config.container Type of container in which the field is located: `all`, `leftAxis`,
     * `topAxis` or `aggregate`.
     */
    /**
     * Fired on the pivot component before the new configuration is applied.
     *
     * Return false if you don't want to apply the new configuration to the pivot grid.
     *
     * @event beforeconfigchange
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config Config object used to reconfigure the pivot
     */
    /**
     * Fired on the pivot component when the configuration changes.
     *
     * @event configchange
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config Config object used to reconfigure the pivot
     */
    /**
     * Fired on the pivot component when the configurator panel is visible
     *
     * @event showconfigpanel
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     */
    /**
     * Fired on the pivot component when the configurator panel is hidden
     *
     * @event hideconfigpanel
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     */
    /**
     *  `"both"` (the default) - The plugin is added to both grids
     *  `"top"` - The plugin is added to the containing Panel
     *  `"locked"` - The plugin is added to the locked (left) grid
     *  `"normal"` - The plugin is added to the normal (right) grid
     *
     * @private
     */
    lockableScope: 'top',
    config: {
        /**
         * @cfg {Ext.pivot.plugin.configurator.Field[]} fields
         *
         * This is the array of fields you want to be used in the configurator.
         *
         * If no fields are defined then all fields are fetched from the store model if
         * a {@link Ext.pivot.matrix.Local Local} matrix is used.
         *
         * The fields are indexed by the dataIndex supplied to them which means that you can't have two fields
         * sharing the same dataIndex. If you want to define two fields that share the same dataIndex then
         * it's best to use a unique dataIndex for the 2nd field and define a grouperFn on it.
         *
         * The dimensions that are configured on the pivot component but do not exist in this fields collection
         * will be added here with a set of default settings.
         */
        fields: [],
        /**
         * @cfg {Number} refreshDelay Number of milliseconds to wait for pivot refreshing when a config change occurred.
         */
        refreshDelay: 300,
        /**
         * @cfg {String} dock Docking position for the configurator panel. Possible values: top, right, bottom, left
         */
        dock: 'right',
        /**
         * @cfg {Boolean} collapsible Is the configurator panel collapsible?
         */
        collapsible: true,
        /**
         * @private
         */
        configPanel: null
    },
    init: function(cmp) {
        var me = this;
        // this plugin is only available for the pivot components
        if (!cmp.isPivotComponent) {
            Ext.raise('This plugin is only compatible with pivot components');
        }
        cmp.showConfigurator = Ext.bind(me.showConfigurator, me);
        cmp.hideConfigurator = Ext.bind(me.hideConfigurator, me);
        cmp.on({
            afterrender: me.onAfterPivotRendered,
            single: true,
            scope: me
        });
        me.callParent([
            cmp
        ]);
    },
    /**
     * @private
     * AbstractComponent calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
        var me = this,
            cmp = me.getCmp();
        cmp.showConfigurator = cmp.hideConfigurator = null;
        me.setConfigPanel(Ext.destroy(me.getConfigPanel()));
        me.setFields(null);
        me.callParent();
    },
    /**
     * Enable the plugin to show the configurator panel.
     *
     */
    enable: function() {
        this.disabled = false;
        this.showConfigurator();
    },
    /**
     * Disable the plugin to hide the configurator panel.
     *
     */
    disable: function() {
        this.disabled = true;
        this.hideConfigurator();
    },
    /**
     * @private
     */
    showConfigurator: function() {
        this.renderConfigPanel();
    },
    /**
     * @private
     */
    hideConfigurator: function() {
        var cfgPanel = this.getConfigPanel();
        if (cfgPanel) {
            cfgPanel.disable();
            this.getCmp().fireEvent('hideconfigpanel', cfgPanel);
        }
    },
    /**
     * @private
     */
    onAfterPivotRendered: function() {
        var me = this,
            fields = me.getFields(),
            matrix = me.getCmp().getMatrix(),
            fieldsToUpdate = [],
            duplicates = {},
            noFields = false,
            store, newFields, field, name, length, i, dim, config;
        if (fields.length === 0 && matrix instanceof Ext.pivot.matrix.Local) {
            // if no fields were provided then try to extract them from the matrix store
            noFields = true;
            store = matrix.store;
            newFields = store ? store.model.getFields() : [];
            length = newFields.length;
            for (i = 0; i < length; i++) {
                name = newFields[i].getName();
                if (!fields.byDataIndex.get(name)) {
                    fields.add({
                        header: Ext.String.capitalize(name),
                        dataIndex: name
                    });
                }
            }
        }
        // extract fields from the existing pivot configuration
        newFields = Ext.Array.merge(matrix.leftAxis.dimensions.getRange(), matrix.topAxis.dimensions.getRange(), matrix.aggregate.getRange());
        length = newFields.length;
        for (i = 0; i < length; i++) {
            dim = newFields[i].getConfig();
            delete (dim.matrix);
            delete (dim.values);
            delete (dim.id);
            field = fields.byDataIndex.get(dim.dataIndex);
            if (!field) {
                fields.add(dim);
            } else if (noFields) {
                if (!duplicates[dim.dataIndex]) {
                    duplicates[dim.dataIndex] = 0;
                }
                delete (dim.header);
                duplicates[dim.dataIndex]++;
                fieldsToUpdate.push(dim);
            }
        }
        // Some fields defined on the pivot axis already exist in the configurator fields
        // so we need to update the configurator fields for later usage.
        // This is important because the dimensions may have labelRenderer/renderer/formatter defined
        // This happens only when no fields were defined on the Configurator plugin.
        length = fieldsToUpdate.length;
        for (i = 0; i < length; i++) {
            dim = fieldsToUpdate[i];
            if (duplicates[dim.dataIndex] === 1) {
                field = fields.byDataIndex.get(dim.dataIndex);
                if (field) {
                    config = field.getConfig();
                    Ext.merge(config, dim);
                    field.setConfig(config);
                }
            }
        }
        me.isReady = true;
        if (me.disabled === true) {
            me.disable();
        } else {
            me.enable();
        }
    },
    /**
     * Change configurator panel position.
     * @method setDock
     *
     * @param {String} position Possible values: `top`, `right`, `bottom`, `left`.
     */
    /**
     * Get a reference to the configurator panel
     * @method getConfigPanel
     *
     * @returns {Ext.pivot.plugin.configurator.Panel}
     */
    /**
     * @private
     * @param value
     */
    updateDock: function(value) {
        this.renderConfigPanel(value);
    },
    /**
     * @private
     * @param value
     */
    updateCollapsible: function(value) {
        this.renderConfigPanel(value);
    },
    getFields: function() {
        var ret = this.fields;
        if (!ret) {
            ret = new Ext.util.Collection({
                extraKeys: {
                    byDataIndex: 'dataIndex'
                },
                decoder: function(field) {
                    return (field && field.isField) ? field : new Ext.pivot.plugin.configurator.Field(field || {});
                }
            });
            this.setFields(ret);
        }
        return ret;
    },
    applyFields: function(fields, fieldsCollection) {
        if (fields == null || (fields && fields.isCollection)) {
            return fields;
        }
        if (fields) {
            if (!fieldsCollection) {
                fieldsCollection = this.getFields();
            }
            fieldsCollection.splice(0, fieldsCollection.length, fields);
        }
        return fieldsCollection;
    },
    /**
     * Render the configurator panel as a docked panel to the pivot component
     *
     * @private
     * @param position
     */
    renderConfigPanel: function(position) {
        var me = this,
            cmp = me.getCmp(),
            cfgPanel = me.getConfigPanel(),
            exists = !Ext.isEmpty(cfgPanel);
        if (!cmp || !me.isReady || me.disabled) {
            // nothing to do
            return;
        }
        Ext.destroy(cfgPanel);
        cfgPanel = cmp.addDocked({
            xtype: 'pivotconfigpanel',
            dock: position || me.getDock(),
            refreshDelay: me.getRefreshDelay(),
            pivot: me.getCmp(),
            fields: me.getFields(),
            listeners: {
                afterrender: 'onRenderConfigPanel',
                single: true,
                scope: me
            }
        })[0];
        me.setConfigPanel(cfgPanel);
        if (exists) {
            cfgPanel.enable();
        }
    },
    onRenderConfigPanel: function(panel) {
        this.getCmp().fireEvent('showconfigpanel', panel);
    }
});

/**
 * This plugin allows the user to view all records that were aggregated for a specified cell.
 *
 * The user has to double click that cell to open the records viewer.
 *
 * **Note:** If a {@link Ext.pivot.matrix.Remote Remote} matrix is used then the plugin requires
 * a {@link #remoteStore} to be provided to fetch the records for a left/top keys pair.
 */
Ext.define('Ext.pivot.plugin.DrillDown', {
    alternateClassName: [
        'Mz.pivot.plugin.DrillDown'
    ],
    alias: [
        'plugin.pivotdrilldown',
        'plugin.mzdrilldown'
    ],
    extend: 'Ext.plugin.Abstract',
    requires: [
        'Ext.pivot.Grid',
        'Ext.window.Window',
        'Ext.data.proxy.Memory',
        'Ext.data.Store',
        'Ext.toolbar.Paging'
    ],
    /**
     * Fired on the pivot component when the drill down window is visible
     *
     * @event showdrilldownpanel
     * @param {Ext.window.Window} panel Drill down window
     */
    /**
     * Fired on the pivot component when the drill down window is hidden
     *
     * @event hidedrilldownpanel
     * @param {Ext.window.Window} panel Drill down window
     */
    /**
     *  `"both"` (the default) - The plugin is added to both grids
     *  `"top"` - The plugin is added to the containing Panel
     *  `"locked"` - The plugin is added to the locked (left) grid
     *  `"normal"` - The plugin is added to the normal (right) grid
     *
     * @private
    */
    lockableScope: 'top',
    config: {
        /**
         * @cfg {Ext.grid.column.Column[]} [columns] Specify which columns should be visible in the grid.
         *
         * Use the same definition as for a grid column. Header and dataIndex are the most important ones.
         */
        columns: null,
        /**
         * @cfg {Number} width Width of the viewer's window.
         */
        width: 400,
        /**
         * @cfg {Number} height Height of the viewer's window.
         */
        height: 300,
        /**
         * @cfg {Ext.data.Store} remoteStore
         * Provide either a store config or a store instance when using a {@link Ext.pivot.matrix.Remote Remote} matrix on the pivot grid.
         *
         * The store will be remotely filtered to fetch records from the server.
         */
        remoteStore: null,
        /**
         * @private
         */
        grid: null,
        /**
         * @private
         */
        view: null
    },
    /**
     * @cfg {String} textWindow Viewer's window title.
     */
    textWindow: 'Drill down window',
    init: function(grid) {
        // this plugin is available only for the pivot grid
        if (!grid.isPivotGrid) {
            Ext.raise('This plugin is only compatible with Ext.pivot.Grid');
        }
        this.setGrid(grid);
        return this.callParent([
            grid
        ]);
    },
    destroy: function() {
        this.setConfig({
            grid: null,
            view: null
        });
        this.callParent();
    },
    updateGrid: function(grid) {
        Ext.destroy(this.gridListeners);
        if (grid) {
            this.gridListeners = grid.on({
                pivotitemcelldblclick: 'showPanel',
                pivotgroupcelldblclick: 'showPanel',
                pivottotalcelldblclick: 'showPanel',
                scope: this,
                destroyable: true
            });
        }
    },
    updateView: function(view, oldView) {
        Ext.destroy(oldView);
    },
    showPanel: function(params, e, eOpts) {
        var me = this,
            grid = me.getGrid(),
            matrix = grid.getMatrix(),
            columns = Ext.Array.from(me.getColumns() || []),
            result, fields, store, filters, view, i, len, value;
        // do nothing if the plugin is disabled
        if (me.disabled) {
            return;
        }
        result = matrix.results.get(params.leftKey, params.topKey);
        if (!result) {
            return;
        }
        switch (matrix.type) {
            case 'local':
                fields = matrix.store.model.getFields();
                store = new Ext.data.Store({
                    pageSize: 25,
                    remoteSort: true,
                    fields: Ext.clone(fields),
                    proxy: {
                        type: 'memory',
                        reader: {
                            type: 'array'
                        },
                        enablePaging: true
                    }
                });
                // if no columns are defined then use those defined in the pivot grid store
                if (columns.length === 0) {
                    len = fields.length;
                    for (i = 0; i < len; i++) {
                        value = fields[i];
                        columns.push({
                            text: Ext.String.capitalize(value.name),
                            dataIndex: value.name
                        });
                    }
                };
                store.getProxy().data = result.records;
                store.load();
                break;
            case 'remote':
                store = Ext.getStore(me.getRemoteStore());
                if (store) {
                    store.setRemoteFilter(true);
                };
                if (columns.length === 0) {
                    Ext.raise('No columns defined for the drill down grid!');
                };
                filters = Ext.Array.merge(me.getFiltersFromParams(result.getLeftAxisItem() ? result.getLeftAxisItem().data : {}), me.getFiltersFromParams(result.getTopAxisItem() ? result.getTopAxisItem().data : {}));
                store.clearFilter(true);
                if (filters.length > 0) {
                    store.addFilter(filters);
                } else {
                    store.load();
                };
                break;
            default:
                return;
        }
        // create the window that will show the records
        view = me.createPanel(store, columns);
        view.show();
        me.setView(view);
        grid.fireEvent('showdrilldownpanel', view);
    },
    createPanel: function(store, columns) {
        var me = this;
        return new Ext.window.Window({
            title: me.textWindow,
            width: me.getWidth(),
            height: me.getHeight(),
            layout: 'fit',
            modal: true,
            closeAction: 'hide',
            items: [
                {
                    xtype: 'grid',
                    border: false,
                    viewConfig: {
                        loadMask: false
                    },
                    columns: columns,
                    store: store,
                    dockedItems: [
                        {
                            xtype: 'pagingtoolbar',
                            store: store,
                            // same store GridPanel is using
                            dock: 'bottom',
                            displayInfo: true
                        }
                    ]
                }
            ],
            listeners: {
                close: 'onClosePanel',
                scope: me
            }
        });
    },
    onClosePanel: function() {
        var view = this.getView();
        this.getGrid().fireEvent('hidedrilldownpanel', view);
        this.setView(null);
    },
    getFiltersFromParams: function(obj) {
        var filters = [],
            i, len, keys;
        if (Ext.isObject(obj)) {
            keys = Ext.Object.getKeys(obj);
            len = keys.length;
            for (i = 0; i < len; i++) {
                filters.push({
                    property: keys[i],
                    exactMatch: true,
                    value: obj[keys[i]]
                });
            }
        }
        return filters;
    }
});

/**
 *
 * This plugin allows the user to modify records behind a pivot cell.
 *
 * The user has to double click that cell to open the range editor window.
 *
 * The following types of range editing are available:
 *
 * - `percentage`: the user fills in a percentage that is applied to each record.
 * - `increment`:  the user fills in a value that is added to each record.
 * - `overwrite`:  the new value filled in by the user overwrites each record.
 * - `uniform`:  replace sum of values with a provided value using uniform distribution
 *
 * More pivot updater types can be defined by extending {@link Ext.pivot.update.Base}.
 *
 * **Note:** Only works when using a {@link Ext.pivot.matrix.Local} matrix on a pivot grid.
 */
Ext.define('Ext.pivot.plugin.RangeEditor', {
    alternateClassName: [
        'Mz.pivot.plugin.RangeEditor'
    ],
    alias: [
        'plugin.pivotrangeeditor',
        'plugin.mzrangeeditor'
    ],
    extend: 'Ext.plugin.Abstract',
    requires: [
        'Ext.pivot.Grid',
        'Ext.pivot.update.Increment',
        'Ext.pivot.update.Overwrite',
        'Ext.pivot.update.Percentage',
        'Ext.pivot.update.Uniform',
        'Ext.window.Window',
        'Ext.form.field.Hidden',
        'Ext.form.field.Text',
        'Ext.form.field.Number',
        'Ext.form.field.ComboBox',
        'Ext.form.field.Display',
        'Ext.form.Panel',
        'Ext.button.Button',
        'Ext.layout.container.Fit',
        'Ext.data.ArrayStore'
    ],
    /**
     * Fires on the pivot component before updating all result records.
     *
     * @event pivotbeforeupdate
     * @param {Ext.pivot.update.Base} updater Reference to the updater object
     */
    /**
     * Fires on the pivot component after updating all result records.
     *
     * @event pivotupdate
     * @param {Ext.pivot.update.Base} updater Reference to the updater object
     */
    /**
     * Fired on the pivot component when the range editor window is visible
     *
     * @event showrangeeditorpanel
     * @param {Ext.window.Window} panel Range editor window
     */
    /**
     * Fired on the pivot component when the range editor window is hidden
     *
     * @event hiderangeeditorpanel
     * @param {Ext.window.Window} panel Range editor window
     */
    /**
     * @cfg {Number} width Width of the viewer's window.
     */
    width: null,
    /**
     * @cfg {Number} height Height of the viewer's window.
     */
    height: null,
    /**
     * @cfg {String} textWindowTitle Range editor window title
     */
    textWindowTitle: 'Range editor',
    /**
     * @cfg {String} textFieldValue Range editor field Value label
     */
    textFieldValue: 'Value',
    /**
     * @cfg {String} textFieldEdit Range editor field Edit label
     */
    textFieldEdit: 'Field',
    /**
     * @cfg {String} textFieldType Range editor field Type label
     */
    textFieldType: 'Type',
    /**
     * @cfg {String} textButtonOk Range editor window Ok button text
     */
    textButtonOk: 'Ok',
    /**
     * @cfg {String} textButtonCancel Range editor window Cancel button text
     */
    textButtonCancel: 'Cancel',
    /**
     * @cfg {Function} onBeforeRecordsUpdate
     *
     * Provide a function to handle the records update.
     *
     * This one will be fired before updating the records. Return false if you want to stop the process.
     *
     * The function receives the following arguments: pivot, colDefinition, records, newValue, oldValue.
     */
    onBeforeRecordsUpdate: Ext.emptyFn,
    /**
     * @cfg {Function} onAfterRecordsUpdate
     *
     * Provide a function to handle the records update.
     *
     * This one will be fired after all records were updated. "sync" could be called on the store inside this function.
	 *
     * The function receives the following arguments: pivot, colDefinition, records, newValue, oldValue.
     */
    onAfterRecordsUpdate: Ext.emptyFn,
    /**
     * @cfg {Object} scope
     *
     * Scope to run the functions `onBeforeRecordsUpdate` and `onAfterRecordsUpdate`.
     */
    scope: null,
    /**
     * @cfg {Array} updaters
     *
     * Define here the updaters available for the user.
     */
    updaters: [
        [
            'percentage',
            'Percentage'
        ],
        [
            'increment',
            'Increment'
        ],
        [
            'overwrite',
            'Overwrite'
        ],
        [
            'uniform',
            'Uniform'
        ]
    ],
    /**
     * @cfg {String} defaultUpdater
     *
     * Define which updater is selected by default.
     */
    defaultUpdater: 'uniform',
    /**
     *  `"both"` (the default) - The plugin is added to both grids
     *  `"top"` - The plugin is added to the containing Panel
     *  `"locked"` - The plugin is added to the locked (left) grid
     *  `"normal"` - The plugin is added to the normal (right) grid
     *
     * @private
     */
    lockableScope: 'top',
    config: {
        /**
         * @private
         */
        grid: null,
        /**
         * @private
         */
        view: null
    },
    init: function(grid) {
        // this plugin is available only for the pivot grid
        if (!grid.isPivotGrid) {
            Ext.raise('This plugin is only compatible with Ext.pivot.Grid');
        }
        this.setGrid(grid);
        return this.callParent([
            grid
        ]);
    },
    destroy: function() {
        this.setConfig({
            grid: null,
            view: null
        });
        this.cleanUp();
        this.callParent();
    },
    updateGrid: function(grid) {
        Ext.destroy(this.gridListeners);
        if (grid) {
            this.gridListeners = grid.on({
                pivotitemcelldblclick: 'showPanel',
                pivotgroupcelldblclick: 'showPanel',
                pivottotalcelldblclick: 'showPanel',
                scope: this,
                destroyable: true
            });
        }
    },
    updateView: function(view, oldView) {
        Ext.destroy(oldView);
    },
    showPanel: function(params, e, eOpts) {
        var me = this,
            grid = me.getGrid(),
            matrix = grid.getMatrix(),
            dataIndex, result, col, view;
        // do nothing if the plugin is disabled
        if (me.disabled) {
            return;
        }
        result = matrix.results.get(params.leftKey, params.topKey);
        if (!result) {
            return;
        }
        // create the window that will show the records
        view = me.createPanel();
        // to keep compatibility with prior versions of this plugin
        me.currentCol = col = params.column;
        me.currentRecords = result.records || [];
        dataIndex = col.dimension.getId();
        me.currentValue = result.getValue(dataIndex);
        view.down('form').getForm().setValues({
            leftKey: params.leftKey,
            topKey: params.topKey,
            dataIndex: col.dimension.dataIndex,
            field: col.dimension.header || col.text || col.dimension.dataIndex,
            value: result.getValue(dataIndex),
            type: me.defaultUpdater
        });
        view.show();
        me.setView(view);
        grid.fireEvent('showrangeeditorpanel', view);
    },
    createPanel: function() {
        var me = this;
        return new Ext.window.Window({
            title: me.textWindowTitle,
            width: me.width,
            height: me.height,
            layout: 'fit',
            modal: true,
            closeAction: 'hide',
            items: [
                {
                    xtype: 'form',
                    padding: 5,
                    border: false,
                    defaults: {
                        anchor: '100%'
                    },
                    items: [
                        {
                            fieldLabel: me.textFieldEdit,
                            xtype: 'displayfield',
                            name: 'field'
                        },
                        {
                            fieldLabel: me.textFieldType,
                            xtype: 'combo',
                            name: 'type',
                            queryMode: 'local',
                            valueField: 'id',
                            displayField: 'text',
                            editable: false,
                            store: me.updaters
                        },
                        {
                            fieldLabel: me.textFieldValue,
                            xtype: 'numberfield',
                            name: 'value'
                        },
                        {
                            xtype: 'hidden',
                            name: 'leftKey'
                        },
                        {
                            xtype: 'hidden',
                            name: 'topKey'
                        },
                        {
                            xtype: 'hidden',
                            name: 'dataIndex'
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: me.textButtonOk,
                    handler: me.updateRecords,
                    scope: me
                },
                {
                    text: me.textButtonCancel,
                    handler: me.closePanel,
                    scope: me
                }
            ],
            listeners: {
                close: 'onClosePanel',
                scope: me
            }
        });
    },
    closePanel: function() {
        this.getView().close();
    },
    onClosePanel: function() {
        var view = this.getView();
        this.getGrid().fireEvent('hiderangeeditorpanel', view);
        this.setView(null);
    },
    updateRecords: function() {
        var me = this,
            view = me.getView(),
            values = view.down('form').getValues(),
            fn = Ext.bind(me.cleanUp, me),
            updater;
        values.matrix = me.getGrid().getMatrix();
        updater = Ext.Factory.pivotupdate(values);
        updater.on({
            beforeupdate: me.onBeforeUpdate,
            update: me.onUpdate,
            scope: me
        });
        updater.update().then(fn, fn);
    },
    cleanUp: function() {
        this.currentCol = this.currentRecords = this.currentValue = null;
    },
    onBeforeUpdate: function(updater) {
        var me = this,
            pivot = me.getGrid();
        if (Ext.callback(me.onBeforeRecordsUpdate, me.scope || 'self.controller', [
            pivot,
            me.currentCol,
            me.currentRecords,
            updater.getValue(),
            me.currentValue
        ], 0, pivot) === false) {
            return false;
        }
        if (pivot.fireEvent('pivotbeforeupdate', updater) === false) {
            return false;
        }
        me.getView().getEl().mask();
    },
    onUpdate: function(updater) {
        var me = this,
            pivot = me.getGrid(),
            view = me.getView();
        Ext.callback(me.onAfterRecordsUpdate, me.scope || 'self.controller', [
            pivot,
            me.currentCol,
            me.currentRecords,
            updater.getValue(),
            me.currentValue
        ], 0, pivot);
        pivot.fireEvent('pivotupdate', updater);
        Ext.destroy(updater);
        view.getEl().unmask();
        view.close();
    }
});

