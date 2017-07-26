{
    "classAlias":       "plugin.pivotrangeeditor",
    "className":        "Ext.pivot.plugin.RangeEditor",
    "inherits":         "Ext.plugin.Abstract",
    "autoName":         "MyRangeEditor",
    "validParentTypes": ["Ext.pivot.Grid"],
    "helpText":         "A plugin which allows to edit the pivot grid.",

    "toolbox": {
        "name":     "RangeEditor",
        "category": "Pivot Grid plugins",
        "groups":   ["Grids"]
    },

    "configs": [{
        "name":         "width",
        "type":         "number",
        "initialValue": 280
    },{
        "name":         "height",
        "type":         "number",
        "initialValue": 180
    },{
        "name":         "textWindowTitle",
        "type":         "string",
        "initialValue": "Range editor"
    }]
}