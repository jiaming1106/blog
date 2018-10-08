////////////////////////////////////////////////
//------------------主控制功能类----------------//
/**
 * @brief 主控制功能类，包含所有按钮的控制功能实现函数
 * @function define_b_curve         开始定义B样条曲线
 * @funciton define_b_surf          开始定义B样条曲面
 * @function hidden_a_curve         隐藏一条曲线的控制网格
 * @funciton hidden_a_surf          隐藏一个曲面的控制网格
 * @funciton delete_a_curve         删除一条曲线
 * @function delete_a_surf          删除一张曲面
 * @funciton delete_all_curves      删除所有的曲线
 * @funciton delete_all_surfs       删除所有的曲面
 * @funciton insert_knot_curve      开始为曲线插入节点
 * @funciton creat_surf_finish      创建曲面完成
 * @funciton creat_surf_cancel      创建曲面取消
 * @funciton generate_surf_length   开始获取拉伸曲面的长度
 * @funciton insert_knot_surf_u     开始插入曲面u向节点
 * @funciton insert_knot_surf_v     开始插入曲面v向节点
 * @funciton generate_save_file     生成保存文件
 * @funciton get_file               开始获取文件
 * @funciton get_file_path          通过路径读取文件
 * @funciton save_file              开始保存文件
 */
var main_button = {};
main_button.contact_us = function(){
    window.open("../blog2.html");
};

main_button.define_b_curve = function(){
    AIS_MODE = "GETTING_PLANE";
    document.getElementById("tips").innerHTML = "请选择一个平面作为绘制基面。";
};

main_button.define_b_surf = function(){
    AIS_MODE = "GETTING_CURVE";
    document.getElementById("tips").innerHTML = "请选择一条平面曲线进行拉伸。";
};

main_button.hidden_a_curve = function(){
    deleting_curve.ctr_visible = !deleting_curve.ctr_visible;
    deleting_curve.ctr_poly_bounds.visible = !deleting_curve.ctr_poly_bounds.visible;
    deleting_curve.ctr_poly_points.visible = !deleting_curve.ctr_poly_points.visible;
};

main_button.hidden_a_surf = function(){
    deleting_surf.ctr_visible = !deleting_surf.ctr_visible;
    deleting_surf.ctr_poly_bounds.visible = !deleting_surf.ctr_poly_bounds.visible;
    deleting_surf.ctr_poly_points.visible = !deleting_surf.ctr_poly_points.visible;
};

main_button.delete_a_curve = function(){
    AIS_curves.remove(deleting_curve);
};

main_button.delete_a_surf = function(){
    AIS_surfaces.remove(deleting_surf);
};

main_button.delete_all_curves = function(){
    curve_gui.parent.removeFolder(curve_gui);
    curve_gui = plane_gui.parent.addFolder("曲线列表");
    while(AIS_curves.children.length>0){
        AIS_curves.remove(AIS_curves.children[0]);
    }
    document.getElementById("tips").innerHTML = "清空曲线成功！";
};

main_button.delete_all_surfs = function(){
    surf_gui.parent.removeFolder(surf_gui);
    surf_gui = plane_gui.parent.addFolder("曲面列表");
    while(AIS_surfaces.children.length>0){
        AIS_surfaces.remove(AIS_surfaces.children[0]);
    }
    document.getElementById("tips").innerHTML = "清空曲面成功！";
};

main_button.insert_knot_curve = function(){
    var insert_gui = new dat.GUI();
    var f1 = insert_gui.addFolder("插入节点");
    creating_para.insert_knot = 0.5;
    var knot = f1.add(creating_para,'insert_knot',0,1).name("节点位置");
    f1.add(main_button, 'insert_knot_finish').name("插入").onChange(
        function(){
            if(deleting_curve.geo.insert(Math.round(knot.getValue()*100)/100)){
                deleting_curve.compute();
                deleting_curve.order_GUI.max(deleting_curve.geo.ctrlPtsNum[0]-1);
                if(basic_canvas.style.visibility==="visible"){
                    ParaGUI.drawCurveBasic(deleting_curve,basic_canvas);
                }
            }
            else alert("节点插入失败！已达到最大重复度。");
        }
    );
    f1.add(main_button, 'insert_knot_cancel').name("退出").onChange(
        function(){
            insert_gui.destroy();
        }
    );
    f1.open();
};

main_button.creat_surf_finish = function(){
    creating_gui.destroy();
    generate_surf_gui(creating_surf);
    document.getElementById("tips").innerHTML = "曲面创建成功！";
    AIS_MODE = "NORMAL";
};

main_button.creat_surf_cancel = function(){
    creating_gui.destroy();
    AIS_surfaces.remove(creating_surf);
    document.getElementById("tips").innerHTML = "曲面创建取消！";
    AIS_MODE = "NORMAL";
};

