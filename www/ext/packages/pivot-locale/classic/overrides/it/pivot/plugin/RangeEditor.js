Ext.define('Ext.locale.it.pivot.plugin.RangeEditor', {
    override: 'Ext.pivot.plugin.RangeEditor',

    textWindowTitle:    'Modifica intervallo',
    textFieldValue:     'Valore',
    textFieldEdit:      'Campo',
    textFieldType:      'Tipo',
    textButtonOk:       'Ok',
    textButtonCancel:   'Cancella',

    updaters: [
        ['percentage', 'Percentuale'],
        ['increment', 'Incremento'],
        ['overwrite', 'Sovrascrivere'],
        ['uniform', 'Uniformare']
    ]
});