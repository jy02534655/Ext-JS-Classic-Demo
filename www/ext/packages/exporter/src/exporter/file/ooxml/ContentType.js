/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.ContentType', {
    extend: 'Ext.exporter.file.Base',

    isContentType: true,

    config: {
        tag: 'Override',
        partName: '',
        contentType: '',
        extension: ''
    },

    tpl: [
        '<{tag}',
        '<tpl if="extension"> Extension="{extension}"</tpl>',
        '<tpl if="partName"> PartName="{partName}"</tpl>',
        '<tpl if="contentType"> ContentType="{contentType}"</tpl>',
        '/>'
    ]
});