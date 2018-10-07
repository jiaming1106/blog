var DELTA = 0.0000001;
////////////////////////////////////////////////////////////
//------------------B样条数学基础计算类start--------------//
/** 
    * @brief B样条数学基类
    * @function findSection         在节点矢量中确定某一点所在的区间编号
    * @funciton calPointRecursion   点计算递归函数
    * @funciton calPoint            给定参数域坐标通过deboor方法计算并返回点坐标
    * @funciton generateKnots       根据给定的控制顶点、次数、类型生成并返回节点矢量
    * @function basicF              B样条基函数计算函数
    */  
function Math_B(){}

/** 
    * @brief 区间搜索函数
    * @param float  u          要确定位置的参数值
    * @param Array  u_coord    节点矢量序列
    * @param int    cpts_num   控制顶点数（为处理与定义域末节点重合情况）
    */  
Math_B.findSection = function(u,u_coord,cpts_num){
    var begin = 0;
    var end = u_coord.length;
    var mid = Math.round((begin+end)/2);
    //与末节点重合
    if(Math.abs(u_coord[cpts_num]-u)<DELTA){
        return cpts_num-1;
    }
    while(!((u_coord[mid]<u||u_coord[mid]===u)&&u_coord[mid+1]>u)){
        if(u_coord[mid]>u){
            end=mid;
        }
        else{
            begin = mid;
        }
        mid = Math.round((begin+end)/2);
    }
    return mid;
};

/** 
    * @brief 点计算递归函数
    * @param Array  u           该点的参数域位置
    * @param Array  u_coord     各个方向的节点矢量
    * @param Array  pts_num     各个方向的控制顶点数
    * @param Array  orders      各个方向的次数
    * @param Array  cpts        控制顶点序列
    */  
Math_B.prototype.calPointRecursion = (function cpr(u,u_coord,pts_num,orders,cpts){
    var result = new Array();
    var pk = new Array();
    var ti_n = Math_B.findSection(u[0],u_coord[0],pts_num[0]);
    //如果u是一维的，则直接进行deboor计算
    if(u.length===1){
        for(var i=0;i<orders[0]+1;i++){
            pk[i*3] = cpts[(ti_n-orders[0]+i)*3];
            pk[i*3+1] = cpts[(ti_n-orders[0]+i)*3+1];
            pk[i*3+2] = cpts[(ti_n-orders[0]+i)*3+2];
        }
    }else{
        //如果u不是一维的，降维求每个低维的递归结果，对这些结果进行deboor计算
        //对点进行拆分
        var next_pnum = 1;
        for(var i=1;i<pts_num.length;i++){
            next_pnum *= pts_num[i];
        }
        var next_u = u.slice(1);
        var next_coord = u_coord.slice(1);
        var next_pts_num = pts_num.slice(1);
        var next_order = orders.slice(1);
        for(var i=0;i<orders[0]+1;i++){
            var start_ID = (ti_n-orders[0]+i)*next_pnum;
            var end_ID = (ti_n-orders[0]+i)*next_pnum+next_pnum-1;
            var next_pts = cpts.slice(start_ID*3,end_ID*3+2+1);
            //每一部分分别进行递归计算
            var pk_ans = cpr(next_u,next_coord,next_pts_num,next_order,next_pts);
            pk[i*3] = pk_ans[0];
            pk[i*3+1] = pk_ans[1];
            pk[i*3+2] = pk_ans[2];
        }
    }
    //de boor
    for(var r=orders[0];r>0;r--){
        for(i=0;i<r;i++){
            var nki;
            nki = (u[0]-u_coord[0][ti_n+1-r+i])/(u_coord[0][ti_n+1+i]-u_coord[0][ti_n+1-r+i]);
            pk[3*i] = (1-nki)*pk[3*i]+nki*pk[3*(i+1)];
            pk[3*i+1] = (1-nki)*pk[3*i+1]+nki*pk[3*(i+1)+1];
            pk[3*i+2] = (1-nki)*pk[3*i+2]+nki*pk[3*(i+1)+2];
        }
    }
    result[0] = pk[0];
    result[1] = pk[1];
    result[2] = pk[2];
    return result;
});

/** 
    * @brief 点计算函数
    * @param Array  u           该点的参数域位置
    */  
Math_B.prototype.calPoint  = function(u){
    return this.calPointRecursion(u,this.knots,this.ctrlPtsNum,this.order,this.ctrlPts);
};

