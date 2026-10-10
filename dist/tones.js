'use strict';
// Generate PCM audio locally. Baking the gain into samples also works on iOS,
// where HTMLMediaElement.volume cannot reliably control system playback volume.
function toneFrequency(mode, seconds, hz) {
  if (mode === 'water') return 140 + 80 * Math.min((seconds % 3) / 2.3, 1);
  if (mode === 'test') return [250, 500, 1000][Math.min(2, Math.floor(seconds / 3))];
  return hz;
}
function createToneWav(mode, seconds, hz, level) {
  const rate = 22050, count = Math.round(rate * seconds);
  const buffer = new ArrayBuffer(44 + count * 2), view = new DataView(buffer);
  const text = (offset, str) => [...str].forEach((c,i) => view.setUint8(offset+i,c.charCodeAt(0)));
  text(0,'RIFF'); view.setUint32(4,36+count*2,true); text(8,'WAVE'); text(12,'fmt ');
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
  view.setUint32(24,rate,true); view.setUint32(28,rate*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
  text(36,'data'); view.setUint32(40,count*2,true);
  let phase=0;
  for(let i=0;i<count;i++) {
    const t=i/rate, pulse=t%3;
    let envelope=Math.min(1,t/.02,(seconds-t)/.02);
    if(mode!=='manual') envelope*=Math.max(0,Math.min(1,pulse/.02,(2.35-pulse)/.04));
    phase=(phase+2*Math.PI*toneFrequency(mode,t,hz)/rate)%(2*Math.PI);
    view.setInt16(44+i*2,Math.round(32767*level*envelope*Math.sin(phase)),true);
  }
  return buffer;
}