main_button.generate_surf_length = function(length){
    var pts = creating_surf.geo.ctrlPts;
    var v_num = creating_surf.geo.ctrlPtsNum[1];
    for(var i=0;i<v_num;i++){
        pts[(i+v_num)*3] = pts[i*3] + length*creating_para.norm.x;
        pts[(i+v_num)*3+1] = pts[i*3+1] + length*creating_para.norm.y;
        pts[(i+v_num)*3+2] = pts[i*3+2] + length*creating_para.norm.z;
    }
    creating_surf.compute();
};

main_button.insert_knot_surf_u = function(){
    var insert_gui = new dat.GUI();
    var f1 = insert_gui.addFolder("插入u向节点");
    creating_para.insert_knot_u = 0.5;
    var knot = f1.add(creating_para,'insert_knot_u',0,1).name("节点位置");
    f1.add(main_button, 'insert_knot_finish').name("插入").onChange(
        function(){
            if(deleting_surf.geo.insert_u(Math.round(knot.getValue()*100)/100)){
                deleting_surf.compute();
                deleting_surf.order_GUI_u.max(deleting_surf.geo.ctrlPtsNum[0]-1);
                document.getElementById("tips").innerHTML = "节点插入成功！";
                if(basic_canvas.style.visibility === "visible"){
                    ParaGUI.drawSurfBasicU(deleting_surf,basic_canvas);
                }
            }
            else {
                document.getElementById("tips").innerHTML = "";
                alert("节点插入失败！已达到最大重复度。");
            }
        }
    );
    f1.add(main_button, 'insert_knot_cancel').name("退出").onChange(
        function(){
            insert_gui.destroy();
        }
    );
    f1.open();
};

main_button.insert_knot_surf_v = function(){
    var insert_gui = new dat.GUI();
    var f1 = insert_gui.addFolder("插入v向节点");
    creating_para.insert_knot_v = 0.5;
    var knot = f1.add(creating_para,'insert_knot_v',0,1).name("节点位置");
    f1.add(main_button, 'insert_knot_finish').name("插入").onChange(
        function(){
            if(deleting_surf.geo.insert_v(Math.round(knot.getValue()*100)/100)){
                deleting_surf.compute();
                deleting_surf.order_GUI_v.max(deleting_surf.geo.ctrlPtsNum[1]-1);
                document.getElementById("tips").innerHTML = "节点插入成功！";
                if(basic_canvas.style.visibility === "visible"){
                    ParaGUI.drawSurfBasicV(deleting_surf,basic_canvas);
                }
            }
            else {
                document.getElementById("tips").innerHTML = "";
                alert("节点插入失败！已达到最大重复度。");
            }
        }
    );
    f1.add(main_button, 'insert_knot_cancel').name("退出").onChange(
        function(){
            insert_gui.destroy();
        }
    );
    f1.open();
};

main_button.generate_save_file = function(){
    var ans;
    ans = (AIS_curves.children.length+AIS_surfaces.children.length)+" ";
    for(var i=0;i<AIS_curves.children.length;i++){
        var bsp = AIS_curves.children[i];
        ans += 0+" "+bsp.geo.order[0]+" "+bsp.geo.ctrlPtsNum[0]+" ";
        for(var j=0;j<bsp.geo.ctrlPts.length;j++){
            ans += bsp.geo.ctrlPts[j]+" ";
        }
        for(var k=0;k<bsp.geo.knotNum[0];k++){
            ans += bsp.geo.knots[0][k]+" ";
        }
        ans += bsp.geo.mode[0]+" ";
    }
    for(var i=0;i<AIS_surfaces.children.length;i++){
        var bsp = AIS_surfaces.children[i];
        ans += 1+" "+bsp.geo.order[0]+" "+bsp.geo.order[1]+" "+bsp.geo.ctrlPtsNum[0]+" "+bsp.geo.ctrlPtsNum[1]+" ";
        for(var j=0;j<bsp.geo.ctrlPts.length;j++){
            ans += bsp.geo.ctrlPts[j]+" ";
            //if((j%3)==2){
            //    ans += "1 "
            //}
        }
        for(var k=0;k<bsp.geo.knotNum[0];k++){
            ans += bsp.geo.knots[0][k]+" ";
        }
        for(var k=0;k<bsp.geo.knotNum[1];k++){
            ans += bsp.geo.knots[1][k]+" ";
        }
        ans += bsp.geo.mode[0]+" "+bsp.geo.mode[1]+" ";
    }
    return ans;
};

main_button.get_file = function(){
    $("#file").trigger("click");
};

