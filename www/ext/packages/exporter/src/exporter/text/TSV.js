/**
 * This exporter produces TSV (tab separated values) files for the supplied data.
 */
Ext.define('Ext.exporter.text.TSV', {
    extend: 'Ext.exporter.text.CSV',

    alias: 'exporter.tsv',

    requires: [
        'Ext.util.TSV'
    ],

    getHelper: function(){
        return Ext.util.TSV;
    }
});