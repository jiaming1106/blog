//para: 交互模式
var AIS_MODE = "NORMAL";
//para: 主画布
var renderer;
//para: 基函数画布
var basic_canvas;
//para: 相机
var camera;
//para: 控制器
var controls;
//para: 映射器
var projector;
//para: 光线投射器
var raycaster = new THREE.Raycaster();
//para: 主画布载体
var container;
//para: 基函数画布载体
var para_container;

//para: 主菜单GUI
var gui;
//para: 曲线交互GUI
var curve_gui;
//para: 平面交互GUI
var plane_gui;
//para: 曲面交互GUI
var surf_gui;

//para: 曲线曲面标号统计
var curve_count=0;
var surf_count=0;
//para: 鼠标位置
var mouse_xy = new THREE.Vector2();

//para: 主场景
var main_scene;
//para: 曲线集合
var AIS_curves = new THREE.Scene();
//para: 平面集合
var AIS_planes = new THREE.Scene();
//para: 曲面集合
var AIS_surfaces = new THREE.Scene();

//para: 正常状态下鼠标经过高亮物体
var has_changed_obj = new Array();
//用于曲线创建的全局变量
var creating_base_plane;
var creating_points;
var creating_curve;
//用于曲面创建的全局变量
var creating_surf;
var creating_gui;
var creating_para = {};
//用于曲线编辑的全局变量
var changing_curve;
var changing_coord;
var changing_dir; //拖拽的方向
var changing_diff = new THREE.Vector3();
var changing_point;
var changing_point_index;
//用于删除的全局变量
var deleting_curve;
var deleting_surf;

//窗口尺寸改变时改变画布大小以及视体的大小
function onWindowResize(){
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth,container.clientHeight);
}

//鼠标移动交互
function onMouseMove(event){
    event.preventDefault();
	mouse_xy.x = (event.clientX/container.clientWidth)*2-1;
    mouse_xy.y = -(event.clientY/container.clientHeight)*2+1;
    switch (AIS_MODE) {
        case "DRAG":
            var inters = main_check_hit();
            if(inters.length>0){
                var new_position = new THREE.Vector3();
                new_position.copy(inters[0].point).sub(changing_diff);
                var diff = new THREE.Vector3();
                diff.copy(new_position).sub(changing_point.position);
                changing_point.position.copy(new_position);
                for(var coo in changing_coord)
                    changing_coord[coo].position.add(diff);
                var p_n = changing_point_index;
                changing_curve.geo.ctrlPts[p_n*3] += diff.x;
                changing_curve.geo.ctrlPts[p_n*3+1] += diff.y;
                changing_curve.geo.ctrlPts[p_n*3+2] += diff.z;
                changing_curve.compute();
            }
    }

}

