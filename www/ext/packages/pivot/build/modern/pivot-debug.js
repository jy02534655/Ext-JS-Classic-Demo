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
    onRender: function() {
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
    handleEvent: function(type, e) {
        var me = this,
            row = me.row,
            grid = row.getGrid(),
            record = me.getRecord(),
            params = {
                grid: grid
            },
            info, eventName, ret, column, leftKey, topKey, matrix, leftItem, topItem;
        if (!record) {
            return;
        }
        eventName = row.getEventName() || '';
        info = row.getRecordInfo(record);
        matrix = grid.getMatrix();
        column = me.getColumn();
        leftItem = info.rendererParams[column._dataIndex];
        if (!leftItem) {
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
            if (topKey) {
                topItem = matrix.topAxis.findTreeElement('key', topKey);
                topItem = topItem ? topItem.node : null;
                if (topItem) {
                    Ext.apply(params, {
                        topItem: topItem,
                        dimensionId: topItem.dimensionId
                    });
                }
            }
        }
        ret = grid.fireEvent(eventName + type, params, e);
        if (ret !== false && type == 'tap' && me.getCollapsible()) {
            if (leftItem.expanded) {
                leftItem.collapse();
            } else {
                leftItem.expand();
            }
        }
        return false;
    },
    updateRecord: function(record, oldRecord) {
        var model = this.getViewModel();
        this.callParent([
            record,
            oldRecord
        ]);
        if (model) {
            model.setData({
                value: this.getValue(),
                record: record
            });
        }
    }
});

/**
 * This class is used internally by the pivot grid component.
 * @private
 */
Ext.define('Ext.pivot.cell.Group', {
    extend: 'Ext.pivot.cell.Cell',
    xtype: 'pivotgridgroupcell',
    config: {
        innerGroupStyle: null,
        innerGroupCls: null,
        userGroupStyle: null,
        userGroupCls: null
    },
    innerTemplate: [
        {
            reference: 'iconElement',
            classList: [
                Ext.baseCSSPrefix + 'pivot-grid-group-icon',
                Ext.baseCSSPrefix + 'font-icon'
            ]
        },
        {
            reference: 'groupElement',
            classList: [
                Ext.baseCSSPrefix + 'pivot-grid-group-title'
            ]
        }
    ],
    groupCls: Ext.baseCSSPrefix + 'pivot-grid-group',
    groupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header',
    groupHeaderCollapsibleCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsible',
    groupHeaderCollapsedCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsed',
    updateCellCls: function(newCls, oldCls) {
        var me = this,
            classes = typeof newCls == 'string' ? newCls.split(' ') : Ext.Array.from(newCls);
        me.callParent([
            newCls,
            oldCls
        ]);
        me.setEventCell(classes.indexOf(me.groupHeaderCls) < 0);
        me.setCollapsible(classes.indexOf(me.groupHeaderCollapsibleCls) >= 0);
    },
    updateInnerGroupStyle: function(cellStyle) {
        this.groupElement.applyStyles(cellStyle);
    },
    updateInnerGroupCls: function(cls, oldCls) {
        this.groupElement.replaceCls(oldCls, cls);
    },
    updateUserGroupStyle: function(cellStyle) {
        this.groupElement.applyStyles(cellStyle);
    },
    updateUserGroupCls: function(cls, oldCls) {
        this.groupElement.replaceCls(oldCls, cls);
    },
    updateRawValue: function(rawValue) {
        var dom = this.groupElement.dom,
            value = rawValue == null ? '' : rawValue;
        if (this.getEncodeHtml()) {
            dom.textContent = value;
        } else {
            dom.innerHTML = value;
        }
    },
    updateRecord: function(record, oldRecord) {
        var me = this,
            info = me.row.getRecordInfo(),
            dataIndex = me.dataIndex;
        if (info && dataIndex) {
            info = info.rendererParams[dataIndex];
            if (info && me[info.fn]) {
                me[info.fn](info, me.row.getGrid());
            } else {
                me.setCellCls('');
            }
        }
        me.callParent([
            record,
            oldRecord
        ]);
    },
    groupOutlineRenderer: function(config, grid) {
        var me = this,
            cellCls = '',
            group = config.group;
        if (grid.getMatrix().viewLayoutType == 'compact') {
            // the grand total uses this renderer in compact view and margins need to be reset
            me.bodyElement.setStyle(grid.isRTL() ? 'padding-right' : 'padding-left', '0');
        }
        if (config.colspan > 0) {
            cellCls += me.groupHeaderCls + ' ' + me.outlineGroupHeaderCls;
            if (!config.subtotalRow) {
                if (group && group.children && group.axis.matrix.collapsibleRows) {
                    cellCls += ' ' + me.groupHeaderCollapsibleCls;
                    if (!config.group.expanded) {
                        cellCls += ' ' + me.groupHeaderCollapsedCls;
                    }
                }
                if (config.previousExpanded) {
                    cellCls += ' ' + me.outlineCellGroupExpandedCls;
                }
            }
            me.setCellCls(cellCls);
            me.setInnerGroupCls(me.groupCls);
            return;
        }
        me.setCellCls(me.outlineCellHiddenCls);
    },
    recordOutlineRenderer: function(config, grid) {
        var me = this;
        if (config.hidden) {
            me.setCellCls(me.outlineCellHiddenCls);
            return;
        }
        me.setCellCls(me.groupHeaderCls);
    },
    groupCompactRenderer: function(config, grid) {
        var me = this,
            cellCls = '',
            group = config.group;
        me.bodyElement.setStyle(grid.isRTL() ? 'padding-right' : 'padding-left', (me.compactLayoutPadding * group.level) + 'px');
        cellCls += me.groupHeaderCls + ' ' + me.compactGroupHeaderCls;
        if (!config.subtotalRow) {
            if (group && group.children && group.axis.matrix.collapsibleRows) {
                cellCls += ' ' + me.groupHeaderCollapsibleCls;
                if (!config.group.expanded) {
                    cellCls += ' ' + me.groupHeaderCollapsedCls;
                }
            }
            if (config.previousExpanded) {
                cellCls += ' ' + me.outlineCellGroupExpandedCls;
            }
        }
        me.setCellCls(cellCls);
        me.setInnerGroupCls(me.groupCls);
    },
    recordCompactRenderer: function(config, grid) {
        var me = this;
        me.bodyElement.setStyle(grid.isRTL() ? 'padding-right' : 'padding-left', (me.compactLayoutPadding * config.group.level) + 'px');
        me.setCellCls(me.groupHeaderCls + ' ' + me.compactGroupHeaderCls);
    },
    groupTabularRenderer: function(config, grid) {
        var me = this,
            cellCls = '',
            group = config.group;
        cellCls += me.groupHeaderCls + ' ' + me.tabularGroupHeaderCls;
        if (!config.subtotalRow && !config.hidden) {
            if (group && group.children && group.axis.matrix.collapsibleRows) {
                cellCls += ' ' + me.groupHeaderCollapsibleCls;
                if (!group.expanded) {
                    cellCls += ' ' + me.groupHeaderCollapsedCls;
                }
            }
        }
        me.setCellCls(cellCls);
        me.setInnerGroupCls(me.groupCls);
    },
    recordTabularRenderer: function(config) {
        var me = this;
        if (config.hidden) {
            me.setCellCls(me.outlineCellHiddenCls);
            return;
        }
        me.setCellCls(me.groupHeaderCls);
    }
});

/**
 * This class is used internally by the pivot grid component.
 * @private
 */
