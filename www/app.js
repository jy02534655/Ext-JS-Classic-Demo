/*
 * This file launches the application by asking Ext JS to create
 * and launch() the Application class.
 */
Ext.application({
    extend: 'app.Application',

    name: 'app',

    requires: [
        // This will automatically load all classes in the app namespace
        // so that application classes do not need to require each other.
        'app.*'
    ],

    // The name of the initial view to create.
    mainView: 'app.view.main.Main'
});
