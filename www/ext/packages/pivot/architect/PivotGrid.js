{
    "classAlias":       "widget.pivotgrid",
    "className":        "Ext.pivot.Grid",
    "inherits":         "Ext.grid.Panel",
    "validChildTypes":  [
        "Ext.pivot.plugin.Configurator",
        "Ext.pivot.plugin.DrillDown",
        "Ext.pivot.plugin.Exporter",
        "Ext.pivot.plugin.RangeEditor"
    ],
    "autoName":         "MyPivotGrid",
    "helpText":         "A pivot grid container",

    "toolbox": {
        "name":     "Pivot Grid",
        "category": "Grid",
        "groups":   ["Grids"]
    },

    "configs": [{
        "name":         "matrixConfig",
        "type":         "object",
        "initialValue": "null",
        "helpText":     "Define here matrix specific configuration."
    },{
        "name":         "enableLoadMask",
        "type":         "boolean",
        "initialValue": true
    },{
        "name":         "enableLocking",
        "type":         "boolean",
        "initialValue": false
    },{
        "name":         "columnLines",
        "type":         "boolean",
        "initialValue": true,
        "helpText":     "Set this on false if you don't want to show the column lines."
    },{
        "name":         "viewLayoutType",
        "type":         "string",
        "editor":       "options",
        "options":      ["outline", "compact"],
        "initialValue": "outline",
        "helpText":     "Type of layout used to display the pivot data."
    },{
        "name":         "rowSubTotalsPosition",
        "type":         "string",
        "editor":       "options",
        "options":      ["first", "none", "last"],
        "initialValue": "first",
        "helpText":     "Position of the sub totals of row groups."
    },{
        "name":         "rowGrandTotalsPosition",
        "type":         "string",
        "editor":       "options",
        "options":      ["first", "none", "last"],
        "initialValue": "last",
        "helpText":     "Position of the grand total of rows."
    },{
        "name":         "colSubTotalsPosition",
        "type":         "string",
        "editor":       "options",
        "options":      ["first", "none", "last"],
        "initialValue": "last",
        "helpText":     "Position of the sub totals of col groups."
    },{
        "name":         "colGrandTotalsPosition",
        "type":         "string",
        "editor":       "options",
        "options":      ["first", "none", "last"],
        "initialValue": "last",
        "helpText":     "Position of the grand total of cols."
    },{
        "name":         "textTotalTpl",
        "type":         "string",
        "initialValue": "Total ({name})",
        "helpText":     "Configure the template for the group total. (i.e. '{name} ({rows.length} items)')"
    },{
        "name":         "textGrandTotalTpl",
        "type":         "string",
        "initialValue": "Grand total",
        "helpText":     "Configure the template for the grand total."
    },{
        "name":         "leftAxis",
        "type":         "array",
        "initialValue": [],
        "helpText":     "Define the left axis used by the grid."
    },{
        "name":         "topAxis",
        "type":         "array",
        "initialValue": [],
        "helpText":     "Define the top axis used by the grid."
    },{
        "name":         "aggregate",
        "type":         "array",
        "initialValue": [],
        "helpText":     "Define the fields you want to aggregate in the pivot grid. You can have one or multiple fields."
    },{
        "name":         "clsGroupTotal",
        "type":         "string",
        "initialValue": "x-grid-group-total",
        "helpText":     "CSS class assigned to the group totals."
    },{
        "name":         "clsGrandTotal",
        "type":         "string",
        "initialValue": "x-grid-grand-total",
        "helpText":     "CSS class assigned to the grand totals."
    },{
        "name":         "startRowGroupsCollapsed",
        "type":         "boolean",
        "initialValue": true,
        "helpText":     "Should the row groups be expanded on first init?"
    },{
        "name":         "startColGroupsCollapsed",
        "type":         "boolean",
        "initialValue": true,
        "helpText":     "Should the col groups be expanded on first init?"
    },{
        "name":         "showZeroAsBlank",
        "type":         "boolean",
        "initialValue": false,
        "helpText":     "Should 0 values be displayed as blank?"
    },{
        "name":         "store",
        "type":         "store",
        "initialValue": null
    },{
        "name":         "plugins",
        "type":         "array",
        "initialValue": [],
        "helpText":     "Collection of plugins."
    }]
}