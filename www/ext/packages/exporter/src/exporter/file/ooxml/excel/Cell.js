/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Cell', {
    extend: 'Ext.exporter.file.Base',

    isCell: true,

    config: {
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Row} row
         *
         * Reference to the parent row
         */
        row: null,
        /**
         * @cfg {String} dataType (required)
         *
         * The cell's data type. Possible values:
         *
         * - `b` (Boolean) Cell containing a boolean.
         * - `d` (Date) Cell contains a date in the ISO 8601 format.
         * - `e` (Error) Cell containing an error.
         * - `inlineStr` (InlineString) Cell containing an (inline) rich string, i.e., one not in the shared
         * string table. If this cell type is used, then the cell value is in the `is` element rather than the `v`
         * element in the cell (`c` element).
         * - `n` (Number) Cell containing a number.
         * - `s` (SharedString) Cell containing a shared string.
         * - `str` (String) Cell containing a formula string.
         */
        dataType: null,
        /**
         * @cfg {Boolean} [showPhonetic]
         *
         * `true` if the cell should show phonetic.
         */
        showPhonetic: null,
        /**
         * @cfg {Number} index
         *
         * Specifies the column index of this cell within the containing row. If this tag is not specified, the first
         * instance of a Cell element within a row has an assumed Index="1".
         *
         */
        index: null,
        /**
         * @cfg {String} styleId
         *
         * The index of this cell's style. Style records are stored in the Styles Part.
         */
        styleId: null,
        /**
         * @cfg {Number} mergeAcross
         *
         * Number of cells to merge to the right side of this cell
         */
        mergeAcross: null,
        /**
         * @cfg {Number} mergeDown
         *
         * Number of cells to merge below this cell
         */
        mergeDown: null,
        /**
         * @cfg {Number/Date/String} value (required)
         *
         * Value assigned to this cell
         */
        value: null,
        /**
         * @cfg {Boolean} serializeDateToNumber
         *
         * Set to `true` to serialize Date values to numbers like the function DATEVALUE from Excel does.
         *
         * Google docs can only handle Dates serialized as numbers.
         */
        serializeDateToNumber: true
    },

    isMergedCell: false,

    tpl: [
        '<c r="{ref}"',
        '<tpl if="value != null"> t="{dataType}"</tpl>',
        '<tpl if="showPhonetic"> ph="1"</tpl>',
        '<tpl if="styleId"> s="{styleId}"</tpl>',
        '<tpl if="value == null">/><tpl else>><v>{value}</v></c></tpl>'
    ],

    constructor: function(config){
        var cfg = config;

        if(config == null || Ext.isDate(config) || Ext.isPrimitive(config)){
            cfg = {
                value: config
            };
        }
        return this.callParent([cfg]);
    },

    destroy: function(){
        this.setRow(null);
        this.callParent();
    },

    /**
     * Returns the cell reference using the A4 notation
     * @return {String}
     */
    getRef: function(){
        return this.getNotation(this._index) + this._row._index;
    },

    getRenderData: function(){
        var me = this,
            data = {},
            ws = me._row && me._row._worksheet,
            wb = ws && ws._workbook;

        data.dataType = me._dataType;
        data.value = me._value;
        data.showPhonetic = me._showPhonetic;
        data.styleId = me._styleId;
        if(this.isMergedCell && ws) {
            ws.setMergedCellsNo(ws._mergedCellsNo + 1);
        }
        if(data.dataType === 's' && wb){
            data.value = wb._sharedStrings.addString(data.value);
        }
        data.ref = this.getRef();

        return data;
    },

    applyValue: function(v){
        var me = this,
            dt;
        
        if(v != null) {
            if (typeof v === 'number') {
                dt = 'n';
            } else if (typeof v === 'string') {
                dt = 's';
                v = Ext.util.Format.stripTags(v);
            } else if (v instanceof Date) {
                // there are 2 ways to store a date:
                if(me.getSerializeDateToNumber()) {
                    // 1: using dataType "n" for number
                    dt = 'n';
                    v = me.dateValue(v);
                } else {
                    // 2: using dataType "d" for Date
                    dt = 'd';
                    v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
                }
            } else {
                dt = 'b';
            }

            me.setDataType(dt);
        }
        return v;
    },

    updateMergeAcross: function (v) {
        this.isMergedCell = (v || this._mergeDown);
    },

    updateMergeDown: function(v){
        this.isMergedCell = (v || this._mergeAcross);
    },

    getMergedCellRef: function () {
        var me = this,
            currIndex = me._index,
            rowIndex = me._row._index,
            mAcross = me._mergeAcross,
            mDown = me._mergeDown,
            s = me.getNotation(currIndex) + rowIndex + ':';

        if(mAcross){
            currIndex += mAcross;
        }
        if(mDown){
            rowIndex += mDown;
        }
        s += me.getNotation(currIndex) + rowIndex;
        return s;
    },

    /**
     * Formats a number to the A1 style
     *
     * @param index
     * @return {string}
     */
    getNotation: function(index){
        var code = 65,
            length = 26,
            getChar = String.fromCharCode,
            r, n;

        if(index <= 0){
            index = 1;
        }

        n = Math.floor(index / length);
        r = index % length;

        if(n === 0 || index === length){
            return getChar(code + index - 1);
        }else if(r === 0){
            return this.getNotation(n - 1) + 'Z';
        }else if(n < length){
            return getChar(code + n - 1) + getChar(code + r - 1);
        }else{
            return this.getNotation(n) + getChar(code + r - 1);
        }
    },

    /**
     * Excel stores dates as sequential serial numbers so that they can be used in calculations.
     * By default, January 1, 1900, is serial number 1, and January 1, 2008, is serial number
     * 39448 because it is 39,448 days after January 1, 1900.
     *
     * The DATEVALUE function in Excel returns the serial number of the date that is represented
     * by the text date.
     *
     * This function converts a javascript date to a serial number.
     *
     * @param {Date} d
     * @private
     */
    dateValue: function(d) {
        // 25569 is the serial number for 1/1/1970
        return 25569.0 + ((d.getTime() - (d.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
    }
});