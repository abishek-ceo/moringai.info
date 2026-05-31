/* ═══════════════════════════════════════════════════════════
   MORINGAI — FULL SITE JS EFFECTS
   Covers: Particles · Ripple · Confetti · Count Bounce ·
           Scroll Reveal · Typed Hero · Cursor Glow
═══════════════════════════════════════════════════════════ */

// ── 1. HERO FLOATING PARTICLES ────────────────────────────
(function(){
  var hero = document.querySelector('.hero');
  if (!hero) return;
  for (var i = 0; i < 24; i++) {
    (function(){
      var d = document.createElement('div');
      d.className = 'hero-particle';
      var size = Math.random()*12+4;
      d.style.cssText = [
        'width:'+size+'px','height:'+size+'px',
        'left:'+(Math.random()*100)+'%',
        'top:'+(Math.random()*100)+'%',
        'animation-duration:'+(Math.random()*7+4)+'s',
        'animation-delay:'+(Math.random()*6)+'s'
      ].join(';');
      hero.appendChild(d);
    })();
  }
})();

// ── 2. RIPPLE ON ANY BUTTON CLICK ─────────────────────────
document.addEventListener('click', function(e){
  var btn = e.target.closest('button, .btn-primary, .btn-outline, .filter-btn, .variant-btn');
  if (!btn) return;
  var existing = btn.style.position;
  if (!existing || existing === 'static') btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  var r = document.createElement('span');
  r.className = 'ripple';
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  r.style.width = r.style.height = size + 'px';
  r.style.left = (e.clientX - rect.left - size/2) + 'px';
  r.style.top  = (e.clientY - rect.top  - size/2) + 'px';
  btn.appendChild(r);
  setTimeout(function(){ r.remove(); }, 700);
});

// ── 3. CONFETTI BURST ON ADD-TO-CART ──────────────────────
function confettiBurst(x, y) {
  var colors = ['#2d6a4f','#52b788','#b7e4c7','#f4a261','#e63946','#f0c030','#40916c','#d8f3dc'];
  for (var i = 0; i < 28; i++) {
    (function(i){
      var el = document.createElement('div');
      var size = Math.random()*9+3;
      var angle = Math.random()*360;
      var dist  = Math.random()*110+50;
      el.style.cssText = [
        'position:fixed','left:'+x+'px','top:'+y+'px',
        'width:'+size+'px','height:'+size+'px',
        'background:'+colors[i%colors.length],
        'border-radius:'+(Math.random()>0.5?'50%':'4px'),
        'pointer-events:none','z-index:99999',
        'transition:transform 0.8s ease-out, opacity 0.8s ease-out',
        'opacity:1'
      ].join(';');
      document.body.appendChild(el);
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          var rad = angle * Math.PI/180;
          el.style.transform = 'translate('+Math.cos(rad)*dist+'px,'+Math.sin(rad)*dist+'px) rotate('+(Math.random()*540)+'deg) scale(0)';
          el.style.opacity = '0';
          setTimeout(function(){ el.remove(); }, 900);
        });
      });
    })(i);
  }
}
document.addEventListener('click', function(e){
  var btn = e.target.closest('.add-to-cart, .cart-upsell-btn');
  if (!btn) return;
  confettiBurst(e.clientX, e.clientY);
});

// ── 4. CART COUNT BOUNCE ───────────────────────────────────
(function(){
  var orig = window.updateCartUI;
  if (!orig) return;
  window.updateCartUI = function() {
    orig();
    ['cartCount'].forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('cart-count-bump');
      void el.offsetWidth;
      el.classList.add('cart-count-bump');
    });
  };
})();

// ── 5. INTERSECTION OBSERVER — SCROLL REVEAL ──────────────
(function(){
  var targets = document.querySelectorAll(
    '.feature-card, .testimonial-card, .blog-card, '
   +'.about-metric, .nutrition-stat, .timeline-item, '
   +'.contact-item, .footer-grid > *'
  );
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function(el){ el.style.opacity='1'; el.style.transform='none'; });
    return;
  }
  var seen = new Set();
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting && !seen.has(entry.target)) {
        seen.add(entry.target);
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(function(el){
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    observer.observe(el);
  });
})();