//鼠标点击交互
function onMyMouseDown(e){
	switch (AIS_MODE) {
		case "NORMAL":
			if(e.button===0) {
                var inters = main_check_hit();
                if (inters.length>0) {
                    changing_curve = inters[0].object.parent.parent;
                    changing_point = has_changed_obj[0];
                    changing_point_index = changing_curve.ctr_points_ID.indexOf(has_changed_obj[0].id);
                    changing_coord = has_changed_obj[0].getCoordlines(10);
                    main_scene.add(changing_coord[0], changing_coord[1], changing_coord[2]);
                    changing_curve.acting_node=changing_point_index;
                    changing_curve.compute();
                    AIS_MODE = "SELECT";
                }
            }
            break;
		case "SELECT":
		    if(e.button===0){
		        var inters = main_check_hit();
                if (inters.length>0) {
                    switch(inters[0].object.name){
                        case "Coord_X" :
                            changing_dir = changing_coord[0];
                            break;
                        case "Coord_Y" :
                            changing_dir = changing_coord[1];
                            break;
                        case "Coord_Z" :
                            changing_dir = changing_coord[2];
                            break;
                    }
                    changing_diff.copy(inters[0].point).sub(changing_point.position);
                    controls.enabled = false;
                    AIS_MODE = "DRAG";
                }
            }else if(e.button===2){
                main_scene.remove(changing_coord[0], changing_coord[1], changing_coord[2]);
                changing_curve.acting_node=-1;
                changing_curve.compute();
                AIS_MODE = "NORMAL";
			}
			break;
        case "GETTING_PLANE":
            if(e.button===0) {
                var inters = main_check_hit();
                if (inters.length>0) {
                    creating_base_plane = inters[0].object;
                    look_at_a_plane(creating_base_plane.geometry);
                    creating_points = new Array();
                    AIS_MODE = "CREATING_CURVE";
                    document.getElementById("tips").innerHTML = "请在基面上通过左键绘制曲线控制顶点的位置。";
                    var creat_gui = new dat.GUI();
                    var f1 = creat_gui.addFolder("创建平面曲线");
                    f1.add(main_button,'finish_creating_curve').name("完成创建").onChange(
                        function(){
                            generate_curve_gui(creating_curve);
                            document.getElementById("tips").innerHTML = "完成绘制！";
                            AIS_MODE = "NORMAL";
                            for(var i in creating_points){
                                main_scene.remove(creating_points[i]);
                            }
                            creat_gui.destroy();
                        }
                    );
                    f1.add(main_button,'cancel_creating_curve').name("取消").onChange(
                        function(){
                            document.getElementById("tips").innerHTML = "取消绘制！";
                            AIS_MODE = "NORMAL";
                            for(var i in creating_points){
                                main_scene.remove(creating_points[i]);
                            }
                            AIS_curves.remove(creating_curve);
                            creat_gui.destroy();
                        }
                    );
                    f1.open();
                }
            }else if(e.button===2){
                AIS_MODE = "NORMAL";
                document.getElementById("tips").innerHTML = "绘制取消！";
            }
            break;
        case "CREATING_CURVE":
            if(e.button===0) {
                var inters = main_check_hit();
                if (inters.length>0) {
                    //创建并显示选择的点
                    var new_p = creat_a_point(inters[0].point,PROPERTY.Ctr_Point_R);
                    //向曲线中添加该点并更新曲线
                    if(creating_points.length<3){
                        creating_points.push(new_p);
                        if(creating_points.length===3){
                            //以这三个点创建一条初始B曲线
                            creat_init_b_curve();
                        }
                    }else{
                        creating_points.push(new_p);
                        creating_curve.geo.add_point(new_p.position.x,new_p.position.y,new_p.position.z);
                        creating_curve.compute();
                    }
                }
            }
            break;
        case "GETTING_CURVE":
            if(e.button===0) {
                var inters = main_check_hit();
                if (inters.length > 0) {
                    var norm = inters[0].object.parent.geo.isPlanecurve();
                    if (norm) {
                        AIS_MODE = "CHAING_LENGTH";
                        //创建移动轴
                        inters[0].object.geometry.computeBoundingBox();
                        var box = inters[0].object.geometry.boundingBox;
                        var from_p = new THREE.Vector3();
                        from_p.copy(box.min).add(box.max).multiplyScalar(0.5);
                        var to_p = new THREE.Vector3();
                        to_p.copy(norm).multiplyScalar(10).add(from_p);

                        var scal = new THREE.Vector3();
                        scal.copy(box.max).sub(box.min);
                        creating_para.norm = norm.multiplyScalar(scal.length() * 0.6);

                        //创建交互菜单
                        creating_gui = new dat.GUI();
                        var f1 = creating_gui.addFolder("拉伸曲面");
                        creating_para.length = scal.length() * 0.6;
                        var coler = f1.add(creating_para,'length').name("拉伸长度");
                        coler.onChange(function(value){main_button.generate_surf_length(value);});
                        f1.add(main_button, 'creat_surf_finish').name("完成");
                        f1.add(main_button, 'creat_surf_cancel').name("取消");
                        f1.open();
                        // height:120px; overflow:hidden;
                        //creating_gui.domElement.style = 'position:absolute; top:0px; right:250px;';

                        //创建拉伸曲面
                        var ori_curve = inters[0].object.parent.geo;

                        var pnum = [2, ori_curve.ctrlPtsNum[0]];

                        var pts_old = ori_curve.ctrlPts.slice(0);
                        var pts_new = pts_old.slice(0);
                        for (var i = 0; i < pts_new.length / 3; i++) {
                            pts_new[i * 3] += norm.x;
                            pts_new[i * 3 + 1] += norm.y;
                            pts_new[i * 3 + 2] += norm.z;
                        }
                        var pts = pts_old.concat(pts_new);

                        var knot_num = [4, ori_curve.knotNum[0]];

                        var knot_old = ori_curve.knots[0].slice(0);
                        var knot_new = [0, 0, 1, 1];
                        var knot = [knot_new, knot_old];

                        var k = [1, ori_curve.order[0]];

                        var mode = ['QuasiUniform','QuasiUniform'];

                        var geo_surf = new Geom_B_Surf(pnum, pts, knot_num, knot, k,mode);
                        var ais_surf = new AIS_B_Surf(geo_surf);
                        ais_surf.compute();

                        creating_surf = ais_surf;
                        AIS_surfaces.add(ais_surf);
                        creating_para.norm.normalize();
                    } else {
                        AIS_MODE = "NORMAL";
                        alert("抱歉！暂时不支持对非平面曲线的拉伸操作。");
                    }
                }
            }else if(e.button===2){
                AIS_MODE = "NORMAL";
                document.getElementById("tips").innerHTML = "绘制取消！";
            }
            break;
    }
}