/** 
    * @brief 节点矢量序列生成
    * @param int    pnum     控制顶点数
    * @param int    order    次数
    * @param String mode     节点矢量类型"Uniform""QuasiUniform""PiecewiseBezier""Riesenfeld""HartleyJudd"
    * @param Array  cpts     控制顶点序列
    */ 
Math_B.prototype.generateKnots = function(pnum, order, mode, pts){
    var knts = new Array();
    switch(mode){
        case "Uniform": //0均匀
            var step = 1/(pnum+order);
            var start=0;
            for(var i=0;i<pnum+order+1;i++){
                knts.push(start);
                start+=step;
            }
            break;
        case "QuasiUniform": //1准均匀
            var i;
            for(i=0;i<order;i++){
                knts[i] = 0;
            }
            for(var j=0;j<pnum-order+1;j++,i++){
                knts[i] = j/(pnum-order);
            }
            for(;i<pnum+order+1;i++){
                knts[i] = 1;
            }
            break;
        case "PiecewiseBezier": //2分段贝齐尔
            var l_num = (pnum-1)/order;
            var step = 1/l_num;
            for(var i=0;i<order+1;i++){
                knts.push(0);
            }
            var temp = step;
            for(var j=0;j<l_num;j++){
                for(var i=0;i<order;i++){
                    knts.push(temp);
                }
                temp+=step;
            }
            knts.push(1);
            break;
        case "Riesenfeld": //3Riesenfeld
            for(var i=0;i<order+1;i++){
                knts.push(0);
            }
            var length = 0;
            if(order%2){
                //奇数
                for(var j=0;j<pnum-1;j++){
                    var t_l = Math.sqrt(Math.pow(pts[j*3]-pts[(j+1)*3],2)+Math.pow(pts[j*3+1]-pts[(j+1)*3+1],2)+Math.pow(pts[j*3+2]-pts[(j+1)*3+2],2));
                    if(j>((order+1)/2-1)&&j<(pnum-(order+1)/2)){
                        knts.push(length);
                    }
                    length+=t_l;
                }
            }else{
                //偶数
                for(var j=0;j<pnum-1;j++){
                    var t_l = Math.sqrt(Math.pow(pts[j*3]-pts[(j+1)*3],2)+Math.pow(pts[j*3+1]-pts[(j+1)*3+1],2)+Math.pow(pts[j*3+2]-pts[(j+1)*3+2],2));
                    if(j>(order/2-1)&&j<(pnum-order/2-1)){
                        knts.push(length+t_l/2);
                    }
                    length+=t_l;
                }
            }
            for(var i in knts) knts[i] = knts[i]/length;
            for(var i=0;i<order+1;i++){
                knts.push(1);
            }
            break;
        case "HartleyJudd": //4Hartley-Judd
            for(var i=0;i<order+1;i++){
                knts.push(0);
            }
            var length = 0;
            var l_arr = new Array();
            for(var j=0;j<pnum-1;j++){
                var t_l = Math.sqrt(Math.pow(pts[j*3]-pts[(j+1)*3],2)+Math.pow(pts[j*3+1]-pts[(j+1)*3+1],2)+Math.pow(pts[j*3+2]-pts[(j+1)*3+2],2));
                l_arr.push(t_l);
                length+=t_l;
            }
            var u_total=0;
            for(var j=0;j<pnum-order;j++){
                for(var k=0;k<order;k++){
                    u_total+=l_arr[k+j];
                }
                knts.push(u_total);
            }
            for(var i in knts) knts[i] = knts[i]/u_total;
            for(var i=0;i<order;i++){
                knts.push(1);
            }
            break;
    }
    return knts;
};

/** 
    * @brief B样条基函数计算Ni,k(u)
    * @param int    u       参数值
    * @param int    k       次数k
    * @param Array  knots   节点矢量序列
    * @param int    i       第i个
    */ 
