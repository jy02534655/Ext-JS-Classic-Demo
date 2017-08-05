//数据仓库
//课程类别
Ext.define('app.store.basis.Course', {
    extend: 'Ext.data.Store',
    alias: 'store.basisCourse',
    model: 'app.model.basis.Course',
    autoLoad: true
});