/**
 * Extend this class when the new class needs to generate an xml file
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.Xml', {
    extend: 'Ext.exporter.file.ooxml.Base',

    requires: [
        'Ext.exporter.file.ooxml.Relationship',
        'Ext.exporter.file.ooxml.ContentType'
    ],

    config: {
        /**
         * @cfg {String} folder
         *
         * Full path to the folder where the file exists inside the zip archive
         */
        folder: null,

        /**
         * @cfg {String} fileName
         *
         * Name of the xml file without extension. Use `fileNameTemplate` to define the extension.
         */
        fileName: null,

        /**
         * @cfg {String}
         * @readonly
         *
         * Full path of the file inside the zip package. It combines the `folder` and the `fileName`.
         */
        path: null,

        /**
         * @cfg {Ext.exporter.file.ooxml.Relationship} relationship
         *
         * If the file needs to be part of a '.rels' file then this entity needs to be defined
         */
        relationship: null,

        /**
         * @cfg {Ext.exporter.file.ooxml.ContentType} contentType
         *
         * If the file needs to be part of the '[Content_Types].xml' file then this entity needs
         * to be defined
         */
        contentType: null
    },

    cachedConfig: {
        /**
         * @cfg {String} fileNameTemplate
         *
         * A template to generate the file name. You can use any config defined on the class.
         */
        fileNameTemplate: '{fileName}.xml'
    },

    tplNonAttributes: [
        'path', 'relationship', 'contentType', 'fileName', 'folder', 'fileNameTemplate'
    ],

    destroy: function(){
        this.setRelationship(null);
        this.setContentType(null);
        this.callParent();
    },

    applyFolder: function(folder) {
        folder = folder || '';

        if(folder[folder.length - 1] !== '/') {
            folder += '/';
        }

        return folder;
    },

    updateFolder: function() {
        this.generatePath();
    },

    updateFileName: function() {
        this.generatePath();
    },

    getFileNameFromTemplate: function() {
        var tpl = Ext.XTemplate.getTpl(this, '_fileNameTemplate');
        return (tpl ? tpl.apply(this.getConfig()) : '');
    },

    generatePath: function() {
        this.setPath((this.getFolder() || '') + this.getFileNameFromTemplate());
    },

    updatePath: function(path) {
        var relationship = this.getRelationship(),
            type = this.getContentType();

        if(relationship) {
            relationship.setTarget(path);
        }
        if(type) {
            type.setPartName(path);
        }
    },

    applyRelationship: function(data){
        if(!data || data.isRelationship){
            return data;
        }
        return new Ext.exporter.file.ooxml.Relationship(data);
    },

    updateRelationship: function(data, oldData){
        Ext.destroy(oldData);
    },

    applyContentType: function(data){
        if(!data || data.isContentType){
            return data;
        }
        return new Ext.exporter.file.ooxml.ContentType(data);
    },

    updateContentType: function(data, oldData){
        Ext.destroy(oldData);
    },

    /**
     * Collect all files that are part of the final zip file
     * @param {Object} files Object key is the path to the file and object value is the content
     * @param {Ext.exporter.file.ooxml.ContentType[]} types
     */
    collectFiles: Ext.emptyFn

});