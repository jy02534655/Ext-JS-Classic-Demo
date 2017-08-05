//数据源
//课程管理
Ext.define('app.view.basis.course.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.basisCourse',
    stores: {
        //课程管理
        basisCourseStore: {
            type: 'basisCourse'
        }
    }
});
