/**
 * Extend this class when the new class needs to generate an xml file and .rels files
 * for all linked relationships
 *
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.XmlRels', {
    extend: 'Ext.exporter.file.ooxml.Xml',

    requires: [
        'Ext.exporter.file.ooxml.Relationships'
    ],

    config: {
        /**
         * @cfg {Number} index
         *
         * Index of the file in the upper collection.
         */
        index: null,

        /**
         * @cfg {String} name
         *
         * A name that better represents the object (ie. worksheet name, pivot table name etc)
         */
        name: null,

        relationships: {
            contentType: {
                contentType: 'application/vnd.openxmlformats-package.relationships+xml'
            }
        }
    },

    cachedConfig: {
        /**
         * @cfg {String} nameTemplate
         *
         * A template to generate the object name. You can use any config defined on the class.
         */
        nameTemplate: '{name}'
    },

    tplNonAttributes: [
        'index', 'relationships', 'nameTemplate'
    ],

    contentType: {},

    relationship: {},

    fileNameTemplate: '{fileName}{index}.xml',

    destroy: function(){
        this.setRelationships(null);
        this.callParent();
    },

    updateFolder: function(folder, oldFolder) {
        var rels = this.getRelationships();

        if(rels) {
            rels.setFolder(folder);
        }

        this.callParent([folder, oldFolder]);
    },

    applyRelationships: function(data){
        if(!data || data.isRelationships){
            return data;
        }

        return new Ext.exporter.file.ooxml.Relationships(data);
    },

    updateRelationships: function(data, oldData){
        Ext.destroy(oldData);
    },

    updateIndex: function() {
        this.generatePath();
    },

    generateName: function() {
        var tpl = Ext.XTemplate.getTpl(this, '_nameTemplate');

        this.setName(tpl ? tpl.apply(this.getConfig()) : '');
    },

    /**
     * Collect all files that are part of the final zip file
     * @param {Object} files Object key is the path to the file and object value is the content
     */
    collectFiles: function(files){
        this.collectRelationshipsFiles(files);
        files[this.getPath()] = this.render();
    },

    collectRelationshipsFiles: function(files) {
        var rels = this.getRelationships(),
            name = this.getFileName();

        if(rels) {
            rels.setFileName(name ? this.getFileNameFromTemplate() : '');
            rels.setParentFolder(this.getFolder());
            rels.collectFiles(files);
        }
    },

    /**
     * Collect all content types that are part of the final zip file
     * @param {Ext.exporter.file.ooxml.ContentType[]} types
     */
    collectContentTypes: function(types){
        types.push(this.getContentType());
    }

});