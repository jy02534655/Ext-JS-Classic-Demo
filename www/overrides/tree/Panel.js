//重写类 树形面板
//勾选子节点时自动勾选父节点
//勾选父节点时自动勾选子节点
Ext.define('override.tree.Panel', {
    override: 'Ext.tree.Panel',
    listeners: {
        'checkchange': function (node, checked) {
            if (checked) {
                this.checkParentNode(node.parentNode);
                this.checkChildNode(node);
            } else {
                this.unCheckChildNode(node);
            }
        }
    },
    //勾选上级节点
    //总结点不勾选
    checkParentNode: function (node) {
        if (node.isRoot()) return;
        node.set('checked', true);
        this.checkParentNode(node.parentNode);
    },
    //取消勾选子节点
    unCheckChildNode: function (node) {
        if (!node) return;
        var me = this;
        node.eachChild(function (child) {
            child.set('checked', false);
            me.unCheckChildNode(child);
        });
    },
    //勾选子节点
    checkChildNode: function (node) {
        if (!node) return;
        var me = this;
        node.eachChild(function (child) {
            child.set('checked', true);
            me.checkChildNode(child);
        });
    }
});