/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.ContentTypes', {
    extend: 'Ext.exporter.file.ooxml.Xml',

    requires: [
        'Ext.exporter.file.ooxml.ContentType'
    ],

    isContentTypes: true,

    config: {
        contentTypes: [{
            tag: 'Default',
            contentType: 'application/vnd.openxmlformats-package.relationships+xml',
            extension: 'rels'
        },{
            tag: 'Default',
            contentType: 'application/xml',
            extension: 'xml'
        }]
    },

    tpl: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<tpl if="contentTypes"><tpl for="contentTypes.getRange()">{[values.render()]}</tpl></tpl>',
        '</Types>'
    ],

    folder: '/',
    fileName: '[Content_Types]',

    applyContentTypes: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.ContentType');
    },

    addContentType: function(config){
        return this.getContentTypes().add(config || {});
    }

});
