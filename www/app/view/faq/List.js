Ext.define('app.view.faq.List', {
    extend: 'Ext.view.View',
    requires: ['ux.plugin.ConTpl'],
    xtype: 'faq',
    controller: 'faq',
    store: {
        type: 'faq'
    },
    scrollable: 'y',
    itemSelector: 'div.thumb-wrap',
    plugins: 'conTpl',
    tpl:new Ext.XTemplate(
    '<tpl for=".">',
        '<div style="margin-bottom: 10px;" class="thumb-wrap faq-item">',
          '<div class="faq-title">{name}</div>',
        '<tpl for="questions"><div>',
            '<div class="fire" fire="childClick"><div class="faq-question x-fa"></div>{question}</div>',
            '<div class="faq-body">{answer}</div>',
         '</div></tpl>',
        '</div>',
    '</tpl>'
),
    listeners: {
        childClick: 'onChildTap'
    }
});
