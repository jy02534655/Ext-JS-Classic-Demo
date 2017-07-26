{
    "classAlias":       "plugin.pivotconfigurator",
    "className":        "Ext.pivot.plugin.Configurator",
    "inherits":         "Ext.plugin.Abstract",
    "autoName":         "MyConfigurator",
    "validParentTypes": ["Ext.pivot.Grid"],
    "helpText":         "A plugin which allows to easily configure the pivot grid",

    "toolbox": {
        "name":     "Configurator",
        "category": "Pivot Grid plugins",
        "groups":   ["Grids"]
    },

    "configs": [{
        "name":         "fields",
        "type":         "array",
        "initialValue": []
    }]
}