Math_B.basicF = function(u,k,knots,i){
    if(k===0){
        if((u>knots[i])&&(u<=knots[i+1]))
            return 1;
        else return 0;
    }
    else{
        var N1,N2;
        if(Math.abs(knots[i+k]-knots[i])<DELTA){
            N1 = 0;
        }else{
            N1 = Math_B.basicF(u,k-1,knots,i)*(u-knots[i])/(knots[i+k]-knots[i]);
        }
        if(Math.abs(knots[i+k+1]-knots[i+1])<DELTA){
            N2 = 0;
        }else{
            N2 = Math_B.basicF(u,k-1,knots,i+1)*(knots[i+k+1]-u)/(knots[i+k+1]-knots[i+1]);
        }
        return N1+N2;
    }
};
//------------------B样条数学基础计算类end----------------//
////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
//------------------B样条曲线几何类start------------------//
/**
 * @brief B样条曲线几何类
 * @param Array    ctrlPtsNum   控制顶点数
 * @param Array    ctrlPts      控制顶点序列
 * @param Array    knotNum      节点矢量数
 * @param Array    knots        节点矢量序列
 * @param Array    order        次数
 * @param Array    mode         节点矢量类型
 * @funciton initFromPoint  根据控制点、次数、节点矢量类型，计算并更新节点矢量。在次数变化、曲线类型变化时使用。
 * @function calPoints      对参数域进行离散，计算并返回曲线的离散点
 * @funciton calFuns        返回第i个控制点对应的基函数曲线的离散点
 * @funciton add_point      按照节点矢量类型增加一个控制顶点（动态交互建立曲线时使用）
 * @function isPlanecurve   判断曲线是否为平面曲线
 * @function insert         节点插入
 */
function Geom_B_Curve(pnum ,pts ,knum ,kts ,k){
    Math_B.call(this);
    this.ctrlPtsNum = new Array();
    this.ctrlPts = new Array();
    this.knotNum = new Array();
    this.knots = new Array();
    this.order = new Array();
    this.mode = new Array();
    if(arguments.length === 6){
		this.ctrlPtsNum.push(arguments[0]);
		this.ctrlPts = arguments[1];
		this.knotNum.push(arguments[2]);
		this.knots.push(arguments[3]);
		this.order.push(arguments[4]);
        this.mode.push(arguments[5]);
	}else if(arguments.length === 4){
		this.ctrlPtsNum.push(arguments[0]);
		this.ctrlPts = arguments[1];
		this.order.push(arguments[2]);
		this.mode.push(arguments[3]);
		this.initFromPoint();
	}
}
Geom_B_Curve.prototype = new Math_B();
Geom_B_Curve.prototype.constructor = Geom_B_Curve;

/**
 * @brief 根据控制点、次数、节点矢量类型，计算并更新节点矢量。
 *
 */
Geom_B_Curve.prototype.initFromPoint = function(){
    this.knotNum[0] = this.ctrlPtsNum[0] + this.order[0] + 1;
    this.knots[0] = this.generateKnots(this.ctrlPtsNum[0],this.order[0],this.mode[0],this.ctrlPts);
};

/**
 * @brief 计算并返回曲线离散点
 * @param double    density       离散密度
 */
Geom_B_Curve.prototype.calPoints = function(density){
    var points_result = new Array();

    for(var u=this.knots[0][this.order[0]];u<this.knots[0][this.ctrlPtsNum[0]];u=u+density){
        var u_arr = [u];
        var pt = this.calPoint(u_arr);
        points_result.push(pt);
    }
    var u_arr = [this.knots[0][this.ctrlPtsNum[0]]];
    var pt_e = this.calPoint(u_arr);
    points_result.push(pt_e);

    return points_result;
};

/**
 * @brief 计算并返回该曲线的第i个基函数曲线离散点
 * @param double    density       离散密度
 * @param int       i             第i个控制顶点
 */
Geom_B_Curve.prototype.calFuns = function(density,i){
    var funs_result = new Array();

    for(var u=this.knots[0][this.order[0]];u<this.knots[0][this.ctrlPtsNum[0]];u=u+density){
        var fun = Math_B.basicF(u,this.order[0],this.knots[0],i);
        funs_result.push(fun);
    }
    var u_arr = [this.knots[0][this.ctrlPtsNum[0]]];
    funs_result.push(Math_B.basicF(u_arr,this.order[0],this.knots[0],i));

    return funs_result;
};

/**
 * @brief 增加一个控制顶点
 * @param double    t_x,t_y,t_z     控制顶点坐标
 */
Geom_B_Curve.prototype.add_point = function(t_x,t_y,t_z){
    this.ctrlPtsNum[0]++;
    this.ctrlPts.push(t_x);
    this.ctrlPts.push(t_y);
    this.ctrlPts.push(t_z);
    this.initFromPoint();
};

/**
 * @brief 判断此B样条曲线是否为平面曲线
 *
 */