//鼠标抬起交互
function onMyMouseUp(){
    switch (AIS_MODE) {
        case "DRAG":
            AIS_MODE = "SELECT";
            controls.enabled = true;
            break;
    }
}

//初始化WebGL
function initThree(){
    container = document.createElement('div');
    document.body.appendChild(container);

	renderer = new THREE.WebGLRenderer({antialias : true});
	renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false );
    renderer.domElement.addEventListener( 'mousedown', onMyMouseDown, false );
    renderer.domElement.addEventListener( 'mouseup', onMyMouseUp, false );
    projector = new THREE.Projector();
}

//控制器循环
function uptdateControls(){
    controls.update();
}

//初始化相机
function initCamera() {
	camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,10000);
	camera.position.x = 0;
	camera.position.y = 200;
	camera.position.z = 0;
	camera.up.x=0;
	camera.up.y=0;
	camera.up.z=1;
	camera.lookAt({
		x:0,y:0,z:0
	});
	controls = new THREE.OrbitControls(camera,container);
	controls.addEventListener('change',uptdateControls);
}

//创建初始场景
function initScene(){
	main_scene = new THREE.Scene();
    main_scene.add(AIS_curves);
    main_scene.add(AIS_planes);
    main_scene.add(AIS_surfaces);
}

//创建初始平面
function init_xyz_planes(){
    var geo_x = new THREE.PlaneGeometry(100,100);
    var mat_x = new THREE.MeshBasicMaterial( {color: PROPERTY.Plane, side: THREE.DoubleSide, opacity: 0.5, transparent: true} );
    geo_x.rotateY(Math.PI/2);
    var p_x = new THREE.Mesh(geo_x,mat_x);
    p_x.name = "Plane";

    var geo_y = new THREE.PlaneGeometry(100,100);
    var mat_y = new THREE.MeshBasicMaterial( {color: PROPERTY.Plane, side: THREE.DoubleSide, opacity: 0.5, transparent: true} );
    geo_y.rotateX(Math.PI/2);
    var p_y = new THREE.Mesh(geo_y,mat_y);
    p_y.name = "Plane";

    var geo_z = new THREE.PlaneGeometry(100,100);
    var mat_z = new THREE.MeshBasicMaterial( {color: PROPERTY.Plane, side: THREE.DoubleSide, opacity: 0.5, transparent: true} );
    var p_z = new THREE.Mesh(geo_z,mat_z);
    p_z.name = "Plane";

    AIS_planes.add(p_x,p_y,p_z);
}

//创建初始平面及初始坐标系
function initObject(){
    init_xyz_planes();
    var main_coord = main_scene.getCoordinate(10);
    main_scene.add(main_coord[0],main_coord[1],main_coord[2]);
}

//渲染循环
function render(){
    main_check_hit();
    renderer.clear();
    renderer.render(main_scene,camera);
    requestAnimationFrame(render);
}

