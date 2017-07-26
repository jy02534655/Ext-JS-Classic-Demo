/**
 * An Office Open XML SpreasheetML implementation according to the [ISO/IEC 29500-1:2012][1].
 *
 * [1]: http://www.iso.org/iso/home/store/catalogue_ics/catalogue_detail_ics.htm?csnumber=61750
 *
 * Only a small subset of that standard is implemented.
 *
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.Excel', {
    extend: 'Ext.exporter.file.ooxml.XmlRels',

    requires: [
        'Ext.exporter.file.zip.Archive',
        'Ext.exporter.file.ooxml.excel.Workbook',
        'Ext.exporter.file.ooxml.Relationships',
        'Ext.exporter.file.ooxml.ContentTypes',
        'Ext.exporter.file.ooxml.CoreProperties'
    ],

    config: {
        /**
         * @cfg {Ext.exporter.file.ooxml.CoreProperties} [properties]
         *
         * Core properties of the Excel file
         */
        properties: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.Workbook} workbook
         *
         * At least one Workbook needs to be in the file
         */
        workbook: {}
    },

    folder: '/',
    fileName: null,

    tpl: [],

    constructor: function(config){
        var ret = this.callParent([config]);

        if(!this.getWorkbook()){
            this.setWorkbook({});
        }

        return ret;
    },

    destroy: function() {
        var me = this;
        
        me.setWorkbook(null);
        me.setProperties(null);
        me.setRelationships(null);
        me.callParent();
    },

    render: function(){
        var files = {},
            paths, path, content, i, len, zip;

        this.collectFiles(files);
        // zip all files and return the zip content
        paths = Ext.Object.getKeys(files);
        len = paths.length;
        if(!len){
            return;
        }

        zip = new Ext.exporter.file.zip.Archive();
        for(i = 0; i < len; i++){
            path = paths[i];
            content = files[path];
            path = path.substr(1);
            if(path.indexOf('.xml') !== -1 || path.indexOf('.rel') !== -1) {
                zip.addFile({
                    path: path,
                    data: content
                });
            }
        }
        content = zip.getContent();
        zip = Ext.destroy(zip);

        return content;
    },

    collectFiles: function(files){
        var contentTypes = new Ext.exporter.file.ooxml.ContentTypes(),
            wb = this.getWorkbook(),
            props = this.getProperties(),
            types = [];

        wb.collectFiles(files);
        if(props){
            contentTypes.addContentType(props.getContentType());
            files[props.getPath()] = props.render();
        }
        wb.collectContentTypes(types);
        contentTypes.addContentType(types);

        files[contentTypes.getPath()] = contentTypes.render();
        Ext.destroy(contentTypes);

        this.collectRelationshipsFiles(files);
    },

    applyProperties: function(data){
        if(!data || data.isCoreProperties){
            return data;
        }

        return new Ext.exporter.file.ooxml.CoreProperties(data);
    },

    updateProperties: function(data, oldData){
        var rels = this.getRelationships();

        if(oldData){
            rels.removeRelationship(oldData.getRelationship());
            oldData.destroy();
        }
        if(data){
            rels.addRelationship(data.getRelationship());
        }
    },

    applyWorkbook: function(data){
        if(!data || data.isWorkbook){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.Workbook(data);
    },

    updateWorkbook: function(data, oldData){
        var rels = this.getRelationships();

        if(oldData){
            rels.removeRelationship(oldData.getRelationship());
            oldData.destroy();
        }
        if(data){
            rels.addRelationship(data.getRelationship());
        }
    },

    /**
     * Convenience method to add worksheets.
     *
     * @param {Object/Array} config
     * @return {Ext.exporter.file.ooxml.excel.Worksheet/Ext.exporter.file.ooxml.excel.Worksheet[]}
     */
    addWorksheet: function(config){
        return this.getWorkbook().addWorksheet(config);
    },

    /**
     * Convenience method to add a style.
     *
     * @param {Ext.exporter.file.Style} config
     * @return {Number} Index of the cell style
     */
    addStyle: function(config){
        return this.getWorkbook().getStylesheet().addStyle(config);
    },

    /**
     * Convenience method to add a style.
     *
     * @param {Ext.exporter.file.Style} config
     * @param {Number} [parentStyleId] Optional id of the parent style that will be inherited
     * @return {Number} Index of the cell style
     */
    addCellStyle: function(config, parentStyleId){
        return this.getWorkbook().getStylesheet().addCellStyle(config, parentStyleId);
    }

});