Geom_B_Curve.prototype.isPlanecurve = function(){
    var p0 = new THREE.Vector3(this.ctrlPts[0],this.ctrlPts[1],this.ctrlPts[2]);
    var p1 = new THREE.Vector3(this.ctrlPts[3],this.ctrlPts[4],this.ctrlPts[5]);
    var l1 = new THREE.Vector3();
    l1.copy(p1).sub(p0);
    var norm = new THREE.Vector3();
    var p2_num;
    for(p2_num=2;p2_num<this.ctrlPtsNum[0];p2_num++){
        var p2= new THREE.Vector3(this.ctrlPts[p2_num*3],this.ctrlPts[p2_num*3+1],this.ctrlPts[p2_num*3+2]);
        var l2 =new THREE.Vector3();
        l2.copy(p2).sub(p0);
        norm.crossVectors(l2,l1);
        if(norm.length()>DELTA) break;
    }
    //此时控制顶点全部共线，曲线为一条直线，为平面直线。但是
    //无法获得其法向量无法进行后续拉伸，因此暂时返回false。
    //等后续工作完善，应按照逻辑返回true。
    if(p2_num===this.ctrlPtsNum[0]) return false;
    for(var i = this.ctrlPtsNum[0]-1;i>2;i--){
        var p2= new THREE.Vector3(this.ctrlPts[i*3],this.ctrlPts[i*3+1],this.ctrlPts[i*3+2]);
        var l2 =new THREE.Vector3();
        l2.copy(p2).sub(p0);
        if(norm.dot(l2)>DELTA) return false;
    }
    return norm.normalize();
};

/**
 * @brief 在node处节点插入
 * @param double    node       插入的节点矢量
 */
Geom_B_Curve.prototype.insert = function(node){
    var ti_n = Math_B.findSection(node,this.knots[0],this.ctrlPtsNum[0]);
    var r=0;
    //计算重复度
    for(var i=ti_n;i>=0;i--){
        if(Math.abs(this.knots[0][i]-node)<DELTA) r++;
        else break;
    }
    if(r===this.order[0]) return false;
    var new_pts = new Array();
    //更新pts
    for(var i=0;i<ti_n-this.order[0]+1;i++){
        new_pts.push(this.ctrlPts[i*3]);
        new_pts.push(this.ctrlPts[i*3+1]);
        new_pts.push(this.ctrlPts[i*3+2]);
    }
    for(var i=ti_n-this.order[0]+1;i<ti_n+1-r;i++){
        var nki;
        if(Math.abs(this.knots[0][i+this.order[0]]-this.knots[0][i])<DELTA) nki=0;
        else nki = (node-this.knots[0][i])/(this.knots[0][i+this.order[0]]-this.knots[0][i]);
        new_pts.push((1-nki)*this.ctrlPts[(i-1)*3]+nki*this.ctrlPts[3*i]);
        new_pts.push((1-nki)*this.ctrlPts[(i-1)*3+1]+nki*this.ctrlPts[3*i+1]);
        new_pts.push((1-nki)*this.ctrlPts[(i-1)*3+2]+nki*this.ctrlPts[3*i+2]);
    }
    for(var i=ti_n+1-r;i<this.ctrlPtsNum[0]+1;i++){
        new_pts.push(this.ctrlPts[(i-1)*3]);
        new_pts.push(this.ctrlPts[(i-1)*3+1]);
        new_pts.push(this.ctrlPts[(i-1)*3+2]);
    }
    this.ctrlPts = new_pts;
    //更新pts_num
    this.ctrlPtsNum[0]++;
    //更新knot
    for(var i=this.knotNum[0];i>ti_n+1;i--){
        this.knots[0][i] = this.knots[0][i-1];
    }
    this.knots[0][ti_n+1]=node;
    //更新knot_num
    this.knotNum[0]++;
    return true;
};
//------------------B样条曲线几何类end--------------------//
////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
//------------------B样条曲面几何类start------------------//
/**
 * @brief B样条曲面几何类
 * @param Array    ctrlPtsNum   控制顶点数
 * @param Array    ctrlPts      控制顶点序列
 * @param Array    knotNum      节点矢量数
 * @param Array    knots        节点矢量序列
 * @param Array    order        次数
 * @param Array    mode         节点矢量类型
 * @funciton initFromPoint      根据控制点、次数、节点矢量类型，计算并更新节点矢量。在控制顶点变化、次数变化、节点矢量类型变化时使用。
 * @function calPoints          对参数域进行离散，计算并返回曲面的离散点及面片。如果给定控制顶点编号则同时返回控制点对应基函数曲面的离散值。
 * @funciton generateDiscrete   根据密度对参数域进行离散
 * @funciton insert_u           u向节点插入
 * @function insert_v           v向节点插入（未与u向合并为同一个函数是由于控制顶点序列的存储方式使两种节点插入在具体实现时的算法流程有差别）
 */
