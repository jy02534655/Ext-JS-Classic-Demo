//重写类 模型
//每次新增提交数据时使主键为空
Ext.define('app.override.data.Model', {
    override: 'Ext.data.Model',
    save: function () {
        var me = this;
        if (me.phantom) {
            //因为我们是模拟接口，这里就不是设置为空了
            //你可以根据项目需要自行觉得是否开启
            //me.setId('');
        }
        return me.callParent(arguments);
    }
});