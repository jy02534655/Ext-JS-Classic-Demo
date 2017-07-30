# sass/view 目录
#### view文件夹
对应app/view目录

假如app/view里面有一个main文件夹，这个文件夹里面有一个Box.js视图，那么在view里面也创建一个main文件夹，里面创建一个名为Box.scss的文件，在编译之后里面所写的scss会被编译到应用之中，如果view之中对应的视图被删除了，这个文件中的scss就不会被编译到应用中，这样可以提高应用的可维护性。