/**
 * Represents the collection of unique items for a field in the PivotCacheDefinition.
 * The sharedItems complex type stores data type and formatting information about the data
 * in a field. Items in the PivotCacheDefinition can be shared in order to reduce the redundancy
 * of those values that are referenced in multiple places across all the PivotTable parts.
 * [Example: A value might be part of a filter, it might appear on a row or column axis, and
 * will appear in the pivotCacheRecords definition as well. However, because of the performance
 * cost of creating the optimized shared items, items are only shared if they are actually in
 * use in the PivotTable. Therefore, depending on user actions on the PivotTable layout, the
 * pivotCacheDefinition and underlying PivotCacheRecords part can be updated. end example]
 *
 * If there are no shared items, then field values are stored directly in the pivotCacheRecords part.
 *
 * (CT_SharedItems)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.SharedItems', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {Boolean} [containsBlank]
         *
         * Specifies a boolean value that indicates whether this field contains a blank value.
         *
         * A value of 1 or true indicates this field contains one or more blank values.
         *
         * A value of 0 or false indicates this field does not contain blank values.
         */
        containsBlank: null,
        /**
         * @cfg {Boolean} [containsDate]
         *
         * Specifies a boolean value that indicates that the field contains at least one date.
         *
         * A value of 1 or true indicates the field contains at least one date value.
         *
         * A value of 0 or false indicates the field does not contain any date values.
         */
        containsDate: null,
        /**
         * @cfg {Boolean} [containsInteger]
         *
         * Specifies a boolean value that indicates whether this field contains integer values.
         *
         * A value of 1 or true indicates this field contains integer values.
         *
         * A value of 0 or false indicates non-integer or mixed values.
         */
        containsInteger: null,
        /**
         * @cfg {Boolean} [containsMixedTypes]
         *
         * Specifies a boolean value that indicates whether this field contains more than one data type.
         *
         * A value of 1 or true indicates this field contains more than one data type.
         *
         * A value of 0 or false indicates contains only one data type. The field can still contain
         * blank values.
         */
        containsMixedTypes: null,
        /**
         * @cfg {Boolean} [containsNonDate]
         *
         * Specifies a boolean value that indicates that the field contains at least one value that is not a date.
         *
         * A value of 1 or true indicates the field contains at least one non-date values.
         *
         * A value of 0 or false indicates this field contains no date fields.
         */
        containsNonDate: null,
        /**
         * @cfg {Boolean} [containsNumber]
         *
         * Specifies a boolean value that indicates whether this field contains numeric values.
         *
         * A value of 1 or true indicates this field contains at least one numeric value.
         *
         * A value of 0 or false indicates this field contains no numeric values.
         */
        containsNumber: null,
        /**
         * @cfg {Boolean} [containsSemiMixedTypes]
         *
         * Specifies a boolean value that indicates that this field contains text values.
         * The field can also contain a mix of other data type and blank values.
         *
         * A value of 1 or true indicates at least one text value, and can also contain a mix of other
         * data types and blank values.
         *
         * A value of 0 or false indicates the field does not have a mix of text and other values.
         */
        containsSemiMixedTypes: null,
        /**
         * @cfg {Boolean} [containsString]
         *
         * Specifies a boolean value that indicates whether this field contains a text value.
         *
         * A value of 1 or true indicates this field contains at least one text value.
         *
         * A value of 0 or false indicates this field does not contain any text values.
         */
        containsString: null,
        /**
         * @cfg {Boolean} [longText]
         *
         * Specifies a boolean value that indicates whether this field contains a long text value.
         * A string is considered long if it is over 255 Unicode scalar values.
         *
         * A value of 1 or true indicates the value contains more than 255 Unicode scalar valuesof text.
         *
         * A value of 0 or false indicates the value contains less than 255 Unicode scalar values.
         *
         * **Note**: This is used as many legacy spreadsheet application support a limit of 255
         * characters for text values.
         */
        longText: null,
        /**
         * @cfg {Date} [maxDate]
         *
         * Specifies the maximum date/time value found in a date field.
         */
        maxDate: null,
        /**
         * @cfg {Number} [maxValue]
         *
         * Specifies the maximum numeric value found in a numeric field.
         */
        maxValue: null,
        /**
         * @cfg {Date} [minDate]
         *
         * Specifies the minimum date/time value found in a date field.
         */
        minDate: null,
        /**
         * @cfg {Number} [minValue]
         *
         * Specifies the minimum numeric value found in a numeric field.
         */
        minValue: null,

        /**
         * @cfg {Boolean/Number/Date/String[]} items
         *
         * Unique values for the CacheField.
         */
        items: null
    },

    tplNonAttributes: [
        'items', 'stritems'
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
        '<tpl if="stritems">',
        '<sharedItems {attributes}>',
        '{stritems}',
        '</sharedItems>',
        '<tpl else>',
        '<sharedItems {attributes}/>',
        '</tpl>'
    ],

    numberTpl: '<n v="{0}"/>',
    booleanTpl: '<b v="{0}"/>',
    stringTpl: '<s v="{0}"/>',
    dateTpl: '<d v="{0}"/>',

    getRenderData: function(){
        var me = this,
            data = me.callParent(),
            items = data.items,
            str = '',
            hasBlank = false,
            hasBool = false,
            hasNumber = false,
            hasDate = false,
            hasString = false,
            hasFloat = false,
            count = 0,
            types = [],
            minValue = null,
            maxValue = null,
            i, len, v, tpl;

        // the CT_SharedItems specs is not fully implemented in this class
        // there are more elements inside "sharedItems" with settings for OLAP
        // we currently ignore OLAP
        if(items){
            len = items.length;
            for(i = 0; i < len; i++){
                v = items[i];
                if(v == null || v === '') {
                    hasBlank = true;
                } else {
                    count++;
                    if (typeof v === 'string') {
                        hasString = true;
                        tpl = me.stringTpl;
                        v = Ext.util.Base64._utf8_encode(Ext.util.Format.htmlEncode(v));
                        types.push('s');
                    } else if (typeof  v === 'boolean') {
                        hasBool = true;
                        tpl = me.booleanTpl;
                        types.push('b');
                    } else if (typeof  v === 'number') {
                        hasNumber = true;
                        tpl = me.numberTpl;
                        minValue = Math.min(minValue, v);
                        maxValue = Math.max(maxValue, v);
                        if(String(v).indexOf('.') >= 0){
                            hasFloat = true;
                        }
                        types.push('n');
                    } else if (v instanceof Date) {
                        hasDate = true;
                        tpl = me.dateTpl;
                        v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
                        types.push('d');
                    }
                    str += Ext.String.format(tpl, v);
                }
            }
        }
        if(count > 0) {
            data.count = count;
        }
        data.stritems = str;

        if(hasDate){
            data.containsSemiMixedTypes = hasString;
            data.containsDate = true;
            data.stritems = '';
        }
        if(hasNumber){
            data.containsSemiMixedTypes = hasString;
            data.containsNumber = true;
            data.minValue = minValue;
            data.maxValue = maxValue;
            if(!hasFloat) {
                data.containsInteger = true;
            }
        }
        data.containsString = hasString;
        len = Ext.Array.unique(types);
        if(len > 0){
            data.containsMixedTypes = len > 1;
        }

        return data;
    },

    applyItems: function(items){
        return items !== null ? Ext.Array.from(items) : null;
    },

    updateMinValue: function(v){
        if(v != null){
            this.setContainsNumber(true);
        }
    },

    updateMaxValue: function(v){
        if(v != null){
            this.setContainsNumber(true);
        }
    },

    applyMinDate: function(v){
        if(v){
            v  = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
        }
        return v;
    },

    updateMinDate: function(v){
        if(v != null){
            this.setContainsDate(true);
        }
    },

    applyMaxDate: function(v){
        if(v){
            v  = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
        }
        return v;
    },

    updateMaxDate: function(v){
        if(v != null){
            this.setContainsDate(true);
        }
    }

});