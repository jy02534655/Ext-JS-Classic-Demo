/**
 * This class implements a table group definition.
 */
Ext.define('Ext.exporter.data.Group', {
    extend: 'Ext.exporter.data.Base',
    
    requires: [
        'Ext.exporter.data.Row'
    ],
    
    config: {
        /**
         * @cfg {String} text
         *
         * Group's header
         *
         */
        text: null,
        /**
         * @cfg {Ext.exporter.data.Row[]} rows
         *
         * Group's rows
         *
         */
        rows: null,
        /**
         * @cfg {Ext.exporter.data.Row[]} summaries
         *
         * Group's summaries
         *
         */
        summaries: null,
        /**
         * @cfg {Ext.exporter.data.Row} summary
         *
         * Define a single summary row. Kept for compatibility.
         * @private
         * @hide
         */
        summary: null,
        /**
         * @cfg {Ext.exporter.data.Group[]} groups
         *
         * Collection of sub-groups belonging to this group.
         *
         */
        groups: null
    },

    applyRows: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Row');
    },

    /**
     * Convenience method to add rows.
     * @param {Object/Array} config
     * @return {Ext.exporter.data.Row/Ext.exporter.data.Row[]}
     */
    addRow: function(config){
        if(!this._rows){
            this.setRows([]);
        }
        return this._rows.add(config || {});
    },

    /**
     * Convenience method to fetch a row by its id.
     * @param id
     * @return {Ext.exporter.data.Row}
     */
    getRow: function(id){
        return this._rows ? this._rows.get(id) : null;
    },

    applyGroups: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Group');
    },

    /**
     * Convenience method to add groups.
     * @param {Object/Array} config
     * @return {Ext.exporter.data.Group/Ext.exporter.data.Group[]}
     */
    addGroup: function(config){
        if(!this._groups){
            this.setGroups([]);
        }
        return this._groups.add(config || {});
    },

    /**
     * Convenience method to fetch a group by its id.
     * @param id
     * @return {Ext.exporter.data.Group}
     */
    getGroup: function(id){
        return this._groups ? this._groups.get(id) : null;
    },

    applySummaries: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Row');
    },

    applySummary: function(value){
        if(value) {
            this.addSummary(value);
        }
        return null;
    },

    /**
     * Convenience method to add summary rows.
     * @param {Object/Array} config
     * @return {Ext.exporter.data.Row/Ext.exporter.data.Row[]}
     */
    addSummary: function(config){
        if(!this._summaries){
            this.setSummaries([]);
        }
        return this._summaries.add(config || {});
    },

    /**
     * Convenience method to fetch a summary row by its id.
     * @method getSummary
     * @param id Id of the summary row
     * @return {Ext.exporter.data.Row}
     */
    getSummary: function(id){
        return this._summaries ? this._summaries.get(id) : null;
    }
});