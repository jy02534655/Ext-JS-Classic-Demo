/**
 * This class is used to create an xml Excel Column.
 *
 * Columns are usually created when you want to add a special style to them.
 */
Ext.define('Ext.exporter.file.excel.Column', {
    extend: 'Ext.exporter.file.Base',

    config: {
        /**
         * @cfg {Boolean} [autoFitWidth=false]
         *
         * Use 1 if you want this column to auto fit its width.
         * Textual values do not autofit.
         */
        autoFitWidth: false,
        /**
         * @cfg {String} caption
         *
         * Specifies the caption that should appear when the Component's custom row and column headers are showing.
         */
        caption: null,
        /**
         * @cfg {Boolean} hidden
         *
         * `true` specifies that this column is hidden. `false` (or omitted) specifies that this column is shown.
         */
        hidden: null,
        /**
         * @cfg {Number} index
         *
         * Index of this column in the Excel table.
         *
         * If this tag is not specified, the first instance has an assumed Index="1". Each additional Column element
         * has an assumed Index that is one higher.
         *
         * Indices must appear in strictly increasing order. Failure to do so will result in an XML Spreadsheet
         * document that is invalid. Indices do not need to be sequential, however. Omitted indices are formatted
         * with the default style's format.
         *
         * Indices must not overlap. If duplicates exist, the behavior is unspecified and the XML Spreadsheet
         * document is considered invalid. An easy way to create overlap is through careless use of the Span attribute.
         */
        index: null,
        /**
         * @cfg {Number} span
         *
         * Specifies the number of adjacent columns with the same formatting as this column. When a Span attribute
         * is used, the spanned column elements are not written out.
         *
         * As mentioned in the index config, columns must not overlap. Doing so results in an XML Spreadsheet document
         * that is invalid. Care must be taken with this attribute to ensure that the span does not include another
         * column index that is specified.
         */
        span: null,
        /**
         * @cfg {String} styleId
         *
         * Excel style attached to this column
         */
        styleId: null,
        /**
         * @cfg {Number} width
         *
         * Specifies the width of a column in points. This value must be greater than or equal to 0.
         */
        width: null
    },

    tpl: [
        '<Column',
            '<tpl if="this.exists(index)"> ss:Index="{index}"</tpl>',
            '<tpl if="this.exists(caption)"> c:Caption="{caption}"</tpl>',
            '<tpl if="this.exists(styleId)"> ss:StyleID="{styleId}"</tpl>',
            '<tpl if="this.exists(hidden)"> ss:Hidden="{hidden}"</tpl>',
            '<tpl if="this.exists(span)"> ss:Span="{span}"</tpl>',
            '<tpl if="this.exists(width)"> ss:Width="{width}"</tpl>',
            '<tpl if="this.exists(autoFitWidth)"> ss:AutoFitWidth="{autoFitWidth:this.toNumber}"</tpl>',
        '/>\n',
        {
            exists: function(value){
                return !Ext.isEmpty(value);
            },
            toNumber: function(value){
                return Number(Boolean(value));
            }
        }
    ]

});