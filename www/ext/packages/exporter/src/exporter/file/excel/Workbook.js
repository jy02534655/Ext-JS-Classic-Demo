/**
 * This class generates an Excel 2003 XML workbook.
 *
 * The workbook is the top level object of an xml Excel file.
 * It should have at least one Worksheet before rendering.
 *
 * This is how an xml Excel file looks like:
 *
 *  - Workbook
 *      - Style[]
 *      - Worksheet[]
 *          - Table[]
 *              - Column[]
 *              - Row[]
 *                  - Cell[]
 *
 *
 * Check Microsoft's website for more info about Excel XML:
 * https://msdn.microsoft.com/en-us/Library/aa140066(v=office.10).aspx
 *
 *
 * Here is an example of how to create an Excel XML document:
 *
 *      var workbook = Ext.create('Ext.exporter.file.excel.Workbook', {
 *              title:  'My document',
 *              author: 'John Doe'
 *          }),
 *          table = workbook.addWorksheet({
 *              name:   'Sheet 1'
 *          }).addTable();
 *
 *      // add formatting to the first two columns of the spreadsheet
 *      table.addColumn({
 *          width:  120,
 *          styleId: workbook.addStyle({
 *              format: 'Long Time'
 *          }).getId()
 *      });
 *      table.addColumn({
 *          width:  100,
 *          styleId: workbook.addStyle({
 *              format: 'Currency'
 *          }).getId()
 *      });
 *
 *      // add rows and cells with data
 *      table.addRow().addCell([{
 *          value: 'Date'
 *      },{
 *          value: 'Value'
 *      }]);
 *      table.addRow().addCell([{
 *          value: new Date('06/17/2015')
 *      },{
 *          value: 15
 *      }]);
 *      table.addRow().addCell([{
 *          value: new Date('06/18/2015')
 *      },{
 *          value: 30
 *      }]);
 *
 *      //add a formula on the 4th row which sums up the previous 2 rows
 *      table.addRow().addCell({
 *          index: 2,
 *          formula: '=SUM(R[-2]C:R[-1]C)'
 *      });
 *
 *      // save the document in the browser
 *      Ext.exporter.File.saveAs(workbook.render(), 'document.xml', 'UTF-8');
 *
 */
Ext.define('Ext.exporter.file.excel.Workbook', {
    extend: 'Ext.exporter.file.Base',

    requires: [
        'Ext.exporter.file.excel.Worksheet',
        'Ext.exporter.file.excel.Table',
        'Ext.exporter.file.excel.Style',
        'Ext.exporter.file.excel.Row',
        'Ext.exporter.file.excel.Column',
        'Ext.exporter.file.excel.Cell'
    ],

    config: {
        /**
         * @cfg {String} [title="Workbook"]
         *
         * The title of the workbook
         */
        title: "Workbook",

        /**
         * @cfg {String} [author="Sencha"]
         *
         * The author of the generated Excel file
         */
        author: 'Sencha',

        /**
         * @cfg {Number} [windowHeight=9000]
         *
         * Excel window height
         */
        windowHeight: 9000,

        /**
         * @cfg {Number} [windowWidth=50000]
         *
         * Excel window width
         */
        windowWidth: 50000,

        /**
         * @cfg {Boolean} [protectStructure=false]
         *
         * Protect structure
         */
        protectStructure: false,

        /**
         * @cfg {Boolean} [protectWindows=false]
         *
         * Protect windows
         */
        protectWindows: false,

        /**
         * @cfg {Ext.exporter.file.excel.Style[]} styles
         *
         * Collection of styles available in this workbook
         */
        styles: [],

        /**
         * @cfg {Ext.exporter.file.excel.Worksheet[]} worksheets
         *
         * Collection of worksheets available in this workbook
         */
        worksheets: []
    },

    /**
     * @method getStyles
     * @returns {Ext.util.Collection}
     *
     * Returns the collection of styles available in this workbook
     */

    /**
     * @method getWorksheets
     * @returns {Ext.util.Collection}
     *
     * Returns the collection of worksheets available in this workbook
     */

    tpl:[
        '<?xml version="1.0" encoding="utf-8"?>\n',
        '<?mso-application progid="Excel.Sheet"?>\n',
        '<Workbook ',
        'xmlns="urn:schemas-microsoft-com:office:spreadsheet" ',
        'xmlns:o="urn:schemas-microsoft-com:office:office" ',
        'xmlns:x="urn:schemas-microsoft-com:office:excel" ',
        'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ',
        'xmlns:html="http://www.w3.org/TR/REC-html40">\n',
        '   <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\n',
        '       <Title>{title:htmlEncode}</Title>\n',
        '       <Author>{author:htmlEncode}</Author>\n',
        '       <Created>{createdAt}</Created>\n',
        '   </DocumentProperties>\n',
        '   <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">\n',
        '       <WindowHeight>{windowHeight}</WindowHeight>\n',
        '       <WindowWidth>{windowWidth}</WindowWidth>\n',
        '       <ProtectStructure>{protectStructure}</ProtectStructure>\n',
        '       <ProtectWindows>{protectWindows}</ProtectWindows>\n',
        '   </ExcelWorkbook>\n',
        '   <Styles>\n',
        '<tpl if="styles"><tpl for="styles.getRange()">{[values.render()]}</tpl></tpl>',
        '   </Styles>\n',
        '<tpl if="worksheets"><tpl for="worksheets.getRange()">{[values.render()]}</tpl></tpl>',
        '</Workbook>'
    ],

    destroy: function() {
        this.setStyles(null);
        this.setWorksheets(null);
        this.callParent();
    },

    applyStyles: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Style');
    },

    applyWorksheets: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Worksheet');
    },

    /**
     * Convenience method to add styles. You can also use workbook.getStyles().add(config).
     * @param {Object/Array} config
     * @returns {Ext.exporter.file.excel.Style/Ext.exporter.file.excel.Style[]}
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
     * @returns {Ext.exporter.file.excel.Style}
     */
    getStyle: function(id){
        return this.getStyles().get(id);
    },

    /**
     * Convenience method to add worksheets. You can also use workbook.getWorksheets().add(config).
     * @param {Object/Array} config
     * @returns {Ext.exporter.file.excel.Worksheet/Ext.exporter.file.excel.Worksheet[]}
     */
    addWorksheet: function(config){
        return this.getWorksheets().add(config || {});
    },

    /**
     * Convenience method to fetch a worksheet by its id.
     * @param id
     * @returns {Ext.exporter.file.excel.Worksheet}
     */
    getWorksheet: function(id){
        return this.getWorksheets().get(id);
    }

});
