/**
 * Represents a single record of data in the PivotCache.
 *
 * (CT_Record)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Record', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {Boolean/Number/Date/String[]} items
         *
         * Cell values for this record
         */
        items: null
    },

    tplNonAttributes: [
        'items', 'stritems'
    ],

    tpl: [
        '<tpl if="stritems">',
        '<r>',
        '{stritems}',
        '</r>',
        '<tpl else>',
        '<r/>',
        '</tpl>'
    ],

    numberTpl: '<n v="{0}"/>',
    booleanTpl: '<b v="{0}"/>',
    stringTpl: '<s v="{0}"/>',
    dateTpl: '<d v="{0}"/>',

    constructor: function(config){
        var cfg;

        if(Ext.isArray(config) || Ext.isDate(config) || Ext.isPrimitive(config)) {
            cfg = {
                items: config
            };
        } else {
            cfg = config;
        }
        return this.callParent([cfg]);
    },

    getRenderData: function(){
        var me = this,
            data = me.callParent(),
            items = data.items,
            str = '',
            types = [],
            i, len, v, tpl;

        if(items){
            len = items.length;
            for(i = 0; i < len; i++){
                v = items[i];
                if(v == null || v === '') {
                    //
                } else {
                    if (typeof v === 'string') {
                        tpl = me.stringTpl;
                        v = Ext.util.Base64._utf8_encode(Ext.util.Format.htmlEncode(v));
                        types.push('s');
                    } else if (typeof  v === 'boolean') {
                        tpl = me.booleanTpl;
                        types.push('b');
                    } else if (typeof  v === 'number') {
                        tpl = me.numberTpl;
                        types.push('n');
                    } else if (v instanceof Date) {
                        tpl = me.dateTpl;
                        v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
                        types.push('d');
                    }
                    str += Ext.String.format(tpl, v);
                }
            }
        }
        data.stritems = str;

        return data;
    },

    applyItems: function(items){
        return items !== null ? Ext.Array.from(items) : null;
    }

});