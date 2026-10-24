(()=>{'use strict';
const F=[['nameBn','নাম (বাংলা)'],['nameEn','Name (English)'],['dob','জন্ম তারিখ'],['fatherName','পিতার নাম (বাংলা)'],['motherName','মাতার নাম (বাংলা)'],['address','ঠিকানা (বাংলা)'],['birthPlace','জন্মস্থান']];
const root=document.createElement('section');root.style.cssText='padding:12px;background:#162c42;border:1px solid #48617a;border-radius:10px;margin:12px 0';
root.innerHTML='<h3 style="margin:0 0 8px">Format → HTML Auto Fill (৭টি ঘর)</h3><textarea id="format-source" rows="9" style="width:100%;box-sizing:border-box;background:#0c1929;color:white;border:1px solid #52627b;border-radius:6px;padding:8px" placeholder="বাংলা/ইংরেজি ফরম্যাট এখানে পেস্ট করুন"></textarea><div style="display:flex;gap:7px;flex-wrap:wrap;margin:8px 0"><button type="button" id="format-parse">Normal Parse</button><button type="button" id="format-fill">Apply to HTML</button></div><div id="format-status" style="font-size:12px;margin:8px 0"></div><div id="format-fields"></div>';
const addon=document.getElementById('pdf-addon');if(addon)addon.parentNode.insertBefore(root,addon);else document.querySelector('aside')?.append(root);
const el=id=>document.getElementById(id), status=s=>el('format-status').textContent=s;
const fields=el('format-fields');for(const [k,label] of F){const wrapper=document.createElement('label');wrapper.style.cssText='display:block;margin:7px 0;font-size:12px';wrapper.textContent=label;const inp=document.createElement('textarea');inp.rows=k==='address'?3:1;inp.id='format-'+k;inp.style.cssText='display:block;width:100%;box-sizing:border-box;margin-top:3px;background:#0c1929;color:white;border:1px solid #52627b;border-radius:5px;padding:6px';wrapper.append(inp);fields.append(wrapper)}
const BN='০১২৩৪৫৬৭৮৯', EN='0123456789';
const norm=s=>String(s||'').replace(/[০-৯]/g,d=>EN[BN.indexOf(d)]).replace(/\u09DF/g,'য়').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[\u00A0\u202F]/g,' ').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();
const linesOf=s=>norm(s).split('\n').map(x=>x.trim()).filter(Boolean);
const hasBn=s=>/[\u0980-\u09FF]/.test(s||'');
const clean=s=>String(s||'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/^[^\p{L}\p{N}]*/u,'').replace(/^(?:বাংলায়|বাংলায়|বাংলা|নাম\s*\(বাংলা(?:য়|য়)?\)|নাম\s*বাংলা(?:য়|য়)?|নাম)\s*[ঃ:：=\-–—]?\s*/iu,'').replace(/\s*(?:\(|\[)?\s*(?:ইংরেজি|ইংরেজী|english|en)\s*(?:\)|\])?\s*[:：=\-].*$/iu,'').replace(/\([^)]*[A-Za-z][^)]*\)/g,' ').replace(/[“”"'`]/g,' ').replace(/^[\s:：=\-–—•★♦️🗣️📋]+|[\s:：=\-–—,，.。]+$/g,'').replace(/\s+/g,' ').trim();
const isBnName=s=>{const v=clean(s);if(!v||!hasBn(v)||/\d/.test(norm(v))||v.length>80)return false;if(/^(?:নাম|জন্ম|জন্ম তারিখ|তারিখ|পিতা|পিতার নাম|মাতা|মাতার নাম|বাবা|বাবার নাম|মা|মায়ের নাম|ঠিকানা|স্থায়ী ঠিকানা|লিঙ্গ|জাতীয়তা|জন্মস্থান|বিভাগ|জেলা|উপজেলা|ইউনিয়ন|ওয়ার্ড|ডাকঘর|গ্রাম|পোস্ট|মোবাইল|এনআইডি|নিবন্ধন|তথ্য|পিতার তথ্য|মাতার তথ্য)$/iu.test(v))return false;return v.replace(/[^\u0980-\u09FF]/g,'').length>=2};
const isEnName=s=>{const v=String(s||'').replace(/[“”"'`]/g,'').trim();return /^[A-Za-z][A-Za-z .'-]{1,80}$/.test(v)&&!/\d/.test(v)&&!/^(?:name|english|gender|female|male|birth|date|address|village|place|father|mother|permanent|bangladesh)$/i.test(v)};
const stripEnglishTail=s=>String(s||'').replace(/\s*\([^)]*[A-Za-z][^)]*\)/g,'').replace(/\s+[A-Za-z][A-Za-z .'-]{1,80}$/,'').trim();
const dateParse=s=>{
 const v=norm(s).toLowerCase().replace(/[()\[\]]/g,' ');
 const monthShort=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 const makeDate=(day,month,year)=>{
  day=Number(day);month=Number(month);year=Number(year);
  if(year<1000||year>9999||month<1||month>12||day<1||day>31)return '';
  const dt=new Date(Date.UTC(year,month-1,day));
  if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day)return '';
  return `${String(day).padStart(2,'0')} ${monthShort[month-1]} ${year}`;
 };
 const m=v.match(/(\d{1,4})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{2,4})/);
 if(m){let a=+m[1],b=+m[2],c=+m[3];if(a>=1000)return makeDate(c,b,a);if(c<100)return '';return makeDate(a,b,c)}
 const months={january:1,jan:1,february:2,feb:2,march:3,mar:3,april:4,apr:4,may:5,june:6,jun:6,july:7,jul:7,august:8,aug:8,september:9,sep:9,sept:9,october:10,oct:10,november:11,nov:11,december:12,dec:12,'জানুয়ারি':1,'জানুয়ারি':1,'ফেব্রুয়ারি':2,'ফেব্রুয়ারি':2,'মার্চ':3,'এপ্রিল':4,'মে':5,'জুন':6,'জুলাই':7,'আগস্ট':8,'সেপ্টেম্বর':9,'অক্টোবর':10,'নভেম্বর':11,'ডিসেম্বর':12};
 const m2=v.match(/(\d{1,2})\s+([a-z]+|[\u0980-\u09FF]+)\s+(\d{4})/i);
 if(m2&&months[m2[2]])return makeDate(m2[1],months[m2[2]],m2[3]);
 return '';
};
const onlyBanglaAddress=s=>String(s||'')
 .replace(/\([^)]*[A-Za-z][^)]*\)/g,' ')
 .replace(/\b(?:address|permanent|present|village|road|post office|post|office|union|ward|upazila|district|division|bangladesh|village|birthplace)\b/gi,' ')
 .replace(/[A-Za-z]+(?:[ '-][A-Za-z]+)*/g,' ')
 .replace(/[|/\\]+/g,' ')
 .replace(/[,:;，；]+/g,', ')
 .replace(/\s*,\s*/g,', ')
 .replace(/(?:,\s*){2,}/g,', ')
 .replace(/^\s*[,.-]+|[,.-]+\s*$/g,'')
 .replace(/\s+/g,' ').trim();
function valueAfter(lines,i,kind){
 const line=lines[i]||'';
 const colon=line.search(/[ঃ:：=]/);
 let v=colon>=0?line.slice(colon+1):'';
 v=v.replace(/^\s*(?:বাংলা(?:য়|য়)?|বাংলায়|বাংলায়|bangla|ইংরেজি|ইংরেজী|english|en)\s*[ঃ:：=]\s*/iu,'').trim();
 if(kind==='bn'){v=stripEnglishTail(v);if(isBnName(v))return clean(v)}
 if(kind==='en'&&isEnName(v))return v;
 for(let j=i+1;j<Math.min(lines.length,i+4);j++){
  if(/(?:জন্ম|লিঙ্গ|ঠিকানা|date|birth|পিতার তথ্য|মাতার তথ্য)/iu.test(lines[j]))continue;
  if(kind==='bn'&&isBnName(lines[j]))return clean(lines[j]);
  if(kind==='en'&&isEnName(lines[j]))return lines[j].trim();
 }
 return '';
}
function parse(raw){
 const lines=linesOf(raw), joined=lines.join('\n'), o={};
 const label=(re,kind)=>{for(let i=0;i<lines.length;i++){if(re.test(lines[i])){const v=valueAfter(lines,i,kind);if(v)return v}}return ''};
 const parentStart=lines.findIndex(x=>/(?:পিতার|পিতা|বাবার|বাবা|father|মাতার|মাতা|মায়ের|mother)(?:\s|:|ঃ|$)/iu.test(x));
 const childEnd=parentStart<0?lines.length:parentStart;
 // Explicit child Bengali name labels, only before parent section.
 const childLabel=/^(?:[★*•▪️📋🗣️💠]\s*)?(?:নাম\s*(?:\(\s*বাংলা(?:য়|য়)?\s*\)|বাংলা(?:য়|য়)?|বাংলায়|বাংলায়)?|বাংলা\s*নাম|নামের\s*(?:প্রথম|শেষ)\s*অংশ\s*\(\s*বাংলা(?:য়|য়)?\s*\))\s*[ঃ:：=\-–—]\s*/iu;
 for(let i=0;i<childEnd;i++){
  if(childLabel.test(lines[i])&&!/(?:ইংরেজ|english)/iu.test(lines[i])){
   const v=valueAfter(lines,i,'bn');if(v){o.nameBn=v;break}
  }
 }
 if(!o.nameBn){
  for(let i=0;i<childEnd;i++){
   if(isBnName(lines[i])&&!/(?:পিতার|মাতার|father|mother|ঠিকানা|জন্মস্থান)/iu.test(lines[i])){
    if(dateParse(lines.slice(i+1,Math.min(childEnd,i+4)).join(' '))||i<childEnd-1){o.nameBn=clean(lines[i]);break}
   }
  }
 }
 // English child name: explicit label first, then Bengali/English adjacent pair before DOB.
 for(let i=0;i<childEnd;i++){
  if(/^(?:name|name\s*english|english\s*name|name\s*in\s*english|english|en|নাম\s*ইংরেজি(?:তে|তেঃ)?|ইংরেজি\s*নাম|ইংরেজি|ইংরেজী)\s*[:：=ঃ\-–—]/iu.test(lines[i])||/(?:নাম\s*ইংরেজি|ইংরেজী|ইংরেজি)\s*[ঃ:：=\-–—]/iu.test(lines[i])){
   const v=valueAfter(lines,i,'en');if(v){o.nameEn=v.toUpperCase();break}
  }
 }
 const dobLabel=/(?:জন্ম\s*তারিখ|জন্মতারিখ|জন্ম-তারিখ|তারিখে?\s*জন্ম|date\s*of\s*birth|date\s*of\s*burth|birth\s*date|\bdob\b|জন্মদিন)/iu;
 for(let i=0;i<childEnd;i++){if(dobLabel.test(lines[i])){const d=dateParse(lines[i])||dateParse(lines.slice(i,i+2).join(' '));if(d){o.dob=d;break}}}
 if(!o.dob){for(let i=0;i<childEnd;i++){const d=dateParse(lines[i]);if(d){o.dob=d;break}}}
 // Unlabelled child name pairing: Bengali name followed by English name before DOB.
 if(!o.nameEn){
  const dobIndex=lines.findIndex(x=>dateParse(x));
  const limit=dobIndex>=0?dobIndex:childEnd;
  for(let i=0;i<limit;i++)if(isBnName(lines[i])){for(let j=i+1;j<=Math.min(limit-1,i+2);j++)if(isEnName(lines[j])){o.nameEn=lines[j].toUpperCase();break}if(o.nameEn)break}
 }
 // Parent section-aware parsing prevents parent names from being mistaken for child.
 let role='';
 for(let i=Math.max(0,parentStart);parentStart>=0&&i<lines.length;i++){
  const line=lines[i];
  if(/(?:পিতার|পিতা|বাবার|বাবা|father)/iu.test(line))role='father';
  else if(/(?:মাতার|মাতা|মায়ের|মা|mother)/iu.test(line))role='mother';
  if(role&&/(?:নাম|name)/iu.test(line)&&!/(?:ইংরেজ|english)/iu.test(line)){
   const v=valueAfter(lines,i,'bn');if(v&&!o[role==='father'?'fatherName':'motherName'])o[role==='father'?'fatherName':'motherName']=v;
  }
  if(role==='father'&&!o.fatherName&&/^(?:পিতার\s*নাম|পিতা\s*নাম|বাবার\s*নাম|পিতা|বাবা|father(?:'s)?\s*name)\s*[ঃ:：=\-–—]/iu.test(line))o.fatherName=valueAfter(lines,i,'bn');
  if(role==='mother'&&!o.motherName&&/^(?:মাতার\s*নাম|মাতা\s*নাম|মায়ের\s*নাম|মা(?:য়ের)?\s*নাম|mother(?:'s)?\s*name)\s*[ঃ:：=\-–—]/iu.test(line))o.motherName=valueAfter(lines,i,'bn');
 }
 // Direct parent labels as fallback.
 if(!o.fatherName)o.fatherName=label(/(?:পিতার নাম|পিতা নাম|বাবার নাম|father(?:'s)? name)\s*[ঃ:：=\-–—]/iu,'bn');
 if(!o.motherName)o.motherName=label(/(?:মাতার নাম|মাতা নাম|মায়ের নাম|মায়ের নাম|mother(?:'s)? name)\s*[ঃ:：=\-–—]/iu,'bn');
 // Address and birthplace are intentionally captured as supplied, without guessing or rewriting components.
 const addrLabel=/^(?:ঠিকানা(?:\s*\(বাংলা\))?|স্থায়ী ঠিকানা|স্থায়ী ঠিকানা|বর্তমান ঠিকানা|বর্তমান\s*ঠিকানা|গ্রাম\s*\/\s*রাস্তা|address|permanent address|present address|ঠিকানা ও ডাকঘর|ঠিকানা\s*ও\s*গ্রাম)\s*[ঃ:：=\-–—]?\s*(.*)$/iu;
 const placeLabel=/^(?:জন্মস্থান|জন্ম\s*স্থান|জন্মের স্থান|জন্মস্থান ও ঠিকানা|place\s*of\s*birth|birthplace|birth place)\s*[ঃ:：=\-–—]?\s*(.*)$/iu;
 const stopLabel=/^(?:নাম|name|english|en|জন্ম\s*তারিখ|জন্মতারিখ|date of birth|dob|লিঙ্গ|gender|পিতার|পিতা|বাবার|father|মাতার|মাতা|মায়ের|mother|জাতীয়তা|মোবাইল|nid|brn|নিবন্ধন)\b/iu;
 const extractBlock=(re)=>{for(let i=0;i<lines.length;i++){const m=lines[i].match(re);if(!m)continue;const parts=[];if(m[1])parts.push(m[1].trim());for(let j=i+1;j<lines.length;j++){if(stopLabel.test(lines[j])||addrLabel.test(lines[j])||placeLabel.test(lines[j]))break; if(parts.length>=4)break; if(lines[j].length>160)break; parts.push(lines[j].trim())}return parts.filter(Boolean).join(', ')}return ''};
 o.address=onlyBanglaAddress(extractBlock(addrLabel));
 o.birthPlace=extractBlock(placeLabel);
 // Compact single-line format: নাম, পিতা, মাতা.
 const compact=joined.match(/(?:^|\n)\s*নাম\s*[-:：]\s*([^,\n]+?)\s*,\s*পিতা\s*[-:：]\s*([^,\n]+?)\s*,\s*মাতা\s*[-:：]\s*([^,\n]+?)(?:\s*,|\n|$)/iu);
 if(compact){if(!o.nameBn)o.nameBn=clean(compact[1]);if(!o.fatherName)o.fatherName=clean(compact[2]);if(!o.motherName)o.motherName=clean(compact[3])}
 if(o.nameEn)o.nameEn=o.nameEn.toUpperCase();
 return Object.fromEntries(Object.entries(o).filter(([k,v])=>F.some(([fk])=>fk===k)&&String(v||'').trim()));
}
function write(o){for(const [k] of F)el('format-'+k).value=o[k]||''}
el('format-parse').onclick=()=>{const data=parse(el('format-source').value);write(data);status(Object.keys(data).length+'টি ফিল্ড পাওয়া গেছে। ভুল থাকলে নিচের ঘরে সংশোধন করুন।')};
el('format-fill').onclick=()=>{const data={};for(const [k] of F){const v=el('format-'+k).value.trim();if(v)data[k]=k==='nameEn'?v.toUpperCase():k==='dob'?(dateParse(v)||v):k==='address'?onlyBanglaAddress(v):v}if(!Object.keys(data).length)return status('প্রথমে Format Parse করুন বা ঘর পূরণ করুন।');
const json=el('addon-json'),fill=el('addon-fill');if(!json||!fill)return status('PDF Auto Fill module পাওয়া যায়নি।');let old={};try{old=JSON.parse(json.value||'{}')}catch(_){}json.value=JSON.stringify({...old,...data},null,2);fill.click();status('HTML-এ ৭টি নির্ধারিত ফিল্ডের ডাটা পাঠানো হয়েছে। Preview যাচাই করুন।')};
window.VisualFormatParser={parse};
})();
