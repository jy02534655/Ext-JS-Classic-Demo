Ext.define('Ext.locale.da.pivot.plugin.RangeEditor', {
    override: 'Ext.pivot.plugin.RangeEditor',

    textWindowTitle:    'Range editor',
    textFieldValue:     'Værdi',
    textFieldEdit:      'Felt',
    textFieldType:      'Type',
    textButtonOk:       'Ok',
    textButtonCancel:   'Fortryd',

    updaters: [
        ['percentage', 'Procent'],
        ['increment', 'Forøg'],
        ['overwrite', 'Overskriv'],
        ['uniform', 'Ensartet']
    ]

});