//初始化GUI界面
function initGUI(){
    gui = new dat.GUI();
    var f1 = gui.addFolder("创建");
    f1.add(main_button,'define_b_curve').name("创建平面曲线");
    f1.add(main_button,'define_b_surf').name("创建拉伸曲面");
    f1.open();
    var ff = gui.addFolder("文件");
    ff.add(main_button,'get_file').name("打开");
    ff.add(main_button,'save_file').name("保存");
    var f2 = gui.addFolder("显示过滤");
    f2.add(AIS_planes,'visible').name("平面");
    f2.add(AIS_curves,'visible').name("曲线");
    f2.add(AIS_surfaces,'visible').name("曲面");
    var f3 = gui.addFolder("清除");
    f3.add(main_button,'delete_all_curves').name("清除所有曲线");
    f3.add(main_button,'delete_all_surfs').name("清除所有曲面");
    var f4 = gui.addFolder("关于");
    f4.add(main_button,'contact_us').name("帮助");

    var obj_gui = new dat.GUI();
    // height:120px; overflow:hidden;
    plane_gui = obj_gui.addFolder("平面列表");
    curve_gui = obj_gui.addFolder("曲线列表");
    surf_gui  = obj_gui.addFolder("曲面列表");
    obj_gui.domElement.style = 'float:left';

    //初始化基函数参数域显示GUI容器
    para_container = document.createElement('div');
    document.body.appendChild(para_container);
    para_container.style.cssText = "bottom:0px; z-index: -1;position: absolute; ";
    basic_canvas = ParaGUI.creat(para_container);
    basic_canvas.style.visibility = "hidden";
    basic_canvas.style.zIndex = '-1';
}

//光线投射求交函数
function main_check_hit(){
    var checking_objs = new Array();
    switch (AIS_MODE){
        case "NORMAL":
            if(AIS_curves.visible){
                for(var i in AIS_curves.children){
                    if(AIS_curves.children[i].ctr_visible){
                        for(var j in AIS_curves.children[i].ctr_poly_points.children){
                            checking_objs.push(AIS_curves.children[i].ctr_poly_points.children[j]);
                        }
                    }
                }
            }
            if(AIS_surfaces.visible){
                for(var i in AIS_surfaces.children){
                    if(AIS_surfaces.children[i].ctr_visible) {
                        for(var j in AIS_surfaces.children[i].ctr_poly_points.children){
                            checking_objs.push(AIS_surfaces.children[i].ctr_poly_points.children[j]);
                        }
                    }
                }
            }
            break;
        case "SELECT":
            checking_objs.push(changing_coord[0],changing_coord[1],changing_coord[2]);
            break;
        case "DRAG":
            checking_objs.push(changing_dir);
            break;
        case "GETTING_PLANE":
            checking_objs = AIS_planes.children;
            break;
        case "GETTING_CURVE":
            for(var i in AIS_curves.children){
                checking_objs.push(AIS_curves.children[i].lines);
            }
            break;
        case "CREATING_CURVE":
            checking_objs.push(creating_base_plane);
            break;
    }
    raycaster.setFromCamera(mouse_xy,camera);
    var inters = raycaster.intersectObjects(checking_objs);
    for(var j in has_changed_obj){
        has_changed_obj[j].material.color.set(PROPERTY[has_changed_obj[j].name]);
    }
    has_changed_obj = [];
    if(inters.length>0){
        has_changed_obj.push(inters[0].object);
        inters[0].object.material.color.set(PROPERTY.Selected);
    }
    return inters;
}

//在屏幕中创建一个点
function creat_a_point(pos,radius){
    var mat_p = new THREE.MeshBasicMaterial( {color: PROPERTY.Ctr_Point} );
    var geo_p = new THREE.SphereGeometry(radius, 15, 15);
    var sphere = new THREE.Mesh(geo_p,mat_p);
    sphere.position.copy(pos);
    main_scene.add(sphere);
    return sphere;
}

//在交互创建B样条曲线时创建初始的B样条曲线
function creat_init_b_curve(){
    var pnum = 3;
    var pts = new Array();
    for(var p in creating_points){
        pts.push(creating_points[p].position.x);
        pts.push(creating_points[p].position.y);
        pts.push(creating_points[p].position.z);
    }
    var geo_bct = new Geom_B_Curve(pnum,pts,2,"QuasiUniform");
    creating_curve = new AIS_B_Curve(geo_bct);
    creating_curve.compute();
    AIS_curves.add(creating_curve);
}

