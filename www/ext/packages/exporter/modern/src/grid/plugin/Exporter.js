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

    getGridColumns: function(){
        return this.cmp.getHeaderContainer().innerItems;
    },

    getColumnHeader: function(config, column) {
        var dataIndexes = [],
            obj, result, style;

        obj = {
            text: column.getText(),
            width: column.getWidth()
        };

        if (column.isHeaderGroup) {
            result = this.getColumnHeaders(config, column.innerItems);
            obj.columns = result.headers;
            if (obj.columns.length === 0) {
                // all children columns are ignored for export so there's no need to export this grouped header
                obj = null;
            } else {
                Ext.Array.insert(dataIndexes, dataIndexes.length, result.dataIndexes);
            }
        }else if(!column.getHidden() && !column.getIgnoreExport()) {
            style = this.getExportStyle(column.getExportStyle(), config);
            obj.style = style;
            // width could also be specified in the exportStyle but will not be used by the style itself
            obj.width = obj.width || column.getComputedWidth();
            if(style){
                obj.width = style.width || obj.width;
            }
            dataIndexes.push(column);
        }else{
            obj = null;
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
            style = this.getExportStyle(column.getExportStyle(), config);

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
            dataIndex: column.getDataIndex(),
            column: column,
            fn: fn,
            summary: column.getSummary(),
            summaryType: column.getSummaryType(),
            summaryIndex: column.getSummaryDataIndex() || column.getDataIndex(),
            summaryFn: summaryFn
        }
    },

    getSpecialFn: function(names, column) {
        var exportRenderer = column['get' + Ext.String.capitalize(names.exportRenderer)](),
            renderer = column['get' + Ext.String.capitalize(names.renderer)](),
            formatter = column['get' + Ext.String.capitalize(names.formatter)](),
            fn, scope, tempFn;

        scope = column.getScope() || column.resolveListenerScope() || column;

        tempFn = exportRenderer;

        if(formatter && !tempFn) {
            fn = formatter;
        } else {
            if(tempFn === true){
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
        var dataIndex = colDef.dataIndex,
            v = record.get(dataIndex);

        return {
            value: colDef.fn(v, record, dataIndex, null, colDef.column)
        };
    },

    getSummaryCell: function(collection, record, colDef) {
        var dataIndex = colDef.summaryIndex,
            v = record.get(dataIndex);

        return {
            value: colDef.summaryFn(v, record, dataIndex, null, colDef.column)
        };
    }

});