function Geom_B_Surf(pnum ,pts ,knum ,kts ,k){
    Math_B.call(this);
    this.ctrlPtsNum = new Array();
    this.ctrlPts = new Array();
    this.knotNum = new Array();
    this.knots = new Array();
    this.order = new Array();
    this.mode = new Array();
    if(arguments.length === 6){
        this.ctrlPtsNum = arguments[0];
        this.ctrlPts = arguments[1];
        this.knotNum = arguments[2];
        this.knots = arguments[3];
        this.order = arguments[4];
        this.mode = arguments[5];
    }else if(arguments.length === 4){
        this.ctrlPtsNum = arguments[0];
        this.ctrlPts = arguments[1];
        this.order = arguments[2];
        this.mode = arguments[3];
        this.initFromPoint();
    }
}
Geom_B_Surf.prototype = new Math_B();
Geom_B_Surf.prototype.constructor = Geom_B_Surf;

/**
 * @brief 更新曲面节点矢量信息
 *
 */
Geom_B_Surf.prototype.initFromPoint = function(){
    this.knotNum = new Array(2);
    this.knotNum[0] = this.ctrlPtsNum[0] + this.order[0] + 1;
    this.knotNum[1] = this.ctrlPtsNum[1] + this.order[1] + 1;

    this.knots = new Array(2);

    var knot_u_arr = new Array(this.knotNum[0]);
    var knot_v_arr = new Array(this.knotNum[1]);
    for(var i=0;i<knot_u_arr.length;i++) knot_u_arr[i] = 0;
    for(var i=0;i<knot_v_arr.length;i++) knot_v_arr[i] = 0;
    //u-0
    for(var i=0;i<this.ctrlPtsNum[1];i++){
        var temp_pts = new Array(this.ctrlPtsNum[0]*3);
        for(var z=0;z<this.ctrlPtsNum[0];z++){
            temp_pts[z*3] = this.ctrlPts[(z*this.ctrlPtsNum[1]+i)*3];
            temp_pts[z*3+1] = this.ctrlPts[(z*this.ctrlPtsNum[1]+i)*3+1];
            temp_pts[z*3+2] = this.ctrlPts[(z*this.ctrlPtsNum[1]+i)*3+2];
        }
        var temp_arr = this.generateKnots(this.ctrlPtsNum[0],this.order[0],this.mode[0],temp_pts);
        for(var j=0;j<this.knotNum[0];j++){
            knot_u_arr[j] += temp_arr[j];
        }
    }
    for(var i in knot_u_arr) knot_u_arr[i] = knot_u_arr[i]/this.ctrlPtsNum[1];
    //v-1
    for(var i=0;i<this.ctrlPtsNum[0];i++){
        var temp_pts = this.ctrlPts.slice(i*this.ctrlPtsNum[1]*3,(i+1)*this.ctrlPtsNum[1]*3);
        var temp_arr = this.generateKnots(this.ctrlPtsNum[1],this.order[1],this.mode[1],temp_pts);
        for(var j=0;j<this.knotNum[1];j++){
            knot_v_arr[j] += temp_arr[j];
        }
    }
    for(var i in knot_v_arr) knot_v_arr[i] = knot_v_arr[i]/this.ctrlPtsNum[0];
    this.knots = [knot_u_arr,knot_v_arr];
};

/**
 * @brief 根据给定密度对曲面进行离散，返回参数域离散结果
 * @param Array    density       各个方向的离散密度
 */
