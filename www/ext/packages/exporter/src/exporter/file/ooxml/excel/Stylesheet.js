/**
 * This is the root element of the Styles part.
 *
 * [CT_Stylesheet]
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Stylesheet', {
    extend: 'Ext.exporter.file.ooxml.Xml',

    requires: [
        'Ext.exporter.file.Style',
        'Ext.exporter.file.ooxml.excel.Font',
        'Ext.exporter.file.ooxml.excel.NumberFormat',
        'Ext.exporter.file.ooxml.excel.Fill',
        'Ext.exporter.file.ooxml.excel.Border',
        'Ext.exporter.file.ooxml.excel.CellXf'
    ],

    isStylesheet: true,

    config: {
        fonts: [{
            fontName: 'Arial',
            size: 10,
            family: 2
        }],
        numberFormats: null,
        fills: [{
            patternType: 'none'
        }],
        borders: [{
            left: {},
            top: {},
            right: {},
            bottom: {}
        }],
        cellStyleXfs: [{}],
        cellXfs: [{}]
    },

    contentType: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml'
    },

    relationship: {
        schema: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles'
    },

    folder: '/xl/',
    fileName: 'styles',

    tpl: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
        '<tpl if="numberFormats"><numFmts count="{numberFormats.length}"><tpl for="numberFormats.items">{[values.render()]}</tpl></numFmts></tpl>',
        '<tpl if="fonts"><fonts count="{fonts.length}"><tpl for="fonts.items">{[values.render()]}</tpl></fonts></tpl>',
        '<tpl if="fills"><fills count="{fills.length}"><tpl for="fills.items">{[values.render()]}</tpl></fills></tpl>',
        '<tpl if="borders"><borders count="{borders.length}"><tpl for="borders.items">{[values.render()]}</tpl></borders></tpl>',
        '<tpl if="cellStyleXfs"><cellStyleXfs count="{cellStyleXfs.length}"><tpl for="cellStyleXfs.items">{[values.render()]}</tpl></cellStyleXfs></tpl>',
        '<tpl if="cellXfs"><cellXfs count="{cellXfs.length}"><tpl for="cellXfs.items">{[values.render()]}</tpl></cellXfs></tpl>',
        '<tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium7"/>',
        '</styleSheet>'
    ],

    lastNumberFormatId: 164,

    datePatterns: {
        'General Date': '[$-F800]dddd, mmmm dd, yyyy',
        'Long Date': '[$-F800]dddd, mmmm dd, yyyy',
        'Medium Date': 'mm/dd/yy;@',
        'Short Date': 'm/d/yy;@',
        'Long Time': 'h:mm:ss;@',
        'Medium Time': '[$-409]h:mm AM/PM;@',
        'Short Time': 'h:mm;@'
    },
    numberPatterns: {
        'General Number': 1,
        'Fixed': 2,
        'Standard': 2,
        'Percent': 10,
        'Scientific': 11,
        'Currency': '"$"#,##0.00',
        'Euro Currency': '"€"#,##0.00'
    },
    booleanPatterns: {
        'Yes/No': '"Yes";-;"No"',
        'True/False': '"True";-;"False"',
        'On/Off': '"On";-;"Off"'
    },

    applyFonts: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Font');
    },
    applyNumberFormats: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.NumberFormat');
    },
    applyFills: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Fill');
    },
    applyBorders: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Border');
    },
    applyCellXfs: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.CellXf');
    },
    applyCellStyleXfs: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.CellStyleXf');
    },

    addFont: function(config){
        var col = this._fonts,
            ret, font;

        if(!col){
            this.setFonts([]);
            col = this._fonts;
        }

        // reuse item if already created
        // do not remove and add because used ids will get lost
        font = new Ext.exporter.file.ooxml.excel.Font(config);
        ret = col.indexOfKey(font.getKey());
        if(ret >= 0) {
            font.destroy();
        } else {
            col.add(font);
            ret = col.indexOf(font);
        }

        return ret;
    },

    addNumberFormat: function(config){
        var col = this._numberFormats,
            ret, temp;

        if(!col){
            this.setNumberFormats([]);
            col = this._numberFormats;
        }
        temp = new Ext.exporter.file.ooxml.excel.NumberFormat(config);
        ret = col.get(temp.getKey());

        if(!ret){
            ret = temp;
            col.add(ret);
            ret.setNumFmtId(this.lastNumberFormatId++);
        }

        return ret.getNumFmtId();
    },

    addFill: function(config){
        var col = this._fills,
            ret, fill;

        if(!col){
            this.setFills([]);
            col = this._fills;
        }

        // reuse item if already created
        // do not remove and add because used ids will get lost
        fill = new Ext.exporter.file.ooxml.excel.Font(config);
        ret = col.indexOfKey(fill.getKey());
        if(ret >= 0) {
            fill.destroy();
        } else {
            col.add(fill);
            ret = col.indexOf(fill);
        }

        return ret;
    },

    addBorder: function(config){
        var col = this._borders,
            ret, border;

        if(!col){
            this.setBorders([]);
            col = this._borders;
        }

        // reuse item if already created
        // do not remove and add because used ids will get lost
        border = new Ext.exporter.file.ooxml.excel.Border(config);
        ret = col.indexOfKey(border.getKey());
        if(ret >= 0) {
            border.destroy();
        } else {
            col.add(border);
            ret = col.indexOf(border);
        }

        return ret;
    },

    addCellXf: function(config){
        var col = this._cellXfs,
            ret, style;

        if(!col){
            this.setCellXfs([]);
            col = this._cellXfs;
        }

        // reuse item if already created
        // do not remove and add because used ids will get lost
        style = new Ext.exporter.file.ooxml.excel.CellXf(config);
        ret = col.indexOfKey(style.getKey());
        if(ret >= 0) {
            style.destroy();
        } else {
            col.add(style);
            ret = col.indexOf(style);
        }

        return ret;
    },

    addCellStyleXf: function(config){
        var col = this._cellStyleXfs,
            ret, style;

        if(!col){
            this.setCellStyleXfs([]);
            col = this._cellStyleXfs;
        }

        // reuse item if already created
        // do not remove and add because used ids will get lost
        style = new Ext.exporter.file.ooxml.excel.CellStyleXf(config);
        ret = col.indexOfKey(style.getKey());
        if(ret >= 0) {
            style.destroy();
        } else {
            col.add(style);
            ret = col.indexOf(style);
        }

        return ret;
    },

    getStyleParams: function(style){
        var me = this,
            s = (style && style.isStyle) ? style : new Ext.exporter.file.Style(style),
            cfg = s.getConfig(),
            numFmtId = 0,
            fontId = 0,
            fillId = 0,
            borderId = 0,
            xfId = 0;

        cfg.parentId = style ? style.parentId : null;
        if(cfg.font){
            fontId = me.addFont(cfg.font);
        }

        if(cfg.format){
            numFmtId = me.getNumberFormatId(cfg.format);
        }

        if(cfg.interior){
            fillId = me.addFill(cfg.interior);
        }

        if(cfg.borders){
            borderId = me.getBorderId(cfg.borders);
        }

        if(cfg.parentId){
            xfId = cfg.parentId;
        }

        return {
            numFmtId: numFmtId,
            fontId: fontId,
            fillId: fillId,
            borderId: borderId,
            xfId: xfId,
            alignment: cfg.alignment || null
        };
    },

    /**
     * Convenience method to add a new style. The returned index may be used as `styleId` in a Row or Cell.
     *
     * @param {Ext.exporter.file.Style} style
     * @return The index of the newly added {Ext.exporter.file.ooxml.excel.CellStyleXf} object
     */
    addStyle: function (style) {
        return this.addCellStyleXf(this.getStyleParams(style));
    },

    /**
     * Add a cell specific style.
     *
     * @param {Ext.exporter.file.Style} style
     * @param {Number} [parentStyleId] Optional id of the parent style that will be inherited
     * @return The index of the newly added {@link Ext.exporter.file.ooxml.excel.CellXf} object
     */
    addCellStyle: function (style, parentStyleId) {
        var styles = this.getCellXfs(),
            parentStyle, newStyle, ret;

        if(styles) {
            parentStyle = styles.getAt(parentStyleId);
            if(parentStyle) {
                newStyle = parentStyle.getConfig();
            }
        }

        return this.addCellXf( Ext.merge(newStyle || {}, this.getStyleParams(style)) );
    },

    getNumberFormatId: function(f){
        var me = this,
            isDate = !!me.datePatterns[f],
            id, code;

        if(f === 'General'){
            return 0;
        }

        code = me.datePatterns[f] || me.booleanPatterns[f] || me.numberPatterns[f];

        if(Ext.isNumeric(code)){
            id = code;
        }else if(!code){
            code = f;
        }

        return id || me.addNumberFormat({
                isDate: isDate,
                formatCode: code
            });
    },

    getBorderId: function(borders){
        var cfg = {},
            len = borders.length,
            i, b, key;

        for(i = 0; i < len; i++){
            b = borders[i];
            key = Ext.util.Format.lowercase(b.position);
            delete(b.position);
            cfg[key] = b;
        }

        return this.addBorder(cfg);
    }

});