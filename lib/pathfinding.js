var sqrt = Math.sqrt;  //Math.pow(x,y)x的y次幂运算；Math.sqrt（x）x的平方根运算
var floor = Math.floor; //向小取整
var CAN_NOT_MOVE = Infinity; //不可走

//两点之间的距离
var distance  = function (dx,dy)
{
  return sqrt(dx * dx + dy * dy);
}

//验证函数。验证exp条件是否合法，true函数正常运行；不合法则抛出错误信息，并退出函数
var assert = function(exp,msg)
{
  if (exp)
  {
    return true;
  }
  else
  {
    var theMsg = msg === undefined ? "assert !!!" : msg;
    throw (theMsg);
  }
}

//创建顺序队列，参数cmpPriority为比较2个路径数组的优先级（长度短的优先）
var createPriorityQueue = function (cmpPriority)
{
  //创建一个obj对象，属性为数组Array---------------------------------------
  var obj = {
    arr : new Array
  }

  //obj的入队函数，开放列表。并把队列按照距离进行升序排列，费用少的在前面（e参数为：瓦片信息tileInfo）--------------------------------
  obj.enqueue = function (e)
  {
    this.arr.push(e);  //将瓦片信息tileInfo加入到obj对象的数组中
    
    //节点idx，父节点parentIdx
    var idx = this.arr.length - 1;            //数组最后一个对象的key
    var parentIdx = floor((idx - 1) / 2);
    //循环语句。检测父节点是否合适。
    while(0 <= parentIdx)
    {
      //如果父节点H值 小于 子节点的F值，退出循环。
      if(cmpPriority(this.arr[idx],this.arr[parentIdx]) <= 0)
      {
        break;
      }

      //如果父节点H值 大于 子节点。说明父节点不合适。再以父节点的瓦片作为子节点，前面的点作为父节点再次循环检测
      var tmp = this.arr[idx]                  //获取数组最后一块瓦片的信息
      this.arr[idx] = this.arr[parentIdx];     //将数组末位信息替换成父节点的值
      this.arr[parentIdx] = tmp;               //将父节点的信息替换成子节点的值（就是让费用小的放前面）
      idx = parentIdx;
      parentIdx = floor((idx - 1) / 2);        //第二次比较子节点的值还是原来的末位子节点，父节点的值原来父节点的父节点 
    }
  }

  //查找。查找具有最小F值的节点,从开放列表删除, 加入到封闭列表--------------------------
  obj.dequeue = function ()
  {
    if(this.arr.length <= 0)
    {
      return null;
    }

    var max = this.arr[0];

    var b = this.arr[this.arr.length - 1];
    var idx = 0;
    this.arr[idx] = b;

    while(true)
    {
      var leftChildIdx = idx * 2 + 1;
      var rightChildIdx = idx * 2 + 2;
      var targetPos = idx;
      if(leftChildIdx < this.arr.length &&
         cmpPriority(this.arr[targetPos], this.arr[leftChildIdx]) < 0)
      {
        targetPos = leftChildIdx;
      }

      if(rightChildIdx < this.arr.length &&
         cmpPriority(this.arr[targetPos], this.arr[rightChildIdx]) < 0)
      {
        targetPos = rightChildIdx;
      }

      if(targetPos === idx)
      {
        break;
      }

      var tmp = this.arr[idx];
      this.arr[idx] = this.arr[targetPos];
      this.arr[targetPos] = tmp;
      idx = targetPos;
    }

    this.arr.length -= 1;

    return max;
  }

  //obj对象的length属性-------------------------------------------------
  obj.length = function ()
  {
    return this.arr.length;
  }

  return obj;
}

//创建顺序队列2
var createPriorityQueue2 = function (cmpPriority)
{
  var obj = {
    arr : new Array
  }
  //入队
  obj.enqueue = function (e)
  {
    this.arr.push(e);
  }
  //出队
  obj.dequeue = function ()
  {
    //sort是数组排序
    this.arr.sort(function (a,b) { return -cmpPriority(a,b); } );
    return this.arr.shift();
  }
 
  //计算数组长度
  obj.length = function ()
  {
    return this.arr.length;
  }

  return obj;
}

