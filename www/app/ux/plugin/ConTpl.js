/*
*tpl模版加入按钮
*<div class="x-button-normal x-button x-iconalign-center x-layout-box-item x-stretched btn" style="visibility:{visibility}" fire="TasteUp" ><span class="x-button-icon x-shown lower"></span></div>
*fire="tasteUp" 表示添加tasteUp事件和激活dotasteUp方法
*有两个参数cmp:视图本身以及doit
*只要是以上格式的模板都可以被监控到
*其中btn、shareIco为自定义样式，其他都是st自带样式
*/
Ext.define('ux.plugin.ConTpl', {
    alias: 'plugin.conTpl',
    xtype: 'conTpl',
    config: {
        cmp: null,
        //按下时添加css
        pressedCls: 'pressing',
        //监控对象选择器
        delegate: 'div.fire'
    },
    constructor: function (config) {
        this.initConfig(config);
        this.callParent([config]);
    },
    //初始化
    init: function (cmp) {
        this.setCmp(cmp);
    },
    //更新配置
    updateCmp: function (newCmp, oldCmp) {
        if (newCmp) {
            newCmp.on({
                //只有创建完成后才能监听事件
                render: 'onRender',
                scope: this
            });
        }
    },
    //创建完成
    onRender: function (t, eOpts) {
        t.el.on({
            click: 'onTap',
            delegate: this.getDelegate(),
            scope: this
        });
    },
    //执行动作
    onTap: function (e) {
        var me = this,
            cmp = me.getCmp(),
            el = e.getTarget(me.getDelegate(), null, true),
            fire = el.getAttribute('fire'),
            oldEl = cmp.el.down('.selectend');
        el.addCls('selectend');
        if (oldEl) {
            oldEl.removeCls('selectend');
        }
        cmp.fireEvent(fire, cmp, el);
    }
});