// ── HERO PARTICLES ──────────────────────────────────────
(function spawnParticles(){
  var hero = document.querySelector('.hero');
  if (!hero) return;
  for (var i = 0; i < 18; i++) {
    (function(i){
      var d = document.createElement('div');
      d.className = 'hero-particle';
      var size = Math.random()*10+5;
      d.style.cssText = [
        'width:'+size+'px',
        'height:'+size+'px',
        'left:'+(Math.random()*100)+'%',
        'top:'+(Math.random()*100)+'%',
        'animation-duration:'+(Math.random()*6+4)+'s',
        'animation-delay:'+(Math.random()*5)+'s'
      ].join(';');
      hero.appendChild(d);
    })(i);
  }
})();

// ── RIPPLE EFFECT ON ADD BUTTON ─────────────────────────
document.addEventListener('click', function(e){
  var btn = e.target.closest('.add-to-cart');
  if (!btn) return;
  btn.style.position = 'relative';
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

// ── CART COUNT BOUNCE ON UPDATE ─────────────────────────
(function(){
  var origUpdate = window.updateCartUI;
  if (!origUpdate) return;
  window.updateCartUI = function() {
    origUpdate();
    var el = document.getElementById('cartCount');
    if (el) {
      el.classList.remove('cart-count-bump');
      void el.offsetWidth; // reflow
      el.classList.add('cart-count-bump');
    }
  };
})();

// ── CONFETTI BURST ON ADD TO CART ───────────────────────
function confettiBurst(x, y) {
  var colors = ['#2d6a4f','#52b788','#b7e4c7','#f4a261','#e63946','#f0c030'];
  for (var i = 0; i < 22; i++) {
    (function(i){
      var el = document.createElement('div');
      var size = Math.random()*8+4;
      var angle = (Math.random()*360);
      var dist  = Math.random()*90+40;
      el.style.cssText = [
        'position:fixed',
        'left:'+x+'px','top:'+y+'px',
        'width:'+size+'px','height:'+size+'px',
        'background:'+colors[i%colors.length],
        'border-radius:'+(Math.random()>0.5?'50%':'3px'),
        'pointer-events:none',
        'z-index:99999',
        'transition:transform 0.7s ease-out, opacity 0.7s ease-out',
        'opacity:1'
      ].join(';');
      document.body.appendChild(el);
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          var rad = angle * Math.PI/180;
          el.style.transform = 'translate('+Math.cos(rad)*dist+'px,'+Math.sin(rad)*dist+'px) rotate('+(Math.random()*360)+'deg) scale(0)';
          el.style.opacity = '0';
          setTimeout(function(){ el.remove(); }, 800);
        });
      });
    })(i);
  }
}

// Hook confetti to add-to-cart clicks
document.addEventListener('click', function(e){
  var btn = e.target.closest('.add-to-cart');
  if (!btn) return;
  confettiBurst(e.clientX, e.clientY);
});

// ── SMOOTH SCROLL REVEAL FOR SECTIONS ──────────────────
(function(){
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.feature-card, .testimonial-card, .blog-card').forEach(function(el){
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
})();