//创建寻路器（游戏地图的Map.findPath调用该函数）-------------------------------------------------------------
function buildFinder(map)
{ //创建地图的瓦片数组
  var tiles = new Array;
  
  //获取瓦片信息函数，返回指定瓦片点的瓦片信息tileInfo
  var getTileInfo = function (x,y)
  {
    //先验证x,y是否为数字，true则函数正常运行，fasle则抛出错误并退出函数
    assert("number" === typeof(x)
           && "number" === typeof(y))
    //tiles的子数组-行
    var row = tiles[y];
    if(!row)
    {
      row = new Array;
      tiles[y] = row;
    }
    //创建瓦片信息，为第y行第x个瓦片
    var tileInfo = row[x];
    //如果瓦片为空，存入一个初始化的瓦片信息
    if (!tileInfo)
    {
      tileInfo = {
        x: x,
        y: y,
        processed: false, //是否是封闭节点
        prev: null,       //父节点。记录到达该tile的前一个tile（父节点）
        cost: 0,          //从起点tile到达当前tile的最短距离（G值）
        heuristic: 0      //从起点tile起，经过当前tile，到达终点tile的距离 (F值)
      }
      row[x] = tileInfo;
    }

    return tileInfo;
  }

  //初始化所有瓦片信息
  var clearTileInfo = function ()
  {
    tiles.forEach(function (row)
                  {
                    row.forEach(function(o)
                                {
                                  if(!o)
                                  {
                                    return;
                                  }
                                  o.processed = false;
                                  o.prev = null;
                                  o.cost = 0;
                                  o.heuristic = 0;
                                });
                  })
  }

  //寻路函数。参数：sx，sy为开始瓦片点，gx，gy为目标瓦片点
  var finder = function (sx,sy,gx,gy)
  {
    //map.getWeight是游戏地图map的函数，获取目标瓦片点的权重值，如果是Infinity，返回null
    if(map.getWeight(gx,gy) >= CAN_NOT_MOVE)
    {
      return null;
    }

    //初始化所有瓦片点信息
    clearTileInfo();

    //比较两中间瓦片点的F值
    var cmpHeuristic = function (t1,t2)
    {
      return t2.heuristic - t1.heuristic;
    }
   
    //创建优先队列。返回一个obj对象
    var queue = createPriorityQueue(cmpHeuristic);

    var found = false;

    //获取开始瓦片点的瓦片信息，并初始化费用cost和F值
    var ft = getTileInfo(sx,sy);
    ft.cost = 0;
    ft.heuristic = 0;
    queue.enqueue(ft);           //执行队列的入队函数

    while(0 < queue.length())
    {
      
      var footTile = queue.dequeue();
      var x = footTile.x;
      var y = footTile.y;

      if(x === gx && y === gy)
      {
        found = true;
        break;
      }

      if(footTile.processed)
      {
        continue;
      }

      //被计算过，封闭节点
      footTile.processed = true;

      var processReachable = function (theX, theY, weight)
      {
        if(weight >= CAN_NOT_MOVE)
        {
          //不可走
          return;
        }

        //相邻瓦片信息
        var neighbourTile = getTileInfo(theX, theY);
        //如果这个相邻瓦片是封闭节点，直接返回
        if(neighbourTile.processed)
        {
          return;
        }

        var costFromSrc = footTile.cost + weight * distance(theX - x, theY - y);
        if(!neighbourTile.prev ||  (costFromSrc < neighbourTile.cost))
        {
          neighbourTile.cost = costFromSrc;
          neighbourTile.prev = footTile;
          var distToGoal = distance(theX - gx, theY - gy);
          neighbourTile.heuristic = costFromSrc + distToGoal;
          queue.enqueue(neighbourTile);
        }
      }

      map.forAllReachable(x,y,processReachable);
    }

    if(!found)
    {
      return null;
    }
    //路径的坐标队列数组
    var paths = new Array();
    //到达的目标瓦片
    var goalTile = getTileInfo(gx,gy);
    var t = goalTile;
    //从目标瓦片信息开始，循环添加其父节点到paths数组中，一直到开始瓦片，之后倒序排列（让开始点在首位，目标点在末位）
    while(t)
    {
      paths.push({x:t.x, y:t.y});
      t = t.prev;
    }

    paths.reverse();
    //返回值：节点数组对象，开始节点到结束节点；终点的G值
    return {paths: paths, cost:goalTile.cost};
  }

  //返回结果是执行finder函数返回的结果
  return finder;
}

var q = createPriorityQueue(function (a,b) { return b - a; });
[78, 99, 10 , 22, 10, 5, 4, 6, 55, 102].forEach(function (a) {q.enqueue(a);});
// while(0 < q.length())
// {
//   console.log("jdkjfkd:      " + q.dequeue());
// }

module.exports.buildFinder = buildFinder;
