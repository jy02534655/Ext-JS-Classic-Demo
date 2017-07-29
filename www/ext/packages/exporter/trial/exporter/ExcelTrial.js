/**
 * Change the title of all exporters to include
 * a message in the trial version of the Exporter
 */
Ext.define('Ext.overrides.exporter.Base', {
    override: 'Ext.exporter.Base',

    applyTitle: function(title){
        return title ? 'Produced by Ext JS Trial - ' + title : title;
    }
});