Ext.define('Ext.pivot.Row', {
    extend: 'Ext.grid.Row',
    xtype: 'pivotgridrow',
    requires: [
        'Ext.pivot.cell.Group'
    ],
    config: {
        recordInfo: null,
        rowCls: null,
        eventName: null
    },
    summaryDataCls: Ext.baseCSSPrefix + 'pivot-summary-data',
    summaryRowCls: Ext.baseCSSPrefix + 'pivot-grid-group-total',
    grandSummaryRowCls: Ext.baseCSSPrefix + 'pivot-grid-grand-total',
    onRender: function() {
        this.callParent();
        var model = this.getViewModel();
        if (model) {
            model.set('columns', this.getRefOwner().getMatrix().modelInfo);
        }
    },
    destroy: function() {
        this.setRecordInfo(null);
        this.callParent();
    },
    updateRecord: function(record, oldRecord) {
        var me = this,
            info;
        if (me.destroying || me.destroyed) {
            return;
        }
        info = me.getRefOwner().getRecordInfo(record);
        me.setRecordInfo(info);
        if (info) {
            me.setRowCls(info.rowClasses);
            me.setEventName(info.rowEvent);
        }
        me.callParent([
            record,
            oldRecord
        ]);
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
 *
 * The modern pivot grid could be styled using data binding as following:
 *
 * ## ViewModel on rows
 *
 * Let's have a look at this example:
 *
 *      {
 *          xtype: 'pivotgrid',
 *          itemConfig: {
 *              viewModel: {
 *                  type: 'pivot-row-model'
 *              },
 *              bind: {
 *                  userCls: '{rowStyle}'
 *                  // or you can define a template
 *                  //userCls: '{record.isRowGroupHeader:pick("","pivotRowHeader")}'
 *              }
 *          }
 *          // ... more configs
 *      }
 *
 * In the ViewModel we would declare a formula that will use the record data. The record
 * has all values that are displayed for that row and the following additional fields:
 *
 * - isRowGroupHeader
 * - isRowGroupTotal
 * - isRowGrandTotal
 * - leftAxisKey: This is either the grand total key or a key that identifies the left axis item
 *
 * All these properties can help us style the entire row without knowing anything about the generated columns.
 *
 * In some case we may want to style positive and negative values generated in the pivot grid. This can be done
 * as following.
 *
 *      {
 *          xtype: 'pivotgrid',
 *          itemConfig: {
 *              viewModel: {
 *                  type: 'default'
 *              }
 *          },
 *          topAxisCellConfig: {
 *              bind: {
 *                  userCls: '{value:sign("pivotCellNegative","pivotCellPositive")}'
 *              }
 *          }
 *          // ... more configs
 *      }
 *
 * The following data is available for use in the bind template:
 *
 * - column
 *      - isColGroupTotal: this tells us that the column for that specific cell is a group total
 *      - isColGrandTotal: this tells us that the column for that specific cell is a grand total
 *
 * - value: cell value
 *
 * **Note:** In such cases you cannot use formulas because the column and value are generated dynamically
 * and can't be replaced in formulas.
 *
 *
 * It is also possible to style a specific dimension from left axis or aggregate:
 *
 *      {
 *          xtype: 'pivotgrid',
 *          itemConfig: {
 *              viewModel: {
 *                  type: 'default'
 *              }
 *          },
 *          matrix: {
 *              aggregate: [{
 *                  dataIndex:  'value',
 *                  aggregator: 'sum',
 *                  align:      'right',
 *
 *                  cellConfig: {
 *                      bind: {
 *                          userCls: '{value:sign("pivotCellNegative","pivotCellPositive")}'
 *                      }
 *                  }
 *              },{
 *                  dataIndex:  'value',
 *                  aggregator: 'count'
 *              }],
 *              leftAxis: [{
 *                  dataIndex:  'person',
 *                  // This is used only when `viewLayoutType` is `outline`
 *                  cellConfig: {
 *                      bind: {
 *                          userCls: '{record.isRowGroupHeader::pick("","pivotRowHeader")}'
 *                      }
 *                  }
 *              },{
 *                  dataIndex:  'country'
 *              }]
 *              // ... more configs
 *          }
 *      }
 *
 *
 * ## ViewModel on cells
 *
 * This scenario allows you to define formulas to use in cell binding. Be careful that this means that
 * each cell will have an own ViewModel and this may decrease the pivot grid performance. Use it only
 * if necessary.
 *
 *      {
 *          xtype: 'pivotgrid',
 *          leftAxisCellConfig: {
 *              viewModel: {
 *                  type: 'default'
 *              },
 *              bind: {
 *                  userCls: '{record.isRowGroupHeader::pick("","pivotRowHeader")}'
 *              }
 *          },
 *          topAxisCellConfig: {
 *              viewModel: {
 *                  type: 'pivot-cell-model' // to be able to define your own formulas
 *              },
 *              bind: {
 *                  userCls: '{value:sign("pivotCellNegative","pivotCellPositive")}'
 *                  //userCls: '{column.isColGrandTotal:pick(null,"pivotCellGrandTotal")}'
 *                  //userCls: '{cellCls}
 *              }
 *          }
 *          // ... more configs
 *      }
 *
 * This approach lets you use record, column and value in both bind templates and formulas.
 *
 *
 * If multiple aggregate dimensions are available and you want to style one of them you can define the
 * binding on that dimension like this:
 *
 *      {
 *          xtype: 'pivotgrid',
 *          matrix: {
 *              aggregate: [{
 *                  dataIndex:  'value',
 *                  aggregator: 'sum',
 *                  align:      'right',
 *
 *                  cellConfig: {
 *                      viewModel: {
 *                          type: 'pivot-cell-model'
 *                      },
 *                      bind: {
 *                          userCls: '{value:sign("pivotCellNegative","pivotCellPositive")}'
 *                          //userCls: '{column.isColGrandTotal:pick(null,"pivotCellGrandTotal")}'
 *                          //userCls: '{cellCls}
 *                      }
 *                  }
 *              },{
 *                  dataIndex:  'value',
 *                  aggregator: 'count'
 *              }]
 *              // ... more configs
 *          }
 *      }
 *
 */
Ext.define('Ext.pivot.Grid', {
    extend: 'Ext.grid.Grid',
    xtype: 'pivotgrid',
    requires: [
        'Ext.LoadMask',
        'Ext.pivot.Row',
        'Ext.pivot.feature.PivotStore',
        'Ext.pivot.matrix.Local',
        'Ext.pivot.matrix.Remote',
        'Ext.data.ArrayStore'
    ],
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
     * Fires when a tap is detected on a pivot group element.
     * The pivot group element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * Return false if you want to prevent expanding/collapsing that group.
     *
     * @event pivotgrouptap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a double tap is detected on a pivot group element.
     * The pivot group element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotgroupdoubletap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap hold is detected on a pivot group element.
     * The pivot group element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotgrouptaphold
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap is detected on a pivot group cell.
     * The pivot group cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotgroupcelltap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a double tap is detected on a pivot group cell.
     * The pivot group cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotgroupcelldoubletap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap hold is detected on a pivot group cell.
     * The pivot group cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotgroupcelltaphold
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap is detected on a pivot item element.
     * The pivot item element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotitemtap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a double tap is detected on a pivot item element.
     * The pivot item element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotitemdoubletap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap hold is detected on a pivot item element.
     * The pivot item element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivotitemtaphold
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap is detected on a pivot item cell.
     * The pivot item cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotitemcelltap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a double tap is detected on a pivot item cell.
     * The pivot item cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotitemcelldoubletap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap hold is detected on a pivot item cell.
     * The pivot item cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivotitemcelltaphold
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.pivot.axis.Item} params.leftItem Left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {Ext.pivot.axis.Item} params.topItem Top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap is detected on a pivot grand total element.
     * The pivot grand total element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivottotaltap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a double tap is detected on a pivot grand total element.
     * The pivot grand total element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivottotaldoubletap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap hold is detected on a pivot grand total element.
     * The pivot grand total element is the one that belongs to the columns generated for the left axis dimensions.
     *
     * @event pivottotaltaphold
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a tap is detected on a pivot grand total cell.
     * The pivot total cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivottotalcelltap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a double tap is detected on a pivot grand total cell.
     * The pivot total cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivottotalcelldoubletap
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
     * @param {Ext.grid.column.Column} params.column Column header object
     * @param {Ext.event.Event} e Event object
     */
    /**
     * Fires when a double tap is detected on a pivot grand total cell.
     * The pivot total cell is the one that belongs to the columns generated for the top axis dimensions.
     *
     * @event pivottotalcelltaphold
     * @param {Object} params Object with following configuration
     * @param {Ext.pivot.Grid} params.grid Pivot grid instance
     * @param {Ext.grid.cell.Cell} params.cell The target of the event
     * @param {String} params.leftKey Key of the left axis item
     * @param {String} params.topKey Key of the top axis item
     * @param {String} params.dimensionId Id of the aggregate dimension
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
     * @cfg {Boolean} enableLoadMask Set this on false if you don't want to see the loading mask.
     */
    enableLoadMask: true,
    /**
     * @cfg {Boolean} enableColumnSort Set this on false if you don't want to allow column sorting
     * in the pivot grid generated columns.
     */
    enableColumnSort: true,
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
    cellSelector: '.' + Ext.baseCSSPrefix + 'gridcell',
    /**
     * @cfg {String} clsGroupTotal CSS class assigned to the group totals.
     */
    clsGroupTotal: Ext.baseCSSPrefix + 'pivot-grid-group-total',
    /**
     * @cfg {String} clsGrandTotal CSS class assigned to the grand totals.
     */
    clsGrandTotal: Ext.baseCSSPrefix + 'pivot-grid-grand-total',
    groupHeaderCollapsedCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsed',
    groupHeaderCollapsibleCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsible',
    summaryDataCls: Ext.baseCSSPrefix + 'pivot-summary-data',
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
        },
        /**
         * @cfg {Object} leftAxisCellConfig
         *
         * Cell configuration for columns generated for the left axis dimensions.
         *
         * Binding could be defined here.
         */
        leftAxisCellConfig: {
            xtype: 'pivotgridgroupcell'
        },
        /**
         * @cfg {Object} topAxisCellConfig
         *
         * Cell configuration for columns generated for the top axis and aggregate dimensions.
         *
         * Binding could be defined here.
         */
        topAxisCellConfig: {
            xtype: 'pivotgridcell'
        }
    },
    /**
         * @cfg record
         * @hide
         */
    variableHeights: true,
    itemConfig: {
        xtype: 'pivotgridrow'
    },
    classCLs: Ext.baseCSSPrefix + 'pivot-grid',
    initialize: function() {
        var me = this;
        me.setColumns([]);
        me.setStore(new Ext.data.ArrayStore({
            $internal: true,
            fields: []
        }));
        me.pivotDataSource = new Ext.pivot.feature.PivotStore({
            store: me.getStore(),
            grid: me,
            matrix: me.getMatrix(),
            clsGrandTotal: me.clsGrandTotal,
            clsGroupTotal: me.clsGroupTotal,
            summaryDataCls: me.summaryDataCls
        });
        me.getHeaderContainer().on({
            columntap: 'handleColumnTap',
            headergrouptap: 'handleHeaderGroupTap',
            scope: me
        });
        return me.callParent();
    },
    destroy: function() {
        var me = this;
        Ext.destroy(me.matrixRelayedListeners, me.matrixListeners, me.headerCtListeners, me.lockedHeaderCtListeners);
        Ext.destroy(me.pivotDataSource);
        me.matrixRelayedListeners = me.matrixListeners = me.headerCtListeners = me.lockedHeaderCtListeners = null;
        me.setMatrix(null);
        me.callParent();
        me.lastColumnSorted = me.store = Ext.destroy(me.store);
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
        return Ext.Factory.pivotmatrix(newMatrix);
    },
    updateMatrix: function(matrix, oldMatrix) {
        var me = this;
        Ext.destroy(oldMatrix, me.matrixListeners, me.matrixRelayedListeners);
        if (matrix) {
            me.matrixListeners = matrix.on({
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
            me.matrixRelayedListeners = me.relayEvents(matrix, me.relayedMatrixEvents, 'pivot');
            if (me.pivotDataSource) {
                me.pivotDataSource.setMatrix(matrix);
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
        me.getStore().fireEvent('pivotstoreremodel', me);
    },
    updateHeaderContainerColumns: function(group) {
        var me = this,
            toRemove = [],
            cols, index, ownerCt, item, column, i, length;
        if (group) {
            // let's find the first column that matches this group
            // that will be our new columns insertion point
            column = me.getColumnForGroup(me.getHeaderContainer().innerItems, group);
            if (column.found) {
                ownerCt = column.item.getParent();
                index = column.index;
                length = ownerCt.items.length;
                for (i = 0; i < length; i++) {
                    item = ownerCt.items.getAt(i);
                    if (item.group == group) {
                        toRemove.push(item);
                    }
                }
                ownerCt.remove(toRemove);
                cols = Ext.clone(me.pivotColumns);
                me.preparePivotColumns(cols);
                cols = me.getVisiblePivotColumns(me.prepareVisiblePivotColumns(cols), group);
                ownerCt.insert(index, cols);
            }
        } else {
            // we probably have to expand/collapse all group columns
            cols = Ext.clone(me.pivotColumns);
            me.preparePivotColumns(cols);
            cols = me.prepareVisiblePivotColumns(cols);
            me.setColumns(cols);
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
            item = items[i];
            if (item.group == group) {
                ret.found = true;
                ret.index = i;
                ret.item = item;
            } else if (item.innerItems) {
                ret = this.getColumnForGroup(item.innerItems, group);
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
        me.getStore().removeAll(true);
        me.setColumns([]);
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
            this.setMasked({
                xtype: 'loadmask',
                indicator: true
            });
        }
    },
    /**
     * @private
     *
     */
    onMatrixProcessProgress: function(matrix, index, length) {
        var percent = ((index || 0.1) * 100) / (length || 0.1);
        if (this.enableLoadMask) {
            this.getMasked().setMessage(Ext.util.Format.number(percent, '0') + '%');
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
            topAxisCell = me.getTopAxisCellConfig(),
            leftItems = matrix.leftAxis.items.items,
            topItems = matrix.topAxis.items.items,
            i, len, item;
        if (me.enableLoadMask) {
            me.setMasked(false);
        }
        if (topAxisCell) {
            topAxisCell.zeroValue = matrix.showZeroAsBlank ? '' : '0';
        }
        if (!keepStates) {
            if (me.expandedItemsState) {
                len = leftItems.length;
                for (i = 0; i < len; i++) {
                    item = leftItems[i];
                    if (Ext.Array.indexOf(me.expandedItemsState['rows'], item.key) >= 0) {
                        item.expanded = true;
                        stateApplied = true;
                    }
                }
                len = topItems.length;
                for (i = 0; i < len; i++) {
                    item = topItems[i];
                    if (Ext.Array.indexOf(me.expandedItemsState['cols'], item.key) >= 0) {
                        item.expanded = true;
                        stateApplied = true;
                    }
                }
                if (stateApplied) {
                    cols = matrix.getColumnHeaders();
                    delete me.expandedItemsState;
                }
            } else {
                if (matrix.collapsibleRows) {
                    me.doExpandCollapseTree(matrix.leftAxis.getTree(), !me.startRowGroupsCollapsed);
                }
                if (matrix.collapsibleColumns) {
                    me.doExpandCollapseTree(matrix.topAxis.getTree(), !me.startColGroupsCollapsed);
                    cols = matrix.getColumnHeaders();
                }
            }
        }
        me.pivotColumns = Ext.clone(cols);
        cols = Ext.clone(me.pivotColumns);
        me.preparePivotColumns(cols);
        me.restorePivotColumnsState(cols);
        cols = me.prepareVisiblePivotColumns(cols);
        me.setColumns(cols);
        if (!Ext.isEmpty(me.sortedColumn)) {
            matrix.leftAxis.sortTreeByField(me.sortedColumn.dataIndex, me.sortedColumn.direction);
        }
        me.getStore().fireEvent('pivotstoreremodel', me);
        if (!Ext.isEmpty(me.sortedColumn)) {
            me.updateColumnSortState(me.sortedColumn.dataIndex, me.sortedColumn.direction);
        }
        me.lastColumnSorted = null;
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
            colCount = columns ? columns.length : 0,
            i, column;
        for (i = 0; i < colCount; i++) {
            column = columns[i];
            column.cls = column.cls || '';
            Ext.apply(column, defaultColConfig);
            if (column.leftAxis) {
                if (column.cell) {
                    Ext.applyIf(column.cell, Ext.clone(me.getLeftAxisCellConfig()));
                } else {
                    Ext.apply(column, {
                        cell: Ext.clone(me.getLeftAxisCellConfig())
                    });
                }
            } else if (column.topAxis) {
                if (column.cell) {
                    Ext.applyIf(column.cell, Ext.clone(me.getTopAxisCellConfig()));
                } else {
                    Ext.apply(column, {
                        cell: Ext.clone(me.getTopAxisCellConfig())
                    });
                }
            }
            if (column.subTotal) {
                column.cls = me.clsGroupTotal;
            }
            if (column.group && column.xgrouped) {
                if (column.group.expanded) {
                    if (!column.subTotal && this._matrix.collapsibleColumns) {
                        column.cls += (Ext.isEmpty(column.cls) ? '' : ' ') + me.groupHeaderCollapsibleCls;
                    }
                } else {
                    if (column.subTotal && this._matrix.collapsibleColumns) {
                        column.cls += (Ext.isEmpty(column.cls) ? '' : ' ') + me.groupHeaderCollapsibleCls + ' ' + me.groupHeaderCollapsedCls;
                    }
                }
                if (column.subTotal) {
                    column.text = column.group.expanded ? column.group.getTextTotal() : Ext.String.format('<div class="' + Ext.baseCSSPrefix + 'pivot-grid-group-icon ' + Ext.baseCSSPrefix + 'font-icon"></div>' + '<div class="' + this.groupCls + '">{0}</div>', column.group.name);
                } else if (column.group) {
                    column.text = Ext.String.format('<div class="' + Ext.baseCSSPrefix + 'pivot-grid-group-icon ' + Ext.baseCSSPrefix + 'font-icon"></div>' + '<div class="' + this.groupCls + '">{0}</div>', column.group.name);
                }
                column.xexpandable = column.subTotal ? !column.group.expanded : column.group.expanded;
                if ((!column.group.expanded && !column.subTotal) || (column.group.expanded && column.subTotal && this.getMatrix().colSubTotalsPosition == 'none')) {
                    column.hidden = true;
                }
            }
            if (column.grandTotal) {
                column.cls = me.clsGrandTotal;
            }
            if (Ext.isEmpty(column.columns)) {
                if (column.dimension) {
                    Ext.apply(column, {
                        renderer: column.dimension ? column.dimension.getRenderer() : false,
                        formatter: column.dimension ? column.dimension.getFormatter() : false,
                        scope: column.dimension ? column.dimension.scope : null,
                        align: column.dimension.align
                    });
                    if (column.dimension.flex > 0) {
                        column.flex = column.flex || column.dimension.flex;
                    } else {
                        column.width = column.width || column.dimension.width;
                    }
                    column.cell = Ext.merge(column.cell, column.dimension.cellConfig);
                }
                if (column.cell && column.cell.bind && !column.cell.viewModel) {
                    column.cell.bind = me.processBindKey(column.cell.bind, column.dataIndex);
                }
            } else {
                me.preparePivotColumns(column.columns);
            }
        }
    },
    processBindKey: function(value, dataIndex) {
        var keys, key, length, i, v;
        if (Ext.isString(value)) {
            v = value.replace('{column', '{columns.' + dataIndex);
            return v.replace('{value', '{record.' + dataIndex);
        } else if (Ext.isObject(value)) {
            keys = Ext.Object.getAllKeys(value);
        } else if (Ext.isArray(value)) {
            keys = value;
        }
        if (keys) {
            length = keys.length;
            for (i = 0; i < length; i++) {
                key = keys[i];
                value[key] = this.processBindKey(value[key], dataIndex);
            }
        }
        return value;
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
     * @since 6.5.0
     */
    setStore: function(store) {
        var matrix;
        if (!store || (store && store.$internal)) {
            // Cmd warns about this but we are calling the config-system
            // generated setter:
            // @noOptimize.callParent
            this.callParent([
                store
            ]);
        } else {
            matrix = this.getMatrix();
            if (matrix && matrix instanceof Ext.pivot.matrix.Local) {
                matrix.reconfigure({
                    store: store
                });
            }
        }
    },
    /**
     *
     * Find the top axis item key that maps to the specified grid column
     *
     * @param {Ext.grid.column.Column} column
     * @return {null/String}
     *
     * @private
     */
    getTopAxisKey: function(column) {
        var me = this,
            matrix = me.getMatrix(),
            columns = matrix.getColumns(),
            key = null,
            i;
        if (!column) {
            return null;
        }
        for (i = 0; i < columns.length; i++) {
            if (columns[i].name === column.getDataIndex()) {
                key = columns[i].col;
                break;
            }
        }
        return key;
    },
    /**
     * Returns the top axis item used to generate the specified column.
     *
     * @param {Ext.grid.column.Column} column
     */
    getTopAxisItem: function(column) {
        return this.getMatrix().topAxis.items.getByKey(this.getTopAxisKey(column));
    },
    /**
     * Returns the left axis item used to generate the specified record.
     *
     * @param {Ext.data.Model} record
     */
    getLeftAxisItem: function(record) {
        var info;
        if (!record) {
            return null;
        }
        info = this.pivotDataSource.storeInfo[record.internalId];
        return info ? this.getMatrix().leftAxis.items.getByKey(info.leftKey) : null;
    },
    getStateProperties: function() {
        return [
            'viewLayoutType',
            'rowSubTotalsPosition',
            'rowGrandTotalsPosition',
            'colSubTotalsPosition',
            'colGrandTotalsPosition',
            'aggregate',
            'leftAxis',
            'topAxis',
            'enableColumnSort',
            'sortedColumn'
        ];
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
        cols = me.getColumns();
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
    onChildTap: function(context) {
        this.handleRowEvent('tap', context.event);
        this.callParent([
            context
        ]);
    },
    onChildTapHold: function(context) {
        this.handleRowEvent('taphold', context.event);
        this.callParent([
            context
        ]);
    },
    onChildSingleTap: function(context) {
        this.handleRowEvent('singletap', context.event);
        this.callParent([
            context
        ]);
    },
    onChildDoubleTap: function(context) {
        this.handleRowEvent('doubletap', context.event);
        this.callParent([
            context
        ]);
    },
    handleRowEvent: function(type, e) {
        var cell = Ext.fly(e.getTarget(this.cellSelector)),
            navModel = this.getNavigationModel(),
            location;
        // the cell type might have been changed
        if (cell && cell.component && cell.component.handleEvent) {
            cell.component.handleEvent(type, e);
            if (navModel) {
                location = navModel.getLocation();
                if (location) {
                    location.refresh();
                }
            }
        }
    },
    handleColumnTap: function(header, column, e) {
        var me = this,
            newDirection;
        if (column.xexpandable) {
            this.handleHeaderGroupTap(header, column, e);
            return false;
        }
        if (!me.enableColumnSort) {
            return;
        }
        // The $axisSortDirection property is private
        // Pivot grid columns are sorted differently to regular grid columns.
        // All they have to store is the last sorted direction.
        newDirection = (column.$axisSortDirection === 'ASC') ? 'DESC' : 'ASC';
        if ((column.leftAxis || column.topAxis) && !Ext.isEmpty(column.getDataIndex())) {
            // sort the results when a dataIndex column was clicked
            if (me.getMatrix().leftAxis.sortTreeByField(column.getDataIndex(), newDirection)) {
                column.$axisSortDirection = newDirection;
                me.refreshView();
                me.updateSortIndicator(column, newDirection);
                e.stopEvent();
            }
        }
        return false;
    },
    updateSortIndicator: function(column, direction) {
        // for now we handle just one column sorting
        // TODO all left axis dimensions could be sorted and should be shown like this in the grid
        var last = this.lastColumnSorted;
        if (last) {
            // the sortDirection config is made available on the column via an override
            last.setSortState(null);
            if (column.topAxis && last.leftAxis) {
                last.$axisSortDirection = null;
            }
        }
        column.setSortState(direction);
        this.lastColumnSorted = column;
    },
    handleHeaderGroupTap: function(header, column, e) {
        if (column.xexpandable && this._matrix.collapsibleColumns) {
            e.stopEvent();
            this.doExpandCollapse('col', column.key);
        }
        return false;
    },
    isRTL: function() {
        if (Ext.isFunction(this.isLocalRtl)) {
            return this.isLocalRtl();
        }
        return false;
    },
    getRecordInfo: function(record) {
        return record ? this.pivotDataSource.storeInfo[record.internalId] : null;
    },
    onColumnRemove: function(container, column) {
        if (column === this.lastColumnSorted) {
            this.lastColumnSorted = null;
        }
        return this.callParent([
            container,
            column
        ]);
    },
    privates: {
        discardMeasureRow: true
    }
});

/**
 * This class is used for creating a configurator field component.
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.Column', {
    extend: 'Ext.dataview.ListItem',
    requires: [
        'Ext.pivot.plugin.configurator.Field'
    ],
    alias: 'widget.pivotconfigfield',
    userCls: Ext.baseCSSPrefix + 'pivot-grid-config-column',
    filteredCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-filter',
    ascSortIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-sort-asc',
    descSortIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-sort-desc',
    config: {
        deleteCmp: {
            xtype: 'component',
            cls: [
                Ext.baseCSSPrefix + 'pivot-grid-config-column-btn',
                Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-delete'
            ],
            docked: 'right',
            hidden: true
        },
        moveCmp: {
            xtype: 'component',
            cls: [
                Ext.baseCSSPrefix + 'pivot-grid-config-column-btn',
                Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-move'
            ],
            docked: 'left'
        },
        sortCmp: {
            xtype: 'component',
            cls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn',
            docked: 'right',
            hidden: true
        }
    },
    applyDeleteCmp: function(cmp, oldCmp) {
        if (cmp && !cmp.isComponent) {
            cmp = Ext.factory(cmp, Ext.Component, oldCmp);
        }
        return cmp;
    },
    updateDeleteCmp: function(cmp, oldCmp) {
        if (cmp) {
            this.add(cmp);
        }
        Ext.destroy(oldCmp);
    },
    applyMoveCmp: function(cmp, oldCmp) {
        if (cmp && !cmp.isComponent) {
            cmp = Ext.factory(cmp, Ext.Component, oldCmp);
        }
        return cmp;
    },
    updateMoveCmp: function(cmp, oldCmp) {
        if (cmp) {
            this.add(cmp);
        }
        Ext.destroy(oldCmp);
    },
    applySortCmp: function(cmp, oldCmp) {
        if (cmp && !cmp.isComponent) {
            cmp = Ext.factory(cmp, Ext.Component, oldCmp);
        }
        return cmp;
    },
    updateSortCmp: function(cmp, oldCmp) {
        if (cmp) {
            this.add(cmp);
        }
        Ext.destroy(oldCmp);
    },
    getField: function() {
        return this.getRecord().get('field');
    },
    updateRecord: function(record, oldRecord) {
        var me = this,
            innerElement = me.innerElement,
            settings, field;
        this.callParent([
            record,
            oldRecord
        ]);
        if (!record) {
            return;
        }
        if (oldRecord) {
            field = oldRecord.get('field');
            if (field) {
                settings = oldRecord.get('field').getSettings();
                me.resetStyle(innerElement, settings.getStyle());
                me.removeCls(settings.getCls());
            }
        }
        field = record.get('field');
        if (field) {
            settings = record.get('field').getSettings();
            // The custom settings style we add to the text component.
            // All button icons are in fact fonts so changing the font style in the list item
            // would affect all buttons not only the text component
            innerElement.setStyle(settings.getStyle());
            // The custom settings cls we add to the entire component
            // With classes you can control better what components to change
            me.addCls(settings.getCls());
            me.refreshData();
        }
    },
    refreshData: function() {
        var me = this,
            dCmp = me.getDeleteCmp(),
            record = me.getRecord(),
            field = record.get('field'),
            settings = field.getSettings(),
            dataView = me.dataview || me.getDataview(),
            container = dataView.getFieldType ? dataView : dataView.up('pivotconfigcontainer'),
            fieldType = container.getFieldType(),
            isFixed;
        if (fieldType !== 'all') {
            isFixed = settings.isFixed(container);
            dCmp.setHidden(isFixed);
        }
        record.set('text', field.getFieldText());
        me.updateSortCmpCls();
        me.updateFilterCls();
    },
    updateFilterCls: function() {
        var me = this,
            dataView = me.dataview || me.getDataview(),
            container = dataView.getFieldType ? dataView : dataView.up('pivotconfigcontainer'),
            fieldType = container.getFieldType();
        if (fieldType !== 'all') {
            if (me.getField().getFilter()) {
                me.addCls(me.filteredCls);
            } else {
                me.removeCls(me.filteredCls);
            }
        }
    },
    updateSortCmpCls: function() {
        var me = this,
            dataView = me.dataview || me.getDataview(),
            container = dataView.getFieldType ? dataView : dataView.up('pivotconfigcontainer'),
            fieldType = container.getFieldType(),
            field = me.getField(),
            sCmp = me.getSortCmp();
        if (fieldType === 'leftAxis' || fieldType === 'topAxis') {
            sCmp.show();
            sCmp.setUserCls('');
            if (field.getSortable()) {
                if (field.getDirection() === 'ASC') {
                    sCmp.setUserCls(me.ascSortIconCls);
                } else {
                    sCmp.setUserCls(me.descSortIconCls);
                }
            }
        } else {
            sCmp.hide();
        }
    },
    resetStyle: function(cmp, oldStyle) {
        var style = {},
            keys = Ext.Object.getAllKeys(oldStyle),
            len = keys.length,
            i;
        for (i = 0; i < len; i++) {
            style[keys[i]] = null;
        }
        cmp.setStyle(style);
    },
    onApplyFilterSettings: function(win, filter) {
        this.getField().setFilter(filter);
        this.updateFilterCls();
        this.applyChanges();
    },
    onRemoveFilter: function() {
        this.getField().setFilter(null);
        this.updateFilterCls();
        this.applyChanges();
    },
    /**
     * This is used for firing the 'configchange' event
     *
     */
    applyChanges: function() {
        var dataView = this.dataview || this.getDataView();
        if (dataView) {
            dataView.applyChanges();
        }
    }
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.DragZone', {
    extend: 'Ext.drag.Source',
    requires: [
        'Ext.drag.proxy.Placeholder'
    ],
    groups: 'pivotfields',
    proxy: {
        type: 'placeholder',
        cursorOffset: [
            -20,
            30
        ],
        placeholderCls: Ext.baseCSSPrefix + 'pivot-drag-proxy-placeholder',
        validCls: Ext.baseCSSPrefix + 'pivot-drag-proxy-placeholder-valid',
        invalidCls: Ext.baseCSSPrefix + 'pivot-drag-proxy-placeholder-invalid'
    },
    handle: '.' + Ext.baseCSSPrefix + 'listitem',
    platformConfig: {
        phone: {
            activateOnLongPress: true
        }
    },
    constructor: function(panel) {
        var list = panel.getList();
        this.panel = panel;
        this.list = list;
        this.callParent([
            {
                element: list.getScrollable().getElement()
            }
        ]);
    },
    onDragStart: function(info) {
        var item = Ext.fly(info.eventTarget).up(this.getHandle()),
            html = '<span class="x-pivot-drag-placeholder-icon">&nbsp;</span><span>{0}</span>',
            record;
        if (!item || !item.component) {
            return;
        }
        record = item.component.getRecord();
        info.setData('record', record);
        info.setData('sourceList', this.list);
        this.getProxy().setHtml(Ext.String.format(html, record.get('text')));
    }
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.DropZone', {
    extend: 'Ext.drag.Target',
    groups: 'pivotfields',
    leftIndicatorCls: Ext.baseCSSPrefix + 'pivot-grid-left-indicator',
    rightIndicatorCls: Ext.baseCSSPrefix + 'pivot-grid-right-indicator',
    listItemSelector: '.' + Ext.baseCSSPrefix + 'listitem',
    listSelector: '.' + Ext.baseCSSPrefix + 'list',
    constructor: function(panel) {
        var list = panel.getList();
        this.panel = panel;
        this.list = list;
        this.callParent([
            {
                element: list.getScrollable().getElement()
            }
        ]);
    },
    getLeftIndicator: function() {
        if (!this.leftIndicator) {
            this.self.prototype.leftIndicator = Ext.getBody().createChild({
                cls: this.leftIndicatorCls,
                html: "&#160;"
            });
            this.self.prototype.indicatorWidth = this.leftIndicator.dom.offsetWidth;
            this.self.prototype.indicatorOffset = Math.round(this.indicatorWidth / 2);
        }
        return this.leftIndicator;
    },
    getRightIndicator: function() {
        if (!this.rightIndicator) {
            this.self.prototype.rightIndicator = Ext.getBody().createChild({
                cls: this.rightIndicatorCls,
                html: "&#160;"
            });
        }
        return this.rightIndicator;
    },
    accepts: function(info) {
        var data = info.data,
            record = data.record,
            source = data.sourceList,
            target = this.panel,
            panel = target.up('pivotconfigpanel');
        if (!record) {
            return true;
        }
        if (!source.isXType('pivotconfigcontainer')) {
            source = source.up('pivotconfigcontainer');
        }
        return record.get('field').getSettings().isAllowed(target) && panel.isAllowed(source, target, data.record);
    },
    onDragMove: function(info) {
        if (info.valid) {
            this.positionIndicator(info);
        } else {
            this.hideIndicators();
        }
    },
    onDragLeave: function(info) {
        this.hideIndicators();
    },
    onDrop: function(info) {
        var data = info.data,
            source = data.sourceList,
            target = this.panel,
            panel = target.up('pivotconfigpanel');
        this.hideIndicators();
        if (!panel) {
            return;
        }
        if (!source.isXType('pivotconfigcontainer')) {
            source = source.up('pivotconfigcontainer');
        }
        panel.dragDropField(source, target, data.record, data.position);
    },
    positionIndicator: function(info) {
        var me = this,
            pos = -1,
            leftIndicator = me.getLeftIndicator(),
            rightIndicator = me.getRightIndicator(),
            indWidth = me.indicatorWidth,
            indOffset = me.indicatorOffset,
            el, item, leftXY, rightXY, minX, maxX, minY, maxY, leftAnchor, rightAnchor;
        el = me.getCursorElement(info, me.listItemSelector);
        if (el) {
            item = el.component;
            leftAnchor = 'tl';
            rightAnchor = 'tr';
            pos = item.$dataIndex;
        } else {
            leftAnchor = 'bl';
            rightAnchor = 'br';
            pos = me.list.getViewItems().length;
            item = me.list.getItemAt(pos - 1);
            if (item) {
                el = item.element;
            } else {
                el = me.getCursorElement(info, me.listSelector);
            }
        }
        leftXY = leftIndicator.getAlignToXY(el, leftAnchor);
        rightXY = rightIndicator.getAlignToXY(el, rightAnchor);
        leftXY[0] -= 1;
        rightXY[0] -= indWidth;
        if (leftAnchor === 'tl') {
            leftXY[1] -= indWidth;
            rightXY[1] -= indWidth;
        }
        minX = minY = -indOffset;
        minX += el.getX();
        maxX = minX + el.getWidth();
        minY += el.getY();
        maxY = minY + el.getHeight();
        leftXY[0] = Ext.Number.constrain(leftXY[0], minX, maxX);
        rightXY[0] = Ext.Number.constrain(rightXY[0], minX, maxX);
        leftXY[1] = Ext.Number.constrain(leftXY[1], minY, maxY);
        rightXY[1] = Ext.Number.constrain(rightXY[1], minY, maxY);
        leftIndicator.show();
        rightIndicator.show();
        leftIndicator.setXY(leftXY);
        rightIndicator.setXY(rightXY);
        info.setData('position', pos);
    },
    hideIndicators: function() {
        this.getLeftIndicator().hide();
        this.getRightIndicator().hide();
    },
    /**
     * Find the element that matches the cursor position and selector.
     *
     * @param info
     * @param {String} selector The simple selector to test. See {@link Ext.dom.Query} for information about simple selectors.
     * @param {Number/String/HTMLElement/Ext.dom.Element} [limit]
     * The max depth to search as a number or an element that causes the upward
     * traversal to stop and is **not** considered for inclusion as the result.
     * (defaults to 50 || document.documentElement)
     * @param {Boolean} [returnDom=false] True to return the DOM node instead of Ext.dom.Element
     * @return {Ext.dom.Element/HTMLElement} The matching DOM node (or HTMLElement if
     * _returnDom_ is _true_).  Or null if no match was found.
     */
    getCursorElement: function(info, selector, limit, returnDom) {
        var pos = info.cursor.current,
            elPoint = Ext.drag.Manager.elementFromPoint(pos.x, pos.y);
        return Ext.fly(elPoint).up(selector, limit, returnDom);
    }
});

/**
 * This is a container that holds configurator fields.
 */
Ext.define('Ext.pivot.plugin.configurator.Container', {
    extend: 'Ext.Panel',
    alias: 'widget.pivotconfigcontainer',
    requires: [
        'Ext.pivot.plugin.configurator.Column',
        'Ext.pivot.plugin.configurator.DragZone',
        'Ext.pivot.plugin.configurator.DropZone',
        'Ext.dataview.List'
    ],
    config: {
        /**
         * Possible values:
         *
         * - `all` = the container is the "all fields" area;
         * - `aggregate` = the container is the "values" area;
         * - `leftAxis` = the container is the "row values" area;
         * - `topAxis` = the container is the "column values" area;
         *
         */
        fieldType: 'all',
        emptyText: null,
        store: {
            type: 'array',
            fields: [
                {
                    name: 'text',
                    type: 'string'
                },
                {
                    name: 'field',
                    type: 'auto'
                }
            ]
        },
        list: {
            xclass: 'Ext.dataview.List',
            handleSorting: false,
            handleFiltering: false,
            isConfiguratorContainer: true,
            disableSelection: true,
            itemConfig: {
                xtype: 'pivotconfigfield'
            },
            deferEmptyText: false,
            touchAction: {
                panX: false,
                pinchZoom: false,
                doubleTapZoom: false
            },
            itemRipple: false
        }
    },
    layout: 'fit',
    initialize: function() {
        var me = this,
            list = me.getList();
        me.callParent();
        me.dragZone = new Ext.pivot.plugin.configurator.DragZone(me);
        me.dropZone = new Ext.pivot.plugin.configurator.DropZone(me);
        if (me.getFieldType() !== 'all') {
            list.element.on({
                delegate: '.' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn',
                tap: me.handleColumnBtnTap,
                scope: me
            });
            list.element.on({
                delegate: '.' + Ext.baseCSSPrefix + 'listitem-body-el',
                tap: me.handleColumnTap,
                scope: me
            });
        }
    },
    destroy: function() {
        Ext.destroyMembers(this, 'storeListeners', 'dragZone', 'dropZone');
        this.callParent();
    },
    updateFieldType: function(type) {
        if (type !== 'all') {
            this.setUserCls(Ext.baseCSSPrefix + 'pivot-grid-config-container');
        }
    },
    updateEmptyText: function(text) {
        var list = this.getList();
        if (list) {
            list.setEmptyText(text);
        }
    },
    applyList: function(list, oldList) {
        var store;
        if (list) {
            store = this.getStore();
            if (list.isComponent) {
                list.setStore(store);
            } else {
                list.store = store;
                list.emptyText = this.getEmptyText();
                list = Ext.factory(list, Ext.dataview.List, oldList);
            }
        }
        return list;
    },
    updateList: function(list) {
        if (list) {
            this.add(list);
        }
    },
    applyStore: function(store) {
        return Ext.Factory.store(store);
    },
    updateStore: function(store, oldStore) {
        var me = this;
        Ext.destroy(me.storeListeners);
        if (store) {
            me.storeListeners = store.on({
                datachanged: me.applyChanges,
                scope: me
            });
        }
    },
    /**
     * This is used for firing the 'configchange' event
     *
     */
    applyChanges: function() {
        if (this.getFieldType() !== 'all') {
            this.fireEvent('configchange', this);
        }
    },
    /**
     * This is used for adding a new config field to this container.
     *
     * @private
     */
    addField: function(config, pos) {
        var me = this,
            store = me.getStore(),
            fieldType = me.getFieldType(),
            cfg = {};
        config.isAggregate = (fieldType === 'aggregate');
        Ext.apply(cfg, {
            field: config,
            text: config.getFieldText()
        });
        if (pos >= 0) {
            store.insert(pos, cfg);
        } else {
            store.add(cfg);
        }
    },
    removeField: function(record) {
        this.getStore().remove(record);
        record.set('field', null);
    },
    moveField: function(record, pos) {
        var store = this.getStore(),
            index = store.indexOf(record);
        if (pos === -1 && index === store.getCount() - 1) {
            // nothing to do here;
            // the record is already on the last position in the store
            return;
        }
        store.remove(record);
        if (pos >= 0) {
            store.insert(pos, record);
        } else {
            store.add(record);
        }
    },
    handleColumnBtnTap: function(e) {
        var me = this,
            target = Ext.fly(e.currentTarget),
            item = target.up('.' + me.getList().baseCls + 'item').component,
            record = item.getRecord();
        if (!record) {
            return;
        }
        if (target.hasCls(Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-delete')) {
            me.fireEvent('removefield', me, item, record);
            return;
        }
        if (target.hasCls(Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-tools')) {
            me.fireEvent('toolsbtnpressed', me, item);
        }
    },
    handleColumnTap: function(e) {
        var me = this,
            target = Ext.fly(e.currentTarget),
            item = target.up('.' + me.getList().baseCls + 'item').component,
            record = item.getRecord();
        if (!record) {
            return;
        }
        me.fireEvent('toolsbtnpressed', me, item);
    }
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.PanelController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pivotconfigpanel',
    destroy: function() {
        var me = this;
        me.pivotListeners = me.matrixProperties = Ext.destroy(me.pivotListeners);
        me.callParent();
    },
    closeMe: function() {
        var view = this.getView();
        view.fireEvent('close', view);
    },
    cancelConfiguration: function() {
        this.refreshDimensions();
        this.matrixProperties = null;
        this.closeMe();
    },
    applyConfiguration: function() {
        this.applyChanges().then(function(controller) {
            controller.closeMe();
        });
    },
    showSettings: function() {
        var view = this.getView(),
            pivot = view.getPivot(),
            settings = pivot.getMatrix().serialize(),
            form = view.down('#settings');
        delete (settings.leftAxis);
        delete (settings.topAxis);
        delete (settings.aggregate);
        if (pivot.fireEvent('beforeshowpivotsettings', view, {
            container: form,
            settings: settings
        }) !== false) {
            view.setActiveItem(form);
            form.setMatrixProperties(settings);
            pivot.fireEvent('showpivotsettings', view, {
                container: form,
                settings: settings
            });
        }
    },
    backToMainView: function() {
        this.getView().setActiveItem('#main');
    },
    onPivotChanged: function(view, pivot) {
        var me = this;
        Ext.destroy(me.pivotListeners);
        if (pivot) {
            me.pivotListeners = pivot.getMatrix().on({
                done: me.onPivotDone,
                scope: me,
                destroyable: true
            });
        }
    },
    onFieldsChanged: function(view, fields) {
        if (!fields) {
            return;
        }
        this.refreshDimensions();
    },
    onBeforeApplyPivotSettings: function(form, settings) {
        var view = this.getView();
        return view.getPivot().fireEvent('beforeapplypivotsettings', view, {
            container: form,
            settings: settings
        });
    },
    onApplyPivotSettings: function(form, settings) {
        var view = this.getView();
        this.matrixProperties = settings;
        this.onConfigChanged();
        return view.getPivot().fireEvent('applypivotsettings', view, {
            container: form,
            settings: settings
        });
    },
    onBeforeApplyConfigFieldSettings: function(form, settings) {
        var view = this.getView();
        return view.getPivot().fireEvent('beforeapplyconfigfieldsettings', view, {
            container: form,
            settings: settings
        });
    },
    onApplyConfigFieldSettings: function(form, settings) {
        var view = this.getView();
        this.onConfigChanged();
        return view.getPivot().fireEvent('applyconfigfieldsettings', view, {
            container: form,
            settings: settings
        });
    },
    onConfigChanged: function() {
        this.configurationChanged = true;
    },
    showCard: function(container, item) {
        var view = this.getView(),
            pivot = view.getPivot(),
            settings = item.getField().getSettings(),
            form = view.down('#field'),
            dataAgg = [],
            store, field, i, len;
        if (pivot.fireEvent('beforeshowconfigfieldsettings', view, {
            container: form,
            settings: settings
        }) !== false) {
            view.setActiveItem(form);
            form.setFieldItem(item);
            store = this.getAggregateContainer().getStore();
            len = store.getCount();
            for (i = 0; i < len; i++) {
                field = store.getAt(i).get('field');
                dataAgg.push([
                    field.getHeader(),
                    field.getId()
                ]);
            }
            form.getViewModel().getStore('sDimensions').loadData(dataAgg);
            pivot.fireEvent('showconfigfieldsettings', view, {
                container: form,
                settings: settings
            });
        }
    },
    onRemoveField: function(fromContainer, item, record) {
        var view = this.getView();
        view.dragDropField(fromContainer, view.getAllFieldsContainer(), record);
    },
    refreshDimensions: function() {
        var me = this,
            view = me.getView(),
            pivot = view.getPivot(),
            matrix = pivot ? pivot.getMatrix() : null,
            fieldsTopCt, fieldsLeftCt, fieldsAggCt, fieldsAllCt, fieldsTop, fieldsLeft, fieldsAgg, fields;
        if (!matrix) {
            return;
        }
        me.internalReconfiguration = true;
        fieldsAllCt = me.getAllFieldsContainer();
        fieldsTopCt = me.getTopAxisContainer();
        fieldsLeftCt = me.getLeftAxisContainer();
        fieldsAggCt = me.getAggregateContainer();
        fieldsAllCt.getStore().removeAll();
        fieldsTopCt.getStore().removeAll();
        fieldsLeftCt.getStore().removeAll();
        fieldsAggCt.getStore().removeAll();
        fields = view.getFields().clone();
        fieldsTop = me.getConfigFields(matrix.topAxis.dimensions.getRange());
        fieldsLeft = me.getConfigFields(matrix.leftAxis.dimensions.getRange());
        fieldsAgg = me.getConfigFields(matrix.aggregate.getRange());
        // the "All fields" will always contain all available fields (both defined on the plugin and existing in the matrix configuration)
        me.addFieldsToConfigurator(fields.getRange(), fieldsAllCt);
        me.addFieldsToConfigurator(fieldsTop, fieldsTopCt);
        me.addFieldsToConfigurator(fieldsLeft, fieldsLeftCt);
        me.addFieldsToConfigurator(fieldsAgg, fieldsAggCt);
        me.internalReconfiguration = false;
    },
    /**
     * Listener for the 'pivotdone' event. Initialize configurator fields or restore last field focus.
     *
     * @private
     */
    onPivotDone: function() {
        if (this.internalReconfiguration) {
            this.internalReconfiguration = false;
        } else {
            this.refreshDimensions();
        }
    },
    /**
     * Collect configurator changes and reconfigure the pivot component
     *
     * @private
     */
    reconfigurePivot: function(resolve, reject) {
        var me = this,
            view = me.getView(),
            pivot = view.getPivot(),
            obj = {
                topAxis: me.getFieldsFromContainer(me.getTopAxisContainer(), true),
                leftAxis: me.getFieldsFromContainer(me.getLeftAxisContainer(), true),
                aggregate: me.getFieldsFromContainer(me.getAggregateContainer(), true)
            };
        Ext.apply(obj, me.matrixProperties);
        me.internalReconfiguration = true;
        if (pivot.fireEvent('beforeconfigchange', view, obj) !== false) {
            pivot.getMatrix().reconfigure(obj);
            pivot.fireEvent('configchange', view, obj);
        }
        resolve(me);
    },
    /**
     * Returns the container that stores all unused fields.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getAllFieldsContainer: function() {
        return this.lookupReference('fieldsCt');
    },
    /**
     * Returns the container that stores all fields configured on the left axis.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getLeftAxisContainer: function() {
        return this.lookupReference('fieldsLeftCt');
    },
    /**
     * Returns the container that stores all fields configured on the top axis.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getTopAxisContainer: function() {
        return this.lookupReference('fieldsTopCt');
    },
    /**
     * Returns the container that stores all fields configured on the aggregate.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getAggregateContainer: function() {
        return this.lookupReference('fieldsAggCt');
    },
    /**
     * Apply configurator changes to the pivot component.
     *
     * This function will trigger the delayed task which is actually reconfiguring the pivot component
     * with the new configuration.
     *
     * @return {Ext.Promise}
     */
    applyChanges: function() {
        var me = this;
        return new Ext.Promise(function(resolve, reject) {
            var view = me.getView();
            if (me.configurationChanged) {
                me.configurationChanged = false;
                if (view.isHidden() || me.internalReconfiguration) {
                    // if the plugin is disabled don't do anything
                    reject(me);
                    return;
                }
                Ext.asap(me.reconfigurePivot, me, [
                    resolve,
                    reject
                ]);
            } else {
                resolve(me);
            }
        });
    },
    /**
     * This function is used to retrieve all configured fields in a fields container.
     *
     * @private
     */
    getFieldsFromContainer: function(ct, justConfigs) {
        var store = ct.getStore(),
            len = store.getCount(),
            fields = [],
            i, item;
        for (i = 0; i < len; i++) {
            item = store.getAt(i).get('field');
            fields.push(justConfigs === true ? item.getConfiguration() : item);
        }
        return fields;
    },
    /**
     * Easy function for assigning fields to a container.
     *
     * @private
     */
    addFieldsToConfigurator: function(fields, fieldsCt) {
        var len = fields.length,
            i;
        fieldsCt.getStore().removeAll();
        for (i = 0; i < len; i++) {
            fieldsCt.addField(fields[i], -1);
        }
        fieldsCt.getList().refresh();
    },
    /**
     * Build the fields array for each container by parsing all given fields or from the pivot config.
     *
     * @private
     */
    getConfigFields: function(items) {
        var len = items.length,
            fields = this.getView().getFields(),
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
    }
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.model.Select', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: 'text',
            type: 'string'
        },
        {
            name: 'value',
            type: 'auto'
        },
        {
            name: 'type',
            type: 'integer'
        }
    ]
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.store.Select', {
    extend: 'Ext.data.ArrayStore',
    alias: 'store.pivotselect',
    model: 'Ext.pivot.plugin.configurator.model.Select'
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.FormController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pivotconfigform',
    init: function(view) {
        var viewModel = this.getViewModel();
        viewModel.getStore('sSorters').loadData([
            [
                view.sortClearText,
                'none'
            ],
            [
                view.sortAscText,
                'ASC'
            ],
            [
                view.sortDescText,
                'DESC'
            ]
        ]);
        viewModel.getStore('sFilters').loadData([
            [
                view.clearFilterText,
                'none'
            ],
            [
                view.labelFiltersText,
                'label'
            ],
            [
                view.valueFiltersText,
                'value'
            ],
            [
                view.top10FiltersText,
                'top10'
            ]
        ]);
        viewModel.getStore('sTopOrder').loadData([
            [
                view.topOrderTopText,
                'top'
            ],
            [
                view.topOrderBottomText,
                'bottom'
            ]
        ]);
        viewModel.getStore('sTopType').loadData([
            [
                view.topTypeItemsText,
                'items'
            ],
            [
                view.topTypePercentText,
                'percent'
            ],
            [
                view.topTypeSumText,
                'sum'
            ]
        ]);
        viewModel.getStore('sAlign').loadData([
            [
                view.alignLeftText,
                'left'
            ],
            [
                view.alignCenterText,
                'center'
            ],
            [
                view.alignRightText,
                'right'
            ]
        ]);
        viewModel.set('labelFilterText', view.labelFilterText);
        viewModel.set('valueFilterText', view.valueFilterText);
        viewModel.set('requiredMessage', view.requiredFieldText);
    },
    applySettings: function() {
        var vm = this.getViewModel(),
            view = this.getView(),
            fieldItem = view.getFieldItem(),
            field = fieldItem.getField(),
            cfg = Ext.clone(vm.get('form')),
            item, store, sort, filter, filterType;
        if (!view.isValid()) {
            return;
        }
        if (cfg.align && cfg.align.isModel) {
            cfg.align = cfg.align.get('value');
        }
        if (field.isAggregate) {
            if (cfg.formatter && cfg.formatter.isModel) {
                item = cfg.formatter;
            } else {
                store = vm.getStore('sFormatters');
                item = store.findRecord('value', cfg.formatter, 0, false, true, true);
            }
            if (item) {
                if (item.get('type') == 1) {
                    cfg.formatter = item.get('value');
                    cfg.renderer = null;
                } else {
                    cfg.renderer = item.get('value');
                    cfg.formatter = null;
                }
            }
            if (cfg.aggregator && cfg.aggregator.isModel) {
                cfg.aggregator = cfg.aggregator.get('value');
            }
        } else {
            sort = cfg.direction;
            if (sort && sort.isModel) {
                sort = sort.get('value');
            }
            cfg.sortable = (sort !== 'none');
            cfg.direction = sort || 'ASC';
            filter = cfg.filter;
            filterType = filter.type.isModel ? filter.type.get('value') : filter.type;
            if (!filter || !filter.type || filterType === 'none') {
                filter = null;
            } else {
                filter.type = filterType;
                if (filter.operator && filter.operator.isModel) {
                    filter.operator = filter.operator.get('value');
                }
                if (filter.dimensionId && filter.dimensionId.isModel) {
                    filter.dimensionId = filter.dimensionId.get('value');
                }
                if (filter.topType && filter.topType.isModel) {
                    filter.topType = filter.topType.get('value');
                }
                if (filter.topOrder && filter.topOrder.isModel) {
                    filter.topOrder = filter.topOrder.get('value');
                }
                if (filter.type === 'top10') {
                    filter.type = 'value';
                    filter.operator = 'top10';
                }
                if (filter.operator === 'between' || filter.operator === 'not between') {
                    filter.value = [
                        filter.from,
                        filter.to
                    ];
                }
                delete (filter.from);
                delete (filter.to);
                if (filter.type === 'label') {
                    delete (filter.dimensionId);
                    delete (filter.topSort);
                    delete (filter.topType);
                    delete (filter.topOrder);
                }
            }
            cfg.filter = filter;
        }
        if (view.fireEvent('beforeapplyconfigfieldsettings', view, cfg) !== false) {
            field.setConfig(cfg);
            fieldItem.refreshData();
            view.fireEvent('applyconfigfieldsettings', view, cfg);
            this.cancelSettings();
        }
    },
    cancelSettings: function() {
        var view = this.getView();
        view.setFieldItem(null);
        view.fireEvent('close', view);
    },
    onFieldItemChanged: function(view, fieldItem) {
        var viewModel = this.getViewModel(),
            form = {},
            dataFormatters = [],
            dataAggregators = [],
            field, settings, formatters, renderers, fns, length, i, list, data, filter, format;
        if (!fieldItem) {
            viewModel.set('form', form);
            return;
        }
        field = fieldItem.getField();
        data = field.getConfig();
        Ext.apply(form, {
            dataIndex: data.dataIndex,
            header: data.header
        });
        if (field.isAggregate) {
            settings = field.getSettings();
            formatters = settings.getFormatters();
            renderers = settings.getRenderers();
            fns = settings.getAggregators();
            length = fns.length;
            for (i = 0; i < length; i++) {
                dataAggregators.push([
                    field.getAggText(fns[i]),
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
            viewModel.getStore('sFormatters').loadData(dataFormatters);
            viewModel.getStore('sAggregators').loadData(dataAggregators);
            format = data.formatter;
            if (Ext.isFunction(format)) {
                format = null;
            }
            if (!format && !Ext.isFunction(data.renderer)) {
                format = data.renderer;
            }
            Ext.apply(form, {
                formatter: format,
                aggregator: data.aggregator,
                align: data.align
            });
        } else {
            filter = data.filter;
            Ext.apply(form, {
                direction: (data.sortable ? data.direction : 'none'),
                filter: {
                    type: (filter ? (filter.type === 'value' && filter.operator === 'top10' ? 'top10' : filter.type) : 'none'),
                    operator: (filter ? (filter.type === 'value' && filter.operator === 'top10' ? 'top10' : filter.operator) : null),
                    value: (filter ? filter.value : null),
                    from: (filter ? (Ext.isArray(filter.value) ? filter.value[0] : null) : null),
                    to: (filter ? (Ext.isArray(filter.value) ? filter.value[1] : null) : null),
                    caseSensitive: (filter ? filter.caseSensitive : false),
                    topSort: (filter ? filter.topSort : false),
                    topOrder: (filter ? filter.topOrder : false),
                    topType: (filter ? filter.topType : false),
                    dimensionId: (filter ? filter.dimensionId : null)
                }
            });
        }
        viewModel.set('form', form);
    },
    prepareOperators: function(type) {
        var me = this.getView(),
            viewModel = this.getViewModel(),
            data;
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
        if (type === 'label') {
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
        }
        viewModel.getStore('sOperators').loadData(data);
    },
    onChangeFilterType: function(combo, record) {
        var type = record && record.isModel ? record.get('value') : record;
        if (type === 'label' || type === 'value') {
            this.prepareOperators(type);
        }
    }
});

/**
 * This class implements the form that allows changing the field settings.
 */
Ext.define('Ext.pivot.plugin.configurator.Form', {
    extend: 'Ext.form.Panel',
    requires: [
        'Ext.pivot.plugin.configurator.store.Select',
        'Ext.pivot.plugin.configurator.FormController',
        'Ext.form.FieldSet',
        'Ext.field.Toggle',
        'Ext.field.Select',
        'Ext.field.Radio',
        'Ext.field.Text',
        'Ext.field.Hidden',
        'Ext.layout.VBox',
        'Ext.layout.HBox',
        'Ext.TitleBar'
    ],
    xtype: 'pivotconfigform',
    controller: 'pivotconfigform',
    viewModel: {
        stores: {
            sFormatters: {
                type: 'pivotselect'
            },
            sAggregators: {
                type: 'pivotselect'
            },
            sSorters: {
                type: 'pivotselect'
            },
            sFilters: {
                type: 'pivotselect'
            },
            sOperators: {
                type: 'pivotselect'
            },
            sTopOrder: {
                type: 'pivotselect'
            },
            sTopType: {
                type: 'pivotselect'
            },
            sDimensions: {
                type: 'pivotselect'
            },
            sAlign: {
                type: 'pivotselect'
            }
        },
        data: {
            requiredMessage: null,
            labelFilterText: null,
            valueFilterText: null
        },
        formulas: {
            filterType: {
                bind: {
                    bindTo: '{form.filter.type}',
                    deep: true
                },
                get: function(record) {
                    return record && record.isModel ? record.get('value') : record;
                }
            },
            filterOperator: {
                bind: {
                    bindTo: '{form.filter.operator}',
                    deep: true
                },
                get: function(record) {
                    return record && record.isModel ? record.get('value') : record;
                }
            },
            filterOperatorValue: {
                bind: '{filterCommon && !(filterOperator === "between" || filterOperator === "not between")}',
                get: function(v) {
                    return v;
                }
            },
            filterOperatorBetween: {
                bind: '{filterCommon && (filterOperator === "between" || filterOperator === "not between")}',
                get: function(v) {
                    return v;
                }
            },
            filterCommon: {
                bind: '{filterType === "label" || filterType === "value"}',
                get: function(v) {
                    return v;
                }
            },
            filterLabel: {
                bind: '{filterType === "label"}',
                get: function(v) {
                    return v;
                }
            },
            filterValue: {
                bind: '{filterType === "value"}',
                get: function(v) {
                    return v;
                }
            },
            filterTop10: {
                bind: '{filterType === "top10"}',
                get: function(v) {
                    return v;
                }
            }
        }
    },
    eventedConfig: {
        fieldItem: null,
        title: null
    },
    listeners: {
        fielditemchange: 'onFieldItemChanged'
    },
    defaults: {
        xtype: 'fieldset',
        defaults: {
            labelAlign: 'top'
        }
    },
    showAnimation: {
        type: 'slideIn',
        duration: 250,
        easing: 'ease-out',
        direction: 'left'
    },
    /**
     * @cfg
     * @inheritdoc
     */
    hideAnimation: {
        type: 'slideOut',
        duration: 250,
        easing: 'ease-in',
        direction: 'right'
    },
    okText: 'Ok',
    cancelText: 'Cancel',
    formatText: 'Format as',
    summarizeByText: 'Summarize by',
    customNameText: 'Custom name',
    sourceNameText: 'The source name for this field is "{form.dataIndex}"',
    sortText: 'Sort',
    filterText: 'Filter',
    sortResultsText: 'Sort results',
    alignText: 'Align',
    alignLeftText: 'Left',
    alignCenterText: 'Center',
    alignRightText: 'Right',
    caseSensitiveText: 'Case sensitive',
    valueText: 'Value',
    fromText: 'From',
    toText: 'To',
    labelFilterText: 'Show items for which the label',
    valueFilterText: 'Show items for which',
    top10FilterText: 'Show',
    sortAscText: 'Sort A to Z',
    sortDescText: 'Sort Z to A',
    sortClearText: 'Disable sorting',
    clearFilterText: 'Disable filtering',
    labelFiltersText: 'Label filters',
    valueFiltersText: 'Value filters',
    top10FiltersText: 'Top 10 filters',
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
    topOrderTopText: 'Top',
    topOrderBottomText: 'Bottom',
    topTypeItemsText: 'Items',
    topTypePercentText: 'Percent',
    topTypeSumText: 'Sum',
    requiredFieldText: 'This field is required',
    operatorText: 'Operator',
    dimensionText: 'Dimension',
    orderText: 'Order',
    typeText: 'Type',
    updateFieldItem: function(item) {
        var me = this,
            items, field;
        me.removeAll(true, true);
        if (!item) {
            return;
        }
        field = item.getField();
        items = [
            {
                xtype: 'titlebar',
                docked: 'top',
                titleAlign: 'left',
                bind: {
                    title: '{form.header}'
                },
                items: [
                    {
                        text: me.cancelText,
                        align: 'right',
                        ui: 'alt',
                        handler: 'cancelSettings'
                    },
                    {
                        text: me.okText,
                        align: 'right',
                        ui: 'alt',
                        handler: 'applySettings',
                        margin: '0 0 0 5'
                    }
                ]
            },
            {
                bind: {
                    instructions: me.sourceNameText
                },
                items: [
                    {
                        label: me.customNameText,
                        xtype: 'textfield',
                        name: 'header',
                        required: true,
                        requiredMessage: me.requiredFieldText,
                        bind: '{form.header}'
                    }
                ]
            }
        ];
        if (field.isAggregate) {
            items.push({
                items: [
                    {
                        label: me.alignText,
                        xtype: 'selectfield',
                        autoSelect: false,
                        useClearIcon: true,
                        name: 'align',
                        bind: {
                            store: '{sAlign}',
                            value: '{form.align}'
                        }
                    },
                    {
                        label: me.formatText,
                        xtype: 'selectfield',
                        autoSelect: false,
                        useClearIcon: true,
                        name: 'formatter',
                        bind: {
                            store: '{sFormatters}',
                            value: '{form.formatter}'
                        }
                    },
                    {
                        label: me.summarizeByText,
                        xtype: 'selectfield',
                        autoSelect: false,
                        useClearIcon: true,
                        name: 'aggregator',
                        bind: {
                            store: '{sAggregators}',
                            value: '{form.aggregator}'
                        }
                    }
                ]
            });
        } else {
            items.push({
                xtype: 'fieldset',
                items: [
                    {
                        label: me.sortText,
                        labelAlign: 'top',
                        xtype: 'selectfield',
                        autoSelect: false,
                        useClearIcon: true,
                        name: 'sort',
                        bind: {
                            store: '{sSorters}',
                            value: '{form.direction}'
                        }
                    },
                    {
                        label: me.filterText,
                        labelAlign: 'top',
                        xtype: 'selectfield',
                        autoSelect: false,
                        useClearIcon: true,
                        name: 'filter',
                        bind: {
                            store: '{sFilters}',
                            value: '{form.filter.type}'
                        },
                        listeners: {
                            change: 'onChangeFilterType'
                        }
                    }
                ]
            }, {
                defaults: {
                    labelAlign: 'top'
                },
                bind: {
                    hidden: '{!filterCommon}',
                    title: '{filterLabel ? labelFilterText : valueFilterText}'
                },
                items: [
                    {
                        xtype: 'selectfield',
                        autoSelect: false,
                        placeholder: me.dimensionText,
                        name: 'dimensionId',
                        bind: {
                            store: '{sDimensions}',
                            value: '{form.filter.dimensionId}',
                            hidden: '{!filterValue}',
                            required: '{filterValue}',
                            requiredMessage: '{filterValue ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'selectfield',
                        autoSelect: false,
                        placeholder: me.operatorText,
                        name: 'operator',
                        bind: {
                            store: '{sOperators}',
                            value: '{form.filter.operator}',
                            required: '{filterCommon}',
                            requiredMessage: '{filterCommon ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'textfield',
                        placeholder: me.valueText,
                        name: 'value',
                        bind: {
                            value: '{form.filter.value}',
                            hidden: '{filterOperatorBetween}',
                            required: '{filterOperatorValue}',
                            requiredMessage: '{filterOperatorValue ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'textfield',
                        placeholder: me.fromText,
                        name: 'from',
                        bind: {
                            value: '{form.filter.from}',
                            hidden: '{filterOperatorValue}',
                            required: '{filterOperatorBetween}',
                            requiredMessage: '{filterOperatorBetween ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'textfield',
                        placeholder: me.toText,
                        name: 'to',
                        bind: {
                            value: '{form.filter.to}',
                            hidden: '{filterOperatorValue}',
                            required: '{filterOperatorBetween}',
                            requiredMessage: '{filterOperatorBetween ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'togglefield',
                        label: me.caseSensitiveText,
                        name: 'caseSensitive',
                        bind: '{form.filter.caseSensitive}'
                    }
                ]
            }, {
                xtype: 'fieldset',
                title: me.top10FilterText,
                defaults: {
                    labelAlign: 'top'
                },
                bind: {
                    hidden: '{!filterTop10}'
                },
                items: [
                    {
                        xtype: 'selectfield',
                        autoSelect: false,
                        placeholder: me.orderText,
                        name: 'topOrder',
                        bind: {
                            store: '{sTopOrder}',
                            value: '{form.filter.topOrder}',
                            required: '{filterTop10}',
                            requiredMessage: '{filterTop10 ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'textfield',
                        placeholder: me.valueText,
                        name: 'topValue',
                        bind: {
                            value: '{form.filter.value}',
                            required: '{filterTop10}',
                            requiredMessage: '{filterTop10 ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'selectfield',
                        autoSelect: false,
                        placeholder: me.typeText,
                        name: 'topType',
                        bind: {
                            store: '{sTopType}',
                            value: '{form.filter.topType}',
                            required: '{filterTop10}',
                            requiredMessage: '{filterTop10 ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'selectfield',
                        autoSelect: false,
                        placeholder: me.dimensionText,
                        name: 'topDimensionId',
                        bind: {
                            store: '{sDimensions}',
                            value: '{form.filter.dimensionId}',
                            required: '{filterTop10}',
                            requiredMessage: '{filterTop10 ? requiredMessage : null}'
                        }
                    },
                    {
                        xtype: 'togglefield',
                        label: me.sortResultsText,
                        name: 'topSort',
                        bind: '{form.filter.topSort}'
                    }
                ]
            });
        }
        me.add(items);
    }
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.SettingsController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pivotsettings',
    init: function(view) {
        var viewModel = this.getViewModel();
        viewModel.getStore('sLayout').loadData([
            [
                view.outlineLayoutText,
                'outline'
            ],
            [
                view.compactLayoutText,
                'compact'
            ],
            [
                view.tabularLayoutText,
                'tabular'
            ]
        ]);
        viewModel.getStore('sPositions').loadData([
            [
                view.firstPositionText,
                'first'
            ],
            [
                view.hidePositionText,
                'none'
            ],
            [
                view.lastPositionText,
                'last'
            ]
        ]);
        viewModel.getStore('sYesNo').loadData([
            [
                view.yesText,
                true
            ],
            [
                view.noText,
                false
            ]
        ]);
    },
    applySettings: function() {
        var vm = this.getViewModel(),
            view = this.getView(),
            cfg = Ext.clone(vm.get('form')),
            name;
        for (name in cfg) {
            if (cfg[name] && cfg[name].isModel) {
                cfg[name] = cfg[name].get('value');
            }
        }
        if (view.fireEvent('beforeapplypivotsettings', view, cfg) !== false) {
            view.fireEvent('applypivotsettings', view, cfg);
            this.cancelSettings();
        }
    },
    cancelSettings: function() {
        var view = this.getView();
        view.setMatrixProperties(null);
        view.fireEvent('close', view);
    },
    onMatrixPropertiesChanged: function(view, properties) {
        this.getViewModel().set('form', properties);
    }
});

/**
 * This class implements the form that allows changing the pivot matrix settings.
 */
Ext.define('Ext.pivot.plugin.configurator.Settings', {
    extend: 'Ext.form.Panel',
    requires: [
        'Ext.pivot.plugin.configurator.store.Select',
        'Ext.pivot.plugin.configurator.SettingsController',
        'Ext.form.FieldSet',
        'Ext.field.Select',
        'Ext.layout.VBox',
        'Ext.layout.HBox',
        'Ext.TitleBar'
    ],
    xtype: 'pivotsettings',
    controller: 'pivotsettings',
    viewModel: {
        stores: {
            sLayout: {
                type: 'pivotselect'
            },
            sPositions: {
                type: 'pivotselect'
            },
            sYesNo: {
                type: 'pivotselect'
            }
        }
    },
    eventedConfig: {
        matrixProperties: null
    },
    listeners: {
        matrixpropertieschange: 'onMatrixPropertiesChanged'
    },
    defaults: {
        xtype: 'fieldset',
        defaults: {
            labelAlign: 'top'
        }
    },
    showAnimation: {
        type: 'slideIn',
        duration: 250,
        easing: 'ease-out',
        direction: 'left'
    },
    /**
     * @cfg
     * @inheritdoc
     */
    hideAnimation: {
        type: 'slideOut',
        duration: 250,
        easing: 'ease-in',
        direction: 'right'
    },
    titleText: 'Settings',
    okText: 'Ok',
    cancelText: 'Cancel',
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
    updateMatrixProperties: function(settings) {
        var me = this,
            items;
        me.removeAll(true, true);
        if (!settings) {
            return;
        }
        items = [
            {
                xtype: 'titlebar',
                docked: 'top',
                titleAlign: 'left',
                title: me.titleText,
                items: [
                    {
                        text: me.cancelText,
                        align: 'right',
                        ui: 'alt',
                        handler: 'cancelSettings'
                    },
                    {
                        text: me.okText,
                        align: 'right',
                        ui: 'alt',
                        handler: 'applySettings',
                        margin: '0 0 0 5'
                    }
                ]
            },
            {
                label: me.layoutText,
                xtype: 'selectfield',
                autoSelect: false,
                useClearIcon: true,
                name: 'viewLayoutType',
                bind: {
                    store: '{sLayout}',
                    value: '{form.viewLayoutType}'
                }
            },
            {
                label: me.rowSubTotalPositionText,
                xtype: 'selectfield',
                autoSelect: false,
                useClearIcon: true,
                name: 'rowSubTotalsPosition',
                bind: {
                    store: '{sPositions}',
                    value: '{form.rowSubTotalsPosition}'
                }
            },
            {
                label: me.columnSubTotalPositionText,
                xtype: 'selectfield',
                autoSelect: false,
                useClearIcon: true,
                name: 'colSubTotalsPosition',
                bind: {
                    store: '{sPositions}',
                    value: '{form.colSubTotalsPosition}'
                }
            },
            {
                label: me.rowTotalPositionText,
                xtype: 'selectfield',
                autoSelect: false,
                useClearIcon: true,
                name: 'rowGrandTotalsPosition',
                bind: {
                    store: '{sPositions}',
                    value: '{form.rowGrandTotalsPosition}'
                }
            },
            {
                label: me.columnTotalPositionText,
                xtype: 'selectfield',
                autoSelect: false,
                useClearIcon: true,
                name: 'colGrandTotalsPosition',
                bind: {
                    store: '{sPositions}',
                    value: '{form.colGrandTotalsPosition}'
                }
            },
            {
                label: me.showZeroAsBlankText,
                xtype: 'selectfield',
                autoSelect: false,
                useClearIcon: true,
                name: 'showZeroAsBlank',
                bind: {
                    store: '{sYesNo}',
                    value: '{form.showZeroAsBlank}'
                }
            }
        ];
        me.add(items);
    }
});

/**
 * This class implements the configurator panel.
 */
Ext.define('Ext.pivot.plugin.configurator.Panel', {
    extend: 'Ext.Panel',
    requires: [
        'Ext.pivot.plugin.configurator.Container',
        'Ext.pivot.plugin.configurator.DragZone',
        'Ext.pivot.plugin.configurator.DropZone',
        'Ext.pivot.plugin.configurator.PanelController',
        'Ext.pivot.plugin.configurator.Form',
        'Ext.pivot.plugin.configurator.Settings',
        'Ext.layout.HBox',
        'Ext.layout.VBox',
        'Ext.layout.Card',
        'Ext.TitleBar',
        'Ext.Promise'
    ],
    alias: 'widget.pivotconfigpanel',
    controller: 'pivotconfigpanel',
    isPivotConfigPanel: true,
    cls: Ext.baseCSSPrefix + 'pivot-grid-config-panel',
    showAnimation: {
        type: 'slideIn',
        duration: 250,
        easing: 'ease-out',
        direction: 'left'
    },
    hideAnimation: {
        type: 'slideOut',
        duration: 250,
        easing: 'ease-in',
        direction: 'right'
    },
    panelTitle: 'Configuration',
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
    cancelText: 'Cancel',
    okText: 'Done',
    eventedConfig: {
        pivot: null,
        fields: null
    },
    listeners: {
        pivotchange: 'onPivotChanged',
        fieldschange: 'onFieldsChanged'
    },
    layout: 'card',
    initialize: function() {
        this.setup();
        return this.callParent();
    },
    /**
     * This function either moves or copies the dragged field from one container to another.
     *
     * @param {Ext.pivot.plugin.configurator.Container} fromContainer
     * @param {Ext.pivot.plugin.configurator.Container} toContainer
     * @param {Ext.data.Model} record
     * @param {String} newPos New index position
     *
     * @private
     */
    dragDropField: function(fromContainer, toContainer, record, newPos) {
        var me = this,
            pivot = me.getPivot(),
            field = record.get('field'),
            fromFieldType = fromContainer.getFieldType(),
            toFieldType = toContainer.getFieldType(),
            controller = me.getController(),
            topAxisCt = controller.getTopAxisContainer(),
            leftAxisCt = controller.getLeftAxisContainer(),
            item;
        if (pivot.fireEvent('beforemoveconfigfield', this, {
            fromContainer: fromContainer,
            toContainer: toContainer,
            field: field
        }) !== false) {
            if (fromContainer != toContainer) {
                if (toFieldType === 'all') {
                    // source is "Row labels"/"Column labels"/"Values"
                    // destination is "All fields"
                    // we just remove the field from the source
                    fromContainer.removeField(record);
                } else if (toFieldType === 'aggregate') {
                    // source is "Row labels"/"Column labels"/"All fields"
                    // destination is "Values"
                    // we copy the field to destination
                    toContainer.addField(field, newPos);
                    if (fromFieldType !== 'all') {
                        // remove the field from the left/top axis
                        fromContainer.removeField(record);
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
                        fromContainer = item ? topAxisCt : fromContainer;
                    } else {
                        item = me.findFieldInContainer(field, leftAxisCt);
                        fromContainer = item ? leftAxisCt : fromContainer;
                    }
                    // If so, move it here.
                    if (item) {
                        fromContainer.removeField(item);
                        toContainer.addField(field);
                    } else {
                        if (fromFieldType === 'aggregate') {
                            // we need to remove the dragged field because it was found on one of the axis
                            fromContainer.removeField(record);
                        }
                        toContainer.addField(field, newPos);
                    }
                }
            } else {
                toContainer.moveField(record, newPos);
            }
        }
    },
    isAllowed: function(fromContainer, toContainer, record) {
        var allowed = true,
            field = record.get('field'),
            fromFieldType = fromContainer && fromContainer.getFieldType(),
            toFieldType = toContainer && toContainer.getFieldType();
        if (fromFieldType === 'aggregate' && (toFieldType === 'leftAxis' || toFieldType === 'topAxis')) {
            allowed = !this.findFieldInContainer(field, toContainer);
        }
        return allowed;
    },
    /**
     *
     * @param {Ext.pivot.plugin.configurator.Field} field
     * @param {Ext.pivot.plugin.configurator.Container} container
     * @return {Ext.data.Model}
     *
     * @private
     */
    findFieldInContainer: function(field, container) {
        var store = container.getStore(),
            length = store.getCount(),
            i, item;
        for (i = 0; i < length; i++) {
            item = store.getAt(i);
            if (item.get('field').getDataIndex() == field.getDataIndex()) {
                return item;
            }
        }
    },
    setup: function() {
        var me = this,
            listeners = {
                configchange: 'onConfigChanged',
                toolsbtnpressed: 'showCard',
                removefield: 'onRemoveField'
            };
        me.add([
            {
                itemId: 'main',
                xtype: 'container',
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                defaults: {
                    flex: 1
                },
                items: [
                    {
                        xtype: 'titlebar',
                        docked: 'top',
                        title: me.panelTitle,
                        titleAlign: 'left',
                        items: [
                            {
                                xtype: 'tool',
                                type: 'gear',
                                align: 'right',
                                handler: 'showSettings'
                            },
                            {
                                text: me.cancelText,
                                align: 'right',
                                ui: 'alt',
                                handler: 'cancelConfiguration'
                            },
                            {
                                text: me.okText,
                                align: 'right',
                                ui: 'alt',
                                handler: 'applyConfiguration',
                                margin: '0 0 0 5'
                            }
                        ]
                    },
                    {
                        reference: 'fieldsCt',
                        xtype: 'pivotconfigcontainer',
                        title: me.panelAllFieldsTitle,
                        emptyText: me.panelAllFieldsText,
                        fieldType: 'all',
                        listeners: listeners
                    },
                    {
                        xtype: 'container',
                        layout: {
                            type: 'vbox',
                            align: 'stretch'
                        },
                        defaults: {
                            xtype: 'pivotconfigcontainer',
                            flex: 1
                        },
                        items: [
                            {
                                reference: 'fieldsAggCt',
                                title: me.panelAggFieldsTitle,
                                emptyText: me.panelAggFieldsText,
                                fieldType: 'aggregate',
                                listeners: listeners
                            },
                            {
                                reference: 'fieldsLeftCt',
                                title: me.panelLeftFieldsTitle,
                                emptyText: me.panelLeftFieldsText,
                                fieldType: 'leftAxis',
                                listeners: listeners
                            },
                            {
                                reference: 'fieldsTopCt',
                                title: me.panelTopFieldsTitle,
                                emptyText: me.panelTopFieldsText,
                                fieldType: 'topAxis',
                                listeners: listeners
                            }
                        ]
                    }
                ]
            },
            {
                itemId: 'field',
                xtype: 'pivotconfigform',
                listeners: {
                    close: 'backToMainView',
                    beforeapplyconfigfieldsettings: 'onBeforeApplyConfigFieldSettings',
                    applyconfigfieldsettings: 'onApplyConfigFieldSettings'
                }
            },
            {
                itemId: 'settings',
                xtype: 'pivotsettings',
                listeners: {
                    close: 'backToMainView',
                    beforeapplypivotsettings: 'onBeforeApplyPivotSettings',
                    applypivotsettings: 'onApplyPivotSettings'
                }
            }
        ]);
    },
    /**
     * Returns the container that stores all unused fields.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getAllFieldsContainer: function() {
        return this.lookup('fieldsCt');
    },
    /**
     * Returns the header of the container that stores all unused fields.
     *
     * @return {Ext.panel.Header}
     * @since 6.5.0
     */
    getAllFieldsHeader: function() {
        return this.getAllFieldsContainer().getHeader();
    },
    /**
     * Set visibility of the "All fields" header and container
     * @param {Boolean} visible
     * @since 6.5.0
     */
    setAllFieldsContainerVisible: function(visible) {
        this.getAllFieldsContainer().setHidden(!visible);
    },
    /**
     * Returns the container that stores all fields configured on the left axis.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getLeftAxisContainer: function() {
        return this.lookup('fieldsLeftCt');
    },
    /**
     * Returns the header of the container that stores all fields configured on the left axis.
     *
     * @return {Ext.panel.Header}
     * @since 6.5.0
     */
    getLeftAxisHeader: function() {
        return this.getLeftAxisContainer().getHeader();
    },
    /**
     * Set visibility of the "Row labels" header and container
     * @param {Boolean} visible
     * @since 6.5.0
     */
    setLeftAxisContainerVisible: function(visible) {
        this.getLeftAxisContainer().setHidden(!visible);
    },
    /**
     * Returns the container that stores all fields configured on the top axis.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getTopAxisContainer: function() {
        return this.lookup('fieldsTopCt');
    },
    /**
     * Returns the header of the container that stores all fields configured on the top axis.
     *
     * @return {Ext.panel.Header}
     * @since 6.5.0
     */
    getTopAxisHeader: function() {
        return this.getTopAxisContainer().getHeader();
    },
    /**
     * Set visibility of the "Column labels" header and container
     * @param {Boolean} visible
     * @since 6.5.0
     */
    setTopAxisContainerVisible: function(visible) {
        this.getTopAxisContainer().setHidden(!visible);
    },
    /**
     * Returns the container that stores all fields configured on the aggregate.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getAggregateContainer: function() {
        return this.lookup('fieldsAggCt');
    },
    /**
     * Returns the header of the container that stores all fields configured on the aggregate.
     *
     * @return {Ext.panel.Header}
     * @since 6.5.0
     */
    getAggregateHeader: function() {
        return this.getAggregateContainer().getHeader();
    },
    /**
     * Set visibility of the "Values" header and container
     * @param {Boolean} visible
     * @since 6.5.0
     */
    setAggregateContainerVisible: function(visible) {
        this.getAggregateContainer().setHidden(!visible);
    }
});

/**
 * This plugin allows the end user to configure the pivot component.
 *
 * It adds the following methods to the pivot grid:
 * - showConfigurator: which when called will show the configurator panel
 * - hideConfigurator: which when called will hide the configurator panel
 *
 * The configurator panel will be shown when the end-user does a `longpress` event
 * on the column headers.
 *
 * On phones a field can be moved between fields areas after a `longpress` event
 * is triggered on the field.
 */
Ext.define('Ext.pivot.plugin.Configurator', {
    extend: 'Ext.plugin.Abstract',
    requires: [
        'Ext.util.Collection',
        'Ext.pivot.plugin.configurator.Panel'
    ],
    alias: 'plugin.pivotconfigurator',
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
     * Fired on the pivot component before the pivot settings container is shown.
     *
     * Return false if you don't want to show the container.
     *
     * @event beforeshowpivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Form panel container where you can inject
     * additional fields
     * @param {Object} config.settings Settings that will be loaded into the form
     */
    /**
     * Fired on the pivot component after the configurator pivot settings container is shown.
     *
     * @event showpivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Form panel container where you can inject
     * additional fields
     * @param {Object} config.settings Settings that were loaded into the form
     */
    /**
     * Fired on the pivot component before settings are applied to the pivot matrix.
     *
     * Return false if you don't want to apply the settings to the pivot matrix.
     *
     * @event beforeapplypivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Settings} config.container Form panel container that contains all
     * pivot matrix settings.
     * @param {Object} config.settings Settings that will be loaded into the form
     */
    /**
     * Fired on the pivot component after settings are applied to the pivot matrix.
     *
     * @event applypivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Settings} config.container Form panel container where you can inject
     * additional fields
     * @param {Object} config.settings Settings that were loaded into the form
     */
    /**
     * Fired on the pivot component before the field settings container is shown.
     *
     * Return false if you don't want to show the field settings container.
     *
     * @event beforeshowconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Form} config.container Form panel container where you can inject
     * additional fields
     * @param {Object} config.settings Settings that will be loaded into the form
     */
    /**
     * Fired on the pivot component after the configurator field settings container is shown.
     *
     * @event showconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Form} config.container Form panel container where you can inject
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
     * @param {Ext.pivot.plugin.configurator.Form} config.container Form panel container that contains all field settings
     * @param {Object} config.settings Settings that will be loaded into the form
     */
    /**
     * Fired on the pivot component after settings are applied to the configurator field.
     *
     * @event applyconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Form} config.container Form panel container that contains all field settings
     * @param {Object} config.settings Settings that were loaded into the form
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
     * Fired on the pivot component when the configurator panel is disabled
     *
     * @event hideconfigpanel
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     */
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
         * @cfg {Number} width
         *
         * The width of the configurator panel.
         */
        width: 400,
        /**
         * @cfg {Object} panel
         *
         * Configuration object used to instantiate the configurator panel.
         */
        panel: {
            lazy: true,
            $value: {
                xtype: 'pivotconfigpanel',
                hidden: true,
                floated: true,
                modal: true,
                hideOnMaskTap: true,
                right: 0,
                height: '100%'
            }
        },
        /**
         * @private
         */
        pivot: null
    },
    init: function(pivot) {
        this.setPivot(pivot);
    },
    /**
     * @private
     * AbstractComponent calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
        this.setConfig({
            pivot: null,
            panel: null
        });
        this.callParent();
    },
    /**
     * Enable the plugin to show the configurator panel.
     */
    enable: function() {
        this.disabled = false;
        this.showConfigurator();
    },
    /**
     * Disable the plugin to hide the configurator panel.
     */
    disable: function() {
        this.disabled = true;
        this.hideConfigurator();
    },
    applyPanel: function(panel, oldPanel) {
        if (panel) {
            panel = panel.isInstance ? panel : Ext.create(panel);
        }
        return panel;
    },
    updatePanel: function(panel, oldPanel) {
        var me = this,
            pivot = this.getPivot();
        Ext.destroy(oldPanel, me.panelListeners);
        if (panel) {
            me.panelListeners = panel.on({
                hiddenchange: 'onPanelHiddenChange',
                close: 'hideConfigurator',
                scope: me,
                destroyable: true
            });
            panel.setConfig({
                pivot: pivot,
                fields: me.getFields()
            });
            pivot.add(panel);
        }
    },
    onPanelHiddenChange: function(panel, hidden) {
        this.getPivot().fireEvent(hidden ? 'hideconfigpanel' : 'showconfigpanel', panel);
    },
    updatePivot: function(pivot, oldPivot) {
        var me = this;
        Ext.destroy(me.pivotListeners);
        if (oldPivot) {
            oldPivot.showConfigurator = oldPivot.hideConfigurator = null;
        }
        if (pivot) {
            // this plugin is only available for the pivot components
            if (!pivot.isPivotComponent) {
                Ext.raise('This plugin is only compatible with pivot components');
            }
            pivot.showConfigurator = Ext.bind(me.showConfigurator, me);
            pivot.hideConfigurator = Ext.bind(me.hideConfigurator, me);
            if (pivot.initialized) {
                me.onPivotInitialized();
            } else {
                pivot.on({
                    initialize: 'onPivotInitialized',
                    single: true,
                    scope: me
                });
            }
        }
    },
    getWidth: function() {
        var pivot = this.getPivot(),
            viewport = Ext.Viewport,
            maxWidth = 100;
        if (pivot && pivot.element) {
            maxWidth = pivot.element.getWidth();
        }
        if (viewport) {
            maxWidth = Math.min(maxWidth, viewport.element.getHeight(), viewport.element.getWidth());
        }
        return Ext.Number.constrain(this._width, 100, maxWidth);
    },
    /**
     * @private
     */
    onPivotInitialized: function() {
        var me = this,
            pivot = me.getPivot(),
            fields = me.getFields(),
            matrix = pivot.getMatrix(),
            header = pivot.getHeaderContainer && pivot.getHeaderContainer(),
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
        me.doneSetup = false;
        if (header) {
            me.pivotListeners = header.renderElement.on({
                longpress: 'showConfigurator',
                scope: this
            });
        }
    },
    /**
     * @private
     */
    hideConfigurator: function() {
        var panel = this.getPanel();
        if (panel) {
            panel.hide();
        }
    },
    /**
     * @private
     */
    showConfigurator: function() {
        var panel = this.getPanel();
        if (panel) {
            panel.setWidth(this.getWidth());
            panel.show();
        }
    },
    getFields: function() {
        var ret = this._fields;
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
    deprecated: {
        '6.5': {
            configs: {
                panelWrapper: null,
                panelWrap: null
            }
        }
    }
});

/**
 * This plugin allows the user to view all records that were aggregated for a specified cell.
 *
 * The user has to double click that cell to open the records viewer.
 *
 * **Note:** If a {@link Ext.pivot.matrix.Remote} matrix is used then the plugin requires
 * a {@link #remoteStore} to be provided to fetch the records for a left/top keys pair.
 */
Ext.define('Ext.pivot.plugin.DrillDown', {
    alias: [
        'plugin.pivotdrilldown'
    ],
    extend: 'Ext.plugin.Abstract',
    requires: [
        'Ext.pivot.Grid',
        'Ext.Panel',
        'Ext.layout.Fit',
        'Ext.TitleBar',
        'Ext.Button',
        'Ext.data.proxy.Memory',
        'Ext.data.Store',
        'Ext.grid.plugin.PagingToolbar'
    ],
    /**
     * Fired on the pivot component when the drill down panel is visible
     *
     * @event showdrilldownpanel
     * @param {Ext.Panel} panel Drill down panel
     */
    /**
     * Fired on the pivot component when the drill down panel is hidden
     *
     * @event hidedrilldownpanel
     * @param {Ext.Panel} panel Drill down panel
     */
    config: {
        /**
         * @cfg {Ext.grid.column.Column[]} [columns] Specify which columns should be visible in the grid.
         *
         * Use the same definition as for a grid column.
         */
        columns: null,
        /**
         * @cfg {Number} width
         *
         * Width of the viewer's window.
         */
        width: 500,
        /**
         * @cfg {Number} [pageSize=25]
         * The number of records considered to form a 'page'.
         *
         * To disable paging, set the pageSize to `0`.
         */
        pageSize: 25,
        /**
         * @cfg {Ext.data.Store} remoteStore
         * Provide either a store config or a store instance when using a {@link Ext.pivot.matrix.Remote Remote} matrix on the pivot grid.
         *
         * The store will be remotely filtered to fetch records from the server.
         */
        remoteStore: null,
        /**
         * @cfg {Object} panel
         *
         * Configuration object used to instantiate the drill down panel.
         */
        panel: {
            lazy: true,
            $value: {
                xtype: 'panel',
                hidden: true,
                floated: true,
                modal: true,
                hideOnMaskTap: true,
                right: 0,
                height: '100%',
                showAnimation: {
                    type: 'slideIn',
                    duration: 250,
                    easing: 'ease-out',
                    direction: 'left'
                },
                hideAnimation: {
                    type: 'slideOut',
                    duration: 250,
                    easing: 'ease-in',
                    direction: 'right'
                },
                layout: 'fit',
                items: [
                    {
                        docked: 'top',
                        xtype: 'titlebar',
                        itemId: 'title',
                        items: {
                            xtype: 'button',
                            text: 'Done',
                            ui: 'action',
                            align: 'right',
                            itemId: 'done'
                        }
                    },
                    {
                        xtype: 'grid',
                        itemId: 'grid',
                        plugins: {
                            gridpagingtoolbar: true
                        }
                    }
                ]
            }
        },
        /**
         * @private
         */
        pivot: null
    },
    titleText: 'Drill down',
    doneText: 'Done',
    init: function(pivot) {
        // this plugin is available only for the pivot grid
        if (!pivot.isPivotGrid) {
            Ext.raise('This plugin is only compatible with Ext.pivot.Grid');
        }
        this.setPivot(pivot);
        return this.callParent([
            pivot
        ]);
    },
    destroy: function() {
        this.setConfig({
            pivot: null,
            panel: null
        });
        this.callParent();
    },
    updatePivot: function(grid) {
        Ext.destroy(this.gridListeners);
        if (grid) {
            this.gridListeners = grid.on({
                pivotitemcelldoubletap: 'showPanel',
                pivotgroupcelldoubletap: 'showPanel',
                pivottotalcelldoubletap: 'showPanel',
                scope: this,
                destroyable: true
            });
        }
    },
    applyPanel: function(panel, oldPanel) {
        if (panel) {
            panel = panel.isInstance ? panel : Ext.create(panel);
        }
        return panel;
    },
    updatePanel: function(panel, oldPanel) {
        var me = this,
            pivot = this.getPivot();
        Ext.destroy(oldPanel, me.panelListeners, me.buttonListeners);
        if (panel) {
            me.panelListeners = panel.on({
                hiddenchange: 'onPanelHiddenChange',
                scope: me,
                destroyable: true
            });
            panel.down('#title').setTitle(me.titleText);
            me.buttonListeners = panel.down('#done').on({
                tap: 'hidePanel',
                scope: me,
                destroyable: true
            });
            me.initializeStoreAndColumns();
            pivot.add(panel);
        }
    },
    initializeStoreAndColumns: function() {
        var me = this,
            panel = me.getPanel(),
            matrix = me.getPivot().getMatrix(),
            columns = Ext.Array.from(me.getColumns() || []),
            pageSize = me.getPageSize(),
            fields, store, i, len, value, grid;
        if (!matrix || !panel || !(grid = panel.down('#grid'))) {
            return;
        }
        if (matrix.isLocalMatrix) {
            fields = matrix.store.model.getFields();
            store = new Ext.data.Store({
                pageSize: pageSize,
                fields: Ext.clone(fields),
                proxy: {
                    type: 'memory',
                    enablePaging: (pageSize > 0),
                    reader: {
                        type: 'array'
                    }
                }
            });
            // if no columns are defined then use those defined in the pivot grid store
            if (columns.length === 0) {
                len = fields.length;
                for (i = 0; i < len; i++) {
                    value = fields[i];
                    columns.push({
                        text: Ext.String.capitalize(value.name),
                        dataIndex: value.name,
                        xtype: 'column'
                    });
                }
            }
        } else {
            store = Ext.getStore(me.getRemoteStore());
            if (store && store.isStore) {
                store.setPageSize(pageSize);
                store.setRemoteFilter(true);
            }
        }
        if (columns.length === 0) {
            Ext.raise('No columns defined for the drill down grid!');
        }
        grid.setConfig({
            store: store,
            columns: columns
        });
    },
    onPanelHiddenChange: function(panel, hidden) {
        this.getPivot().fireEvent(hidden ? 'hidedrilldownpanel' : 'showdrilldownpanel', panel);
    },
    getWidth: function() {
        var pivot = this.getPivot(),
            viewport = Ext.Viewport,
            maxWidth = 100;
        if (pivot && pivot.element) {
            maxWidth = pivot.element.getWidth();
        }
        if (viewport) {
            maxWidth = Math.min(maxWidth, viewport.element.getHeight(), viewport.element.getWidth());
        }
        return Ext.Number.constrain(this._width, 100, maxWidth);
    },
    showPanel: function(params) {
        var me = this,
            panel = me.getPanel(),
            matrix = me.getPivot().getMatrix(),
            result, grid, store, filters;
        // do nothing if the plugin is disabled
        if (me.disabled) {
            return;
        }
        result = matrix.results.get(params.leftKey, params.topKey);
        if (!result || !panel || !(grid = panel.down('#grid'))) {
            return;
        }
        store = grid.getStore();
        if (matrix.isLocalMatrix) {
            //store.loadData(result.records);
            store.getProxy().setData(result.records);
            store.loadPage(1);
        } else {
            filters = Ext.Array.merge(me.getFiltersFromParams(result.getLeftAxisItem() ? result.getLeftAxisItem().data : {}), me.getFiltersFromParams(result.getTopAxisItem() ? result.getTopAxisItem().data : {}));
            store.clearFilter(true);
            if (filters.length > 0) {
                store.addFilter(filters);
            } else {
                store.load();
            }
        }
        panel.setWidth(me.getWidth());
        panel.show();
    },
    hidePanel: function() {
        var panel = this.getPanel();
        if (panel) {
            panel.hide();
        }
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
 * @private
 */
Ext.define('Ext.pivot.plugin.rangeeditor.PanelController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pivotrangeeditor',
    applySettings: function() {
        var form = this.getViewModel().get('form'),
            fn = Ext.bind(this.cancelSettings, this),
            updater;
        if (form && form.type && form.type.isModel) {
            form.type = form.type.get('value');
        }
        updater = Ext.Factory.pivotupdate(form);
        this.updaterListeners = this.getView().relayEvents(updater, [
            'beforeupdate',
            'update'
        ]);
        updater.update().then(fn, fn);
    },
    cancelSettings: function() {
        var view = this.getView();
        this.updaterListeners = Ext.destroy(this.updaterListeners);
        view.fireEvent('close', view);
    }
});

/**
 * @private
 */
Ext.define('Ext.pivot.plugin.rangeeditor.Panel', {
    extend: 'Ext.form.Panel',
    requires: [
        'Ext.pivot.plugin.rangeeditor.PanelController',
        'Ext.form.FieldSet',
        'Ext.field.Select',
        'Ext.field.Number',
        'Ext.layout.VBox',
        'Ext.TitleBar',
        'Ext.Button'
    ],
    xtype: 'pivotrangeeditor',
    controller: 'pivotrangeeditor',
    viewModel: {
        stores: {
            sTypes: {
                type: 'array',
                fields: [
                    'value',
                    'text'
                ],
                autoDestroy: true
            }
        }
    },
    showAnimation: {
        type: 'slideIn',
        duration: 250,
        easing: 'ease-out',
        direction: 'left'
    },
    hideAnimation: {
        type: 'slideOut',
        duration: 250,
        easing: 'ease-in',
        direction: 'right'
    },
    titleText: 'Range editor',
    valueText: 'Value',
    fieldText: 'Source field is "{form.dataIndex}"',
    typeText: 'Type',
    okText: 'Ok',
    cancelText: 'Cancel',
    initialize: function() {
        var me = this;
        me.add([
            {
                xtype: 'titlebar',
                docked: 'top',
                title: me.titleText,
                titleAlign: 'left',
                items: [
                    {
                        text: me.cancelText,
                        align: 'right',
                        ui: 'alt',
                        handler: 'cancelSettings'
                    },
                    {
                        text: me.okText,
                        align: 'right',
                        ui: 'alt',
                        handler: 'applySettings',
                        margin: '0 0 0 5'
                    }
                ]
            },
            {
                xtype: 'fieldset',
                bind: {
                    instructions: me.fieldText
                },
                defaults: {
                    labelAlign: 'top'
                },
                items: [
                    {
                        label: me.typeText,
                        xtype: 'selectfield',
                        autoSelect: false,
                        useClearIcon: true,
                        bind: {
                            store: '{sTypes}',
                            value: '{form.type}'
                        }
                    },
                    {
                        label: me.valueText,
                        xtype: 'numberfield',
                        bind: '{form.value}'
                    }
                ]
            }
        ]);
        return me.callParent();
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
    alias: [
        'plugin.pivotrangeeditor'
    ],
    extend: 'Ext.plugin.Abstract',
    requires: [
        'Ext.pivot.Grid',
        'Ext.pivot.plugin.rangeeditor.Panel',
        'Ext.Panel',
        'Ext.layout.Fit',
        'Ext.pivot.update.Increment',
        'Ext.pivot.update.Overwrite',
        'Ext.pivot.update.Percentage',
        'Ext.pivot.update.Uniform'
    ],
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
    /**
     * Fired on the pivot component when the range editor panel is visible
     *
     * @event showrangeeditorpanel
     * @param {Ext.Panel} panel Range editor panel
     */
    /**
     * Fired on the pivot component when the range editor panel is hidden
     *
     * @event hiderangeeditorpanel
     * @param {Ext.Panel} panel Range editor panel
     */
    config: {
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
         * @cfg {Number} width
         *
         * Width of the viewer's window.
         */
        width: 400,
        /**
         * @cfg {Object} panel
         *
         * Configuration object used to instantiate the range editor panel.
         */
        panel: {
            lazy: true,
            $value: {
                xtype: 'pivotrangeeditor',
                hidden: true,
                floated: true,
                modal: true,
                hideOnMaskTap: true,
                right: 0,
                height: '100%'
            }
        },
        /**
         * @private
         */
        pivot: null
    },
    init: function(pivot) {
        // this plugin is available only for the pivot grid
        if (!pivot.isPivotGrid) {
            Ext.raise('This plugin is only compatible with Ext.pivot.Grid');
        }
        this.setPivot(pivot);
        return this.callParent([
            pivot
        ]);
    },
    destroy: function() {
        this.setConfig({
            pivot: null,
            panel: null
        });
        this.callParent();
    },
    applyPanel: function(panel, oldPanel) {
        if (panel) {
            panel = panel.isInstance ? panel : Ext.create(panel);
        }
        return panel;
    },
    updatePanel: function(panel, oldPanel) {
        var me = this,
            pivot = this.getPivot();
        Ext.destroy(oldPanel, me.panelListeners);
        if (panel) {
            me.panelListeners = panel.on({
                hiddenchange: 'onPanelHiddenChange',
                close: 'hidePanel',
                scope: me,
                destroyable: true
            });
            panel.getViewModel().getStore('sTypes').loadData(me.getUpdaters());
            pivot.relayEvents(panel, [
                'beforeupdate',
                'update'
            ], 'pivot');
            pivot.add(panel);
        }
    },
    onPanelHiddenChange: function(panel, hidden) {
        this.getPivot().fireEvent(hidden ? 'hiderangeeditorpanel' : 'showrangeeditorpanel', panel);
    },
    updatePivot: function(grid, oldGrid) {
        var me = this;
        Ext.destroy(me.gridListeners);
        if (grid) {
            me.gridListeners = grid.on({
                pivotitemcelldoubletap: 'showPanel',
                pivotgroupcelldoubletap: 'showPanel',
                pivottotalcelldoubletap: 'showPanel',
                scope: me,
                destroyable: true
            });
        }
    },
    getWidth: function() {
        var pivot = this.getPivot(),
            viewport = Ext.Viewport,
            maxWidth = 100;
        if (pivot && pivot.element) {
            maxWidth = pivot.element.getWidth();
        }
        if (viewport) {
            maxWidth = Math.min(maxWidth, viewport.element.getHeight(), viewport.element.getWidth());
        }
        return Ext.Number.constrain(this._width, 100, maxWidth);
    },
    showPanel: function(params, e, eOpts) {
        var me = this,
            pivot = me.getPivot(),
            panel = me.getPanel(),
            matrix = pivot.getMatrix(),
            vm, result, col, dataIndex;
        // do nothing if the plugin is disabled
        if (me.disabled) {
            return;
        }
        result = matrix.results.get(params.leftKey, params.topKey);
        if (!result || !panel) {
            return;
        }
        vm = panel.getViewModel();
        col = params.column;
        dataIndex = col.dimension.getDataIndex();
        vm.set('form', {
            leftKey: params.leftKey,
            topKey: params.topKey,
            dataIndex: dataIndex,
            //field:      col.dimension.header || col.text || dataIndex,
            value: result.getValue(col.dimension.getId()),
            type: me.getDefaultUpdater(),
            matrix: matrix
        });
        panel.setWidth(me.getWidth());
        panel.show();
    },
    hidePanel: function() {
        var panel = this.getPanel();
        if (panel) {
            panel.hide();
        }
    },
    deprecated: {
        '6.5': {
            configs: {
                panelWrapper: null,
                panelWrap: null
            }
        }
    }
});