// ── 6. HERO TYPED TEXT EFFECT ──────────────────────────────
(function(){
  var span = document.querySelector('.hero h1 span');
  if (!span) return;
  var words = ['Moringa', 'Murungai', 'Wellness', 'Goodness', 'Moringa'];
  var wi = 0, ci = 0, deleting = false;
  function tick() {
    var word = words[wi];
    if (deleting) {
      span.textContent = word.substring(0, ci--);
      if (ci < 0) { deleting = false; wi = (wi+1) % words.length; ci = 0; setTimeout(tick, 400); return; }
      setTimeout(tick, 60);
    } else {
      span.textContent = word.substring(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(tick, 1800); return; }
      setTimeout(tick, 100);
    }
  }
  setTimeout(tick, 1500);
})();

// ── 7. FEATURE ICON SPARKLE ON HOVER ──────────────────────
document.querySelectorAll('.feature-card').forEach(function(card){
  card.addEventListener('mouseenter', function(){
    var icon = card.querySelector('.feature-icon');
    if (!icon) return;
    var sparks = 6;
    for (var i = 0; i < sparks; i++) {
      (function(i){
        var s = document.createElement('div');
        var angle = (360/sparks)*i;
        s.style.cssText = [
          'position:absolute','width:6px','height:6px',
          'background:#52b788','border-radius:50%',
          'pointer-events:none','z-index:10',
          'top:50%','left:50%',
          'transition:transform 0.5s ease, opacity 0.5s ease',
          'opacity:1'
        ].join(';');
        icon.style.position = 'relative';
        icon.style.overflow = 'visible';
        icon.appendChild(s);
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            var rad = angle * Math.PI/180;
            s.style.transform = 'translate('+Math.cos(rad)*32+'px,'+Math.sin(rad)*32+'px) scale(0)';
            s.style.opacity = '0';
            setTimeout(function(){ s.remove(); }, 600);
          });
        });
      })(i);
    }
  });
});

// ── 8. SMOOTH COUNTER ANIMATION FOR STATS ─────────────────
function animateCounter(el, target, duration) {
  var start = 0, startTime = null;
  var suffix = target.replace(/[0-9,+.]/g,'');
  var num = parseFloat(target.replace(/[^0-9.]/g,''));
  function step(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime)/duration, 1);
    var val = Math.floor(progress * num);
    el.textContent = (num >= 1000 ? val.toLocaleString() : val) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}
(function(){
  var stats = document.querySelectorAll('.hero-stat strong, .about-metric strong');
  if (!('IntersectionObserver' in window)) return;
  var done = new Set();
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting && !done.has(entry.target)) {
        done.add(entry.target);
        animateCounter(entry.target, entry.target.textContent, 1400);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach(function(el){ obs.observe(el); });
})();

// ── 9. HEADER SHADOW ON SCROLL ────────────────────────────
(function(){
  var header = document.querySelector('header');
  if (!header) return;
  window.addEventListener('scroll', function(){
    if (window.scrollY > 40) {
      header.style.boxShadow = '0 4px 30px rgba(45,106,79,0.15)';
      header.style.background = 'rgba(255,255,255,0.99)';
    } else {
      header.style.boxShadow = '';
      header.style.background = '';
    }
  }, {passive:true});
})();

// ── 10. WHATSAPP FLOAT TOOLTIP WIGGLE ────────────────────
(function(){
  var wa = document.querySelector('.whatsapp-float');
  if (!wa) return;
  setInterval(function(){
    wa.style.animation = 'none';
    setTimeout(function(){ wa.style.animation = ''; }, 100);
  }, 5000);
})();

// ── 11. MOBILE BUY BAR GLOW ON SCROLL DOWN ───────────────
(function(){
  var bar = document.querySelector('.mobile-buy-bar');
  if (!bar) return;
  var last = 0;
  window.addEventListener('scroll', function(){
    var cur = window.scrollY;
    if (cur > last && cur > 200) {
      bar.style.boxShadow = '0 -4px 24px rgba(45,106,79,0.35)';
    } else {
      bar.style.boxShadow = '';
    }
    last = cur;
  }, {passive:true});
})();
