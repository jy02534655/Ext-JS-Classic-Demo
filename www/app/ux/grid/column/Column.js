/**
 * 带a标签的列
 * 点击会触发一个linkclick事件
 */
Ext.define('ux.grid.column.Column', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.uxColumn',
    listeners: {
        //监听点击事件
        click: function (grid, td, rowIndex, columnIndex, e, record) {
            if (e.target.tagName == 'A') {
                this.fireEvent('linkclick', grid, record);
                return false;
            }
            return false;
        }
    },
    //重写列数据
    renderer: function (value) {
        return Ext.util.Format.format('<a href="{0}" onclick="return false;">{0}</a>', Ext.String.htmlEncode(value));
    }
});