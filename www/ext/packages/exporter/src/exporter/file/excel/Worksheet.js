/**
 * This class is used to create an xml Excel Worksheet
 */
Ext.define('Ext.exporter.file.excel.Worksheet', {
    extend: 'Ext.exporter.file.Base',

    config: {
        /**
         * @cfg {String} name (required)
         *
         * This value must be unique within the list of sheet names in the workbook. Sheet names must conform to
         * the legal names of Excel sheets and, thus, cannot contain /, \, ?, *, [, ] and are limited to 31 chars.
         */
        name:           'Sheet',
        /**
         * @cfg {Boolean} protection
         *
         * This attribute indicates whether or not the worksheet is protected. When the worksheet is
         * not protected, cell-level protection has no effect.
         */
        protection:      null,
        /**
         * @cfg {Boolean} rightToLeft
         *
         * If this attribute is `true`, the window displays from right to left, but if this element is not
         * specified (or `false`), the window displays from left to right. The Spreadsheet component does not
         * support this attribute.
         */
        rightToLeft:    null,
        /**
         * @cfg {Boolean} [showGridLines=true]
         *
         * Should grid lines be visible in this spreadsheet?
         */
        showGridLines:  true,
        /**
         * @cfg {Ext.exporter.file.excel.Table[]} tables
         *
         * Collection of tables available in this worksheet
         */
        tables:         []
    },

    /**
     * @method getTables
     * @return {Ext.util.Collection}
     *
     * Returns the collection of tables available in this worksheet
     */
    
    tpl: [
        '   <Worksheet ss:Name="{name:htmlEncode}"',
        '<tpl if="this.exists(protection)"> ss:Protected="{protection:this.toNumber}"</tpl>',
        '<tpl if="this.exists(rightToLeft)"> ss:RightToLeft="{rightToLeft:this.toNumber}"</tpl>',
        '>\n',
        '<tpl if="tables"><tpl for="tables.getRange()">{[values.render()]}</tpl></tpl>',
        '       <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">\n',
        '          <PageSetup>\n',
        '              <Layout x:CenterHorizontal="1" x:Orientation="Portrait" />\n',
        '              <Header x:Margin="0.3" />\n',
        '              <Footer x:Margin="0.3" x:Data="Page &amp;P of &amp;N" />\n',
        '              <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75" />\n',
        '          </PageSetup>\n',
        '          <FitToPage />\n',
        '          <Print>\n',
        '              <PrintErrors>Blank</PrintErrors>\n',
        '              <FitWidth>1</FitWidth>\n',
        '              <FitHeight>32767</FitHeight>\n',
        '              <ValidPrinterInfo />\n',
        '              <VerticalResolution>600</VerticalResolution>\n',
        '          </Print>\n',
        '          <Selected />\n',
        '<tpl if="!showGridLines">',
        '          <DoNotDisplayGridlines />\n',
        '</tpl>',
        '          <ProtectObjects>False</ProtectObjects>\n',
        '          <ProtectScenarios>False</ProtectScenarios>\n',
        '      </WorksheetOptions>\n',
        '   </Worksheet>\n',
        {
            exists: function(value){
                return !Ext.isEmpty(value);
            },
            toNumber: function(value){
                return Number(Boolean(value));
            }
        }
    ],

    destroy: function() {
        this.setTables(null);
        this.callParent();
    },

    applyTables: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Table');
    },

    /**
     * Convenience method to add tables. You can also use workbook.getTables().add(config).
     * @param {Object/Array} config
     * @return {Ext.exporter.file.excel.Table/Ext.exporter.file.excel.Table[]}
     */
    addTable: function(config){
        return this.getTables().add(config || {});
    },

    /**
     * Convenience method to fetch a table by its id.
     * @param id
     * @return {Ext.exporter.file.excel.Table}
     */
    getTable: function(id){
        return this.getTables().get(id);
    },

    applyName: function(value){
        // Excel limits the worksheet name to 31 chars
        return Ext.String.ellipsis(String(value), 31);
    }

});
