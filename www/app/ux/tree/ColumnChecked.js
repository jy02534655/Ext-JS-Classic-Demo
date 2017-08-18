//只有勾选框的treeColumn
//tree自带的勾选框是带有分级缩进的
//这样看起来不太美观，所以这里扩展一个只有勾选框没有缩进的
Ext.define('ux.tree.ColumnChecked', {
    extend: 'Ext.tree.Column',
    alias: 'widget.uxColumnChecked',
    align: 'center',
    cellTpl: [
       '<tpl if="checked !== null">',
           '<div role="button" {ariaCellCheckboxAttr}',
               ' class="{childCls} {checkboxCls}<tpl if="checked"> {checkboxCls}-checked</tpl>"></div>',
       '</tpl>'
    ]
});