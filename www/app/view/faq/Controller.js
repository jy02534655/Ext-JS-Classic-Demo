Ext.define('app.view.faq.Controller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.faq',
    animateBody: function (body, from, to) {
        body.animate({
            duration: 500,
            from: {
                height: from
            },
            to: {
                height: to
            }
        });
    },

    doCollapseExpand: function (body, expand) {
        var  from, to;

        // The body has height:0 in CSS, so block that so we can measure it.
        if (expand) {
            body.setStyle('height', 'auto');

            from = 0;
            to = body.getHeight();
            body.setStyle('height', 0);
        } else {
            from = body.getHeight();
            to = 0;
        }

        // When collapsing, removing this class will restore height:0,
        // so we need to pass the measured height as "from" when we animate.
        //
        // When expanding, adding this class will also block the height:0
        // so we'll need to pass "from" to animate.
        body.toggleCls('faq-expanded', expand);
        body.up('div').down('.faq-question').toggleCls('question-expanded', expand);
        this.animateBody(body, from, to);
        if (expand) {
            body.setStyle('height', 0);
        }
    },

    collapseBody: function (node) {
        this.doCollapseExpand(node, false);
    },

    expandBody: function (node) {
        this.doCollapseExpand(node, true);
    },

    onChildTap: function (view, el) {
        var child = el.up('div').down('.faq-body'),
            expanded;
        view.suspendLayouts();
        // Check if the element tapped is styled as a pointer and toggle if so.
        if (child.hasCls('faq-expanded')) {
            this.collapseBody(child);
        } else {
            // If the target is not expanded, we may need to collapse the currently
            // expanded item.
            expanded = el.up('.faq-item').down('.faq-expanded');

            if (expanded) {
                this.collapseBody(expanded);
            }

            this.expandBody(child);
        }
        view.resumeLayouts();
    }
});
