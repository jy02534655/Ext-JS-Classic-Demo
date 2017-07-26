/**
 * This is the base class for a file object. This one should be extended
 * by classes that generate content based on templates.
 */
Ext.define('Ext.exporter.file.Base', {
    extend: 'Ext.exporter.data.Base',

    requires: [
        'Ext.XTemplate'
    ],

    /**
     * @private
     * @property {Ext.XTemplate} tpl
     *
     * Template used to render this element
     */
    tpl: null,

    destroy: function(){
        this.tpl = null;
        this.callParent();
    },

    /**
     * Renders the content according to the template provided to the class
     *
     * @returns {String}
     */
    render: function(){
        var me = this,
            data = me.processRenderData(me.getRenderData());
        return me.tpl ? Ext.XTemplate.getTpl(me, 'tpl').apply(data) : '';
    },

    /**
     * Use this function to pre process the render data before applying it to the template
     *
     * @param {Object} data
     * @return {Object}
     * @private
     */
    processRenderData: function(data){
        return data;
    },

    /**
     * Return the data used when rendering the template
     *
     * @return {Object}
     */
    getRenderData: function(){
        var data = this.getConfig();

        data.self = this;

        return data;
    }
});