Ext.define('Ext.locale.fr.pivot.plugin.RangeEditor', {
    override: 'Ext.pivot.plugin.RangeEditor',

    textWindowTitle:    'Editeur de plage',
    textFieldValue:     'Valeur',
    textFieldEdit:      'Champ',
    textFieldType:      'Type',
    textButtonOk:       'Ok',
    textButtonCancel:   'Annuler',

    updaters: [
        ['percentage', 'Pourcentage'],
        ['increment', 'Incrément'],
        ['overwrite', 'Ecraser'],
        ['uniform', 'Uniformément']
    ]
});