'use strict';
const $ = id => document.getElementById(id);
const modes = {
 water:{title:'Make room for clear sound.',text:'A gentle sweep of low tones, with short pauses. Results vary by speaker and trapped moisture.',button:'Start water tones'},
 manual:{title:'Find your own frequency.',text:'A steady sine tone from 100 to 1,000 Hz. No frequency is a guaranteed cleaning setting.',button:'Start custom tone'},
 test:{title:'Listen for the difference.',text:'A short 250, 500, and 1,000 Hz listening test. Listen before and after care; this does not diagnose damage.',button:'Start sound test'}
};
let mode='water', running=false, starting=false, timer=null, deadline=null, total=30, wake=null, token=0, deferredInstall=null, audioURL=null;
const player = document.createElement('audio');
player.preload='auto'; player.setAttribute('playsinline',''); player.disableRemotePlayback=true;
document.body.appendChild(player);
function idle(){ $('readout').innerHTML=(mode==='test'?9:$('duration').value)+'<span>s</span>'; $('dialCaption').textContent='READY WHEN YOU ARE'; $('progress').style.strokeDashoffset='0'; }
function controls(){document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=running||starting);['duration','frequency','level','ready'].forEach(id=>$(id).disabled=running||starting);$('start').disabled=starting||(!running&&!$('ready').checked);}
function modeChange(next){mode=next;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('modeTitle').textContent=modes[mode].title;$('modeText').textContent=modes[mode].text;$('start').textContent='▶ '+modes[mode].button;$('frequencyRow').hidden=mode!=='manual';$('durationRow').hidden=mode==='test';idle();}
function history(){try{const item=JSON.parse(localStorage.getItem('clearwave-last'));if(item&&modes[item.mode]&&typeof item.seconds==='number'&&Number.isFinite(Date.parse(item.at))){$('lastSession').textContent=`${modes[item.mode].button.replace('Start ','')} · ${item.seconds}s · ${new Date(item.at).toLocaleString()}`;$('clearHistory').hidden=false;return;}}catch{}$('lastSession').textContent='A fresh start. No sessions yet.';$('clearHistory').hidden=true;}
function stop(reason='Session stopped.',completed=false){
 token++; starting=false; running=false; clearInterval(timer); clearTimeout(deadline);
 player.onended=null; player.onerror=null; player.onpause=null;
 player.pause(); player.removeAttribute('src'); player.load();
 if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null;}
 if(wake){wake.release().catch(()=>{});wake=null;}
 $('dial').classList.remove('running');$('badge').textContent='● READY';
 $('start').classList.remove('stop');$('start').textContent='▶ '+modes[mode].button;
 controls();idle();$('message').textContent=reason;
 if(completed){$('dialCaption').textContent='SESSION COMPLETE';try{localStorage.setItem('clearwave-last',JSON.stringify({mode,seconds:total,at:new Date().toISOString()}));}catch{}history();}
}
async function start(){
 if(running){stop();return;}if(starting||!$('ready').checked)return;
 starting=true;controls();const mine=++token;
 $('message').textContent='Starting audio…';
 try{
  // Select media playback on Safari when the Audio Session API is available.
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
  total=mode==='test'?9:Number($('duration').value);
  const hz=Number($('frequency').value);
  audioURL=URL.createObjectURL(new Blob([createToneWav(mode,total,hz,Number($('level').value)/100)],{type:'audio/wav'}));
  player.src=audioURL;player.muted=false;player.loop=false;
  player.onended=()=>{if(mine===token)stop('Session complete. Listen again; completion does not mean your phone is dry.',true);};
  player.onerror=()=>{if(mine===token)stop('Safari could not load the tone. Reload this page in Safari and try again.');};
  player.onpause=()=>{if(running&&mine===token&&!player.ended)stop('Audio interrupted. Tap Start to begin again.');};
  // Call play directly in the tap handler, before any await, to retain user activation.
  const playResult=player.play();
  deadline=setTimeout(()=>{if(mine===token)stop('Audio did not start. Open this page directly in Safari, check media volume, and try again.');},8000);
  await playResult;
  if(mine!==token)return;
  clearTimeout(deadline);running=true;starting=false;
  $('dial').classList.add('running');$('badge').textContent='● PLAYING';
  $('start').textContent='■ Stop sound';$('start').classList.add('stop');
  $('message').textContent='Playing. Use your phone’s volume buttons to adjust sound.';controls();
  let previousTime=-1, lastAdvance=Date.now();
  const tick=()=>{
   if(!running||mine!==token)return;
   const elapsed=player.currentTime;
   if(elapsed>previousTime){previousTime=elapsed;lastAdvance=Date.now();}
   else if(Date.now()-lastAdvance>5000){stop('Audio stalled. Reload in Safari, then tap Start again.');return;}
   const audible=mode==='manual'||elapsed%3<2.35;
   $('readout').innerHTML=Math.max(0,Math.ceil(total-elapsed))+'<span>s</span>';
   $('dialCaption').textContent=Math.round(toneFrequency(mode,elapsed,hz))+' HZ · '+(audible?'PLAYING':'SHORT PAUSE');
   $('progress').style.strokeDashoffset=String(691.15*Math.min(1,elapsed/total));
  };
  tick();timer=setInterval(tick,100);
  deadline=setTimeout(()=>{if(mine===token)stop('Session ended. Listen again and allow the device to dry.');},(total+2)*1000);
  if(navigator.wakeLock)navigator.wakeLock.request('screen').then(lock=>{if(running&&mine===token)wake=lock;else lock.release().catch(()=>{});}).catch(()=>{});
 }catch(error){
  if(mine===token)stop(error.name==='NotAllowedError'?'Playback was blocked. Open the link directly in Safari and tap Start again.':'Could not play audio. Reload this page in Safari, check media volume, and try again.');
 }
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>modeChange(b.dataset.mode)));
$('duration').addEventListener('change',idle);$('frequency').addEventListener('input',()=>{$('hz').textContent=$('frequency').value+' Hz';});$('level').addEventListener('input',()=>{$('levelLabel').textContent=$('level').value+'%';});$('ready').addEventListener('change',controls);$('start').addEventListener('click',start);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||starting))stop('Stopped because the screen was hidden. Keep Clearwave open during playback.');});window.addEventListener('pagehide',()=>{if(running||starting)stop();});
$('clearHistory').addEventListener('click',()=>{try{localStorage.removeItem('clearwave-last');}catch{}history();});
$('dustOpen').addEventListener('click',()=>{if(running||starting)stop();$('dustDialog').showModal();});document.querySelectorAll('dialog .close,dialog .close-guide').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;});$('install').addEventListener('click',async()=>{if(running||starting)stop();if(deferredInstall){await deferredInstall.prompt();deferredInstall=null;}else $('installDialog').showModal();});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));history();controls();idle();