Geom_B_Surf.prototype.generateDiscrete = function(density){
    var discr = new Array(2);

    //计算离散点
    var result = new Array();
    for(var i=this.knots[0][this.order[0]];i<this.knots[0][this.ctrlPtsNum[0]];i+=density[0]){
        for(var j=this.knots[1][this.order[1]];j<this.knots[1][this.ctrlPtsNum[1]];j+=density[1]){
            var pt = [i,j];
            result.push(pt);
        }
        var j_t = this.knots[1][this.ctrlPtsNum[1]];
        var pt_t = [i,j_t];
        result.push(pt_t);
    }
    var i_end = this.knots[0][this.ctrlPtsNum[0]];
    for(var j=this.knots[1][this.order[1]];j<this.knots[1][this.ctrlPtsNum[1]];j+=density[1]){
        var pt = [i_end,j];
        result.push(pt);
    }
    var j_e = this.knots[1][this.ctrlPtsNum[1]];
    var pt_e = [i_end,j_e];
    result.push(pt_e);
    discr[0] = result;

    //计算面
    var faces = new Array();
    var i_num=Math.ceil((this.knots[0][this.ctrlPtsNum[0]]-this.knots[0][this.order[0]])/density[0])+1;
    var j_num=Math.ceil((this.knots[1][this.ctrlPtsNum[1]]-this.knots[1][this.order[1]])/density[1])+1;
    for(var i=0;i<i_num-1;i++){
        for(var j=0;j<j_num-1;j++){
            var t_face1 = [i*j_num+j,(i+1)*j_num+j,i*j_num+j+1];
            var t_face2 = [i*j_num+j+1,(i+1)*j_num+j,(i+1)*j_num+j+1];
            faces.push(t_face1);
            faces.push(t_face2);
        }
    }
    discr[1] = faces;
    return discr;
};

/**
 * @brief 根据给定密度对曲面进行离散，返回离散点坐标及曲面片拓扑关系。如果给定控制顶点编号则同时返回基函数离散值。
 * @param Array    density       各个方向的离散密度
 * @param Int      I,J           第I行第J个控制顶点
 */
Geom_B_Surf.prototype.calPoints = function(density,I,J){
    var points_result = {};
    points_result.points = new Array();

    var discre = this.generateDiscrete(density);
    var u = discre[0];
    points_result.faces = discre[1];

    for(var i in u){
        var pt = this.calPoint(u[i]);
        points_result.points.push(pt);
    }

    if(arguments.length===3){
        points_result.funs = new Array();
        for(var i=0;i<u.length;i++){
            var nu = Math_B.basicF(u[i][0],this.order[0],this.knots[0],I);
            var nv = Math_B.basicF(u[i][1],this.order[1],this.knots[1],J);
            points_result.funs.push(nu*nv);
        }
    }
    return points_result;
};

/**
 * @brief 曲面的u向节点插入
 * @param double    node        节点插入位置
 */
Geom_B_Surf.prototype.insert_u = function(node){
    var ti_n = Math_B.findSection(node,this.knots[0],this.ctrlPtsNum[0]);
    var r=0;
    //计算重复度
    for(var i=ti_n;i>=0;i--){
        if(Math.abs(this.knots[0][i]-node)<DELTA) r++;
        else break;
    }
    if(r===this.order[0]) return false;
    for(var layer=0;layer<this.ctrlPtsNum[1];layer++){
        //对每一层的点进行更新
        var new_pts = new Array();
        //原有此层点的坐标数组构建
        var pk = new Array();
        for(var i=0;i<this.ctrlPtsNum[0];i++){
            pk[i*3] = this.ctrlPts[(i*this.ctrlPtsNum[1]+layer)*3];
            pk[i*3+1] = this.ctrlPts[(i*this.ctrlPtsNum[1]+layer)*3+1];
            pk[i*3+2] = this.ctrlPts[(i*this.ctrlPtsNum[1]+layer)*3+2];
        }
        //更新pts
        for(var i=0;i<ti_n-this.order[0]+1;i++){
            new_pts.push(pk[i*3]);
            new_pts.push(pk[i*3+1]);
            new_pts.push(pk[i*3+2]);
        }
        for(var i=ti_n-this.order[0]+1;i<ti_n+1-r;i++){
            var nki;
            if(Math.abs(this.knots[0][i+this.order[0]]-this.knots[0][i])<DELTA) nki=0;
            else nki = (node-this.knots[0][i])/(this.knots[0][i+this.order[0]]-this.knots[0][i]);
            new_pts.push((1-nki)*pk[(i-1)*3]+nki*pk[3*i]);
            new_pts.push((1-nki)*pk[(i-1)*3+1]+nki*pk[3*i+1]);
            new_pts.push((1-nki)*pk[(i-1)*3+2]+nki*pk[3*i+2]);
        }
        for(var i=ti_n+1-r;i<this.ctrlPtsNum[0]+1;i++){
            new_pts.push(pk[(i-1)*3]);
            new_pts.push(pk[(i-1)*3+1]);
            new_pts.push(pk[(i-1)*3+2]);
        }
        //计算好的顶点返回原顶点数组
        for(var i=0;i<this.ctrlPtsNum[0]+1;i++){
            this.ctrlPts[(i*this.ctrlPtsNum[1]+layer)*3] = new_pts[i*3];
            this.ctrlPts[(i*this.ctrlPtsNum[1]+layer)*3+1] = new_pts[i*3+1];
            this.ctrlPts[(i*this.ctrlPtsNum[1]+layer)*3+2] = new_pts[i*3+2];
        }
    }
    //更新pts_num
    this.ctrlPtsNum[0]++;
    //更新knot
    for(var i=this.knotNum[0];i>ti_n+1;i--){
        this.knots[0][i] = this.knots[0][i-1];
    }
    this.knots[0][ti_n+1]=node;
    //更新knot_num
    this.knotNum[0]++;
    return true;
};