//使画面朝向一个平面
function look_at_a_plane(polyplane){
    //首先计算中点
    var mid = new THREE.Vector3();
    mid.copy(polyplane.vertices[0]);
    mid.add(polyplane.vertices[3]);
    mid.multiplyScalar(0.5);
    //计算平面的法向量
    var nor = new THREE.Vector3();
    var b1 = new THREE.Vector3();
    b1.copy(polyplane.vertices[1]);
    b1.sub(polyplane.vertices[0]);
    var b2 = new THREE.Vector3();
    b2.copy(polyplane.vertices[3]);
    b2.sub(polyplane.vertices[0]);
    nor.crossVectors(b2,b1);
    nor.normalize();
    nor.multiplyScalar(b1.length()*2);
    //调整相机位置
    camera.position.copy(mid).add(nor);
    camera.lookAt(mid);
}

//对AIS_B_CURVE bsp建立交互菜单
function generate_curve_gui(bsp){
    curve_count++;
    var bsp_gui = curve_gui.addFolder("B_Curve"+curve_count);
    bsp.order_GUI = bsp_gui.add(bsp.geo.order,0,1,bsp.geo.ctrlPtsNum[0]-1).name("曲线次数").step(1).listen().onChange(function(value){
        if(bsp.geo.mode[0]==='PiecewiseBezier'&&((bsp.geo.ctrlPtsNum[0]-1)%value)){
            alert("该PiecewiseBezier类型曲线无法改变次数为"+value+"。尝试更改曲线类型为QuasiUniform");
            bsp.geo.mode[0] = 'QuasiUniform';
        }
        bsp.geo.order[0]=value;
        bsp.geo.initFromPoint();
        bsp.compute();
        if(basic_canvas.style.visibility==="visible"){
            ParaGUI.drawCurveBasic(bsp,basic_canvas);
        }
    });
    bsp_gui.add(bsp.geo.mode,0,['Uniform','QuasiUniform','PiecewiseBezier','Riesenfeld','HartleyJudd']).name('曲线类型').listen().onChange(
        function(value){
            if(value==='PiecewiseBezier'&&((bsp.geo.ctrlPtsNum[0]-1)%bsp.geo.order[0])){
                var k=2;
                while((bsp.geo.ctrlPtsNum[0]-1)%k){
                    k++;
                }
                alert("该曲线无法转化为PiecewiseBezier类型。请尝试更改曲线次数为"+k+"。");
                bsp.geo.order[0] = k;
            }
            bsp.geo.initFromPoint();
            bsp.compute();
            if(basic_canvas.style.visibility==="visible"){
                ParaGUI.drawCurveBasic(bsp,basic_canvas);
            }
        }
    );
    bsp_gui.add(main_button,'insert_knot_curve').name("插入节点").onChange(function(){deleting_curve = bsp;});
    bsp_gui.add(main_button,'show_basic').name("显示基函数").onChange(
        function(){
            basic_canvas.style.visibility = "visible";
            para_container.style.zIndex = '100';
            basic_canvas.style.zIndex = '999';
            ParaGUI.drawCurveBasic(bsp,basic_canvas);
        });
    var hidden = bsp_gui.add(main_button,'hidden_a_curve').name("隐藏控制网格").onChange(function(){
        deleting_curve = bsp;
        if(bsp.ctr_poly_points.visible){
            hidden.name("显示控制网格");
        }else{
            hidden.name("隐藏控制网格");
        }
    });
    bsp_gui.add(main_button,'delete_a_curve').name("删除").onChange(function(){
        deleting_curve = bsp;
        curve_gui.removeFolder(bsp_gui);
    });
    curve_gui.open();
    bsp_gui.open();
}

