/**
 * This class generates a '.rels' file that contain all links to related objects.
 *
 * i.e. a worksheet may have a pivot table or the workbook has multiple sheets
 *
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.Relationships', {
    extend: 'Ext.exporter.file.ooxml.Xml',

    isRelationships: true,
    currentIndex: 1,

    config: {
        /**
         * @private
         * All relationships targets should be relative paths to this parent folder
         * when the file is generated otherwise iOS Safari won't display the file
         */
        parentFolder: null,

        items: []
    },

    contentType: {
        contentType: 'application/vnd.openxmlformats-package.relationships+xml'
    },

    fileNameTemplate: '{fileName}.rels',

    tpl: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<tpl if="items"><tpl for="items.getRange()">{[values.render()]}</tpl></tpl>',
        '</Relationships>'
    ],

    collectFiles: function(files){
        var items = this.getItems(),
            length = items.length,
            folder = this.getParentFolder(),
            i;

        if(length){
            for(i = 0; i < length; i++) {
                items.getAt(i).setParentFolder(folder);
            }
            files[this.getPath()] = this.render();
        }
    },

    applyFolder: function(folder, oldFolder) {
        folder = this.callParent([folder, oldFolder]);

        return folder + '_rels/';
    },

    applyItems: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.Relationship');
    },

    updateItems: function(collection, oldCollection){
        var me = this;

        if(oldCollection){
            oldCollection.un({
                add: me.updateIds,
                remove: me.updateIds,
                scope: me
            });
        }
        if(collection){
            collection.on({
                add: me.updateIds,
                remove: me.updateIds,
                scope: me
            });
        }
    },

    updateIds: function(items){
        var i, len, item;

        if(!items){
            return;
        }
        len = items.length;
        for(i = 0; i < len; i++){
            item = items.getAt(i);
            item.setId('rId' + (i + 1));
        }
    },

    /**
     * Convenience method to add relationships.
     * @param {Object/Array} config
     * @return {Ext.exporter.file.ooxml.Relationship/Ext.exporter.file.ooxml.Relationship[]}
     */
    addRelationship: function(config){
        return this.getItems().add(config || {});
    },
    removeRelationship: function(config){
        return this.getItems().remove(config);
    }

});