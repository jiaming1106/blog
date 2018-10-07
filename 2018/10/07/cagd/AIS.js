////////////////////////////////////////////////////////
//--------------------AIS_B_Curve类start--------------//
/**
 * @brief B样条曲线交互类
 * @param Geom_B_Curve  geo             交互类对应的几何模型
 * @param Object3D      lines           离散曲线交互对象
 * @param Object3D      ctr_poly_bounds 离散多边形交互对象
 * @param Object3D      ctr_poly_points 控制顶点交互对象
 * @param Array         ctr_points_ID   控制顶点对应的全局编号
 * @param Bool          ctr_visible     控制网格的可见性
 * @param GUI           order_GUI       曲线对应的GUI
 * @param Int           acting_node     正在被选中的顶点编号（为了绘制出影响区间，如果为-1则没有顶点选中）
 * @function init       初始化函数
 * @funciton compute    根据几何信息计算交互对象
 */
function AIS_B_Curve(geom_bsp){
    THREE.Scene.call(this);
    this.geo = geom_bsp;
    this.lines = {};
    this.ctr_poly_bounds = {};
    this.ctr_poly_points = new THREE.Scene();
    this.ctr_points_ID = new Array();
    this.ctr_visible = true;
    this.order_GUI = {};
    this.acting_node = -1;
}
AIS_B_Curve.prototype = new THREE.Scene();
AIS_B_Curve.prototype.constructor = AIS_B_Curve;

AIS_B_Curve.prototype.init = function(){
    this.children.splice(0,this.children.length);
    this.lines = {};
    this.ctr_poly_bounds = {};
    this.ctr_poly_points = new THREE.Scene();
    this.ctr_points_ID = new Array();
};

AIS_B_Curve.prototype.compute = function(){
        //清空原有图像
        this.init();
        //生成曲线离散lines
        var geo_lines = new THREE.Geometry();
        var mat_lines = new THREE.MeshBasicMaterial({vertexColors: true});

        var spline_pts = this.geo.calPoints(0.01);
        var funcs;
        if(this.acting_node>-1){
            funcs = this.geo.calFuns(0.01,this.acting_node);
        }
        for (var num = 0; num < spline_pts.length; num++) {
            var color_lines;
            if(this.acting_node===-1)
                color_lines= new THREE.Color(PROPERTY.line);
            else{
                var cc = (funcs[num]*100).toFixed(0);
                if(cc>0)
                    color_lines= new THREE.Color("hsl(0,100%,"+(100-cc)+"%)");
                else
                    color_lines= new THREE.Color(PROPERTY.line);
            }
            geo_lines.vertices.push(new THREE.Vector3(spline_pts[num][0], spline_pts[num][1], spline_pts[num][2]));
            geo_lines.colors.push(color_lines);
        }

        this.lines = new THREE.Line(geo_lines, mat_lines);
        this.lines.name = "Line";

        //生成控制AIS_控制多边形: ctr_poly_bounds & this.ctr_poly_points
        var geo_poly_bounds = new THREE.Geometry();
        for(var sp_i = 0;sp_i<this.geo.ctrlPtsNum[0];sp_i++){
            geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*sp_i],this.geo.ctrlPts[3*sp_i+1],this.geo.ctrlPts[3*sp_i+2]));

            var mat_p = new THREE.MeshBasicMaterial( {color: PROPERTY.Ctr_Point} );
            var geo_p = new THREE.SphereGeometry(PROPERTY.Ctr_Point_R, 15, 15);
            var sphere = new THREE.Mesh(geo_p,mat_p);
            sphere.position.set(this.geo.ctrlPts[3*sp_i],this.geo.ctrlPts[3*sp_i+1],this.geo.ctrlPts[3*sp_i+2]);
            sphere.name = "Ctr_Point";
            this.ctr_points_ID.push(sphere.id);
            this.ctr_poly_points.add(sphere);
        }
        var mat_bound = new THREE.MeshBasicMaterial( {color: PROPERTY.Ctr_Poly} );
        this.ctr_poly_bounds = new THREE.Line(geo_poly_bounds, mat_bound);
        this.ctr_poly_bounds.name = "Ctr_Poly";
        this.ctr_poly_bounds.visible = this.ctr_visible;
        this.ctr_poly_points.visible = this.ctr_visible;
        //将离散曲线和控制多边形加入AIS_Curve
        this.add(this.lines);
        this.add(this.ctr_poly_bounds);
        this.add(this.ctr_poly_points);
};
//--------------------AIS_B_Curve类end----------------//

