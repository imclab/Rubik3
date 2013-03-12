var Rubik=function(Np,sidep,dspp,colorsp/*,render*/)
{
    THREE.Object3D.call(this);
	// public properties
	this.rubik=null;
	this.rotation_in_progress=false;
	this.RA=Math.PI*0.5;
	this.undolist=[];
	this.undo_in_action=false;
	this.undolist_length=200;
	//this.ren=render;
	this.onChange=null;
	
	this.sides={bottom:3,top:2,	right:0,left:1,	front:4,back:5};
	var side=200;
	if (typeof sidep !='undefined' && sidep>0)
	side=sidep;
	var N=3;
	if (typeof Np !='undefined' && Np>0)
	N=parseInt(Np);
	var dsp=0.3;
	if (typeof dspp !='undefined' && dspp>0)
	dsp=dspp;
	var colors={inside:0x2c2c2c,top:0xFF00FF,bottom:0x00FF00,left:0xFFFF00,right:0x0000FF,front:0xFF0000,back:0x00FFFF}; // mutually complementary colors
	if (typeof colorsp !='undefined' && colorsp!=null)
	colors=colorsp;
	
	//N=3;
	var cubelets = [];
	var xx,yy,zz;
	var Nz=N,Nx=N,Ny=N;
	var sidex=side, sidey=side, sidez=side;
	var cubletsidex=sidex/(Nx+(Nx-1)*dsp);
	var cubletsidey=sidey/(Ny+(Ny-1)*dsp);
	var cubletsidez=sidez/(Nz+(Nz-1)*dsp);
	
	// build cubelets
	for (zz=0;zz<Nz;zz++)
	{
		for (xx=0;xx<Nx;xx++)
		{
			for (yy=0;yy<Ny;yy++)
			{						
				var materials=[];
				for (var mii=0;mii<6;mii++)
				{
					var mat=new THREE.MeshBasicMaterial( { color: colors.inside } );
					mat.name='inside';
					materials.push( mat );
				}
				
				// color external faces
				if (yy==0)
				{
					materials[this.sides['bottom']].color.setHex( colors.bottom );
					materials[this.sides['bottom']].name='bottom';
				}
				if (yy==Ny-1)
				{
					materials[this.sides['top']].color.setHex( colors.top );
					materials[this.sides['top']].name='top';
				}
				if (xx==Nx-1)
				{
					materials[this.sides['right']].color.setHex( colors.right );
					materials[this.sides['right']].name='right';
				}
				if (xx==0)
				{
					materials[this.sides['left']].color.setHex( colors.left );
					materials[this.sides['left']].name='left';
				}
				if (zz==Nz-1)
				{
					materials[this.sides['front']].color.setHex( colors.front );
					materials[this.sides['front']].name='front';
				}
				if (zz==0)
				{
					materials[this.sides['back']].color.setHex( colors.back );
					materials[this.sides['back']].name='back';
				}
				
				// new cubelet
				var cubelet =new THREE.Mesh( new THREE.CubeGeometry( cubletsidex, cubletsidey, cubletsidez, 1, 1, 1, materials ), new THREE.MeshFaceMaterial() );
				
				// position it centered
				cubelet.position.x = (cubletsidex+dsp*cubletsidex)*xx -sidex/2 +cubletsidex/2;
				cubelet.position.y = (cubletsidey+dsp*cubletsidey)*yy -sidey/2 +cubletsidey/2;
				cubelet.position.z = (cubletsidez+dsp*cubletsidez)*zz -sidez/2 +cubletsidez/2;
				cubelet.overdraw = true;
				cubelet.extra_data={xx:xx,yy:yy,zz:zz};
				cubelets.push(cubelet);
				// add it
				this.add(cubelet);
			}
		}
	}
	this.rubik={N:N, colors:{front:colors.front,back:colors.back,top:colors.top,bottom:colors.bottom,left:colors.left,right:colors.right,inside:colors.inside}, cubelets:cubelets, side:sidex, cubeletside:cubletsidex, dsp:dsp};
	//this.ren.renderer.render(this.ren.scene,this.ren.camera);
};
// Rubik is subclass of Object3D
Rubik.prototype=new THREE.Object3D();
Rubik.prototype.constructor = Rubik;
Rubik.prototype.addHistory=function(actionobj)
{
	if (!this.undo_in_action)
	{
		while (this.undolist.length>=this.undolist_length) {var foo=this.undolist.shift();}
		this.undolist.push(actionobj);
	}
};
Rubik.prototype.undo=function()
{
	var undoaction=null;
	if (!this.rotation_in_progress)
	{
		if (this.undolist.length>0)
		{
			this.undo_in_action=true;
			undoaction=this.undolist.pop();
			if (undoaction.param!=null)
				undoaction.func.call(this,undoaction.param);
			else
				undoaction.func.call(this);
			this.undo_in_action=false;
			return(undoaction.actiontype);
		}
	}
	return("");
};
Rubik.prototype.getCubeletSeenCoords=function(cubelet)
{
	if (this.rubik==null || this.rotation_in_progress) return(null);
	var c;
	if (cubelet instanceof THREE.Mesh)
		c=cubelet;
	else
		c=this.rubik.cubelets[cubelet];
	c.matrixAutoUpdate = false;
	c.updateMatrixWorld(true);
	c.position=c.matrix.getPosition();
	var cubeletseenas={xx:Math.round((c.position.x+this.rubik.side/2-this.rubik.cubeletside/2)/(this.rubik.cubeletside*(1+this.rubik.dsp))),
						yy:Math.round((c.position.y+this.rubik.side/2-this.rubik.cubeletside/2)/(this.rubik.cubeletside*(1+this.rubik.dsp))),
						zz:Math.round((c.position.z+this.rubik.side/2-this.rubik.cubeletside/2)/(this.rubik.cubeletside*(1+this.rubik.dsp)))};
	return(cubeletseenas);
};
Rubik.prototype.getCubeletsIndex=function(axis,row){
	if (this.rubik==null) return([]);
	if (this.rotation_in_progress) return([]);
	
	var a=[], result=[];
	
	if (row<0 || row>=this.rubik.N) return([]);
	
	axis=axis.charAt(0);
	axis=axis.toLowerCase();
	
	for (var i=0;i<this.rubik.cubelets.length;i++)
	{
		this.rubik.cubelets[i].matrixAutoUpdate = false;
		this.rubik.cubelets[i].updateMatrixWorld(true);
		this.rubik.cubelets[i].position=this.rubik.cubelets[i].matrix.getPosition();
		switch(axis)
		{
		case "y":
				a[i]=[i,this.rubik.cubelets[i].position.y];
				break;
		case "x":
				a[i]=[i,this.rubik.cubelets[i].position.x];
				break;
		case "z":
				a[i]=[i,this.rubik.cubelets[i].position.z];
				break;
		default:return(null); break;
		}
	}
	var cmp=function(aa,bb){return (aa[1]-bb[1]);};
	a.sort(cmp);
	for (i=0;i<this.rubik.N*this.rubik.N;i++)
		result[i]=a[row*this.rubik.N*this.rubik.N+i][0];
	return(result);
};
Rubik.prototype.getFacesAsSeen=function(cubelet)
{
	if (this.rubik==null || this.rotation_in_progress) return(null);
	
	var eq=function(a,b)
	{
		var delta=0;
		var aa=new THREE.Vector3(Math.round(a.x),Math.round(a.y),Math.round(a.z));
		var bb=new THREE.Vector3(Math.round(b.x),Math.round(b.y),Math.round(b.z));
		
		if (Math.abs(aa.x-bb.x)<=delta && Math.abs(aa.y-bb.y)<=delta && Math.abs(aa.z-bb.z)<=delta)
			return(true);
		return(false);
	};
	var c;
	if (cubelet instanceof THREE.Mesh)
		c=cubelet;
	else
		c=this.rubik.cubelets[cubelet];
	var n=[];
	c.matrixAutoUpdate = false;
	c.updateMatrixWorld(true);
	c.position=c.matrix.getPosition();
	c.geometry.computeFaceNormals();
	var m=c.matrix.clone();
	m.setPosition(new THREE.Vector3(0,0,0));
	for (var i=0;i<c.geometry.faces.length;i++)
	{
		 n.push(m.multiplyVector3( c.geometry.faces[i].normal.clone() ).normalize());
	}
	var materials=c.geometry.materials;
	var mat=null;
	var matname="";
	var r1=[],r2=[],r3=[],r4=[];
	//alert(n.length);
	for (var i=0;i<n.length;i++)
	{
		mat=materials[i];
		matname=mat.name;
		if (matname.toLowerCase()=="inside")
		{
			/*continue*/;
			r1["inside"]=mat.color;
			r2[matname]="inside";
			r3["inside"]=matname;
			r4["inside"]=mat;
		}
		else
		{
			if (eq(n[i],new THREE.Vector3(0,1,0))) // face seen as top
			{
				r1["top"]=mat.color;
				r2[matname]="top";
				r3["top"]=matname;
				r4["top"]=mat;
			}
			if (eq(n[i],new THREE.Vector3(0,-1,0))) // face seen as bottom
			{
				r1["bottom"]=mat.color;
				r2[matname]="bottom";
				r3["bottom"]=matname;
				r4["bottom"]=mat;
			}
			if (eq(n[i],new THREE.Vector3(0,0,1))) // face seen as front
			{
				r1["front"]=mat.color;
				r2[matname]="front";
				r3["front"]=matname;
				r4["front"]=mat;
			}
			if (eq(n[i],new THREE.Vector3(0,0,-1))) // face seen as back
			{
				r1["back"]=mat.color;
				r2[matname]="back";
				r3["back"]=matname;
				r4["back"]=mat;
			}
		// take left-right opposite due to papervision 3d left-right definition on cube etc..?? NO NO
			if (eq(n[i],new THREE.Vector3(-1,0,0))) // face seen as left
			{
				r1["left"]=mat.color;
				r2[matname]="left";
				r3["left"]=matname;
				r4["left"]=mat;
			}
			if (eq(n[i],new THREE.Vector3(1,0,0))) // face seen as right
			{
				r1["right"]=mat.color;
				r2[matname]="right";
				r3["right"]=matname;
				r4["right"]=mat;
			}
		}
	}
	return({seencolor:r1, faceseenas:r2, invfaceseenas:r3, mat:r4});
};
Rubik.prototype.setRotation=function(params){
	if (this.rubik==null || this.rotation_in_progress) return;
	
	var axis=params.axis;
	var angle=params.angle;
	var row=params.row;
	
	if (angle==0) return;
	var ind=this.getCubeletsIndex(axis,row);
	if (ind==null) { return; }
	
	var rangle=angle*this.RA;
	
	axis=axis.charAt(0);
	axis=axis.toLowerCase();
	
	var m=new THREE.Matrix4();
	switch(axis)
	{
		case "x":
				m.setRotationX(rangle);
				break;
		case "y":
				m.setRotationY(rangle);
				break;
				
		case "z":
				m.setRotationZ(rangle);
				break;
		default: return; break;
	}
	for (var k=0;k<ind.length;k++)
	{
		var target=this.rubik.cubelets[ind[k]];
		target.matrixAutoUpdate = false;
		target.matrix.multiply(m,target.matrix);
		//target.position=target.matrix.getPosition();
		//target.matrixWorldNeedsUpdate = true;
		//target.updateMatrixWorld(true);
	}
	//this.ren.renderer.render(this.ren.scene,this.ren.camera);
	params.angle=-angle;
	params.duration=2;
	this.addHistory({func:this.rotate, param:params, actiontype:"setRotation"});
	if (this.onChange!=null)
		this.onChange.call(this);
	return;		
};
Rubik.prototype.scramble=function(nsteps)
{
	if (this.rotation_in_progress) return;
	
	var intRandRange=function(a,b){return(Math.round(Math.random()*(b-a)+a));};
	
	var axes=["x", "y", "z"];
	var angles=[-2, -1, 1, 2];
	var N=this.rubik.N;
	var k=0;
	
	if (typeof nsteps=='undefined' || nsteps<=0) nsteps=intRandRange(1,100);
	
	for (k=0; k<nsteps; k++)
	{
		var axis=axes[intRandRange(0,2)];
		var row=intRandRange(0,N-1);
		var angle=angles[intRandRange(0,3)];
		this.setRotation({axis:axis,row:row,angle:angle});
	}
	return;
};
Rubik.prototype.rotate=function(params)
{
	if (this.rubik==null) return;
	if (this.rotation_in_progress) return;

	var duration=5;
	var axis=params.axis;
	var row=params.row;
	if (params.duration!=null) duration=params.duration;
	var angle=params.angle;

	if (duration <=0) return;
	if (angle==0) return;
	var ind=this.getCubeletsIndex(axis,row);
	if (ind==null) return; 			
	axis=axis.charAt(0);
	axis=axis.toLowerCase();

	var tthis=this;
	var obj;
	var count=this.rubik.N*this.rubik.N;
	var onemore=0;

	var onComplete=function(g)
	{
		onemore++;
		if (onemore>=count)
		{
			this.thiss.rotation_in_progress=false;
			onemore=0;
			//this.thiss.ren.renderer.render(this.thiss.ren.scene,this.thiss.ren.camera);
			if (this.params.onComplete!=null)
				this.params.onComplete.call(this.thiss);
			if (this.thiss.onChange!=null)
				this.thiss.onChange.call(this.thiss);
		}
	};

	var onChange=function()
	{
		var m=new THREE.Matrix4();
		switch(this.axis)
		{
			case "x":
					m.setRotationX(this.angle-this.prevangle);
					break;
			case "y":
					m.setRotationY(this.angle-this.prevangle);
					break;
					
			case "z":
					m.setRotationZ(this.angle-this.prevangle);
					break;
			default: return; break;
		}
		this.cubelet.matrixAutoUpdate = false;
		this.cubelet.matrix.multiply(m,this.cubelet.matrix);
		this.cubelet.position=this.cubelet.matrix.getPosition();
		this.cubelet.matrixWorldNeedsUpdate = true;
		this.prevangle=this.angle;
	};
				
	this.rotation_in_progress=true;
	for (var k=0;k<ind.length;k++)
	{
		obj={cubelet:this.rubik.cubelets[ind[k]], axis:axis, angle:0, prevangle:0, thiss:this, params:params};
		new TWEEN.Tween( obj ).onUpdate(onChange).onComplete(onComplete).to( {angle: angle*this.RA}, Math.abs(angle)*duration*1000 ).easing( TWEEN.Easing.Exponential.EaseInOut).start();
	}
	params.angle=-angle;
	//params.onComplete=null;
	this.addHistory({func:this.rotate, param:params, actiontype:"rotate"});
};
Rubik.prototype.getFacesByName=function(cubelet,f)
{
	if (this.rubik==null) return([]);
	
	var result=[];
	var c;
	if (cubelet instanceof THREE.Mesh)
		c=cubelet;
	else
		c=this.rubik.cubelets[cubelet];
	var faces=c.geometry.materials;
	var mat=null;
	
	for (var i=0;i<faces.length;i++)
	{
		mat=faces[i];
		if (mat.name==f)
		{
			result.push(mat);
		}
	}
	return(result);
};
Rubik.prototype.getFacesByColor=function(cubelet,col)
{
	if (this.rubik==null) return([]);
	var c;
	if (cubelet instanceof THREE.Mesh)
		c=cubelet;
	else
		c=this.rubik.cubelets[cubelet];
	var result=[];
	var materials=c.geometry.materials;
	var mat=null;
	
	for (var i=0;i<materials.length;i++)
	{
		mat=materials[i];
		if (mat.color.getHex()==col)
		{
			result.push(mat);
		}
	}
	return(result);
};
Rubik.prototype.setRubikColors=function(params)
{
	if (this.rubik==null) return;
	if (this.rotation_in_progress) return;
	
	var colorsobj=params.colors;
	var faces=null;
	var i,j;
	var cclone={front:this.rubik.colors.front, back:this.rubik.colors.back, top:this.rubik.colors.top, bottom:this.rubik.colors.bottom, left:this.rubik.colors.left, right:this.rubik.colors.right, inside:this.rubik.colors.inside};
	var cclone2={front:this.rubik.colors.front, back:this.rubik.colors.back, top:this.rubik.colors.top, bottom:this.rubik.colors.bottom, left:this.rubik.colors.left, right:this.rubik.colors.right, inside:this.rubik.colors.inside};
	var n,m;
	var allow=true;
	
	// don't allow 2 identical colors on different faces
	for (n in colorsobj)
		cclone2[n] = colorsobj[n];
	for (n in cclone2)
	 for (m in cclone2)
		if (cclone2[n]==cclone2[m] && n!=m)
			allow=false;
	
	if (!allow) return false;
	
	if (colorsobj!=null)
	{
		for (i=0;i<this.rubik.cubelets.length;i++)
		{
			if (colorsobj.top!=null)
			{
				faces=this.getFacesByColor(this.rubik.cubelets[i],cclone.top);
				for (j=0;j<faces.length;j++)
					if (faces[j].name!="inside")
						faces[j].color.setHex(colorsobj.top);
				this.rubik.colors.top=colorsobj.top;
			}
			if (colorsobj.bottom!=null)
			{
				faces=this.getFacesByColor(this.rubik.cubelets[i],cclone.bottom);
				for (j=0;j<faces.length;j++)
					if (faces[j].name!="inside")
						faces[j].color.setHex(colorsobj.bottom);
				this.rubik.colors.bottom=colorsobj.bottom;
			}
			if (colorsobj.left!=null)
			{
				faces=this.getFacesByColor(this.rubik.cubelets[i],cclone.left);
				for (j=0;j<faces.length;j++)
					if (faces[j].name!="inside")
						faces[j].color.setHex(colorsobj.left);
				this.rubik.colors.left=colorsobj.left;
			}
			if (colorsobj.right!=null)
			{
				faces=this.getFacesByColor(this.rubik.cubelets[i],cclone.right);
				for (j=0;j<faces.length;j++)
					if (faces[j].name!="inside")
						faces[j].color.setHex(colorsobj.right);
				this.rubik.colors.right=colorsobj.right;
			}
			if (colorsobj.front!=null)
			{
				faces=this.getFacesByColor(this.rubik.cubelets[i],cclone.front);
				for (j=0;j<faces.length;j++)
					if (faces[j].name!="inside")
						faces[j].color.setHex(colorsobj.front);
				this.rubik.colors.front=colorsobj.front;
			}
			if (colorsobj.back!=null)
			{
				faces=this.getFacesByColor(this.rubik.cubelets[i],cclone.back);
				for (j=0;j<faces.length;j++)
					if (faces[j].name!="inside")
						faces[j].color.setHex(colorsobj.back);
				this.rubik.colors.back=colorsobj.back;
			}
			if (colorsobj.inside!=null)
			{
				faces=this.getFacesByName(this.rubik.cubelets[i],"inside"); // this take by name so to avoid mixed ups
				for (j=0;j<faces.length;j++)
					faces[j].color.setHex(colorsobj.inside);
				this.rubik.colors.inside=colorsobj.inside;
			}
		}
		params.colors=cclone;
		this.addHistory({func:this.setRubikColors, param:params, actiontype:"setRubikColors"});
		if (this.onChange!=null)
			this.onChange.call(this);
		return true;
	}
};
Rubik.prototype.getFaceColorAndIndex=function(seenface,ii,jj)
{
	if (this.rubik==null || this.rotation_in_progress) return(null);
	
	var i;
	var res;
	var cubes=this.rubik.cubelets;
	for (i=0;i<cubes.length;i++)
	{
		var obj=this.getFacesAsSeen(cubes[i]);
		var cubeletseenas=this.getCubeletSeenCoords(cubes[i]);
		
		if (obj.seencolor[seenface]!=null && obj.seencolor[seenface]!=undefined)
		{
			switch(seenface)
			{
				case "top":
								if (cubeletseenas.xx==jj && cubeletseenas.zz==ii)
								return({color:obj.seencolor[seenface]/*,index:this.rubik.faces.indexOf(obj.mat[seenface])*/});
								break;
				case "bottom":
								if (cubeletseenas.xx==jj && cubeletseenas.zz==this.rubik.N-1-ii)
								return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
								break;
				case "left":
								if (cubeletseenas.yy==this.rubik.N-1-ii && cubeletseenas.zz==this.rubik.N-1-jj)
								return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
								break;
				case "right":
								if (cubeletseenas.yy==this.rubik.N-1-ii && cubeletseenas.zz==jj)
								return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
								break;
				case "front":
								if (cubeletseenas.xx==jj && cubeletseenas.yy==this.rubik.N-1-ii)
								return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
								break;
				case "back":
								if (cubeletseenas.xx==this.rubik.N-1-jj && cubeletseenas.yy==this.rubik.N-1-ii)
								return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
								break;
			}
		}
	}
	return(null);
};

