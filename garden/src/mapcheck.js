const E=require('./engine.js');
for(const k of ['A','B','A2','B2']){
  const rows=E.MAPS[k]; console.log(k); rows.forEach(r=>console.log('  '+r));
  const lv=E.LEVELS.find(l=>l.mapKey===k);
  const R=E.dijkstra(lv,lv.start,null,null).dist;
  let floor=0, unreach=[];
  for(let i=0;i<E.N;i++){ if(!lv.walls[i]){floor++; if(R[i]===Infinity) unreach.push(i);} }
  console.log('  floor',floor,'walls',E.N-floor,'unreach',unreach, 'start',E.XY(lv.start));
  // dist from start
  const g=[];for(let y=0;y<6;y++){g.push(R.slice(y*6,y*6+6).map(v=>v===Infinity?' # ':String(v).padStart(2)+' ').join(''));}
  console.log(g.map(s=>'  '+s).join('\n'));
}
