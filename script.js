(function(){
  // estrelinhas de fundo
  const estrelasEl = document.getElementById('estrelas');
  for(let i=0;i<60;i++){
    const s = document.createElement('div');
    s.className='estrela';
    s.style.left = Math.random()*100+'vw';
    s.style.top = Math.random()*100+'vh';
    s.style.animationDelay = (Math.random()*3)+'s';
    estrelasEl.appendChild(s);
  }

  function irPara(id){
    document.querySelectorAll('.cena').forEach(c=>c.classList.remove('ativa'));
    document.getElementById(id).classList.add('ativa');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  // ---- botão NÃO fica perto do "Continuar", respirando de leve, e só desvia quando o mouse chega bem perto ----
  const btnNao = document.getElementById('btn-nao');
  let tentativas = 0;

  // deslocamento total aplicado (respiração + desvio), sempre em relação à posição original do botão
  let offX = 0, offY = 0;
  // deslocamento "de fuga" que decai sozinho com o tempo, puxando o botão de volta pra perto do Sim
  let fugaX = 0, fugaY = 0;

  const RAIO_PERIGO = 130;    // distância do mouse que ativa o desvio
  const FORCA_DESVIO = 90;    // o quanto ele empurra pra longe do cursor a cada aproximação
  const LIMITE_FUGA = 150;    // o quanto no máximo ele pode se afastar da posição original (nunca some da tela)

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  let ultimoTempo = performance.now();
  function loop(agora){
    const dt = Math.min(agora - ultimoTempo, 50);
    ultimoTempo = agora;

    // a fuga vai relaxando aos poucos, puxando o botão de volta pra perto do Sim
    const decaimento = Math.pow(0.94, dt/16);
    fugaX *= decaimento;
    fugaY *= decaimento;

    // uma respiradinha leve, só pra nunca ficar 100% parado
    const t = agora/1000;
    const respiroX = Math.sin(t*1.1)*3;
    const respiroY = Math.cos(t*1.4)*2.5;

    offX = clamp(fugaX, -LIMITE_FUGA, LIMITE_FUGA) + respiroX;
    offY = clamp(fugaY, -LIMITE_FUGA, LIMITE_FUGA) + respiroY;

    btnNao.style.transform = `translate(${offX.toFixed(1)}px, ${offY.toFixed(1)}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function desviarDe(mouseX, mouseY){
    const rect = btnNao.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    let dx = cx - mouseX;
    let dy = cy - mouseY;
    const dist = Math.hypot(dx, dy) || 1;
    if(dist > RAIO_PERIGO) return false;

    // empurra o botão na direção oposta ao mouse, mais forte quanto mais perto ele chegou
    const intensidade = 1 - (dist / RAIO_PERIGO);
    dx /= dist; dy /= dist;
    fugaX += dx * FORCA_DESVIO * (0.5 + intensidade);
    fugaY += dy * FORCA_DESVIO * (0.5 + intensidade);
    return true;
  }

  function registrarTentativa(){
    tentativas++;
    if(tentativas >= 6){
      btnNao.style.opacity = String(Math.max(0.95 - tentativas*0.05, 0.5));
    }
  }

  document.addEventListener('mousemove', function(e){
    const fugiu = desviarDe(e.clientX, e.clientY);
    if(fugiu) registrarTentativa();
  });

  btnNao.addEventListener('click', function(e){
    e.preventDefault();
    // um empurrão mais forte, numa direção aleatória, mas sem sair muito perto do Sim
    const ang = Math.random()*Math.PI*2;
    fugaX += Math.cos(ang)*FORCA_DESVIO*1.6;
    fugaY += Math.sin(ang)*FORCA_DESVIO*1.6;
    registrarTentativa();
  });

  btnNao.addEventListener('touchstart', function(e){
    e.preventDefault();
    const toque = e.touches[0];
    if(toque) desviarDe(toque.clientX, toque.clientY);
    registrarTentativa();
  }, {passive:false});

  document.getElementById('btn-sim').addEventListener('click', function(){
    dispararConfete();
    irPara('cena-cardapio');
  });

  // ---- cardápio ----
  let comidaEscolhida = null;
  const cards = document.querySelectorAll('.card-comida');
  const btnContinuarComida = document.getElementById('btn-continuar-comida');
  cards.forEach(card=>{
    card.addEventListener('click', ()=>{
      cards.forEach(c=>c.classList.remove('selecionado'));
      card.classList.add('selecionado');
      comidaEscolhida = card.dataset.comida;
      btnContinuarComida.disabled = false;
    });
  });
  btnContinuarComida.addEventListener('click', ()=> irPara('cena-datahora'));
  document.getElementById('voltar-1').addEventListener('click', ()=> irPara('cena-convite'));

  // ---- data e hora ----
  const inputData = document.getElementById('input-data');
  const inputHora = document.getElementById('input-hora');
  const btnConfirmar = document.getElementById('btn-confirmar');

  const hoje = new Date();
  inputData.min = hoje.toISOString().split('T')[0];

  function validarDataHora(){
    btnConfirmar.disabled = !(inputData.value && inputHora.value);
  }
  inputData.addEventListener('input', validarDataHora);
  inputHora.addEventListener('input', validarDataHora);

  document.getElementById('voltar-2').addEventListener('click', ()=> irPara('cena-cardapio'));

  btnConfirmar.addEventListener('click', function(){
    document.getElementById('resumo-comida').textContent = comidaEscolhida || '—';

    const [ano,mes,dia] = inputData.value.split('-');
    const dataObj = new Date(ano, mes-1, dia);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
    document.getElementById('resumo-data').textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

    document.getElementById('resumo-hora').textContent = inputHora.value;

    dispararConfete();
    irPara('cena-confirmacao');
  });

  // ---- confete ----
  function dispararConfete(){
    const cores = ['#ee9ec4','#f6c3dd','#e57eb0','#3d0f1e','#fbeef1'];
    for(let i=0;i<40;i++){
      const c = document.createElement('div');
      c.className='confete';
      const tam = 6 + Math.random()*6;
      c.style.width = tam+'px';
      c.style.height = (tam*0.4)+'px';
      c.style.left = Math.random()*100+'vw';
      c.style.background = cores[Math.floor(Math.random()*cores.length)];
      c.style.animationDuration = (1.8 + Math.random()*1.4)+'s';
      document.body.appendChild(c);
      setTimeout(()=>c.remove(), 3400);
    }
  }
})();