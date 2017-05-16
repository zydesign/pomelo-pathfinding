var sqrt = Math.sqrt;  //Math.pow(x,y)x的y次幂运算；Math.sqrt（x）x的平方根运算
var floor = Math.floor; //去小数后的最小值
var CAN_NOT_MOVE = Infinity; //不可走

//两点之间的距离
var distance  = function (dx,dy)
{
  return sqrt(dx * dx + dy * dy);
}

//检测msg是否合法，并存入theMsg
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

//创建属性队列
var createPriorityQueue = function (cmpPriority)
{
  var obj = {
    arr : new Array
  }

  obj.enqueue = function (e)
  {
    this.arr.push(e);
    //创建数组索引idx，父索引parentIdx
    var idx = this.arr.length - 1;
    var parentIdx = floor((idx - 1) / 2);
    while(0 <= parentIdx)
    {
      if(cmpPriority(this.arr[idx],this.arr[parentIdx]) <= 0)
      {
        break;
      }

      var tmp = this.arr[idx]
      this.arr[idx] = this.arr[parentIdx];
      this.arr[parentIdx] = tmp;
      idx = parentIdx;
      parentIdx = floor((idx - 1) / 2);
    }
  }

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

  obj.length = function ()
  {
    return this.arr.length;
  }

  return obj;
}


var createPriorityQueue2 = function (cmpPriority)
{
  var obj = {
    arr : new Array
  }

  obj.enqueue = function (e)
  {
    this.arr.push(e);
  }

  obj.dequeue = function ()
  {
    this.arr.sort(function (a,b) { return -cmpPriority(a,b); } );
    return this.arr.shift();
  }

  obj.length = function ()
  {
    return this.arr.length;
  }

  return obj;
}

//创建寻路探测器
function buildFinder(map)
{ //创建地图的瓦片数组
  var tiles = new Array;
  //获取瓦片信息
  var getTileInfo = function (x,y)
  {
    assert("number" === typeof(x)
           && "number" === typeof(y))

    var row = tiles[y];
    if(!row)
    {
      row = new Array;
      tiles[y] = row;
    }
    //创建瓦片信息
    var tileInfo = row[x];
    if (!tileInfo)
    {
      tileInfo = {
        x: x,
        y: y,
        processed: false,
        prev: null,
        cost: 0,
        heuristic: 0
      }
      row[x] = tileInfo;
    }

    return tileInfo;
  }

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

  var finder = function (sx,sy,gx,gy)
  {
    if(map.getWeight(gx,gy) >= CAN_NOT_MOVE)
    {
      return null;
    }

    clearTileInfo();

    var cmpHeuristic = function (t1,t2)
    {
      return t2.heuristic - t1.heuristic;
    }

    var queue = createPriorityQueue(cmpHeuristic);

    var found = false;

    var ft = getTileInfo(sx,sy);
    ft.cost = 0;
    ft.heuristic = 0;
    queue.enqueue(ft);

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

      footTile.processed = true;

      var processReachable = function (theX, theY, weight)
      {
        if(weight >= CAN_NOT_MOVE)
        {
          //不可走
          return;
        }

        var neighbourTile = getTileInfo(theX, theY);
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
    while(t)
    {
      paths.push({x:t.x, y:t.y});
      t = t.prev;
    }

    paths.reverse();
    return {paths: paths, cost:goalTile.cost};
  }

  return finder;
}

var q = createPriorityQueue(function (a,b) { return b - a; });
[78, 99, 10 , 22, 10, 5, 4, 6, 55, 102].forEach(function (a) {q.enqueue(a);});
// while(0 < q.length())
// {
//   console.log("jdkjfkd:      " + q.dequeue());
// }

module.exports.buildFinder = buildFinder;
