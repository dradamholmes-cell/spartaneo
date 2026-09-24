(function(global){
  const params=new URLSearchParams(location.search);
  const customId=params.get('character')||'';
  const customName=(params.get('characterName')||'CUSTOM').trim().slice(0,40)||'CUSTOM';
  const customModel=params.get('characterModel')||'';
  const customReady=customId.startsWith('custom:')&&/^https?:\/\//i.test(customModel);
  const roster=[['adam','ADAM'],['sully','SULLY'],['streepy','STREEPY'],['bueno','BUENO'],['kp','KP'],['bubba','BUBBA'],['jubilee','JUBILEE'],['king_sully','KING SULLY'],['waylon','WAYLON'],['brianna','BRIANNA'],['mikey','MIKEY'],['mr_meena','MR. MEENA'],['mystery_guest','MYSTERY GUEST'],['kars','KARS']];
  if(customReady)roster.unshift([customId,customName.toUpperCase()]);
  global.OGBRoster=roster;
  const selectedId=()=>{
    const q=params.get('character');
    const stored=localStorage.getItem('ogb.character');
    const id=q||stored||'adam';
    return roster.some(([key])=>key===id)?id:'adam';
  };
  global.OGBCharacters={
    selected(){return {id:selectedId(),custom:selectedId().startsWith('custom:')}},
    playerName(){return roster.find(([id])=>id===selectedId())?.[1]||'ADAM'},
    byId(id){
      if(customReady&&id===customId)return {id,model:customModel,custom:true,name:customName};
      if(!roster.some(([key])=>key===id)) return null;
      return {id,model:`/api/arcade-assets/character/${encodeURIComponent(id)}`,custom:false};
    },
    handoff(){return customReady?{version:1,character:customId,characterId:customId.slice(7),characterName:customName,modelUrl:customModel}:null},
    recordResult(game,score,result){
      try{localStorage.setItem(`ogb.result.${game}`,JSON.stringify({score,result,at:Date.now()}))}catch{}
    }
  };
  global.OGBPartyMedia=global.OGBPartyMedia||{sync(){},attachPeer(){}};
})(globalThis);
