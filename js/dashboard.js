var catgGraf;
var grafVendas;

function atualizarTotal() {
    var atz = document.getElementsByClassName('totalProdutos')[0];
    var titulo = atz.querySelector('h3')

    titulo.innerHTML = `Total de produtos:<br><span class="destaqueEstoque">${produtos.length}</span>`;
}
atualizarTotal();

function atualizarUnidades() {
    var totalU = 0;

    for (var i=0;i<produtos.length;i++) {
        totalU += Number(produtos[i].quantidade);
    }
    var atzU = document.getElementsByClassName('estoqueUnidades')[0];
    var tituloUnidades = atzU.querySelector('h3');

    tituloUnidades.innerHTML = `Unidades em Estoque:<br><span class="destaqueEstoque">${totalU}</span>`
}
atualizarUnidades();

function atualizarEstoqueBaixo() {
    var nomes = []

    for (var i=0;i<produtos.length;i++) {
        if (Number(produtos[i].quantidade) <= 5) {
            nomes.push(produtos[i].nome);
        }
    }
    var tituloEstBx = document.getElementsByClassName('estoqueBaixo')[0];
    tituloEstBx.classList.toggle('alerta', nomes.length > 0);
    var titEst = tituloEstBx.querySelector('h3');

    var botao = document.getElementById('verMaisEstoque');
    if (nomes.length === 0) {
        titEst.innerHTML = 'Estoque baixo:<br>nenhum produto'
    } else {
        titEst.innerHTML = 'Estoque baixo:<br>';
        titEst.append(nomes.slice(0, 1).join(', '));
        if (nomes.length > 1) titEst.append('... ');
    }
    botao.hidden = nomes.length <= 1;
    botao.onclick = function () {
    window.alert('Outros produtos com estoque baixo:\n\n' + nomes.slice(1).join('\n'));
    };
}
atualizarEstoqueBaixo();

function atualizarValorEstoque() {
    var total = 0;

    for (var i=0;i<produtos.length;i++) {
        total += Number(produtos[i].preco) * Number(produtos[i].quantidade);
    }

    var atzV = document.getElementsByClassName('estoqueTotal')[0];
    var tituloValor = atzV.querySelector('h3');

    tituloValor.innerHTML = `Valor Total em Estoque:<br><span class="destaqueEstoque">${total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>`
}
atualizarValorEstoque();

function mostrarGrafRosc() {
    var categorias = {};

    for (var i = 0; i < produtos.length; i++) {
        var nome = produtos[i].categoria || 'Outros';
        if (nome === 'Escritorio') nome = 'Escritório';
        if (!categorias[nome]) categorias[nome] = 0;
        categorias[nome]++;
    }

    var estilo = getComputedStyle(document.getElementById('inicio'));
    var cores = estilo.getPropertyValue('--cores-rosca').trim().split(/\s+/);

    if (catgGraf) catgGraf.destroy();
    catgGraf = new Chart(document.getElementById('graficoCategorias'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(categorias),
            datasets: [{
                data: Object.values(categorias),
                backgroundColor: cores
            }]
        },
        options: { plugins: { legend: { position: estilo.getPropertyValue('--posicao-legenda').trim() || Chart.defaults.plugins.legend.position } } }
    });
}

function mostrarVendas() {
    if (typeof Chart === 'undefined') return;
    var mes = document.getElementById('mesVendas').value;
    var vendas = {};

    for (var i = 0; i < movimentos.length; i++) {
        var m = movimentos[i];
        if (m.tipo === 'Saída' && m.data.slice(0, 7) === mes) {
            if (!vendas[m.id]) vendas[m.id] = {nome: m.nome, total: 0};
            vendas[m.id].nome = m.nome;
            vendas[m.id].total += m.quantidade;
        }
    }

    var produtosVendidos = Object.values(vendas);
    produtosVendidos.sort((a, b) => b.total - a.total);

    var nomes = [];
    var quantidades = [];
    for (var i = 0; i < produtosVendidos.length && i < 5; i++) {
        nomes.push(produtosVendidos[i].nome);
        quantidades.push(produtosVendidos[i].total);
    }

    document.getElementById('semVendas').hidden = nomes.length > 0;
    var estilo = getComputedStyle(document.getElementById('inicio'));
    if (grafVendas) grafVendas.destroy();
    grafVendas = new Chart(document.getElementById('graficoVendas'), {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [{label: 'Unidades vendidas', data: quantidades, backgroundColor: estilo.getPropertyValue('--cor-colunas').trim()}]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function mostrarHistorico() {
    var dia = document.getElementById('diaHistorico').value;
    var lista = document.getElementById('listaHistorico');
    lista.replaceChildren();
    for (var i = movimentos.length - 1; i >= 0; i--) {
        var m = movimentos[i];
        if (m.data !== dia) continue;
        var linha = document.createElement('li');
        linha.textContent = m.hora + ' · ' + m.tipo + ' · ' + m.nome + ' (' + m.codigo + ') · ' + m.quantidade + ' un.';
        lista.append(linha);
    }
    if (!lista.children.length) {
        var aviso = document.createElement('li');
        aviso.textContent = 'Nenhuma movimentação registrada neste dia.';
        lista.append(aviso);
    }
}

function atualizarDashboard() {
    if (document.getElementById('inicio').hidden) return;
    mostrarHistorico();
    document.getElementById('avisoGraficos').hidden = typeof Chart !== 'undefined';
    if (typeof Chart === 'undefined') return;

    var estilo = getComputedStyle(document.getElementById('graficoCategorias'));
    Chart.defaults.font.family = estilo.fontFamily;
    Chart.defaults.font.size = parseFloat(estilo.fontSize);
    Chart.defaults.color = estilo.color;
    mostrarGrafRosc();
    mostrarVendas();
}

