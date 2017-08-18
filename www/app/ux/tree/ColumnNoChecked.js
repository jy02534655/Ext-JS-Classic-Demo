//没有有勾选框的treeColumn
//tree自带的勾选框是带有分级缩进的
//这样看起来不太美观，所以这里扩展一个没有勾选框的
Ext.define('ux.tree.ColumnNoChecked', {
    extend: 'Ext.tree.Column',
    alias: 'widget.uxColumnNoChecked',
    cellTpl: [
        '<tpl for="lines">',
            '<div class="{parent.childCls} {parent.elbowCls}-img ',
            '{parent.elbowCls}-<tpl if=".">line<tpl else>empty</tpl>" role="presentation"></div>',
        '</tpl>',
        '<div class="{childCls} {elbowCls}-img {elbowCls}',
            '<tpl if="isLast">-end</tpl><tpl if="expandable">-plus {expanderCls}</tpl>" role="presentation"></div>',
        '<tpl if="glyph">',
            '<span class="{baseIconCls}" ',
            '<tpl if="glyphFontFamily">',
                'style="font-family:{glyphFontFamily}"',
            '</tpl>',
            '>{glyph}</span>',
        '<tpl else>',
            '<tpl if="icon">',
                '<img src="{blankUrl}"',
            '<tpl else>',
                '<div',
            '</tpl>',
            ' role="presentation" class="{childCls} {baseIconCls} {customIconCls} ',
            '{baseIconCls}-<tpl if="leaf">leaf<tpl else><tpl if="expanded">parent-expanded<tpl else>parent</tpl></tpl> {iconCls}" ',
            '<tpl if="icon">style="background-image:url({icon})"/><tpl else>></div></tpl>',
        '</tpl>',
        '<tpl if="href">',
            '<a href="{href}" role="link" target="{hrefTarget}" class="{textCls} {childCls}">{value}</a>',
        '<tpl else>',
            '<span class="{textCls} {childCls}">{value}</span>',
        '</tpl>'
    ]
});