/**
 * This is the base class for an exporter. This class is supposed to be extended to allow
 * data export to various formats.
 *
 * The purpose is to have more exporters that can take the same {@link #data data set} and export it to different
 * formats.
 *
 * Exporters are used by {@link Ext.grid.plugin.Exporter} and {@link Ext.pivot.plugin.Exporter}
 * but could also be used individually when needed.
 *
 * If there is a requirement that the above plugins should export the data to a document format
 * that is currently not supported by the `exporter` package then it's better to extend this class
 * to create a custom exporter that does that. This way both plugins can use the same custom exporter.
 *
 * There are cases when tabular data that doesn't come from a grid panel or a pivot grid needs to
 * be exported to a file. This could be achieved using the available exporters independently.
 *
 *      var exporter = Ext.Factory.exporter({
 *          type: 'excel',
 *          data: {
 *              columns: [{
 *                  text: 'Vacation',
 *                  columns: [
 *                      { text: 'Month', width: 200, style: { alignment: { horizontal: 'Right' } } },
 *                      { text: 'Days', style: { format: 'General Number' } }
 *                  ]
 *              }],
 *              groups: [{
 *                  text: 'Employees',
 *                  groups: [{
 *                      text: 'Adrian',
 *                      rows: [{
 *                          cells: [
 *                              { value: 'January' },
 *                              { value: 2 }
 *                          ]
 *                      },{
 *                          cells: [
 *                              { value: 'July' },
 *                              { value: 10 }
 *                          ]
 *                      }],
 *                      summaries: [{
 *                          cells: [
 *                              { value: 'Total' },
 *                              { value: 12 }
 *                          ]
 *                      }]
 *                  },{
 *                      text: 'John',
 *                      rows: [{
 *                          cells: [
 *                              { value: 'March' },
 *                              { value: 4 }
 *                          ]
 *                      },{
 *                          cells: [
 *                              { value: 'May' },
 *                              { value: 4 }
 *                          ]
 *                      },{
 *                          cells: [
 *                              { value: 'July' },
 *                              { value: 2 }
 *                          ]
 *                      }],
 *                      summaries: [{
 *                          cells: [
 *                              { value: 'Total' },
 *                              { value: 10 }
 *                          ]
 *                      }]
 *                  }],
 *                  summaries: [{
 *                      cells: [
 *                          { value: 'Grand total' },
 *                          { value: 22 }
 *                      ]
 *                  }]
 *              }]
 *          }
 *      });
 *
 *      // save the file
 *      exporter.saveAs().then( function() { exporter.destroy(); } );
 *
 */
Ext.define('Ext.exporter.Base', {
    mixins: [
        'Ext.mixin.Factoryable'
    ],

    alias:  'exporter.base',

    requires: [
        'Ext.exporter.data.Table',
        'Ext.exporter.file.Style',
        'Ext.exporter.File'
    ],

    config: {
        /**
         * @cfg {Ext.exporter.data.Table} data (required)
         *
         * Data to be consumed by the exporter.
         *
         */
        data: null,
        /**
         * @cfg {Boolean} [showSummary=true]
         *
         * Should group summaries be shown? The data this exporter can consume
         * may contain group summaries.
         */
        showSummary: true,
        /**
         * @cfg {String} [title=""]
         *
         * Title displayed above the table. Hidden when empty
         */
        title: null,
        /**
         * @cfg {String} [author="Sencha"]
         *
         * The author that generated the file.
         */
        author: 'Sencha',

        /**
         * @cfg {String} [fileName="export.txt"]
         *
         * Name of the saved file
         */
        fileName: 'export.txt',

        /**
         * @cfg {String} [charset="UTF-8"]
         *
         * File's charset
         */
        charset: 'UTF-8',

        /**
         * @cfg {String} [mimeType="text/plain"]
         *
         * File's mime type
         */
        mimeType: 'text/plain',

        /**
         * @cfg {String} [binary=false]
         *
         * Set to `true` if the exporter generates a binary file.
         */
        binary: false
    },

    constructor: function(config){
        this.initConfig(config || {});
        Ext.exporter.File.initializePopup(this.getBinary());
        return this.callParent([config]);
    },

    destroy: function(){
        this.setData(Ext.destroy(this.getData()));
        this.callParent();
    },

    /**
     * @method
     * Generates the file content.
     */
    getContent: Ext.identityFn,

    /**
     * Save the file on user's machine using the content generated by this exporter.
     *
     * @return {Ext.promise.Promise}
     */
    saveAs: function(){
        var me = this,
            deferred = new Ext.Deferred();

        Ext.asap(me.delayedSave, me, [deferred]);
        return deferred.promise;
    },

    delayedSave: function(deferred) {
        var me = this,
            fn = me.getBinary() ? 'saveBinaryAs' : 'saveAs',
            promise = Ext.exporter.File[fn](me.getContent(), me.getFileName(), me.getCharset(), me.getMimeType());

        promise.then(
            function(){
                deferred.resolve();
            },
            function(msg){
                deferred.reject(msg);
            }
        );
    },

    /**
     * Returns the number of columns available in the provided `columns` array.
     * It will parse the whole tree structure to count the bottom level columns too.
     *
     * @param columns
     * @return {Number}
     */
    getColumnCount: function(columns){
        var s = 0;

        if (!columns) {
            return s;
        }

        for (var i = 0; i < columns.length; i++) {
            if (!columns[i].columns) {
                s += 1;
            } else {
                s += this.getColumnCount(columns[i].columns);
            }
        }

        return s;
    },

    applyData: function(data){
        if(!data || data.isDataTable){
            return data;
        }

        return new Ext.exporter.data.Table(data);
    }

});