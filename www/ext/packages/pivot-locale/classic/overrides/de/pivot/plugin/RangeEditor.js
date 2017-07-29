Ext.define('Ext.locale.de.pivot.plugin.RangeEditor', {
    override: 'Ext.pivot.plugin.RangeEditor',

    textWindowTitle:    'Bereichseditor',
    textFieldValue:     'Wert',
    textFieldEdit:      'Feld',
    textFieldType:      'Typ',
    textButtonOk:       'Ok',
    textButtonCancel:   'Abbrechen',

    updaters: [
        ['percentage', 'Prozent'],
        ['increment', 'Zunahme'],
        ['overwrite', 'Überschreiben'],
        ['uniform', 'Einheitlich']
    ]

});