main_button.get_file_path = function(){
    if($('#file').val()!=="") {
        var file = $('#file').get(0).files[0];
        $('#file').val("");
    }else{
        return false;
    }
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(){
        var file_text = this.result;
        var buff=0;
        var obj_num="";
        while(file_text[buff]!==" "){
            obj_num+=file_text[buff];
            buff++;
        }
        buff++;
        obj_num = parseInt(obj_num);
        for(var num=0;num<obj_num;num++){
            var type = "";
            while(file_text[buff]!==" "){
                type+=file_text[buff];
                buff++;
            }
            buff++;
            switch (type){
                case "0":
                    var order = "";
                    var ptsnum = "";
                    var pts = new Array();
                    var knots = new Array();
                    var mode = "";

                    while(file_text[buff]!==" "){
                        order+=file_text[buff];
                        buff++;
                    }
                    order = parseInt(order);
                    buff++;
                    while(file_text[buff]!==" "){
                        ptsnum+=file_text[buff];
                        buff++;
                    }
                    ptsnum = parseInt(ptsnum);
                    var knotnum = ptsnum+order+1;
                    buff++;
                    for(var i=0;i<ptsnum;i++){
                        for(var j=0;j<3;j++){
                            var temp = "";
                            while(file_text[buff]!==" "){
                                temp+=file_text[buff];
                                buff++;
                            }
                            temp = parseFloat(temp);
                            pts.push(temp);
                            buff++;
                        }
                    }
                    for(var i=0;i<knotnum;i++){
                        var temp = "";
                        while(file_text[buff]!==" "){
                            temp+=file_text[buff];
                            buff++;
                        }
                        temp = parseFloat(temp);
                        knots.push(temp);
                        buff++;
                    }
                    while(file_text[buff]!==" "){
                        mode+=file_text[buff];
                        buff++;
                    }
                    buff++;
                    var geo_bct = new Geom_B_Curve(ptsnum,pts,knotnum,knots,order,mode);
                    var curve = new AIS_B_Curve(geo_bct);
                    curve.compute();
                    AIS_curves.add(curve);
                    generate_curve_gui(curve);
                    break;
                case "1":
                    var temp = "";
                    while(file_text[buff]!==" "){
                        temp+=file_text[buff];
                        buff++;
                    }
                    buff++;
                    var order = [parseInt(temp)];
                    temp = "";
                    while(file_text[buff]!==" "){
                        temp+=file_text[buff];
                        buff++;
                    }
                    buff++;
                    order.push(parseInt(temp));
                    temp = "";
                    while(file_text[buff]!==" "){
                        temp+=file_text[buff];
                        buff++;
                    }
                    buff++;
                    var pnum = [parseInt(temp)];
                    temp = "";
                    while(file_text[buff]!==" "){
                        temp+=file_text[buff];
                        buff++;
                    }
                    buff++;
                    pnum.push(parseInt(temp));
                    var pts = new Array();
                    for(var i=0;i<pnum[0]*pnum[1]*3;i++){
                        temp = "";
                        while(file_text[buff]!==" "){
                            temp+=file_text[buff];
                            buff++;
                        }
                        buff++;
                        pts.push(parseFloat(temp));
                    }
                    var knots_num = [pnum[0]+order[0]+1,pnum[1]+order[1]+1];
                    var knots_u = new Array();
                    for(var i=0;i<knots_num[0];i++){
                        temp = "";
                        while(file_text[buff]!==" "){
                            temp+=file_text[buff];
                            buff++;
                        }
                        buff++;
                        knots_u.push(parseFloat(temp));
                    }
                    var knots_v = new Array();
                    for(var i=0;i<knots_num[1];i++){
                        temp = "";
                        while(file_text[buff]!==" "){
                            temp+=file_text[buff];
                            buff++;
                        }
                        buff++;
                        knots_v.push(parseFloat(temp));
                    }
                    var knots = [knots_u,knots_v];
                    temp = "";
                    while(file_text[buff]!==" "){
                        temp+=file_text[buff];
                        buff++;
                    }
                    buff++;
                    var mode = [temp];
                    temp = "";
                    while(file_text[buff]!==" "){
                        temp+=file_text[buff];
                        buff++;
                    }
                    buff++;
                    mode.push(temp);
                    var geo_surf = new Geom_B_Surf(pnum,pts,knots_num,knots,order,mode);
                    var surf = new AIS_B_Surf(geo_surf);
                    surf.compute();
                    AIS_surfaces.add(surf);
                    generate_surf_gui(surf);
                    break;
            }
        }
    };
};

main_button.save_file = function(){
    var savefile = main_button.generate_save_file();
    $("#result").attr("value",savefile);
    $("#submit").trigger("click");
};

//-----以下为某些按钮调用的空函数其具体功能已通过响应实现------//
main_button.show_basic = function(){

};

main_button.cancel_creating_curve = function () {

};

main_button.finish_creating_curve = function () {

};

main_button.insert_knot_finish = function(){

};

main_button.insert_knot_cancel = function(){

};