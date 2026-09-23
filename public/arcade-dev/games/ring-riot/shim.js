(function(global){
  const roster=[['adam','ADAM'],['sully','SULLY'],['streepy','STREEPY'],['bueno','BUENO'],['kp','KP'],['bubba','BUBBA'],['jubilee','JUBILEE'],['king_sully','KING SULLY'],['waylon','WAYLON'],['brianna','BRIANNA'],['mikey','MIKEY'],['mr_meena','MR. MEENA'],['mystery_guest','MYSTERY GUEST'],['kars','KARS']];
  global.OGBRoster=roster;
  const selectedId=()=>{
    const q=new URLSearchParams(location.search).get('character');
    const stored=localStorage.getItem('ogb.character');
    const id=q||stored||'adam';
    return roster.some(([key])=>key===id)?id:'adam';
  };
  global.OGBCharacters={
    selected(){return {id:selectedId()}},
    playerName(){return roster.find(([id])=>id===selectedId())?.[1]||'ADAM'},
    byId(id){
      if(!roster.some(([key])=>key===id)) return null;
      return {id,model:`/api/arcade-assets/character/${encodeURIComponent(id)}`};
    },
    recordResult(game,score,result){
      try{localStorage.setItem(`ogb.result.${game}`,JSON.stringify({score,result,at:Date.now()}))}catch{}
    }
  };
  global.OGBPartyMedia=global.OGBPartyMedia||{sync(){},attachPeer(){}};
})(globalThis);
