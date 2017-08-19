//视图
//员工统计
Ext.define('app.view.report.Employee', {
    extend: 'Ext.chart.PolarChart',
    requires: [
       'Ext.chart.interactions.Rotate',
       'Ext.chart.series.Pie',
       'Ext.chart.series.sprite.PieSlice',
       'Ext.chart.interactions.ItemHighlight'
    ],
    xtype: 'reportEmployee',
    innerPadding: 30,
    height: 370,
    border: true,
    legend: {
        type: 'dom',
        cls: 'bb bl br',
        //只有type: 'dom',是才能设置padding
        padding: '0 0 5 0',
        tpl: [
            '<div class="', Ext.baseCSSPrefix, 'legend-inner">', // for IE8 vertical centering 
                '<div class="', Ext.baseCSSPrefix, 'legend-container">',
                    '<tpl for=".">',
                        '<div class="', Ext.baseCSSPrefix, 'legend-item">',
                            '<div><span ',
                                'class="', Ext.baseCSSPrefix, 'legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + \'legend-item-inactive\' : \'\' ]}" ',
                                'style="background:{mark};">',
                            //扩展，在legend中显示数据，避免文字重叠问题
                            '</span>{name}</div><div style="margin-top:5px;">{rateValue}人</div>',
                        '</div>',
                    '</tpl>',
                '</div>',
            '</div>'
        ]
    },
    interactions: ['rotate'],
    series: [{
        type: 'pie',
        angleField: 'count',
        label: {
            field: 'name',
            calloutLine: {
                length: 20,
                width: 2
            }
        },
        highlight: true,
        tooltip: {
            trackMouse: true,
            renderer: function (tooltip, record, item) {
                tooltip.setHtml(record.get('name') + '</br>' + +record.get('count') + '人');
            }
        }
    }]
});