/**
 * @brief 曲面的v向节点插入
 * @param double    node        节点插入位置
 */
Geom_B_Surf.prototype.insert_v = function(node){
    var ti_n = Math_B.findSection(node,this.knots[1],this.ctrlPtsNum[1]);
    var r=0;
    //计算重复度
    for(var i=ti_n;i>=0;i--){
        if(Math.abs(this.knots[1][i]-node)<DELTA) r++;
        else break;
    }
    if(r===this.order[1]) return false;
    var temp_pts = new Array();
    for(var layer=0;layer<this.ctrlPtsNum[0];layer++){
        //对每一层的点进行更新
        var new_pts = new Array();
        //原有此层点的坐标数组构建
        var pk = new Array();
        for(var i=0;i<this.ctrlPtsNum[1];i++){
            pk[i*3] = this.ctrlPts[(layer*this.ctrlPtsNum[1]+i)*3];
            pk[i*3+1] = this.ctrlPts[(layer*this.ctrlPtsNum[1]+i)*3+1];
            pk[i*3+2] = this.ctrlPts[(layer*this.ctrlPtsNum[1]+i)*3+2];
        }
        //更新pts
        for(var i=0;i<ti_n-this.order[1]+1;i++){
            new_pts.push(pk[i*3]);
            new_pts.push(pk[i*3+1]);
            new_pts.push(pk[i*3+2]);
        }
        for(var i=ti_n-this.order[1]+1;i<ti_n+1-r;i++){
            var nki;
            if(Math.abs(this.knots[1][i+this.order[1]]-this.knots[1][i])<DELTA) nki=0;
            else nki = (node-this.knots[1][i])/(this.knots[1][i+this.order[1]]-this.knots[1][i]);
            new_pts.push((1-nki)*pk[(i-1)*3]+nki*pk[3*i]);
            new_pts.push((1-nki)*pk[(i-1)*3+1]+nki*pk[3*i+1]);
            new_pts.push((1-nki)*pk[(i-1)*3+2]+nki*pk[3*i+2]);
        }
        for(var i=ti_n+1-r;i<this.ctrlPtsNum[1]+1;i++){
            new_pts.push(pk[(i-1)*3]);
            new_pts.push(pk[(i-1)*3+1]);
            new_pts.push(pk[(i-1)*3+2]);
        }
        //计算好的顶点返回原顶点数组
        for(var i=0;i<this.ctrlPtsNum[1]+1;i++){
            temp_pts[(layer*(this.ctrlPtsNum[1]+1)+i)*3] = new_pts[i*3];
            temp_pts[(layer*(this.ctrlPtsNum[1]+1)+i)*3+1] = new_pts[i*3+1];
            temp_pts[(layer*(this.ctrlPtsNum[1]+1)+i)*3+2] = new_pts[i*3+2];
        }
    }
    this.ctrlPts = temp_pts;
    //更新pts_num
    this.ctrlPtsNum[1]++;
    //更新knot
    for(var i=this.knotNum[1];i>ti_n+1;i--){
        this.knots[1][i] = this.knots[1][i-1];
    }
    this.knots[1][ti_n+1]=node;
    //更新knot_num
    this.knotNum[1]++;
    return true;
};
//------------------B样条曲面几何类end---------------------//
////////////////////////////////////////////////////////////