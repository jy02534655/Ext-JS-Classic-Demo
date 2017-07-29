/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.Base', {
    extend: 'Ext.exporter.file.Base',

    config: {
        /**
         * @private
         */
        tplAttributes: {
            $value: [],
            merge: function (newValue, oldValue) {
                return [].concat(newValue, oldValue);
            }
        },

        /**
         * @private
         */
        tplNonAttributes: {
            $value: [
                'idPrefix', 'id', 'autoGenerateId', 'self',
                'tplAttributes', 'tplNonAttributes'
            ],
            merge: function(newValue, oldValue) {
                return [].concat(newValue, oldValue);
            }
        }
    },

    /**
     * Set to `true` if you want to generate an `attributes` key on the template render data.
     * The value of this key is a concatenated string of pairs `config_name=config_value`.
     * This means that each config that will participate in the `attributes` has the same name
     * as the expected XML attribute. Changing the config name will have an impact on the XML
     * attribute.
     *
     * In `tplNonAttributes` there is a list of configs that should not be part of attributes.
     *
     * In `tplAttributes` define the configs that should be part of attributes.
     *
     * If `tplAttributes` is empty then the all configs are used except for `tplNonAttributes` defined.
     *
     * @private
     */
    generateTplAttributes: false,

    processRenderData: function(data){
        var attr = this.getTplAttributes(),
            nonAttr = this.getTplNonAttributes(),
            keys = Ext.Object.getAllKeys(data),
            len = keys.length,
            str = '',
            i, key;

        if(!this.generateTplAttributes){
            data.attributes = '';
            return data;
        }

        for(i = 0; i < len; i++){
            key = keys[i];

            if(attr && attr.length){
                if(Ext.Array.indexOf(attr, key) >= 0 && data[key] !== null){
                    str += (str.length ? ' ' : '') + this.processTplAttribute(key, data[key]);
                }
            }else if(nonAttr && nonAttr.length){
                if(Ext.Array.indexOf(nonAttr, key) < 0 && data[key] !== null){
                    str += (str.length ? ' ' : '') + this.processTplAttribute(key, data[key]);
                }
            }

        }
        data.attributes = str;

        return data;
    },

    processTplAttribute: function(attr, value){
        var v = value;

        if(typeof value === 'boolean'){
            v = Number(value);
        } else if(typeof value === 'string') {
            v = Ext.util.Base64._utf8_encode(Ext.util.Format.htmlEncode(value || ''));
        }

        return (attr + '="' + v + '"');
    }

});
