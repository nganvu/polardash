
function trackball(){	
	this.currX = 0;
	this.currY = 0;
	this.moving = false;
	
	this.matrix = SglMat4.identity();
	this.toMul =  SglMat4.identity();
}
var tb = new trackball();

	mousedown =  function (event) {
			tb.currX = event.clientX;
			tb.currY =  this.height - event.clientY;
			tb.moving = true;
		}
	mouseup =  function (event) {
			tb.moving = false;
		}
	mousemove =  function (event) {
		if(!tb.moving){
			return;
		}
		var newX = event.clientX;
		var newY = this.height - event.clientY;
		var  dx = newX -tb. currX;

		
		var rad = this.width ;
		var v1 =SpiderGL.Math.Vec3.normalize( [tb.currX,tb.currY,rad]);
		var v2 = SpiderGL.Math.Vec3.normalize([newX,newY,rad]);
		var axis = SpiderGL.Math.Vec3.cross(v1,v2);
		var angle = SpiderGL.Math.Vec3.length(axis);
		if(angle>0.00001) 
		tb.matrix =SglMat4.mul(SglMat4.rotationAngleAxis(angle,axis),tb.matrix);
		
		tb.toMul = SglMat4.transpose(tb.matrix);		
		tb.currX = newX;
		tb.currY = newY;
	}
