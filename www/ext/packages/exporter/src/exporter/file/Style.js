/**
 * This class is a generic implementation of a Style. This should be extended to provide Style implementations
 * for different use cases. Check out {@link Ext.exporter.file.excel.Style} and {@link Ext.exporter.file.html.Style}.
 */
Ext.define('Ext.exporter.file.Style', {
    extend: 'Ext.exporter.file.Base',

    config: {
        /**
         * @cfg {String} id
         * A unique name within the document that identifies this style.
         *
         */

        /**
         * @cfg {String} [name]
         *
         * This property identifies this style as a named style.
         *
         */
        name: null,

        /**
         * @cfg {Object} [alignment]
         *
         * Following keys are allowed on this object and are all optional:
         *
         * @cfg {String} alignment.horizontal
         * Specifies the left-to-right alignment of text within a cell. Possible values: `Left`, `Center`, `Right`,
         * `Justify` and `Automatic`.
         *
         * @cfg {Number} alignment.indent
         * Specifies the number of indents.
         *
         * @cfg {String} alignment.readingOrder
         * Specifies the default right-to-left text entry mode for a cell. Possible values: `LeftToRight`,
         * `RightToLeft` and `Context`.
         *
         * @cfg {Number} alignment.rotate
         * Specifies the rotation of the text within the cell.
         *
         * @cfg {String} alignment.vertical
         * Specifies the top-to-bottom alignment of text within a cell. Possible values: `Top`, `Bottom`,
         * `Center` and `Automatic`.
         *
         */
        alignment: null,
        /**
         * @cfg {Object} [font]
         * Defines the font attributes to use in this style.
         *
         *
         * Following keys are allowed on this object:
         *
         * @cfg {Boolean} font.bold
         * Specifies the bold state of the font.
         *
         * @cfg {String} font.color
         * Specifies the color of the font. This value should be a 6-hexadecimal digit number in "#rrggbb" format.
         *
         * @cfg {String} font.fontName
         * Specifies the name of the font.
         *
         * @cfg {Boolean} font.italic
         * Similar to `font.bold` in behavior, this attribute specifies the italic state of the font.
         *
         * @cfg {Number} font.size
         * Specifies the size of the font.
         *
         * @cfg {Boolean} font.strikeThrough
         * Similar to `font.bold` in behavior, this attribute specifies the strike-through state
         * of the font.
         *
         * @cfg {String} font.underline
         * Specifies the underline state of the font. Possible values: `None` and `Single`.
         *
         * @cfg {String} font.family
         * Font family name.
         *
         */
        font: null,
        /**
         * @cfg {Object} [interior]
         * Defines the fill properties to use in this style. Each attribute that is specified is
         * considered an override from the default.
         *
         * Following keys are allowed on this object:
         *
         * @cfg {String} interior.color
         * Specifies the fill color of the cell. This value should be a 6-hexadecimal digit number in "#rrggbb" format.
         *
         * @cfg {String} interior.pattern
         * Specifies the fill pattern in the cell. Possible values: `None`, `Solid`.
         *
         */
        interior: null,
        /**
         * @cfg {String} [format]
         *
         * This can be one of the following values:
         * `General`, `General Number`, `General Date`, `Long Date`, `Medium Date`, `Short Date`, `Long Time`, `Medium Time`,
         * `Short Time`, `Currency`, `Euro Currency`, `Fixed`, `Standard`, `Percent`, `Scientific`, `Yes/No`,
         * `True/False`, or `On/Off`.
         *
         * `Currency` is the currency format with two decimal places.
         *
         * `Euro Currency` is the same as `Currency` using the Euro currency symbol instead.
         *
         */
        format: null,
        /**
         * @cfg {Object[]} [borders]
         *
         * Array of border objects. Following keys are allowed for border objects:
         *
         * @cfg {String} borders.position
         * Specifies which of the possible borders this element represents. Duplicate
         * borders are not permitted and are considered invalid. Possible values: `Left`, `Top`, `Right`, `Bottom`.
         *
         * @cfg {String} borders.color
         * Specifies the color of this border. This value should be a 6-hexadecimal digit number in "#rrggbb" format.
         *
         * @cfg {String} borders.lineStyle
         * Specifies the appearance of this border. Possible values: `None`, `Continuous`, `Dash` and `Dot`.
         *
         * @cfg {Number} borders.weight
         * Specifies the weight (or thickness) of this border.
         *
         */
        borders: null,

        // used to validate the provided values for Style configs
        checks: {
            alignment: {
                horizontal: ['Automatic', 'Left', 'Center', 'Right', 'Justify'],
                readingOrder: ['LeftToRight', 'RightToLeft', 'Context'],
                vertical: ['Automatic', 'Top', 'Bottom', 'Center']
            },
            font: {
                bold: [true, false],
                italic: [true, false],
                strikeThrough: [true, false],
                underline: ['None', 'Single']
            },
            border: {
                position: ['Left', 'Top', 'Right', 'Bottom'],
                lineStyle: ['None', 'Continuous', 'Dash', 'Dot']
            },
            interior: {
                pattern: ['None', 'Solid']
            }
        }

    },

    datePatterns: {
        'General Date': 'Y-m-d H:i:s',
        'Long Date': 'l, F d, Y',
        'Medium Date': 'Y-m-d',
        'Short Date': 'n/j/Y',
        'Long Time': 'g:i:s A',
        'Medium Time': 'H:i:s',
        'Short Time': 'g:i A'
    },
    numberPatterns: {
        'General Number': '0',
        'Fixed': '0.00',
        'Standard': '0.00'
    },
    booleanPatterns: {
        'Yes/No': ['Yes', 'No'],
        'True/False': ['True', 'False'],
        'On/Off': ['On', 'Off']
    },

    isStyle: true,

    autoGenerateKey: ['alignment', 'font', 'interior', 'format', 'borders'],

    constructor: function(config){
        this.callParent([this.uncapitalizeKeys(config)]);
    },

    /**
     * Parse object keys and uncapitalize them. This is useful to keep compatibility with prior versions.
     *
     * @param config
     * @return {Object}
     *
     * @private
     */
    uncapitalizeKeys: function(config){
        var ret = config,
            keys, len, i, key, v;

        if(Ext.isObject(config)){
            ret = {};
            keys = Ext.Object.getAllKeys(config);
            len = keys.length;

            for(i = 0; i < len; i++){
                key = keys[i];
                ret[Ext.String.uncapitalize(key)] = this.uncapitalizeKeys(config[key]);
            }
        }else if(Ext.isArray(config)){
            ret = [];
            len = config.length;

            for(i = 0; i < len; i++){
                ret.push(this.uncapitalizeKeys(config[i]));
            }
        }

        return ret;
    },

    destroy: function(){
        var me = this;

        me.setAlignment(null);
        me.setFont(null);
        me.setInterior(null);
        me.setBorders(null);
        me.setChecks(null);

        me.callParent();
    },

    updateAlignment: function(data){
        this.checkAttribute(data, 'alignment');
    },

    updateFont: function(data){
        this.checkAttribute(data, 'font');
    },

    updateInterior: function(data){
        this.checkAttribute(data, 'interior');
    },

    applyBorders: function(borders, oldBolders){
        if(!borders){
            return borders;
        }

        borders = Ext.Array.from(borders);

        //<debug>
        if(Ext.Array.unique(Ext.Array.pluck(borders, 'position')).length != borders.length){
            Ext.raise('Invalid border positions supplied');
        }
        //</debug>

        return borders;
    },

    updateBorders: function(data){
        this.checkAttribute(data, 'border');
    },

    checkAttribute: function(data, checkName){
        var checks = this.getChecks(),
            values, keys, len, i, j, arr, key, obj, lenV, valid;

        if(!data || !checks || !checks[checkName]){
            return;
        }

        values = Ext.Array.from(data);
        lenV = values.length;
        for(i = 0; i < lenV; i++) {
            obj = values[i];
            keys = Ext.Object.getKeys(obj || {});
            len = keys.length;
            for (j = 0; j < len; j++) {
                key = keys[j];

                if(arr = checks[checkName][key] && obj[key]){
                    valid = (Ext.isArray(arr) ? Ext.Array.indexOf(arr, obj[key]) : arr === obj[key]);

                    if(!valid){
                        delete(obj[key]);
                        //<debug>
                        Ext.raise(Ext.String.format('Invalid key (%0) or value (%1) provided for Style!', key, obj[key]));
                        //</debug>
                    }
                }
            }
        }
    },

    /**
     * Returns the specified value formatted according to the format of this style.
     * @param v
     */
    getFormattedValue: function(v){
        var me = this,
            f = me.getFormat(),
            ret = v,
            fmt = Ext.util.Format;

        if(!f || f === 'General' || Ext.isEmpty(v)){
            return ret;
        }

        if(f === 'Currency'){
            return fmt.currency(v);
        }else if(f === 'Euro Currency') {
            return fmt.currency(v, '€');
        }else if(f === 'Percent'){
            return fmt.number(v * 100, '0.00') + '%';
        }else if(f === 'Scientific') {
            return Number(v).toExponential();
        }else if(me.datePatterns[f]){
            return fmt.date(v, me.datePatterns[f]);
        }else if(me.numberPatterns[f]){
            return fmt.number(v, me.numberPatterns[f]);
        }else if(me.booleanPatterns[f]){
            return v ? me.booleanPatterns[f][0] : me.booleanPatterns[f][1];
        }else if(Ext.isFunction(f)){
            return f(v);
        }
        return fmt.number(v, f);
    }


});