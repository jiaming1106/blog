////////////////////////////////////////////////
//------------------基函数显示类----------------//
/**
 * @brief 基函数显示画布的控制
 * @param Int       off_l       鼠标点与左边界距离（用于画布拖动）
 * @param Int       off_t       鼠标点与上边界距离（用于画布拖动）
 * @param String    mode        交互模式
 * @function creat             创建画布
 * @funciton onMouseMove       鼠标移动响应函数
 * @funciton onMouseDown       鼠标点击响应函数
 * @funciton onMouseUp         鼠标抬起响应函数
 * @funciton init              画布初始化
 * @funciton translate         从基函数坐标转化为画布坐标
 * @funciton drawKnots         绘制节点矢量
 * @funciton drawBasic         绘制基函数图像
 * @funciton drawBasic_i       绘制第i个基函数的图像
 * @funciton drawCurveBasic    绘制曲线的节点矢量及基函数图像
 * @funciton drawSurfBasicU    绘制曲面U向的节点矢量及基函数图像
 * @funciton drawSurfBasicV    绘制曲面V向的节点矢量及基函数图像
 */
var ParaGUI = {
    off_l : 0,
    off_t : 0,
    mode : "NORMAL"
};

ParaGUI.creat = function(contain){
    var canvas = document.createElement('canvas');
    var context = canvas.getContext("2d");
    canvas.width = 250;
    canvas.height = 250;
    context.beginPath();
    context.fillStyle = '#555555';
    context.fillRect(0,0,canvas.width,canvas.height);
    contain.appendChild(canvas);
    context.fill();
    canvas.addEventListener('mousemove',ParaGUI.onMouseMove, false );
    canvas.addEventListener('mousedown',ParaGUI.onMouseDown, false );
    canvas.addEventListener('mouseup',ParaGUI.onMouseUp, false );
    return canvas;
};

ParaGUI.onMouseMove = function(e){
    event.preventDefault();
    var x = e.clientX-basic_canvas.offsetParent.offsetLeft;
    var y = e.clientY-basic_canvas.offsetParent.offsetTop;
    if(x>230&&x<250&&y>-10&&y<10){
        basic_canvas.style.cursor = 'crosshair';
    }else{
        basic_canvas.style.cursor = 'move';
    }
    if(ParaGUI.mode==="DRAG"){
        para_container.style.cssText = "z-index: 999;position: absolute;";
        para_container.style.left = (e.clientX-ParaGUI.off_l)+"px";
        para_container.style.top = (e.clientY-ParaGUI.off_t)+"px";
    }
};

ParaGUI.onMouseDown = function(e) {
    event.preventDefault();
    var x = e.clientX-basic_canvas.offsetParent.offsetLeft;
    var y = e.clientY-basic_canvas.offsetParent.offsetTop;
    ParaGUI.off_l = x;
    ParaGUI.off_t = y;
    ParaGUI.mode = "DRAG";
};

ParaGUI.onMouseUp = function(e) {
    event.preventDefault();
    ParaGUI.mode = "NORMAL";
    var x = e.clientX-basic_canvas.offsetParent.offsetLeft;
    var y = e.clientY-basic_canvas.offsetParent.offsetTop;
    if(x>230&&x<250&&y>-10&&y<10){
        basic_canvas.style.visibility = 'hidden';
        para_container.style.zIndex = '-1';
        basic_canvas.style.zIndex = '-1';
    }
};

ParaGUI.init = function(canvas){
    var context = canvas.getContext("2d");
    context.beginPath();
    context.fillStyle = '#000000';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.fill();

    context.beginPath();
    context.moveTo(20,220);
    context.lineTo(230,220);
    context.lineWidth = 4;
    context.strokeStyle = '#ffffff';
    context.stroke();
    context.beginPath();
    context.moveTo(20,220);
    context.lineTo(20,10);
    context.lineWidth = 2;
    context.strokeStyle = '#ffffff';
    context.stroke();

    context.beginPath();
    context.fillStyle = '#ffffff';
    context.fillText('1',10,17);
    context.fill();

    context.beginPath();
    context.moveTo(242,8);
    context.lineTo(250,0);
    context.moveTo(242,0);
    context.lineTo(250,8);
    context.lineWidth = 2;
    context.strokeStyle = '#ffffff';
    context.stroke();
};

//坐标转换
ParaGUI.translate = function(x,y){
    var ans = [x*210+20,220-210*y];
    return ans;
};

ParaGUI.drawKnots = function(canvas,knots){
    var context = canvas.getContext("2d");
    var r=0;
    for(var i=0;i<knots.length;i++){
        r++;
        if(!((i<(knots.length-1))&&(Math.abs(knots[i+1]-knots[i])<DELTA))){
            var t_xy = ParaGUI.translate(knots[i],0);
            context.beginPath();
            context.moveTo(t_xy[0],t_xy[1]);
            context.lineTo(t_xy[0],t_xy[1]-10);
            context.lineWidth = 1;
            context.strokeStyle = '#ffffff';
            context.stroke();

            context.beginPath();
            context.fillStyle = '#ffffff';
            context.fillText(knots[i].toFixed(2),t_xy[0]-10,t_xy[1]+15);
            if(r>1){
                context.fillText("("+r+")",t_xy[0]-10,t_xy[1]+30);
            }
            context.fill();
            r=0;
        }
    }
};

ParaGUI.drawBasic = function(canvas,knots,k,pnum){
    for(var i=0;i<pnum;i++){
        var color = '#ffffff';
        ParaGUI.drawBasic_i(canvas,knots,k,i,color);
    }
};

ParaGUI.drawBasic_i = function(canvas,knots,k,i,color){
    var context = canvas.getContext("2d");
    context.beginPath();
    var start = ParaGUI.translate(knots[i],Math_B.basicF(knots[i],k,knots,i));
    context.moveTo(start[0],start[1]);
    for(var u=knots[i]+0.01;u<knots[i+k+1];u=u+0.01){
        var point = ParaGUI.translate(u,Math_B.basicF(u,k,knots,i));
        context.lineTo(point[0],point[1]);
    }
    var end = ParaGUI.translate(knots[i+k+1],Math_B.basicF(knots[i+k+1],k,knots,i));
    context.lineTo(end[0],end[1]);
    context.lineWidth = 1;
    context.strokeStyle = color;
    context.stroke();
};

ParaGUI.drawCurveBasic = function(bsp,canvas){
    ParaGUI.init(canvas);
    ParaGUI.drawKnots(canvas,bsp.geo.knots[0]);
    ParaGUI.drawBasic(canvas,bsp.geo.knots[0],bsp.geo.order[0],bsp.geo.ctrlPtsNum[0]);
    bsp.is_showing_baisc = true;
};

ParaGUI.drawSurfBasicU = function(bsp,canvas){
    ParaGUI.init(canvas);
    ParaGUI.drawKnots(canvas,bsp.geo.knots[0]);
    ParaGUI.drawBasic(canvas,bsp.geo.knots[0],bsp.geo.order[0],bsp.geo.ctrlPtsNum[0]);
    bsp.is_showing_baisc = true;
};

ParaGUI.drawSurfBasicV = function(bsp,canvas){
    ParaGUI.init(canvas);
    ParaGUI.drawKnots(canvas,bsp.geo.knots[1]);
    ParaGUI.drawBasic(canvas,bsp.geo.knots[1],bsp.geo.order[1],bsp.geo.ctrlPtsNum[1]);
    bsp.is_showing_baisc = true;
};