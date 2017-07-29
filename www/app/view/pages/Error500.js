//视图
//500页
Ext.define('app.view.pages.Error500', {
    extend: 'app.view.pages.Base',
    xtype: 'page500',
    items: [{
        xtype: 'container',
        width: 600,
        cls: 'base-page-inner-container',
        layout: {
            type: 'vbox',
            align: 'center',
            pack: 'center'
        },
        items: [{
            xtype: 'label',
            cls: 'base-page-top-text',
            text: '500'
        },
        {
            xtype: 'label',
            cls: 'base-page-desc',
            html: '<div>出错啦！</div>' + '<div>返回 <a href="#view.home"> 首页 </a></div>'
        },
        {
            xtype: 'tbspacer',
            flex: 1
        }]
    }]
});