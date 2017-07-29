/**
 * Represents the PivotTable root element for non-null PivotTables. There exists one pivotTableDefinition
 * for each PivotTableDefinition part.
 *
 * (CT_PivotTableDefinition)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.PivotTable', {
    extend: 'Ext.exporter.file.ooxml.XmlRels',

    requires: [
        'Ext.exporter.file.ooxml.excel.Location',
        'Ext.exporter.file.ooxml.excel.PivotField',
        'Ext.exporter.file.ooxml.excel.Field',
        'Ext.exporter.file.ooxml.excel.Item',
        'Ext.exporter.file.ooxml.excel.DataField',
        'Ext.exporter.file.ooxml.excel.PivotCacheDefinition',
        'Ext.exporter.file.ooxml.excel.PivotTableStyleInfo'
    ],

    config: {

        /**
         * @cfg {Boolean} [applyAlignmentFormats]
         *
         * If true apply legacy table autoformat alignment properties.
         */
        applyAlignmentFormats: false,
        /**
         * @cfg {Boolean} [applyBorderFormats]
         *
         * If true apply legacy table autoformat border properties.
         */
        applyBorderFormats: false,
        /**
         * @cfg {Boolean} [applyFontFormats]
         *
         * If true apply legacy table autoformat font properties.
         */
        applyFontFormats: false,
        /**
         * @cfg {Boolean} [applyNumberFormats]
         *
         * If true apply legacy table autoformat number format properties.
         */
        applyNumberFormats: false,
        /**
         * @cfg {Boolean} [applyPatternFormats]
         *
         * If true apply legacy table autoformat pattern properties.
         */
        applyPatternFormats: false,
        /**
         * @cfg {Boolean} [applyWidthHeightFormats]
         *
         * If true apply legacy table autoformat width/height properties.
         */
        applyWidthHeightFormats: true,
        /**
         * @cfg {Boolean} [asteriskTotals]
         *
         * Specifies a boolean value that indicates whether an asterisks should be displayed in subtotals and
         * totals when visual totals are not used in OLAP -based PivotTables.
         *
         * A value of 1 or true indicates an asterisks are displayed in subtotals and totals for OLAP
         * PivotTables when visual tools are not available.
         *
         * A value of 0 or false indicates an asterisk will not be displayed. This attribute depends on the
         * implementation and availability of visual tools in the application user interface.
         */
        asteriskTotals: null,
        /**
         * @cfg {Number} [autoFormatId]
         *
         * Identifies which legacy table autoformat to apply.
         *
         * Use a value >= 4096 and <= 4117.
         *
         * Annex G of the file c061750_ISO_IEC_29500-1_2012.pdf contains a listing of the supported PivotTable
         * AutoFormats, example formatting, and a sample workbook with each of those AutoFormats applied.
         */
        autoFormatId: 4096,
        /**
         * @cfg {Number} cacheId (required)
         *
         * Specifies the identifier of the related PivotCache definition. This Id is listed in the pivotCaches
         * collection in the workbook part.
         */
        cacheId: null,
        /**
         * @cfg {Number} [chartFormat]
         *
         * Specifies the next chart formatting identifier to use on the PivotTable.
         */
        chartFormat: null,
        /**
         * @cfg {Boolean} [colGrandTotals]
         *
         * Specifies a boolean value that indicates whether grand totals should be displayed for the PivotTable columns.
         *
         * A value of 1 or true indicates grand totals should be displayed.
         *
         * A value of 0 or false indicates grand totals should not be displayed for PivotTable columns.
         */
        colGrandTotals: null,
        /**
         * @cfg {String} [colHeaderCaption]
         *
         * Specifies the string to be displayed in column header in compact mode. This attribute depends on whether
         * the application implements a compact mode for displaying PivotTables in the user interface.
         */
        colHeaderCaption: null,
        /**
         * @cfg {Boolean} [compact]
         *
         * Specifies a boolean value that indicates whether new fields should have their compact flag set to true.
         *
         * A value of 1 or true indicates new fields should default to compact mode equal to true.
         *
         * A value of 0 or false indicates new fields should default to compact mode equal to false. This attribute
         * depends on whether the application implements a compact mode in the user interface.
         */
        compact: false,
        /**
         * @cfg {Boolean} [compactData]
         *
         * Specifies a boolean value that indicates whether the field next to the data field in the
         * PivotTable should be displayed in the same column of the spreadsheet
         */
        compactData: false,
        /**
         * @cfg {Number} [createdVersion]
         *
         * Specifies the version of the application that created the cache. This attribute is application-dependent.
         */
        createdVersion: null,
        /**
         * @cfg {Boolean} [customListSort]
         *
         * Specifies a boolean value that indicates whether the "custom lists" option is offered when sorting
         * this PivotTable.
         *
         * A value of 1 or true indicates custom lists are offered when sorting this PivotTable.
         *
         * A value of 0 or false indicates custom lists are not offered. This attribute depends on the
         * implementation of sorting features in the application.
         */
        customListSort: null,
        /**
         * @cfg {String} dataCaption (required)
         *
         * Specifies the name of the value area field header in the PivotTable. This caption is shown in
         * the PivotTable when two or more fields are in the values area.
         */
        dataCaption: 'Values',
        /**
         * @cfg {Boolean} [dataOnRows]
         *
         * Specifies a boolean value that indicates whether the field representing multiple fields in the data
         * region is located in the row area or the column area.
         *
         * A value of 1 or true indicates that this field is located in the row area.
         *
         * A value of 0 or false indicates that this field is located in the column area.
         */
        dataOnRows: null,
        /**
         * @cfg {Number} [dataPosition]
         *
         * Specifies the position for the field representing multiple data field in the PivotTable, whether
         * that field is located in the row area or column area.
         *
         * Missing attribute indicates this field is last, or innermost in the field list.
         *
         *  - 0 indicates this field is first, or outermost in the field list.
         *  - 1 indicates this field is second in the field list.
         *  - 2 indicates this field is third in the field list, and increasing values follow this pattern.
         *
         *  If this value is higher than the number of fields in the field list, then this field is last, or
         *  innermost in the field list.
         */
        dataPosition: null,
        /**
         * @cfg {Boolean} [disableFieldList]
         *
         * Specifies a boolean value that indicates whether to disable the PivotTable field list.
         *
         * A value of 1 or true indicates the field list, or similar mechanism for selecting fields in the
         * user interface, is disabled.
         *
         * A value of 0 or false indicates the field list is enabled.
         */
        disableFieldList: null,
        /**
         * @cfg {Boolean} [editData]
         *
         * Specifies a boolean value that indicates whether the user is allowed to edit the cells in the data
         * area of the PivotTable.
         *
         * A value of 1 or true indicates the user can edit values in the data area.
         *
         * A value of 0 or false indicates the cells in the data area are not editable.
         */
        editData: null,
        /**
         * @cfg {Boolean} [enableDrill]
         *
         * Specifies a boolean value that indicates whether the user is prevented from drilling down on a
         * PivotItem or aggregate value.
         *
         * A value of 1 or true indicates the user can drill down on a pivot item or aggregate value.
         *
         * A value of 0 or false indicates the user is prevented from drilling down pivot item.
         */
        enableDrill: null,
        /**
         * @cfg {Boolean} [enableFieldProperties]
         *
         * Specifies a boolean value that indicates whether the user is prevented from displaying PivotField
         * properties.
         *
         * A value of 1 or true indicates the user can display pivot field properties.
         *
         * A value of 0 or false indicates the user cannot display pivot field properties. This attribute
         * depends on how pivot field properties are exposed in the application user interface.
         */
        enableFieldProperties: null,
        /**
         * @cfg {Boolean} [enableWizard]
         *
         * Specifies a boolean value that indicates whether the user is prevented from displaying the
         * PivotTable wizard.
         *
         * A value of 1 or true indicates the user can display the PivotTable wizard.
         *
         * A value of 0 or false indicates the user can not display the PivotTable wizard. This attribute
         * depends on whether the application exposes a wizard or similar mechanism for creating and working
         * with PivotTables in the user interface.
         */
        enableWizard: null,
        /**
         * @cfg {String} [errorCaption]
         *
         * Specifies the string to be displayed in cells that contain errors.
         */
        errorCaption: null,
        /**
         * @cfg {Boolean} [fieldListSortAscending]
         *
         * Specifies a boolean value that indicates whether fields in the PivotTable are sorted in non-default
         * order in the field list.
         *
         * A value of 1 or true indicates fields for the PivotTable are sorted in the field list. The sort
         * order from the data source is applied for range-based PivotTables. Alphabetical sorting is applied
         * for external data PivotTables.
         *
         * A value of 0 or false indicates fields in the field list are not sorted.
         */
        fieldListSortAscending: null,
        /**
         * @cfg {Boolean} [fieldPrintTitles]
         *
         * Specifies a boolean value that indicates whether the row and column titles from the PivotTable
         * should be printed.
         *
         * A value of 1 or true indicates row and column titles should be printed.
         *
         * A value of 0 or false indicates row and column titles should not be printed.
         */
        fieldPrintTitles: null,
        /**
         * @cfg {String} [grandTotalCaption]
         *
         * Specifies the string to be displayed for grand totals.
         */
        grandTotalCaption: null,
        /**
         * @cfg {Boolean} [gridDropZones]
         *
         * Specifies a boolean value that indicates whether the in-grid drop zones should be displayed at
         * runtime, and whether classic layout is applied.
         *
         * A value of 1 or true indicates in-grid drop zones should be displayed and classic layout should be
         * applied to the PivotTable.
         *
         * A value of 0 or false indicates in-grid drop zones should be disabled and classic layout should not
         * be applied.
         *
         * **Note**: Grid drop zones are optional runtime UI, determined by the application, that indicate to
         * the user the locations of the page, row, column, and data fields in the PivotTable report. See layout
         * discussion under pivotTableDefinition for the precise locations of these areas.
         */
        gridDropZones: null,
        /**
         * @cfg {Boolean} [immersive]
         *
         * Specifies a boolean value that indicates whether PivotTable immersive experience user interface
         * should be turned off.
         *
         * A value of 1 or true indicates the PivotTable immersive experience should be turned off for this
         * PivotTable.
         *
         * A value of 0 or false indicates the immersive experience should be left on. This attribute
         * depends on whether the application implements an immersive experience in the user interface.
         */
        immersive: null,
        /**
         * @cfg {Number} [indent]
         *
         * Specifies the indentation increment for compact axis and can be used to set the Report Layout
         * to Compact Form.
         */
        indent: null,
        /**
         * @cfg {Boolean} [itemPrintTitles]
         *
         * Specifies a boolean value that indicates whether PivotItem names should be repeated at the top of
         * each printed page.
         *
         * A value of 1 or true indicates pivot items names should be repeated at the top of each page.
         *
         * A value of 0 or false indicates should not be repeated.
         */
        itemPrintTitles: true,
        /**
         * @cfg {Boolean} [mdxSubqueries]
         *
         * Specifies a boolean value that indicates whether MDX sub-queries are supported by OLAP data provider
         * for this PivotTable.
         *
         * A value of 1 or true indicates MDX sub-queries are supported by the OLAP data provider.
         *
         * A value of 0 or false indicates MDX sub-queries are not supported.
         */
        mdxSubqueries: null,
        /**
         * @cfg {Boolean} [mergeItem]
         *
         * Specifies a boolean value that indicates whether row or column titles that span multiple cells
         * should be merged into a single cell.
         *
         * A value of 1 or true indicates that titles that span multiple cells are merged into a single cell.
         *
         * A value of 0 or false indicates titles are not merged.
         */
        mergeItem: null,
        /**
         * @cfg {Number} [minRefreshableVersion]
         *
         * Specifies the minimum version of the application required to update this PivotTable view.
         * This attribute is application-dependent.
         */
        minRefreshableVersion: null,
        /**
         * @cfg {String} [missingCaption]
         *
         * Specifies the string to be displayed in cells with no value
         */
        missingCaption: null,
        /**
         * @cfg {Boolean} [multipleFieldFilters]
         *
         * Specifies a boolean value that indicates whether the fields of a PivotTable can have
         * multiple filters set on them.
         *
         * A value of 1 or true indicates the fields of a PivotTable can have multiple filters.
         *
         * A value of 0 or false indicates the fields of a PivotTable can only have a simple filter.
         */
        multipleFieldFilters: false,
        /**
         * @cfg {String} name (required)
         *
         * Specifies the PivotTable name.
         */
        name: null,
        /**
         * @cfg {Boolean} [outline]
         *
         * Specifies a boolean value that indicates whether new fields should have their outline flag set to true.
         *
         * A value of 1 or true indicates new fields are created with outline equal to true.
         *
         * A value of 0 or false indicates new fields are created with outline equal to false.
         */
        outline: true,
        /**
         * @cfg {Boolean} [outlineData]
         *
         * Specifies a boolean value that indicates whether data fields in the PivotTable should be
         * displayed in outline form.
         *
         * A value of 1 or true indicates data fields will display in outline form.
         *
         * A value of 0 or false indicates data fields will not display in outline form.
         */
        outlineData: null,
        /**
         * @cfg {Boolean} [pageOverThenDown]
         *
         * Specifies a boolean value that indicates how the page fields are laid out when there are multiple
         * PivotFields in the page area.
         *
         * A value of 1 or true indicates the fields will display "Over, then down"
         *
         * A value of 0 or false indicates the fields will display "down, then Over"
         */
        pageOverThenDown: null,
        /**
         * @cfg {String} [pageStyle]
         *
         * Specifies the name of the style to apply to each of the field item headers in the page
         * area of the PivotTable.
         */
        pageStyle: null,
        /**
         * @cfg {Number} [pageWrap]
         *
         * Specifies the number of page fields to display before starting another row or column.
         */
        pageWrap: null,
        /**
         * @cfg {String} [pivotTableStyle]
         *
         * Specifies the name of the style to apply to the main table area of the PivotTable.
         */
        pivotTableStyle: null,
        /**
         * @cfg {Boolean} [preserveFormatting]
         *
         * Specifies a boolean value that indicates whether the formatting applied by the user to the
         * PivotTable cells is discarded on refresh.
         *
         * A value of 1 or true indicates the formatting applied by the end user is discarded on refresh.
         *
         * A value of 0 or false indicates the end-user formatting is retained on refresh.
         */
        preserveFormatting: null,
        /**
         * @cfg {Boolean} [printDrill]
         *
         * Specifies a boolean value that indicates whether drill indicators expand collapse buttons should be printed.
         *
         * A value of 1 or true indicates that these buttons should be printed.
         *
         * A value of 0 or false indicates that these buttons should not be printed.
         */
        printDrill: null,
        /**
         * @cfg {Boolean} [published]
         *
         * Specifies a boolean value that indicates whether data fields in the PivotTable are published and
         * available for viewing in a server rendering environment.
         *
         * A value of 1 or true indicates that the data fields in the PivotTable are published and shall be
         * available for viewing in a server rendering environment.
         *
         * A value of 0 or false indicates that the data fields in the PivotTable are not published and shall
         * not be available for viewing in a server rendering environment.
         */
        published: null,
        /**
         * @cfg {Boolean} [rowGrandTotals]
         *
         * Specifies a boolean value that indicates whether grand totals should be displayed for the
         * PivotTable rows. The default value for this attribute is true.
         *
         * A value of 1 or true indicates grand totals are displayed for the PivotTable rows.
         *
         * A value of 0 or false indicates grand totals will not be displayed.
         */
        rowGrandTotals: null,
        /**
         * @cfg {String} [rowHeaderCaption]
         *
         * Specifies the string to be displayed in row header in compact mode.
         */
        rowHeaderCaption: null,
        /**
         * @cfg {Boolean} [showCalcMbrs]
         *
         * Specifies a boolean value that indicates whether calculated members should be shown in the
         * PivotTable view. This attribute applies to PivotTables from OLAP-sources only.
         *
         * A value of 1 or true indicates that calculated members should be shown.
         *
         * A value of 0 or false indicates calculated members should not be shown.
         */
        showCalcMbrs: null,
        /**
         * @cfg {Boolean} [showDataDropDown]
         *
         * Specifies a boolean value that indicates whether the drop-down lists for the fields in the
         * PivotTable should be hidden. This attribute depends on whether the application implements drop down
         * lists or similar mechanism in the user interface.
         *
         * A value of 1 or true indicates drop down lists are displayed for fields.
         *
         * A value of 0 or false indicates drop down lists will not be displayed.
         */
        showDataDropDown: null,
        /**
         * @cfg {Boolean} [showDataTips]
         *
         * Specifies a boolean value that indicates whether tooltips should be displayed for PivotTable data cells.
         *
         * A value of 1 or true indicates tooltips are displayed.
         *
         * A value of 0 or false indicates tooltips will not be displayed. This attribute depends on
         * whether the application employs tooltips or similar mechanism in the user interface.
         */
        showDataTips: null,
        /**
         * @cfg {Boolean} [showDrill]
         *
         * Specifies a boolean value that indicates whether drill indicators should be hidden.
         *
         * A value of 1 or true indicates drill indicators are displayed.
         *
         * A value of 0 or false indicates drill indicators will not be displayed.
         */
        showDrill: null,
        /**
         * @cfg {Boolean} [showDropZones]
         *
         * Specifies a boolean value that indicates whether the PivotTable should display large drop zones
         * when there are no fields in the data region.
         *
         * A value of 1 or true indicates a large drop zone is displayed.
         *
         * A value of 0 or false indicates a large drop zone will not be displayed.
         */
        showDropZones: null,
        /**
         * @cfg {Boolean} [showEmptyCol]
         *
         * Specifies a boolean value that indicates whether to include empty columns in the table.
         *
         * A value of 1 or true indicates empty columns are included in the PivotTable.
         *
         * A value of 0 or false indicates empty columns are excluded.
         */
        showEmptyCol: null,
        /**
         * @cfg {Boolean} [showEmptyRow]
         *
         * Specifies a boolean value that indicates whether to include empty rows in the table.
         *
         * A value of 1 or true indicates empty rows are included in the PivotTable.
         *
         * A value of 0 or false indicates empty rows are excluded.
         */
        showEmptyRow: null,
        /**
         * @cfg {Boolean} [showError]
         *
         * Specifies a boolean value that indicates whether to show error messages in cells.
         *
         * A value of 1 or true indicates error messages are shown in cells.
         *
         * A value of 0 or false indicates error messages are shown through another mechanism the
         * application provides in the user interface.
         */
        showError: null,
        /**
         * @cfg {Boolean} [showHeaders]
         *
         * Specifies a boolean value that indicates whether to suppress display of pivot field headers.
         *
         * A value of 1 or true indicates field headers are shown in the PivotTable.
         *
         * A value of 0 or false indicates field headers are excluded.
         */
        showHeaders: null,
        /**
         * @cfg {Boolean} [showItems]
         *
         * Specifies a boolean value that indicates whether to display item names when adding a field onto
         * a PivotTable that has no data fields.
         *
         * A value of 1 or true indicates item names are displayed.
         *
         * A value of 0 or false indicates item names will not be displayed.
         */
        showItems: null,
        /**
         * @cfg {Boolean} [showMemberPropertyTips]
         *
         * Specifies a boolean value that indicates whether member property information should be omitted
         * from PivotTable tooltips.
         *
         * A value of 1 or true indicates member property information is included.
         *
         * A value of 0 or false indicates member property information is excluded. This attribute depends on
         * whether the application employs tooltips or similar mechanism in the user interface.
         */
        showMemberPropertyTips: null,
        /**
         * @cfg {Boolean} [showMissing]
         *
         * Specifies a boolean value that indicates whether to show a message in cells with no value.
         *
         * A value of 1 or true indicates to show a message string in cells without values.
         *
         * A value of 0 or false indicates no message string will shown in cells without values.
         */
        showMissing: null,
        /**
         * @cfg {Boolean} [showMultipleLabel]
         *
         * Specifies a boolean value that indicates whether a page field with multiple selected items should
         * display "(multiple items)" instead of "All". This attribute applies only to non-OLAP PivotTables.
         * The messages displayed depend on the application implementation.
         *
         * A value of 1 or true indicates a different message string is displayed for a page field with
         * multiple items.
         *
         * A value of 0 or false indicates the same message string is displayed for all page fields.
         */
        showMultipleLabel: null,
        /**
         * @cfg {Boolean} [subtotalHiddenItems]
         *
         * Specifies a boolean value that indicates whether data for hidden pivotItems for PivotFields in the
         * data area should be included in subtotals.
         *
         * A value of 1 or true indicates that data for hidden pivot items in the data area is included in
         * subtotals.
         *
         * A value of 0 or false indicates hidden pivot items will not be included in subtotals.
         */
        subtotalHiddenItems: null,
        /**
         * @cfg {String} [tag]
         *
         * Specifies a user-defined string that is associated with this PivotTable.
         */
        tag: null,
        /**
         * @cfg {Number} [updatedVersion]
         *
         * Specifies the version of the application that last updated the PivotTable view. This attribute is
         * application-dependent.
         */
        updatedVersion: null,
        /**
         * @cfg {Boolean} [useAutoFormatting]
         *
         * Specifies a boolean value that indicates whether legacy auto formatting has been applied
         * to the PivotTable view.
         *
         * A value of 1 or true indicates that legacy auto formatting has been applied to the PivotTable.
         *
         * A value of 0 or false indicates that legacy auto formatting has not been applied to the PivotTable.
         */
        useAutoFormatting: true,
        /**
         * @cfg {String} [vacatedStyle]
         *
         * Specifies the name of the style to apply to the cells left blank when a PivotTable shrinks
         * during a refresh operation
         */
        vacatedStyle: null,
        /**
         * @cfg {Boolean} [visualTotals]
         *
         * Specifies a boolean value that indicates whether totals should be based on visible data only.
         * This attribute applies to OLAP PivotTables only.
         *
         * A value of 1 or true indicates subtotals are computed on visible data only.
         *
         * A value of 0 or false indicates subtotals are computed on all data.
         */
        visualTotals: null,

        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Location} location
         *
         * Represents location information for the PivotTable.
         */
        location: {},
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotField[]} [pivotFields]
         *
         * Represents the collection of fields that appear on the PivotTable.
         */
        pivotFields: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Field[]} [rowFields]
         *
         * Represents the collection of row fields for the PivotTable.
         */
        rowFields: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Item[]} [rowItems]
         *
         * Represents the collection of items in row axis of the PivotTable.
         */
        rowItems: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Field[]} [colFields]
         *
         * Represents the collection of fields that are on the column axis of the PivotTable.
         */
        colFields: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Item[]} [colItems]
         *
         * Represents the collection of column items of the PivotTable.
         */
        colItems: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PageField[]} [pageFields]
         *
         * Represents the collection of items in the page or report filter region of the PivotTable.
         */
        pageFields: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.DataField[]} [dataFields]
         *
         * Represents the collection of items in the data region of the PivotTable.
         */
        dataFields: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotTableStyleInfo} pivotTableStyleInfo
         *
         * Represent information on style applied to the PivotTable.
         */
        pivotTableStyleInfo: {},

        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Worksheet} worksheet
         *
         * Reference to the parent worksheet.
         */
        worksheet: null,
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotCacheDefinition} cacheDefinition
         *
         * Represents the pivotCacheDefinition part.
         */
        cacheDefinition: {},

        /**
         * @cfg {String} viewLayoutType
         *
         * Possible values:
         * - compact
         * - outline
         * - tabular
         *
         * Use this config to set the pivot table layout
         */
        viewLayoutType: 'outline'


        //formats: null,
        //conditionalFormats: null,
        //chartFormats: null,
        //pivotHierarchies: null,
        //filters: null,
        //rowHierarchiesUsage: null,
        //colHierarchiesUsage: null,
    },

    folder: '/xl/pivotTables/',
    fileName: 'pivotTable',
    nameTemplate: 'PivotTable{index}',

    contentType: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml'
    },

    relationship: {
        schema: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotTable'
    },

    tplNonAttributes: [
        'location', 'worksheet', 'cacheDefinition',
        'pivotFields', 'rowFields', 'rowItems', 'colFields', 'colItems', 'pageFields',
        'dataFields', 'pivotTableStyleInfo', 'viewLayoutType'
        //'formats', 'conditionalFormats', 'chartFormats', 'pivotHierarchies',
        //'filters', 'rowHierarchiesUsage', 'colHierarchiesUsage'
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
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<pivotTableDefinition xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" {attributes}>',
        //'{% debugger; %}',
        '{[values.location.render()]}',
        '<tpl if="pivotFields && pivotFields.length"><pivotFields count="{pivotFields.length}"><tpl for="pivotFields.getRange()">{[values.render()]}</tpl></pivotFields></tpl>',
        '<tpl if="rowFields && rowFields.length"><rowFields count="{rowFields.length}"><tpl for="rowFields.getRange()">{[values.render()]}</tpl></rowFields></tpl>',
        '<tpl if="rowItems && rowItems.length"><rowItems count="{rowItems.length}"><tpl for="rowItems.getRange()">{[values.render()]}</tpl></rowItems></tpl>',
        '<tpl if="colFields && colFields.length"><colFields count="{colFields.length}"><tpl for="colFields.getRange()">{[values.render()]}</tpl></colFields></tpl>',
        '<tpl if="colItems && colItems.length"><colItems count="{colItems.length}"><tpl for="colItems.getRange()">{[values.render()]}</tpl></colItems></tpl>',
        '<tpl if="pageFields && pageFields.length"><pageFields count="{pageFields.length}"><tpl for="pageFields.getRange()">{[values.render()]}</tpl></pageFields></tpl>',
        '<tpl if="dataFields && dataFields.length"><dataFields count="{dataFields.length}"><tpl for="dataFields.getRange()">{[values.render()]}</tpl></dataFields></tpl>',
        '<tpl if="pivotTableStyleInfo">{[values.pivotTableStyleInfo.render()]}</tpl>',
        '</pivotTableDefinition>'
    ],

    destroy: function(){
        var me = this;

        me.setWorksheet(null);
        me.setLocation(null);
        me.setCacheDefinition(null);
        me.setPivotTableStyleInfo(null);
        me.callParent();
    },

    collectFiles: function(files) {
        this.getCacheDefinition().collectFiles(files);
        this.callParent([files]);
    },

    collectContentTypes: function(types){
        // the PivotCacheDefinition needs a record in [Content_Types].xml as well
        this.getCacheDefinition().collectContentTypes(types);
        this.callParent([types]);
    },

    updateIndex: function(index, oldIndex){
        var me = this,
            cache = me.getCacheDefinition();

        if(cache){
            cache.setIndex(index);
        }
        if (me._name == null) {
            me.generateName();
        }
        me.callParent([index, oldIndex]);
    },

    updateWorksheet: function(data, oldData){
        var def = this.getCacheDefinition(),
            wb, pc;

        // the PivotCacheDefinition needs a record in workbook.xml.rels as well
        if(oldData && def && oldData.getWorkbook() && oldData.getWorkbook().getRelationships()){
            oldData.getWorkbook().getRelationships().removeRelationship(def.getRelationship());
        }
        if(data && def){
            wb = data.getWorkbook();
            wb.getRelationships().addRelationship(def.getRelationship());
            pc = def.getPivotCache();
            wb.addPivotCache(pc);
            this.setCacheId(pc.getCacheId());
            pc.setId(def.getRelationship().getId());
        }
    },

    applyPivotTableStyleInfo: function(data) {
        if(!data || data.isInstance){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.PivotTableStyleInfo(data);
    },

    updatePivotTableStyleInfo: function(data, oldData){
        Ext.destroy(oldData);
    },

    applyCacheDefinition: function(data) {
        if(!data || data.isInstance){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.PivotCacheDefinition(data);
    },

    updateCacheDefinition: function(data, oldData){
        var rels = this.getRelationships();

        if(oldData) {
            rels.removeRelationship(oldData.getRelationship());
        }
        Ext.destroy(oldData);

        if(data) {
            rels.addRelationship(data.getRelationship());
        }
    },

    updateViewLayoutType: function(value) {
        var me = this;

        if(value === 'compact'){
            me.setOutline(true);
            me.setOutlineData(true);
            me.setCompact(null);
            me.setCompactData(null);
        }else if(value === 'outline'){
            me.setOutline(true);
            me.setOutlineData(true);
            me.setCompact(false);
            me.setCompactData(false);
        }else{
            me.setOutline(null);
            me.setOutlineData(null);
            me.setCompact(false);
            me.setCompactData(false);
        }
        me.processPivotFields(me.getPivotFields().getRange());
    },

    applyLocation: function(data) {
        if(!data || data.isInstance){
            return data;
        }

        return new Ext.exporter.file.ooxml.excel.Location(data);
    },

    updateLocation: function(data, oldData){
        Ext.destroy(oldData);
    },

    applyPivotFields: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.PivotField');
    },

    updatePivotFields: function(collection, oldCollection){
        var me = this;

        if(oldCollection){
            oldCollection.un({
                add: me.onPivotFieldAdd,
                scope: me
            });
        }
        if(collection){
            collection.on({
                add: me.onPivotFieldAdd,
                scope: me
            });
            this.processPivotFields(collection.getRange());
        }
    },
    onPivotFieldAdd: function(collection, details){
        this.processPivotFields(details.items);
    },

    processPivotFields: function(items){
        var layout = this.getViewLayoutType(),
            length = items.length,
            i, item, compact, outline;

        if(layout === 'compact') {
            compact = null;
            outline = null;
        }else if(layout === 'outline'){
            compact = false;
            outline = null;
        }else{
            compact = false;
            outline = false;
        }

        for(i = 0; i < length; i++) {
            item = items[i];
            item.setCompact(compact);
            item.setOutline(outline)
        }
    },

    applyRowFields: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Field');
    },

    applyRowItems: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Item');
    },

    applyColFields: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Field');
    },

    applyColItems: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Item');
    },

    applyDataFields: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.DataField');
    },

    applyAutoFormatId: function(value){
        return (value >= 4096 && value <= 4117) ? value : null;
    }


});