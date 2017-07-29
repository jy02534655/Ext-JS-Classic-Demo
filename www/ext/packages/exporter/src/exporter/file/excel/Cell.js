 /**
 * This class is used to create an xml Excel Cell.
 *
 * The data type of the cell value is automatically determined.
 */
Ext.define('Ext.exporter.file.excel.Cell', {
    extend: 'Ext.exporter.file.Base',

    config: {
        /**
         * @cfg {String} dataType (required)
         *
         * Excel data type for the cell value. It is automatically set when the value is set.
         *
         * Possible values: `Number`, `DateTime`, `Boolean`, `String`
         */
        dataType: 'String',
        /**
         * @cfg {String} formula
         *
         * Specifies the formula stored in this cell. All formulas are persisted in R1C1 notation because they are
         * significantly easier to parse and generate than A1-style formulas. The formula is calculated upon reload
         * unless calculation is set to manual. Recalculation of the formula overrides the value in this cell's Value config.
         *
         * Examples:
         *
         * - "=SUM(R1C1:R2C2)": sums up values from Row1/Column1 to Row2/Column2
         * - "=SUM(R[-2]C:R[-1]C[1])": sums up values from 2 rows above the current row and current column to
         * values from 1 row above the current row and 1 column after the current column
         * - "=SUM(R[-1]C,R[-1]C[1])": sums up values from cell positioned one row above current row and current column,
         * and the cell positioned one row above current row and next column
         *
         * Check Excel for more formulas.
         */
        formula: null,
        /**
         * @cfg {Number} index
         *
         * Specifies the column index of this cell within the containing row. If this tag is not specified, the first
         * instance of a Cell element within a row has an assumed Index="1". Each additional Cell element has an assumed
         * Index that is one higher.
         *
         * Indices must appear in strictly increasing order. Failure to do so will result in an XML Spreadsheet
         * document that is invalid. Indices do not need to be sequential, however. Omitted indices are formatted with
         * either the default format, the column's format, or the table's format (depending on what has been specified).
         *
         * Indices must not overlap. If duplicates exist, the behavior is unspecified and the XML Spreadsheet document
         * is considered invalid. If the previous cell is a merged cell and no index is specified on this cell, its
         * start index is assumed to be the first cell after the merge.
         */
        index: null,
        /**
         * @cfg {String} styleId
         *
         * Excel style attached to this cell
         */
        styleId: null,
        /**
         * @cfg {Number} mergeAcross
         *
         * Number of cells to merge to the right side of this cell
         */
        mergeAcross: null,
        /**
         * @cfg {Number} mergeDown
         *
         * Number of cells to merge below this cell
         */
        mergeDown: null,
        /**
         * @cfg {Number/Date/String} value (required)
         *
         * Value assigned to this cell
         */
        value: ''
    },

    tpl: [
        '               <Cell',
        '<tpl if="this.exists(index)"> ss:Index="{index}"</tpl>',
        '<tpl if="this.exists(styleId)"> ss:StyleID="{styleId}"</tpl>',
        '<tpl if="this.exists(mergeAcross)"> ss:MergeAcross="{mergeAcross}"</tpl>',
        '<tpl if="this.exists(mergeDown)"> ss:MergeDown="{mergeDown}"</tpl>',
        '<tpl if="this.exists(formula)"> ss:Formula="{formula}"</tpl>',
        '>\n',
        '                   <Data ss:Type="{dataType}">{value}</Data>\n',
        '               </Cell>\n',
        {
            exists: function(value){
                return !Ext.isEmpty(value);
            }
        }
    ],

    applyValue: function(v){
        var dt = 'String',
            format = Ext.util.Format;

        // let's detect the data type
        if(v instanceof Date){
            dt = 'DateTime';
            v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
        }else if(Ext.isNumber(v)) {
            dt = 'Number';
        }else if(Ext.isBoolean(v)){
            dt = 'Boolean';
            v = Number(v);
        }else{
            // cannot use here stripTags
            // this value goes into an xml tag and we need to force html encoding
            // for chars like &><
            v =  format.htmlEncode(format.htmlDecode(v))
        }

        this.setDataType(dt);
        return v;
    }

});