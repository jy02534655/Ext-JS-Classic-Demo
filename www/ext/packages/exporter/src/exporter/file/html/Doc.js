/**
 * @private
 */
Ext.define('Ext.exporter.file.html.Doc', {
    extend: 'Ext.exporter.file.Base',

    requires: [
        'Ext.exporter.file.html.Style'
    ],

    config: {
        /**
         * @cfg {String} [title="Title"]
         *
         * The title of the html document
         */
        title: "Title",

        /**
         * @cfg {String} [author="Sencha"]
         *
         * The author of the generated html file
         */
        author: 'Sencha',

        /**
         * @cfg {String} [charset="UTF-8"]
         *
         * Html document charset
         */
        charset: 'UTF-8',

        /**
         * @cfg {Ext.exporter.file.html.Style[]} styles
         *
         * Collection of styles available in this workbook
         */
        styles: [],

        /**
         * @cfg {Object} table
         */
        table: null
    },

    destroy: function() {
        this.setStyles(null);
        this.setTable(null);
        this.callParent();
    },

    applyStyles: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.html.Style');
    },

    /**
     * Convenience method to add styles.
     * @param {Object/Array} config
     * @returns {Ext.exporter.file.html.Style/Ext.exporter.file.html.Style[]}
     */
    addStyle: function (config) {
        var styles = this.getStyles(),
            items = styles.decodeItems(arguments, 0),
            len = items.length,
            ret = [],
            i, found, item;

        // reuse item if already created
        // do not remove and add because used ids will get lost
        for(i = 0; i < len; i++) {
            item = items[i];
            found = styles.get(item.getKey());
            ret.push(found ? found : styles.add(item));
            if(found) {
                item.destroy();
            }
        }

        return ret.length === 1 ? ret[0] : ret;
    },

    /**
     * Convenience method to fetch a style by its id.
     * @param id
     * @returns {Ext.exporter.file.html.Style}
     */
    getStyle: function(id){
        return this.getStyles().get(id);
    }

});