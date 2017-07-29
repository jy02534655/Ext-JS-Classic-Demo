Ext.define('Ext.locale.ru.pivot.plugin.RangeEditor', {
    override: 'Ext.pivot.plugin.RangeEditor',

    textWindowTitle:    'Редактирование диапазона',
    textFieldValue:     'Значение',
    textFieldEdit:      'Поле',
    textFieldType:      'Тип',
    textButtonOk:       'ОК',
    textButtonCancel:   'Отмена',

    updaters: [
        ['percentage', 'Процент'],
        ['increment', 'Инкремент'],
        ['overwrite', 'Перезаписать'],
        ['uniform', 'Равномерно']
    ]
});