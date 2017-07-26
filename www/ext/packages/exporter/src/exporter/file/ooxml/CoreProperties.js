/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.CoreProperties', {
    extend: 'Ext.exporter.file.ooxml.Xml',

    isCoreProperties: true,

    config: {
        /**
         * @cfg {String} [title="Workbook"]
         *
         * The name given to the resource.
         */
        title: "Workbook",

        /**
         * @cfg {String} [author="Sencha"]
         *
         * An entity primarily responsible for making the content of the resource.
         */
        author: 'Sencha',

        /**
         * @cfg {String} [subject=""]
         *
         * The topic of the content of the resource.
         */
        subject: ''

    },

    contentType: {
        contentType: 'application/vnd.openxmlformats-package.core-properties+xml',
        partName: '/docProps/core.xml'
    },

    relationship: {
        schema: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',
        target: 'docProps/core.xml'
    },

    path: '/docProps/core.xml',

    tpl: [
        '<coreProperties xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ',
        'xmlns:dcterms="http://purl.org/dc/terms/" ',
        'xmlns:dc="http://purl.org/dc/elements/1.1/" ',
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
        '   <dc:creator>{author:this.utf8}</dc:creator>',
        '   <dc:title>{title:this.utf8}</dc:title>',
        '   <dc:subject>{subject:this.utf8}</dc:subject>',
        '</coreProperties>',
        {
            utf8: function(v){
                return Ext.util.Base64._utf8_encode(v || '');
            }
        }
    ]
});