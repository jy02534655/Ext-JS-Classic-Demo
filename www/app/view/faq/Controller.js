//视图控制器
//帮助
Ext.define('app.view.faq.Controller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.faq',
    //执行动画
    animateBody: function (body, from, to) {
        body.animate({
            //执行动画所需时间
            duration: 500,
            from: {
                height: from
            },
            to: {
                height: to
            }
        });
    },
    //折叠活收缩节点
    doCollapseExpand: function (node, expand) {
        //向下查找内容节点
        var body = node.down('.faq-body'),
            from, to;

        if (expand) {
            // 如果展开则将内容高度设置为自动
            body.setStyle('height', 'auto');

            from = 0;
            //获取到展开后高度
            to = body.getHeight();
            //将高度重写设置为0，避免展开时有卡顿效果
            body.setStyle('height', 0);
        } else {
            //如果折叠则获取折叠前的高度
            from = body.getHeight();
            to = 0;
        }

        //折叠则移除css
        //新增则添加css
        node.toggleCls('faq-expanded', expand);
        //执行折叠/收缩动画效果
        this.animateBody(body, from, to);
    },
    //折叠节点
    collapseBody: function (node) {
        this.doCollapseExpand(node, false);
    },
    //展开节点
    expandBody: function (node) {
        this.doCollapseExpand(node, true);
    },
    //点击节点标题是
    onChildClick: function (view, el) {
        //找到节点
        var child = el.up('div'),
            expanded;
        //检查当前节点折叠还是展开状态
        if (child.hasCls('faq-expanded')) {
            //如果是展开状态则折叠它
            this.collapseBody(child);
        } else {
            //查找同类别问题下是否有已经展开的节点
            expanded = el.up('.faq-item').down('.faq-expanded');

            if (expanded) {
                //如果有则折叠这个节点，也就是说同类别下同事只能展开一个节点
                this.collapseBody(expanded);
            }
            //展开当前节点
            this.expandBody(child);
        }
    }
});
