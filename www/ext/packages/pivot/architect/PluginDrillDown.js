{
    "classAlias":       "plugin.pivotdrilldown",
    "className":        "Ext.pivot.plugin.DrillDown",
    "inherits":         "Ext.plugin.Abstract",
    "autoName":         "MyDrillDown",
    "validParentTypes": ["Ext.pivot.Grid"],
    "helpText":         "A plugin which allows to drill down the data.",

    "toolbox": {
        "name":     "DrillDown",
        "category": "Pivot Grid plugins",
        "groups":   ["Grids"]
    },

    "configs": [{
        "name":         "columns",
        "type":         "array",
        "initialValue": []
    },{
        "name":         "width",
        "type":         "number",
        "initialValue": 400
    },{
        "name":         "height",
        "type":         "number",
        "initialValue": 300
    },{
        "name":         "textWindow",
        "type":         "string",
        "initialValue": "Drill down window"
    }]
}