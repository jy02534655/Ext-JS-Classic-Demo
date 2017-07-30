//模拟数据源
//新增接口
Ext.define('app.data.Add', {
    extend: 'app.data.Simulated',
    data: {
        success: true,
        message: '新增成功！'
    }
});