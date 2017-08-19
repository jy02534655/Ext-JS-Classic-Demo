//重写类
//饼状图功能增强
Ext.define("override.chart.series.Pie", {
    override: "Ext.chart.series.Pie",
    provideLegendInfo: function (target) {
        var me = this,
        store = me.getStore();

        if (store) {
            var items = store.getData().items,
            labelField = me.getLabel().getTemplate().getField(),
            angleField = me.getAngleField(),
            xField = me.getXField(),
            hidden = me.getHidden(),
            i,
            style,
            fill;
            for (i = 0; i < items.length; i++) {
                style = me.getStyleByIndex(i);
                fill = style.fillStyle;
                if (Ext.isObject(fill)) {
                    fill = fill.stops && fill.stops[0].color;
                }
                target.push({
                    name: labelField ? String(items[i].get(labelField)) : xField + ' ' + i,
                    //扩展支持
                    rateValue: items[i].get(angleField),
                    mark: fill || style.strokeStyle || 'black',
                    disabled: hidden[i],
                    series: me.getId(),
                    index: i
                });
            }
        }
    }
});