/**
 * This plugin allows grid data export using various exporters. Each exporter should extend
 * the {@link Ext.exporter.Base} class.
 *
 * Two new methods are created on the grid panel by this plugin:
 *
 *  - saveDocumentAs(config): saves the document
 *  - getDocumentData(config): returns the document content
 *
 * The grid data is exported for all grid columns that have the flag
 * {@link Ext.grid.column.Column#ignoreExport ignoreExport} as false.
 *
 * If the grid store is grouped and you want the export to group your results
 * then use the following properties in the config object sent to the `saveDocumentAs` function:
 *
 * - includeGroups: set to true to include the groups
 * - includeSummary: set to true to include also group/grand summaries if proper `summaryType` was defined on columns
 *
 * During data export the data for each column could be formatted in multiple ways:
 *
 * - using the {@link Ext.grid.column.Column#exportStyle exportStyle} format
 * - using the {@link Ext.grid.column.Column#formatter formatter} if no `exportStyle` is defined
 * - using the {@link Ext.grid.column.Column#exportRenderer exportRenderer}
 *
 * If `exportStyle.format`, `formatter` and `exportRenderer` are all defined on a column then the `exportStyle.format`
 * wins and will be used to format the data for that column.
 *
 *
 * Example usage:
 *
 *      {
 *          xtype: 'grid',
 *          plugins: {
 *              gridexporter: true
 *          },
 *          columns: [{
 *              dataIndex: 'value',
 *              text: 'Total',
 *              exportStyle: {
 *                  format: 'Currency',
 *                  alignment: {
 *                      horizontal: 'Right'
 *                  }
 *              }
 *          }]
 *      }
 *
 *      grid.saveDocumentAs({
 *          type: 'xlsx',
 *          title: 'My export',
 *          fileName: 'myExport.xlsx'
 *      });
 *
 */
Ext.define('Ext.grid.plugin.Exporter', {
    alias: [
        'plugin.gridexporter'
    ],

    extend: 'Ext.grid.plugin.BaseExporter',

    /**
     *  `"both"` (the default) - The plugin is added to both grids
     *  `"top"` - The plugin is added to the containing Panel
     *  `"locked"` - The plugin is added to the locked (left) grid
     *  `"normal"` - The plugin is added to the normal (right) grid
     *
     * @private
     */
    lockableScope:  'top',


    getGridColumns: function(){
        var grid = this.cmp,
            columns = [];

        if(grid.lockedGrid){
            Ext.Array.insert(columns, columns.length, grid.lockedGrid.headerCt.items.items);
            Ext.Array.insert(columns, columns.length, grid.normalGrid.headerCt.items.items);
        }else{
            Ext.Array.insert(columns, columns.length, grid.headerCt.items.items);
        }

        return columns;
    },

    getColumnHeader: function(config, column) {
        var dataIndexes = [],
            obj, result, style, width;

        if(!column.hidden && !column.ignoreExport) {
            style = this.getExportStyle(column.exportStyle, config);
            // width could also be specified in the exportStyle but will not be used by the style itself
            width = column.getWidth();
            if(style){
                width = style.width || width;
            }

            obj = {
                text: column.text,
                width: width,
                style: style
            };

            if (column.isGroupHeader) {
                result = this.getColumnHeaders(config, column.items.items);
                obj.columns = result.headers;
                if(obj.columns.length === 0){
                    // all children columns are ignored for export so there's no need to export this grouped header
                    obj = null;
                }else{
                    Ext.Array.insert(dataIndexes, dataIndexes.length, result.dataIndexes);
                }
            }else{
                dataIndexes.push(column);
            }
        }

        if(obj){
            return {
                header: obj,
                dataIndexes: dataIndexes
            };
        }
    },

    prepareDataIndexColumn: function(config, column) {
        var fn = Ext.identityFn,
            summaryFn = Ext.identityFn,
            style = this.getExportStyle(column.exportStyle, config);

        // if there is an exportStyle format then we use that one
        if(!style || (style && !style.format)){
            fn = this.getSpecialFn({
                renderer: 'renderer',
                exportRenderer: 'exportRenderer',
                formatter: 'formatter'
            }, column) || fn;
            summaryFn = this.getSpecialFn({
                renderer: 'summaryRenderer',
                exportRenderer: 'exportSummaryRenderer',
                formatter: 'summaryFormatter'
            }, column) || fn;
        }

        return {
            dataIndex: column.dataIndex,
            column: column,
            fn: fn,
            summaryType: column.summaryType,
            summaryIndex: column.dataIndex,
            summaryFn: summaryFn,
            colIndex: Ext.Array.indexOf(this.cmp.getVisibleColumns(), column)
        }
    },

    getSpecialFn: function(names, column) {
        var exportRenderer = column[names.exportRenderer],
            renderer = column[names.renderer],
            formatter = column[names.formatter],
            fn, scope, tempFn;

        scope = column.rendererScope || column.scope || column;

        tempFn = exportRenderer;

        if((column.initialConfig[names.formatter] && !formatter && !tempFn)) {
            fn = renderer;
        } else {
            if(tempFn === true) {
                tempFn = renderer;
            }

            if(typeof tempFn == 'string') {
                fn = function () {
                    return Ext.callback(tempFn, scope, arguments, 0, column);
                };
            } else if(typeof tempFn == 'function'){
                fn = function () {
                    return tempFn.apply(scope, arguments);
                };
            }
        }

        return fn;
    },

    getCell: function(store, record, colDef) {
        var v = record.get(colDef.dataIndex);

        return {
            value: colDef.fn(v, null, record, store.indexOf(record), colDef.colIndex, store, this.cmp.getView())
        };
    },

    getSummaryCell: function(collection, record, colDef) {
        var v = record.get(colDef.dataIndex);

        return {
            value: colDef.summaryFn(v, null, record, -1, colDef.colIndex, collection, this.cmp.getView())
        };
    }

});
