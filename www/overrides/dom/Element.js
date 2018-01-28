//重写类 Element
Ext.define('override.dom.Element', {
    override: 'Ext.dom.Element',
    getHeight: function () {
        //自定义的控件如百度图表dom是不存在的
        //在切换视图计算高度时会引起布局错误
        //这里重写解决
        if (!this.dom) {
            return 0;
        }
        return this.callParent(arguments);
    }
});