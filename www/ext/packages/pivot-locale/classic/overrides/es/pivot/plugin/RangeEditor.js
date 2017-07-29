Ext.define('Ext.locale.es.pivot.plugin.RangeEditor', {
    override: 'Ext.pivot.plugin.RangeEditor',

    textWindowTitle:    'Range editor',
    textFieldValue:     'Valor',
    textFieldEdit:      'Campo',
    textFieldType:      'Tipo',
    textButtonOk:       'Aceptar',
    textButtonCancel:   'Cancelar',

    updaters: [
        ['percentage', 'Porcentaje'],
        ['increment', 'Incremento'],
        ['overwrite', 'Sobreescribe'],
        ['uniform', 'Uniformemente']
    ]

});