////////////////////////////////////////////////////////
//--------------------AIS_B_Surf类start---------------//
/**
 * @brief B样条曲面交互类
 * @param Geom_B_Surf   geo             交互类对应的几何模型
 * @param Object3D      meshes          离散面片交互对象
 * @param Object3D      ctr_poly_bounds 离散多边形交互对象
 * @param Object3D      ctr_poly_points 控制顶点交互对象
 * @param Array         ctr_points_ID   控制顶点对应的全局编号
 * @param Bool          ctr_visible     控制网格的可见性
 * @param GUI           order_GUI_u/v   曲面对应的GUI
 * @param Int           acting_node     正在被选中的顶点编号（为了绘制出影响区间，如果为-1则没有顶点选中）
 * @function init       初始化函数
 * @funciton compute    根据几何信息计算交互对象
 * @function IDtoIJ     将顶点编号ID转化为顶点在控制网格中的行列IJ
 */
function AIS_B_Surf(geom_bsp){
    THREE.Scene.call(this);
    this.geo = geom_bsp;
    this.meshes = {};
    this.ctr_poly_bounds = {};
    this.ctr_poly_points = new THREE.Scene();
    this.ctr_points_ID = new Array();
    this.ctr_visible = true;
    this.order_GUI_u = {};
    this.order_GUI_v = {};
    this.acting_node = -1;
}
AIS_B_Surf.prototype = new THREE.Scene();
AIS_B_Surf.prototype.constructor = AIS_B_Surf;
AIS_B_Surf.prototype.init = function(){
    this.children.splice(0,this.children.length);
    this.meshes = {};
    this.ctr_poly_bounds = {};
    this.ctr_poly_points = new THREE.Scene();
    this.ctr_points_ID = new Array();
};

AIS_B_Surf.IDtoIJ = function(num,vnum){
    var I = parseInt(num/vnum);
    var J = num%vnum;
    var ans = [I,J];
    return ans;
};

