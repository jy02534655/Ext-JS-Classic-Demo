//视图
//帮助页
Ext.define('app.view.faq.List', {
    extend: 'Ext.container.Container',
    requires: ['ux.plugin.ConTpl', 'Ext.view.View'],
    xtype: 'faq',
    controller: 'faq',
    scrollable: 'y',
    //这种布局可以让标题也在滚动条内
    items: [{
        //标题
        title: '帮助'
    }, {
        //列表
        xtype: 'dataview',
        cls: 'faq',
        padding:'0 10 10 0',
        itemSelector: 'div.faq-item',
        //自定义扩展插件，用于监听点击事件
        plugins: 'conTpl',
        //数据源
        store: {
            type: 'faq'
        },
        //模版
        tpl: new Ext.XTemplate(
        '<tpl for=".">',
            '<div class="faq-item">',
              '<div class="faq-title">{name}</div>',
              '<tpl for="questions"><div>',
                '<div class="fire" fire="childClick"><div class="faq-question x-fa"></div>{question}</div>',
                '<div class="faq-body">{answer}</div>',
              '</div></tpl>',
            '</div>',
        '</tpl>'
        ),
        listeners: {
            childClick: 'onChildClick'
        }
    }]
});
