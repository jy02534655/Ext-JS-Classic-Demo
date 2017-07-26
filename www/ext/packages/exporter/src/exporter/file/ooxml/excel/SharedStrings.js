/**
 * A workbook can contain thousands of cells containing string (non-numeric) data. Furthermore this
 * data is very likely to be repeated across many rows or columns. The goal of implementing a single
 * string table that is shared across the workbook is to improve performance in opening and saving
 * the file by only reading and writing the repetitive information once.
 *
 * [Example: Consider for example a workbook summarizing information for cities within various countries.
 * There can be a column for the name of the country, a column for the name of each city in that country,
 * and a column containing the data for each city. In this case the country name is repetitive, being
 * duplicated in many cells. end example] In many cases the repetition is extensive, and significant savings
 * are realized by making use of a shared string table when saving the workbook. When displaying text in
 * the spreadsheet, the cell table will just contain an index into the string table as the value of a cell,
 * instead of the full string.
 *
 * The shared string table is permitted to contain all the necessary information for displaying the string:
 * the text, formatting properties, and phonetic properties (for East Asian languages).
 *
 * Most strings in a workbook have formatting applied at the cell level, that is, the entire string in the
 * cell has the same formatting applied. In these cases, the formatting for the cell is stored in the styles
 * part, and the string for the cell can be stored in the shared strings table. In this case, the strings
 * stored in the shared strings table are very simple text elements.
 *
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.SharedStrings', {
    extend: 'Ext.exporter.file.ooxml.Xml',

    isSharedStrings: true,

    config: {
        strings: []
    },

    contentType: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml'
    },

    relationship: {
        schema: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings'
    },

    folder: '/xl/',
    fileName: 'sharedStrings',

    tpl: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{strings.length}" uniqueCount="{strings.length}">',
        '<tpl for="strings.getRange()"><si><t>{.:this.utf8}</t></si></tpl>',
        '</sst>',
        {
            utf8: function(v){
                return Ext.util.Base64._utf8_encode(v);
            }
        }
    ],

    destroy: function(){
        this.setStrings(null);
        this.callParent();
    },

    applyStrings: function(data, dataCollection) {
        var col;

        if(data) {
            col = new Ext.util.Collection({
                keyFn: Ext.identityFn
            });
            col.add(data);
        }

        Ext.destroy(dataCollection);

        return col;
    },

    addString: function(value){
        var v = Ext.util.Format.htmlEncode(value),
            s = this.getStrings(),
            index;

        if(!s) {
            this.setStrings([]);
            s = this.getStrings();
        }

        index = s.indexOfKey(v);

        if(index < 0){
            s.add(v);
            index = s.length - 1;
        }

        return index;
    }
});