AIS_B_Surf.prototype.compute = function(){
    //清空原有图像
    this.init();
    //生成曲面离散三角片
    var geo_meshes = new THREE.Geometry();
    var density = [0.05,0.05];
    var disc;
    if(this.acting_node>-1){
        var ij = AIS_B_Surf.IDtoIJ(this.acting_node,this.geo.ctrlPtsNum[1]);
        disc = this.geo.calPoints(density,ij[0],ij[1]);
    }else{
        disc = this.geo.calPoints(density);
    }
    var surf_points = disc.points;
    var surf_faces = disc.faces;
    var funs;
    if(this.acting_node>-1){
        funs = disc.funs;
    }
    for(var i in surf_points){
        geo_meshes.vertices.push(new THREE.Vector3(surf_points[i][0],surf_points[i][1],surf_points[i][2]));
        var color;
        if(this.acting_node===-1){
            color = new THREE.Color(PROPERTY.Mesh);
        }else{
            var cc = (funs[i]*100).toFixed(0);
            if(cc>0)
                color = new THREE.Color("hsl(240,100%,"+(100-cc)+"%)");
            else
                color = new THREE.Color(PROPERTY.Mesh);
        }
        geo_meshes.colors.push(color);
    }
    for(var j in surf_faces){
        var norm = [new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,1)];
        var colors = [geo_meshes.colors[surf_faces[j][0]],geo_meshes.colors[surf_faces[j][1]],geo_meshes.colors[surf_faces[j][2]]]
        geo_meshes.faces.push(new THREE.Face3(surf_faces[j][0],surf_faces[j][1],surf_faces[j][2],norm,colors,j));
    }
    var mat_faces = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors,side: THREE.DoubleSide } );
    this.meshes = new THREE.Mesh( geo_meshes, mat_faces );

    //生成控制AIS_控制多边形 ctr_poly_bounds
    var geo_poly_bounds = new THREE.Geometry();
    for(var i=0;i<this.geo.ctrlPtsNum[0]-1;i++){
        for(var j=0;j<this.geo.ctrlPtsNum[1]-1;j++){
            var t_ID = i*this.geo.ctrlPtsNum[1]+j;
            var l_ID = i*this.geo.ctrlPtsNum[1]+j+1;
            var r_ID = (i+1)*this.geo.ctrlPtsNum[1]+j;
            geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*t_ID],this.geo.ctrlPts[3*t_ID+1],this.geo.ctrlPts[3*t_ID+2]));
            geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*l_ID],this.geo.ctrlPts[3*l_ID+1],this.geo.ctrlPts[3*l_ID+2]));
            geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*t_ID],this.geo.ctrlPts[3*t_ID+1],this.geo.ctrlPts[3*t_ID+2]));
            geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*r_ID],this.geo.ctrlPts[3*r_ID+1],this.geo.ctrlPts[3*r_ID+2]));
        }
        var t_ID_e = i*this.geo.ctrlPtsNum[1]+this.geo.ctrlPtsNum[1]-1;
        var r_ID_e = (i+1)*this.geo.ctrlPtsNum[1]+this.geo.ctrlPtsNum[1]-1;
        geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*t_ID_e],this.geo.ctrlPts[3*t_ID_e+1],this.geo.ctrlPts[3*t_ID_e+2]));
        geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*r_ID_e],this.geo.ctrlPts[3*r_ID_e+1],this.geo.ctrlPts[3*r_ID_e+2]));
    }
    for(var j=0;j<this.geo.ctrlPtsNum[1]-1;j++){
        var i = this.geo.ctrlPtsNum[0]-1;
        var t_ID = i*this.geo.ctrlPtsNum[1]+j;
        var l_ID = i*this.geo.ctrlPtsNum[1]+j+1;
        geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*t_ID],this.geo.ctrlPts[3*t_ID+1],this.geo.ctrlPts[3*t_ID+2]));
        geo_poly_bounds.vertices.push(new THREE.Vector3(this.geo.ctrlPts[3*l_ID],this.geo.ctrlPts[3*l_ID+1],this.geo.ctrlPts[3*l_ID+2]));
    }
    var mat_bound = new THREE.MeshBasicMaterial( {color: PROPERTY.Ctr_Poly} );
    this.ctr_poly_bounds = new THREE.LineSegments(geo_poly_bounds, mat_bound);
    this.ctr_poly_bounds.name = "Ctr_Poly";

    //生成AIS_控制顶点 this.ctr_poly_points
    for(var sp_i=0;sp_i<this.geo.ctrlPts.length/3;sp_i++){
        var mat_p = new THREE.MeshBasicMaterial( {color: PROPERTY.Ctr_Point} );
        var geo_p = new THREE.SphereGeometry(PROPERTY.Ctr_Point_R, 15, 15);
        var sphere = new THREE.Mesh(geo_p,mat_p);
        sphere.position.set(this.geo.ctrlPts[3*sp_i],this.geo.ctrlPts[3*sp_i+1],this.geo.ctrlPts[3*sp_i+2]);
        sphere.name = "Ctr_Point";
        this.ctr_points_ID.push(sphere.id);
        this.ctr_poly_points.add(sphere);
    }
    this.ctr_poly_bounds.visible = this.ctr_visible;
    this.ctr_poly_points.visible = this.ctr_visible;
    //将离散曲线和控制多边形加入AIS_Curve
    this.add(this.meshes);
    this.add(this.ctr_poly_bounds);
    this.add(this.ctr_poly_points);

};
//--------------------AIS_B_Surf类end-----------------//