//模型
//会员卡类型
Ext.define('app.model.basis.Card', {
    extend: 'Ext.data.Model',
    //字段配置
    fields: [{
        //字段类型
        type: 'string',
        //字段名称
        name: 'coding'
    },
    {
        type: 'string',
        name: 'type'
    }],
    //代理，用于增加和修改
    proxy: {
        type: 'api',
        //纳新的需求重写参数
        //对应p0的值
        //ajaxName:'name',
        api: {
            //列表
            read: config.basis.card.list,
            //新增
            create: config.basis.card.add,
            //更新
            update: config.basis.card.update
        }
    }
});