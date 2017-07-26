Ext.define('Ext.locale.tr.pivot.plugin.RangeEditor', {
    override: 'Ext.pivot.plugin.RangeEditor',

    textWindowTitle:    'Aralık editor',
    textFieldValue:     'Değer',
    textFieldEdit:      'Alan',
    textFieldType:      'Tip',
    textButtonOk:       'Tamam',
    textButtonCancel:   'İptal',

    updaters: [
        ['percentage', 'Yüzde'],
        ['increment', 'Artış'],
        ['overwrite', 'Üstüneyaz'],
        ['uniform', 'Düzgün']
    ]
});