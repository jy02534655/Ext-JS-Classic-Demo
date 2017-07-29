Ext.define('Ext.locale.ro.pivot.plugin.RangeEditor', {
    override: 'Ext.pivot.plugin.RangeEditor',

    textWindowTitle:    'Modifica inregistrarile',
    textFieldValue:     'Valoare',
    textFieldEdit:      'Campul editat',
    textFieldType:      'Tip de editare',
    textButtonOk:       'Ok',
    textButtonCancel:   'Anuleaza',

    updaters: [
        ['percentage', 'Procent'],
        ['increment', 'Incrementeaza'],
        ['overwrite', 'Suprascrie'],
        ['uniform', 'Uniform']
    ]
});