/**
 * Represents the pivotCacheDefinition part. This part defines each field in the source data,
 * including the name, the string resources of the instance data (for shared items), and information
 * about the type of data that appears in the field.
 *
 * (CT_PivotCacheDefinition)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.PivotCacheDefinition', {
    extend: 'Ext.exporter.file.ooxml.XmlRels',

    requires: [
        'Ext.exporter.file.ooxml.excel.PivotCacheRecords',
        'Ext.exporter.file.ooxml.excel.CacheSource',
        'Ext.exporter.file.ooxml.excel.CacheField',
        'Ext.exporter.file.ooxml.excel.PivotCache'
    ],

    config: {
        /**
         * @cfg {Boolean} [backgroundQuery]
         *
         * Specifies a boolean value that indicates whether the application should query and retrieve
         * records asynchronously from the cache.
         *
         * A value of 1 or true indicates the application will retrieve records asynchronously from the cache.
         *
         * A value of 0 or false indicates the application will retrieve records synchronously.
         */
        backgroundQuery: null,

        /**
         * @cfg {Number} [createdVersion]
         *
         * Specifies the version of the application that created the cache. This attribute is application-dependent.
         */
        createdVersion: null,

        /**
         * @cfg {Boolean} [enableRefresh]
         *
         * Specifies a boolean value that indicates whether the end-user can refresh the cache. This
         * attribute depends on whether the application exposes a method for allowing end-users control
         * over refreshing the cache via the user interface.
         *
         * A value of 1 or true indicates the end-user can refresh the cache.
         *
         * A value of 0 or false indicates the end-user cannot refresh the cache.
         */
        enableRefresh: null,

        /**
         * @cfg {Boolean} [invalid]
         *
         * Specifies a boolean value that indicates whether the cache needs to be refreshed.
         *
         * A value of 1 or true indicates the cache needs to be refreshed.
         *
         * A value of 0 or false indicates the cache does not need to be refreshed.
         */
        invalid: null,

        /**
         * @cfg {Number} [minRefreshableVersion]
         *
         * Specifies the earliest version of the application that is required to refresh the cache.
         * This attribute is application-dependent.
         */
        minRefreshableVersion: null,

        /**
         * @cfg {Number} [missingItemsLimit]
         *
         * Specifies the number of unused items to allow before discarding unused items.
         * This attribute is application-dependent. The application shall specify a threshold for unused items.
         */
        missingItemsLimit: null,

        /**
         * @cfg {Boolean} [optimizeMemory]
         *
         * Specifies a boolean value that indicates whether the application will apply optimizations to
         * the cache to reduce memory usage. This attribute is application-dependent. This application shall
         * define its own cache optimization methods. The application shall also decide whether to expose
         * cache optimization status via the user interface or an object model.
         *
         * A value of 1 or true indicates the application will apply optimizations to the cache.
         *
         * A value of 0 or false indicates the application will not apply optimizations to the cache.
         */
        optimizeMemory: null,

        /**
         * @cfg {Number} [recordCount]
         *
         * Specifies the number of records in the cache.
         */
        recordCount: null,

        /**
         * @cfg {String} [refreshedBy]
         *
         * Specifies the name of the end-user who last refreshed the cache. This attribute is
         * application-dependent and is specified by applications that track and store the identity
         * of the current user. This attribute also depends on whether the application exposes mechanisms
         * via the user interface whereby the end-user can refresh the cache.
         */
        refreshedBy: null,

        /**
         * @cfg {Date} [refreshedDateIso]
         *
         * Specifies the date when the cache was last refreshed. This attribute depends on whether the
         * application exposes mechanisms via the user interface whereby the end-user can refresh the cache.
         */
        refreshedDateIso: null,

        /**
         * @cfg {Number} [refreshedVersion]
         *
         * Specifies the version of the application that last refreshed the cache. This attribute
         * depends on whether the application exposes mechanisms via the user interface whereby the
         * end-user can refresh the cache.
         */
        refreshedVersion: null,

        /**
         * @cfg {Boolean} [refreshOnLoad]
         *
         * Specifies a boolean value that indicates whether the application will refresh the cache
         * when the workbook has been opened.
         *
         * A value of 1 or true indicates that application will refresh the cache when the workbook is loaded.
         *
         * A value of 0 or false indicates the application will not automatically refresh cached data.
         * The end user shall trigger refresh of the cache manually via the application user interface.
         */
        refreshOnLoad: null,

        /**
         * @cfg {Boolean} [saveData]
         *
         * Specifies a boolean value that indicates whether the pivot records are saved with the cache.
         *
         * A value of 1 or true indicates pivot records are saved in the cache.
         *
         * A value of 0 or false indicates are not saved in the cache.
         */
        saveData: null,

        /**
         * @cfg {Boolean} [supportAdvancedDrill]
         *
         * Specifies whether the cache's data source supports attribute drilldown.
         */
        supportAdvancedDrill: null,

        /**
         * @cfg {Boolean} [supportSubquery]
         *
         * Specifies whether the cache's data source supports subqueries.
         */
        supportSubquery: null,

        /**
         * @cfg {Boolean} [tupleCache]
         *
         * Specifies a boolean value that indicates whether the PivotCache is used store information
         * for OLAP sheet data functions.
         *
         * A value of 1 or true indicates information about OLAP sheet data functions are stored in the cache.
         *
         * A value of 0 or false indicates the PivotCache does not contain information about OLAP sheet data functions.
         */
        tupleCache: null,

        /**
         * @cfg {Boolean} [upgradeOnRefresh]
         *
         * Specifies a boolean value that indicates whether the cache is scheduled for version upgrade.
         * This attribute depends on whether the application exposes mechanisms via the user interface whereby
         * the cache might be upgraded.
         *
         * A value of 1 or true indicates the cache is scheduled for upgrade.
         *
         * A value of 0 or false indicates the cache is not scheduled for upgrade.
         */
        upgradeOnRefresh: null,


        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotCacheRecords} cacheRecords
         *
         * Represents the collection of records in the PivotCache. This part stores the underlying
         * source data that the PivotTable aggregates.
         */
        cacheRecords: {},
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.CacheSource} [cacheSource]
         *
         * Represents the description of data source whose data is stored in the pivot cache.
         */
        cacheSource: {},
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.CacheField[]} [cacheFields]
         *
         * Represents the collection of field definitions in the source data.
         */
        cacheFields: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotCache} pivotCache
         *
         * This element enumerates pivot cache definition parts used by pivot tables and formulas in this workbook.
         */
        pivotCache: {}
    },

    folder: '/xl/pivotCache/',
    fileName: 'pivotCacheDefinition',

    contentType: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml'
    },

    relationship: {
        schema: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheDefinition'
    },

    tplNonAttributes: [
        'cacheRecords', 'cacheSource', 'cacheFields', 'pivotCache'
    ],

    /**
     * @cfg generateTplAttributes
     * @inheritdoc Ext.exporter.file.ooxml.Base#property!generateTplAttributes
     * @localdoc
     *
     * **Note** Do not rename the config names that are part of the `attributes` since they are
     * mapped to the xml attributes needed by the template.
     */
    generateTplAttributes: true,

    tpl: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<pivotCacheDefinition xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ',
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="{[values.relationship.getId()]}" {attributes}>',
        //'{% debugger; %}',
        '{[values.cacheSource.render()]}',
        '<tpl if="cacheFields"><cacheFields count="{cacheFields.length}"><tpl for="cacheFields.getRange()">{[values.render()]}</tpl></cacheFields></tpl>',
        '</pivotCacheDefinition>'
    ],

    destroy: function(){
        this.setCacheRecords(null);
        this.setCacheSource(null);
        this.setPivotCache(null);
        this.callParent();
    },

    getRenderData: function(){
        var data = this.callParent(),
            records = this.getCacheRecords();

        if(records){
            records = records.getItems();
            data.recordCount = records.length;
        }
        return data;
    },

    collectFiles: function(files) {
        var records = this.getCacheRecords();

        if(records) {
            records.collectFiles(files);
        }
        this.callParent([files]);
    },

    collectContentTypes: function(types){
        var records = this.getCacheRecords();

        if(records) {
            // the PivotCacheRecords needs a record in [Content_Types].xml as well
            records.collectContentTypes(types);
        }
        this.callParent([types]);
    },

    updateIndex: function(index, oldIndex){
        var cache = this.getCacheRecords();

        if(cache){
            cache.setIndex(index);
        }
        this.callParent([index, oldIndex]);
    },

    applyPivotCache: function(data) {
        if(!data || data.isInstance){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.PivotCache(data);
    },

    updatePivotCache: function(data, oldData){
        Ext.destroy(oldData);
    },

    applyCacheRecords: function(data) {
        if(!data || data.isInstance){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.PivotCacheRecords(data);
    },

    updateCacheRecords: function(data, oldData){
        var rels = this.getRelationships(),
            rel;

        if(oldData) {
            rels.removeRelationship(oldData.getRelationship());
        }
        Ext.destroy(oldData);

        if(data) {
            rel = data.getRelationship();
            rels.addRelationship(rel);
            this.setId(rel.getId());
        }
    },

    applyCacheSource: function(data) {
        if(!data || data.isInstance){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.CacheSource(data);
    },

    updateCacheSource: function(data, oldData){
        Ext.destroy(oldData);
    },

    applyCacheFields: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.CacheField');
    }

});