/**
 * Represents the location of the source of the data that is stored in the cache.
 *
 * (CT_WorksheetSource)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.WorksheetSource', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {String} id
         *
         * Specifies the identifier to the Sheet part whose data is stored in the cache.
         */
        id: null,
        /**
         * @cfg {String} [name]
         *
         * Specifies the named range that is the source of the data.
         */
        name: null,
        /**
         * @cfg {String} [ref]
         *
         * Specifies the reference that defines a cell range that is the source of the data.
         * This attribute depends on how the application implements cell references.
         */
        ref: null,
        /**
         * @cfg {String} [sheet]
         *
         * Specifies the name of the sheet that is the source for the cached data.
         */
        sheet: null
    },

    autoGenerateId: false,
    tplAttributes: [
        'id', 'name', 'ref', 'sheet'
    ],

    /**
     * @cfg generateTplAttributes
     * @inheritdoc Ext.exporter.file.ooxml.Base#property!generateTplAttributes
     * @localdoc
     *
     * **Note** Do not rename the config names that are part of the `attributes` since they are
     * mapped to the xml attributes needed by the template.
     */
    generateTplAttributes: true,

    tpl: [
        '<worksheetSource {attributes} />'
    ]

});