//对AIS_B_SURF bsp建立交互菜单
function generate_surf_gui(bsp){
    surf_count++;
    var bsp_gui = surf_gui.addFolder("B_Surf"+surf_count);
    bsp.order_GUI_u = bsp_gui.add(bsp.geo.order,0,1,bsp.geo.ctrlPtsNum[0]-1).name("u向次数").step(1).listen().onChange(function(value){
        if(bsp.geo.mode[0]==='PiecewiseBezier'&&((bsp.geo.ctrlPtsNum[0]-1)%value)){
            alert("该PiecewiseBezier类型曲线无法改变次数为"+value+"。尝试更改曲线类型为QuasiUniform");
            bsp.geo.mode[0] = 'QuasiUniform';
        }
        bsp.geo.order[0]=value;
        bsp.geo.initFromPoint();
        bsp.compute();
        if(basic_canvas.style.visibility === "visible"){
            ParaGUI.drawSurfBasicU(bsp,basic_canvas);
        }
    });
    bsp.order_GUI_v = bsp_gui.add(bsp.geo.order,1,1,bsp.geo.ctrlPtsNum[1]-1).name("v向次数").step(1).listen().onChange(function(value){
        if(bsp.geo.mode[1]==='PiecewiseBezier'&&((bsp.geo.ctrlPtsNum[1]-1)%value)){
            alert("该PiecewiseBezier类型曲线无法改变次数为"+value+"。尝试更改曲线类型为QuasiUniform");
            bsp.geo.mode[1] = 'QuasiUniform';
        }
        bsp.geo.order[1]=value;
        bsp.geo.initFromPoint();
        bsp.compute();
        if(basic_canvas.style.visibility === "visible"){
            ParaGUI.drawSurfBasicV(bsp,basic_canvas);
        }
    });
    bsp_gui.add(bsp.geo.mode,0,['Uniform','QuasiUniform','PiecewiseBezier','Riesenfeld','HartleyJudd']).name('u向类型').listen().onChange(
        function(value){
            if(value==='PiecewiseBezier'&&((bsp.geo.ctrlPtsNum[0]-1)%bsp.geo.order[0])){
                var k=2;
                while((bsp.geo.ctrlPtsNum[0]-1)%k){
                    k++;
                }
                alert("该曲线无法转化为PiecewiseBezier类型。请尝试更改曲线次数为"+k+"。");
                bsp.geo.order[0] = k;
            }
            bsp.geo.initFromPoint();
            bsp.compute();
            if(basic_canvas.style.visibility === "visible"){
                ParaGUI.drawSurfBasicU(bsp,basic_canvas);
            }
        });
    bsp_gui.add(bsp.geo.mode,1,['Uniform','QuasiUniform','PiecewiseBezier','Riesenfeld','HartleyJudd']).name('v向类型').listen().onChange(
        function(value){
            if(value==='PiecewiseBezier'&&((bsp.geo.ctrlPtsNum[1]-1)%bsp.geo.order[1])){
                var k=2;
                while((bsp.geo.ctrlPtsNum[1]-1)%k){
                    k++;
                }
                alert("该曲线无法转化为PiecewiseBezier类型。请尝试更改曲线次数为"+k+"。");
                bsp.geo.order[1] = k;
            }
            bsp.geo.initFromPoint();
            bsp.compute();
            if(basic_canvas.style.visibility === "visible"){
                ParaGUI.drawSurfBasicV(bsp,basic_canvas);
            }
        });
    bsp_gui.add(main_button,'insert_knot_surf_u').name("插入u向节点").onChange(function(){deleting_surf = bsp;});
    bsp_gui.add(main_button,'insert_knot_surf_v').name("插入v向节点").onChange(function(){deleting_surf = bsp;});
    bsp_gui.add(main_button,'show_basic').name("显示u向基函数").onChange(
        function () {
            basic_canvas.style.visibility = "visible";
            para_container.style.zIndex = '100';
            basic_canvas.style.zIndex = '999';
            ParaGUI.drawSurfBasicU(bsp,basic_canvas);
        }
    );
    bsp_gui.add(main_button,'show_basic').name("显示v向基函数").onChange(
        function () {
            basic_canvas.style.visibility = "visible";
            para_container.style.zIndex = '100';
            basic_canvas.style.zIndex = '999';
            ParaGUI.drawSurfBasicV(bsp,basic_canvas);
        }
    );
    var hidden = bsp_gui.add(main_button,'hidden_a_surf').name("隐藏控制网格").onChange(function(){
        deleting_surf = bsp;
        if(bsp.ctr_poly_points.visible){
            hidden.name("显示控制网格");
        }else{
            hidden.name("隐藏控制网格");
        }
    });
    bsp_gui.add(main_button,'delete_a_surf').name("删除").onChange(function(){
        deleting_surf = bsp;
        surf_gui.removeFolder(bsp_gui);
    });
    surf_gui.open();
    bsp_gui.open();
}

//启动函数 相当于main函数
function threeStart(){
    initThree();
    initCamera();
    initScene();
    initObject();
    render();
    initGUI();
    window.addEventListener('resize', onWindowResize, false );
}