Rubik.prototype.getFlatImage=function(el)
{
	if (this.rubik==null || this.rotation_in_progress) return;
	var toHex=function(col)
	{
		var hx;
		if (col.substring)
			hx=col;
		else
			hx=col.toString(16);
		var prefix='';
		for (var i=0;i<6-hx.length;i++)
			prefix+='0';
		return('#'+prefix+hx);
	};
	var makecolorsquare=function(col,w,h,y,x)
	{
		return("<div style='position:absolute;background-color:"+toHex(col)+";width:"+(w)+"px;height:"+(h)+"px;top:"+(y)+"px;left:"+(x)+"px;'></div>");
	};
	var innerHTML='';
	var N=this.rubik.N;
	/*var w=15;
	var h=15;
	var ds=8;
	var fd=15;
	var fw=N*(w+ds);
	var fh=N*(h+ds);
	var i,j;
	var a,b;
	var obj;*/
	/*if (width>0)
	{
		var dsp:Number=ds/w;
		w=width/(4+4*dsp+N);
		h=w;
		ds=w*dsp;
		fd=w;
		fw=N*(w+ds);
		fh=N*(h+ds);
	}*/
	var i,j;
	var w=5;
	var h=5;
	var dd=3;
	var ddd=5;
	var xx,yy;
	
	//a=fw+fd;
	//b=0;
	var flat={top:[],bottom:[],front:[],back:[],left:[],right:[]};
				
	// top
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			obj=this.getFaceColorAndIndex("top",j,N-1-i);
			flat.top[j+i*N]=obj.color.getHex();
		}
	}
	// top
	xx=N*(w+dd)+ddd;
	yy=0;
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			innerHTML+=makecolorsquare(flat.top[i+(N-1-j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
		}
	}
	 
	//a=0;
	//b=fh+fd;
	// left
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			obj=this.getFaceColorAndIndex("left",j,N-1-i);
			flat.left[j+i*N]=obj.color.getHex();
		}
	}
	// left
	xx=0;
	yy=N*(h+dd)+ddd;
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			innerHTML+=makecolorsquare(flat.left[i+(j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
		}
	}
	
	//a=fw+fd;
	//b=fh+fd;
	// front
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			obj=this.getFaceColorAndIndex("front",j,N-1-i);
			flat.front[j+i*N]=obj.color.getHex();
		}
	}
	// front
	xx=N*(w+dd)+ddd;
	yy=N*(h+dd)+ddd;
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			innerHTML+=makecolorsquare(flat.front[i+(N-1-j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
		}
	}
	
	//a=2*(fw+fd);
	//b=fh+fd;
	// right
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			obj=this.getFaceColorAndIndex("right",j,N-1-i);
			flat.right[j+i*N]=obj.color.getHex();
		}
	}
	// right
	xx=2*(N*(w+dd)+ddd);
	yy=N*(h+dd)+ddd;
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			innerHTML+=makecolorsquare(flat.right[i+(j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
		}
	}
	
	//a=3*(fw+fd);
	//b=fh+fd;
	// back
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			obj=this.getFaceColorAndIndex("back",j,N-1-i);
			flat.back[j+i*N]=obj.color.getHex();
		}
	}
	// back
	xx=3*(N*(w+dd)+ddd);
	yy=N*(h+dd)+ddd;
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			innerHTML+=makecolorsquare(flat.back[i+(N-1-j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
		}
	}
	
	//a=fw+fd;
	//b=2*(fh+fd);
	// bottom
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			obj=this.getFaceColorAndIndex("bottom",j,N-1-i);
			flat.bottom[j+i*N]=obj.color.getHex();
		}
	}
	// bottom
	xx=N*(w+dd)+ddd;
	yy=2*(N*(h+dd)+ddd);
	for (i=0;i<N;i++)
	{
		for (j=0;j<N;j++)
		{
			innerHTML+=makecolorsquare(flat.bottom[i+(N-1-j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
		}
	}
	//callback.call(this,flat);
	el.style.width=(((w+dd)*N+ddd)*4+10)+'px';
	el.style.height=(((h+dd)*N+ddd)*3+10)+'px';
	el.innerHTML=innerHTML;
	return(flat);
};


