
/* =================== BAŞLAT =================== */
$('#meBtn').addEventListener('click',e=>openMe(e.currentTarget));
$('#menuBtn').addEventListener('click',()=>document.body.classList.toggle('nav-on'));
$('#nav').addEventListener('click',e=>{if(e.target.closest('a'))document.body.classList.remove('nav-on');});
document.addEventListener('click',e=>{if(document.body.classList.contains('nav-on')&&!e.target.closest('#sb')&&!e.target.closest('#menuBtn'))document.body.classList.remove('nav-on');});
window.addEventListener('scroll',()=>{$('#tb').classList.toggle('sc',window.scrollY>4);},{passive:true});
function syncUrl(){const x=location.hash.replace(/^#\/?/,'');if(x!==CUR){CUR=x;route();}}
window.addEventListener('hashchange',syncUrl);
window.addEventListener('popstate',syncUrl);
document.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
  const href=a.getAttribute('href');
  if(href.charAt(0)==='#'){e.preventDefault();nav(href.slice(1));return;}
  if(window.__EMBED&&/^index\.html/.test(href)){e.preventDefault();try{parent.postMessage({ak:'close',to:href.split('#')[1]||''},'*');}catch(err){}}
});
route();
})();
