/**
 * This class implements a table cell definition
 */
Ext.define('Ext.exporter.data.Cell', {
    extend: 'Ext.exporter.data.Base',

    config: {
        /**
         * @cfg {Ext.exporter.file.Style} style
         *
         * Cell's style. Use this to add special formatting to the exported document.
         *
         */
        style: null,
        /**
         * @cfg {Number/String/Date} value
         *
         * Cell's value
         *
         */
        value: null
    }
});