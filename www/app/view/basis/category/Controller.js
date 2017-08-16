//控制器
//员工类别
Ext.define('app.view.basis.category.Controller', {
    extend: 'ux.app.ViewController',
    alias: 'controller.basisCategory',
    //详情页面被激活时
    onActivate: function () {
        //获取左侧选中项
        rec = config.categoryRecord;
        if (rec) {
            var view = this.getView();
            //如果是从新增页面返回
            if (config.isCategoryAddBack) {
                //清除选中旧节点避免数据重置出错
                view.oldRec = null;
                config.isCategoryAddBack = false;
            }
            //触发onTreeSelect方法
            this.onTreeSelect(this.tissueTree, view, rec);
        }
    },
    //详情页面左侧树员工类别选择改变时
    onTreeSelect: function (tree, t, rec) {
        //获取父节点
        var parentNode = rec.parentNode,
        oldRec = t.oldRec;
        if (oldRec && oldRec.dirty) {
            //重置未保存数据
            oldRec.reject();
        }
        t.oldRec = rec;
        this.tissueTree = tree;
        //设置上级节点名称
        rec.set('parentName', parentNode.get('text'), {
            //标识为未修改
            dirty: false
        });
        //绑定数据
        t.getViewModel().setData({
            data: rec
        });
    },
    //删除
    onDel: function () {
        //获取选中项
        var rec = config.categoryRecord,
        //获取选中项的父级
        parentNode = rec.parentNode,
        //获取树形菜单视图
        tree = this.tissueTree;
        Ext.MessageBox.confirm('删除确认', '确认删除' + rec.get('text') + '?',
        function (btnText) {
            if (btnText === 'yes') {
                util.ajax(config.basis.category.del, {
                    id: rec.getId()
                }).then(function () {
                    //移除节点
                    parentNode.removeChild(rec);
                    //清除选中旧节点避免数据重置出错
                    tree.oldRec = null;
                    //选中父节点
                    tree.select(parentNode);
                });
            }
        },
        this);
    },
    //保存
    onSave: function () {
        this.modelSave();
    },
    //跳转到新增页面
    onAddClick: function () {
        var rec = Ext.create('app.model.basis.Category'),
        parentNode = config.categoryRecord;
        if (parentNode.dirty) {
            //重置未保存数据
            parentNode.reject();
        }
        //设置上级节点名称
        rec.set({
            parentId: parentNode.getId(),
            parentName: parentNode.get('text'),
            leaf: true
        });
        this.showBackView('back.basisPanel.basisCategoryAdd', {
            viewModel: {
                data: {
                    data: rec
                }
            }
        });
    },
    //新增页面左侧树员工类别选择改变时
    onAddSelection: function (tree, t, rec) {
        //获取同级选择树
        var viewModel = t.getViewModel(),
        model = viewModel.get('data');
        //设置上级节点
        model.set({
            parentId: rec.getId(),
            parentName: rec.get('text')
        });
    },
    //新增
    onAddSave: function () {
        var me = this,
        node;
        //注意新增的数据需要服务端返回主键id字段数据，数据格式如：
        //{
        // message:"新增成功！",
        // success:true,
        // data:{id:999}
        //}
        //否则不能实现树形菜单无刷新功能
        me.modelSave().then(function (data) {
            node = config.categoryRecord;
            node.insertChild(0, data.rec);
            //先折叠再打开避免数据展示出错
            node.collapse();
            node.expand();
            //标识为未修改，避免重置
            node.dirty = false;
            //标识为从新增页面返回
            config.isCategoryAddBack = true;
            me.historyBack();
        });
    }
});